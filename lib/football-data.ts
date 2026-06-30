import type { NormalizedMatch } from "@/lib/thesportsdb-types";
import { prisma } from "./prisma";

export async function getFootballDataTeamMatches(teamName: string): Promise<NormalizedMatch[]> {
  try {
    // Find the team in DB by name or shortName
    const team = await prisma.team.findFirst({
      where: {
        OR: [
          { name: { contains: teamName } },
          { shortName: { contains: teamName } },
        ],
      },
    });

    if (!team) return [];

    // Fetch past matches where this team was playing
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { homeTeamId: team.id },
          { awayTeamId: team.id },
        ],
        status: "FINISHED", // Only past matches
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: {
        date: "desc",
      },
      take: 15, // Get up to 15 past matches
    });

    return matches.map((match) => {
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
        progress: "Ended",
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
        homePenaltyScore: match.homePenaltyScore,
        awayPenaltyScore: match.awayPenaltyScore,
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
    });
  } catch (error) {
    console.error("Failed to fetch matches from DB:", error);
    return [];
  }
}
