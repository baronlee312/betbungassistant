"use client";

import { useMemo, useSyncExternalStore } from "react";
import MatchCard from "@/components/match-card";
import {
  DEFAULT_VIEWER_TIME_ZONE,
  formatLocalMatchDate,
  formatLocalMatchTime,
  formatMatchTimeZone,
  getLocalMatchDateKey,
  getMatchKickoffSortValue,
} from "@/lib/format";
import { getLocalizedPath, type Dictionary, type Locale } from "@/lib/i18n";
import type { NormalizedMatch } from "@/lib/thesportsdb-types";

interface ScheduleSectionsProps {
  dateTimeDictionary: Dictionary["dateTime"];
  dictionary: Dictionary["schedule"];
  languageTag: string;
  locale: Locale;
  matchCardDictionary: Dictionary["matchCard"];
  matches: NormalizedMatch[];
  statusDictionary: Dictionary["status"];
}

interface LocalizedMatch {
  dateKey: string;
  dateLabel: string;
  match: NormalizedMatch;
  sortValue: number;
  timeLabel: string;
  timeZoneLabel: string;
}

interface ScheduleDay {
  dateKey: string;
  dateLabel: string;
  matches: LocalizedMatch[];
}

function groupMatchesByLocalDay(
  matches: NormalizedMatch[],
  timeZone: string,
  languageTag: string,
  dateTimeDictionary: Dictionary["dateTime"],
): ScheduleDay[] {
  const groupedMatches = new Map<string, ScheduleDay>();

  for (const match of matches) {
    const localizedMatch: LocalizedMatch = {
      dateKey: getLocalMatchDateKey(match, timeZone),
      dateLabel: formatLocalMatchDate(
        match,
        timeZone,
        languageTag,
        dateTimeDictionary.dateTbd,
      ),
      match,
      sortValue: getMatchKickoffSortValue(match),
      timeLabel: formatLocalMatchTime(
        match,
        timeZone,
        languageTag,
        dateTimeDictionary.timeTbd,
      ),
      timeZoneLabel: formatMatchTimeZone(match, timeZone),
    };

    const section = groupedMatches.get(localizedMatch.dateKey);

    if (section) {
      section.matches.push(localizedMatch);
    } else {
      groupedMatches.set(localizedMatch.dateKey, {
        dateKey: localizedMatch.dateKey,
        dateLabel: localizedMatch.dateLabel,
        matches: [localizedMatch],
      });
    }
  }

  return Array.from(groupedMatches.values())
    .sort((first, second) => first.dateKey.localeCompare(second.dateKey))
    .map((section) => ({
      ...section,
      matches: section.matches.sort((first, second) => first.sortValue - second.sortValue),
    }));
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

export default function ScheduleSections({
  dateTimeDictionary,
  dictionary,
  languageTag,
  locale,
  matchCardDictionary,
  matches,
  statusDictionary,
}: ScheduleSectionsProps) {
  const timeZone = useSyncExternalStore(
    subscribeToTimeZoneChange,
    getBrowserTimeZone,
    getServerTimeZone,
  );

  const scheduleDays = useMemo(
    () => groupMatchesByLocalDay(matches, timeZone, languageTag, dateTimeDictionary),
    [dateTimeDictionary, languageTag, matches, timeZone],
  );

  return (
    <section aria-label={dictionary.ariaLabel} className="space-y-8">
      <div className="flex flex-col gap-2 border-b border-slate-900 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">
            {dictionary.scheduleByDay}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {dictionary.kickoffTimesUse} {timeZone}
          </p>
        </div>
        <span className="w-fit rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase text-emerald-200">
          {dictionary.localTime}
        </span>
      </div>

      <div className="space-y-10">
        {scheduleDays.map((section) => (
          <section key={section.dateKey} className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-semibold text-slate-50">{section.dateLabel}</h3>
              <span className="rounded-full border border-slate-800 px-3 py-1 text-xs font-medium text-slate-400">
                {section.matches.length}{" "}
                {section.matches.length === 1
                  ? dictionary.matchSingular
                  : dictionary.matchPlural}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {section.matches.map((localizedMatch) => (
                <MatchCard
                  dictionary={matchCardDictionary}
                  href={getLocalizedPath(locale, `/match/${localizedMatch.match.id}`)}
                  key={localizedMatch.match.id}
                  match={localizedMatch.match}
                  statusDictionary={statusDictionary}
                  dateLabel={localizedMatch.dateLabel}
                  timeLabel={localizedMatch.timeLabel}
                  timeZoneLabel={localizedMatch.timeZoneLabel}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
