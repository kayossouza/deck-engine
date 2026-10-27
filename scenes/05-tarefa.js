// Homework and where to join.
DECK.register({
  id: "S5", section: "Dojo", block: "Fechamento", minutes: 10, steps: 2,
  title: "Tarefa da semana",
  message: "Reescreva 3 bullets do seu CV com o padrão e poste no grupo até domingo.",
  notes: [
    "Perguntas abertas antes de fechar.",
    "Na próxima quarta, os bullets que chegarem no grupo abrem o encontro.",
  ],
  css: `
    .tarefa-05 .big { font-size: 56px; font-weight: 700; line-height: 1.2; margin-top: 40px; }
    .tarefa-05 .link { font: 500 40px var(--font-mono); color: var(--accent); margin-top: 60px; }
  `,
  html: `
  <div class="tarefa-05">
    <div class="big">3 bullets · padrão X, Y, Z · no grupo até domingo</div>
    <div class="link at-1 rise">Quer entrar no Dojo? kinho.dev/mentoria</div>
  </div>`,
});
