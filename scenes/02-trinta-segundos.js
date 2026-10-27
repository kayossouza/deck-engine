// The four things a US tech lead looks for, one per step.
DECK.register({
  id: "S2", section: "Dojo", block: "O que se procura", minutes: 10, steps: 4,
  title: "O que um tech lead dos EUA procura em 30 segundos",
  message: "Quatro perguntas. O CV que responde as quatro passa para a próxima pilha.",
  notes: [
    "Impacto com número: o que mudou porque você estava lá, e quanto.",
    "Escopo: o tamanho do que você segurou. Usuários, dinheiro, times, sistemas.",
    "Stack: as ferramentas, perto do resultado e não numa lista solta no fim.",
    "Se você entrega sozinho: o CV mostra que você fecha o trabalho sem alguém do lado?",
  ],
  css: `
    .trinta-02 ul.list { font-size: 40px; }
    .trinta-02 ul.list li { margin-bottom: 40px; }
    .trinta-02 b { color: var(--accent); }
  `,
  html: `
  <div class="trinta-02">
    <ul class="list">
      <li class="dim-1"><b>Impacto com número</b>: o que mudou, e quanto</li>
      <li class="at-1 rise dim-2"><b>Escopo</b>: o tamanho do que você segurou</li>
      <li class="at-2 rise dim-3"><b>Stack</b>: perto do resultado, não numa lista solta</li>
      <li class="at-3 rise"><b>Entrega</b>: você fecha o trabalho sozinho?</li>
    </ul>
  </div>`,
});
