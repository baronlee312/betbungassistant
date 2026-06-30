import { PrismaClient as SQLiteClient } from '@prisma/client-sqlite';
import { PrismaClient as PostgresClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const sqlite = new SQLiteClient();
const postgres = new PostgresClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('Starting safe diff-based migration from SQLite to PostgreSQL...');

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:')) {
    console.error('ERROR: DATABASE_URL is not configured for PostgreSQL (Supabase) in your .env file!');
    console.error('Please configure your Supabase connection strings first.');
    process.exit(1);
  }

  // 1. Migrate Teams
  console.log('Fetching teams from SQLite...');
  const sqliteTeams = await sqlite.team.findMany();
  console.log('Fetching teams from PostgreSQL...');
  const pgTeams = await postgres.team.findMany();
  const pgTeamsMap = new Map(pgTeams.map(t => [t.id, t]));

  const teamsToCreate: any[] = [];
  const teamsToUpdate: any[] = [];

  for (const sTeam of sqliteTeams) {
    const pgTeam = pgTeamsMap.get(sTeam.id);
    if (!pgTeam) {
      teamsToCreate.push(sTeam);
    } else if (
      pgTeam.name !== sTeam.name ||
      pgTeam.shortName !== sTeam.shortName ||
      pgTeam.crestUrl !== sTeam.crestUrl ||
      pgTeam.sofascoreId !== sTeam.sofascoreId
    ) {
      teamsToUpdate.push(sTeam);
    }
  }

  if (teamsToCreate.length > 0) {
    console.log(`Inserting ${teamsToCreate.length} new teams to PostgreSQL...`);
    await postgres.team.createMany({
      data: teamsToCreate.map(team => ({
        id: team.id,
        sofascoreId: team.sofascoreId,
        name: team.name,
        shortName: team.shortName,
        crestUrl: team.crestUrl,
      }))
    });
  }
  if (teamsToUpdate.length > 0) {
    console.log(`Updating ${teamsToUpdate.length} teams in PostgreSQL...`);
    for (const team of teamsToUpdate) {
      await postgres.team.update({
        where: { id: team.id },
        data: {
          name: team.name,
          shortName: team.shortName,
          crestUrl: team.crestUrl,
          sofascoreId: team.sofascoreId
        }
      });
    }
  }

  // Delete orphaned teams in PostgreSQL
  const sqliteTeamIds = new Set(sqliteTeams.map(t => t.id));
  const pgTeamsToDelete = pgTeams.filter(t => !sqliteTeamIds.has(t.id));
  if (pgTeamsToDelete.length > 0) {
    console.log(`Deleting ${pgTeamsToDelete.length} orphaned teams from PostgreSQL...`);
    await postgres.team.deleteMany({
      where: { id: { in: pgTeamsToDelete.map(t => t.id) } }
    });
  }
  console.log('Teams migration complete.');

  // 2. Migrate Matches
  console.log('Fetching matches from SQLite...');
  const sqliteMatches = await sqlite.match.findMany();
  console.log('Fetching matches from PostgreSQL...');
  const pgMatches = await postgres.match.findMany();
  const pgMatchesMap = new Map(pgMatches.map(m => [m.id, m]));

  const matchesToCreate: any[] = [];
  const matchesToUpdate: any[] = [];

  for (const sMatch of sqliteMatches) {
    const pgMatch = pgMatchesMap.get(sMatch.id);
    if (!pgMatch) {
      matchesToCreate.push(sMatch);
    } else if (
      pgMatch.homeScore !== sMatch.homeScore ||
      pgMatch.awayScore !== sMatch.awayScore ||
      pgMatch.homePenaltyScore !== sMatch.homePenaltyScore ||
      pgMatch.awayPenaltyScore !== sMatch.awayPenaltyScore ||
      pgMatch.status !== sMatch.status ||
      pgMatch.homePossession !== sMatch.homePossession ||
      pgMatch.awayPossession !== sMatch.awayPossession ||
      pgMatch.homeShots !== sMatch.homeShots ||
      pgMatch.awayShots !== sMatch.awayShots ||
      pgMatch.homeShotsOnTarget !== sMatch.homeShotsOnTarget ||
      pgMatch.awayShotsOnTarget !== sMatch.awayShotsOnTarget ||
      pgMatch.homeCorners !== sMatch.homeCorners ||
      pgMatch.awayCorners !== sMatch.awayCorners ||
      pgMatch.homeFouls !== sMatch.homeFouls ||
      pgMatch.awayFouls !== sMatch.awayFouls ||
      pgMatch.homeYellowCards !== sMatch.homeYellowCards ||
      pgMatch.awayYellowCards !== sMatch.awayYellowCards ||
      pgMatch.homeRedCards !== sMatch.homeRedCards ||
      pgMatch.awayRedCards !== sMatch.awayRedCards ||
      pgMatch.homeOffsides !== sMatch.homeOffsides ||
      pgMatch.awayOffsides !== sMatch.awayOffsides ||
      pgMatch.homeSaves !== sMatch.homeSaves ||
      pgMatch.awaySaves !== sMatch.awaySaves ||
      pgMatch.statisticsJson !== sMatch.statisticsJson ||
      pgMatch.time !== sMatch.time ||
      pgMatch.date.getTime() !== sMatch.date.getTime()
    ) {
      matchesToUpdate.push(sMatch);
    }
  }

  if (matchesToCreate.length > 0) {
    console.log(`Inserting ${matchesToCreate.length} new matches to PostgreSQL...`);
    const chunkSize = 500;
    for (let i = 0; i < matchesToCreate.length; i += chunkSize) {
      const chunk = matchesToCreate.slice(i, i + chunkSize);
      await postgres.match.createMany({
        data: chunk.map(match => ({
          id: match.id,
          sofascoreId: match.sofascoreId,
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          homePenaltyScore: match.homePenaltyScore,
          awayPenaltyScore: match.awayPenaltyScore,
          date: new Date(match.date),
          time: match.time,
          status: match.status,
          league: match.league,
          season: match.season,
          homePossession: match.homePossession,
          awayPossession: match.awayPossession,
          homeShots: match.homeShots,
          awayShots: match.awayShots,
          homeShotsOnTarget: match.homeShotsOnTarget,
          awayShotsOnTarget: match.awayShotsOnTarget,
          homeCorners: match.homeCorners,
          awayCorners: match.awayCorners,
          homeFouls: match.homeFouls,
          awayFouls: match.awayFouls,
          homeYellowCards: match.homeYellowCards,
          awayYellowCards: match.awayYellowCards,
          homeRedCards: match.homeRedCards,
          awayRedCards: match.awayRedCards,
          homeOffsides: match.homeOffsides,
          awayOffsides: match.awayOffsides,
          homeSaves: match.homeSaves,
          awaySaves: match.awaySaves,
          statisticsJson: match.statisticsJson,
        }))
      });
      console.log(`Migrated matches ${i + 1} to ${Math.min(i + chunkSize, matchesToCreate.length)}`);
    }
  }

  if (matchesToUpdate.length > 0) {
    console.log(`Updating ${matchesToUpdate.length} matches in PostgreSQL...`);
    for (const m of matchesToUpdate) {
      await postgres.match.update({
        where: { id: m.id },
        data: {
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          homePenaltyScore: m.homePenaltyScore,
          awayPenaltyScore: m.awayPenaltyScore,
          status: m.status,
          time: m.time,
          date: new Date(m.date),
          homePossession: m.homePossession,
          awayPossession: m.awayPossession,
          homeShots: m.homeShots,
          awayShots: m.awayShots,
          homeShotsOnTarget: m.homeShotsOnTarget,
          awayShotsOnTarget: m.awayShotsOnTarget,
          homeCorners: m.homeCorners,
          awayCorners: m.awayCorners,
          homeFouls: m.homeFouls,
          awayFouls: m.awayFouls,
          homeYellowCards: m.homeYellowCards,
          awayYellowCards: m.awayYellowCards,
          homeRedCards: m.homeRedCards,
          awayRedCards: m.awayRedCards,
          homeOffsides: m.homeOffsides,
          awayOffsides: m.awayOffsides,
          homeSaves: m.homeSaves,
          awaySaves: m.awaySaves,
          statisticsJson: m.statisticsJson,
        }
      });
    }
  }

  // Delete orphaned matches in PostgreSQL
  const sqliteMatchIds = new Set(sqliteMatches.map(m => m.id));
  const pgMatchesToDelete = pgMatches.filter(m => !sqliteMatchIds.has(m.id));
  if (pgMatchesToDelete.length > 0) {
    console.log(`Deleting ${pgMatchesToDelete.length} orphaned matches from PostgreSQL...`);
    await postgres.match.deleteMany({
      where: { id: { in: pgMatchesToDelete.map(m => m.id) } }
    });
  }
  console.log('Matches migration complete.');

  // 3. Migrate Fifa Rankings
  console.log('Fetching FIFA Rankings from SQLite...');
  const sqliteRankings = await sqlite.fifaRanking.findMany();
  console.log('Fetching FIFA Rankings from PostgreSQL...');
  const pgRankings = await postgres.fifaRanking.findMany();
  const pgRankingsMap = new Map(pgRankings.map(r => [r.teamName, r]));

  const rankingsToCreate: any[] = [];
  const rankingsToUpdate: any[] = [];

  for (const sRank of sqliteRankings) {
    const pgRank = pgRankingsMap.get(sRank.teamName);
    if (!pgRank) {
      rankingsToCreate.push(sRank);
    } else if (
      pgRank.rank !== sRank.rank ||
      pgRank.points !== sRank.points ||
      pgRank.flagUrl !== sRank.flagUrl ||
      pgRank.previousPoints !== sRank.previousPoints ||
      pgRank.change !== sRank.change
    ) {
      rankingsToUpdate.push(sRank);
    }
  }

  if (rankingsToCreate.length > 0) {
    console.log(`Inserting ${rankingsToCreate.length} new FIFA rankings to PostgreSQL...`);
    await postgres.fifaRanking.createMany({
      data: rankingsToCreate.map(r => ({
        id: r.id,
        rank: r.rank,
        teamName: r.teamName,
        points: r.points,
        flagUrl: r.flagUrl,
        previousPoints: r.previousPoints,
        change: r.change,
        lastUpdated: new Date(r.lastUpdated),
      }))
    });
  }

  if (rankingsToUpdate.length > 0) {
    console.log(`Updating ${rankingsToUpdate.length} FIFA rankings in PostgreSQL...`);
    for (const r of rankingsToUpdate) {
      await postgres.fifaRanking.update({
        where: { teamName: r.teamName },
        data: {
          rank: r.rank,
          points: r.points,
          flagUrl: r.flagUrl,
          previousPoints: r.previousPoints,
          change: r.change,
          lastUpdated: new Date(r.lastUpdated),
        }
      });
    }
  }

  // Delete orphaned FIFA rankings in PostgreSQL
  const sqliteRankingTeamNames = new Set(sqliteRankings.map(r => r.teamName));
  const pgRankingsToDelete = pgRankings.filter(r => !sqliteRankingTeamNames.has(r.teamName));
  if (pgRankingsToDelete.length > 0) {
    console.log(`Deleting ${pgRankingsToDelete.length} orphaned FIFA rankings from PostgreSQL...`);
    await postgres.fifaRanking.deleteMany({
      where: { teamName: { in: pgRankingsToDelete.map(r => r.teamName) } }
    });
  }
  console.log('FIFA Rankings migration complete.');

  // 4. Reset PostgreSQL auto-increment sequences
  console.log('Resetting database primary key serial sequences on PostgreSQL...');
  await postgres.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Team"', 'id'), coalesce(max(id), 1)) FROM "Team"`);
  await postgres.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Match"', 'id'), coalesce(max(id), 1)) FROM "Match"`);
  await postgres.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"FifaRanking"', 'id'), coalesce(max(id), 1)) FROM "FifaRanking"`);
  console.log('Sequences reset successfully.');

  console.log('Migration completed successfully!');
}

main()
  .catch(e => {
    console.error('Migration failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await sqlite.$disconnect();
    await postgres.$disconnect();
  });
