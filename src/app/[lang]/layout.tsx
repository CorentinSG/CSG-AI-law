import { LangAttribute } from "@/components/site/lang-attribute";

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <>
      <LangAttribute lang={lang} />
      {children}
    </>
  );
}
