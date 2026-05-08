import type {
  NormalizedMatch,
  TeamRecentEventsPayload,
} from "@/lib/thesportsdb-types";
import { prisma } from "./prisma";

export const WORLD_CUP_LEAGUE_ID = "4429";
export const WORLD_CUP_SEASON = "2026";
export const FREE_TIER_SCHEDULE_LIMIT = 64; // Can be full WC length now
export const FREE_TIER_RECENT_EVENTS_LIMIT = 15; // Increased to 15!
export const FREE_TIER_LIMIT_REASON = "";

function normalizeDbMatch(match: any): NormalizedMatch {
  const dateObj = match.date;
  const dateStr = dateObj.toISOString().split("T")[0];
  const timeStr = match.time || "00:00:00";

  return {
    id: match.sofascoreId?.toString() || match.id.toString(),
    name: `${match.homeTeam.shortName || match.homeTeam.name} vs ${match.awayTeam.shortName || match.awayTeam.name}`,
    league: match.league,
    season: match.season,
    date: dateStr,
    time: timeStr,
    timestamp: dateObj.toISOString(),
    venue: null,
    country: null,
    status: match.status,
    progress: match.status === "FINISHED" ? "Ended" : null,
    homeTeam: {
      id: match.homeTeam.sofascoreId?.toString() || match.homeTeam.id.toString(),
      name: match.homeTeam.name,
      score: match.homeScore,
      crestUrl: match.homeTeam.crestUrl,
    },
    awayTeam: {
      id: match.awayTeam.sofascoreId?.toString() || match.awayTeam.id.toString(),
      name: match.awayTeam.name,
      score: match.awayScore,
      crestUrl: match.awayTeam.crestUrl,
    },
    statistics: {
      possession: { home: match.homePossession ?? null, away: match.awayPossession ?? null },
      shots: { home: match.homeShots ?? null, away: match.awayShots ?? null },
      shotsOnTarget: { home: match.homeShotsOnTarget ?? null, away: match.awayShotsOnTarget ?? null },
      corners: { home: match.homeCorners ?? null, away: match.awayCorners ?? null },
      fouls: { home: match.homeFouls ?? null, away: match.awayFouls ?? null },
      yellowCards: { home: match.homeYellowCards ?? null, away: match.awayYellowCards ?? null },
      redCards: { home: match.homeRedCards ?? null, away: match.awayRedCards ?? null },
      offsides: { home: match.homeOffsides ?? null, away: match.awayOffsides ?? null },
      saves: { home: match.homeSaves ?? null, away: match.awaySaves ?? null },
    },
  };
}

export async function getWorldCupSchedule(): Promise<NormalizedMatch[]> {
  try {
    const matches = await prisma.match.findMany({
      where: {
        league: "FIFA World Cup 2026",
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    return matches.map(normalizeDbMatch).slice(0, FREE_TIER_SCHEDULE_LIMIT);
  } catch (e) {
    console.error("Failed to load WC schedule", e);
    return [];
  }
}

export async function getEventById(matchId: string): Promise<NormalizedMatch | null> {
  try {
    const parsedId = parseInt(matchId, 10);
    const match = await prisma.match.findFirst({
      where: {
        OR: [
          { sofascoreId: parsedId || -1 },
          { id: parsedId || -1 },
        ]
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    if (!match) return null;
    return normalizeDbMatch(match);
  } catch (e) {
    console.error("Failed to load match by id", e);
    return null;
  }
}

export async function getTeamRecentEvents(teamId: string): Promise<NormalizedMatch[]> {
  try {
    const parsedId = parseInt(teamId, 10);
    if (!parsedId) return [];

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { homeTeam: { sofascoreId: parsedId } },
          { awayTeam: { sofascoreId: parsedId } },
          { homeTeam: { id: parsedId } },
          { awayTeam: { id: parsedId } },
        ],
        status: "FINISHED"
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: {
        date: "desc",
      },
      take: FREE_TIER_RECENT_EVENTS_LIMIT,
    });

    return matches.map(normalizeDbMatch);
  } catch (e) {
    console.error("Failed to load recent events", e);
    return [];
  }
}

export function createTeamRecentEventsPayload(
  teamId: string | null,
  teamName: string,
  events: NormalizedMatch[],
  freeTierLimitReason = FREE_TIER_LIMIT_REASON,
  missingTeamReason = "TheSportsDB did not include a team ID for this fixture.",
): TeamRecentEventsPayload {
  return {
    teamId,
    teamName,
    events,
    hasMore: false,
    nextCursor: null,
    limitReason: "", // Empty since we have local data now
  };
}
