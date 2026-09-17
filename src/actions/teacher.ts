"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { MAX_ASSIGNMENT_SIZE, detectKind, safeName, saveBuffer } from "@/lib/files";
import type { ActionState } from "./auth";

async function ownSubject(subjectId: string, teacherId: string) {
  return prisma.subject.findFirst({ where: { id: subjectId, teacherId } });
}

export async function createSubjectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireUser("teacher");
  const title = String(formData.get("title") ?? "").trim();
  if (title.length < 2) return { error: "err.subjectTitle" };
  const joinCode = randomBytes(3).toString("hex").toUpperCase();
  await prisma.subject.create({ data: { title, teacherId: me.id, joinCode } });
  revalidatePath("/teacher");
  return { ok: "msg.subjectCreated", params: { title, code: joinCode } };
}

export async function createAssignmentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireUser("teacher");
  const parsed = z
    .object({
      subjectId: z.string().min(1, "err.chooseSubject"),
      title: z.string().trim().min(2, "err.assignmentTitle"),
      description: z.string().trim(),
      deadline: z.string().min(1, "err.deadlineRequired"), // ISO string built on the client from date + time
    })
    .safeParse({
      subjectId: formData.get("subjectId"),
      title: formData.get("title"),
      description: formData.get("description") ?? "",
      deadline: formData.get("deadline"),
    });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const deadline = new Date(parsed.data.deadline);
  if (isNaN(deadline.getTime())) return { error: "err.badDeadline" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "err.attachPdf" };
  if (file.size > MAX_ASSIGNMENT_SIZE) return { error: "err.fileTooBig", params: { mb: MAX_ASSIGNMENT_SIZE / 1024 / 1024 } };
  const buf = Buffer.from(await file.arrayBuffer());
  if (detectKind(file.name, buf) !== "pdf") return { error: "err.mustBePdf" };

  if (!(await ownSubject(parsed.data.subjectId, me.id))) return { error: "err.noAccess" };
  const rel = await saveBuffer("assignments", safeName(file.name), buf, "pdf");
  const a = await prisma.assignment.create({
    data: { ...parsed.data, deadline, filePath: rel, fileName: file.name },
  });
  revalidatePath("/teacher");
  redirect(`/assignments/${a.id}`);
}

export async function gradeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireUser("teacher");
  const submissionId = String(formData.get("submissionId") ?? "");
  const score = Number(formData.get("score"));
  const comment = String(formData.get("comment") ?? "").trim();
  if (!Number.isInteger(score) || score < 1 || score > 12) return { error: "err.scoreRange" };

  const sub = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { assignment: { include: { subject: true } } },
  });
  if (!sub || sub.assignment.subject.teacherId !== me.id) return { error: "err.noAccess" };

  await prisma.grade.upsert({
    where: { submissionId },
    create: { submissionId, score, comment: comment || null },
    update: { score, comment: comment || null, gradedAt: new Date() },
  });
  revalidatePath(`/assignments/${sub.assignmentId}`);
  revalidatePath("/teacher/gradebook");
  return { ok: "msg.gradeSaved" };
}

export async function addStudentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireUser("teacher");
  const subjectId = String(formData.get("subjectId") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!(await ownSubject(subjectId, me.id))) return { error: "err.noAccess" };
  const student = await prisma.user.findFirst({ where: { email, role: "student" } });
  if (!student) return { error: "err.studentNotFound" };
  await prisma.enrollment.upsert({
    where: { subjectId_studentId: { subjectId, studentId: student.id } },
    create: { subjectId, studentId: student.id },
    update: {},
  });
  revalidatePath(`/subjects/${subjectId}`);
  return { ok: "msg.studentEnrolled", params: { name: student.name } };
}
