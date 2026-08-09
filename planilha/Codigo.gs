/**
 * ═══════════════════════════════════════════════════════════════
 * Recebe os leads da página e escreve na planilha "forms site".
 *
 * Este arquivo vive DENTRO da planilha (Extensões → Apps Script).
 * O passo a passo de instalação está no README, seção 4.
 *
 * Opcionalmente também manda a conversão para a Meta pela Conversions
 * API. O token fica nas Propriedades do Script — nunca na página.
 * ═══════════════════════════════════════════════════════════════
 */

/** Nome da aba onde os leads são gravados. Ela é criada sozinha. */
const ABA = 'leads';

/** Fuso usado na coluna de data. */
const FUSO = 'America/Sao_Paulo';

/** Versão da API da Meta. Use a que o Gerenciador de Eventos mostrar. */
const API_META = 'v21.0';

/**
 * As colunas da planilha, na ordem. O primeiro item é o cabeçalho,
 * o segundo diz de onde tirar o valor. Para acrescentar uma coluna,
 * basta adicionar uma linha aqui — o cabeçalho se atualiza sozinho.
 */
const COLUNAS = [
  ['Data',            (d) => Utilities.formatDate(new Date(), FUSO, 'dd/MM/yyyy HH:mm')],
  ['Nome',            (d) => d.nome],
  ['WhatsApp',        (d) => d.whatsapp],
  ['Negócio',         (d) => d.negocio],
  ['Cidade',          (d) => d.cidade],
  ['Segmento',        (d) => d.segmento],
  ['Faturamento',     (d) => d.faturamento],
  ['Investe hoje',    (d) => d.investimento],
  ['Maior gargalo',   (d) => d.gargalo],
  ['Origem',          (d) => d.utm_source],
  ['Mídia',           (d) => d.utm_medium],
  ['Campanha',        (d) => d.utm_campaign],
  ['Criativo',        (d) => d.utm_content],
  ['Palavra-chave',   (d) => d.utm_term],
  ['Veio de',         (d) => d.referrer],
  ['Página',          (d) => d.pagina],
  ['Clique do anúncio', (d) => d.fbclid],
  ['Aceite',          (d) => (d.consent ? 'sim' : 'não')],
  ['Enviado à Meta',  (d) => d.__meta || ''],
  ['ID do evento',    (d) => d.event_id],
  ['ID do visitante', (d) => d.external_id],
];

/* ═══════════════════════════════════════════════════════════════
   Entrada
   ═══════════════════════════════════════════════════════════════ */

function doPost(e) {
  /* Duas pessoas enviando ao mesmo tempo não podem escrever na mesma
     linha. O bloqueio faz a segunda esperar a primeira terminar. */
  const trava = LockService.getScriptLock();
  trava.waitLock(30000);

  try {
    const dados = JSON.parse(e.postData.contents);
    dados.__meta = enviarParaMeta(dados);
    gravar(dados);
    return json({ ok: true });
  } catch (erro) {
    registrarFalha(erro, e);
    return json({ ok: false, erro: String(erro) });
  } finally {
    trava.releaseLock();
  }
}

/** Abrir a URL da implantação no navegador cai aqui — serve para testar. */
function doGet() {
  return json({ ok: true, mensagem: 'Recebedor de leads no ar. Envie por POST.' });
}

/* ═══════════════════════════════════════════════════════════════
   Planilha
   ═══════════════════════════════════════════════════════════════ */

function gravar(dados) {
  const aba = abaDeLeads();
  aba.appendRow(COLUNAS.map(function (c) {
    const v = c[1](dados);
    return v === undefined || v === null ? '' : v;
  }));
}

