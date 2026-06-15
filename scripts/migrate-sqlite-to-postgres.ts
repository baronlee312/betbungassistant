import { PrismaClient as SQLiteClient } from '@prisma/client-sqlite';
import { PrismaClient as PostgresClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const sqlite = new SQLiteClient();
const postgres = new PostgresClient();

async function main() {
  console.log('Starting migration from SQLite to PostgreSQL...');

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:')) {
    console.error('ERROR: DATABASE_URL is not configured for PostgreSQL (Supabase) in your .env file!');
    console.error('Please configure your Supabase connection strings first.');
    process.exit(1);
  }

  // 1. Truncate tables on Postgres to avoid duplicates
  console.log('Truncating tables on PostgreSQL (Supabase)...');
  await postgres.$executeRawUnsafe(`TRUNCATE TABLE "Match" CASCADE`);
  await postgres.$executeRawUnsafe(`TRUNCATE TABLE "Team" CASCADE`);
  await postgres.$executeRawUnsafe(`TRUNCATE TABLE "FifaRanking" CASCADE`);

  // 2. Migrate Teams
  console.log('Fetching teams from SQLite...');
  const teams = await sqlite.team.findMany();
  console.log(`Found ${teams.length} teams. Migrating to PostgreSQL...`);
  if (teams.length > 0) {
    await postgres.team.createMany({
      data: teams.map(team => ({
        id: team.id,
        sofascoreId: team.sofascoreId,
        name: team.name,
        shortName: team.shortName,
        crestUrl: team.crestUrl,
      }))
    });
    console.log('Teams migrated successfully.');
  }

  // 3. Migrate Matches
  console.log('Fetching matches from SQLite...');
  const matches = await sqlite.match.findMany();
  console.log(`Found ${matches.length} matches. Migrating to PostgreSQL...`);
  if (matches.length > 0) {
    const chunkSize = 500;
    for (let i = 0; i < matches.length; i += chunkSize) {
      const chunk = matches.slice(i, i + chunkSize);
      await postgres.match.createMany({
        data: chunk.map(match => ({
          id: match.id,
          sofascoreId: match.sofascoreId,
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
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
      console.log(`Migrated matches ${i + 1} to ${Math.min(i + chunkSize, matches.length)}`);
    }
    console.log('Matches migrated successfully.');
  }

  // 4. Migrate Fifa Rankings
  console.log('Fetching FIFA Rankings from SQLite...');
  const rankings = await sqlite.fifaRanking.findMany();
  console.log(`Found ${rankings.length} rankings. Migrating to PostgreSQL...`);
  if (rankings.length > 0) {
    await postgres.fifaRanking.createMany({
      data: rankings.map(r => ({
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
    console.log('FIFA Rankings migrated successfully.');
  }

  // 5. Reset PostgreSQL auto-increment sequences
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
