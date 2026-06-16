import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

async function main() {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ 
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
  
  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("/api/")) {
      console.log(`[Response] ${res.status()} ${url}`);
    }
  });

  console.log("Navigating to Belgium team page...");
  await page.goto("https://www.sofascore.com/team/football/belgium/4717", { 
    waitUntil: "networkidle2", 
    timeout: 30000 
  });
  
  console.log("Waiting 5 seconds...");
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
}

main().catch(console.error);
