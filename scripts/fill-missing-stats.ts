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
  console.log("🚀 Starting Missing Stats Filler (Browser Intercept Mode)");
  
  const matchesToUpdate = await prisma.match.findMany({
    where: {
      status: "FINISHED",
      homeShots: null, // Using homeShots as an indicator that stats are missing
      sofascoreId: { not: null },
      league: "FIFA World Cup 2026"
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
    headless: false, // Must be headful to trigger interactive page scripts
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    defaultViewport: null 
  });
  const page = await browser.newPage();

  let updatedCount = 0;

  for (const match of matchesToUpdate) {
    const mid = match.sofascoreId;
    console.log(`\n--------------------------------------------`);
    console.log(`Fetching stats for match ${mid} (${match.homeTeam.name} vs ${match.awayTeam.name})...`);
    
    let statsJson: any = null;

    // Define response interceptor for this specific match ID
    const interceptor = async (response: any) => {
      const resUrl = response.url();
      if (resUrl.includes(`/api/v1/event/${mid}/statistics`) && response.request().method() === "GET") {
        try {
          statsJson = await response.json();
          console.log("  ✅ Statistics JSON intercepted successfully!");
        } catch (e) {
          console.error("  ❌ Failed to parse intercepted statistics JSON:", e);
        }
      }
    };

    page.on("response", interceptor);

    try {
      const url = `https://www.sofascore.com/event/${mid}`;
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      
      // Wait for page initial load
      await new Promise((r) => setTimeout(r, 5000));

      // Click the Statistics tab
      console.log("  Clicking the 'Statistics' tab...");
      const clicked = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll("button, a, div, span"));
        const btn = elements.find(el => {
          const text = (el.textContent || "").trim();
          return text === "Statistics" || text === "Thống kê" || text === "Stats";
        });
        if (btn) {
          (btn as HTMLElement).click();
          return { success: true, text: btn.textContent?.trim() };
        }
        return { success: false };
      });

      console.log(`  Click result: ${JSON.stringify(clicked)}`);

      // Wait for the interceptor to capture the data (max 6 seconds)
      for (let i = 0; i < 12; i++) {
        if (statsJson) break;
        await new Promise((r) => setTimeout(r, 500));
      }

      if (statsJson && statsJson.statistics) {
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

        console.log(`  🎉 Updated stats for match ${mid} successfully!`);
        updatedCount++;
      } else {
        console.log(`  ⚠️ No statistics could be fetched or captured for match ${mid}.`);
      }
    } catch (e) {
      console.log(`  ❌ Error processing match ${mid}: ${e instanceof Error ? e.message : e}`);
    } finally {
      // Clean up the interceptor to prevent memory leak and incorrect matching
      page.off("response", interceptor);
    }

    // Delay between matches
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\n🎉 Finished stats filling! Updated ${updatedCount} matches.`);
  await browser.close();
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Failed to fill missing stats", e);
  await prisma.$disconnect();
});
