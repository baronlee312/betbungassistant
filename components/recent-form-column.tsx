import {
  formatLocalMatchDate,
  formatLocalMatchTime,
  formatMatchTimeZone,
  formatScoreline,
  getOpponentName,
  getTeamOutcome,
  getVenueSide,
} from "@/lib/format";
import type { Dictionary, Locale } from "@/lib/i18n";
import { getLocalizedPath } from "@/lib/i18n";
import Link from "next/link";
import type { NormalizedMatch } from "@/lib/thesportsdb-types";

interface RecentFormColumnProps {
  dateTimeDictionary: Dictionary["dateTime"];
  dictionary: Dictionary["recentForm"];
  teamId: string | null;
  teamName: string;
  events: NormalizedMatch[];
  hasMore: boolean;
  limitReason: string | null;
  isLoading: boolean;
  error: string | null;
  languageTag: string;
  timeZone: string;
  locale: Locale;
  onLoadMore: () => void;
}

const outcomeClasses = {
  W: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  D: "border-amber-300/40 bg-amber-300/10 text-amber-200",
  L: "border-rose-400/40 bg-rose-400/10 text-rose-300",
};

export default function RecentFormColumn({
  dateTimeDictionary,
  dictionary,
  teamId,
  teamName,
  events,
  hasMore,
  limitReason,
  isLoading,
  error,
  languageTag,
  timeZone,
  locale,
  onLoadMore,
}: RecentFormColumnProps) {
  // Calculate corner statistics
  const eventsWithStats = events.filter((e) => e.statistics?.corners?.home != null && e.statistics?.corners?.away != null);
  const totalWithStats = eventsWithStats.length;

  let teamCornersSum = 0;
  let matchesGe5 = 0;
  let matchesLt5 = 0;

  eventsWithStats.forEach((event) => {
    const isHome = event.homeTeam.id === teamId;
    const teamCorners = isHome ? (event.statistics?.corners?.home ?? 0) : (event.awayTeam.id === teamId ? (event.statistics?.corners?.away ?? 0) : 0);
    
    teamCornersSum += teamCorners;
    if (teamCorners >= 5) {
      matchesGe5++;
    } else {
      matchesLt5++;
    }
  });

  const avgTeamCorners = totalWithStats > 0 ? (teamCornersSum / totalWithStats).toFixed(1) : "0.0";

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/70 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-emerald-300">
            {dictionary.recentForm}
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-50">{teamName}</h2>
        </div>
        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300">
          {events.length} {dictionary.shown}
        </span>
      </div>

      {/* Statistics Summary */}
      {totalWithStats > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-2">
          <div className="rounded-md border border-slate-800 bg-slate-900/50 p-2.5 text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
              {dictionary.avgCornersPerMatch}
            </p>
            <p className="text-lg font-bold text-emerald-400">{avgTeamCorners}</p>
          </div>
          <div className="rounded-md border border-slate-800 bg-slate-900/50 p-2.5 text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
              {dictionary.matchesOver5Corners}
            </p>
            <div className="flex items-baseline justify-center gap-1">
              <p className="text-lg font-bold text-emerald-400">{matchesGe5}</p>
              <p className="text-[10px] text-slate-500">/ {totalWithStats}</p>
            </div>
          </div>
          <div className="rounded-md border border-slate-800 bg-slate-900/50 p-2.5 text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
              {dictionary.matchesUnder5Corners}
            </p>
            <div className="flex items-baseline justify-center gap-1">
              <p className="text-lg font-bold text-emerald-400">{matchesLt5}</p>
              <p className="text-[10px] text-slate-500">/ {totalWithStats}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {events.length > 0 ? (
          events.map((event) => {
            const outcome = getTeamOutcome(event, teamId);
            const outcomeLabel = outcome
              ? {
                  D: dictionary.drawShort,
                  L: dictionary.lossShort,
                  W: dictionary.winShort,
                }[outcome]
              : null;

            const homeCorners = event.statistics?.corners?.home ?? 0;
            const awayCorners = event.statistics?.corners?.away ?? 0;
            const totalCorners = homeCorners + awayCorners;
            const isCornerHighlighted = totalCorners >= 9;
            const hasCorners = homeCorners > 0 || awayCorners > 0;

            const homeYellowCards = event.statistics?.yellowCards?.home ?? 0;
            const awayYellowCards = event.statistics?.yellowCards?.away ?? 0;
            const hasYellowCards = homeYellowCards > 0 || awayYellowCards > 0;

            const homeRedCards = event.statistics?.redCards?.home ?? 0;
            const awayRedCards = event.statistics?.redCards?.away ?? 0;
            const hasRedCards = homeRedCards > 0 || awayRedCards > 0;

            return (
              <Link
                key={event.id}
                href={getLocalizedPath(locale, `/match/${event.id}`)}
                className="block group"
              >
                <article className="rounded-lg border border-slate-800 bg-black/20 p-3 transition-all duration-200 group-hover:border-emerald-500/50 group-hover:bg-slate-900/40">
                  {/* Row 1: Meta Info (Date, Time, Stats) */}
                  <div className="flex items-center justify-between mb-2 text-[11px] font-medium uppercase tracking-wider">
                    <div className="flex items-center gap-2 text-slate-500">
                      <span>
                        {formatLocalMatchDate(event, timeZone, languageTag, dateTimeDictionary.dateTbd)}
                      </span>
                      <span className="text-slate-700">•</span>
                      <span>
                        {formatLocalMatchTime(event, timeZone, languageTag, dateTimeDictionary.timeTbd)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {hasCorners && (
                        <div className="flex items-center gap-1 text-slate-300">
                          <span title="Corners">⛳</span>
                          <span className={isCornerHighlighted ? "text-emerald-400 font-bold" : ""}>
                            {homeCorners}-{awayCorners}
                          </span>
                        </div>
                      )}
                      {hasYellowCards && (
                        <div className="flex items-center gap-1 text-slate-300">
                          <span title="Yellow Cards">🟨</span>
                          <span>{homeYellowCards}-{awayYellowCards}</span>
                        </div>
                      )}
                      {hasRedCards && (
                        <div className="flex items-center gap-1 text-slate-300">
                          <span title="Red Cards">🧧</span>
                          <span className="text-rose-400 font-bold">{homeRedCards}-{awayRedCards}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Match Info (Outcome, Teams, Score) */}
                  <div className="flex items-center gap-3">
                    {outcome && outcomeLabel && (
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold ${outcomeClasses[outcome]}`}>
                        {outcomeLabel}
                      </span>
                    )}
                    
                    <div className="flex flex-1 items-center justify-between min-w-0 bg-slate-950/40 rounded px-2.5 py-1.5 border border-slate-800/50">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {event.homeTeam.crestUrl && (
                          <img src={event.homeTeam.crestUrl} alt="" className="h-4 w-4 object-contain" />
                        )}
                        <span className={`truncate text-sm font-bold ${event.homeTeam.id === teamId ? "text-emerald-400" : "text-slate-200"}`}>
                          {event.homeTeam.name}
                        </span>
                      </div>

                      <div className="mx-3 font-mono text-sm font-black text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                        {formatScoreline(event) ?? "VS"}
                      </div>

                      <div className="flex items-center gap-2 min-w-0 flex-1 justify-end text-right">
                        <span className={`truncate text-sm font-bold ${event.awayTeam.id === teamId ? "text-emerald-400" : "text-slate-200"}`}>
                          {event.awayTeam.name}
                        </span>
                        {event.awayTeam.crestUrl && (
                          <img src={event.awayTeam.crestUrl} alt="" className="h-4 w-4 object-contain" />
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })
        ) : (
          <div className="rounded-lg border border-dashed border-slate-800 bg-black/20 p-6 text-sm text-slate-400">
            {dictionary.noRecentMatches}
          </div>
        )}
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onLoadMore}
        disabled={!hasMore || isLoading}
        className="mt-5 flex h-11 w-full cursor-pointer items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-4 text-sm font-semibold text-slate-200 transition-colors duration-200 hover:border-emerald-400 hover:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-950 disabled:text-slate-500"
      >
        {isLoading
          ? dictionary.loadingOlderMatches
          : hasMore
            ? dictionary.loadMore
            : dictionary.loadMoreUnavailable}
      </button>

      {!hasMore && limitReason ? (
        <p className="mt-3 text-xs leading-5 text-slate-500">{limitReason}</p>
      ) : null}
    </section>
  );
}
