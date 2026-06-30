import type { NormalizedMatch } from "@/lib/thesportsdb-types";

export const DEFAULT_VIEWER_TIME_ZONE = "UTC";
const DEFAULT_LANGUAGE_TAG = "en-US";

const EXPLICIT_TIME_ZONE_PATTERN = /(?:z|[+-]\d{2}:?\d{2})$/i;

export interface StatusLabels {
  result: string;
  scheduled: string;
  matchFinished: string;
}

export interface VenueSideLabels {
  home: string;
  away: string;
  neutral: string;
}

export function formatMatchDate(
  date: string | null,
  languageTag = DEFAULT_LANGUAGE_TAG,
  fallback = "Date TBD",
): string {
  if (!date) {
    return fallback;
  }

  const [year, month, day] = date.split("-").map(Number);

  if (!year || !month || !day) {
    return date;
  }

  return new Intl.DateTimeFormat(languageTag, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    weekday: "short",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatMatchTime(time: string | null, fallback = "Time TBD"): string {
  if (!time || time === "00:00:00") {
    return fallback;
  }

  return time.replace("Z", "").slice(0, 5);
}

function createDateFromDateAndTime(
  date: string | null,
  time: string | null,
): Date | null {
  if (!date) {
    return null;
  }

  const fallbackTime = time && time !== "00:00:00" ? time.replace("Z", "") : "00:00:00";
  const parsed = new Date(`${date}T${fallbackTime}Z`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getMatchKickoffDate(match: NormalizedMatch): Date | null {
  if (match.timestamp) {
    const timestamp = match.timestamp.trim();
    const timestampWithZone = EXPLICIT_TIME_ZONE_PATTERN.test(timestamp)
      ? timestamp
      : `${timestamp}Z`;
    const parsed = new Date(timestampWithZone);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return createDateFromDateAndTime(match.date, match.time);
}

export function getMatchKickoffSortValue(match: NormalizedMatch): number {
  return getMatchKickoffDate(match)?.getTime() ?? Number.MAX_SAFE_INTEGER;
}

function formatDateParts(
  date: Date,
  timeZone: string,
): Record<string, string | undefined> {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "2-digit",
      timeZone,
      year: "numeric",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
}

export function getLocalMatchDateKey(
  match: NormalizedMatch,
  timeZone = DEFAULT_VIEWER_TIME_ZONE,
): string {
  const kickoffDate = getMatchKickoffDate(match);

  if (!kickoffDate) {
    return match.date ?? "9999-99-99";
  }

  const parts = formatDateParts(kickoffDate, timeZone);
  return `${parts.year ?? "9999"}-${parts.month ?? "99"}-${parts.day ?? "99"}`;
}

export function formatLocalMatchDate(
  match: NormalizedMatch,
  timeZone = DEFAULT_VIEWER_TIME_ZONE,
  languageTag = DEFAULT_LANGUAGE_TAG,
  fallback = "Date TBD",
): string {
  const kickoffDate = getMatchKickoffDate(match);

  if (!kickoffDate) {
    return formatMatchDate(match.date, languageTag, fallback);
  }

  return new Intl.DateTimeFormat(languageTag, {
    day: "numeric",
    month: "short",
    timeZone,
    weekday: "short",
    year: "numeric",
  }).format(kickoffDate);
}

export function formatLocalMatchTime(
  match: NormalizedMatch,
  timeZone = DEFAULT_VIEWER_TIME_ZONE,
  languageTag = DEFAULT_LANGUAGE_TAG,
  fallback = "Time TBD",
): string {
  const kickoffDate = getMatchKickoffDate(match);

  if (!kickoffDate) {
    return formatMatchTime(match.time, fallback);
  }

  return new Intl.DateTimeFormat(languageTag, {
    hour: "2-digit",
    hour12: false,
    hourCycle: "h23",
    minute: "2-digit",
    timeZone,
  }).format(kickoffDate);
}

export function formatMatchTimeZone(
  match: NormalizedMatch,
  timeZone = DEFAULT_VIEWER_TIME_ZONE,
): string {
  const kickoffDate = getMatchKickoffDate(match);

  if (!kickoffDate) {
    return timeZone;
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(kickoffDate);

  return parts.find((part) => part.type === "timeZoneName")?.value ?? timeZone;
}

export function formatScoreline(match: NormalizedMatch): string | null {
  if (match.homeTeam.score === null || match.awayTeam.score === null) {
    return null;
  }

  if (
    match.homePenaltyScore !== null &&
    match.homePenaltyScore !== undefined &&
    match.awayPenaltyScore !== null &&
    match.awayPenaltyScore !== undefined
  ) {
    return `${match.homeTeam.score}-${match.awayTeam.score} (${match.homePenaltyScore}-${match.awayPenaltyScore})`;
  }

  return `${match.homeTeam.score}-${match.awayTeam.score}`;
}

export function getStatusLabel(
  match: NormalizedMatch,
  labels: StatusLabels = {
    matchFinished: "Match Finished",
    result: "Result",
    scheduled: "Scheduled",
  },
): string {
  if (match.progress) {
    return match.progress;
  }

  if (match.status && match.status !== "Not Started") {
    if (match.status === "Match Finished") {
      return labels.matchFinished;
    }

    return match.status;
  }

  return formatScoreline(match) ? labels.result : labels.scheduled;
}

export function getOpponentName(
  match: NormalizedMatch,
  teamId: string | null,
  fallback = "Opponent TBD",
): string {
  if (!teamId) {
    return fallback;
  }

  return match.homeTeam.id === teamId ? match.awayTeam.name : match.homeTeam.name;
}

export function getVenueSide(
  match: NormalizedMatch,
  teamId: string | null,
  labels: VenueSideLabels = {
    away: "Away",
    home: "Home",
    neutral: "Neutral",
  },
): string {
  if (!teamId) {
    return labels.neutral;
  }

  return match.homeTeam.id === teamId ? labels.home : labels.away;
}

export function getTeamOutcome(
  match: NormalizedMatch,
  teamId: string | null,
): "W" | "D" | "L" | null {
  if (!teamId || match.homeTeam.score === null || match.awayTeam.score === null) {
    return null;
  }

  const isHomeTeam = match.homeTeam.id === teamId;
  const teamScore = isHomeTeam ? match.homeTeam.score : match.awayTeam.score;
  const opponentScore = isHomeTeam ? match.awayTeam.score : match.homeTeam.score;

  if (teamScore === opponentScore) {
    if (
      match.homePenaltyScore !== null &&
      match.homePenaltyScore !== undefined &&
      match.awayPenaltyScore !== null &&
      match.awayPenaltyScore !== undefined
    ) {
      const teamPenalty = isHomeTeam ? match.homePenaltyScore : match.awayPenaltyScore;
      const opponentPenalty = isHomeTeam ? match.awayPenaltyScore : match.homePenaltyScore;
      return teamPenalty > opponentPenalty ? "W" : "L";
    }
    return "D";
  }

  return teamScore > opponentScore ? "W" : "L";
}
