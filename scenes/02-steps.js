// Step-based reveals: "at-k" shows an element from step k on, "rise" adds a small upward entrance,
// "dim-k" fades it from step k on, "only-k" shows it only at step k.
DECK.register({
  id: "S2", section: "Exemplo", block: "Conceitos", minutes: 2, steps: 4,
  title: "Revelação por etapas",
  message: "Cada seta mostra um item novo. Nada é criado na hora: tudo já está no HTML.",
  notes: [
    "Etapa 1 de 4. Só o primeiro item aparece. O resto já está no DOM, com opacidade zero.",
    "Etapa 2. O segundo item entra com a classe <b>at-1 rise</b>.",
    "Etapa 3. O terceiro item entra com <b>at-2</b>. Os dois primeiros ficam mais claros com <b>dim-2</b>, para o público olhar para o novo.",
    "Etapa 4. O painel da direita usa <b>only-3</b>: aparece só nesta etapa. Volte uma etapa com a seta para a esquerda e ele some.",
  ],
  css: `
    .steps-02 ul.list { font-size: 36px; }
    .steps-02 ul.list li { margin-bottom: 36px; }
    .steps-02 code { font-family: var(--font-mono); font-size: 0.85em; background: var(--bg-2); padding: 2px 8px; border-radius: 6px; }
  `,
  html: `
  <div class="cols two steps-02">
    <ul class="list">
      <li class="dim-2">Uma cena declara quantas <b>etapas</b> tem: <code>steps: 4</code></li>
      <li class="at-1 rise dim-2">O motor põe <code>ge-0</code> até <code>ge-k</code> e <code>eq-k</code> na cena</li>
      <li class="at-2 rise">O CSS decide o que aparece em cada etapa</li>
    </ul>
    <div class="panel static only-3" style="align-self:start">
      <div class="ptitle">Por que assim</div>
      Voltar, pular e repetir sempre caem no mesmo estado visual. A apresentação é determinística: a etapa 3 é igual em todo ensaio.
    </div>
  </div>`,
});
