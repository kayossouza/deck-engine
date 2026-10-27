// SVG diagram animated by step: HTML nodes over an SVG wire layer.
// "draw at-k" draws a path at step k (needs pathLength="1"), "flow-k" sends one pulse along it,
// "hl-k" highlights a node at step k, "ok-k" marks it as OK from step k on, "focus-k" fades the rest.
DECK.register({
  id: "S3", section: "Exemplo", block: "Conceitos", minutes: 3, steps: 5,
  title: "Diagrama animado por etapa",
  message: "Uma requisição atravessa o sistema, uma etapa por vez.",
  notes: [
    "Apresente os três componentes antes de qualquer seta. O público precisa do mapa antes do movimento.",
    "O navegador chama a API. A seta é desenhada (<b>draw at-1</b>), um pulso percorre o caminho (<b>flow-1</b>) e a API fica em destaque (<b>hl-1</b>).",
    "A API consulta o banco. Mesma ideia, na etapa 2.",
    "A resposta volta pelo caminho tracejado e o navegador fica verde (<b>ok-3</b>). Cor de estado sempre com rótulo de texto.",
    "Foco: <b>focus-4</b> deixa só o painel aceso e esmaece o resto. Use para fechar a ideia da cena.",
  ],
  guide: {
    goal: "Mostrar como uma cena anima um diagrama só trocando classes por etapa.",
    points: [
      "Os nós são HTML posicionados com --x, --y, --w e --h.",
      "As setas são paths SVG no mesmo sistema de coordenadas do corpo (1728 x 780).",
      "Cada etapa só liga classes; voltar dá o mesmo resultado que avançar.",
    ],
    bridge: "Depois do diagrama, um bloco de código com linhas destacadas por etapa.",
    questions: [
      { q: "Dá para usar um SVG pronto, exportado de outra ferramenta?", a: "Dá. Cole o SVG no html da cena e ponha as classes at-k, draw e flow-k nos elementos que devem mudar." },
    ],
  },
  css: `
    .diag-03 .node { font-size: 30px; }
    .diag-03 .panel { font-size: 28px; }
  `,
  html: `
  <div class="diagram diag-03">
    <svg class="wires" viewBox="0 0 1728 780" aria-hidden="true">
      <path class="wire draw at-1 flow-1" pathLength="1" d="M320 220 L700 220" marker-end="url(#arr)"/>
      <text class="wlabel mono bg at-1" x="510" y="200" text-anchor="middle">GET /orders</text>
      <path class="wire draw at-2 flow-2" pathLength="1" d="M1024 220 L1404 220" marker-end="url(#arr)"/>
      <text class="wlabel mono bg at-2" x="1214" y="200" text-anchor="middle">SELECT</text>
      <path class="wire dashed draw at-3 flow-3" pathLength="1" d="M1568 290 L1568 400 L160 400 L160 294" marker-end="url(#arr)"/>
      <text class="wlabel mono bg at-3" x="864" y="390" text-anchor="middle">200 OK</text>
    </svg>
    <div class="node ok-3" style="--x:0px;--y:150px;--w:320px;--h:140px">Navegador<span class="sub">cliente</span></div>
    <div class="node hl-1" style="--x:704px;--y:150px;--w:320px;--h:140px">API<span class="sub">servidor</span></div>
    <div class="node store hl-2" style="--x:1408px;--y:150px;--w:320px;--h:140px">Banco<span class="sub">dados</span></div>
    <span class="chip ok at-3" style="position:absolute;left:0;top:310px">OK</span>
    <div class="panel at-4 rise focus-4" style="--x:0px;--y:500px;--w:1728px">
      <div class="ptitle">Ideia da cena</div>
      Cada etapa liga classes em elementos que já existem. Nada é criado ou removido durante a navegação.
    </div>
  </div>`,
});
