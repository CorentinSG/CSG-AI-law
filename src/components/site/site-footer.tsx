import Link from "next/link";

const footerNav = [
  { href: "/", label: "Home" },
  { href: "/research", label: "Notes & Commentary" },
  { href: "/ai-regulation", label: "AI Law Hub" },
  { href: "/standards", label: "Standards" },
  { href: "/contact", label: "Contact" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-black/6 bg-[#f4f4f1]">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-3">
          <p className="font-display text-xl font-medium uppercase tracking-[-0.05em] text-zinc-950">
            C. Saint-Girons, Esq
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-500">
            AI Law &amp; Legal Intelligence
          </p>
          <p className="max-w-2xl text-sm leading-6 text-zinc-600">
            Attorney-led research, monitoring, and analysis at the intersection
            of artificial intelligence, regulation, legal intelligence, and
            comparative legal systems.
          </p>
          <p className="max-w-2xl text-xs leading-6 text-zinc-500">
            Content is provided for legal research and informational purposes
            only and does not constitute legal advice.
          </p>
        </div>

        <div className="grid gap-3 text-sm text-zinc-600 sm:grid-cols-2">
          {footerNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-mono text-[11px] uppercase tracking-[0.18em] hover:text-zinc-950"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
