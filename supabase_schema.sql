-- ==============================================================================
-- CRM WHATSAPP - SUPABASE SQL SCHEMA & RLS POLICIES (Actualizado con Seguimientos y Campañas)
-- ==============================================================================

-- 1. Tabla de Contactos
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255),
    tags TEXT[] DEFAULT '{}',
    stage VARCHAR(100) DEFAULT 'Lead',
    notes TEXT,
    bot_paused BOOLEAN DEFAULT FALSE,
    opt_in BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabla de Mensajes
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
    direction VARCHAR(10) CHECK (direction IN ('in', 'out')) NOT NULL,
    type VARCHAR(50) DEFAULT 'text' NOT NULL,
    body TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    wa_message_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'sent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla de Mensajes del Bot (Automatizaciones)
CREATE TABLE IF NOT EXISTS public.bot_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('text', 'buttons', 'list', 'cta_url')) DEFAULT 'text' NOT NULL,
    header TEXT,
    body TEXT NOT NULL,
    footer TEXT,
    buttons JSONB DEFAULT '[]'::jsonb,
    list_button_text VARCHAR(100),
    sections JSONB DEFAULT '[]'::jsonb,
    cta_text VARCHAR(100),
    cta_url TEXT,
    next_message_id UUID REFERENCES public.bot_messages(id) ON DELETE SET NULL,
    add_tag VARCHAR(100),
    set_stage VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabla de Disparadores del Bot (Triggers)
CREATE TABLE IF NOT EXISTS public.bot_triggers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    keyword VARCHAR(255) NOT NULL,
    match_type VARCHAR(20) CHECK (match_type IN ('exact', 'contains')) DEFAULT 'contains' NOT NULL,
    bot_message_id UUID REFERENCES public.bot_messages(id) ON DELETE CASCADE NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabla de Mensajes Programados y Campañas
CREATE TABLE IF NOT EXISTS public.scheduled_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    tag_filter VARCHAR(100),
    bot_message_id UUID REFERENCES public.bot_messages(id) ON DELETE CASCADE NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'sent', 'failed')) DEFAULT 'pending' NOT NULL,
    error_log TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tabla de Ajustes del Sistema
CREATE TABLE IF NOT EXISTS public.settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acceso completo a usuarios autenticados en contacts"
    ON public.contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir acceso completo a usuarios autenticados en messages"
    ON public.messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir acceso completo a usuarios autenticados en bot_messages"
    ON public.bot_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir acceso completo a usuarios autenticados en bot_triggers"
    ON public.bot_triggers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir acceso completo a usuarios autenticados en scheduled_messages"
    ON public.scheduled_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir acceso completo a usuarios autenticados en settings"
    ON public.settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Índices recomendados
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_stage ON public.contacts(stage);
CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON public.messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_status ON public.scheduled_messages(status, scheduled_at);
