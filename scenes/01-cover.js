// Cover scene: layout "cover" hides the title bar and paints the slide with --cover-bg.
DECK.register({
  id: "S1", section: "Exemplo", block: "Abertura", minutes: 1, steps: 2, layout: "cover",
  title: "deck-engine",
  notes: [
    "Abertura. Diga o nome da apresentação e o que o público vai levar dela. Estas notas aparecem só na visão do apresentador (tecla P).",
    "Segunda etapa da capa: a dica de atalhos aparece embaixo. Cada etapa da cena pode ter a sua nota.",
  ],
  css: `
    .cover-01 { position: absolute; left: 0; right: 0; top: 230px; }
    .cover-01 .kicker { font: 500 28px var(--font-mono); color: var(--cover-ink-2); letter-spacing: 0.04em; }
    .cover-01 .title { font-size: 128px; font-weight: 700; line-height: 1; letter-spacing: -0.03em; margin: 24px 0 28px; }
    .cover-01 .sub { font-size: 40px; line-height: 1.3; color: var(--cover-ink-2); max-width: 1300px; }
    .cover-01 .chips { display: flex; gap: 14px; margin-top: 48px; }
    .cover-01 .hint { position: absolute; top: 560px; font-size: 28px; color: var(--cover-ink-2); }
    .cover-01 kbd { font: 500 24px var(--font-mono); color: var(--cover-ink); border: 1px solid var(--cover-ink-2); border-radius: 6px; padding: 2px 10px; }
  `,
  html: `
  <div class="cover-01">
    <div class="kicker">HTML + CSS + JS · sem build</div>
    <div class="title">deck-engine</div>
    <div class="sub">Apresentações que rodam no navegador, com etapas, visão do apresentador e exportação para PDF.</div>
    <div class="chips"><span class="chip section">Etapas</span><span class="chip section">Apresentador</span><span class="chip section">PDF</span></div>
    <div class="hint at-1 rise">Aperte <kbd>P</kbd> para abrir a visão do apresentador e <kbd>?</kbd> para ver os atalhos.</div>
  </div>`,
});
