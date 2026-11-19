/**
 * Utilidad de WhatsApp Cloud API para enviar mensajes (texto, botones, listas, enlaces e imágenes)
 */

interface SendWhatsAppOptions {
  to: string;
  type?: 'text' | 'image' | 'buttons' | 'list' | 'cta_url';
  body: string;
  header?: string;
  footer?: string;
  buttons?: Array<{ id: string; title: string }>;
  listButtonText?: string;
  sections?: Array<{ title: string; rows: Array<{ id: string; title: string; description?: string }> }>;
  ctaText?: string;
  ctaUrl?: string;
  imageUrl?: string;
  contactId?: string;
}

export async function sendWhatsApp(options: SendWhatsAppOptions) {
  // Si estamos en el navegador, llamamos a la ruta /api/send de la app
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: options.to,
          message: options.body,
          type: options.type,
          contactId: options.contactId,
          buttons: options.buttons,
          sections: options.sections,
          ctaText: options.ctaText,
          ctaUrl: options.ctaUrl,
          imageUrl: options.imageUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar mensaje');
      return data;
    } catch (err: any) {
      console.error('[Frontend Send Error]', err);
      throw err;
    }
  }

  // Si estamos en servidor (Node / Vercel Functions), realizamos la petición directa a Meta Graph API
  const token = process.env.WHATSAPP_TOKEN || import.meta.env?.VITE_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || import.meta.env?.VITE_WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';

  if (!token || !phoneNumberId || token.includes('tu-whatsapp')) {
    console.log(`[Simulación WhatsApp API] Enviando a ${options.to}:`, options);
    return {
      success: true,
      simulated: true,
      message_id: 'wamid_sim_' + Date.now(),
    };
  }

  let payload: any = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: options.to,
  };

  if (options.type === 'image' && options.imageUrl) {
    payload.type = 'image';
    payload.image = {
      link: options.imageUrl,
      caption: options.body,
    };
  } else if (options.type === 'buttons' && options.buttons) {
    payload.type = 'interactive';
    payload.interactive = {
      type: 'button',
      ...(options.header ? { header: { type: 'text', text: options.header } } : {}),
      body: { text: options.body },
      ...(options.footer ? { footer: { text: options.footer } } : {}),
      action: {
        buttons: options.buttons.map((b) => ({
          type: 'reply',
          reply: { id: b.id, title: b.title },
        })),
      },
    };
  } else if (options.type === 'list' && options.sections) {
    payload.type = 'interactive';
    payload.interactive = {
      type: 'list',
      ...(options.header ? { header: { type: 'text', text: options.header } } : {}),
      body: { text: options.body },
      ...(options.footer ? { footer: { text: options.footer } } : {}),
      action: {
        button: options.listButtonText || 'Ver opciones',
        sections: options.sections,
      },
    };
  } else if (options.type === 'cta_url' && options.ctaUrl && options.ctaText) {
    payload.type = 'interactive';
    payload.interactive = {
      type: 'cta_url',
      body: { text: options.body },
      action: {
        name: 'cta_url',
        parameters: {
          display_text: options.ctaText,
          url: options.ctaUrl,
        },
      },
    };
  } else {
    payload.type = 'text';
    payload.text = { body: options.body };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Error en WhatsApp Cloud API');
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('[WhatsApp Send Error]', err);
    throw err;
  }
}
