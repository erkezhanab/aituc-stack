import { getT } from "@/i18n/server";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LangToggle } from "@/components/LangToggle";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getT();
  const features = [
    [t("auth.feature1Title"), t("auth.feature1Desc")],
    [t("auth.feature2Title"), t("auth.feature2Desc")],
    [t("auth.feature3Title"), t("auth.feature3Desc")],
  ];
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-3">
        <Logo href="/login" />
        <div className="flex items-center gap-1.5"><LangToggle /><ThemeToggle /></div>
      </div>
      <div className="mx-auto grid max-w-[1200px] gap-12 px-5 pb-20 pt-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:pt-20">
        <section className="order-2 lg:order-1">
          <p className="eyebrow">{t("app.tagline")}</p>
          <h1 className="display mt-3 max-w-xl text-[40px] font-bold leading-[1.02] md:text-[56px]">{t("auth.heroTitle")}</h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-fg-2">{t("auth.heroSubtitle")}</p>
          <ol className="mt-10 max-w-lg divide-y divide-line border-y border-line">
            {features.map(([title, desc], i) => (
              <li key={title} className="grid grid-cols-[3rem_1fr] gap-3 py-3.5">
                <span className="font-mono text-xs text-muted">0{i + 1}</span>
                <div>
                  <p className="text-[13px] font-semibold">{title}</p>
                  <p className="text-[13px] text-muted">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section className="order-1 lg:order-2 lg:pt-2">{children}</section>
      </div>
    </main>
  );
}
