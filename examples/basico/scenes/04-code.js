// Code block: one ".ln" per line. "hl-k" highlights a line only at step k, "hlge-k" from step k on.
// The right column swaps its text per step with "only-k".
DECK.register({
  id: "S4", section: "Exemplo", block: "Conceitos", minutes: 3, steps: 4, layout: "wide",
  title: "Código com destaque por etapa",
  notes: [
    "Mostre o código inteiro primeiro. Deixe o público ler por alguns segundos antes de falar.",
    "Destaque o laço: a linha muda de fundo com <b>hl-1</b>. O texto da direita troca com <b>only-1</b>.",
    "Destaque o retorno com <b>hl-2</b>.",
    "A versão refatorada entra embaixo, como diff: linha removida em vermelho, linha nova em verde.",
  ],
  css: `
    .code-04 { display: grid; grid-template-columns: 1040px 1fr; gap: 48px; height: 100%; }
    .code-04 .side { position: relative; }
    .code-04 .side .panel { position: absolute; left: 0; top: 0; width: 100%; }
    .code-04 .code { font-size: 30px; }
    .code-04 .diff { margin-top: 28px; font-size: 24px; }
  `,
  html: `
  <div class="code-04">
    <div>
<pre class="code"><span class="ln"><span class="c">// total of a shopping cart</span></span><span class="ln"><span class="k">export function</span> total(items) {</span><span class="ln">  <span class="k">let</span> sum = 0;</span><span class="ln hl-1">  <span class="k">for</span> (<span class="k">const</span> item <span class="k">of</span> items) {</span><span class="ln hl-1">    sum += item.price * item.qty;</span><span class="ln hl-1">  }</span><span class="ln hl-2">  <span class="k">return</span> sum;</span><span class="ln">}</span></pre>
<pre class="diff at-3 rise"><span class="ln del">-  let sum = 0;</span><span class="ln del">-  for (const item of items) {</span><span class="ln del">-    sum += item.price * item.qty;</span><span class="ln del">-  }</span><span class="ln del">-  return sum;</span><span class="ln add">+  return items.reduce((sum, item) =&gt; sum + item.price * item.qty, 0);</span></pre>
    </div>
    <div class="side">
      <div class="panel only-0"><div class="ptitle">Etapa 1</div>O código aparece inteiro. Sem destaque ainda.</div>
      <div class="panel only-1"><div class="ptitle">Etapa 2</div>O laço soma preço vezes quantidade de cada item.</div>
      <div class="panel only-2"><div class="ptitle">Etapa 3</div>O retorno entrega a soma.</div>
      <div class="panel only-3"><div class="ptitle">Etapa 4</div>A mesma função com <span class="mono">reduce</span>, mostrada como diff.</div>
    </div>
  </div>`,
});
