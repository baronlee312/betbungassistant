import { notFound } from "next/navigation";
import LanguageSwitcher from "@/components/language-switcher";
import ScheduleSections from "@/components/schedule-sections";
import Link from "next/link";
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
}

export default async function Home({ params }: HomeProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale: Locale = localeParam;
  const dictionary = getDictionary(locale);
  const matches = await getWorldCupSchedule();

  return (
    <main className="min-h-dvh bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-emerald-300">
              {dictionary.home.eyebrow} {WORLD_CUP_SEASON}
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold text-slate-50 sm:text-6xl">
              {dictionary.home.title}
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:items-end">
            <div className="flex items-center gap-4">
              <Link
                href={getLocalizedPath(locale, "/fifa-rankings")}
                className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
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
    </main>
  );
}
