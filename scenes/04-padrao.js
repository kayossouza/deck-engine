// The pattern used in the Dojo, drawn as a flow.
DECK.register({
  id: "S4", section: "Dojo", block: "O padrão", minutes: 5, steps: 4,
  title: "Fiz X, medido por Y, fazendo Z",
  message: "O padrão que usamos para reescrever cada bullet.",
  notes: [
    "Fiz X: o resultado, com verbo no passado.",
    "Medido por Y: o número ou o escopo que prova o resultado.",
    "Fazendo Z: como você chegou lá, e é aqui que entra a stack.",
    "Se não tem número, diga o escopo. Sem número e sem escopo, o bullet ainda não está pronto.",
  ],
  css: `
    .padrao-04 .node { font-size: 34px; }
    .padrao-04 .panel { font-size: 30px; }
  `,
  html: `
  <div class="diagram padrao-04">
    <svg class="wires" viewBox="0 0 1728 780" aria-hidden="true">
      <path class="wire draw at-1 flow-1" pathLength="1" d="M440 220 L640 220" marker-end="url(#arr-accent)"/>
      <path class="wire draw at-2 flow-2" pathLength="1" d="M1084 220 L1284 220" marker-end="url(#arr-accent)"/>
    </svg>
    <div class="node hl-0" style="--x:0px;--y:150px;--w:440px;--h:140px">Fiz X<span class="sub">o resultado</span></div>
    <div class="node at-1 hl-1" style="--x:644px;--y:150px;--w:440px;--h:140px">medido por Y<span class="sub">número ou escopo</span></div>
    <div class="node at-2 hl-2" style="--x:1288px;--y:150px;--w:440px;--h:140px">fazendo Z<span class="sub">como, com qual stack</span></div>
    <div class="panel at-3 rise focus-3" style="--x:0px;--y:420px;--w:1728px">
      <div class="ptitle">Sem número?</div>
      Diga o escopo: quantos usuários, quanto dinheiro, quantos sistemas. Sem número e sem escopo, o bullet ainda não está pronto.
    </div>
  </div>`,
});
