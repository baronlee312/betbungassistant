import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const matches = await prisma.match.findMany({
    where: {
      status: "FINISHED"
    },
    take: 5,
    include: {
      homeTeam: true,
      awayTeam: true
    }
  });

  console.log(`Found ${matches.length} finished matches.`);
  
  matches.forEach(m => {
    console.log(`--- Match: ${m.homeTeam.name} vs ${m.awayTeam.name} (${m.sofascoreId}) ---`);
    console.log(`Shots: ${m.homeShots} - ${m.awayShots}`);
    console.log(`Shots on Target: ${m.homeShotsOnTarget} - ${m.awayShotsOnTarget}`);
    console.log(`Corners: ${m.homeCorners} - ${m.awayCorners}`);
    console.log(`Possession: ${m.homePossession}% - ${m.awayPossession}%`);
    if (m.statisticsJson) {
        console.log("Statistics JSON exists");
    } else {
        console.log("Statistics JSON is EMPTY");
    }
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
