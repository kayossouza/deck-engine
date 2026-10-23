// Browser test for the deck. Usage: node tests/deck.test.mjs  (from the repo root)
// Starts ./run.sh on a free port (stops it by PID at the end) and drives Chrome through playwright-core.
// Optional env: PLAYWRIGHT_CORE (package path), CHROME (browser executable).
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";
import os from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

function loadPlaywright() {
  const tries = [];
  if (process.env.PLAYWRIGHT_CORE) tries.push(process.env.PLAYWRIGHT_CORE);
  tries.push("playwright-core");
  const npx = join(os.homedir(), ".npm/_npx");
  if (existsSync(npx)) {
    readdirSync(npx).map((d) => join(npx, d, "node_modules/playwright-core"))
      .filter((p) => existsSync(join(p, "package.json")))
      .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
      .forEach((p) => tries.push(p));
  }
  for (const t of tries) { try { return require(t); } catch (e) {} }
  throw new Error("playwright-core not found. Run: npx -y playwright-core@latest --version, or set PLAYWRIGHT_CORE.");
}
function chromePath() {
  const c = [process.env.CHROME, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"];
  return c.find((p) => p && existsSync(p));
}
function freePort() {
  return new Promise((res, rej) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); }); s.on("error", rej); });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
function check(name, ok, detail = "") { results.push({ name, ok }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  · " + detail : ""}`); }

const port = await freePort();
const server = spawn(join(ROOT, "run.sh"), [], { cwd: ROOT, stdio: "ignore", env: { ...process.env, PORT: String(port) } });
console.log(`server: run.sh PID ${server.pid} port ${port}`);
const BASE = `http://127.0.0.1:${port}`;
let browser;
const stopServer = () => { try { process.kill(server.pid, "SIGTERM"); } catch (e) {} };
process.on("exit", stopServer);

try {
  let up = false;
  for (let i = 0; i < 50 && !up; i++) { try { up = (await fetch(BASE + "/index.html")).ok; } catch (e) {} if (!up) await sleep(100); }
  check("run.sh serves index.html", up);
  const { chromium } = loadPlaywright();
  const exe = chromePath();
  browser = await chromium.launch({ headless: true, ...(exe ? { executablePath: exe } : {}) });
  console.log(`browser: ${exe || "playwright chromium"} · ${browser.version()}`);
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });

  const external = [];
  ctx.on("request", (req) => {
    const u = new URL(req.url());
    const local = ["127.0.0.1", "localhost", "[::1]"].includes(u.hostname);
    if (!(["data:", "blob:", "about:"].includes(u.protocol) || local)) external.push(req.url());
  });
  const errors = [];

  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(BASE + "/index.html", { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);

  const fonts = await page.evaluate(() => ({ sans: document.fonts.check('600 32px "Deck Sans"'), mono: document.fonts.check('400 26px "Deck Mono"') }));
  check("IBM Plex fonts load locally", fonts.sans && fonts.mono, JSON.stringify(fonts));

  const scenes = await page.evaluate(() => window.DECK.scenes.map((d) => ({ id: d.id, steps: d.steps, notes: d.notes })));
  const N = scenes.length, TOTAL = scenes.reduce((a, d) => a + d.steps, 0);
  console.log(`scenes: ${N} (${scenes.map((d) => d.id + "x" + d.steps).join(", ")}) · total steps: ${TOTAL}`);
  check("scenes are registered", N > 0);

  const pos = (pg = page) => pg.evaluate(() => {
    const cur = [...document.querySelectorAll("#canvas .scene.current")];
    return { s: DECK.state.s, k: DECK.state.k, cur: cur.length, id: cur[0] && cur[0].dataset.id, step: cur[0] && Number(cur[0].dataset.step),
      scenes: document.querySelectorAll("#canvas .scene").length, nodes: [...document.querySelectorAll("#canvas *")].filter((e) => !e.classList.contains("flowlight")).length };
  });
  const same = (p, s, k) => p.s === s && p.k === k && p.cur === 1 && p.id === scenes[s].id && p.step === k && p.scenes === N;
  const goTo = (s, k) => page.evaluate(([s, k]) => DECK.go(s, k, { snap: true }), [s, k]);
  const settle = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await goTo(0, 0); await settle();

  const p0 = await pos();
  check("starts at scene 0 step 0 with one .current scene", same(p0, 0, 0), JSON.stringify(p0));
  const baseNodes = p0.nodes;

  // 1. step forward through every scene
  const order = []; scenes.forEach((d, s) => { for (let k = 0; k < d.steps; k++) order.push([s, k]); });
  let fwdOk = true, fwdFail = "";
  for (let i = 1; i < order.length; i++) {
    await page.keyboard.press("ArrowRight"); await settle();
    const p = await pos(); if (!same(p, ...order[i])) { fwdOk = false; fwdFail = `expected ${order[i]} got ${JSON.stringify(p)}`; break; }
  }
  check(`ArrowRight walks every step (${order.length} frames)`, fwdOk, fwdFail);
  await page.keyboard.press("ArrowRight"); await settle();
  check("ArrowRight on the last step stays put", same(await pos(), ...order[order.length - 1]));

  // 2. step back
  let backOk = true, backFail = "";
  for (let i = order.length - 2; i >= 0; i--) {
    await page.keyboard.press("ArrowLeft"); await settle();
    const p = await pos(); if (!same(p, ...order[i])) { backOk = false; backFail = `expected ${order[i]} got ${JSON.stringify(p)}`; break; }
  }
  check("ArrowLeft walks back to the start", backOk, backFail);

  // 3. scene jumps
  let jumpOk = true;
  for (let s = 1; s < N; s++) { await page.keyboard.press("Shift+ArrowRight"); await settle(); if (!same(await pos(), s, 0)) jumpOk = false; }
  check("Shift+ArrowRight jumps scene by scene (step 0)", jumpOk);
  for (let s = N - 2; s >= 0; s--) { await page.keyboard.press("Shift+ArrowLeft"); await settle(); }
  check("Shift+ArrowLeft returns to the first scene", same(await pos(), 0, 0));

  // 4. visible state per step: at-k hidden before k and shown from k on
  await goTo(2, 0); await sleep(600);
  const hiddenBefore = await page.evaluate(() => getComputedStyle(document.querySelector("#canvas .scene.current .at-1")).opacity);
  await page.keyboard.press("ArrowRight"); await sleep(900);
  const shownAfter = await page.evaluate(() => getComputedStyle(document.querySelector("#canvas .scene.current .at-1")).opacity);
  check("at-1 element is hidden at step 0 and visible at step 1", hiddenBefore === "0" && shownAfter === "1", `${hiddenBefore} -> ${shownAfter}`);

  // 5. ArrowRight + ArrowLeft 50 ms apart: final state correct, nothing duplicated
  let trOk = true, trFail = "";
  for (let s = 0; s < N; s++) {
    const cases = [];
    if (scenes[s].steps > 1) cases.push([s, 0]);
    if (s < N - 1) cases.push([s, scenes[s].steps - 1]);
    for (const [cs, ck] of cases) {
      await goTo(cs, ck); await sleep(100);
      await page.keyboard.press("ArrowRight"); await sleep(50); await page.keyboard.press("ArrowLeft");
      await sleep(900);
      const p = await pos();
      if (!same(p, cs, ck) || p.nodes !== baseNodes) { trOk = false; trFail = `${scenes[cs].id} k=${ck}: ${JSON.stringify(p)} base nodes ${baseNodes}`; }
    }
  }
  check("fast ArrowRight/ArrowLeft: correct final step, no duplicated nodes", trOk, trFail || `canvas nodes stable at ${baseNodes}`);

  // 6. replay settles on the same step
  let rpOk = true, rpFail = "";
  for (let s = 0; s < N; s++) {
    const k = scenes[s].steps - 1;
    await goTo(s, k); await sleep(100);
    await page.keyboard.press("r"); await sleep(1500);
    const p = await pos();
    const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
    if (!same(p, s, k) || running !== 0) { rpOk = false; rpFail = `${scenes[s].id}: ${JSON.stringify(p)} running animations=${running}`; }
  }
  check("R (replay) settles on the same step", rpOk, rpFail);

  // 7. overview, blackout, reduced motion
  await goTo(0, 0);
  const ovShown = () => page.evaluate(() => document.querySelector(".overlay[aria-label='Visão geral']").classList.contains("show"));
  await page.keyboard.press("o"); const ovOpen = await ovShown();
  await page.keyboard.press("o"); const ovClosed = !(await ovShown());
  await page.keyboard.press("Escape"); const escOpen = await ovShown();
  await page.keyboard.press("Escape"); const escClosed = !(await ovShown());
  check("O and Esc open and close the overview", ovOpen && ovClosed && escOpen && escClosed);
  await page.keyboard.press("b"); const black = await page.evaluate(() => document.getElementById("stage").classList.contains("black"));
  await page.keyboard.press("b"); const unblack = await page.evaluate(() => !document.getElementById("stage").classList.contains("black"));
  check("B toggles the black screen", black && unblack);
  await page.keyboard.press("m"); const red = await page.evaluate(() => document.body.classList.contains("reduced"));
  await page.keyboard.press("m"); const unred = await page.evaluate(() => !document.body.classList.contains("reduced"));
  check("M toggles reduced motion", red && unred);

  // 8. typing in the go-to box does not navigate
  await page.keyboard.press("g");
  const focused = await page.evaluate(() => document.activeElement && document.activeElement.matches(".goto input"));
  for (const key of ["l", "h", "ArrowRight", " ", "o", "r", "b", "m", "PageDown"]) await page.keyboard.press(key);
  await settle();
  const sideFx = await page.evaluate(() => ({ black: document.getElementById("stage").classList.contains("black"), reduced: document.body.classList.contains("reduced"), ov: document.querySelector(".overlay.show") !== null }));
  check("G focuses the input; keys typed there trigger nothing", focused && same(await pos(), 0, 0) && !sideFx.black && !sideFx.reduced && !sideFx.ov, JSON.stringify({ focused, ...sideFx }));
  await page.keyboard.press("Escape");
  await page.keyboard.press("g"); await page.keyboard.type(scenes[N - 1].id.toLowerCase()); await page.keyboard.press("Enter"); await settle();
  check(`G + "${scenes[N - 1].id.toLowerCase()}" + Enter jumps to the scene`, same(await pos(), N - 1, 0));
  await page.keyboard.press("g"); await page.keyboard.type("2"); await page.keyboard.press("Enter"); await settle();
  check(`G + "2" + Enter jumps to the second scene`, same(await pos(), 1, 0));

  // 9. presenter view in a second tab, synced over BroadcastChannel
  await goTo(0, 0); await settle();
  const pres = await ctx.newPage();
  pres.on("pageerror", (e) => errors.push("presenter: " + String(e)));
  await pres.goto(BASE + "/index.html?presenter=1", { waitUntil: "load" }); await sleep(400);
  const presState = () => pres.evaluate(() => ({ s: DECK.state.s, k: DECK.state.k, notes: document.querySelector("[data-f=notes]").textContent, next: document.querySelector("[data-f=nextinfo]").textContent }));
  const strip = (h) => h.replace(/<[^>]+>/g, "");
  let ps = await presState();
  check("presenter opens on the projection's position", ps.s === 0 && ps.k === 0, JSON.stringify({ s: ps.s, k: ps.k }));
  await page.bringToFront();
  await page.keyboard.press("ArrowRight"); await sleep(300);
  ps = await presState();
  check("projection ArrowRight moves the presenter", ps.s === 0 && ps.k === 1, JSON.stringify({ s: ps.s, k: ps.k }));
  check("presenter shows the notes for the current step", ps.notes === strip(scenes[0].notes[1]), ps.notes.slice(0, 60));
  await pres.bringToFront();
  await pres.keyboard.press("ArrowRight"); await pres.keyboard.press("ArrowRight"); await sleep(300);
  const pp = await pos();
  check("presenter ArrowRight moves the projection", pp.s === 1 && pp.k === 1, JSON.stringify({ s: pp.s, k: pp.k }));
  await pres.click("[data-act=next]"); await sleep(300);
  const pc = await pos();
  check("presenter next button moves the projection", pc.s === 1 && pc.k === 2, JSON.stringify({ s: pc.s, k: pc.k }));
  for (let i = 0; i < 6; i++) { await page.keyboard.press("ArrowRight"); await pres.keyboard.press("ArrowRight"); }
  await sleep(600);
  const a = await pos(), b = await presState();
  check("alternating keys in both windows: both end on the same position", a.s === b.s && a.k === b.k, `${a.s}/${a.k} vs ${b.s}/${b.k}`);
  await pres.bringToFront(); await pres.click("[data-act=start]"); await sleep(2200);
  const elapsed = await pres.evaluate(() => document.querySelector("[data-f=elapsed]").textContent);
  check("presenter timer runs after Start", elapsed !== "00:00", elapsed);
  await pres.click("[data-act=reset]");
  await pres.close();

  // 10. print mode: one page per scene x step
  const pr = await ctx.newPage();
  pr.on("pageerror", (e) => errors.push("print: " + String(e)));
  await pr.goto(BASE + "/index.html?print=1", { waitUntil: "load" });
  const prn = await pr.evaluate(() => ({ pages: document.querySelectorAll(".page").length, frames: window.DECK.frames }));
  check("?print=1 renders pages = total steps", prn.pages === TOTAL && prn.frames === TOTAL, `${prn.pages} pages, total ${TOTAL}`);
  await pr.goto(BASE + "/index.html?print=final", { waitUntil: "load" });
  const prf = await pr.evaluate(() => document.querySelectorAll(".page").length);
  check("?print=final renders one page per scene", prf === N, `${prf} pages`);

  check("no request leaves localhost", external.length === 0, external.slice(0, 5).join(" "));
  check("no JS error", errors.length === 0, errors.slice(0, 3).join(" | "));
} catch (e) {
  check("ran without exception", false, String((e && e.stack) || e));
} finally {
  if (browser) await browser.close().catch(() => {});
  stopServer();
}
const fail = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - fail}/${results.length} checks passed.`);
process.exit(fail ? 1 : 0);
