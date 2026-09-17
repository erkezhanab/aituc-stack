import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { computeLeaderboard } from "@/lib/rating";
import { getT } from "@/i18n/server";
import { Leaderboard } from "@/components/Leaderboard";

export default async function StudentLeaderboard({ searchParams }: { searchParams: Promise<{ subject?: string; period?: string }> }) {
  const me = await requireUser("student");
  const { t } = await getT();
  const sp = await searchParams;
  const enrolled = await prisma.enrollment.findMany({ where: { studentId: me.id }, include: { subject: { select: { id: true, title: true } } } });
  const subjects = enrolled.map((e) => e.subject);
  const subjectId = subjects.some((s) => s.id === sp.subject) ? sp.subject : undefined;
  const period = sp.period === "month" ? "month" : "all";
  const rows = await computeLeaderboard({ subjectId, period });
  const mine = rows.find((r) => r.studentId === me.id);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
        <div>
          <p className="eyebrow">{t("common.student")}</p>
          <h1 className="h1">{t("lb.title")}</h1>
        </div>
        {mine && <span className="text-xs text-muted">{t("lb.yourRank", { rank: mine.rank, rating: mine.rating.toFixed(2) })}</span>}
      </div>
      <Leaderboard rows={rows} subjects={subjects} filters={{ subjectId, period }} basePath="/student/leaderboard" highlightId={me.id} anonymize t={t} />
    </div>
  );
}
