import "dotenv/config";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { PrismaClient } from "@prisma/client";

puppeteer.use(StealthPlugin());
const prisma = new PrismaClient();

function extractStat(statsData: any, key: string) {
  if (!statsData || !statsData.length) return { home: null, away: null };
  const allPeriod = statsData.find((p: any) => p.period === "ALL") || statsData[0];
  if (!allPeriod || !allPeriod.groups) return { home: null, away: null };

  for (const group of allPeriod.groups) {
    if (!group.statisticsItems) continue;
    const item = group.statisticsItems.find((i: any) => i.key === key);
    if (item) {
      // SofaScore sometimes returns strings for these values
      const h = typeof item.homeValue === 'string' ? parseInt(item.homeValue.replace('%', '')) : item.homeValue;
      const a = typeof item.awayValue === 'string' ? parseInt(item.awayValue.replace('%', '')) : item.awayValue;
      return { home: h, away: a };
    }
  }
  return { home: null, away: null };
}

async function main() {
  console.log("🚀 Starting Missing Stats Filler");
  
  const matchesToUpdate = await prisma.match.findMany({
    where: {
      status: "FINISHED",
      homeShots: null, // Using homeShots as an indicator that stats are missing
      sofascoreId: { not: null }
    },
    include: {
      homeTeam: true,
      awayTeam: true
    }
  });

  if (matchesToUpdate.length === 0) {
    console.log("✅ No matches missing statistics found.");
    await prisma.$disconnect();
    return;
  }

  console.log(`🔍 Found ${matchesToUpdate.length} matches missing statistics.`);

  const browser = await puppeteer.launch({ 
    headless: false, // Set to false if you need to solve Cloudflare manually
    defaultViewport: null 
  });
  const page = await browser.newPage();

  // Navigate to a generic sofascore page first to establish cookies/session
  await page.goto("https://www.sofascore.com", { waitUntil: "networkidle2", timeout: 0 });
  console.log("⏳ Waiting to ensure page is loaded...");
  await new Promise((r) => setTimeout(r, 5000));

  let updatedCount = 0;

  for (const match of matchesToUpdate) {
    console.log(`\nFetching stats for match ${match.sofascoreId} (${match.homeTeam.name} vs ${match.awayTeam.name})...`);
    
    try {
      const statsJson = await page.evaluate(async (mid) => {
        try {
          const response = await fetch(`https://www.sofascore.com/api/v1/event/${mid}/statistics`);
          if (response.status === 404) return { statistics: null };
          return await response.json();
        } catch (e) {
          return { error: String(e) };
        }
      }, match.sofascoreId);

      if (statsJson.statistics) {
        const stats = statsJson.statistics;
        const possession = extractStat(stats, "ballPossession");
        const shots = extractStat(stats, "totalShotsOnGoal");
        const shotsOnTarget = extractStat(stats, "shotsOnGoal");
        const corners = extractStat(stats, "cornerKicks");
        const fouls = extractStat(stats, "fouls");
        const yellowCards = extractStat(stats, "yellowCards");
        const redCards = extractStat(stats, "redCards");
        const offsides = extractStat(stats, "offsides");
        const saves = extractStat(stats, "goalkeeperSaves");

        await prisma.match.update({
          where: { id: match.id },
          data: {
            homePossession: possession.home,
            awayPossession: possession.away,
            homeShots: shots.home,
            awayShots: shots.away,
            homeShotsOnTarget: shotsOnTarget.home,
            awayShotsOnTarget: shotsOnTarget.away,
            homeCorners: corners.home,
            awayCorners: corners.away,
            homeFouls: fouls.home,
            awayFouls: fouls.away,
            homeYellowCards: yellowCards.home,
            awayYellowCards: yellowCards.away,
            homeRedCards: redCards.home,
            awayRedCards: redCards.away,
            homeOffsides: offsides.home,
            awayOffsides: offsides.away,
            homeSaves: saves.home,
            awaySaves: saves.away,
            statisticsJson: JSON.stringify(stats),
          }
        });

        console.log(`  ✅ Updated stats for match ${match.sofascoreId}`);
        updatedCount++;
      } else if (statsJson.error) {
        console.log(`  ❌ Error fetching stats: ${statsJson.error}`);
      } else {
        console.log(`  ⚠️ No stats available for this match.`);
      }
    } catch (e) {
      console.log(`  ❌ Failed to fetch stats for match ${match.sofascoreId}: ${e instanceof Error ? e.message : e}`);
    }

    // Small delay between requests
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\n🎉 Finished! Updated ${updatedCount} matches.`);
  await browser.close();
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Failed to fill missing stats", e);
  await prisma.$disconnect();
});
