import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function extractStat(statsData: any, key: string) {
  if (!statsData || !statsData.length) return { home: null, away: null };
  const allPeriod = statsData.find((p: any) => p.period === "ALL") || statsData[0];
  if (!allPeriod || !allPeriod.groups) return { home: null, away: null };

  for (const group of allPeriod.groups) {
    if (!group.statisticsItems) continue;
    const item = group.statisticsItems.find((i: any) => i.key === key);
    if (item) {
      return { home: item.homeValue, away: item.awayValue };
    }
  }
  return { home: null, away: null };
}

async function main() {
  const matches = await prisma.match.findMany({
    where: {
      statisticsJson: { not: null }
    }
  });

  console.log(`Found ${matches.length} matches with statisticsJson to migrate.`);

  let updatedCount = 0;

  for (const m of matches) {
    try {
      const stats = JSON.parse(m.statisticsJson!);
      // statisticsJson is the array itself: [{"period":"ALL", ...}]
      const shots = extractStat(stats, "totalShotsOnGoal");
      const shotsOnTarget = extractStat(stats, "shotsOnGoal");

      if (shots.home !== null || shotsOnTarget.home !== null) {
          await prisma.match.update({
            where: { id: m.id },
            data: {
                homeShots: shots.home,
                awayShots: shots.away,
                homeShotsOnTarget: shotsOnTarget.home,
                awayShotsOnTarget: shotsOnTarget.away,
            }
          });
          updatedCount++;
      }
    } catch (e) {
      console.error(`Failed to migrate match ${m.id}:`, e);
    }
  }

  console.log(`✅ Migration complete. Updated ${updatedCount} matches.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
