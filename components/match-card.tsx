import { getFlagEmoji } from "@/lib/flags";
import Link from "next/link";
import {
  formatMatchDate,
  formatMatchTime,
  formatScoreline,
  getStatusLabel,
} from "@/lib/format";
import type { Dictionary } from "@/lib/i18n";
import type { NormalizedMatch } from "@/lib/thesportsdb-types";

interface MatchCardProps {
  id?: string;
  dictionary?: Dictionary["matchCard"];
  statusDictionary?: Dictionary["status"];
  match: NormalizedMatch;
  href?: string;
  dateLabel?: string;
  timeLabel?: string;
  timeZoneLabel?: string;
  highlightMode?: "today" | "tomorrow" | "none";
}

const defaultDictionary: Dictionary["matchCard"] = {
  away: "Away",
  home: "Home",
  openMatchDetails: "Open match details for {home} versus {away}",
  venueTbd: "Venue TBD",
  versusShort: "vs",
};

export default function MatchCard({
  id,
  dictionary = defaultDictionary,
  statusDictionary,
  href,
  match,
  dateLabel,
  timeLabel,
  timeZoneLabel,
  highlightMode = "none",
}: MatchCardProps) {
  const scoreline = formatScoreline(match);
  const status = getStatusLabel(match, statusDictionary);
  const displayDate = dateLabel ?? formatMatchDate(match.date);
  const displayTime = timeLabel ?? formatMatchTime(match.time);
  const displayTimeZone = timeZoneLabel ? ` ${timeZoneLabel}` : "";
  const ariaLabel = dictionary.openMatchDetails
    .replace("{home}", match.homeTeam.name)
    .replace("{away}", match.awayTeam.name);

  return (
    <Link
      id={id}
      href={href ?? `/match/${match.id}`}
      aria-label={ariaLabel}
      className={`group flex min-h-56 cursor-pointer flex-col justify-between rounded-lg border p-5 shadow-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 ${
        highlightMode === "today"
          ? "border-emerald-400 bg-slate-900/95 shadow-emerald-500/10 ring-1 ring-emerald-400/30 -translate-y-0.5 focus:ring-emerald-400"
          : highlightMode === "tomorrow"
          ? "border-orange-400 bg-slate-900/95 shadow-orange-500/10 ring-1 ring-orange-400/30 -translate-y-0.5 focus:ring-orange-400"
          : "border-slate-800 bg-slate-950/80 shadow-black/20 hover:border-emerald-400/70 hover:bg-slate-900 focus:ring-emerald-400"
      }`}
    >
      <div className="flex items-center justify-between gap-3 text-sm font-medium uppercase text-slate-300">
        <span>{displayDate}</span>
        <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-200">
          {displayTime}
          <span className="ml-1 text-slate-500">{displayTimeZone}</span>
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-6">
        <div className="flex min-w-0 flex-col items-start gap-2">
          <span className="text-4xl select-none" role="img" aria-label={match.homeTeam.name}>
            {getFlagEmoji(match.homeTeam.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xl font-bold text-slate-50">
              {match.homeTeam.name}
            </p>
            <p className="mt-1 text-xs uppercase text-slate-400">{dictionary.home}</p>
          </div>
        </div>

        <div className={`flex h-14 min-w-24 items-center justify-center rounded-lg border border-slate-800 bg-black/35 px-3 font-mono font-bold text-emerald-400 ${
          scoreline && scoreline.includes("(") ? "text-base sm:text-lg" : "text-2xl"
        }`}>
          {scoreline ?? dictionary.versusShort}
        </div>

        <div className="flex min-w-0 flex-col items-end gap-2">
          <span className="text-4xl select-none" role="img" aria-label={match.awayTeam.name}>
            {getFlagEmoji(match.awayTeam.name)}
          </span>
          <div className="min-w-0 text-right">
            <p className="truncate text-xl font-bold text-slate-50">
              {match.awayTeam.name}
            </p>
            <p className="mt-1 text-xs uppercase text-slate-400">{dictionary.away}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
        <span className="text-sm text-slate-300">
          {match.venue ?? dictionary.venueTbd}
        </span>
        <span className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${
          highlightMode === "today"
            ? "bg-emerald-400/25 text-emerald-200"
            : highlightMode === "tomorrow"
            ? "bg-orange-400/25 text-orange-200"
            : "bg-emerald-400/15 text-emerald-300"
        }`}>
          {status}
        </span>
      </div>
    </Link>
  );
}
