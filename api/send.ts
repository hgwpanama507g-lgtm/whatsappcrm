import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { phone, message, type, contactId, buttons, sections, ctaText, ctaUrl, imageUrl } = req.body || {};

  if (!phone || !message) {
    return res.status(400).json({ error: 'Faltan parámetros phone o message' });
  }

  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';

  let sendSuccess = false;
  let waMessageId = 'wamid_manual_' + Date.now();
  let errorMsg = null;

  if (!token || !phoneNumberId || token.includes('tu-whatsapp')) {
    console.log(`[Simulación API Send] A ${phone}: "${message}"`);
    sendSuccess = true;
  } else {
    try {
      const payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: type || 'text',
      };

      if (payload.type === 'text') {
        payload.text = { body: message };
      } else if (payload.type === 'image' && imageUrl) {
        payload.image = { link: imageUrl, caption: message };
      }

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
        throw new Error(data.error?.message || 'Error en WhatsApp API');
      }

      sendSuccess = true;
      waMessageId = data.messages?.[0]?.id || waMessageId;
    } catch (err: any) {
      errorMsg = err.message || 'Error de conexión';
      sendSuccess = false;
    }
  }

  // Guardar en Supabase table messages
  if (contactId) {
    await supabase.from('messages').insert([{
      contact_id: contactId,
      direction: 'out',
      type: type || 'text',
      body: message,
      wa_message_id: waMessageId,
      status: sendSuccess ? 'sent' : 'failed',
    }]);
  }

  if (!sendSuccess) {
    return res.status(500).json({ success: false, error: errorMsg });
  }

  return res.json({ success: true, wa_message_id: waMessageId });
}
