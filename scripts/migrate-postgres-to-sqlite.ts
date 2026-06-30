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
  console.log('🔄 Starting sync from PostgreSQL (Supabase) to SQLite (local dev.db)...');

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:')) {
    console.error('ERROR: DATABASE_URL in .env is not configured for PostgreSQL.');
    process.exit(1);
  }

  // 1. Fetch all data from Postgres
  console.log('Fetching teams from PostgreSQL...');
  const pgTeams = await postgres.team.findMany();
  console.log(`Found ${pgTeams.length} teams in PostgreSQL.`);

  console.log('Fetching matches from PostgreSQL in chunks...');
  const pgMatches: any[] = [];
  const fetchChunkSize = 200;
  let skip = 0;
  while (true) {
    console.log(`  Fetching matches (skip=${skip}, take=${fetchChunkSize})...`);
    const chunk = await postgres.match.findMany({
      take: fetchChunkSize,
      skip: skip,
      orderBy: { id: "asc" }
    });
    if (chunk.length === 0) break;
    pgMatches.push(...chunk);
    skip += fetchChunkSize;
  }
  console.log(`Found ${pgMatches.length} matches in PostgreSQL.`);

  console.log('Fetching FIFA rankings from PostgreSQL...');
  const pgRankings = await postgres.fifaRanking.findMany();
  console.log(`Found ${pgRankings.length} rankings in PostgreSQL.`);

  // 2. Clear SQLite tables to prevent unique constraint violations
  console.log('Clearing local SQLite tables...');
  await sqlite.match.deleteMany({});
  await sqlite.team.deleteMany({});
  await sqlite.fifaRanking.deleteMany({});

  // 3. Insert teams into SQLite
  if (pgTeams.length > 0) {
    console.log('Syncing teams to SQLite...');
    await sqlite.team.createMany({
      data: pgTeams.map(t => ({
        id: t.id,
        sofascoreId: t.sofascoreId,
        name: t.name,
        shortName: t.shortName,
        crestUrl: t.crestUrl,
      }))
    });
  }

  // 4. Insert matches into SQLite
  if (pgMatches.length > 0) {
    console.log('Syncing matches to SQLite...');
    const chunkSize = 500;
    for (let i = 0; i < pgMatches.length; i += chunkSize) {
      const chunk = pgMatches.slice(i, i + chunkSize);
      await sqlite.match.createMany({
        data: chunk.map(m => ({
          id: m.id,
          sofascoreId: m.sofascoreId,
          homeTeamId: m.homeTeamId,
          awayTeamId: m.awayTeamId,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          homePenaltyScore: m.homePenaltyScore,
          awayPenaltyScore: m.awayPenaltyScore,
          date: m.date,
          time: m.time,
          status: m.status,
          league: m.league,
          season: m.season,
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
        }))
      });
      console.log(`Synced matches ${i + 1} to ${Math.min(i + chunkSize, pgMatches.length)}`);
    }
  }

  // 5. Insert rankings into SQLite
  if (pgRankings.length > 0) {
    console.log('Syncing FIFA rankings to SQLite...');
    await sqlite.fifaRanking.createMany({
      data: pgRankings.map(r => ({
        id: r.id,
        rank: r.rank,
        teamName: r.teamName,
        points: r.points,
        flagUrl: r.flagUrl,
        previousPoints: r.previousPoints,
        change: r.change,
        lastUpdated: r.lastUpdated,
      }))
    });
  }

  console.log('✅ Sync completed successfully!');
}

main()
  .catch(e => {
    console.error('❌ Sync failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await sqlite.$disconnect();
    await postgres.$disconnect();
  });
