"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import LanguageSwitcher from "@/components/language-switcher";
import MatchStats from "@/components/match-stats";
import RecentFormColumn from "@/components/recent-form-column";
import {
  DEFAULT_VIEWER_TIME_ZONE,
  formatLocalMatchDate,
  formatLocalMatchTime,
  formatMatchTimeZone,
  formatScoreline,
  getStatusLabel,
} from "@/lib/format";
import { getLocalizedPath, type Dictionary, type Locale } from "@/lib/i18n";
import type {
  NormalizedMatch,
  TeamHistoryRouteResponse,
  TeamRecentEventsPayload,
} from "@/lib/thesportsdb-types";

interface TeamFormState extends TeamRecentEventsPayload {
  isLoading: boolean;
  error: string | null;
}

interface MatchDetailClientProps {
  dictionary: {
    common: Dictionary["common"];
    dateTime: Dictionary["dateTime"];
    matchDetail: Dictionary["matchDetail"];
    recentForm: Dictionary["recentForm"];
    status: Dictionary["status"];
    matchStats: Dictionary["matchStats"];
    fifaRankings: Dictionary["fifaRankings"];
  };
  languageTag: string;
  locale: Locale;
  match: NormalizedMatch;
  initialHomeForm: TeamRecentEventsPayload;
  initialAwayForm: TeamRecentEventsPayload;
  homeRanking?: { rank: number; points: number } | null;
  awayRanking?: { rank: number; points: number } | null;
}

function createFormState(payload: TeamRecentEventsPayload): TeamFormState {
  return {
    ...payload,
    isLoading: false,
    error: null,
  };
}

function subscribeToTimeZoneChange() {
  return () => undefined;
}

function getBrowserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_VIEWER_TIME_ZONE;
}

function getServerTimeZone() {
  return DEFAULT_VIEWER_TIME_ZONE;
}

