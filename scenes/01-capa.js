// Cover of the first Dojo session: how a company abroad reads your CV.
DECK.register({
  id: "S1", section: "Dojo", block: "Abertura", minutes: 5, steps: 2, layout: "cover",
  title: "Como uma empresa de fora lê o seu CV",
  notes: [
    "Quem é quem: cada um diz o nome, a stack e onde quer chegar, em uma frase.",
    "O link fica na tela o encontro todo. Quem quiser entrar no Dojo começa por ali.",
  ],
  css: `
    .capa-01 { position: absolute; left: 0; right: 0; top: 200px; }
    .capa-01 .kicker { font: 500 28px var(--font-mono); color: var(--cover-ink-2); letter-spacing: 0.04em; }
    .capa-01 .title { font-size: 104px; font-weight: 700; line-height: 1.02; letter-spacing: -0.03em; margin: 24px 0 28px; max-width: 1500px; }
    .capa-01 .sub { font-size: 38px; line-height: 1.3; color: var(--cover-ink-2); }
    .capa-01 .chips { display: flex; gap: 14px; margin-top: 44px; }
    .capa-01 .hint { position: absolute; top: 600px; font: 500 30px var(--font-mono); color: var(--cover-ink); }
  `,
  html: `
  <div class="capa-01">
    <div class="kicker">Dojo · quarta, 7h às 8h (Brasília)</div>
    <div class="title">Como uma empresa de fora lê o seu CV</div>
    <div class="sub">Primeiro encontro do Dojo, com Kayo Souza.</div>
    <div class="chips"><span class="chip section">CV</span><span class="chip section">Revisão ao vivo</span><span class="chip section">Tarefa da semana</span></div>
    <div class="hint at-1 rise">kinho.dev/mentoria</div>
  </div>`,
});
