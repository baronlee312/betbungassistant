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
  dictionary?: Dictionary["matchCard"];
  statusDictionary?: Dictionary["status"];
  match: NormalizedMatch;
  href?: string;
  dateLabel?: string;
  timeLabel?: string;
  timeZoneLabel?: string;
}

const defaultDictionary: Dictionary["matchCard"] = {
  away: "Away",
  home: "Home",
  openMatchDetails: "Open match details for {home} versus {away}",
  venueTbd: "Venue TBD",
  versusShort: "vs",
};

export default function MatchCard({
  dictionary = defaultDictionary,
  statusDictionary,
  href,
  match,
  dateLabel,
  timeLabel,
  timeZoneLabel,
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
      href={href ?? `/match/${match.id}`}
      aria-label={ariaLabel}
      className="group flex min-h-56 cursor-pointer flex-col justify-between rounded-lg border border-slate-800 bg-slate-950/80 p-5 shadow-2xl shadow-black/20 transition-colors duration-200 hover:border-emerald-400/70 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950"
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

        <div className="flex h-14 min-w-24 items-center justify-center rounded-lg border border-slate-800 bg-black/35 px-4 font-mono text-2xl font-bold text-emerald-400">
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
        <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300">
          {status}
        </span>
      </div>
    </Link>
  );
}
