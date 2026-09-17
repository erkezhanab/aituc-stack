import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { openObject } from "@/lib/files";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSession();
  if (!me) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;
  const a = await prisma.assignment.findUnique({
    where: { id },
    include: { subject: { include: { enrollments: { where: { studentId: me.id } } } } },
  });
  if (!a) return new NextResponse("Not found", { status: 404 });
  const allowed = a.subject.teacherId === me.id || a.subject.enrollments.length > 0;
  if (!allowed) return new NextResponse("Forbidden", { status: 403 });

  // Private bucket: the object is fetched with a short-lived signed URL and streamed through.
  const obj = await openObject(a.filePath);
  if (!obj) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(obj.body, {
    headers: {
      "Content-Type": "application/pdf",
      ...(obj.size ? { "Content-Length": obj.size } : {}),
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(a.fileName)}`,
      "Cache-Control": "private, max-age=0",
    },
  });
}
