import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

async function main() {
  const browser = await puppeteer.launch({ 
    headless: false,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    defaultViewport: null
  });
  const page = await browser.newPage();
  
  const mid = 15186710;
  const url = `https://www.sofascore.com/football/match/mexico-south-africa/LUbsGVb#id:${mid}`;
  console.log(`Navigating to match page: ${url}`);
  
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    console.log("Page domcontentloaded. Waiting 10 seconds for initial load...");
    await new Promise(r => setTimeout(r, 10000));
    
    console.log("Evaluating fetch call in page context...");
    const statsJson = await page.evaluate(async (id) => {
      try {
        const response = await fetch(`/api/v1/event/${id}/statistics`);
        return { status: response.status, data: await response.json() };
      } catch (e) {
        return { error: String(e) };
      }
    }, mid);
    
    console.log("Evaluation Result Status:", statsJson.status);
    console.log("Evaluation Result Data:", JSON.stringify(statsJson.data || statsJson.error, null, 2));
  } catch (e) {
    console.error("Navigation/Evaluation failed:", e);
  }
  
  await browser.close();
}

main().catch(console.error);
