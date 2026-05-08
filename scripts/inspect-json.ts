import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const match = await prisma.match.findFirst({
    where: {
      statisticsJson: { not: null }
    }
  });

  if (match) {
    console.log(`--- Match ID: ${match.id} ---`);
    console.log(match.statisticsJson);
  } else {
    console.log("No match with statisticsJson found.");
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
