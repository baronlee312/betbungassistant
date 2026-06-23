import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const matches = await prisma.match.findMany({
    where: {
      league: "FIFA World Cup 2026"
    },
    include: {
      homeTeam: true,
      awayTeam: true
    },
    orderBy: { date: "asc" }
  });

  const finished = matches.filter(m => m.status === "FINISHED");
  console.log(`Total WC 2026 matches: ${matches.length}`);
  console.log(`Finished WC 2026 matches: ${finished.length}`);
  console.log(`Finished matches with statsJson: ${finished.filter(m => m.statisticsJson !== null).length}`);

  console.log("\nFinished matches list:");
  for (const m of finished) {
    console.log(`- ID: ${m.sofascoreId} | ${m.date.toISOString().split('T')[0]} | ${m.homeTeam.name} vs ${m.awayTeam.name} | Score: ${m.homeScore}-${m.awayScore}`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
