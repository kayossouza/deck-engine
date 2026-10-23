/* Deck engine. State = (scene, step). All scene DOM exists from load; steps only toggle classes.
   No build, no network requests, no timers that advance scenes. */
(function () {
  "use strict";
  const DECK = (window.DECK = { scenes: [], register });
  const MAXN = 9; // steps 0..9 get generated rules, so a scene can have up to 10 steps
  const params = new URLSearchParams(location.search);
  const MODE = params.get("print") ? "print" : params.get("presenter") ? "presenter" : "present";

  function register(def) {
    if (!def || !def.id) throw new Error("DECK.register: scene needs an id");
    def.id = String(def.id).toUpperCase();
    def.steps = Math.min(MAXN + 1, Math.max(1, def.steps || 1));
    def.notes = def.notes || [];
    if (def.css) { const st = document.createElement("style"); st.dataset.scene = def.id; st.textContent = def.css; document.head.appendChild(st); }
    DECK.scenes.push(def);
  }

  /* ---------- generated step rules ---------- */
  function stepRules() {
    const r = [];
    for (let n = 0; n <= MAXN; n++) {
      r.push(`.ge-${n} .at-${n}{opacity:1;transform:none}`);
      r.push(`.eq-${n} .only-${n}{opacity:1}`);
      r.push(`.ge-${n} .draw.at-${n}{stroke-dashoffset:0}`);
      r.push(`.ge-${n} .dim-${n}{opacity:.28}`);
      r.push(`.ge-${n} .gone-${n}{opacity:0}`);
      r.push(`.eq-${n} .hl-${n}.node,.ge-${n} .hlge-${n}.node{background:var(--accent-2);border-color:var(--accent)}`);
      r.push(`.eq-${n} .hl-${n}.wire,.ge-${n} .hlge-${n}.wire{stroke:var(--accent);stroke-width:4}`);
      r.push(`.eq-${n} .hl-${n}.wlabel,.ge-${n} .hlge-${n}.wlabel{fill:var(--accent)}`);
      r.push(`.eq-${n} .hl-${n}.ln,.ge-${n} .hlge-${n}.ln{background:var(--accent-2)}`);
      r.push(`.eq-${n} .hl-${n}.panel,.ge-${n} .hlge-${n}.panel{border-color:var(--accent);background:var(--accent-2)}`);
      r.push(`.ge-${n} .ok-${n}.node{background:var(--ok-2);border-color:var(--ok)}`);
      r.push(`.ge-${n} .warn-${n}.node{background:var(--warn-2);border-color:var(--warn)}`);
      r.push(`.ge-${n} .fail-${n}.node{background:var(--fail-2);border-color:var(--fail)}`);
      r.push(`.ge-${n} .ok-${n}.wire{stroke:var(--ok)}`);
      r.push(`.ge-${n} .warn-${n}.wire{stroke:var(--warn)}`);
      r.push(`.ge-${n} .fail-${n}.wire{stroke:var(--fail)}`);
      r.push(`.ge-${n} .ok-${n}.panel{border-color:var(--ok);background:var(--ok-2)}`);
      r.push(`.ge-${n} .warn-${n}.panel{border-color:var(--warn);background:var(--warn-2)}`);
      r.push(`.ge-${n} .fail-${n}.panel{border-color:var(--fail);background:var(--fail-2)}`);
    }
    const st = document.createElement("style");
    st.textContent = r.join("\n");
    document.head.appendChild(st);
  }

  /* ---------- focus and paths ----------
     focus-k : element highlighted at step k; the rest of the scene fades (only if the step has a focus).
     flow-k  : on a <path>, a pulse travels the path ONCE when step k is reached moving forward. */
  function applyFocus(el, k) {
    const now = el.querySelectorAll(`.focus-${k}`);
    el.classList.toggle("focus-on", now.length > 0);
    el.querySelectorAll(".focus-now").forEach((e) => e.classList.remove("focus-now"));
    el.querySelectorAll(".focus-up").forEach((e) => e.classList.remove("focus-up"));
    now.forEach((e) => {
      e.classList.add("focus-now");
      e.querySelectorAll("*").forEach((c) => c.classList.add("focus-now"));
      let p = e.parentElement; while (p && p !== el) { p.classList.add("focus-up"); p = p.parentElement; }
    });
    el.querySelectorAll(".flow-on").forEach((e) => e.classList.remove("flow-on"));
    el.querySelectorAll(`.flow-${k}`).forEach((e) => e.classList.add("flow-on"));
  }
  function isReduced() { return document.body.classList.contains("reduced") || matchMedia("(prefers-reduced-motion: reduce)").matches; }
  function playFlows(el, k) {
    if (isReduced()) return;
    el.querySelectorAll(`path.flow-${k}`).forEach((path) => {
      const ghost = path.cloneNode(false);
      ghost.removeAttribute("marker-end"); ghost.removeAttribute("marker-start");
      ghost.setAttribute("class", "flowlight"); ghost.setAttribute("pathLength", "1");
      path.parentNode.appendChild(ghost);
      const a = ghost.animate([{ strokeDashoffset: 0.14 }, { strokeDashoffset: -1 }], { duration: 900, easing: "cubic-bezier(0.3, 0, 0.2, 1)", fill: "forwards" });
      a.onfinish = () => ghost.remove();
    });
  }

  /* ---------- scene DOM ---------- */
  function sceneEl(def) {
    const el = document.createElement("section");
    el.className = "scene" + (def.layout ? " " + def.layout : "");
    el.dataset.id = def.id;
    el.setAttribute("aria-label", `${def.id} ${def.title || ""}`);
    el.innerHTML = `
      <div class="scene-head">${def.section ? `<span class="chip section">${def.section}</span>` : "<span></span>"}<span class="scene-counter"></span></div>
      <h1>${def.title || ""}</h1>
      <p class="msg">${def.message || ""}</p>
      <div class="body">${def.html || ""}</div>`;
    return el;
  }

  function setStep(el, def, k) {
    const cls = ["scene"];
    if (def.layout) cls.push(def.layout);
    for (let n = 0; n <= k; n++) cls.push("ge-" + n);
    cls.push("eq-" + k);
    el.className = cls.join(" ");
    el.dataset.step = k;
    applyFocus(el, k);
    const c = el.querySelector(".scene-counter");
    if (c) c.textContent = `${def.id} · ${k + 1}/${def.steps}`;
  }

  /* ---------- state ---------- */
  const state = { s: 0, k: 0 };
  const els = [];
  let canvas, stage, hud, chan;
  const listeners = [];
  function onChange(fn) { listeners.push(fn); }

  function clamp() {
    state.s = Math.min(Math.max(state.s, 0), DECK.scenes.length - 1);
    state.k = Math.min(Math.max(state.k, 0), DECK.scenes[state.s].steps - 1);
  }

  function render(opts) {
    opts = opts || {};
    clamp();
    const snap = !!opts.snap;
    if (snap) canvas.classList.add("snap");
    const prevShown = els.findIndex((e) => e.classList.contains("current"));
    els.forEach((el, i) => {
      if (i === state.s) { setStep(el, DECK.scenes[i], state.k); el.classList.add("current"); }
      else el.classList.remove("current");
    });
    if (snap) { void canvas.offsetWidth; canvas.classList.remove("snap"); }
    // scene change: the next scene fades in and rises slightly (hard cut on jumps, going back or reduced motion)
    if (prevShown !== -1 && prevShown !== state.s && els[state.s] && !opts.silent) {
      const ent = els[state.s]; ent.getAnimations().forEach((a) => a.cancel());
      if (!isReduced() && state.s === prevShown + 1 && state.k === 0) ent.animate([{ opacity: 0, transform: "translateY(18px)" }, { opacity: 1, transform: "none" }], { duration: 340, easing: "cubic-bezier(0.2, 0, 0, 1)" });
      else if (!isReduced() && state.s < prevShown) ent.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: "linear" });
    } else if (els[state.s]) {
      els[state.s].querySelectorAll(".flowlight").forEach((g) => g.remove());
      if (!snap) playFlows(els[state.s], state.k);
    }
    if (!opts.silent) broadcast();
    if (!opts.silent) { try { localStorage.setItem("deck.pos", JSON.stringify({ s: state.s, k: state.k, t: lastStamp })); } catch (e) {} }
    listeners.forEach((fn) => fn(state));
  }

  function go(s, k, opts) {
    if (!(opts && opts.silent)) stamp();
    const jump = s !== state.s || Math.abs(k - state.k) !== 1 || k < state.k;
    state.s = s; state.k = k;
    render(Object.assign({ snap: jump }, opts || {}));
  }
  function next() {
    const def = DECK.scenes[state.s];
    if (state.k < def.steps - 1) go(state.s, state.k + 1);
    else if (state.s < DECK.scenes.length - 1) go(state.s + 1, 0);
  }
  function prev() {
    if (state.k > 0) go(state.s, state.k - 1);
    else if (state.s > 0) go(state.s - 1, DECK.scenes[state.s - 1].steps - 1);
  }
  function nextScene() { if (state.s < DECK.scenes.length - 1) go(state.s + 1, 0); }
  function prevScene() { go(Math.max(0, state.s - 1), 0); }
  function replay() {
    const k = state.k;
    if (k === 0) { go(state.s, 0, { snap: true }); return; }
    stamp(); state.k = k - 1; render({ snap: true, silent: true });
    requestAnimationFrame(() => requestAnimationFrame(() => { state.k = k; render({ snap: false }); }));
  }
  function gotoId(txt) {
    txt = String(txt || "").trim().toUpperCase();
    let i = DECK.scenes.findIndex((d) => d.id === txt);
    if (i < 0 && /^\d+$/.test(txt)) i = parseInt(txt, 10) - 1;
    if (i >= 0 && i < DECK.scenes.length) go(i, 0);
  }

  /* ---------- sync between windows ----------
     Every local navigation gets a stamp (clock + window id). A message older than the last applied
     stamp is ignored, so a late message never moves a window backwards. */
  const WIN = Math.random().toString(36).slice(2, 8);
  let lastStamp = 0;
  function stamp() { lastStamp = Math.max(Date.now(), lastStamp + 1); return lastStamp; }
  function broadcast() {
    try { chan && chan.postMessage({ type: "pos", s: state.s, k: state.k, t: lastStamp, w: WIN }); } catch (e) {}
  }
  function applyRemote(m) {
    if ((m.t || 0) <= lastStamp) return;
    lastStamp = m.t;
    if (m.s !== state.s || m.k !== state.k) { state.s = m.s; state.k = m.k; render({ snap: true, silent: true }); }
  }
  function initSync() {
    try {
      chan = new BroadcastChannel("deck");
      chan.onmessage = (ev) => { const m = ev.data; if (m && m.type === "pos" && m.w !== WIN) applyRemote(m); };
    } catch (e) { chan = null; }
    if (!chan) window.addEventListener("storage", (ev) => { // fallback only when BroadcastChannel is missing
      if (ev.key !== "deck.pos" || !ev.newValue) return;
      try { applyRemote(JSON.parse(ev.newValue)); } catch (e) {}
    });
  }

  /* ---------- scaling ---------- */
  function fit() {
    if (!canvas || MODE !== "present") return;
    const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    canvas.style.transform = `scale(${s})`;
  }

  /* ---------- HUD, overlays ---------- */
  let hudTimer = null;
  function showHud() {
    hud.classList.add("show");
    clearTimeout(hudTimer);
    hudTimer = setTimeout(() => hud.classList.remove("show"), 2000);
  }
  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
  }
  function toggleBlack() { stage.classList.toggle("black"); syncPressed(); }
  function toggleReduced() {
    const on = document.body.classList.toggle("reduced");
    try { localStorage.setItem("deck.reduced", on ? "1" : "0"); } catch (e) {}
    syncPressed();
  }
  function syncPressed() {
    if (!hud) return;
    const b = hud.querySelector("[data-act=black]"); if (b) b.setAttribute("aria-pressed", stage.classList.contains("black"));
    const m = hud.querySelector("[data-act=motion]"); if (m) m.setAttribute("aria-pressed", document.body.classList.contains("reduced"));
  }
  function openPresenter() {
    const u = new URL(location.href); u.searchParams.set("presenter", "1"); u.searchParams.delete("print");
    window.open(u.toString(), "deck-presenter", "width=1280,height=800");
  }

  function groupLabel(key) { return key === "" ? "Cenas" : "Bloco " + key; }

  let overview, help, gotoBox;
  function buildOverlays() {
    overview = document.createElement("div");
    overview.className = "overlay"; overview.setAttribute("role", "dialog"); overview.setAttribute("aria-label", "Visão geral");
    const blocks = [];
    DECK.scenes.forEach((d, i) => {
      const key = d.block || "";
      let b = blocks.find((x) => x.key === key);
      if (!b) { b = { key, items: [] }; blocks.push(b); }
      b.items.push({ d, i });
    });
    overview.innerHTML = `<h2>Visão geral · Esc fecha</h2>` + blocks.map((b) => `
      <div class="ov-block"><div class="bt">${groupLabel(b.key)}</div>
      <div class="ov-grid">${b.items.map(({ d, i }) => `<button data-i="${i}"><span class="sid">${d.id} · ${d.steps} etapa${d.steps > 1 ? "s" : ""}${d.minutes ? " · " + d.minutes + " min" : ""}</span>${d.title || ""}</button>`).join("")}</div></div>`).join("");
    overview.addEventListener("click", (ev) => {
      const b = ev.target.closest("button[data-i]");
      if (b) { go(parseInt(b.dataset.i, 10), 0); closeOverlays(); }
    });
    document.body.appendChild(overview);

    help = document.createElement("div");
    help.className = "overlay"; help.setAttribute("role", "dialog"); help.setAttribute("aria-label", "Atalhos");
    help.innerHTML = `<h2>Atalhos · Esc fecha</h2><div class="help">
      <div><kbd>→</kbd> <kbd>Espaço</kbd> <kbd>L</kbd> próxima etapa</div>
      <div><kbd>←</kbd> <kbd>H</kbd> etapa anterior</div>
      <div><kbd>Shift+→</kbd> / <kbd>Shift+←</kbd> próxima / anterior cena</div>
      <div><kbd>Home</kbd> / <kbd>End</kbd> primeira / última cena</div>
      <div><kbd>O</kbd> visão geral</div>
      <div><kbd>F</kbd> tela cheia</div>
      <div><kbd>B</kbd> ou <kbd>.</kbd> tela preta</div>
      <div><kbd>R</kbd> replay da etapa</div>
      <div><kbd>P</kbd> visão do apresentador</div>
      <div><kbd>M</kbd> movimento reduzido</div>
      <div><kbd>G</kbd> ir para a cena (id ou número)</div>
      <div><kbd>?</kbd> esta lista</div></div>`;
    document.body.appendChild(help);

    gotoBox = document.createElement("div");
    gotoBox.className = "goto"; gotoBox.setAttribute("role", "dialog"); gotoBox.setAttribute("aria-label", "Ir para a cena");
    gotoBox.innerHTML = `<label>Ir para a cena <input type="text" aria-label="Id ou número da cena" placeholder="${(DECK.scenes[0] && DECK.scenes[0].id) || "1"}"></label>`;
    const inp = gotoBox.querySelector("input");
    inp.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") { gotoId(inp.value); closeOverlays(); }
      if (ev.key === "Escape") closeOverlays();
      ev.stopPropagation();
    });
    document.body.appendChild(gotoBox);
  }
  function toggleOverview() {
    const on = overview.classList.toggle("show");
    help.classList.remove("show");
    if (on) {
      overview.querySelectorAll("button").forEach((b) => b.classList.toggle("cur", parseInt(b.dataset.i, 10) === state.s));
      const cur = overview.querySelector("button.cur"); if (cur) cur.focus();
    }
  }
  function toggleHelp() { help.classList.toggle("show"); overview.classList.remove("show"); }
  function closeOverlays() {
    overview.classList.remove("show"); help.classList.remove("show"); gotoBox.classList.remove("show");
    if (gotoBox.contains(document.activeElement)) document.activeElement.blur();
  }

  function isTyping(ev) {
    const t = ev.target;
    if (t && t.tagName === "BUTTON" && (ev.key === " " || ev.key === "Enter")) return true; // the button handles it
    return t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
  }
  function keys(ev) {
    if (isTyping(ev)) return;
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    const k = ev.key;
    if (k === "Escape") {
      if (overview.classList.contains("show") || help.classList.contains("show") || gotoBox.classList.contains("show")) closeOverlays();
      else toggleOverview();
      return;
    }
    if (overview.classList.contains("show") || help.classList.contains("show")) { if (k === "o" || k === "O" || k === "?") closeOverlays(); return; }
    switch (k) {
      case "ArrowRight": case " ": case "PageDown": case "l": case "L": ev.preventDefault(); ev.shiftKey ? nextScene() : next(); break;
      case "ArrowLeft": case "PageUp": case "h": case "H": ev.preventDefault(); ev.shiftKey ? prevScene() : prev(); break;
      case "Home": go(0, 0); break;
      case "End": go(DECK.scenes.length - 1, 0); break;
      case "o": case "O": toggleOverview(); break;
      case "f": case "F": toggleFullscreen(); break;
      case "b": case "B": case ".": if (stage) toggleBlack(); break;
      case "r": case "R": replay(); break;
      case "p": case "P": if (MODE === "present") openPresenter(); break;
      case "m": case "M": toggleReduced(); break;
      case "g": case "G": ev.preventDefault(); gotoBox.classList.add("show"); gotoBox.querySelector("input").value = ""; gotoBox.querySelector("input").focus(); break;
      case "?": toggleHelp(); break;
    }
  }

  function buildHud() {
    hud = document.createElement("nav");
    hud.id = "hud"; hud.setAttribute("aria-label", "Controles da apresentação");
    const btn = (act, label, text) => `<button data-act="${act}" aria-label="${label}" title="${label}">${text}</button>`;
    hud.innerHTML = btn("prev", "Etapa anterior (←)", "◀") + btn("next", "Próxima etapa (→)", "▶") + `<span class="pos"></span>` +
      btn("overview", "Visão geral (O)", "Cenas") + btn("replay", "Replay da etapa (R)", "Replay") + btn("full", "Tela cheia (F)", "Tela cheia") +
      btn("black", "Tela preta (B)", "Tela preta") + btn("presenter", "Visão do apresentador (P)", "Apresentador") + btn("motion", "Movimento reduzido (M)", "Mov. reduzido") + btn("help", "Atalhos (?)", "?");
    const actions = { prev, next, overview: toggleOverview, replay, full: toggleFullscreen, black: toggleBlack, presenter: openPresenter, motion: toggleReduced, help: toggleHelp };
    hud.addEventListener("click", (ev) => {
      const b = ev.target.closest("button"); if (!b) return;
      if (ev.detail > 0) b.blur(); // mouse click: give the keyboard back to the deck
      actions[b.dataset.act]();
    });
    document.body.appendChild(hud);
    onChange(() => { hud.querySelector(".pos").textContent = `${DECK.scenes[state.s].id} ${state.k + 1}/${DECK.scenes[state.s].steps}`; });
    document.addEventListener("mousemove", showHud);
    hud.addEventListener("focusin", () => hud.classList.add("show"));
    syncPressed();
  }

  /* ---------- presenter view ---------- */
  function buildPresenter() {
    document.body.classList.add("presenter");
    const pv = document.createElement("div"); pv.id = "pv";
    pv.innerHTML = `
      <div class="pv-top">
        <span class="big" data-f="clock">--:--</span>
        <span class="lbl">decorrido</span><span class="big" data-f="elapsed">00:00</span>
        <span class="lbl">planejado</span><span data-f="planned">-</span>
        <span class="delta" data-f="delta">-</span>
        <button data-act="start">Iniciar / pausar</button><button data-act="reset">Zerar</button>
        <span class="sp"></span>
        <button data-act="prev" aria-label="Etapa anterior">◀</button><button data-act="next" aria-label="Próxima etapa">▶</button>
      </div>
      <nav class="pv-map" aria-label="Mapa da apresentação" data-f="map"></nav>
      <div class="pv-cur"><span class="pv-label" data-f="curlabel">AGORA</span><div class="pv-frame" data-m="cur"></div></div>
      <div class="pv-side">
        <div class="pv-next"><span class="pv-label">PRÓXIMA</span><div class="pv-frame" data-m="next"></div></div>
        <div class="pv-card"><div class="obj" data-f="goal"></div><ul class="points" data-f="points"></ul></div>
      </div>
      <div class="pv-notes">
        <div class="nt"><span>Notas</span><span data-f="dots" class="dots"></span></div>
        <div data-f="notes" class="talk"></div>
      </div>
      <div class="pv-help">
        <div class="nt">Ponte para a próxima</div><div data-f="bridge" class="bridge"></div>
        <div class="nt">Se perguntarem</div><div data-f="questions" class="questions"></div>
        <div class="nxt" data-f="nextinfo"></div>
      </div>`;
    document.body.appendChild(pv);
    const cur = pv.querySelector("[data-m=cur]"), nxt = pv.querySelector("[data-m=next]");
    const curEls = DECK.scenes.map((d) => { const e = sceneEl(d); cur.appendChild(e); return e; });
    const nxtEls = DECK.scenes.map((d) => { const e = sceneEl(d); nxt.appendChild(e); return e; });
    function fitMini(box) {
      const m = box.querySelector(":scope > .pv-frame");
      const s = Math.min(box.clientWidth / 1920, box.clientHeight / 1080);
      m.style.transform = `scale(${s})`;
    }
    const ro = new ResizeObserver(() => { fitMini(pv.querySelector(".pv-cur")); fitMini(pv.querySelector(".pv-next")); });
    ro.observe(pv.querySelector(".pv-cur")); ro.observe(pv.querySelector(".pv-next"));
    cur.classList.add("snap"); nxt.classList.add("snap");

    const cum = []; let acc = 0;
    DECK.scenes.forEach((d) => { cum.push(acc); acc += d.minutes || 0; });
    let timer = { start: null, acc: 0 };
    try { timer = JSON.parse(localStorage.getItem("deck.timer") || "null") || timer; } catch (e) {}
    function saveTimer() { try { localStorage.setItem("deck.timer", JSON.stringify(timer)); } catch (e) {} }
    function elapsedMs() { return timer.acc + (timer.start ? Date.now() - timer.start : 0); }
    pv.querySelector("[data-act=start]").addEventListener("click", (ev) => { ev.currentTarget.blur(); if (timer.start) { timer.acc += Date.now() - timer.start; timer.start = null; } else timer.start = Date.now(); saveTimer(); tick(); });
    pv.querySelector("[data-act=reset]").addEventListener("click", (ev) => { ev.currentTarget.blur(); timer = { start: null, acc: 0 }; saveTimer(); tick(); });
    pv.querySelector("[data-act=prev]").addEventListener("click", (ev) => { ev.currentTarget.blur(); prev(); });
    pv.querySelector("[data-act=next]").addEventListener("click", (ev) => { ev.currentTarget.blur(); next(); });
    const mapEl = pv.querySelector("[data-f=map]");
    let lastBlock = null;
    mapEl.innerHTML = DECK.scenes.map((d, i) => {
      const key = d.block || "";
      const head = key !== lastBlock ? `<div class="mb">${groupLabel(key)}</div>` : ""; lastBlock = key;
      return head + `<button class="mi" data-i="${i}"><span class="mt">${d.title || d.id}</span><span class="mm">${d.id}${d.minutes ? " · " + String(d.minutes).replace(".", ",") + " min" : ""}</span></button>`;
    }).join("");
    mapEl.addEventListener("click", (ev) => { const b = ev.target.closest("button[data-i]"); if (b) { b.blur(); go(parseInt(b.dataset.i, 10), 0); } });
    function fmt(ms) { const t = Math.floor(ms / 1000); return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0"); }
    function tick() {
      const now = new Date();
      pv.querySelector("[data-f=clock]").textContent = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
      pv.querySelector("[data-f=elapsed]").textContent = fmt(elapsedMs());
      const d = DECK.scenes[state.s];
      const planned = cum[state.s];
      pv.querySelector("[data-f=planned]").textContent = d.minutes ? `${planned}-${planned + d.minutes} min` : "-";
      const delta = elapsedMs() / 60000 - planned;
      const de = pv.querySelector("[data-f=delta]");
      if (!d.minutes || (!timer.start && timer.acc === 0)) { de.textContent = "-"; de.className = "delta"; }
      else { de.textContent = (delta >= 0 ? "+" : "-") + Math.abs(delta).toFixed(1) + " min " + (delta >= 0 ? "atrasado" : "adiantado"); de.className = "delta " + (delta > 1 ? "late" : delta < -1 ? "early" : ""); }
    }
    setInterval(tick, 500);

    function paint() {
      const d = DECK.scenes[state.s];
      curEls.forEach((e, i) => { if (i === state.s) setStep(e, d, state.k); e.classList.toggle("current", i === state.s); });
      let ns = state.s, nk = state.k + 1;
      if (nk >= d.steps) { ns = Math.min(state.s + 1, DECK.scenes.length - 1); nk = ns === state.s ? state.k : 0; }
      const nd = DECK.scenes[ns];
      nxtEls.forEach((e, i) => { if (i === ns) setStep(e, nd, nk); e.classList.toggle("current", i === ns); });
      const label = ns === state.s && nk === state.k ? "fim" : `${nd.id} · ${nk + 1}/${nd.steps} · ${nd.title || ""}`;
      pv.querySelector("[data-f=notes]").innerHTML = d.notes[state.k] || d.notes[0] || "sem notas";
      const g = d.guide || {};
      pv.querySelector("[data-f=goal]").textContent = g.goal || d.message || "";
      pv.querySelector("[data-f=points]").innerHTML = (g.points || []).map((x) => `<li>${x}</li>`).join("");
      pv.querySelector("[data-f=bridge]").innerHTML = g.bridge || "-";
      pv.querySelector("[data-f=questions]").innerHTML = (g.questions || []).map((x) => `<p><b>${x.q}</b><br>${x.a}</p>`).join("") || "-";
      pv.querySelector("[data-f=dots]").innerHTML = Array.from({ length: d.steps }, (_, i) => `<i class="${i < state.k ? "done" : i === state.k ? "cur" : ""}"></i>`).join("") + ` etapa ${state.k + 1} de ${d.steps}`;
      pv.querySelector("[data-f=curlabel]").textContent = `AGORA · ${d.title || d.id}`;
      mapEl.querySelectorAll("button[data-i]").forEach((b) => { const i = +b.dataset.i; b.classList.toggle("cur", i === state.s); b.classList.toggle("done", i < state.s); });
      const curBtn = mapEl.querySelector("button.cur"); if (curBtn) curBtn.scrollIntoView({ block: "nearest" });
      pv.querySelector("[data-f=nextinfo]").textContent = "Próximo: " + label;
      tick();
    }
    onChange(paint);
    paint();
  }

  /* ---------- print mode: one page per scene x step (?print=1), or only the final step (?print=final) ---------- */
  function buildPrint() {
    document.body.classList.add("print");
    const finalOnly = params.get("print") === "final";
    const frag = document.createDocumentFragment();
    let n = 0;
    DECK.scenes.forEach((d) => {
      for (let k = finalOnly ? d.steps - 1 : 0; k < d.steps; k++) {
        const page = document.createElement("div"); page.className = "page snap" + (finalOnly ? " final" : "");
        const e = sceneEl(d); setStep(e, d, k); e.classList.add("current");
        page.appendChild(e);
        const lab = document.createElement("div"); lab.className = "frame-label";
        lab.textContent = `quadro ${++n} · ${d.id} · etapa ${k + 1}/${d.steps}`;
        page.appendChild(lab);
        frag.appendChild(page);
      }
    });
    document.body.appendChild(frag);
    document.title = `${document.title} · ${n} quadros`;
    DECK.frames = n;
  }

  /* ---------- boot ---------- */
  function boot() {
    stepRules();
    try { if (localStorage.getItem("deck.reduced") === "1") document.body.classList.add("reduced"); } catch (e) {}
    document.body.classList.add("auto-reduced");
    if (!DECK.scenes.length) { document.body.insertAdjacentHTML("beforeend", "<p style='color:#fff;padding:24px'>Nenhuma cena registrada.</p>"); return; }
    if (MODE === "print") { buildPrint(); return; }
    stage = document.getElementById("stage"); canvas = document.getElementById("canvas");
    DECK.scenes.forEach((d) => { const e = sceneEl(d); els.push(e); canvas.appendChild(e); });
    try { const p = JSON.parse(localStorage.getItem("deck.pos") || "null"); if (p) { state.s = p.s; state.k = p.k; } } catch (e) {}
    const q = params.get("scene");
    if (q) { const i = DECK.scenes.findIndex((d) => d.id === q.toUpperCase()); if (i >= 0) { state.s = i; state.k = parseInt(params.get("step") || "0", 10) || 0; } }
    buildOverlays();
    initSync();
    if (MODE === "presenter") buildPresenter();
    else { document.body.classList.add("presenting"); buildHud(); window.addEventListener("resize", fit); fit(); }
    document.addEventListener("keydown", keys);
    render({ snap: true, silent: MODE === "presenter" });
    if (MODE === "presenter") stage.style.display = "none";
  }
  DECK.go = go; DECK.next = next; DECK.prev = prev; DECK.replay = replay; DECK.state = state; DECK.gotoId = gotoId;
  window.addEventListener("DOMContentLoaded", boot);
})();
