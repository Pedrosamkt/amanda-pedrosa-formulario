# Página de captura — Amanda Pedrosa

Landing page de agendamento de diagnóstico para donos de negócio local.
HTML, CSS e JavaScript puros: sem build, sem dependência, sem servidor.
É só subir os arquivos.

```
index.html                     a página
politica-de-privacidade.html   exigência da LGPD, linkada no rodapé
assets/css/style.css           todo o estilo
assets/js/main.js              formulário, máscara, UTM e envio
assets/img/                    coloque aqui a sua foto (amanda.jpg) e a og.jpg
```

---

## 1. Configurar (5 minutos)

Abra `assets/js/main.js`. Tudo o que precisa mudar está nas primeiras linhas:

```js
const CONFIG = {
  whatsapp: '5500000000000',   // ← seu número: DDI + DDD + número, só dígitos
  webhookUrl: '',              // ← opcional
  redirectOnSuccess: '',       // ← opcional
  autoOpenWhatsapp: true,
};
```

**`whatsapp`** — obrigatório. Enquanto estiver com o número de exemplo, o botão
"Falar comigo agora" some sozinho da tela de confirmação.

**`webhookUrl`** — para onde o lead vai além do WhatsApp. Cole a URL de um cenário
do Make, um Zap do Zapier, um webhook do n8n ou do seu CRM. A página envia um
`POST` com JSON:

```json
{
  "nome": "…", "whatsapp": "…", "negocio": "…", "cidade": "…",
  "segmento": "…", "faturamento": "…", "investimento": "…", "gargalo": "…",
  "consent": true, "enviado_em": "2026-08-08T14:02:11.000Z",
  "utm_source": "ig", "utm_medium": "social", "utm_campaign": "…",
  "utm_content": "…", "utm_term": "…", "referrer": "…", "pagina": "…"
}
```

Se ficar vazio, nada se perde: o lead continua chegando pelo WhatsApp com todas as
respostas já escritas na mensagem.

**Os UTMs são capturados sozinhos** da URL do anúncio. Nenhum lead chega sem origem.

---

## 2. Pixel e conversão

No `<head>` do `index.html` existe um bloco comentado com o Meta Pixel.
Descomente e troque `SEU_PIXEL_ID`. O evento **Lead** já dispara sozinho quando o
formulário é enviado com sucesso — não precisa configurar mais nada.

Se usar Google Analytics/Ads, basta colar a tag: o `generate_lead` também já está
programado.

---

## 3. O que ainda falta preencher

Tudo que está entre colchetes `[ … ]` ou marcado com `TODO` é conteúdo que só você
tem. Ordem de prioridade:

| Onde | O quê |
|---|---|
| `main.js` | seu número de WhatsApp |
| `index.html` — seção "Quem fala com você" | sua foto (`assets/img/amanda.jpg`, 800×1000) e os três parágrafos de bio |
| `index.html` — seção "Prova social" | **está comentada no HTML.** Descomente e preencha com depoimentos reais de clientes que autorizaram. Não publique com texto de exemplo |
| `index.html` — FAQ | o valor mínimo de verba e os segmentos que você realmente atende |
| `index.html` — rodapé | CNPJ e link do Instagram |
| `index.html` — `<head>` | `SEU-DOMINIO.com.br` nas tags de canonical e compartilhamento, e uma imagem `og.jpg` de 1200×630 |
| `politica-de-privacidade.html` | razão social, CNPJ, e-mail de contato e as ferramentas que você usa |

Duas frases da página fazem promessas que só você pode sustentar — confira se são
verdade antes de subir:

- "Atendo um número limitado de contas por vez."
- "Respondo pelo WhatsApp em até 1 dia útil."

---

## 4. Publicar

Qualquer hospedagem de site estático serve. As mais rápidas:

- **Netlify / Vercel** — arraste a pasta na tela do painel. Domínio próprio em 2 minutos.
- **GitHub Pages** — Settings → Pages → branch `main`, pasta `/`.
- **Hospedagem tradicional** — suba os arquivos por FTP na raiz do domínio.

Para testar no seu computador antes, abra o `index.html` no navegador — funciona
direto, sem servidor.

---

## Notas de construção

- **Fontes:** Fraunces (títulos), Archivo (texto), IBM Plex Mono (números e rótulos),
  carregadas do Google Fonts.
- **O gráfico do raio** no topo é SVG puro com animação em CSS — sem imagem, sem
  biblioteca. Ele respeita `prefers-reduced-motion`: quem configurou o sistema para
  reduzir animação vê a mesma cena, parada.
- **Acessibilidade:** navegação por teclado com foco visível, `<label>` em todos os
  campos, erros anunciados por leitor de tela e atalho para pular direto ao formulário.
- **Sem rastreador de terceiros** além do pixel que você mesmo colar.
