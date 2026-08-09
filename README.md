# Página de captura — Amanda Pedrosa

Página de agendamento de diagnóstico para donos de negócio local.
HTML, CSS e JavaScript puros: sem build, sem dependência, sem servidor.
É só subir os arquivos.

## Duas versões

**`index.html` — formato carta.** É a que segue a referência da página do Tedson
Santos: fundo claro, coluna estreita, tipo pequeno, sem imagem, um CTA no fim.
Parece uma conversa, não um anúncio. **Use essa.**

**`versao-escura.html` — formato landing premium.** Fundo escuro, manchete grande e
um gráfico de raio de alcance animado no topo. Foi a primeira versão, feita antes de
eu conseguir ver a referência. Ficou no repositório porque funciona bem como página
institucional ou como teste A/B contra a carta.

As duas dividem o mesmo formulário, o mesmo rastreamento e a mesma configuração.
Configurar uma configura as duas.

```
index.html                     a carta (principal)
versao-escura.html             a versão escura
politica-de-privacidade.html   exigência da LGPD, linkada no rodapé

assets/js/config.js            ← O ÚNICO ARQUIVO QUE VOCÊ EDITA
assets/js/tracking.js          pixel, cookies e evento pronto pra Conversions API
assets/js/main.js              formulário, máscara, validação e envio

assets/css/carta.css           estilo da carta
assets/css/style.css           estilo da versão escura
assets/img/                    coloque aqui a sua foto (amanda.jpg) e a og.jpg
```

---

## 1. Configurar (5 minutos)

**Só existe um arquivo para editar: `assets/js/config.js`.**

```js
const CONFIG = {
  whatsapp: '5500000000000',   // ← seu número: DDI + DDD, só dígitos
  pixelId: '',                 // ← ID do pixel da Meta
  ga4Id: '',                   // ← G-XXXXXXXXXX, opcional
  webhookUrl: '',              // ← para onde o lead vai
  valorLead: 0,                // ← quanto vale um lead, em reais
  testEventCode: '',           // ← só enquanto testa
  redirectOnSuccess: '',
  autoOpenWhatsapp: true,
};
```

**`whatsapp`** — obrigatório. Enquanto estiver com o número de exemplo, **todos os
botões verdes de WhatsApp somem sozinhos** da página, para nenhum link quebrado ir
ao ar. Configure antes de publicar.

**`pixelId`** — cole só os números do ID do pixel. O `tracking.js` instala o pixel
sozinho: **não cole script de rastreamento no HTML.** Vazio = nenhum script da Meta
ou do Google é carregado e nada sai da página. A origem do clique continua sendo
guardada num cookie do seu próprio domínio, para não se perder se você ligar o pixel
depois.

**`webhookUrl`** — para onde o lead vai além do WhatsApp: um cenário do Make, um Zap,
um fluxo do n8n, o seu CRM. É também por aqui que a Conversions API é alimentada
(seção 3). Se ficar vazio, nada se perde — o lead continua chegando pelo WhatsApp
com todas as respostas escritas na mensagem.

**`valorLead`** — quanto vale um lead pra você. Com esse número, a Meta otimiza por
valor e não só por volume. A conta é a mesma do diagnóstico:

```
valor do lead = ticket médio × margem % × taxa de fechamento
```

Ticket R$ 2.000, margem 40%, fechamento 20% → um lead vale R$ 160.
**Deixe 0 enquanto não souber.** Número chutado ensina a coisa errada ao algoritmo.

---

## 2. O que é rastreado, e o que você ganha com isso

Toda visita que chega de anúncio traz três coisas na URL ou nos cookies: os **UTMs**
(campanha, criativo), o **`fbclid`** (identificador daquele clique) e os cookies do
pixel (**`_fbp`** e **`_fbc`**). O `tracking.js` captura os três e joga em campos
escondidos do formulário — então **cada lead que cai na sua planilha já vem com o
anúncio que o trouxe**, sem você cruzar nada na mão.