export default function MatchDetailClient({
  dictionary,
  match,
  languageTag,
  locale,
  initialHomeForm,
  initialAwayForm,
  homeRanking,
  awayRanking,
}: MatchDetailClientProps) {
  const [homeForm, setHomeForm] = useState<TeamFormState>(() =>
    createFormState(initialHomeForm),
  );
  const [awayForm, setAwayForm] = useState<TeamFormState>(() =>
    createFormState(initialAwayForm),
  );
  const timeZone = useSyncExternalStore(
    subscribeToTimeZoneChange,
    getBrowserTimeZone,
    getServerTimeZone,
  );

  async function loadMore(side: "home" | "away") {
    const current = side === "home" ? homeForm : awayForm;
    const setForm = side === "home" ? setHomeForm : setAwayForm;

    if (!current.teamId || !current.hasMore || current.isLoading) {
      return;
    }

    setForm((value) => ({ ...value, isLoading: true, error: null }));

    try {
      const response = await fetch(
        `/api/team-history/${encodeURIComponent(current.teamId)}?cursor=${encodeURIComponent(
          current.nextCursor ?? "",
        )}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error(dictionary.recentForm.clientLoadError);
      }

      const data = (await response.json()) as TeamHistoryRouteResponse;

      setForm((value) => ({
        ...value,
        events: [...value.events, ...data.events],
        hasMore: data.hasMore,
        nextCursor: data.nextCursor,
        limitReason: data.limitReason,
        isLoading: false,
      }));
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : dictionary.recentForm.clientLoadError;

      setForm((value) => ({
        ...value,
        isLoading: false,
        error: message,
      }));
    }
  }

  const scoreline = formatScoreline(match);
  const matchDateLabel = formatLocalMatchDate(
    match,
    timeZone,
    languageTag,
    dictionary.dateTime.dateTbd,
  );
  const matchTimeLabel = formatLocalMatchTime(
    match,
    timeZone,
    languageTag,
    dictionary.dateTime.timeTbd,
  );
  const matchTimeZoneLabel = formatMatchTimeZone(match, timeZone);

  const rankDiff =
    homeRanking && awayRanking ? Math.abs(homeRanking.rank - awayRanking.rank) : null;

  return (
    <main className="min-h-dvh bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={getLocalizedPath(locale, "/")}
              className="w-fit rounded-lg border border-slate-800 px-3 py-2 text-sm font-semibold text-slate-300 transition-colors duration-200 hover:border-emerald-400 hover:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              {dictionary.matchDetail.backToSchedule}
            </Link>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(`${match.homeTeam.name} vs ${match.awayTeam.name} ${match.date} ${match.league}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 px-3 py-2 text-sm font-semibold text-slate-400 transition-colors duration-200 hover:border-blue-400 hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.9 3.2-1.9 4.2-1.2 1.2-3.08 2.4-6.42 2.4-5.46 0-9.84-4.42-9.84-9.8S6.54 1.12 12 1.12c3.04 0 5.3 1.2 7.02 2.84l2.32-2.32C19.16 1.44 15.92 0 12 0 5.4 0 0 5.4 0 12s5.4 12 12 12c3.58 0 6.28-1.18 8.4-3.4 2.18-2.18 2.88-5.24 2.88-7.7 0-.74-.06-1.46-.18-2.12H12.48z" />
              </svg>
              Google
            </a>
            <a
              href={`https://www.sofascore.com/event/${match.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 px-3 py-2 text-sm font-semibold text-slate-400 transition-colors duration-200 hover:border-orange-400 hover:text-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-orange-500 text-[10px] font-bold text-white">S</span>
              Sofascore
            </a>
          </div>
          <LanguageSwitcher
            currentPath={`/match/${match.id}`}
            dictionary={dictionary.common}
            locale={locale}
          />
        </div>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-emerald-300">
                {match.league} {match.season}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  {match.homeTeam.crestUrl && (
                    <img src={match.homeTeam.crestUrl} alt="" className="h-10 w-10 object-contain" />
                  )}
                  <h1 className="text-3xl font-semibold text-slate-50 sm:text-5xl">
                    {match.homeTeam.name}
                  </h1>
                </div>
                <span className="text-3xl font-semibold text-slate-500 sm:text-5xl">
                  {dictionary.matchDetail.versusShort}
                </span>
                <div className="flex items-center gap-2">
                  {match.awayTeam.crestUrl && (
                    <img src={match.awayTeam.crestUrl} alt="" className="h-10 w-10 object-contain" />
                  )}
                  <h1 className="text-3xl font-semibold text-slate-50 sm:text-5xl">
                    {match.awayTeam.name}
                  </h1>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-300">
                {matchDateLabel} · {matchTimeLabel}{" "}
                <span className="text-slate-500">{matchTimeZoneLabel}</span> ·{" "}
                {match.venue ?? dictionary.matchDetail.venueTbd}
              </p>
            </div>

            <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-left lg:min-w-48">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                {getStatusLabel(match, dictionary.status)}
              </p>
              <p className="mt-2 font-mono text-4xl font-bold text-emerald-100">
                {scoreline ?? dictionary.matchDetail.versusShort}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg border border-slate-800 bg-black/25 p-4 sm:p-6">
            <div className="flex min-w-0 items-center gap-4">
              {match.homeTeam.crestUrl && (
                <img src={match.homeTeam.crestUrl} alt="" className="h-10 w-10 object-contain" />
              )}
              <div className="min-w-0">
                <p className="truncate text-xl font-bold text-slate-50">
                  {match.homeTeam.name}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    {dictionary.matchDetail.home}
                  </p>
                  {homeRanking && (
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                      FIFA #{homeRanking.rank}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 px-3 py-1 bg-slate-800/50 rounded-full">
                {dictionary.matchDetail.matchup}
              </span>
              {rankDiff !== null && (
                <span className="text-[10px] font-medium text-slate-500">
                  {dictionary.fifaRankings.rankDiff}: {rankDiff}
                </span>
              )}
            </div>
            <div className="flex min-w-0 items-center justify-end gap-4">
              <div className="min-w-0 text-right">
                <p className="truncate text-xl font-bold text-slate-50">
                  {match.awayTeam.name}
                </p>
                <div className="mt-1 flex items-center justify-end gap-2">
                  {awayRanking && (
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                      FIFA #{awayRanking.rank}
                    </span>
                  )}
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    {dictionary.matchDetail.away}
                  </p>
                </div>
              </div>
              {match.awayTeam.crestUrl && (
                <img src={match.awayTeam.crestUrl} alt="" className="h-10 w-10 object-contain" />
              )}
            </div>
          </div>
        </section>

        {match.status === "FINISHED" && (
          <MatchStats dictionary={dictionary.matchStats} match={match} />
        )}

        <section className="grid gap-5 lg:grid-cols-2">
          <RecentFormColumn
            dictionary={dictionary.recentForm}
            teamId={homeForm.teamId}
            teamName={homeForm.teamName}
            events={homeForm.events}
            hasMore={homeForm.hasMore}
            limitReason={homeForm.limitReason}
            isLoading={homeForm.isLoading}
            error={homeForm.error}
            dateTimeDictionary={dictionary.dateTime}
            languageTag={languageTag}
            timeZone={timeZone}
            locale={locale}
            onLoadMore={() => loadMore("home")}
          />
          <RecentFormColumn
            dictionary={dictionary.recentForm}
            teamId={awayForm.teamId}
            teamName={awayForm.teamName}
            events={awayForm.events}
            hasMore={awayForm.hasMore}
            limitReason={awayForm.limitReason}
            isLoading={awayForm.isLoading}
            error={awayForm.error}
            dateTimeDictionary={dictionary.dateTime}
            languageTag={languageTag}
            timeZone={timeZone}
            locale={locale}
            onLoadMore={() => loadMore("away")}
          />
        </section>
      </div>
    </main>
  );
}
