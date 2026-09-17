import { prisma } from "./db";

export const ON_TIME_BONUS = 0.5; // added to the average when every graded submission was on time
export const MAX_SCORE = 12;

export type Period = "all" | "month";

export type LeaderRow = {
  studentId: string;
  name: string;
  avg: number;        // raw average 1..12
  bonus: number;      // 0 or ON_TIME_BONUS
  rating: number;     // avg + bonus, capped at 12
  submitted: number;  // number of submissions (graded or not) in the filter
  graded: number;
  late: number;
  onTimeShare: number;
  rank: number;
};

export async function computeLeaderboard(opts: {
  subjectIds?: string[]; // limit to these subjects (teacher view / filter)
  subjectId?: string;    // single subject filter
  period?: Period;
}): Promise<LeaderRow[]> {
  const since = opts.period === "month" ? new Date(Date.now() - 30 * 24 * 3600 * 1000) : undefined;

  const where: Record<string, unknown> = {};
  const subjectFilter = opts.subjectId ? [opts.subjectId] : opts.subjectIds;
  if (subjectFilter) where.assignment = { subjectId: { in: subjectFilter } };
  if (since) where.submittedAt = { gte: since };

  const subs = await prisma.submission.findMany({
    where,
    include: { grade: true, student: { select: { id: true, name: true } } },
  });

  const map = new Map<string, { name: string; scores: number[]; submitted: number; late: number; lateGraded: number }>();
  for (const s of subs) {
    const row = map.get(s.studentId) ?? { name: s.student.name, scores: [], submitted: 0, late: 0, lateGraded: 0 };
    row.submitted++;
    if (s.status === "late") row.late++;
    if (s.grade) {
      row.scores.push(s.grade.score);
      if (s.status === "late") row.lateGraded++;
    }
    map.set(s.studentId, row);
  }

  const rows: LeaderRow[] = [];
  for (const [studentId, r] of map) {
    if (r.scores.length === 0) continue; // no grades -> not ranked
    const avg = r.scores.reduce((a, b) => a + b, 0) / r.scores.length;
    const bonus = r.lateGraded === 0 ? ON_TIME_BONUS : 0;
    rows.push({
      studentId,
      name: r.name,
      avg,
      bonus,
      rating: Math.min(MAX_SCORE, avg + bonus),
      submitted: r.submitted,
      graded: r.scores.length,
      late: r.late,
      onTimeShare: r.submitted ? (r.submitted - r.late) / r.submitted : 0,
      rank: 0,
    });
  }
  rows.sort((a, b) => b.rating - a.rating || b.graded - a.graded || a.name.localeCompare(b.name));
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}
