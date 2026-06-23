import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const matches = await prisma.match.findMany({
    where: {
      status: "FINISHED",
      statisticsJson: { not: null }
    },
    take: 5
  });

  for (const m of matches) {
    console.log(`\nMatch: ${m.sofascoreId} (${m.league})`);
    if (!m.statisticsJson) continue;
    const stats = JSON.parse(m.statisticsJson);
    console.log("Periods available:", stats.map((p: any) => p.period));
    // Let's print the items in the "Match overview" group for the "1ST" period
    const firstPeriod = stats.find((p: any) => p.period === "1ST");
    if (firstPeriod) {
      console.log("1ST period groups:");
      for (const g of firstPeriod.groups) {
        console.log(`  Group: ${g.groupName}`);
        console.log(`    Items: ${g.statisticsItems.map((i: any) => i.name).join(", ")}`);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
