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
      const presente = document.querySelector('#lead-form [name="marca"]');
      const oi = presente
        ? 'Oi, Amanda. Vim pela página e quero o presente da live.'
        : 'Oi, Amanda. Vim pela página do diagnóstico e queria conversar.';
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

  /* A carta pede o presente da live. A versão escura continua no diagnóstico. */
  const isGift = () => Boolean(form.elements.marca);
  const INVESTIU = ['Sim, invisto hoje', 'Já investi, mas parei'];

  const control = (name) => {
    const el = form.elements[name];
    if (!el) return null;
    if (!el.tagName && typeof el.length === 'number') return el[0] || null;
    return el;
  };

  const valor = (name) => {
    const el = form.elements[name];
    if (!el || el.value === undefined) return '';
    return el.value;
  };

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

  const GIFT_RULES = {
    nome:        (v) => v.trim().length >= 2 || 'Escreve seu nome.',
    marca:       (v) => v.trim().length >= 2 || 'Qual é o nome da sua marca?',
    whatsapp:    (v) => v.replace(/\D/g, '').length >= 10 || 'Falta um número com DDD.',
    segmento:    (v) => v !== '' || 'Escolhe um segmento.',
    fase:        (v) => v !== '' || 'Escolhe a fase da sua marca.',
    produto:     (v) => v.trim().length >= 2 || 'Conta em poucas palavras o que você vende.',
    ticket:      (v) => v !== '' || 'Escolhe uma faixa de ticket.',
    anuncios:    (v) => v !== '' || 'Escolhe uma opção.',
    redes:       (v) => v !== '' || 'Escolhe quem cuida das redes.',
    atendimento: (v) => v.trim().length >= 2 || 'Conta por onde é o atendimento.',
    gargalo:     (v) => v !== '' || 'Escolhe o maior gargalo.',
    proximo:     (v) => v !== '' || 'Escolhe uma opção.',
  };

  const setError = (name, msg) => {
    const node = control(name);
    if (!node) return;
    const field = node.closest('.field');
    const slot = $(`[data-err-for="${name}"]`, form);
    if (field) field.classList.toggle('is-bad', Boolean(msg));
    if (slot) slot.textContent = msg || '';
  };

  const marcar = (name, msg, firstBad) => {
    setError(name, msg);
    if (msg && !firstBad.el) firstBad.el = control(name);
  };

  const validateDiag = () => {
    const firstBad = { el: null };
    Object.entries(RULES).forEach(([name, rule]) => {
      const res = rule(valor(name));
      marcar(name, res === true ? '' : res, firstBad);
    });
    marcar('consent', form.elements.consent.checked ? '' : 'Preciso da sua autorização para te chamar.', firstBad);
    return focar(firstBad.el);
  };

  const validateGift = () => {
    const firstBad = { el: null };
    Object.entries(GIFT_RULES).forEach(([name, rule]) => {
      const res = rule(valor(name));
      marcar(name, res === true ? '' : res, firstBad);
    });

    if (valor('segmento') === 'outro') {
      const ok = valor('segmento_outro').trim().length >= 2;
      marcar('segmento_outro', ok ? '' : 'Conta qual é o segmento.', firstBad);
    } else {
      marcar('segmento_outro', '');
    }

    const canais = $$('input[name="canais"]:checked', form).map((el) => el.value);
    marcar('canais', canais.length ? '' : 'Marca pelo menos um caminho.', firstBad);
    if (canais.includes('outro')) {
      const ok = valor('canais_outro').trim().length >= 2;
      marcar('canais_outro', ok ? '' : 'Conta por onde mais os clientes chegam.', firstBad);
    } else {
      marcar('canais_outro', '');
    }

    if (INVESTIU.includes(valor('anuncios'))) {
      const ok = valor('resultado').trim().length >= 2;
      marcar('resultado', ok ? '' : 'Conta quanto por mês e qual foi o resultado.', firstBad);
    } else {
      marcar('resultado', '');
    }

    if (valor('gargalo') === 'outro') {
      const ok = valor('gargalo_outro').trim().length >= 2;
      marcar('gargalo_outro', ok ? '' : 'Conta qual é o gargalo.', firstBad);
    } else {
      marcar('gargalo_outro', '');
    }

    marcar('consent', form.elements.consent.checked ? '' : 'Preciso da sua autorização para te chamar.', firstBad);
    return focar(firstBad.el);
  };

  const focar = (el) => {
    if (!el) return true;
    const field = el.closest('.field') || el;
    el.focus({ preventScroll: true });
    field.scrollIntoView({ block: 'center', behavior: 'smooth' });
    return false;
  };

  const validate = () => (isGift() ? validateGift() : validateDiag());

  const syncConditional = () => {
    if (!isGift()) return;
    $('#campo-segmento-outro').hidden = valor('segmento') !== 'outro';
    const canalOutro = $$('input[name="canais"]', form).some((el) => el.value === 'outro' && el.checked);
    $('#campo-canais-outro').hidden = !canalOutro;
    $('#campo-resultado').hidden = !INVESTIU.includes(valor('anuncios'));
    $('#campo-gargalo-outro').hidden = valor('gargalo') !== 'outro';
  };
  syncConditional();

  $$('select', form).forEach((sel) => {
    const paint = () => sel.classList.toggle('is-filled', sel.value !== '');
    paint();
    sel.addEventListener('change', paint);
  });

  /* limpa o erro assim que a pessoa corrige */
  $$('input, select, textarea', form).forEach((el) => {
    const limpar = () => { if (el.name) setError(el.name, ''); };
    el.addEventListener('input', limpar);
    el.addEventListener('change', () => { limpar(); syncConditional(); });
  });

  const collect = () => {
    const data = {};
    new FormData(form).forEach((v, k) => {
      const val = typeof v === 'string' ? v.trim() : v;
      if (data[k] === undefined) data[k] = val;
      else if (Array.isArray(data[k])) data[k].push(val);
      else data[k] = [data[k], val];
    });
    Object.keys(data).forEach((k) => {
      if (Array.isArray(data[k])) data[k] = data[k].filter(Boolean).join(' · ');
    });

    if (isGift()) {
      if (data.segmento === 'outro') {
        data.segmento = data.segmento_outro ? `Outro: ${data.segmento_outro}` : 'Outro';
      }
      delete data.segmento_outro;

      if (typeof data.canais === 'string' && data.canais.split(' · ').includes('outro')) {
        const partes = data.canais.split(' · ').filter((x) => x !== 'outro');
        partes.push(data.canais_outro ? `Outro: ${data.canais_outro}` : 'Outro');
        data.canais = partes.join(' · ');
      }
      delete data.canais_outro;

      if (data.gargalo === 'outro') {
        data.gargalo = data.gargalo_outro ? `Outro: ${data.gargalo_outro}` : 'Outro';
      }
      delete data.gargalo_outro;

      if (!INVESTIU.includes(data.anuncios)) delete data.resultado;
    }

    data.consent = form.elements.consent.checked;
    data.enviado_em = new Date().toISOString();
    return data;
  };

  const whatsappLink = (d) => {
    const linhas = isGift()
      ? [
          'Oi, Amanda. Quero meu presente da live.',
          '',
          `Nome: ${d.nome}`,
          `Marca: ${d.marca}`,
          `WhatsApp: ${d.whatsapp}`,
          `Segmento: ${d.segmento}`,
          `Fase: ${d.fase}`,
          `O que vende: ${d.produto}`,
          `Ticket médio: ${d.ticket}`,
          `Clientes chegam por: ${d.canais}`,
          `Anúncios: ${d.anuncios}`,
        ]
      : [
          'Oi, Amanda. Preenchi o formulário do diagnóstico.',
          '',
          `Nome: ${d.nome}`,
          `Negócio: ${d.negocio} (${d.segmento})`,
          `Onde: ${d.cidade}`,
          `Faturamento: ${d.faturamento}`,
          `Investe hoje: ${d.investimento}`,
        ];
    if (isGift()) {
      if (d.resultado) linhas.push(`Resultado dos anúncios: ${d.resultado}`);
      linhas.push(
        `Redes sociais: ${d.redes}`,
        `Atendimento: ${d.atendimento}`,
        `Maior gargalo: ${d.gargalo}`,
        `Próximo passo: ${d.proximo}`,
      );
    } else if (d.gargalo) {
      linhas.push(`Maior gargalo: ${d.gargalo}`);
    }
    return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(linhas.join('\n'))}`;
  };

  const showDone = (d, link) => {
    const done = $('#done');
    form.hidden = true;
    done.hidden = false;
    $('#done-nome').textContent = d.nome.split(' ')[0];

    const wpp = $('#done-wpp');
    if (wpp && !numberReady()) {
      wpp.remove();               // número ainda não configurado
    } else if (wpp) {
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
