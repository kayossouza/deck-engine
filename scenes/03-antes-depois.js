// One bullet before and after, using a real bullet from Kayo's own CV.
DECK.register({
  id: "S3", section: "Dojo", block: "Revisão ao vivo", minutes: 30, steps: 3,
  title: "Antes e depois de um bullet",
  message: "Exemplo do meu próprio CV, da época em que liderei pagamentos na Yooga.",
  notes: [
    "Antes: a frase diz onde a pessoa estava, não o que ela fez.",
    "Depois: o problema que sumiu, o tamanho dele e como foi resolvido.",
    "Agora é a vez de vocês: abram os CVs que chegaram no grupo e façam o mesmo com 2 ou 3 bullets.",
  ],
  css: `
    .ad-03 .panel { font-size: 34px; }
    .ad-03 .antes { color: var(--ink-2); }
  `,
  html: `
  <div class="ad-03">
    <div class="panel antes" style="--x:0px;--y:20px;--w:1728px">
      <div class="ptitle">Antes</div>
      Trabalhei com pagamentos.
    </div>
    <div class="panel at-1 rise" style="--x:0px;--y:220px;--w:1728px;border-color:var(--accent)">
      <div class="ptitle">Depois</div>
      Acabei com cobranças duplicadas, condições de corrida e estados de pagamento inconsistentes, desenhando fluxos de transação idempotentes e handlers de webhook assinados em dois provedores de pagamento.
    </div>
    <span class="chip ok at-2" style="position:absolute;left:0;top:520px">Problema que sumiu</span>
    <span class="chip ok at-2" style="position:absolute;left:330px;top:520px">Como foi resolvido</span>
    <span class="chip ok at-2" style="position:absolute;left:660px;top:520px">Escala: dois provedores</span>
  </div>`,
});
