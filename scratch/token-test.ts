import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  });
  const page = await browser.newPage();
  
  let sofascoreToken = "";
  
  page.on("request", (req) => {
    const headers = req.headers();
    if (headers["x-requested-with"]) {
      sofascoreToken = headers["x-requested-with"];
    }
  });

  console.log("Navigating to Sofascore World Cup page...");
  await page.goto("https://www.sofascore.com/football/tournament/world/world-championship/16#id:58210", { waitUntil: "domcontentloaded", timeout: 60000 });
  
  console.log("Waiting to capture token...");
  for (let i = 0; i < 20; i++) {
    if (sofascoreToken) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  
  console.log(`Captured token: "${sofascoreToken}"`);
  
  if (!sofascoreToken) {
    console.log("Failed to capture token. Exiting.");
    await browser.close();
    return;
  }
  
  console.log("Attempting to fetch team events inside page context with the captured token...");
  const json = await page.evaluate(async (tid, token) => {
    try {
      const response = await fetch(`https://www.sofascore.com/api/v1/team/${tid}/events/last/0`, {
        headers: {
          "x-requested-with": token
        }
      });
      return await response.json();
    } catch (e: any) {
      return { error: e?.message || String(e) };
    }
  }, 4724, sofascoreToken);
  
  console.log("JSON response received:");
  console.log(JSON.stringify(json, null, 2).substring(0, 1000));
  
  await browser.close();
}

main().catch(console.error);
