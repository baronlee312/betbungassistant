import { notFound } from "next/navigation";
import LanguageSwitcher from "@/components/language-switcher";
import ScheduleSections from "@/components/schedule-sections";
import Link from "next/link";
import FocusMatchButton from "@/components/focus-match-button";
import KnockoutBracket from "@/components/knockout-bracket";
import { getMatchKickoffSortValue } from "@/lib/format";
import {
  getDictionary,
  getLocaleLanguageTag,
  getLocalizedPath,
  isLocale,
  type Locale,
} from "@/lib/i18n";
import {
  WORLD_CUP_SEASON,
  getWorldCupSchedule,
} from "@/lib/thesportsdb";

export const dynamic = "force-dynamic";

interface HomeProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    stage?: string;
  }>;
}

export default async function Home({ params, searchParams }: HomeProps) {
  const { locale: localeParam } = await params;
  const { stage = "group" } = await searchParams;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale: Locale = localeParam;
  const dictionary = getDictionary(locale);
  const allMatches = await getWorldCupSchedule();

  const isKnockout = stage === "knockout";
  const matches = isKnockout
    ? allMatches.filter((m) => {
        // Knockout matches start on June 28, 2026 and belong to the 12812xxx - 12814xxx ranges
        const mid = parseInt(m.id, 10);
        return m.date && m.date >= "2026-06-28" && !isNaN(mid) && mid >= 12812000 && mid <= 12814000;
      })
    : allMatches.filter((m) => {
        // Group stage matches run up to June 27, 2026
        return m.date && m.date <= "2026-06-27";
      });

  const nextMatch = allMatches.length > 0
    ? [...allMatches]
        .sort((a, b) => getMatchKickoffSortValue(a) - getMatchKickoffSortValue(b))
        .find((m) => {
          const status = m.status?.toUpperCase();
          const isFinished =
            status === "FINISHED" ||
            status === "MATCH FINISHED" ||
            status === "ENDED";
          return !isFinished;
        })
    : null;

  return (
    <main className="min-h-dvh bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Rigidly Sticky Header */}
      <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-slate-900/80 transition-all duration-200 px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          
          {/* Left: Title & Stage Tabs */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <div>
              <p className="text-[10px] font-semibold uppercase text-emerald-300 tracking-wider">
                {dictionary.home.eyebrow} {WORLD_CUP_SEASON}
              </p>
              <h1 className="text-lg font-bold text-slate-50 tracking-tight leading-none mt-0.5">
                {dictionary.home.title}
              </h1>
            </div>
            
            <div className="h-5 w-px bg-slate-800 hidden sm:block" />

            {/* Segmented Control Tabs */}
            <div className="flex gap-0.5 p-0.5 bg-slate-900/65 rounded-full border border-slate-850">
              <Link
                href={`/${locale}?stage=group`}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-150 ${
                  !isKnockout
                    ? "bg-emerald-400 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {dictionary.home.groupStage}
              </Link>
              <Link
                href={`/${locale}?stage=knockout`}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-150 ${
                  isKnockout
                    ? "bg-emerald-400 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {dictionary.home.knockoutStage}
              </Link>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {nextMatch && (
              <FocusMatchButton matchId={nextMatch.id} locale={locale} />
            )}
            <Link
              href={getLocalizedPath(locale, "/fifa-rankings")}
              className="text-xs sm:text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {dictionary.fifaRankings.title} →
            </Link>
            <LanguageSwitcher
              currentPath="/"
              dictionary={dictionary.common}
              locale={locale}
            />
          </div>

        </div>
      </header>

      {/* Main Content Wrapper */}
      {isKnockout ? (
        <div className="w-full flex-1 px-4 py-4 sm:px-6 lg:px-8 flex flex-col gap-6">
          <KnockoutBracket
            matches={matches}
            locale={locale}
            dictionary={dictionary}
          />
          <footer className="border-t border-slate-900 pt-4 text-xs text-slate-500">
            {dictionary.home.footer}
          </footer>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex flex-col gap-8">
          {matches.length > 0 ? (
            <ScheduleSections
              dateTimeDictionary={dictionary.dateTime}
              dictionary={dictionary.schedule}
              languageTag={getLocaleLanguageTag(locale)}
              locale={locale}
              matchCardDictionary={dictionary.matchCard}
              matches={matches}
              statusDictionary={dictionary.status}
            />
          ) : (
            <section className="rounded-lg border border-dashed border-slate-800 bg-slate-950/70 p-8 text-center">
              <h2 className="text-2xl font-semibold text-slate-50">
                {dictionary.home.emptyTitle}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
                {dictionary.home.emptyDescription.replace("{season}", WORLD_CUP_SEASON)}
              </p>
            </section>
          )}

          <footer className="border-t border-slate-900 pt-4 text-xs text-slate-500">
            {dictionary.home.footer}
          </footer>
        </div>
      )}
    </main>
  );
}
