/* ═══════════════════════════════════════════════════════════════
   Amanda Pedrosa — página de captura
   O que você configura está em assets/js/config.js. Aqui não precisa mexer.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* o número ainda é o de exemplo? */
  const numberReady = () =>
    CONFIG.whatsapp.replace(/\D/g, '').replace(/0/g, '') !== '55';

  if (!numberReady()) {
    console.warn('[config] Troque CONFIG.whatsapp em assets/js/config.js pelo número real.');
  }

  /* ── barra fica com borda ao rolar (só na versão escura) ───── */

  const bar = $('.bar');
  if (bar) {
    const onScroll = () => bar.classList.toggle('is-stuck', window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ── botão de WhatsApp direto ──────────────────────────────── */

  const direct = $('#wpp-direct');
  if (direct) {
    if (numberReady()) {
      const oi = 'Oi, Amanda. Vim pela página do diagnóstico e queria conversar.';
      direct.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(oi)}`;
    } else {
      /* sem número configurado, o botão sairia quebrado no ar */
      direct.hidden = true;
      const intro = $('#alt-wpp');
      if (intro) intro.hidden = true;
    }
  }

  /* ── revelação no scroll ───────────────────────────────────── */

  const targets = $$('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    targets.forEach((t) => io.observe(t));
  } else {
    targets.forEach((t) => t.classList.add('is-in'));
  }

  /* ── formulário ────────────────────────────────────────────── */

  const form = $('#lead-form');
  if (!form) return;

  const statusEl = $('#form-status');
  const btn = $('#submit-btn');

  /* Origem da visita: UTMs, fbclid e os cookies do pixel. Cada campo escondido
     que existir no formulário é preenchido com o valor de mesmo nome — é assim
     que a origem chega junto do lead na sua planilha. */
  const preencherOrigem = () => {
    const ctx = window.Rastreio ? window.Rastreio.contexto() : {};
    Object.keys(ctx).forEach((k) => {
      const campo = form.elements[k];
      if (campo) campo.value = ctx[k];
    });
  };
  preencherOrigem();

  /* máscara de telefone */
  const tel = $('#whatsapp');
  tel.addEventListener('input', () => {
    const d = tel.value.replace(/\D/g, '').slice(0, 11);
    let out = d;
    if (d.length > 2) out = `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length > 7) {
      const cut = d.length > 10 ? 7 : 6;
      out = `(${d.slice(0, 2)}) ${d.slice(2, cut)}-${d.slice(cut)}`;
    }
    tel.value = out;
  });

  /* validação */
  const RULES = {
    nome:         (v) => v.trim().length >= 3       || 'Escreve seu nome completo.',
    whatsapp:     (v) => v.replace(/\D/g, '').length >= 10 || 'Falta um número com DDD.',
    negocio:      (v) => v.trim().length >= 2       || 'Como se chama o seu negócio?',
    cidade:       (v) => v.trim().length >= 2       || 'Cidade e bairro, por favor.',
    segmento:     (v) => v !== ''                   || 'Escolhe uma opção.',
    faturamento:  (v) => v !== ''                   || 'Escolhe uma faixa.',
    investimento: (v) => v !== ''                   || 'Escolhe uma faixa.',
  };

  const setError = (name, msg) => {
    const field = form.elements[name].closest('.field');
    const slot = $(`[data-err-for="${name}"]`, form);
    field.classList.toggle('is-bad', Boolean(msg));
    if (slot) slot.textContent = msg || '';
  };

  const validate = () => {
    let firstBad = null;
    Object.entries(RULES).forEach(([name, rule]) => {
      const res = rule(form.elements[name].value);
      const msg = res === true ? '' : res;
      setError(name, msg);
      if (msg && !firstBad) firstBad = form.elements[name];
    });

    const consent = form.elements.consent;
    if (!consent.checked) {
      setError('consent', 'Preciso da sua autorização para te chamar.');
      if (!firstBad) firstBad = consent;
    } else {
      setError('consent', '');
    }

    if (firstBad) {
      firstBad.focus({ preventScroll: true });
      firstBad.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    return !firstBad;
  };

  /* limpa o erro assim que a pessoa corrige */
  $$('input, select, textarea', form).forEach((el) => {
    el.addEventListener('change', () => { if (el.name in RULES || el.name === 'consent') setError(el.name, ''); });
  });

  const collect = () => {
    const data = {};
    new FormData(form).forEach((v, k) => { data[k] = typeof v === 'string' ? v.trim() : v; });
    data.consent = form.elements.consent.checked;
    data.enviado_em = new Date().toISOString();
    return data;
  };

  const whatsappLink = (d) => {
    const linhas = [
      'Oi, Amanda. Preenchi o formulário do diagnóstico.',
      '',
      `Nome: ${d.nome}`,
      `Negócio: ${d.negocio} (${d.segmento})`,
      `Onde: ${d.cidade}`,
      `Faturamento: ${d.faturamento}`,
      `Investe hoje: ${d.investimento}`,
    ];
    if (d.gargalo) linhas.push(`Maior gargalo: ${d.gargalo}`);
    return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(linhas.join('\n'))}`;
  };

  const showDone = (d, link) => {
    const done = $('#done');
    form.hidden = true;
    done.hidden = false;
    $('#done-nome').textContent = d.nome.split(' ')[0];

    const wpp = $('#done-wpp');
    if (!numberReady()) {
      wpp.remove();               // número ainda não configurado
    } else {
      wpp.href = link;
    }

    /* o convite pro WhatsApp direto já não faz sentido depois do envio */
    ['#alt-wpp', '#wpp-direct'].forEach((sel) => { const el = $(sel); if (el) el.hidden = true; });

    done.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  /* Guardado fora do handler: se o envio falhar e a pessoa tentar de novo,
     o mesmo evento é reaproveitado. Sem isso, a Meta contaria dois leads. */
  let evento = null;

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    statusEl.textContent = '';
    if (!validate()) return;

    preencherOrigem();          // o pixel pode ter gravado o _fbp depois do load
    const data = collect();
    const link = whatsappLink(data);

    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Enviando…';

    try {
      /* Dispara o Lead no navegador e monta o mesmo evento para o servidor.
         Os dois carregam o mesmo event_id — é o que impede a contagem dupla. */
      if (!evento && window.Rastreio) evento = await window.Rastreio.lead(data);
      if (evento) data.event_id = evento.event_id;

      if (CONFIG.webhookUrl) {
        const corpo = JSON.stringify(evento ? Object.assign({}, data, { meta: evento }) : data);

        if (/script\.google\.com/.test(CONFIG.webhookUrl)) {
          /* Planilha do Google. O Apps Script não responde ao preflight do
             navegador, então mandamos como texto simples (que dispensa
             preflight) e em modo no-cors. O dado chega; a resposta vem
             opaca, então não dá para ler o status — só falha de rede
             aparece aqui. Se um lead sumir, ele está na aba "erros". */
          await fetch(CONFIG.webhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: corpo,
          });
        } else {
          const res = await fetch(CONFIG.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: corpo,
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
        }
      }

      if (CONFIG.autoOpenWhatsapp) window.open(link, '_blank', 'noopener');

      if (CONFIG.redirectOnSuccess) {
        location.href = CONFIG.redirectOnSuccess;
        return;
      }
      showDone(data, link);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = label;
      statusEl.textContent = 'Não consegui enviar agora. Tenta de novo em alguns segundos.';
      console.error('[form]', err);
    }
  });
})();
