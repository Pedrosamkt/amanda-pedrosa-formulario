/* ═══════════════════════════════════════════════════════════════
   O ÚNICO ARQUIVO QUE VOCÊ PRECISA EDITAR.
   Tudo o mais funciona a partir daqui.
   ═══════════════════════════════════════════════════════════════ */

const CONFIG = {

  /* Seu WhatsApp: DDI + DDD + número, só dígitos. Ex.: 5562999998888
     Enquanto estiver o número de exemplo, os botões verdes ficam
     escondidos para nenhum link quebrado ir ao ar. */
  whatsapp: '5500000000000',

  /* ID do pixel da Meta (só os números, do Gerenciador de Eventos).
     Preenchendo aqui, o pixel é instalado sozinho — não precisa colar
     script nenhum no HTML. Vazio = nenhum rastreamento é carregado. */
  pixelId: '',

  /* ID de métrica do Google Analytics 4 (G-XXXXXXXXXX). Opcional. */
  ga4Id: '',

  /* Para onde o lead é enviado. O caminho mais simples é a planilha do
     Google: cole aqui a URL do app da web do Apps Script (README, seção 4).
     Também aceita Make, Zapier, n8n ou o seu CRM.
     É por aqui que a Conversions API da Meta é alimentada.
     Vazio = o lead vai só pelo WhatsApp. */
  webhookUrl: '',

  /* Quanto vale um lead pra você, em reais. Serve para a Meta otimizar
     por valor, não só por volume. Use a conta:
        valor do lead = ticket × margem × taxa de fechamento
     Deixe 0 se ainda não souber — é melhor não mandar do que chutar. */
  valorLead: 0,

  /* Código de teste do Gerenciador de Eventos (aba "Testar eventos").
     Use só enquanto valida a instalação, depois apague. */
  testEventCode: '',

  /* Para onde levar depois do envio. Vazio = confirmação na própria página. */
  redirectOnSuccess: '',

  /* Abre o WhatsApp sozinho depois do envio. */
  autoOpenWhatsapp: true,
};
