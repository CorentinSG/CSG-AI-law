import { Card, CardContent } from "@/components/ui/card";

const legendItems = [
  {
    label: "1. Authority",
    title: "What kind of legal signal is this?",
    body: "Each item is labeled as binding law, proposed law, agency guidance, enforcement, soft law, or standards material.",
  },
  {
    label: "2. Source trail",
    title: "Can you trace the claim to a real source?",
    body: "Every public entry links back to structured source references, including institution, official URL, date, and pinpoint when available.",
  },
  {
    label: "3. Review posture",
    title: "Has it been human-reviewed?",
    body: "Public monitor items are manually reviewed before publication. Discovery leads and unverified material stay outside the public legal-authority layer.",
  },
  {
    label: "4. Regional structure",
    title: "Where does it belong?",
    body: "Europe and United States coverage are separated so users can understand the legal architecture by jurisdiction rather than by generic AI news.",
  },
];

export function LegalIntelligenceLegend() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {legendItems.map((item) => (
        <Card
          key={item.label}
          className="rounded-[1.7rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]"
        >
          <CardContent className="space-y-3 p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">
              {item.label}
            </p>
            <p className="font-display text-lg font-medium uppercase tracking-[-0.04em] text-zinc-950">
              {item.title}
            </p>
            <p className="text-sm leading-7 text-zinc-700">{item.body}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
