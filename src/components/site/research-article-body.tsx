"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { Languages, Sparkles } from "lucide-react";

import {
  ARTICLE_LANGUAGE_LABELS,
  getAvailableLanguages,
  getOriginalLanguage,
  getResearchRendition,
  type ArticleLanguage,
  type ResearchEntry,
} from "@/content/research";

type Copy = {
  readIn: string;
  original: string;
  machineTitle: string;
  machineBody: (original: string) => string;
  readOriginal: string;
};

const COPY: Record<"en" | "fr", Copy> = {
  en: {
    readIn: "Read in",
    original: "original",
    machineTitle: "Machine translation",
    machineBody: (original) =>
      `This rendition was produced by machine translation and has not been reviewed by the author. Legal meaning can shift in translation — the ${original} original is the authoritative text.`,
    readOriginal: "Read the original",
  },
  fr: {
    readIn: "Lire en",
    original: "original",
    machineTitle: "Traduction automatique",
    machineBody: (original) =>
      `Cette version a été produite par traduction automatique et n'a pas été relue par l'auteur. Le sens juridique peut se déplacer dans la traduction : la version ${original} fait foi.`,
    readOriginal: "Lire la version originale",
  },
};

type ArticleLanguageValue = {
  entry: ResearchEntry;
  uiLang: "en" | "fr";
  selected: ArticleLanguage;
  setSelected: (language: ArticleLanguage) => void;
};

const ArticleLanguageContext = createContext<ArticleLanguageValue | null>(null);

function useArticleLanguage() {
  const value = useContext(ArticleLanguageContext);
  if (!value) {
    throw new Error("Article language components must sit inside the provider");
  }
  return value;
}

/** The selected rendition, plus what the switcher needs to describe it. */
function useRendition() {
  const { entry, selected } = useArticleLanguage();
  return useMemo(() => getResearchRendition(entry, selected), [entry, selected]);
}

/**
 * Owns the language selection for one article. Server-rendered children pass
 * straight through, so the page keeps its layout and only the language-bearing
 * pieces become client components.
 */
export function ArticleLanguageProvider({
  entry,
  lang,
  children,
}: {
  entry: ResearchEntry;
  lang: "en" | "fr";
  children: ReactNode;
}) {
  const languages = useMemo(() => getAvailableLanguages(entry), [entry]);
  // Open in the reader's own language when a rendition exists for it.
  const [selected, setSelected] = useState<ArticleLanguage>(() =>
    languages.includes(lang) ? lang : getOriginalLanguage(entry),
  );

  const value = useMemo(
    () => ({ entry, uiLang: lang, selected, setSelected }),
    [entry, lang, selected],
  );

  return (
    <ArticleLanguageContext.Provider value={value}>
      {children}
    </ArticleLanguageContext.Provider>
  );
}

export function ArticleTitle() {
  const rendition = useRendition();
  return (
    <>
      <h1
        lang={rendition.language}
        className="max-w-5xl font-serif text-4xl leading-[0.96] text-zinc-950 md:text-6xl"
      >
        {rendition.title}
      </h1>
      <p
        lang={rendition.language}
        className="max-w-4xl text-lg leading-8 text-zinc-600"
      >
        {rendition.subtitle}
      </p>
    </>
  );
}

export function ArticleReadingTime() {
  const rendition = useRendition();
  return <p className="text-sm text-zinc-800">{rendition.readingTime}</p>;
}

export function ArticleLanguageSwitcher() {
  const { entry, uiLang, selected, setSelected } = useArticleLanguage();
  const languages = useMemo(() => getAvailableLanguages(entry), [entry]);
  const originalLanguage = getOriginalLanguage(entry);
  const c = COPY[uiLang];

  if (languages.length < 2) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.24em] text-zinc-400">
        <Languages className="size-3" />
        {c.readIn}
      </span>
      {languages.map((language) => {
        const active = language === selected;
        return (
          <button
            key={language}
            type="button"
            onClick={() => setSelected(language)}
            aria-pressed={active}
            lang={language}
            className={`rounded-full border px-3.5 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em] transition-colors ${
              active
                ? "border-black/15 bg-zinc-100 text-zinc-950"
                : "border-black/8 text-zinc-500 hover:border-black/15 hover:text-zinc-900"
            }`}
          >
            {ARTICLE_LANGUAGE_LABELS[language]}
            {language === originalLanguage ? ` · ${c.original}` : ""}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Machine-translated legal analysis must not read as the author's own words.
 * Article 50(4) of the AI Act makes the same point about AI-generated
 * public-interest text.
 */
export function ArticleTranslationNotice() {
  const { entry, uiLang, setSelected } = useArticleLanguage();
  const rendition = useRendition();
  const originalLanguage = getOriginalLanguage(entry);
  const c = COPY[uiLang];

  if (rendition.isOriginal || rendition.humanReviewed) return null;

  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-[1.6rem] border border-amber-400/30 bg-amber-400/[0.05] p-5"
    >
      <Sparkles className="mt-0.5 size-4 shrink-0 text-amber-400" />
      <div>
        <p className="font-display text-sm font-medium tracking-[-0.01em] text-zinc-950">
          {c.machineTitle}
        </p>
        <p className="mt-1 max-w-4xl text-[13px] leading-6 text-zinc-600 hyphens-auto text-justify">
          {c.machineBody(ARTICLE_LANGUAGE_LABELS[originalLanguage])}
        </p>
        <button
          type="button"
          onClick={() => setSelected(originalLanguage)}
          className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-zinc-500 underline decoration-black/15 underline-offset-4 transition-colors hover:text-zinc-900"
        >
          {c.readOriginal}
        </button>
      </div>
    </div>
  );
}

export function ResearchArticleBody({
  t,
}: {
  /** Labels owned by the page, so wording stays consistent with the shell. */
  t: { abstract: string; references: string };
}) {
  const { uiLang } = useArticleLanguage();
  const rendition = useRendition();

  return (
    // Marked with the rendition's own lang so screen readers and hyphenation
    // follow the content, not the site chrome.
    <div lang={rendition.language} className="space-y-10">
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.26em] text-zinc-500">
          {t.abstract}
        </p>
        <p className="max-w-4xl text-base leading-8 text-zinc-700 hyphens-auto text-justify md:text-lg">
          {rendition.abstract}
        </p>
      </div>

      <div className="space-y-10">
        {rendition.body.map((section) => (
          <section key={section.heading} className="space-y-4">
            <h2 className="font-serif text-3xl text-zinc-950">
              {section.heading}
            </h2>
            <div className="space-y-4 text-base leading-8 text-zinc-700 hyphens-auto text-justify">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            {section.bullets?.length ? (
              <ul className="space-y-3 text-base leading-8 text-zinc-700">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-3">
                    <span className="mt-3 size-1.5 rounded-full bg-zinc-400" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      {rendition.references?.length ? (
        <section className="space-y-4 border-t border-black/6 pt-8">
          <h2 className="font-serif text-3xl text-zinc-950">{t.references}</h2>
          <div className="space-y-3 text-sm leading-7 text-zinc-700">
            {rendition.references.map((reference) => (
              <div key={reference.label}>
                {reference.href ? (
                  <Link
                    href={
                      reference.href.startsWith("/")
                        ? `/${uiLang}${reference.href}`
                        : reference.href
                    }
                    className="text-zinc-900 underline decoration-black/15 underline-offset-4"
                  >
                    {reference.label}
                  </Link>
                ) : (
                  <span className="text-zinc-900">{reference.label}</span>
                )}
                {reference.note ? <p>{reference.note}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
