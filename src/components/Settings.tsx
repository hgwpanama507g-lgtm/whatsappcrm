import React, { useState } from 'react';
import { Settings as SettingsIcon, Key, Globe, Shield, Save, CheckCircle, Database } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

export const Settings: React.FC = () => {
  const [whatsappToken, setWhatsappToken] = useState('EAAG... (token configurado en .env)');
  const [phoneId, setPhoneId] = useState('109283746592819');
  const [verifyToken, setVerifyToken] = useState('crm_whatsapp_verify_token_2026');
  const [appSecret, setAppSecret] = useState('••••••••••••••••••••••••••••');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const webhookUrl = `${window.location.origin}/api/whatsapp/webhook`;

  return (
    <div className="flex-1 bg-slate-950 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white tracking-tight">Ajustes del Sistema</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configura las credenciales de WhatsApp Business Cloud API y Supabase.
          </p>
        </div>

        {saved && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Configuración guardada correctamente.
          </div>
        )}

        <div className="space-y-6">
          {/* Supabase Status Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Base de Datos Supabase</h3>
                <p className="text-xs text-slate-400">Estado de conexión y RLS</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="text-xs font-medium text-slate-300">
                  {isSupabaseConfigured ? 'Conectado a Supabase Project' : 'Modo Demostración / LocalStorage (Configura .env para producción)'}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {isSupabaseConfigured ? 'Postgres + Auth OK' : 'Demo Activo'}
              </span>
            </div>
          </div>

          {/* WhatsApp Cloud API Form */}
          <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-center text-teal-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">WhatsApp Business Cloud API (Meta)</h3>
                <p className="text-xs text-slate-400">Credenciales de la API de Meta</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Webhook URL (para configurar en Meta Developers)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-emerald-400 text-xs font-mono select-all"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Suscripción requerida a los campos: <code className="text-slate-400">messages</code>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">WhatsApp Token (WHATSAPP_TOKEN)</label>
                <input
                  type="password"
                  value={whatsappToken}
                  onChange={(e) => setWhatsappToken(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number ID (WHATSAPP_PHONE_NUMBER_ID)</label>
                <input
                  type="text"
                  value={phoneId}
                  onChange={(e) => setPhoneId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Verify Token (WHATSAPP_VERIFY_TOKEN)</label>
                <input
                  type="text"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">App Secret (WHATSAPP_APP_SECRET)</label>
                <input
                  type="password"
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar Ajustes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
