import { notFound } from "next/navigation";
import ScheduleSections from "@/components/schedule-sections";
import KnockoutBracket from "@/components/knockout-bracket";
import Header from "@/components/header";
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
  const { stage = "knockout" } = await searchParams;

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
        // Group stage matches are all matches that are not knockout matches
        const mid = parseInt(m.id, 10);
        const isMatchKnockout = m.date && m.date >= "2026-06-28" && !isNaN(mid) && mid >= 12812000 && mid <= 12814000;
        return !isMatchKnockout;
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
      
      {/* Responsive Header Navigation */}
      <Header
        locale={locale}
        dictionary={dictionary}
        nextMatchId={nextMatch?.id}
        isKnockout={isKnockout}
      />

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
