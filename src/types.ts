/**
 * Tipos de datos para el CRM WhatsApp
 */

export interface Contact {
  id: string;
  phone: string;
  name: string | null;
  tags: string[];
  stage: string;
  notes?: string | null;
  bot_paused: boolean;
  opt_in: boolean;
  created_at: string;
  last_message_at: string | null;
}

export interface Message {
  id: string;
  contact_id: string;
  direction: 'in' | 'out';
  type: 'text' | 'image' | 'audio' | 'document' | 'interactive';
  body: string | null;
  payload?: any;
  wa_message_id?: string | null;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  created_at: string;
}

export interface BotButton {
  id: string;
  title: string;
}

export interface BotSectionRow {
  id: string;
  title: string;
  description?: string;
}

export interface BotSection {
  title: string;
  rows: BotSectionRow[];
}

export interface BotMessage {
  id: string;
  name: string;
  type: 'text' | 'buttons' | 'list' | 'cta_url';
  header?: string | null;
  body: string;
  footer?: string | null;
  buttons?: BotButton[];
  list_button_text?: string | null;
  sections?: BotSection[];
  cta_text?: string | null;
  cta_url?: string | null;
  next_message_id?: string | null;
  add_tag?: string | null;
  set_stage?: string | null;
  created_at: string;
}

export interface BotTrigger {
  id: string;
  keyword: string;
  match_type: 'exact' | 'contains';
  bot_message_id: string;
  active: boolean;
  created_at: string;
}

export interface ScheduledMessage {
  id: string;
  contact_id: string | null; // null si es campaña masiva por etiqueta
  tag_filter?: string | null;
  bot_message_id: string;
  scheduled_at: string;
  status: 'pending' | 'sent' | 'failed';
  error_log?: string | null;
  created_at: string;
}

export interface SettingItem {
  key: string;
  value: string;
  updated_at: string;
}

export type ActiveTab = 'inbox' | 'contacts' | 'funnel' | 'bot' | 'campaigns' | 'settings';
