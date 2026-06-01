import Link from "next/link";

interface CtaBannerProps {
  title: string;
  subtitle?: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export function CtaBanner({
  title,
  subtitle,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: CtaBannerProps) {
  return (
    <section className="lg:px-20 mt-4 flex w-full justify-center px-(--spacing-16) py-(--spacing-80)">
      <div className="border-white/[0.08] px-6 py-16 shadow-2xl lg:px-16 lg:py-24 relative w-full max-w-[1120px] overflow-hidden rounded-[28px] border bg-[#09090b] text-center">
        {/* top-center violet glow */}
        <div className="top-0 bg-violet-600/30 pointer-events-none absolute left-1/2 h-[280px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]" />
        {/* bottom-right blue accent */}
        <div className="-bottom-28 -right-28 bg-blue-600/25 pointer-events-none absolute h-[360px] w-[360px] rounded-full blur-[100px]" />
        {/* bottom-left indigo accent */}
        <div className="-bottom-28 -left-28 bg-indigo-500/20 pointer-events-none absolute h-[280px] w-[280px] rounded-full blur-[80px]" />
        {/* dot grid overlay */}
        <div className="inset-0 pointer-events-none absolute bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:28px_28px]" />
        {/* top edge shimmer */}
        <div className="top-0 via-white/25 pointer-events-none absolute left-1/2 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent to-transparent" />

        <div className="gap-6 relative flex flex-col items-center">
          <div className="gap-2 border-white/10 bg-white/[0.06] px-4 py-1.5 backdrop-blur-sm inline-flex items-center rounded-full border">
            <div className="h-1.5 w-1.5 animate-pulse bg-emerald-400 rounded-full" />
            <span className="text-xs font-medium tracking-wide text-white/60">
              Free to get started
            </span>
          </div>

          <h2 className="from-white to-white/65 text-3xl font-semibold lg:text-[44px] max-w-[560px] bg-gradient-to-b bg-clip-text leading-[1.1] tracking-[-1.5px] text-transparent">
            {title}
          </h2>

          {subtitle && (
            <p className="text-base text-white/50 lg:text-[17px] max-w-[440px] leading-[1.65]">
              {subtitle}
            </p>
          )}

          <div className="mt-2 gap-3 sm:w-auto sm:flex-row sm:items-center flex w-full flex-col items-stretch">
            <Link
              href={primaryHref}
              className="bg-white px-8 py-3 text-sm font-semibold text-neutral-900 shadow-lg inline-flex items-center justify-center rounded-full transition-opacity hover:opacity-90"
            >
              {primaryLabel}
            </Link>
            {secondaryLabel && secondaryHref && (
              <Link
                href={secondaryHref}
                className="border-white/15 bg-white/[0.06] px-8 py-3 text-sm font-semibold text-white/80 backdrop-blur-sm hover:border-white/25 hover:bg-white/10 hover:text-white inline-flex items-center justify-center rounded-full border transition-colors"
              >
                {secondaryLabel}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
