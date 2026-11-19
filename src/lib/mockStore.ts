import { Contact, Message, BotMessage, BotTrigger, ScheduledMessage, SettingItem } from '../types';

const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'c-1',
    phone: '+50761234567',
    name: 'Carlos Mendoza',
    tags: ['VIP', 'Interesado'],
    stage: 'Propuesta',
    notes: 'Cliente muy interesado en plan Enterprise.',
    bot_paused: false,
    opt_in: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    last_message_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'c-2',
    phone: '+50769876543',
    name: 'María Rodríguez',
    tags: ['Nuevo', 'Lead'],
    stage: 'Lead',
    notes: 'Vino de campaña de Instagram.',
    bot_paused: false,
    opt_in: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    last_message_at: new Date(Date.now() - 1800000).toISOString(),
  },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm-1',
    contact_id: 'c-1',
    direction: 'in',
    type: 'text',
    body: 'Hola, me interesa conocer el bot para WhatsApp.',
    status: 'read',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'm-2',
    contact_id: 'c-1',
    direction: 'out',
    type: 'text',
    body: '¡Hola Carlos! Con gusto. ¿Te agendamos una demo?',
    status: 'delivered',
    created_at: new Date(Date.now() - 3600000 * 2.5).toISOString(),
  },
];

const INITIAL_BOT_MESSAGES: BotMessage[] = [
  {
    id: 'bm-1',
    name: 'Menú Principal',
    type: 'buttons',
    header: '🤖 Bienvenido a CRM WhatsApp',
    body: '¿Cómo podemos ayudarte hoy? Selecciona una opción en los botones de abajo:',
    footer: 'Responde con un botón',
    buttons: [
      { id: 'btn_prod', title: 'Ver Productos' },
      { id: 'btn_precios', title: 'Ver Precios' },
      { id: 'btn_asesor', title: 'Hablar con Asesor' },
    ],
    next_message_id: null,
    add_tag: 'Lead',
    set_stage: 'Lead',
    created_at: new Date().toISOString(),
  },
  {
    id: 'bm-2',
    name: 'Lista de Productos',
    type: 'list',
    header: '📦 Catálogo 2026',
    body: 'Explora nuestra selección de soluciones empresariales para WhatsApp Business:',
    footer: 'Toca el botón para ver opciones',
    list_button_text: 'Ver catálogo',
    sections: [
      {
        title: 'Planes Cloud',
        rows: [
          { id: 'row_1', title: 'CRM Pro', description: 'Ideal para equipos de ventas (hasta 5 agentes)' },
          { id: 'row_2', title: 'CRM Enterprise', description: 'Automatización ilimitada y API dedicada' },
        ],
      },
    ],
    next_message_id: null,
    add_tag: 'Interesado',
    set_stage: 'Contactado',
    created_at: new Date().toISOString(),
  },
  {
    id: 'bm-3',
    name: 'Sitio Web CTA',
    type: 'cta_url',
    header: '🌐 Enlace Oficial',
    body: 'Visita nuestro sitio web oficial para conocer más casos de éxito y documentación técnica.',
    cta_text: 'Visitar Sitio Web',
    cta_url: 'https://crmwhatsapp.com',
    next_message_id: null,
    add_tag: 'Propuesta',
    set_stage: 'Propuesta',
    created_at: new Date().toISOString(),
  },
];

const INITIAL_BOT_TRIGGERS: BotTrigger[] = [
  {
    id: 'bt-1',
    keyword: 'hola',
    match_type: 'contains',
    bot_message_id: 'bm-1',
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'bt-2',
    keyword: 'menu',
    match_type: 'exact',
    bot_message_id: 'bm-1',
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'bt-3',
    keyword: 'productos',
    match_type: 'contains',
    bot_message_id: 'bm-2',
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'bt-4',
    keyword: 'precio',
    match_type: 'contains',
    bot_message_id: 'bm-3',
    active: true,
    created_at: new Date().toISOString(),
  },
];

