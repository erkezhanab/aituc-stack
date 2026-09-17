/**
 * Seeds the first teacher (there is no public teacher registration) and demo data.
 * Usage: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const teacherEmail = process.env.SEED_TEACHER_EMAIL ?? "teacher@aitu.kz";
  const teacherPass = process.env.SEED_TEACHER_PASSWORD ?? "teacher123";

  const teacher = await prisma.user.upsert({
    where: { email: teacherEmail },
    update: {},
    create: { name: "Айгерим Сейткали", email: teacherEmail, role: "teacher", passwordHash: await bcrypt.hash(teacherPass, 10) },
  });

  const students = [];
  for (const [name, email] of [["Дамир Ахметов", "damir@aitu.kz"], ["Алия Нурланова", "aliya@aitu.kz"], ["Тимур Жаксыбеков", "timur@aitu.kz"]]) {
    students.push(
      await prisma.user.upsert({
        where: { email },
        update: {},
        create: { name, email, role: "student", passwordHash: await bcrypt.hash("student123", 10) },
      }),
    );
  }

  const subject = await prisma.subject.upsert({
    where: { joinCode: "DEMO01" },
    update: {},
    create: { title: "Алгоритмы и структуры данных", teacherId: teacher.id, joinCode: "DEMO01" },
  });
  for (const s of students) {
    await prisma.enrollment.upsert({
      where: { subjectId_studentId: { subjectId: subject.id, studentId: s.id } },
      update: {},
      create: { subjectId: subject.id, studentId: s.id },
    });
  }

  console.log(`
Seed complete.
  Teacher:  ${teacherEmail} / ${teacherPass}
  Students: damir@aitu.kz, aliya@aitu.kz, timur@aitu.kz / student123
  Subject join code: DEMO01
  Teacher invite code (for /register): ${process.env.TEACHER_INVITE_CODE ?? "(set TEACHER_INVITE_CODE in .env)"}
`);
}

main().finally(() => prisma.$disconnect());
