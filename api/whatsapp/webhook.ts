import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

async function sendWhatsAppMessage(to: string, messageBody: string, options: any = {}) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';

  if (!token || !phoneNumberId || token.includes('tu-whatsapp')) {
    console.log(`[Simulación API Webhook] Enviando a ${to}: "${messageBody}"`);
    return { success: true, message_id: 'wamid_sim_' + Date.now() };
  }

  const payload: any = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: options.type || 'text',
  };

  if (payload.type === 'text') {
    payload.text = { body: messageBody };
  } else if (payload.type === 'buttons') {
    payload.type = 'interactive';
    payload.interactive = {
      type: 'button',
      body: { text: messageBody },
      action: {
        buttons: (options.buttons || []).map((b: any) => ({
          type: 'reply',
          reply: { id: b.id, title: b.title },
        })),
      },
    };
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
  if (!response.ok) throw new Error(data.error?.message || 'Error en WhatsApp API');
  return { success: true, data };
}

export default async function handler(req: any, res: any) {
  // 1. GET /api/whatsapp/webhook - Verificación de Meta
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'] || req.url?.split('?')[1]?.includes('hub.mode');
    // Parse URL query params if needed
    const urlParams = new URL(req.url, `https://${req.headers.host || 'localhost'}`).searchParams;
    const hubMode = urlParams.get('hub.mode');
    const token = urlParams.get('hub.verify_token');
    const challenge = urlParams.get('hub.challenge');

    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'crm_whatsapp_verify_token_2026';

    if (hubMode === 'subscribe' && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Verificación fallida');
  }

  // 2. POST /api/whatsapp/webhook - Recepción y Motor del Bot
  if (req.method === 'POST') {
    // Responder 200 rápido a Meta
    res.status(200).send('EVENT_RECEIVED');

    const body = req.body;
    const signature = req.headers['x-hub-signature-256'] as string;
    const appSecret = process.env.WHATSAPP_APP_SECRET;

    if (appSecret && signature) {
      const elements = signature.split('=');
      const signatureHash = elements[1];
      const expectedHash = crypto
        .createHmac('sha256', appSecret)
        .update(JSON.stringify(body))
        .digest('hex');

      if (signatureHash !== expectedHash) {
        console.warn('[Webhook] Firma inválida');
        return;
      }
    }

    if (body.object === 'whatsapp_business_account') {
      try {
        for (const entry of body.entry || []) {
          for (const change of entry.changes || []) {
            if (change.field === 'messages') {
              const value = change.value;
              const contactsList = value?.contacts;
              const messages = value?.messages;

              if (messages && messages.length > 0) {
                for (const msg of messages) {
                  const phone = msg.from;
                  const waMessageId = msg.id;
                  const msgType = msg.type;
                  
                  let profileName = 'Cliente WhatsApp';
                  if (contactsList && contactsList.length > 0) {
                    profileName = contactsList[0].profile?.name || profileName;
                  }

                  let messageBody = '';
                  let payloadData: any = {};
                  let clickedButtonId: string | null = null;
                  let clickedListId: string | null = null;

                  if (msgType === 'text') {
                    messageBody = msg.text?.body || '';
                  } else if (msgType === 'interactive') {
                    const interactive = msg.interactive;
                    if (interactive.type === 'button_reply') {
                      clickedButtonId = interactive.button_reply.id;
                      messageBody = `[Botón]: ${interactive.button_reply.title}`;
                      payloadData = { button_reply: interactive.button_reply };
                    } else if (interactive.type === 'list_reply') {
                      clickedListId = interactive.list_reply.id;
                      messageBody = `[Lista]: ${interactive.list_reply.title}`;
                      payloadData = { list_reply: interactive.list_reply };
                    }
                  } else {
                    messageBody = `[Mensaje ${msgType}]`;
                  }

                  const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
                  const nowIso = new Date().toISOString();

                  // Buscar contacto en Supabase
                  let { data: contact } = await supabase
                    .from('contacts')
                    .select('*')
                    .eq('phone', formattedPhone)
                    .single();

                  if (!contact) {
                    const { data: newContact, error: createErr } = await supabase
                      .from('contacts')
                      .insert([{
                        phone: formattedPhone,
                        name: profileName,
                        tags: ['Lead'],
                        stage: 'Lead',
                        bot_paused: false,
                        opt_in: true,
                        last_message_at: nowIso,
                      }])
                      .select()
                      .single();
                    if (!createErr) contact = newContact;
                  } else {
                    await supabase
                      .from('contacts')
                      .update({ last_message_at: nowIso, name: contact.name || profileName })
                      .eq('id', contact.id);
                  }

                  if (contact) {
                    // Guardar mensaje entrante
                    await supabase.from('messages').insert([{
                      contact_id: contact.id,
                      direction: 'in',
                      type: msgType === 'text' ? 'text' : 'interactive',
                      body: messageBody,
                      payload: payloadData,
                      wa_message_id: waMessageId,
                      status: 'read',
                    }]);

                    // Motor del Bot
                    if (contact.opt_in && !contact.bot_paused) {
                      const { data: botMessages } = await supabase.from('bot_messages').select('*');
                      const { data: botTriggers } = await supabase.from('bot_triggers').select('*').eq('active', true);
                      const { data: settings } = await supabase.from('settings').select('*');

                      let targetBotMsg: any = null;

                      if (clickedButtonId && botMessages) {
                        targetBotMsg = botMessages.find(bm => bm.buttons?.some((b: any) => b.id === clickedButtonId));
                      } else if (clickedListId && botMessages) {
                        targetBotMsg = botMessages.find(bm => bm.sections?.some((s: any) => s.rows?.some((r: any) => r.id === clickedListId)));
                      }

                      if (!targetBotMsg && msgType === 'text' && botTriggers) {
                        const cleanInput = normalizeText(messageBody);
                        for (const trig of botTriggers) {
                          const cleanKeyword = normalizeText(trig.keyword);
                          if (trig.match_type === 'exact' && cleanInput === cleanKeyword) {
                            targetBotMsg = botMessages?.find(bm => bm.id === trig.bot_message_id);
                            break;
                          } else if (trig.match_type === 'contains' && cleanInput.includes(cleanKeyword)) {
                            targetBotMsg = botMessages?.find(bm => bm.id === trig.bot_message_id);
                            break;
                          }
                        }
                      }

                      if (!targetBotMsg && botMessages) {
                        const defaultSetting = settings?.find(s => s.key === 'default_bot_message_id');
                        const defaultId = defaultSetting?.value || botMessages[0]?.id;
                        targetBotMsg = botMessages.find(bm => bm.id === defaultId);
                      }

                      if (targetBotMsg) {
                        await sendWhatsAppMessage(contact.phone, targetBotMsg.body, targetBotMsg);

                        await supabase.from('messages').insert([{
                          contact_id: contact.id,
                          direction: 'out',
                          type: 'text',
                          body: targetBotMsg.body,
                          status: 'sent',
                        }]);

                        let updateData: any = {};
                        if (targetBotMsg.add_tag && !contact.tags?.includes(targetBotMsg.add_tag)) {
                          updateData.tags = [...(contact.tags || []), targetBotMsg.add_tag];
                        }
                        if (targetBotMsg.set_stage && contact.stage !== targetBotMsg.set_stage) {
                          updateData.stage = targetBotMsg.set_stage;
                        }
                        if (Object.keys(updateData).length > 0) {
                          await supabase.from('contacts').update(updateData).eq('id', contact.id);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('[Webhook Processing Error]', err);
      }
    }
    return;
  }

  return res.status(405).send('Método no permitido');
}
