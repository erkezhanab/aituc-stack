import type { SessionUser } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import { getT } from "@/i18n/server";
import { Logo } from "./Logo";
import { Icon } from "./Icons";
import { ThemeToggle } from "./ThemeToggle";
import { LangToggle } from "./LangToggle";
import { NavLinks } from "./NavLinks";

export async function Nav({ user }: { user: SessionUser }) {
  const { t } = await getT();
  const links =
    user.role === "teacher"
      ? [
          { href: "/teacher", label: t("nav.subjects") },
          { href: "/teacher/gradebook", label: t("nav.gradebook") },
          { href: "/teacher/leaderboard", label: t("nav.leaderboard") },
        ]
      : [
          { href: "/student", label: t("nav.mySubjects") },
          { href: "/student/grades", label: t("nav.myGrades") },
          { href: "/student/leaderboard", label: t("nav.leaderboard") },
        ];
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-5 gap-y-1.5 px-5 py-2">
        <Logo href={user.role === "teacher" ? "/teacher" : "/student"} />
        <span className="hidden h-4 w-px bg-line-2 md:block" />
        <NavLinks links={links} />
        <div className="ml-auto flex items-center gap-1.5">
          <LangToggle />
          <ThemeToggle />
          <span className="hidden h-4 w-px bg-line-2 sm:block" />
          <span className="hidden items-center gap-2 pl-1 text-[13px] sm:inline-flex">
            <span className="font-medium">{user.name}</span>
            <span className="badge-neutral">{user.role === "teacher" ? t("common.teacher") : t("common.student")}</span>
          </span>
          <form action={logoutAction}>
            <button className="icon-btn" title={t("common.logout")} aria-label={t("common.logout")}><Icon.LogOut size={15} /></button>
          </form>
        </div>
      </div>
    </header>
  );
}
