import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getDictionary,
  getLocalizedPath,
  isLocale,
  type Locale,
} from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import TeamFlag from "@/components/team-flag";

interface FifaRankingsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function FifaRankingsPage({ params }: FifaRankingsPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale: Locale = localeParam;
  const dictionary = getDictionary(locale);
  const rankings = await prisma.fifaRanking.findMany({
    orderBy: {
      rank: 'asc'
    }
  });

  const lastUpdated = rankings.length > 0 ? rankings[0].lastUpdated : null;

  return (
    <main className="min-h-dvh bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link 
              href={getLocalizedPath(locale, "/")}
              className="text-xs font-semibold uppercase text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              ← {dictionary.fifaRankings.backToHome}
            </Link>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold text-slate-50 sm:text-6xl">
              {dictionary.fifaRankings.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              {dictionary.fifaRankings.description}
            </p>
            <a
              href="https://inside.fifa.com/fifa-world-ranking/men"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {dictionary.fifaRankings.officialSource}
            </a>
          </div>

          {lastUpdated && (
            <div className="text-right">
              <p className="text-xs uppercase text-slate-500">
                {dictionary.fifaRankings.lastUpdated}
              </p>
              <p className="text-sm font-medium text-slate-300">
                {new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
                  dateStyle: 'long'
                }).format(lastUpdated)}
              </p>
            </div>
          )}
        </header>

        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">
                    {dictionary.fifaRankings.rank}
                  </th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">
                    {dictionary.fifaRankings.team}
                  </th>
                  <th className="px-6 py-4 text-right font-semibold uppercase tracking-wider">
                    {dictionary.fifaRankings.points}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rankings.map((team) => (
                  <tr 
                    key={team.id}
                    className="transition-colors hover:bg-slate-800/30"
                  >
                    <td className="px-6 py-4 font-mono text-lg font-bold text-emerald-400">
                      {team.rank}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-100">
                      <div className="flex items-center gap-3">
                        {team.flagUrl && (
                          <TeamFlag src={team.flagUrl} alt={`${team.teamName} flag`} />
                        )}
                        {team.teamName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-300">
                      {team.points.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="border-t border-slate-900 pt-4 text-xs text-slate-500">
          {dictionary.home.footer}
        </footer>
      </div>
    </main>
  );
}