| Campo | O que é |
|---|---|
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` | de qual campanha e criativo veio |
| `fbclid` | identificador do clique no anúncio |
| `fbc`, `fbp` | cookies do pixel, exigidos pela Meta para parear |
| `external_id` | id anônimo que reconhece a mesma pessoa voltando |
| `event_id` | o mesmo evento no navegador e no servidor (veja a seção 3) |
| `referrer`, `pagina` | de onde veio e em qual página estava |

Deixe claro o que a Meta faz e o que **não** faz:

- **Ela não te diz quem são as pessoas.** Nunca. Nenhum nome, nenhum perfil volta.
- Ela recebe telefone, nome e cidade **embaralhados com SHA-256** e só compara com o
  que já tem, para responder "esse contato veio deste anúncio".
- Com essa resposta ela otimiza a entrega, atribui a conversão ao criativo certo e
  permite montar público semelhante.

Quem sabe quem é cada lead é **você**, na sua planilha. A Meta só sabe qual anúncio
funcionou.

---

## 3. Conversions API — o envio pelo servidor

O pixel sozinho perde de 20% a 40% dos eventos: bloqueador de anúncio, iOS, aba
fechada antes de carregar. A Conversions API resolve isso mandando o mesmo evento
por fora do navegador. As duas pontas usam **o mesmo `event_id`**, e é ele que faz a
Meta entender que é uma conversão só, não duas.

O token da API **nunca pode ficar no JavaScript da página** — qualquer pessoa leria.
Por isso o caminho é: página → seu webhook → Meta.

**O que a página manda para o webhook:**

```json
{
  "nome": "Joana Ribeiro", "whatsapp": "(62) 98765-4321",
  "negocio": "…", "cidade": "…", "segmento": "…",
  "faturamento": "…", "investimento": "…", "gargalo": "…",
  "consent": true, "enviado_em": "2026-08-08T14:02:11.000Z",
  "utm_source": "ig", "utm_campaign": "diag_ago", "utm_content": "criativo_3",
  "fbclid": "…", "fbc": "…", "fbp": "…", "event_id": "…",

  "meta": {
    "event_name": "Lead",
    "event_time": 1786243444,
    "event_id": "2b8d20c6-…",
    "event_source_url": "https://…",
    "action_source": "website",
    "user_data": {
      "ph": "5a8438e2…", "fn": "3c6efb26…", "ln": "5a506859…",
      "ct": "472c438f…", "country": "885036a0…", "external_id": "0af17234…",
      "fbc": "fb.1.…", "fbp": "fb.1.…", "client_user_agent": "…"
    },
    "custom_data": { "content_name": "Diagnóstico de tráfego", "content_category": "…" }
  }
}
```

O bloco `meta` já sai **pronto**, no formato que a Meta espera. Os dados de fora do
bloco `meta` são os seus, para a planilha e o CRM — esses vão abertos, e não vão
para a Meta.

**No Make / Zapier / n8n**, o módulo HTTP faz um `POST` para:

```
https://graph.facebook.com/v21.0/<PIXEL_ID>/events?access_token=<SEU_TOKEN>
```

Use a versão mais recente que o Gerenciador de Eventos mostrar no lugar de `v21.0`.
Corpo da requisição:

```json
{ "data": [ <o bloco meta, inteiro> ] }
```

**Dois ajustes que a sua automação precisa fazer** (a página não consegue):

1. **Acrescente `client_ip_address`** dentro de `user_data`, com o IP de quem enviou.
   O navegador não sabe o próprio IP; a automação sabe. Isso melhora bastante o
   pareamento.
2. **Se os hashes vierem vazios**, a página está sendo servida em `http://` — o
   navegador só libera criptografia em `https://`. Publique com HTTPS (Netlify,
   Vercel e GitHub Pages já dão de graça) ou faça o SHA-256 na automação, sempre
   sobre o valor normalizado: minúsculas, sem acento, telefone só com dígitos e
   com o 55 na frente.

