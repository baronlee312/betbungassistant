---
name: db-scraper-sync
description: Match scraper & DB synchronizer. Scrapes Sofascore fixtures with live updates, bypasses db cache for recently ongoing matches, and syncs local SQLite with Postgres Supabase.
---
# db-scraper-sync

Comprehensive workflow and toolset to scrape Sofascore match data, fetch deep statistics, handle cookies/security challenges, handle live/completed match state transitions using a sliding-window buffer, and synchronize databases.

## How to Use This Skill

### Step 1: Running the Scraper

To scrape the latest matches and statistics since the last scrape time:

```bash
npm run scrape
```

**What the script does:**
1. Loads the `last_scrape_time` from the `ScrapeSetting` table in PostgreSQL.
2. Calculates a 3-hour buffer threshold:
   $$\text{rescrapeThreshold} = \text{lastScrapeTime} - 3 \text{ hours}$$
3. Launches Puppeteer (headed locally, headless in CI) and intercepts Sofascore API requests to fetch match metadata.
4. For all finished matches:
   - If the match started **before** the `rescrapeThreshold` and already has statistics in the DB, it is skipped.
   - If the match started **at or after** the `rescrapeThreshold`, it bypasses the cache check and fetches the latest statistics from Sofascore. This ensures that matches that were ongoing during the previous scrape are updated with finalized statistics.
5. Saves all teams and matches to the PostgreSQL database on Supabase.
6. Saves the current timestamp as the new `last_scrape_time`.

---

### Step 2: Database Synchronization

If you are developing locally and want to sync the PostgreSQL database back to your local SQLite database (`dev.db`), run:

```bash
npm run sync-dev-db
```

**What the script does:**
1. Connects to the PostgreSQL database (via `DATABASE_URL` in `.env`) and retrieves all records for `Team`, `Match`, and `FifaRanking`.
2. Truncates all tables in the local SQLite database to prevent duplicates/conflicts.
3. Batch-inserts all retrieved records into the local SQLite database.

To do the reverse (migrate local SQLite data to PostgreSQL/Supabase):

```bash
npx tsx scripts/migrate-sqlite-to-postgres.ts
```

---

### Step 3: Verification & Inspection

To check and inspect matches in both databases:

**Inspect PostgreSQL Matches:**
```bash
npx tsx scratch/inspect-matches.ts
```

**Inspect SQLite Matches:**
```bash
npx tsx scratch/inspect-sqlite.ts
```

These scripts print:
- The total matches in the database.
- A list of recent matches, their start date, teams, status (`FINISHED` / `TIMED`), scores, and whether the statistics JSON is present.

---

## Puppeteer Troubleshooting & CI Considerations

### Directory Cleanup Error (`ENOTEMPTY`)
Under CI environments (like GitHub Actions), Puppeteer might trigger directory cleanup errors on exit.
**Solution:**
In `scrape.ts`, we handle this by:
1. Setting `userDataDir` inside `launchOptions` to a fixed path (e.g. `/tmp/puppeteer_user_data`) when `process.env.GITHUB_ACTIONS` is true.
2. Adding a global unhandled promise rejection handler that filters out `ENOTEMPTY` and `rmdir` warnings:
   ```typescript
   process.on("unhandledRejection", (reason) => {
     const msg = reason instanceof Error ? reason.message : String(reason);
     if (msg.includes("ENOTEMPTY") || msg.includes("rmdir")) {
       console.log("Ignoring non-critical directory cleanup error.");
       return;
     }
     process.exit(1);
   });
   ```

### Stealth Plugin & User Agent
Sofascore has Cloudflare protection. When scraping:
- Use `puppeteer-extra` with `puppeteer-extra-plugin-stealth` to bypass basic challenges.
- When running locally, run headful (`headless: false`) and provide a path to local Google Chrome.
- Wait at least 10 seconds on navigate to allow JavaScript/AJAX calls to populate headers with the dynamically generated `x-requested-with` token.
