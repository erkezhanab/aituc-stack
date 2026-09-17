"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { MAX_SUBMISSION_SIZE, convertDocxToPdf, detectKind, safeName, saveBuffer } from "@/lib/files";
import type { ActionState } from "./auth";

export async function enrollAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireUser("student");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const subject = await prisma.subject.findUnique({ where: { joinCode: code } });
  if (!subject) return { error: "err.codeNotFound" };
  await prisma.enrollment.upsert({
    where: { subjectId_studentId: { subjectId: subject.id, studentId: me.id } },
    create: { subjectId: subject.id, studentId: me.id },
    update: {},
  });
  revalidatePath("/student");
  return { ok: "msg.enrolled", params: { title: subject.title } };
}

export async function submitAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireUser("student");
  const assignmentId = String(formData.get("assignmentId") ?? "");

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { subject: { include: { enrollments: { where: { studentId: me.id } } } } },
  });
  if (!assignment || assignment.subject.enrollments.length === 0) return { error: "err.noAccess" };

  const existing = await prisma.submission.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId: me.id } },
    include: { grade: true },
  });
  if (existing?.grade) return { error: "err.alreadyGraded" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "err.chooseFile" };
  if (file.size > MAX_SUBMISSION_SIZE) return { error: "err.fileTooBig", params: { mb: MAX_SUBMISSION_SIZE / 1024 / 1024 } };
  const buf = Buffer.from(await file.arrayBuffer());
  const kind = detectKind(file.name, buf);
  if (!kind) return { error: "err.pdfOrDocx" };

  const originalPath = await saveBuffer("submissions", safeName(file.name), buf);
  let pdfPath = originalPath;
  if (kind === "docx") {
    try {
      pdfPath = await convertDocxToPdf(originalPath);
    } catch (e) {
      console.error("[convert]", e);
      return { error: "err.convertFailed" };
    }
  }

  const now = new Date();
  const status = now > assignment.deadline ? "late" : "on_time";
  await prisma.submission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId: me.id } },
    create: { assignmentId, studentId: me.id, originalName: file.name, originalPath, pdfPath, submittedAt: now, status },
    update: { originalName: file.name, originalPath, pdfPath, submittedAt: now, status },
  });
  revalidatePath(`/assignments/${assignmentId}`);
  revalidatePath("/student");
  return { ok: status === "late" ? "msg.submittedLate" : "msg.submittedOnTime" };
}
