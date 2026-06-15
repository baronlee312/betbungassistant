import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const matches = await prisma.match.findMany({
    include: {
      homeTeam: true,
      awayTeam: true
    },
    orderBy: { date: "asc" }
  });

  console.log(`Total matches in DB: ${matches.length}`);
  console.log("Match List:");
  for (const m of matches) {
    console.log(`- ID: ${m.sofascoreId} | ${m.date.toISOString().split('T')[0]} | ${m.homeTeam.name} vs ${m.awayTeam.name} | Status: ${m.status} | Score: ${m.homeScore}-${m.awayScore} | HasStatsJson: ${m.statisticsJson !== null}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
