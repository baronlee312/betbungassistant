import "dotenv/config";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { PrismaClient } from "@prisma/client";

puppeteer.use(StealthPlugin());
const prisma = new PrismaClient();

const TEAM_NAME_MAPPING: Record<string, string> = {
  "Korea Republic": "South Korea",
  "Korea DPR": "North Korea",
  "IR Iran": "Iran",
  "USA": "USA", // Already matches but good to have
};

async function main() {
  console.log("🚀 Starting FIFA World Ranking Scraper");
  
  const isCI = !!process.env.GITHUB_ACTIONS;
  const launchOptions: any = {
    headless: true,
    defaultViewport: { width: 1920, height: 1080 },
    args: isCI ? ["--no-sandbox", "--disable-setuid-sandbox"] : []
  };

  if (!isCI) {
    launchOptions.executablePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  }

  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();

  console.log("Navigating to FIFA rankings page...");
  await page.goto("https://inside.fifa.com/fifa-world-ranking/men", { waitUntil: "networkidle2", timeout: 60000 });
  
  // Wait for table to appear
  try {
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
  } catch (e) {
    console.log("⚠️ Table rows not found within 10s");
  }

  // Handle cookies if any (just in case it blocks interaction)
  try {
    const cookieButton = await page.$("button#onetrust-accept-btn-handler") || await page.$("button.onetrust-close-btn-handler");
    if (cookieButton) {
      await cookieButton.click();
      console.log("✅ Accepted cookies");
    }
  } catch (e) {
    // Ignore if not found
  }

  // Click "Show more" until it's gone
  let hasMore = true;
  let clickCount = 0;
  while (hasMore && clickCount < 10) { 
    try {
      const clicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.innerText.includes('Show more') || b.innerText.includes('Show full rankings'));
        if (btn && (btn as any).disabled !== true) {
          btn.scrollIntoView();
          (btn as HTMLElement).click();
          return true;
        }
        return false;
      });

      if (clicked) {
        console.log(`  Clicked "Show more" or "Show full rankings" (${++clickCount})`);
        await new Promise(r => setTimeout(r, 3000)); // Increased wait time
      } else {
        hasMore = false;
      }
    } catch (e) {
      console.log(`  Error clicking button: ${e}`);
      hasMore = false;
    }
  }

  console.log("Extracting data...");
  const rankings = await page.evaluate(() => {
    // Try different selectors for rows
    let rows = Array.from(document.querySelectorAll('table tr')) as HTMLElement[];
    if (rows.length === 0) rows = Array.from(document.querySelectorAll('tr')) as HTMLElement[];
    
    return rows.map((row, index) => {
      const cells = Array.from(row.querySelectorAll('td')) as HTMLElement[];
      if (cells.length === 0) return null;
      
      if (cells.length < 3) return null;

      // Skip first row if it's the header
      if (index === 0 && (row.innerText.includes('Team') || row.innerText.includes('Points'))) {
        return null;
      }

      // Extract rank
      const rankText = cells[0].innerText.split('\n')[0].trim();
      const rank = parseInt(rankText.replace(/[^0-9]/g, ''));

      // Team name
      const teamName = cells[1].innerText.split('\n')[0].trim();
      
      // Flag URL
      const flagImg = cells[1].querySelector('img');
      const flagUrl = flagImg ? flagImg.src : null;
      
      // Points - Based on log, it could be at index 2 or index 5
      let points = NaN;
      if (cells.length > 5) {
        points = parseFloat(cells[5].innerText.trim().replace(/,/g, ''));
      }
      if (isNaN(points) && cells.length > 2) {
        points = parseFloat(cells[2].innerText.trim().replace(/,/g, ''));
      }

      if (isNaN(rank) || isNaN(points) || !teamName) {
        return null;
      }

      return {
        rank,
        teamName,
        points,
        flagUrl
      };
    }).filter(r => r !== null);
  });

  console.log(`✅ Extracted ${rankings.length} teams.`);

  if (rankings.length > 0) {
    console.log("Saving to database...");
    
    // Filter out any potential nulls and cast to the correct type for TS
    const validRankings = rankings.filter((r): r is { rank: number; teamName: string; points: number; flagUrl: string | null } => r !== null);

    for (const entry of validRankings) {
      const mappedName = TEAM_NAME_MAPPING[entry.teamName] || entry.teamName;
      
      await prisma.fifaRanking.upsert({
        where: { teamName: mappedName },
        update: {
          rank: entry.rank,
          points: entry.points,
          flagUrl: entry.flagUrl,
          lastUpdated: new Date()
        },
        create: {
          rank: entry.rank,
          teamName: mappedName,
          points: entry.points,
          flagUrl: entry.flagUrl,
          lastUpdated: new Date()
        }
      });
    }
    console.log(`🎉 Database updated with ${validRankings.length} teams.`);
  } else {
    console.log("⚠️ No data extracted. Check selectors.");
  }

  await browser.close();
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Scraping failed", e);
  await prisma.$disconnect();
});
