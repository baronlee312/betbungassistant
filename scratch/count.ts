import { prisma } from "../lib/prisma";

async function main() {
  const rankingCount = await prisma.fifaRanking.count();
  const matchCount = await prisma.match.count();
  const finishedMatchCount = await prisma.match.count({ where: { status: "FINISHED" } });
  const statsMatchCount = await prisma.match.count({
    where: {
      status: "FINISHED",
      homeShots: { not: null }
    }
  });
  
  console.log(`--- DB STATUS ---`);
  console.log(`Total FifaRankings: ${rankingCount}`);
  console.log(`Total Matches: ${matchCount}`);
  console.log(`Finished Matches: ${finishedMatchCount}`);
  console.log(`Finished Matches with Stats: ${statsMatchCount}`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
