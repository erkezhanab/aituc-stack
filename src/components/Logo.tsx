import Link from "next/link";

/** Wordmark: square monogram + "AITUC Stack". */
export function Logo({ href = "/", size = "md" }: { href?: string; size?: "md" | "lg" }) {
  const tile = size === "lg" ? "h-9 w-9 text-base" : "h-6 w-6 text-[11px]";
  const word = size === "lg" ? "text-lg" : "text-[14px]";
  return (
    <Link href={href} className="inline-flex items-center gap-2">
      <span className={`${tile} display grid place-items-center rounded-[3px] bg-primary font-bold text-primary-fg`}>A</span>
      <span className={`${word} display font-bold tracking-tight`}>AITUC<span className="text-muted"> Stack</span></span>
    </Link>
  );
}
