import "dotenv/config";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { PrismaClient } from "@prisma/client";

puppeteer.use(StealthPlugin());
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

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

// Add global unhandled rejection handler to ignore non-critical Puppeteer cleanup errors
process.on("unhandledRejection", (reason) => {
  console.warn("⚠️ Unhandled Promise Rejection:", reason);
  const msg = reason instanceof Error ? reason.message : String(reason);
  if (msg.includes("ENOTEMPTY") || msg.includes("rmdir")) {
    console.log("Ignoring non-critical directory cleanup error.");
    return;
  }
  process.exit(1);
});

async function main() {
  console.log("🚀 Starting Sofascore Scraper (Manual Mode)");
  console.log("If a Cloudflare challenge appears, please solve it manually in the browser window.");

  // Load last update timestamp from DB
  let lastScrapeTime = 0;
  try {
    const setting = await prisma.scrapeSetting.findUnique({
      where: { key: "last_scrape_time" },
    });
    if (setting) {
      lastScrapeTime = parseInt(setting.value);
      console.log(`Last scrape time found in database: ${new Date(lastScrapeTime).toISOString()}`);
    } else {
      console.log("No last scrape time found in database. Scraping all matches.");
    }
  } catch (e) {
    console.error("Failed to fetch last scrape time setting:", e);
  }

  // Use a 24-hour buffer to handle matches that started before the last run but completed after
  const filterStartTime = Math.max(0, lastScrapeTime - 24 * 60 * 60 * 1000);
  
  const isCI = !!process.env.GITHUB_ACTIONS;
  const launchOptions: any = {
    headless: isCI ? true : false,
    defaultViewport: null,
    args: isCI ? ["--no-sandbox", "--disable-setuid-sandbox"] : []
  };

  if (isCI) {
    // Specify userDataDir in CI to prevent Puppeteer from attempting to delete its temporary profile directory on close
    launchOptions.userDataDir = "/tmp/puppeteer_user_data";
  } else {
    launchOptions.executablePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  }

  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();

  const teamsMap = new Map<number, any>();
  const matchesMap = new Map<number, any>();
  let sofascoreToken = "46ad4e";

  page.on("request", (req) => {
    const headers = req.headers();
    if (headers["x-requested-with"]) {
      sofascoreToken = headers["x-requested-with"];
    }
  });

  // Intercept responses for tournament matches (this part is still fine as we are on the tournament page)
  page.on("response", async (response) => {
    const url = response.url();
    if (url.includes("/api/v1/unique-tournament/") && (url.includes("/events") || url.includes("/scheduled-events/"))) {
      try {
        const json = await response.json();
        if (json.events) {
          console.log(`✅ Intercepted ${json.events.length} tournament matches from: ${url}`);
          for (const event of json.events) {
            if (event.tournament?.uniqueTournament?.id === 16) {
              event.isWorldCup2026 = true;
            }
            if (event.startTimestamp * 1000 > filterStartTime) {
              matchesMap.set(event.id, event);
              if (event.homeTeam) teamsMap.set(event.homeTeam.id, event.homeTeam);
              if (event.awayTeam) teamsMap.set(event.awayTeam.id, event.awayTeam);
            }
          }
        }
      } catch (e) {
        // ignore
      }
    }
  });

  console.log("Navigating to World Cup 2026 page...");
  await page.goto("https://www.sofascore.com/football/tournament/world/world-championship/16#id:58210", { waitUntil: "domcontentloaded", timeout: 0 });
  
  console.log("⏳ Waiting 10 seconds to ensure fixtures load...");
  await new Promise((r) => setTimeout(r, 10000));

  // Extract all team IDs we found
  const teamIds = Array.from(teamsMap.keys());
  console.log(`Found ${teamIds.length} teams. Will now fetch past matches via in-page fetch...`);

  for (const teamId of teamIds) {
    console.log(`Fetching past matches for team ${teamId}...`);
    try {
      const json = await page.evaluate(async (tid, token) => {
        try {
          const response = await fetch(`https://www.sofascore.com/api/v1/team/${tid}/events/last/0`, {
            headers: {
              "x-requested-with": token
            }
          });
          if (!response.ok) {
            return { error: `HTTP ${response.status}: ${response.statusText}` };
          }
          return await response.json();
        } catch (e: any) {
          return { error: e?.message || String(e) };
        }
      }, teamId, sofascoreToken);

      if (json.events) {
        console.log(`✅ Fetched ${json.events.length} past matches for team ${teamId} (Total matches: ${matchesMap.size})`);
        for (const event of json.events) {
          if (event.startTimestamp * 1000 > filterStartTime) {
            matchesMap.set(event.id, event);
            if (event.homeTeam) teamsMap.set(event.homeTeam.id, event.homeTeam);
            if (event.awayTeam) teamsMap.set(event.awayTeam.id, event.awayTeam);
          }
        }
      } else if (json.error) {
        console.log(`❌ Error fetching team ${teamId}: ${JSON.stringify(json.error)}`);
      }
    } catch (e) {
      console.log(`Failed to fetch past matches for team ${teamId}: ${e instanceof Error ? e.message : e}`);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Now fetch statistics for finished matches
  // We prioritize matches that we just discovered or matches that are recent
  const finishedMatches = Array.from(matchesMap.values())
    .filter(m => m.status?.type === "finished")
    .sort((a, b) => b.startTimestamp - a.startTimestamp)
    .slice(0, 300); // Increased limit to 300 for better history coverage

  const finishedMatchIds = finishedMatches.map(m => m.id);
  const existingMatches = await prisma.match.findMany({
    where: {
      sofascoreId: { in: finishedMatchIds },
      homeShots: { not: null }
    },
    select: { sofascoreId: true }
  });
  const existingIds = new Set(existingMatches.map(m => m.sofascoreId).filter((id): id is number => id !== null));
  console.log(`Found ${existingIds.size} matches with statistics already in the database.`);

  // Calculate the 3-hour buffer threshold relative to the last scrape time
  const rescrapeThreshold = lastScrapeTime - 3 * 60 * 60 * 1000;
  if (lastScrapeTime > 0) {
    console.log(`Rescraping stats for any matches starting after: ${new Date(rescrapeThreshold).toISOString()}`);
  }

  console.log(`\nFetching deep statistics for finished matches that need them...`);
  
  for (const match of finishedMatches) {
    if (match.statistics) continue; 
    
    const matchStartMs = match.startTimestamp * 1000;
    const shouldRescrape = lastScrapeTime > 0 && matchStartMs >= rescrapeThreshold;

    if (existingIds.has(match.id) && !shouldRescrape) {
      continue;
    }

    console.log(`Fetching stats for match ${match.id} (${match.homeTeam?.name} vs ${match.awayTeam?.name})...`);
    try {
      const statsJson = await page.evaluate(async (mid, token) => {
        try {
          const response = await fetch(`https://www.sofascore.com/api/v1/event/${mid}/statistics`, {
            headers: {
              "x-requested-with": token
            }
          });
          if (response.status === 404) return { statistics: null };
          return await response.json();
        } catch (e) {
          return { error: String(e) };
        }
      }, match.id, sofascoreToken);

      if (statsJson.statistics) {
        match.statistics = statsJson.statistics;
        console.log(`  ✅ Stats found: Corners ${extractStat(match.statistics, "cornerKicks").home}-${extractStat(match.statistics, "cornerKicks").away}`);
      } else if (statsJson.error) {
        console.log(`  ❌ Stats error for match ${match.id}: ${JSON.stringify(statsJson.error)}`);
      } else {
        console.log(`  ⚠️ No stats available for this match.`);
      }
    } catch (e) {
      console.log(`  ❌ Failed or no stats for match ${match.id}: ${e instanceof Error ? e.message : e}`);
    }
    await new Promise((r) => setTimeout(r, 800));
  }

  console.log("🎉 Scraping complete. Saving to database...");

  let savedTeams = 0;
  let savedMatches = 0;

  // Save Teams to DB
  console.log(`Saving ${teamsMap.size} teams to database...`);
  for (const team of Array.from(teamsMap.values())) {
    console.log(`  Saving team ${savedTeams + 1}/${teamsMap.size}: ${team.name} (${team.id})...`);
    await prisma.team.upsert({
      where: { sofascoreId: team.id },
      update: {
        name: team.name,
        shortName: team.shortName,
        crestUrl: `https://www.sofascore.com/api/v1/team/${team.id}/image`,
      },
      create: {
        sofascoreId: team.id,
        name: team.name,
        shortName: team.shortName,
        crestUrl: `https://www.sofascore.com/api/v1/team/${team.id}/image`,
      },
    });
    savedTeams++;
  }

  // Save Matches to DB
  const allMatchIds = Array.from(matchesMap.keys());
  const existingMatchesDb = await prisma.match.findMany({
    where: { sofascoreId: { in: allMatchIds } },
    select: { sofascoreId: true, status: true, homeShots: true }
  });
  
  const existingDbMap = new Map<number, { status: string; hasStats: boolean }>();
  for (const m of existingMatchesDb) {
    if (m.sofascoreId !== null) {
      existingDbMap.set(m.sofascoreId, {
        status: m.status,
        hasStats: m.homeShots !== null
      });
    }
  }

  const matchesToUpsert = Array.from(matchesMap.values()).filter(match => {
    if (!match.homeTeam || !match.awayTeam) return false;
    const dbMatch = existingDbMap.get(match.id);
    if (dbMatch) {
      const dbIsFinished = dbMatch.status === "FINISHED";
      if (dbIsFinished && dbMatch.hasStats && !match.statistics) {
        return false;
      }
    }
    return true;
  });

  // Fetch all existing teams from DB to build a lookup cache
  const allTeamsDb = await prisma.team.findMany();
  const dbTeamMap = new Map<number, number>(); // sofascoreId -> db id
  for (const t of allTeamsDb) {
    if (t.sofascoreId !== null) {
      dbTeamMap.set(t.sofascoreId, t.id);
    }
  }

  console.log(`Saving ${matchesToUpsert.length} matches to database (skipped ${matchesMap.size - matchesToUpsert.length} matches already in DB)...`);
  for (const match of matchesToUpsert) {
    let homeTeamDbId = dbTeamMap.get(match.homeTeam.id);
    if (!homeTeamDbId) {
      const t = await prisma.team.upsert({
        where: { sofascoreId: match.homeTeam.id },
        update: {
          name: match.homeTeam.name,
          shortName: match.homeTeam.shortName,
          crestUrl: `https://www.sofascore.com/api/v1/team/${match.homeTeam.id}/image`,
        },
        create: {
          sofascoreId: match.homeTeam.id,
          name: match.homeTeam.name,
          shortName: match.homeTeam.shortName,
          crestUrl: `https://www.sofascore.com/api/v1/team/${match.homeTeam.id}/image`,
        },
      });
      homeTeamDbId = t.id;
      dbTeamMap.set(match.homeTeam.id, t.id);
    }

    let awayTeamDbId = dbTeamMap.get(match.awayTeam.id);
    if (!awayTeamDbId) {
      const t = await prisma.team.upsert({
        where: { sofascoreId: match.awayTeam.id },
        update: {
          name: match.awayTeam.name,
          shortName: match.awayTeam.shortName,
          crestUrl: `https://www.sofascore.com/api/v1/team/${match.awayTeam.id}/image`,
        },
        create: {
          sofascoreId: match.awayTeam.id,
          name: match.awayTeam.name,
          shortName: match.awayTeam.shortName,
          crestUrl: `https://www.sofascore.com/api/v1/team/${match.awayTeam.id}/image`,
        },
      });
      awayTeamDbId = t.id;
      dbTeamMap.set(match.awayTeam.id, t.id);
    }

    const isFinished = match.status?.type === "finished";
    const statusStr = isFinished ? "FINISHED" : "TIMED";
    const homeScore = isFinished ? match.homeScore?.current : null;
    const awayScore = isFinished ? match.awayScore?.current : null;
    const date = new Date(match.startTimestamp * 1000);

    const stats = match.statistics;
    const possession = extractStat(stats, "ballPossession");
    const shots = extractStat(stats, "totalShotsOnGoal");
    const shotsOnTarget = extractStat(stats, "shotsOnGoal");
    const corners = extractStat(stats, "cornerKicks");
    const fouls = extractStat(stats, "fouls");
    const yellowCards = extractStat(stats, "yellowCards");
    const redCards = extractStat(stats, "redCards");
    const offsides = extractStat(stats, "offsides");
    const saves = extractStat(stats, "goalkeeperSaves");

    const statisticsJson = stats ? JSON.stringify(stats) : null;

    // Determine league name: If it's our target tournament, use a canonical name
    let leagueName = match.tournament?.name || "Unknown";
    if (match.isWorldCup2026 || match.tournament?.uniqueTournament?.id === 16) {
      leagueName = "FIFA World Cup 2026";
    }

    await prisma.match.upsert({
      where: { sofascoreId: match.id },
      update: {
        homeScore,
        awayScore,
        status: statusStr,
        date,
        league: leagueName,
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
        statisticsJson,
      },
      create: {
        sofascoreId: match.id,
        homeTeamId: homeTeamDbId,
        awayTeamId: awayTeamDbId,
        homeScore,
        awayScore,
        status: statusStr,
        date,
        league: leagueName,
        season: match.season?.year || "Unknown",
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
        statisticsJson,
      },
    });
    savedMatches++;
  }

  console.log(`✅ Saved ${savedTeams} teams and ${savedMatches} matches (including past matches with statistics) to the database.`);

  // Save current run's timestamp as the last update time
  const currentScrapeTime = Date.now();
  try {
    await prisma.scrapeSetting.upsert({
      where: { key: "last_scrape_time" },
      update: { value: String(currentScrapeTime) },
      create: { key: "last_scrape_time", value: String(currentScrapeTime) },
    });
    console.log(`✅ Saved current scrape timestamp: ${new Date(currentScrapeTime).toISOString()}`);
  } catch (e) {
    console.error("❌ Failed to save current scrape timestamp:", e);
  }

  try {
    console.log("Closing browser...");
    await Promise.race([
      browser.close(),
      new Promise((resolve) => setTimeout(resolve, 5000))
    ]);
  } catch (e) {
    console.error("Browser close timed out or failed:", e);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Scraping failed", e);
  await prisma.$disconnect();
});
