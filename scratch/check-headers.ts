import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  });
  const page = await browser.newPage();
  
  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("/api/v1/")) {
      console.log(`URL: ${url}`);
      console.log("Headers:", JSON.stringify(req.headers(), null, 2));
    }
  });

  console.log("Navigating to Sofascore World Cup page...");
  await page.goto("https://www.sofascore.com/football/tournament/world/world-championship/16#id:58210", { waitUntil: "domcontentloaded", timeout: 60000 });
  
  await new Promise((r) => setTimeout(r, 10000));
  await browser.close();
}

main().catch(console.error);
