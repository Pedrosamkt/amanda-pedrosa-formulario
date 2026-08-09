/* ═══════════════════════════════════════════════════════════════
   Rastreamento — pixel da Meta + dados prontos para a Conversions API.

   O que este arquivo faz:
   1. Instala o pixel a partir do CONFIG.pixelId (sem colar script no HTML).
   2. Guarda de onde a pessoa veio: fbclid, _fbc, _fbp e os UTMs.
   3. No envio do formulário, dispara o evento Lead no navegador E devolve
      o mesmo evento montado no formato da Conversions API, com um
      event_id compartilhado entre os dois — é o event_id que impede a
      Meta de contar a mesma conversão duas vezes.
   4. Embaralha (SHA-256) telefone, nome e cidade antes de sair da página.
      A Meta nunca recebe o dado aberto; ela só compara hash com hash.

   Não edite aqui. O que muda de negócio para negócio está no config.js.
   ═══════════════════════════════════════════════════════════════ */

(function (w, d) {
  'use strict';

  const DIAS = 90;

  /* ── cookies ───────────────────────────────────────────────── */

  /* Cookie pode simplesmente não existir: navegação anônima, iframe restrito,
     Safari com proteção reforçada. Nada disso pode derrubar o formulário —
     sem rastreio o lead ainda tem que chegar. */
  const ler = (nome) => {
    try {
      const m = d.cookie.match('(^|;)\\s*' + nome + '\\s*=\\s*([^;]+)');
      return m ? decodeURIComponent(m.pop()) : '';
    } catch (e) { return ''; }
  };

  const gravar = (nome, valor) => {
    try {
      const ate = new Date(Date.now() + DIAS * 864e5).toUTCString();
      d.cookie = `${nome}=${encodeURIComponent(valor)};expires=${ate};path=/;SameSite=Lax`;
    } catch (e) { /* segue sem cookie */ }
  };

  const uuid = () => {
    if (w.crypto && w.crypto.randomUUID) return w.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  };

  /* ── de onde a pessoa veio ─────────────────────────────────── */

  const params = new URLSearchParams(w.location.search);

  /* O clique no anúncio traz ?fbclid=... Se o pixel demorar a carregar ou
     for bloqueado, esse identificador se perde — então guardamos nós mesmos,
     no formato fb.1.<timestamp>.<fbclid> que a Meta espera no campo fbc. */
  const fbclid = params.get('fbclid') || '';
  if (fbclid && !ler('_fbc')) gravar('_fbc', `fb.1.${Date.now()}.${fbclid}`);

  /* Identificador próprio, estável entre visitas. Melhora o pareamento e
     serve para você reconhecer a mesma pessoa voltando. */
  let externo = '';
  try {
    externo = w.localStorage.getItem('ap_uid') || '';
    if (!externo) { externo = uuid(); w.localStorage.setItem('ap_uid', externo); }
  } catch (e) {
    externo = uuid();   // navegação anônima: sem localStorage
  }

  const origem = {
    utm_source:   params.get('utm_source')   || '',
    utm_medium:   params.get('utm_medium')   || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_content:  params.get('utm_content')  || '',
    utm_term:     params.get('utm_term')     || '',
    fbclid: fbclid,
    fbc: '',            /* preenchido na hora do envio: o pixel pode gravar depois */
    fbp: '',
    external_id: externo,
    referrer: d.referrer || 'direto',
    pagina: w.location.href,
  };

  /* ── pixel da Meta ─────────────────────────────────────────── */

  const cfg = (typeof CONFIG === 'object' && CONFIG) || {};

  if (cfg.pixelId) {
    /* snippet oficial da Meta */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(w, d, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    w.fbq('init', cfg.pixelId);
    w.fbq('track', 'PageView');
  }

  if (cfg.ga4Id) {
    const s = d.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${cfg.ga4Id}`;
    d.head.appendChild(s);
    w.dataLayer = w.dataLayer || [];
    w.gtag = function () { w.dataLayer.push(arguments); };
    w.gtag('js', new Date());
    w.gtag('config', cfg.ga4Id);
  }

  /* ── normalização exigida pela Meta ────────────────────────── */

  const semAcento = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');

  const norm = {
    /* minúsculas, sem acento, sem pontuação */
    nome:   (v) => semAcento(v).toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim(),
    /* minúsculas, sem acento, sem espaço nem pontuação */
    cidade: (v) => semAcento(v).toLowerCase().replace(/[^a-z]/g, ''),
    email:  (v) => String(v || '').trim().toLowerCase(),
    /* só dígitos, com código do país na frente e sem o + */
    fone:   (v) => {
      let n = String(v || '').replace(/\D/g, '');
      if (!n) return '';
      if (!n.startsWith('55')) n = '55' + n;
      return n;
    },
  };

  const sha256 = async (texto) => {
    if (!texto) return '';
    /* Web Crypto só existe em https (ou localhost). Em http o hash sai vazio
       e quem embaralha é a sua automação — veja o README. */
    if (!(w.crypto && w.crypto.subtle)) return '';
    const buf = await w.crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  /* ── montagem do evento ────────────────────────────────────── */

  const contexto = () => {
    origem.fbc = ler('_fbc') || origem.fbc;
    origem.fbp = ler('_fbp') || origem.fbp;
    return Object.assign({}, origem);
  };

  /* Dados da pessoa, embaralhados, no formato user_data da Conversions API. */
  const identidade = async (dados) => {
    const partes = norm.nome(dados.nome).split(' ').filter(Boolean);
    const fone = norm.fone(dados.whatsapp);
    const cidade = norm.cidade(String(dados.cidade || '').split(',')[0]);
    const ctx = contexto();

    const u = {
      ph: await sha256(fone),
      fn: await sha256(partes[0] || ''),
      ln: await sha256(partes.length > 1 ? partes[partes.length - 1] : ''),
      ct: await sha256(cidade),
      country: await sha256('br'),
      em: await sha256(norm.email(dados.email)),
      external_id: await sha256(ctx.external_id),
      fbc: ctx.fbc,
      fbp: ctx.fbp,
      client_user_agent: w.navigator.userAgent,
    };

    Object.keys(u).forEach((k) => { if (!u[k]) delete u[k]; });
    return u;
  };

  /* Dispara o Lead no navegador e devolve o mesmo evento pronto para a
     Conversions API. O event_id vai nos dois lados: é ele que faz a Meta
     entender que é UMA conversão, não duas. */
  const lead = async (dados) => {
    const eventId = uuid();
    const ctx = contexto();

    /* Só vai para a Meta o que ajuda a otimizar e não é dado pessoal.
       Faturamento, investimento e cidade aberta ficam de fora de propósito:
       os Termos das Ferramentas de Negócios proíbem mandar informação
       financeira, e a cidade já vai embaralhada dentro do user_data.
       Esses campos continuam chegando inteiros na sua planilha. */
    const custom = {
      content_name: 'Diagnóstico de tráfego',
      content_category: dados.segmento || '',
    };
    if (cfg.valorLead > 0) {
      custom.value = cfg.valorLead;
      custom.currency = 'BRL';
    }

    if (typeof w.fbq === 'function') {
      w.fbq('track', 'Lead', custom, { eventID: eventId });
    }
    if (typeof w.gtag === 'function') {
      w.gtag('event', 'generate_lead', cfg.valorLead > 0
        ? { value: cfg.valorLead, currency: 'BRL' }
        : {});
    }

    const evento = {
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      event_source_url: ctx.pagina,
      action_source: 'website',
      user_data: await identidade(dados),
      custom_data: custom,
    };
    if (cfg.testEventCode) evento.test_event_code = cfg.testEventCode;

    return evento;
  };

  w.Rastreio = { contexto, identidade, lead, uuid };
})(window, document);
