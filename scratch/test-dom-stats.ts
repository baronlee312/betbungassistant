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
  const url = `https://www.sofascore.com/event/${mid}`;
  console.log(`Navigating to short URL: ${url}`);
  
  let statsJson: any = null;
  
  page.on("response", async (response) => {
    const resUrl = response.url();
    if (resUrl.includes(`/api/v1/event/${mid}/statistics`) && response.request().method() === "GET") {
      console.log(`\n🔔 INTERCEPTED GET STATS RESPONSE!`);
      try {
        statsJson = await response.json();
        console.log("Success! Intercepted statistics data.");
      } catch (e) {
        console.error("Failed to parse JSON:", e);
      }
    }
  });

  try {
    // Navigate with domcontentloaded to avoid waiting for heavy trackers
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    console.log("Redirected URL after load:", page.url());
    console.log("Waiting 6 seconds for client-side loading...");
    await new Promise(r => setTimeout(r, 6000));
    
    console.log("Looking for Statistics button...");
    const clicked = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll("button, a, div, span"));
      const btn = elements.find(el => {
        const text = (el.textContent || "").trim();
        return text === "Statistics" || text === "Thống kê" || text === "Stats";
      });
      if (btn) {
        (btn as HTMLElement).click();
        return { success: true, text: btn.textContent?.trim() };
      }
      return { success: false };
    });
    
    console.log("Click result:", JSON.stringify(clicked, null, 2));
    
    console.log("Waiting 5 seconds for statistics...");
    await new Promise(r => setTimeout(r, 5000));
    
    if (statsJson) {
      console.log("✅ Stats successfully captured!");
    } else {
      console.log("❌ No stats captured.");
    }
  } catch (e) {
    console.error("Navigation or execution failed:", e);
  }
  
  await browser.close();
}

main().catch(console.error);
