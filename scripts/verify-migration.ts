import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const matches = await prisma.match.findMany({
    where: {
      statisticsJson: { not: null },
      homeShots: { not: null }
    },
    take: 5,
    include: {
      homeTeam: true,
      awayTeam: true
    }
  });

  console.log(`Found ${matches.length} matches with migrated data.`);
  
  matches.forEach(m => {
    console.log(`--- Match: ${m.homeTeam.name} vs ${m.awayTeam.name} (${m.sofascoreId}) ---`);
    console.log(`Shots: ${m.homeShots} - ${m.awayShots}`);
    console.log(`Shots on Target: ${m.homeShotsOnTarget} - ${m.awayShotsOnTarget}`);
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
