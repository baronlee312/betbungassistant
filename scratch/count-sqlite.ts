import { PrismaClient as SQLiteClient } from '@prisma/client-sqlite';

async function main() {
  const sqlite = new SQLiteClient();
  const rankingCount = await sqlite.fifaRanking.count();
  const matchCount = await sqlite.match.count();
  const finishedMatchCount = await sqlite.match.count({ where: { status: "FINISHED" } });
  const statsMatchCount = await sqlite.match.count({
    where: {
      status: "FINISHED",
      homeShots: { not: null }
    }
  });
  
  console.log(`--- SQLITE STATUS ---`);
  console.log(`Total FifaRankings: ${rankingCount}`);
  console.log(`Total Matches: ${matchCount}`);
  console.log(`Finished Matches: ${finishedMatchCount}`);
  console.log(`Finished Matches with Stats: ${statsMatchCount}`);
  
  await sqlite.$disconnect();
}

main().catch(console.error);
