# deck-engine

Se o deck-engine te ajudar, deixe uma ⭐ no repositório: é o que faz ele chegar em mais gente.

**Veja rodando:** [deck.kinho.dev](https://deck.kinho.dev), a aula do Dojo sobre CV (tecla `P` abre a visão do apresentador). Exemplo básico: [deck.kinho.dev/examples/basico](https://deck.kinho.dev/examples/basico/).

Motor de apresentações em HTML, CSS e JavaScript puro. Sem build, sem framework, sem dependência de rede. Você escreve cada cena num arquivo `.js`, define quantas etapas ela tem e usa classes CSS para dizer o que aparece em cada etapa.

O que vem pronto:

- navegação por etapas e por cenas, com estado determinístico (voltar, pular e repetir sempre caem no mesmo visual);
- visão do apresentador numa segunda janela, com notas por etapa, próxima etapa, mapa das cenas, cronômetro e relógio, sincronizada com a projeção;
- modo de impressão e exportação para PDF (uma página por etapa);
- atalhos de teclado, tela preta, tela cheia, replay da etapa, visão geral e movimento reduzido;
- um tema neutro controlado por variáveis CSS, fácil de trocar;
- um deck real como exemplo: a aula "Como uma empresa de fora lê o seu CV", do Dojo da [mentoria do Kayo](https://kinho.dev/pt-BR/mentoria), em `scenes/`;
- um exemplo básico com 4 cenas que mostra cada recurso (etapas, diagrama animado, código), em `examples/basico/`.

## Rodar

Precisa de Python 3 (só para o servidor local) e de um navegador baseado em Chromium.

```bash
./run.sh              # porta 8765; outra porta: PORT=9000 ./run.sh
```

O script sobe `python3 -m http.server` em `127.0.0.1` e mostra três endereços:

| Uso | URL |
|---|---|
| Projeção | `http://localhost:8765/index.html` |
| Apresentador | `http://localhost:8765/index.html?presenter=1` (ou tecla `P` na projeção) |
| Impressão | `http://localhost:8765/index.html?print=1` |

Para abrir direto numa cena: `index.html?scene=S3&step=2` (a etapa começa em 0).

A posição fica salva no navegador: se a aba recarregar, o deck volta à mesma cena e etapa.

## Estrutura

```
index.html        carrega deck.css, deck.js e as cenas, na ordem da apresentação
deck.css          tema (variáveis), layout das cenas, componentes, apresentador, impressão
deck.js           o motor: estado, etapas, teclado, sincronia, apresentador, impressão
scenes/*.js       uma cena por arquivo
assets/fonts/     IBM Plex Sans e IBM Plex Mono (licença OFL)
run.sh            servidor local
export-pdf.sh     gera deck.pdf com o Chrome headless
tests/            teste de navegador (navegação, apresentador, impressão)
```

## Como escrever uma cena

Crie um arquivo em `scenes/` e adicione uma linha `<script src="scenes/seu-arquivo.js"></script>` no `index.html`, na posição em que a cena deve aparecer.

```js
DECK.register({
  id: "S5",                      // identificador curto, sempre em maiúsculas; usado em ?scene= e na tecla G
  section: "Arquitetura",        // texto do selo no canto superior esquerdo (opcional)
  title: "Como o pedido chega ao banco",
  message: "Uma frase que resume a cena.",
  steps: 3,                      // quantas etapas a cena tem (1 a 10)
  minutes: 2,                    // tempo planejado, usado pelo cronômetro (opcional)
  block: "Parte 2",              // agrupa cenas na visão geral e no mapa do apresentador (opcional)
  layout: "",                    // "", "wide" (sem a linha de mensagem) ou "cover" (capa escura)
  notes: [                       // uma nota por etapa; aparece só na visão do apresentador
    "O que falar na etapa 1.",
    "O que falar na etapa 2.",
    "O que falar na etapa 3.",
  ],
  guide: {                       // cartão de apoio do apresentador (opcional)
    goal: "O objetivo da cena.",
    points: ["Ponto 1", "Ponto 2"],
    bridge: "Como ligar com a próxima cena.",
    questions: [{ q: "Pergunta provável?", a: "Resposta curta." }],
  },
  css: `.minha-cena .destaque { color: var(--accent); }`,
  html: `
    <ul class="list minha-cena">
      <li>Aparece desde a etapa 1</li>
      <li class="at-1 rise">Aparece na etapa 2</li>
      <li class="at-2 rise destaque">Aparece na etapa 3</li>
    </ul>`,
});
```

O corpo da cena (`html`) ocupa uma área de 1728 x 780 px num canvas de 1920 x 1080. O deck escala o canvas para caber na tela e mantém a proporção 16:9.

### Classes de etapa

O motor não cria nem remove elementos durante a navegação. Tudo existe no DOM desde o início; a cada etapa `k` ele põe na cena as classes `ge-0` até `ge-k` e `eq-k`, e o CSS faz o resto. As classes abaixo já vêm prontas (`k` vai de 0 a 9):

| Classe | Efeito |
|---|---|
| `at-k` | escondido antes da etapa `k`, visível a partir dela |
| `rise` | junto com `at-k`: entra subindo um pouco |
| `only-k` | visível só na etapa `k` |
| `dim-k` | fica mais claro a partir da etapa `k` |
| `gone-k` | some a partir da etapa `k` |
| `hl-k` | destaque com a cor de acento só na etapa `k` (em `.node`, `.wire`, `.wlabel`, `.panel`, `.ln`) |
| `hlge-k` | o mesmo destaque, da etapa `k` em diante |
| `ok-k`, `warn-k`, `fail-k` | cor de estado da etapa `k` em diante (em `.node`, `.panel` e `.wire`) |
| `draw at-k` | num `<path pathLength="1">`: a linha é desenhada na etapa `k` |
| `flow-k` | num `<path>`: um pulso de luz percorre o caminho uma vez ao chegar na etapa `k` |
| `focus-k` | na etapa `k`, esse elemento fica em destaque e o resto da cena esmaece |

Para efeitos próprios, use os seletores da cena no `css`, por exemplo `.ge-2 .minha-caixa { transform: translateX(200px); }`.

### Componentes

`deck.css` traz alguns blocos prontos: `.list` (lista com marcadores), `.cols.two` e `.cols.three` (colunas), `.panel` (caixa posicionada por `--x`, `--y`, `--w` e `--h`, ou `.panel.static` no fluxo normal), `.node` (caixa de diagrama, com variantes `.store`, `.dashed`, `.active`), `.wires`, `.wire` e `.wlabel` (camada SVG das setas), `.code` com `.ln` por linha, `.diff` com `.add` e `.del`, `.chip` e `table.tbl`.

Para setas, o `index.html` já define os marcadores `url(#arr)` e `url(#arr-accent)`.

As cenas em `scenes/` mostram cada recurso na prática: revelação por etapas (`02-steps.js`), diagrama SVG animado (`03-diagram.js`) e bloco de código com destaque por linha (`04-code.js`).

## Atalhos

| Tecla | Ação |
|---|---|
| `→` `Espaço` `PageDown` `L` | próxima etapa (no fim da cena, vai para a próxima cena) |
| `←` `PageUp` `H` | etapa anterior (no início, vai para a última etapa da cena anterior) |
| `Shift+→` / `Shift+←` | próxima / anterior cena |
| `Home` / `End` | primeira / última cena |
| `O` ou `Esc` | visão geral das cenas |
| `F` | tela cheia |
| `B` ou `.` | tela preta |
| `R` | replay da etapa atual |
| `P` | abre a visão do apresentador |
| `M` | liga ou desliga o movimento reduzido |
| `G` + id ou número + `Enter` | vai para a cena (ex.: `S3` ou `3`) |
| `?` | lista de atalhos |

Os atalhos não disparam enquanto o foco está num campo de texto. Mexer o mouse mostra a barra de controles embaixo, que some em 2 s.

## Visão do apresentador

Abra com a tecla `P` na projeção ou pela URL `?presenter=1`. Ela mostra:

- a etapa atual e a próxima, em miniatura;
- as notas da etapa atual (`notes`);
- o cartão de apoio (`guide`): objetivo, pontos, ponte para a próxima cena e perguntas prováveis;
- o mapa de todas as cenas (clique para ir);
- cronômetro (iniciar, pausar, zerar), o tempo planejado da cena e se você está adiantado ou atrasado, calculado pelos `minutes` das cenas;
- relógio.

Projeção e apresentador ficam sincronizados por `BroadcastChannel`: navegar em qualquer uma das duas janelas move a outra. As duas precisam estar na mesma origem, ou seja, servidas pelo `run.sh`. Pela URL `file://` a sincronia não é confiável no Chrome.

Em dois monitores: abra a projeção no projetor em tela cheia (`F`) e a visão do apresentador no seu monitor.

## Exportar o PDF

```bash
./export-pdf.sh
```

Gera `deck.pdf` com o Chrome headless a partir de `index.html?print=1`, com uma página por etapa de cada cena. Se o `pdfinfo` estiver instalado (pacote poppler: `brew install poppler` ou `apt install poppler-utils`), o script confere se o número de páginas é igual à soma das etapas e imprime `OK` ou `DIVERGÊNCIA`.

Variáveis opcionais:

- `CHROME=/caminho/do/chrome` se o Chrome não estiver no lugar padrão;
- `OUT=apresentacao.pdf` para mudar o arquivo de saída;
- `MODE=final` para gerar só o estado final de cada cena (uma página por cena), bom para compartilhar depois da palestra.

Para conferir antes de exportar, abra `?print=1` ou `?print=final` no navegador: a tela mostra exatamente as páginas que vão para o PDF.

## Trocar o tema

Todas as cores e fontes estão em variáveis no começo do `deck.css`:

```css
:root {
  --bg: #FFFFFF; --bg-2: #F2F4F7;
  --ink: #1A1D21; --ink-2: #5A6170;
  --line: #D5D9E0;
  --accent: #2457C5; --accent-2: #E3EBFA;
  --ok: #1F7A4D; --warn: #A8690C; --fail: #B3261E;
  --cover-bg: #12151A;
  --font-sans: "Deck Sans", system-ui, sans-serif;
  --font-mono: "Deck Mono", ui-monospace, monospace;
}
```

Troque os valores e o deck inteiro muda, inclusive as cores de destaque geradas pelo motor. Para usar outra fonte, coloque o arquivo `.woff2` em `assets/fonts/` com a licença dela, declare um `@font-face` e aponte `--font-sans` ou `--font-mono` para ela. Use só fontes cuja licença permite redistribuir.

As fontes incluídas são subconjuntos latinos da IBM Plex. Setas e símbolos como `→` e `✓` caem na fonte do sistema; nos diagramas, prefira as setas SVG.

## Plano B

1. **Porta ocupada:** `PORT=9000 ./run.sh`.
2. **Sem Python ou o servidor não sobe:** abra `index.html` direto no Chrome (arraste o arquivo para a janela). A projeção funciona completa; a sincronia com o apresentador não é garantida.
3. **Último recurso:** o `deck.pdf`. Ele tem uma página por etapa, então avançar a página equivale a avançar a etapa.

O deck não faz nenhuma requisição para fora da máquina: não tem CDN, fonte remota nem `fetch`. Funciona sem internet.

## Movimento reduzido

Se o sistema estiver com "reduzir movimento" ligado, o deck respeita sozinho (`prefers-reduced-motion`). A tecla `M` liga à mão. Com o movimento reduzido, as transições viram fades curtos e nada se desloca; o estado final de cada etapa é o mesmo.

## Teste

```bash
node tests/deck.test.mjs
```

O teste sobe o `run.sh` numa porta livre, dirige o Chrome headless com `playwright-core` e confere: navegação etapa a etapa nos dois sentidos, salto de cena, setas rápidas sem estado duplicado, replay, visão geral, tela preta, movimento reduzido, tecla `G`, sincronia entre projeção e apresentador nos dois sentidos, notas e cronômetro do apresentador, número de páginas da impressão, nenhuma requisição externa e nenhum erro de JavaScript.

Se o `playwright-core` não estiver instalado, rode `npx -y playwright-core@latest --version` uma vez (ou aponte `PLAYWRIGHT_CORE` para o pacote). O navegador usado é o Chrome do sistema, ou o da variável `CHROME`.

## Licença

Código sob a licença MIT (veja `LICENSE`). As fontes IBM Plex em `assets/fonts/` seguem a SIL Open Font License 1.1 (veja `assets/fonts/LICENSE-ibm-plex.txt`).