**Para testar:** no Gerenciador de Eventos, aba *Testar eventos*, copie o código e
cole em `testEventCode` no `config.js`. Ele viaja junto no bloco `meta`; sua
automação só precisa repassá-lo como `test_event_code` no corpo da requisição.
**Apague quando terminar de validar** — com ele ligado, os eventos não contam.

Depois de rodar, confira na aba *Visão geral* do Gerenciador: os eventos devem
aparecer com origem **"Navegador e servidor"** e uma taxa de desduplicação alta.
Se aparecerem separados, o `event_id` não está sendo repassado.

---

## 4. LGPD

O rastreamento está declarado na `politica-de-privacidade.html`: quais cookies são
gravados, por quanto tempo, que os dados vão embaralhados para a Meta e que ela não
devolve nada. O rodapé avisa sobre os cookies e o formulário tem o aceite explícito.

Uma decisão que ficou tomada e você pode querer rever: **o pixel dispara ao carregar
a página, antes de qualquer aceite de cookies.** É o padrão do mercado no Brasil e é
o que permite atribuir a visita ao anúncio. Uma leitura mais rígida da LGPD pediria
um banner de consentimento antes. Se você quiser esse banner, é só me pedir.

---

## 5. O que ainda falta preencher

Tudo que está entre colchetes `[ … ]` ou marcado com `TODO` é conteúdo que só você
tem. Ordem de prioridade:

| Onde | O quê |
|---|---|
| `main.js` | seu número de WhatsApp |
| `index.html` — rodapé | o seu @ do Instagram |
| `index.html` — `<head>` | `SEU-DOMINIO.com.br` nas tags de canonical e compartilhamento, e uma imagem `og.jpg` de 1200×630 |
| `politica-de-privacidade.html` | razão social, CNPJ, e-mail de contato e as ferramentas que você usa |
| `versao-escura.html` — "Quem fala com você" | sua foto (`assets/img/amanda.jpg`, 800×1000) e os três parágrafos de bio |
| `versao-escura.html` — "Prova social" | **está comentada no HTML.** Descomente e preencha com depoimentos reais de clientes que autorizaram. Não publique com texto de exemplo |
| `versao-escura.html` — FAQ e rodapé | valor mínimo de verba, segmentos que você atende, CNPJ e Instagram |

A carta não tem foto nem depoimento de propósito — na referência não tem, e é isso
que faz ela parecer uma conversa em vez de um anúncio. Se quiser prova social ali,
o lugar natural é logo depois de "Você sai com", e tem que ser depoimento real.

Três frases da carta fazem promessas que só você pode sustentar. Confira se são
verdade antes de subir, ou troque:

- "Em 30 minutos você sai da conversa com esse número na mão."
- "Te chamo no WhatsApp em até 1 dia útil."
- "Atendo poucas contas por vez."

---

## 6. Publicar

Qualquer hospedagem de site estático serve. As mais rápidas:

- **Netlify / Vercel** — arraste a pasta na tela do painel. Domínio próprio em 2 minutos.
- **GitHub Pages** — Settings → Pages → branch `main`, pasta `/`.
- **Hospedagem tradicional** — suba os arquivos por FTP na raiz do domínio.

Para testar no seu computador antes, abra o `index.html` no navegador — funciona
direto, sem servidor.

---

## Notas de construção

- **Fontes:** a carta usa Inter (texto) e IBM Plex Mono (só os rótulos em caixa alta).
  A versão escura usa Fraunces, Archivo e IBM Plex Mono. Tudo do Google Fonts.
- **O gráfico do raio** da versão escura é SVG puro com animação em CSS — sem imagem,
  sem biblioteca.
- **Acessibilidade:** navegação por teclado com foco visível, `<label>` em todos os
  campos, erros anunciados por leitor de tela, e `prefers-reduced-motion` respeitado.
- **Campos com 16px** de fonte: é o mínimo que impede o iPhone de dar zoom sozinho
  quando a pessoa toca no formulário.
- **Sem rastreador de terceiros** além do pixel que você mesmo colar.
