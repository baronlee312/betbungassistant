import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

async function main() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  console.log("Fetching match statistics...");
  await page.goto("https://api.sofascore.com/api/v1/event/15372905/statistics", { waitUntil: "domcontentloaded" });
  
  const content = await page.evaluate(() => {
    return document.body.innerText;
  });

  try {
    const json = JSON.parse(content);
    console.log(JSON.stringify(json, null, 2));
  } catch (e) {
    console.log("Failed to parse JSON", content.substring(0, 500));
  }

  await browser.close();
}

main().catch(console.error);