const INITIAL_SCHEDULED_MESSAGES: ScheduledMessage[] = [
  {
    id: 'sm-1',
    contact_id: 'c-1',
    tag_filter: null,
    bot_message_id: 'bm-3',
    scheduled_at: new Date(Date.now() + 3600000 * 2).toISOString(),
    status: 'pending',
    created_at: new Date().toISOString(),
  },
  {
    id: 'sm-2',
    contact_id: null,
    tag_filter: 'VIP',
    bot_message_id: 'bm-1',
    scheduled_at: new Date(Date.now() - 3600000).toISOString(),
    status: 'sent',
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
];

const INITIAL_SETTINGS: SettingItem[] = [
  { key: 'company_name', value: 'CRM WhatsApp Enterprise', updated_at: new Date().toISOString() },
  { key: 'bot_enabled', value: 'true', updated_at: new Date().toISOString() },
  { key: 'default_bot_message_id', value: 'bm-1', updated_at: new Date().toISOString() },
];

export const getStoredContacts = (): Contact[] => {
  const data = localStorage.getItem('crm_contacts');
  if (!data) {
    localStorage.setItem('crm_contacts', JSON.stringify(INITIAL_CONTACTS));
    return INITIAL_CONTACTS;
  }
  return JSON.parse(data).map((c: any) => ({ ...c, opt_in: c.opt_in !== false }));
};

export const saveStoredContacts = (contacts: Contact[]) => {
  localStorage.setItem('crm_contacts', JSON.stringify(contacts));
};

export const getStoredMessages = (): Message[] => {
  const data = localStorage.getItem('crm_messages');
  if (!data) {
    localStorage.setItem('crm_messages', JSON.stringify(INITIAL_MESSAGES));
    return INITIAL_MESSAGES;
  }
  return JSON.parse(data);
};

export const saveStoredMessages = (messages: Message[]) => {
  localStorage.setItem('crm_messages', JSON.stringify(messages));
};

export const getStoredBotMessages = (): BotMessage[] => {
  const data = localStorage.getItem('crm_bot_messages');
  if (!data) {
    localStorage.setItem('crm_bot_messages', JSON.stringify(INITIAL_BOT_MESSAGES));
    return INITIAL_BOT_MESSAGES;
  }
  return JSON.parse(data);
};

export const saveStoredBotMessages = (msgs: BotMessage[]) => {
  localStorage.setItem('crm_bot_messages', JSON.stringify(msgs));
};

export const getStoredBotTriggers = (): BotTrigger[] => {
  const data = localStorage.getItem('crm_bot_triggers');
  if (!data) {
    localStorage.setItem('crm_bot_triggers', JSON.stringify(INITIAL_BOT_TRIGGERS));
    return INITIAL_BOT_TRIGGERS;
  }
  return JSON.parse(data);
};

export const saveStoredBotTriggers = (triggers: BotTrigger[]) => {
  localStorage.setItem('crm_bot_triggers', JSON.stringify(triggers));
};

export const getStoredScheduledMessages = (): ScheduledMessage[] => {
  const data = localStorage.getItem('crm_scheduled_messages');
  if (!data) {
    localStorage.setItem('crm_scheduled_messages', JSON.stringify(INITIAL_SCHEDULED_MESSAGES));
    return INITIAL_SCHEDULED_MESSAGES;
  }
  return JSON.parse(data);
};

export const saveStoredScheduledMessages = (sm: ScheduledMessage[]) => {
  localStorage.setItem('crm_scheduled_messages', JSON.stringify(sm));
};

export const getStoredSettings = (): SettingItem[] => {
  const data = localStorage.getItem('crm_settings');
  if (!data) {
    localStorage.setItem('crm_settings', JSON.stringify(INITIAL_SETTINGS));
    return INITIAL_SETTINGS;
  }
  return JSON.parse(data);
};

export const saveStoredSettings = (settings: SettingItem[]) => {
  localStorage.setItem('crm_settings', JSON.stringify(settings));
};
