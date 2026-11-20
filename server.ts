import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { sendWhatsApp } from './src/lib/whatsapp.ts';
import { 
  getStoredContacts, 
  saveStoredContacts, 
  getStoredMessages, 
  saveStoredMessages, 
  getStoredBotMessages, 
  getStoredBotTriggers, 
  getStoredScheduledMessages,
  saveStoredScheduledMessages,
  getStoredSettings 
} from './src/lib/mockStore.ts';

dotenv.config();

function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function setupServer(app: express.Express) {
  app.use(express.json());

  // ============================================================================
  // 1. GET /api/whatsapp/webhook - Verificación de Meta
  // ============================================================================
  app.get('/api/whatsapp/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'crm_whatsapp_verify_token_2026';

    if (mode && token) {
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[WhatsApp Webhook] Verificado correctamente.');
        return res.status(200).send(challenge);
      } else {
        return res.sendStatus(403);
      }
    } else {
      return res.sendStatus(400);
    }
  });

  // ============================================================================
  // 2. POST /api/whatsapp/webhook - Motor del Bot y Webhook de Mensajes
  // ============================================================================
  app.post('/api/whatsapp/webhook', async (req, res) => {
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
        console.warn('[WhatsApp Webhook] Firma X-Hub-Signature-256 inválida.');
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
              const statuses = value?.statuses;

              if (statuses && statuses.length > 0) {
                for (const st of statuses) {
                  const waMessageId = st.id;
                  const newStatus = st.status;
                  const messagesStore = getStoredMessages();
                  let updated = false;
                  const updatedMsgs = messagesStore.map((m) => {
                    if (m.wa_message_id === waMessageId) {
                      updated = true;
                      return { ...m, status: newStatus };
                    }
                    return m;
                  });
                  if (updated) saveStoredMessages(updatedMsgs);
                }
              }

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
                  } else if (msgType === 'image') {
                    messageBody = msg.image?.caption || '[Imagen recibida]';
                    payloadData = { image: msg.image };
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

                  const contactsStore = getStoredContacts();
                  const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
                  let contact = contactsStore.find((c) => c.phone === formattedPhone || c.phone === phone);

                  const nowIso = new Date().toISOString();

                  if (!contact) {
                    contact = {
                      id: 'c-' + Date.now(),
                      phone: formattedPhone,
                      name: profileName,
                      tags: ['Lead'],
                      stage: 'Lead',
                      bot_paused: false,
                      opt_in: true,
                      created_at: nowIso,
                      last_message_at: nowIso,
                    };
                    contactsStore.unshift(contact);
                  } else {
                    contact.last_message_at = nowIso;
                    if (!contact.name || contact.name === 'Cliente WhatsApp') {
                      contact.name = profileName;
                    }
                  }
                  saveStoredContacts(contactsStore);

                  const messagesStore = getStoredMessages();
                  const inMsg = {
                    id: 'm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                    contact_id: contact.id,
                    direction: 'in' as const,
                    type: msgType === 'text' ? ('text' as const) : ('interactive' as const),
                    body: messageBody,
                    payload: payloadData,
                    wa_message_id: waMessageId,
                    status: 'read' as const,
                    created_at: nowIso,
                  };
                  messagesStore.push(inMsg);
                  saveStoredMessages(messagesStore);

                  // Bot Engine (solo si opt_in es true y bot no pausado)
                  if (contact.opt_in && !contact.bot_paused) {
                    const botMessages = getStoredBotMessages();
                    const botTriggers = getStoredBotTriggers();
                    const settings = getStoredSettings();

                    let targetBotMsg: any = null;

                    if (clickedButtonId) {
                      for (const bm of botMessages) {
                        const matchedBtn = bm.buttons?.find((b) => b.id === clickedButtonId);
                        if (matchedBtn) {
                          targetBotMsg = bm;
                          break;
                        }
                      }
                    } else if (clickedListId) {
                      for (const bm of botMessages) {
                        for (const sec of bm.sections || []) {
                          const matchedRow = sec.rows.find((r) => r.id === clickedListId);
                          if (matchedRow) {
                            targetBotMsg = bm;
                            break;
                          }
                        }
                      }
                    }

                    if (!targetBotMsg && msgType === 'text') {
                      const cleanInput = normalizeText(messageBody);
                      for (const trig of botTriggers) {
                        if (!trig.active) continue;
                        const cleanKeyword = normalizeText(trig.keyword);

                        if (trig.match_type === 'exact' && cleanInput === cleanKeyword) {
                          targetBotMsg = botMessages.find((bm) => bm.id === trig.bot_message_id);
                          break;
                        } else if (trig.match_type === 'contains' && cleanInput.includes(cleanKeyword)) {
                          targetBotMsg = botMessages.find((bm) => bm.id === trig.bot_message_id);
                          break;
                        }
                      }
                    }

                    if (!targetBotMsg) {
                      const defaultMsgSetting = settings.find((s) => s.key === 'default_bot_message_id');
                      const defaultMsgId = defaultMsgSetting?.value || botMessages[0]?.id;
                      const lastBotOut = messagesStore
                        .filter((m) => m.contact_id === contact.id && m.direction === 'out')
                        .pop();

                      const sixHoursAgo = Date.now() - 6 * 3600 * 1000;
                      const lastOutTime = lastBotOut ? new Date(lastBotOut.created_at).getTime() : 0;

                      if (!lastBotOut || lastOutTime < sixHoursAgo) {
                        targetBotMsg = botMessages.find((bm) => bm.id === defaultMsgId);
                      }
                    }

                    if (targetBotMsg) {
                      try {
                        await sendWhatsApp({
                          to: contact.phone,
                          type: targetBotMsg.type,
                          body: targetBotMsg.body,
                          header: targetBotMsg.header || undefined,
                          footer: targetBotMsg.footer || undefined,
                          buttons: targetBotMsg.buttons,
                          listButtonText: targetBotMsg.list_button_text || undefined,
                          sections: targetBotMsg.sections,
                          ctaText: targetBotMsg.cta_text || undefined,
                          ctaUrl: targetBotMsg.cta_url || undefined,
                        });

                        const outMsg = {
                          id: 'm-' + Date.now(),
                          contact_id: contact.id,
                          direction: 'out' as const,
                          type: targetBotMsg.type === 'image' ? ('image' as const) : ('text' as const),
                          body: targetBotMsg.body,
                          status: 'sent' as const,
                          created_at: new Date().toISOString(),
                        };
                        messagesStore.push(outMsg);
                        saveStoredMessages(messagesStore);

                        let contactUpdated = false;
                        if (targetBotMsg.add_tag && !contact.tags.includes(targetBotMsg.add_tag)) {
                          contact.tags.push(targetBotMsg.add_tag);
                          contactUpdated = true;
                        }
                        if (targetBotMsg.set_stage && contact.stage !== targetBotMsg.set_stage) {
                          contact.stage = targetBotMsg.set_stage;
                          contactUpdated = true;
                        }
                        if (contactUpdated) saveStoredContacts(contactsStore);
                      } catch (err) {
                        console.error('[Bot Engine Send Error]', err);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('[WhatsApp Webhook Engine Error]', err);
      }
    }
  });

  // ============================================================================
  // 3. GET /api/cron/send - Vercel Cron para enviar mensajes programados y campañas
  // ============================================================================
  app.get('/api/cron/send', async (req, res) => {
    try {
      const scheduledStore = getStoredScheduledMessages();
      const contactsStore = getStoredContacts();
      const botMessagesStore = getStoredBotMessages();
      const messagesStore = getStoredMessages();

      const now = Date.now();
      let sentCount = 0;
      let failedCount = 0;

      const updatedScheduled = await Promise.all(
        scheduledStore.map(async (item) => {
          if (item.status !== 'pending') return item;

          const scheduledTime = new Date(item.scheduled_at).getTime();
          if (scheduledTime > now) return item; // Aún no es tiempo

          const botMsg = botMessagesStore.find((bm) => bm.id === item.bot_message_id);
          if (!botMsg) {
            return { ...item, status: 'failed' as const, error_log: 'Plantilla de bot no encontrada' };
          }

          // Determinar destinatarios (contacto individual o filtro por etiqueta)
          let targetContacts = contactsStore.filter((c) => c.opt_in);
          if (item.contact_id) {
            targetContacts = targetContacts.filter((c) => c.id === item.contact_id);
          } else if (item.tag_filter) {
            targetContacts = targetContacts.filter((c) => c.tags.includes(item.tag_filter!));
          }

          let hasError = false;
          let lastErrorMsg = '';

          for (const contact of targetContacts) {
            try {
              await sendWhatsApp({
                to: contact.phone,
                type: botMsg.type,
                body: botMsg.body,
                header: botMsg.header || undefined,
                footer: botMsg.footer || undefined,
                buttons: botMsg.buttons,
                listButtonText: botMsg.list_button_text || undefined,
                sections: botMsg.sections,
                ctaText: botMsg.cta_text || undefined,
                ctaUrl: botMsg.cta_url || undefined,
              });

              messagesStore.push({
                id: 'm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
                contact_id: contact.id,
                direction: 'out',
                type: 'text',
                body: botMsg.body,
                status: 'sent',
                created_at: new Date().toISOString(),
              });
              sentCount++;
            } catch (err: any) {
              hasError = true;
              lastErrorMsg = err.message || 'Error al enviar WhatsApp';
              failedCount++;
            }
          }

          saveStoredMessages(messagesStore);

          return {
            ...item,
            status: hasError ? ('failed' as const) : ('sent' as const),
            error_log: hasError ? lastErrorMsg : null,
          };
        })
      );

      saveStoredScheduledMessages(updatedScheduled);

      return res.json({
        success: true,
        processed: scheduledStore.filter((i) => i.status === 'pending' && new Date(i.scheduled_at).getTime() <= now).length,
        sent: sentCount,
        failed: failedCount,
      });
    } catch (err: any) {
      console.error('[Cron Send Error]', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // ============================================================================
  // 4. POST /api/send y /api/whatsapp/send - Envío manual
  // ============================================================================
  const handleSendEndpoint = async (req: express.Request, res: express.Response) => {
    const { phone, message, type, contactId, buttons, sections, ctaText, ctaUrl, imageUrl } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: 'Faltan parámetros obligatorios: phone o message' });
    }

    try {
      const result = await sendWhatsApp({
        to: phone,
        type: type || 'text',
        body: message,
        buttons,
        sections,
        ctaText,
        ctaUrl,
        imageUrl,
      });

      const messagesStore = getStoredMessages();
      const nowIso = new Date().toISOString();
      const newOutMsg = {
        id: 'm-' + Date.now(),
        contact_id: contactId || 'c-1',
        direction: 'out' as const,
        type: type === 'image' ? ('image' as const) : ('text' as const),
        body: message,
        wa_message_id: result.data?.messages?.[0]?.id || result.message_id || 'wamid_manual',
        status: result.success ? ('sent' as const) : ('failed' as const),
        created_at: nowIso,
      };
      messagesStore.push(newOutMsg);
      saveStoredMessages(messagesStore);

      return res.json({ success: true, result });
    } catch (err: any) {
      console.error('[API Send Error]', err);

      const messagesStore = getStoredMessages();
      const nowIso = new Date().toISOString();
      const failedMsg = {
        id: 'm-' + Date.now(),
        contact_id: contactId || 'c-1',
        direction: 'out' as const,
        type: 'text' as const,
        body: message,
        status: 'failed' as const,
        created_at: nowIso,
      };
      messagesStore.push(failedMsg);
      saveStoredMessages(messagesStore);

      return res.status(500).json({ success: false, error: err.message || 'Error al enviar mensaje' });
    }
  };

  app.post('/api/send', handleSendEndpoint);
  app.post('/api/whatsapp/send', handleSendEndpoint);
}
