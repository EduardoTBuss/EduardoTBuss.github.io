/** Real-browser smoke checks against a running production preview.
 * Run with Playwright available, or set PORTFOLIO_PLAYWRIGHT_MODULE to its index.mjs.
 * Evidence stays in gitignored artifacts/qa. No personal browser profile is used.
 */
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const { chromium } = await import(
  process.env.PORTFOLIO_PLAYWRIGHT_MODULE || "playwright"
);
const origin = process.env.PORTFOLIO_PREVIEW_URL || "http://127.0.0.1:4321";
const out = "artifacts/qa";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
const report = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on("pageerror", (e) => errors.push(e.message));
try {
  for (const route of [
    "/",
    "/projects/",
    "/publications/",
    "/cv/",
    "/projects/physics2d/",
    "/projects/nbody-sim/",
    "/projects/quantum-algorithms-qiskit/",
    "/projects/inventory-management-api/",
    "/projects/mnist-neural-network-numpy/",
    "/projects/poker-decision-analytics/",
    "/projects/q-fie/",
    "/projects/neuroevolution-sim/",
    "/projects/ray-tracer/",
    "/404.html",
  ]) {
    const response = await page.goto(origin + route);
    assert.equal(response.status(), 200, route);
    assert.equal(await page.locator("h1").count(), 1, route + " heading");
    const problems = await page.evaluate(() => {
      const ids = new Set(
        [...document.querySelectorAll("[id]")].map((e) => e.id),
      );
      return [...document.querySelectorAll("[aria-labelledby]")]
        .filter((e) =>
          e
            .getAttribute("aria-labelledby")
            .split(" ")
            .some((id) => !ids.has(id)),
        )
        .map((e) => e.outerHTML.slice(0, 150));
    });
    assert.deepEqual(problems, [], route + " accessible heading targets");
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      route + " horizontal overflow",
    );
    report.push({ route, status: response.status() });
  }
  await page.goto(origin);
  assert.equal(await page.locator('.orbital-scene').count(), 0);
  assert.deepEqual(
    await page.locator('.deck-slide .actions .primary').evaluateAll((links) =>
      links.map((link) => link.getAttribute('href'))),
    ['/projects/q-fie/', '/projects/neuroevolution-sim/', '/projects/ray-tracer/'],
  );
  await page.screenshot({ path: out + "/desktop-home.png", fullPage: true });
  const pause = page.locator("[data-motion-toggle]");
  await pause.click();
  assert.equal(
    await page.locator("html").getAttribute("data-motion"),
    "paused",
  );
  await page.reload();
  assert.equal(
    await page.locator("html").getAttribute("data-motion"),
    "paused",
  );
  await page.goto(origin + "/cv/");
  assert.equal(
    await page
      .locator(".page-container")
      .evaluate((e) => getComputedStyle(e).opacity),
    "1",
    "paused route remains readable",
  );
  await page.goto(origin);
  await pause.click();
  const deck = page.locator("[data-project-deck]").first();
  await deck.locator("[data-deck-next]").click();
  await page.waitForFunction(() =>
    document.querySelector(".deck-count")?.textContent.startsWith("02"),
  );
  await deck.locator(".deck-track").focus();
  await page.keyboard.press("End");
  await page.waitForFunction(() =>
    document.querySelector(".deck-count")?.textContent.startsWith("03"),
  );
  assert.equal(await deck.locator("[data-deck-next]").isDisabled(), true);
  await deck.locator("[data-deck-prev]").click();
  await page.waitForFunction(() =>
    document.querySelector(".deck-count")?.textContent.startsWith("02"),
  );
  await page.goto(origin + "/publications/");
  await page.locator('label[for="tab-ml"]').click();
  assert.equal(await page.locator(".pub-item:visible").count(), 1);
  await page.locator("#tab-ml").focus();
  await page.keyboard.press("ArrowLeft");
  assert.equal(await page.locator(".pub-item:visible").count(), 5);
  await page.locator('label[for="tab-all"]').click();
  assert.equal(await page.locator(".pub-item:visible").count(), 6);
  const disclosure = page.locator("details").first();
  await disclosure.locator("summary").click();
  assert.equal(await disclosure.getAttribute("open"), "");
  await page.screenshot({
    path: out + "/desktop-publications.png",
    fullPage: true,
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(
    () => document.querySelector("[data-motion-toggle]")?.disabled,
  );
  assert.equal(await pause.isDisabled(), true);
  assert.equal(
    await page.locator("html").getAttribute("data-motion"),
    "paused",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const width of [390, 320, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of [
      "/",
      "/projects/",
      "/publications/",
      "/cv/",
      "/projects/physics2d/",
    ]) {
      await page.goto(origin + route);
      const overflow = await page.evaluate(() => ({
        clear: document.documentElement.scrollWidth <= innerWidth,
        width: document.documentElement.scrollWidth,
        culprits: [...document.querySelectorAll('body *')]
          .filter((element) => element.getBoundingClientRect().right > innerWidth + 1)
          .slice(0, 30)
          .map((element) => `${element.tagName.toLowerCase()}.${String(element.className).replaceAll(' ', '.')}:${Math.round(element.getBoundingClientRect().right)} (parent ${Math.round(element.parentElement?.getBoundingClientRect().right ?? 0)})`),
      }));
      assert.equal(overflow.clear, true, `${route} overflow at ${width} (scrollWidth ${overflow.width}): ${overflow.culprits.join(', ')}`);
    }
    await page.goto(origin);
    if (width === 390)
      await page.screenshot({ path: out + "/mobile-home.png", fullPage: true });
  }
  const nojs = await browser.newContext({
    javaScriptEnabled: false,
    reducedMotion: "reduce",
    viewport: { width: 390, height: 844 },
  });
  const staticPage = await nojs.newPage();
  await staticPage.goto(origin);
  assert.equal(await staticPage.locator("h1").isVisible(), true);
  assert.equal(await staticPage.locator(".deck-slide").count(), 3);
  await staticPage.goto(origin + "/publications/");
  await staticPage.locator('label[for="tab-ml"]').click();
  assert.equal(await staticPage.locator(".pub-item:visible").count(), 1);
  await staticPage.locator("details:visible summary").first().click();
  assert.equal(await staticPage.locator("details[open]:visible").count(), 1);
  await nojs.close();
  assert.deepEqual(errors, [], "browser runtime errors");
  await writeFile(
    out + "/report.json",
    JSON.stringify(
      {
        passed: true,
        routes: report,
        viewports: [1440, 768, 390, 320],
        checks: [
          "deck pointer and keyboard",
          "publication filters and disclosure",
          "global pause and persistence",
          "live reduced motion",
          "no-JS content and filters",
          "no horizontal overflow",
          "no runtime errors",
        ],
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: 14 routes; desktop/mobile; deck; publications; pause; reduced motion; no JS.",
  );
} finally {
  await browser.close();
}
