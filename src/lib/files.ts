import path from "path";
import os from "os";
import { promises as fs } from "fs";
import { randomBytes } from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import mammoth from "mammoth";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { STORAGE_BUCKET, supabaseAdmin } from "@/lib/supabase";

const execFileAsync = promisify(execFile);

export const MAX_ASSIGNMENT_SIZE = 20 * 1024 * 1024; // 20 MB
export const MAX_SUBMISSION_SIZE = 20 * 1024 * 1024;
/** Lifetime of the signed URLs used to read private objects (seconds). */
export const SIGNED_URL_TTL = 60;

const PDF_MAGIC = Buffer.from("%PDF-");
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // docx is a zip

export type Kind = "pdf" | "docx";

export const MIME: Record<Kind, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/** Detect file type by extension + magic bytes (never trust the MIME type alone). */
export function detectKind(name: string, buf: Buffer): Kind | null {
  const ext = path.extname(name).toLowerCase();
  if (ext === ".pdf" && buf.subarray(0, 5).equals(PDF_MAGIC)) return "pdf";
  if (ext === ".docx" && buf.subarray(0, 4).equals(ZIP_MAGIC)) return "docx";
  return null;
}

export function kindOf(key: string): Kind {
  return path.extname(key).toLowerCase() === ".pdf" ? "pdf" : "docx";
}

export function safeName(original: string) {
  const base = path.basename(original).replace(/[^\w.\-а-яА-ЯёЁ ]+/g, "_").slice(0, 80);
  return `${Date.now()}-${randomBytes(4).toString("hex")}-${base}`;
}

/* ---------------------------------- Supabase Storage ---------------------------------- */

/**
 * Upload a buffer to the private bucket. Returns the object key (`<folder>/<name>`), which is
 * what the DB stores in `filePath` / `originalPath` / `pdfPath`.
 */
export async function saveBuffer(folder: "assignments" | "submissions", name: string, buf: Buffer, kind: Kind) {
  const key = `${folder}/${name}`;
  const { error } = await supabaseAdmin().storage.from(STORAGE_BUCKET).upload(key, buf, {
    contentType: MIME[kind],
    upsert: false,
  });
  if (error) throw new Error(`storage upload failed for ${key}: ${error.message}`);
  return key;
}

/** Short-lived signed URL for a private object. */
export async function signedUrl(key: string) {
  const { data, error } = await supabaseAdmin().storage.from(STORAGE_BUCKET).createSignedUrl(key, SIGNED_URL_TTL);
  if (error || !data) throw new Error(`cannot sign ${key}: ${error?.message}`);
  return data.signedUrl;
}

/**
 * Stream a private object through the server (so access control, filename and inline display
 * stay under our control and the browser never talks to Supabase directly).
 */
export async function openObject(key: string): Promise<{ body: ReadableStream<Uint8Array>; size: string | null } | null> {
  const res = await fetch(await signedUrl(key), { cache: "no-store" });
  if (res.status === 404 || res.status === 400) return null;
  if (!res.ok || !res.body) throw new Error(`storage fetch failed for ${key}: ${res.status}`);
  return { body: res.body, size: res.headers.get("content-length") };
}

/* ------------------------------------ DOCX → PDF ------------------------------------- */

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
 * Convert a DOCX buffer to a PDF buffer.
 * 1) LibreOffice headless if available (faithful rendering) — it only works on files, so the
 *    document is written to a scratch dir in the OS temp folder and removed afterwards;
 * 2) fallback: mammoth text extraction -> simple PDF via pdf-lib (pure in-memory).
 */
export async function convertDocxToPdf(docx: Buffer): Promise<Buffer> {
  const soffice = await findSoffice();
  if (soffice) {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aituc-docx-"));
    try {
      const src = path.join(dir, "in.docx");
      await fs.writeFile(src, docx);
      await execFileAsync(soffice, ["--headless", "--convert-to", "pdf", "--outdir", dir, src], { timeout: 90_000 });
      return await fs.readFile(path.join(dir, "in.pdf"));
    } catch (e) {
      console.warn("[convert] soffice failed, falling back to text render:", e);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  }

  const { value: text } = await mammoth.extractRawText({ buffer: docx });
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
  return Buffer.from(await pdf.save());
}

const translit: Record<string, string> = Object.fromEntries(
  Object.entries({
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y", к: "k",
    л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
    ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
    ә: "a", ғ: "g", қ: "q", ң: "n", ө: "o", ұ: "u", ү: "u", һ: "h", і: "i",
  }).flatMap(([k, v]) => [[k, v], [k.toUpperCase(), v.charAt(0).toUpperCase() + v.slice(1)]]),
);
