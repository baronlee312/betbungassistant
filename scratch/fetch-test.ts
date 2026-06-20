import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  });
  const page = await browser.newPage();
  
  console.log("Navigating to team events page...");
  await page.goto("https://www.sofascore.com/api/v1/team/4724/events/last/0", { waitUntil: "domcontentloaded" });
  
  const content = await page.evaluate(() => document.body.innerText);
  console.log("Content received:");
  console.log(content.substring(0, 1000));
  
  await browser.close();
}

main().catch(console.error);
