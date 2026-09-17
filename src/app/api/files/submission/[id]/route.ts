import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { MIME, kindOf, openObject } from "@/lib/files";

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
  const key = original ? s.originalPath : s.pdfPath;
  const kind = kindOf(key);
  const name = original ? s.originalName : s.originalName.replace(/\.docx$/i, ".pdf");

  // Private bucket: the object is fetched with a short-lived signed URL and streamed through.
  const obj = await openObject(key);
  if (!obj) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(obj.body, {
    headers: {
      "Content-Type": MIME[kind],
      ...(obj.size ? { "Content-Length": obj.size } : {}),
      "Content-Disposition": `${kind === "pdf" ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "private, max-age=0",
    },
  });
}
