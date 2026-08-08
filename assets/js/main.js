/* ═══════════════════════════════════════════════════════════════
   Amanda Pedrosa — página de captura
   Configure o bloco abaixo e a página está pronta para rodar.
   ═══════════════════════════════════════════════════════════════ */

const CONFIG = {
  // Seu WhatsApp com DDI e DDD, só números. Ex.: 5511999998888
  whatsapp: '5500000000000',

  // OPCIONAL — URL que recebe o lead (Make, Zapier, n8n, Sheets, CRM…).
  // Se ficar vazio, o lead é enviado direto pelo WhatsApp.
  webhookUrl: '',

  // OPCIONAL — para onde levar depois do envio (ex.: 'obrigado.html').
  // Vazio = mostra a confirmação na própria página.
  redirectOnSuccess: '',

  // Abre o WhatsApp sozinho depois do envio.
  autoOpenWhatsapp: true,
};

/* ═══════════════════════════════════════════════════════════════
   Daqui para baixo não precisa mexer.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ── barra fica com borda ao rolar ─────────────────────────── */

  const bar = $('.bar');
  const onScroll = () => bar.classList.toggle('is-stuck', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

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

  /* origem da visita — importa mais do que parece na hora de otimizar */
  const params = new URLSearchParams(location.search);
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((k) => {
    const input = form.elements[k];
    if (input) input.value = params.get(k) || '';
  });
  if (form.elements.referrer) form.elements.referrer.value = document.referrer || 'direto';
  if (form.elements.pagina) form.elements.pagina.value = location.href;

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

  const track = () => {
    if (typeof window.fbq === 'function') window.fbq('track', 'Lead');
    if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead');
  };

  const showDone = (d, link) => {
    const done = $('#done');
    form.hidden = true;
    done.hidden = false;
    $('#done-nome').textContent = d.nome.split(' ')[0];

    const wpp = $('#done-wpp');
    if (CONFIG.whatsapp.replace(/\D/g, '').replace(/0/g, '') === '55') {
      wpp.remove();               // número ainda não configurado
    } else {
      wpp.href = link;
    }
    done.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    statusEl.textContent = '';
    if (!validate()) return;

    const data = collect();
    const link = whatsappLink(data);

    btn.disabled = true;
    btn.textContent = 'Enviando…';

    try {
      if (CONFIG.webhookUrl) {
        const res = await fetch(CONFIG.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }

      track();

      if (CONFIG.autoOpenWhatsapp) window.open(link, '_blank', 'noopener');

      if (CONFIG.redirectOnSuccess) {
        location.href = CONFIG.redirectOnSuccess;
        return;
      }
      showDone(data, link);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Quero meu diagnóstico';
      statusEl.textContent = 'Não consegui enviar agora. Tenta de novo em alguns segundos.';
      console.error('[form]', err);
    }
  });
})();
