import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { absPath } from "@/lib/files";

/** Serves a submission: converted PDF by default, `?v=original` for the uploaded file. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSession();
  if (!me) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;
  const s = await prisma.submission.findUnique({ where: { id }, include: { assignment: { include: { subject: true } } } });
  if (!s) return new NextResponse("Not found", { status: 404 });
  // Only the author or the subject's teacher may see a submission.
  const allowed = s.studentId === me.id || s.assignment.subject.teacherId === me.id;
  if (!allowed) return new NextResponse("Forbidden", { status: 403 });

  const original = req.nextUrl.searchParams.get("v") === "original";
  const rel = original ? s.originalPath : s.pdfPath;
  const buf = await fs.readFile(absPath(rel));
  const isPdf = path.extname(rel).toLowerCase() === ".pdf";
  const name = original ? s.originalName : s.originalName.replace(/\.docx$/i, ".pdf");
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": isPdf ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `${isPdf ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "private, max-age=0",
    },
  });
}
