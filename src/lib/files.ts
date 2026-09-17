import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import mammoth from "mammoth";
import { PDFDocument, StandardFonts } from "pdf-lib";

const execFileAsync = promisify(execFile);

export const UPLOAD_ROOT = path.join(process.cwd(), "uploads");
export const MAX_ASSIGNMENT_SIZE = 20 * 1024 * 1024; // 20 MB
export const MAX_SUBMISSION_SIZE = 20 * 1024 * 1024;

const PDF_MAGIC = Buffer.from("%PDF-");
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // docx is a zip

export type Kind = "pdf" | "docx";

/** Detect file type by extension + magic bytes (never trust the MIME type alone). */
export function detectKind(name: string, buf: Buffer): Kind | null {
  const ext = path.extname(name).toLowerCase();
  if (ext === ".pdf" && buf.subarray(0, 5).equals(PDF_MAGIC)) return "pdf";
  if (ext === ".docx" && buf.subarray(0, 4).equals(ZIP_MAGIC)) return "docx";
  return null;
}

export function safeName(original: string) {
  const base = path.basename(original).replace(/[^\w.\-а-яА-ЯёЁ ]+/g, "_").slice(0, 80);
  return `${Date.now()}-${randomBytes(4).toString("hex")}-${base}`;
}

export async function saveBuffer(subdir: string, name: string, buf: Buffer) {
  const dir = path.join(UPLOAD_ROOT, subdir);
  await fs.mkdir(dir, { recursive: true });
  const rel = path.join(subdir, name);
  await fs.writeFile(path.join(UPLOAD_ROOT, rel), buf);
  return rel;
}

export function absPath(rel: string) {
  const p = path.resolve(UPLOAD_ROOT, rel);
  if (!p.startsWith(UPLOAD_ROOT + path.sep)) throw new Error("bad path");
  return p;
}

async function findSoffice(): Promise<string | null> {
  const candidates = [
    process.env.SOFFICE_PATH,
    "/Applications/LibreOffice.app/Contents/MacOS/soffice",
    "/usr/bin/soffice",
    "/usr/bin/libreoffice",
    "/usr/local/bin/soffice",
    "/opt/homebrew/bin/soffice",
    "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
  ].filter(Boolean) as string[];
  for (const c of candidates) {
    try {
      await fs.access(c);
      return c;
    } catch {}
  }
  return null;
}

/**
 * Convert a DOCX (already stored at relDocx) to PDF next to it.
 * 1) LibreOffice headless if available (faithful rendering);
 * 2) fallback: mammoth text extraction -> simple PDF via pdf-lib.
 */
export async function convertDocxToPdf(relDocx: string): Promise<string> {
  const src = absPath(relDocx);
  const outDir = path.dirname(src);
  const target = src.replace(/\.docx$/i, ".pdf");

  const soffice = await findSoffice();
  if (soffice) {
    try {
      await execFileAsync(soffice, ["--headless", "--convert-to", "pdf", "--outdir", outDir, src], {
        timeout: 90_000,
      });
      await fs.access(target);
      return path.relative(UPLOAD_ROOT, target);
    } catch (e) {
      console.warn("[convert] soffice failed, falling back to text render:", e);
    }
  }

  const { value: text } = await mammoth.extractRawText({ path: src });
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const size = 11;
  const lineHeight = size * 1.4;
  const margin = 56;
  const pageW = 595.28, pageH = 841.89; // A4
  const maxWidth = pageW - margin * 2;

  // Helvetica (WinAnsi) can't encode Cyrillic; transliterate as a last resort so the PDF is still readable.
  const encodable = (s: string) =>
    s.replace(/[^\x00-\xFF]/g, (ch) => translit[ch] ?? "?");

  const lines: string[] = [];
  for (const para of text.split(/\r?\n/)) {
    const words = encodable(para).split(/\s+/);
    let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (font.widthOfTextAtSize(test, size) > maxWidth && cur) {
        lines.push(cur);
        cur = w;
      } else cur = test;
    }
    lines.push(cur);
  }

  let page = pdf.addPage([pageW, pageH]);
  let y = pageH - margin;
  for (const line of lines) {
    if (y < margin) {
      page = pdf.addPage([pageW, pageH]);
      y = pageH - margin;
    }
    page.drawText(line, { x: margin, y, size, font });
    y -= lineHeight;
  }
  await fs.writeFile(target, await pdf.save());
  return path.relative(UPLOAD_ROOT, target);
}

const translit: Record<string, string> = Object.fromEntries(
  Object.entries({
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y", к: "k",
    л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
    ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
    ә: "a", ғ: "g", қ: "q", ң: "n", ө: "o", ұ: "u", ү: "u", һ: "h", і: "i",
  }).flatMap(([k, v]) => [[k, v], [k.toUpperCase(), v.charAt(0).toUpperCase() + v.slice(1)]]),
);
