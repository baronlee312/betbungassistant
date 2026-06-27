import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

puppeteer.use(StealthPlugin());
const prisma = new PrismaClient();

async function main() {
  // Fetch all knockout match IDs from DB
  const dbMatches = await prisma.match.findMany({
    where: {
      league: 'FIFA World Cup 2026',
      sofascoreId: {
        gte: 12812000,
        lte: 12814000
      }
    },
    select: {
      sofascoreId: true
    }
  });

  const ids = dbMatches.map(m => m.sofascoreId).filter((id): id is number => id !== null);
  console.log(`Found ${ids.length} knockout matches. Launching browser to fetch round details...`);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  });
  const page = await browser.newPage();
  
  let sofascoreToken = "46ad4e";
  page.on("request", (req) => {
    const headers = req.headers();
    if (headers["x-requested-with"]) {
      sofascoreToken = headers["x-requested-with"];
    }
  });

  await page.goto("https://www.sofascore.com/football/tournament/world/world-championship/16#id:58210", { waitUntil: "domcontentloaded", timeout: 0 });
  await new Promise((r) => setTimeout(r, 5000));

  const results: any[] = [];
  
  for (const mid of ids) {
    console.log(`Fetching details for match ${mid}...`);
    try {
      const data = await page.evaluate(async (eventId, token) => {
        try {
          const response = await fetch(`https://www.sofascore.com/api/v1/event/${eventId}`, {
            headers: {
              "x-requested-with": token
            }
          });
          if (!response.ok) return { error: `HTTP ${response.status}` };
          return await response.json();
        } catch (e) {
          return { error: String(e) };
        }
      }, mid, sofascoreToken);

      if (data.event) {
        const ev = data.event;
        results.push({
          sofascoreId: mid,
          roundName: ev.roundInfo?.name || "Unknown",
          roundIndex: ev.roundInfo?.round || 0,
          customId: ev.customId,
          slug: ev.roundInfo?.slug || "",
          homeTeamName: ev.homeTeam?.name,
          awayTeamName: ev.awayTeam?.name
        });
        console.log(`  ✅ ${ev.roundInfo?.name} | ${ev.homeTeam?.name} vs ${ev.awayTeam?.name}`);
      } else {
        console.log(`  ❌ Failed for ${mid}: ${JSON.stringify(data.error)}`);
      }
    } catch (e) {
      console.log(`  ❌ Failed for ${mid}: ${e}`);
    }
    await new Promise((r) => setTimeout(r, 800));
  }

  fs.writeFileSync("scratch/knockout-mapping.json", JSON.stringify(results, null, 2));
  console.log("Saved mapping to scratch/knockout-mapping.json");

  await browser.close();
}

main().finally(() => prisma.$disconnect());
