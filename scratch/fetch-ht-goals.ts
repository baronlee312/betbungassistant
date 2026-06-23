import { PrismaClient as SQLiteClient } from '@prisma/client-sqlite';
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());
const sqlite = new SQLiteClient();

async function main() {
  console.log("🚀 Starting 1st Half Goals Analysis...");

  // Load all finished matches from local SQLite
  const matches = await sqlite.match.findMany({
    where: {
      league: "FIFA World Cup 2026",
      status: "FINISHED"
    },
    include: {
      homeTeam: true,
      awayTeam: true
    },
    orderBy: { date: "asc" }
  });

  if (matches.length === 0) {
    console.log("No finished matches found.");
    await sqlite.$disconnect();
    return;
  }

  console.log(`Found ${matches.length} finished World Cup 2026 matches. Launching browser to fetch HT scores...`);

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  let sofascoreToken = "46ad4e";

  page.on("request", (req) => {
    const headers = req.headers();
    if (headers["x-requested-with"]) {
      sofascoreToken = headers["x-requested-with"];
    }
  });

  console.log("Navigating to Sofascore to fetch token...");
  await page.goto("https://www.sofascore.com/football/tournament/world/world-championship/16#id:58210", { waitUntil: "domcontentloaded", timeout: 0 });
  await new Promise((r) => setTimeout(r, 10000));

  let firstHalfGoalsCount = 0;
  const results: any[] = [];

  for (const m of matches) {
    if (!m.sofascoreId) continue;
    console.log(`Fetching details for match ${m.sofascoreId}: ${m.homeTeam.name} vs ${m.awayTeam.name}...`);
    try {
      const eventJson = await page.evaluate(async (mid, token) => {
        try {
          const response = await fetch(`https://www.sofascore.com/api/v1/event/${mid}`, {
            headers: {
              "x-requested-with": token
            }
          });
          return await response.json();
        } catch (e) {
          return { error: String(e) };
        }
      }, m.sofascoreId, sofascoreToken);

      if (eventJson.event) {
        const event = eventJson.event;
        const htHome = event.homeScore?.period1 ?? 0;
        const htAway = event.awayScore?.period1 ?? 0;
        const htTotal = htHome + htAway;
        const hasHtGoal = htTotal > 0;

        if (hasHtGoal) firstHalfGoalsCount++;

        results.push({
          id: m.sofascoreId,
          date: m.date.toISOString().split('T')[0],
          home: m.homeTeam.name,
          away: m.awayTeam.name,
          ftScore: `${m.homeScore}-${m.awayScore}`,
          htScore: `${htHome}-${htAway}`,
          hasHtGoal
        });

        console.log(`  ✅ HT Score: ${htHome}-${htAway} | Has HT Goal: ${hasHtGoal ? "YES" : "NO"}`);
      } else {
        console.log(`  ❌ Failed to parse event JSON for match ${m.sofascoreId}`);
      }
    } catch (e) {
      console.log(`  ❌ Error fetching match ${m.sofascoreId}:`, e);
    }
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log("\nClosing browser...");
  await browser.close();

  console.log("\n=== ANALYSIS RESULT ===");
  console.log(`Total Matches analyzed: ${results.length}`);
  console.log(`Matches with Goals in 1st Half: ${firstHalfGoalsCount}`);
  console.log(`Matches with NO Goals in 1st Half: ${results.length - firstHalfGoalsCount}`);
  const percentage = (firstHalfGoalsCount / results.length) * 100;
  console.log(`Percentage of matches with 1st Half Goals: ${percentage.toFixed(2)}%`);

  console.log("\nDetails:");
  for (const r of results) {
    console.log(`- [${r.date}] ${r.home} ${r.ftScore} ${r.away} | HT: ${r.htScore} | HT Goal: ${r.hasHtGoal ? "✅" : "❌"}`);
  }

  await sqlite.$disconnect();
}

main().catch(console.error);
