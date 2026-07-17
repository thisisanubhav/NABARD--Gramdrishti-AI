import { chromium } from "playwright";

const url = process.argv[2] || "http://localhost:5173";
const outPath = process.argv[3] || "screenshot.png";
const actions = process.argv[4]; // JSON string of steps
const viewport = process.argv[5] ? JSON.parse(process.argv[5]) : { width: 1440, height: 900 };

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport });

const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
page.on("pageerror", (err) => errors.push(String(err)));

await page.goto(url, { waitUntil: "networkidle" });

if (actions) {
  const script = JSON.parse(actions);
  for (const step of script) {
    if (step.fill) await page.fill(step.fill.selector, step.fill.value);
    if (step.click) await page.click(step.click);
    if (step.waitFor) await page.waitForSelector(step.waitFor, { timeout: 15000 });
    if (step.waitTimeout) await page.waitForTimeout(step.waitTimeout);
  }
}

await page.screenshot({ path: outPath, fullPage: true });
console.log("Saved screenshot to", outPath);
console.log("Console errors:", errors.length ? errors : "none");
await browser.close();
