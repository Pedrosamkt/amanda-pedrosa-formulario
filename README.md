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

As duas usam o mesmo `main.js` e o mesmo formulário. Configurar uma configura as duas.

```
index.html                     a carta (principal)
versao-escura.html             a versão escura
politica-de-privacidade.html   exigência da LGPD, linkada no rodapé
assets/css/carta.css           estilo da carta
assets/css/style.css           estilo da versão escura
assets/js/main.js              formulário, máscara, UTM e envio (compartilhado)
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

**`whatsapp`** — obrigatório. Enquanto estiver com o número de exemplo, **todos os
botões verdes de WhatsApp somem sozinhos** da página, para nenhum link quebrado ir
ao ar. Configure antes de publicar.

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

## 4. Publicar

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