function abaDeLeads() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let aba = planilha.getSheetByName(ABA);

  if (!aba) {
    aba = planilha.insertSheet(ABA);
  }

  const cabecalho = COLUNAS.map(function (c) { return c[0]; });

  if (aba.getLastRow() === 0) {
    aba.appendRow(cabecalho);
    aba.getRange(1, 1, 1, cabecalho.length)
       .setFontWeight('bold')
       .setBackground('#f1f3f4');
    aba.setFrozenRows(1);

    /* WhatsApp como texto: sem isso a planilha come o zero à esquerda
       e transforma o número em conta de matemática. */
    const colWhats = cabecalho.indexOf('WhatsApp') + 1;
    if (colWhats > 0) aba.getRange(2, colWhats, aba.getMaxRows() - 1, 1).setNumberFormat('@');

    aba.autoResizeColumns(1, cabecalho.length);
  } else if (aba.getLastColumn() < cabecalho.length) {
    /* Colunas novas foram adicionadas em COLUNAS depois da primeira execução */
    aba.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho]).setFontWeight('bold');
  }

  return aba;
}

/* ═══════════════════════════════════════════════════════════════
   Conversions API — opcional
   ═══════════════════════════════════════════════════════════════ */

/**
 * Repassa a conversão para a Meta, se as propriedades estiverem
 * preenchidas. Devolve um texto curto para a coluna "Enviado à Meta".
 */
function enviarParaMeta(dados) {
  const props = PropertiesService.getScriptProperties();
  const pixel = props.getProperty('META_PIXEL_ID');
  const token = props.getProperty('META_TOKEN');

  if (!pixel || !token) return 'não configurado';
  if (!dados.meta) return 'sem evento';

  const evento = dados.meta;
  const corpo = { data: [evento] };

  /* O código de teste vai na raiz da requisição, não dentro do evento. */
  if (evento.test_event_code) {
    corpo.test_event_code = evento.test_event_code;
    delete evento.test_event_code;
  }

  const url = 'https://graph.facebook.com/' + API_META + '/' + pixel +
              '/events?access_token=' + encodeURIComponent(token);

  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(corpo),
    muteHttpExceptions: true,
  });

  const codigo = res.getResponseCode();
  if (codigo >= 200 && codigo < 300) {
    const r = JSON.parse(res.getContentText());
    return 'sim (' + (r.events_received || 0) + ')';
  }

  registrarFalha(new Error('Meta HTTP ' + codigo + ': ' + res.getContentText()), null);
  return 'erro ' + codigo;
}

/* ═══════════════════════════════════════════════════════════════
   Apoio
   ═══════════════════════════════════════════════════════════════ */

function json(objeto) {
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Nenhum lead pode se perder em silêncio. O que falhar vai para uma aba
 * "erros", com o conteúdo bruto, para você recuperar na mão.
 */
function registrarFalha(erro, e) {
  try {
    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    let aba = planilha.getSheetByName('erros');
    if (!aba) {
      aba = planilha.insertSheet('erros');
      aba.appendRow(['Data', 'Erro', 'Conteúdo recebido']);
      aba.getRange(1, 1, 1, 3).setFontWeight('bold');
      aba.setFrozenRows(1);
    }
    aba.appendRow([
      Utilities.formatDate(new Date(), FUSO, 'dd/MM/yyyy HH:mm:ss'),
      String(erro),
      e && e.postData ? e.postData.contents : '',
    ]);
  } catch (ignorado) { /* não dá para fazer mais nada */ }
}

/**
 * Rode uma vez pelo editor (▶ testarComLeadFalso) para conferir que a aba
 * é criada e a linha aparece. Apague a linha de teste depois.
 */
function testarComLeadFalso() {
  doPost({
    postData: {
      contents: JSON.stringify({
        nome: 'Lead de teste',
        whatsapp: '(62) 90000-0000',
        negocio: 'Teste',
        cidade: 'Goiânia, Setor Bueno',
        segmento: 'Estética e beleza',
        faturamento: 'R$ 30 mil a R$ 100 mil',
        investimento: 'Ainda não invisto',
        gargalo: 'Linha de teste — pode apagar.',
        consent: true,
        utm_source: 'teste',
        utm_campaign: 'instalacao',
        event_id: 'teste-' + Date.now(),
      }),
    },
  });
}
