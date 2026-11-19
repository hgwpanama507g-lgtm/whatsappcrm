import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function sendWhatsAppMessage(to: string, messageBody: string, options: any = {}) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';

  if (!token || !phoneNumberId || token.includes('tu-whatsapp')) {
    console.log(`[Simulación Cron] A ${to}: "${messageBody}"`);
    return { success: true };
  }

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: messageBody },
      }),
    }
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Error en WhatsApp API');
  return { success: true };
}

export default async function handler(req: any, res: any) {
  try {
    const nowIso = new Date().toISOString();

    // Obtener mensajes programados pendientes cuya fecha sea <= ahora
    const { data: pendingMessages, error: fetchErr } = await supabase
      .from('scheduled_messages')
      .select('*, bot_messages(*), contacts(*)')
      .eq('status', 'pending')
      .lte('scheduled_at', nowIso);

    if (fetchErr) throw fetchErr;
    if (!pendingMessages || pendingMessages.length === 0) {
      return res.json({ success: true, processed: 0, sent: 0, failed: 0 });
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const item of pendingMessages) {
      const botMsg = item.bot_messages;
      if (!botMsg) {
        await supabase
          .from('scheduled_messages')
          .update({ status: 'failed', error_log: 'Plantilla de bot no encontrada' })
          .eq('id', item.id);
        failedCount++;
        continue;
      }

      // Obtener destinatarios (contacto individual o tag filter)
      let query = supabase.from('contacts').select('*').eq('opt_in', true);
      if (item.contact_id) {
        query = query.eq('id', item.contact_id);
      } else if (item.tag_filter) {
        query = query.contains('tags', [item.tag_filter]);
      }

      const { data: recipients } = await query;
      if (!recipients || recipients.length === 0) {
        await supabase
          .from('scheduled_messages')
          .update({ status: 'sent', error_log: 'Sin destinatarios con Opt-In' })
          .eq('id', item.id);
        continue;
      }

      let hasError = false;
      let lastError = '';

      for (const contact of recipients) {
        try {
          await sendWhatsAppMessage(contact.phone, botMsg.body, botMsg);

          await supabase.from('messages').insert([{
            contact_id: contact.id,
            direction: 'out',
            type: 'text',
            body: botMsg.body,
            status: 'sent',
          }]);
          sentCount++;
        } catch (err: any) {
          hasError = true;
          lastError = err.message || 'Error de envío';
          failedCount++;
        }
      }

      await supabase
        .from('scheduled_messages')
        .update({
          status: hasError ? 'failed' : 'sent',
          error_log: hasError ? lastError : null,
        })
        .eq('id', item.id);
    }

    return res.json({
      success: true,
      processed: pendingMessages.length,
      sent: sentCount,
      failed: failedCount,
    });
  } catch (err: any) {
    console.error('[Cron Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
