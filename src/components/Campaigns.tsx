import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Send, Plus, CheckCircle2, AlertTriangle, Users, Tag, Trash2, Play, Sparkles, X } from 'lucide-react';
import { ScheduledMessage, BotMessage, Contact } from '../types';
import { 
  getStoredScheduledMessages, 
  saveStoredScheduledMessages, 
  getStoredBotMessages, 
  getStoredContacts 
} from '../lib/mockStore';

export const Campaigns: React.FC = () => {
  const [scheduledList, setScheduledList] = useState<ScheduledMessage[]>([]);
  const [botMessages, setBotMessages] = useState<BotMessage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetType, setTargetType] = useState<'tag' | 'contact'>('tag');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedContactId, setSelectedContactId] = useState('');
  const [selectedBotMsgId, setSelectedBotMsgId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [executingCron, setExecutingCron] = useState(false);
  const [cronResult, setCronResult] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const sm = getStoredScheduledMessages();
    const bm = getStoredBotMessages();
    const ct = getStoredContacts();
    setScheduledList(sm);
    setBotMessages(bm);
    setContacts(ct);
    if (bm.length > 0) setSelectedBotMsgId(bm[0].id);
    const tags = Array.from(new Set(ct.flatMap(c => c.tags)));
    if (tags.length > 0) setSelectedTag(tags[0]);
    if (ct.length > 0) setSelectedContactId(ct[0].id);

    const tomorrow = new Date(Date.now() + 86400000);
    setScheduledDate(tomorrow.toISOString().slice(0, 10));
  };

  const handleScheduleCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    const dateTimeStr = `${scheduledDate}T${scheduledTime}:00`;
    
    const newScheduled: ScheduledMessage = {
      id: 'sm-' + Date.now(),
      contact_id: targetType === 'contact' ? selectedContactId : null,
      tag_filter: targetType === 'tag' ? selectedTag : null,
      bot_message_id: selectedBotMsgId,
      scheduled_at: new Date(dateTimeStr).toISOString(),
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const updated = [newScheduled, ...scheduledList];
    setScheduledList(updated);
    saveStoredScheduledMessages(updated);
    setIsModalOpen(false);
  };

  const handleDeleteScheduled = (id: string) => {
    if (confirm('¿Eliminar este mensaje programado?')) {
      const updated = scheduledList.filter(s => s.id !== id);
      setScheduledList(updated);
      saveStoredScheduledMessages(updated);
    }
  };

  const handleRunCron = async () => {
    setExecutingCron(true);
    setCronResult(null);
    try {
      const response = await fetch('/api/cron/send');
      const data = await response.json();
      setCronResult(`Cron ejecutado: ${data.sent} enviados, ${data.failed} fallidos.`);
      loadData();
    } catch (err: any) {
      setCronResult('Error al ejecutar Cron: ' + err.message);
    } finally {
      setExecutingCron(false);
    }
  };

  const allTags = Array.from(new Set(contacts.flatMap(c => c.tags)));

  return (
    <div className="flex-1 bg-slate-950 p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Seguimientos y Campañas</h1>
            <p className="text-xs text-slate-400 mt-1">
              Programa el envío de plantillas de WhatsApp por etiqueta o contacto con verificación de Opt-In.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRunCron}
              disabled={executingCron}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 rounded-xl text-xs font-medium transition-all flex items-center gap-2 shadow-sm"
            >
              {executingCron ? (
                <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Ejecutar Cron Pendientes (/api/cron/send)
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Programar Campaña
            </button>
          </div>
        </div>

        {cronResult && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
            <span>{cronResult}</span>
            <button onClick={() => setCronResult(null)} className="text-emerald-400 hover:underline">Cerrar</button>
          </div>
        )}

        {/* Scheduled & History Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" /> Registro de Campañas y Seguimientos
            </h3>
            <span className="text-xs text-slate-400">Total: {scheduledList.length} registros</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/30 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Destinatarios</th>
                  <th className="py-3.5 px-6">Plantilla de Bot</th>
                  <th className="py-3.5 px-6">Fecha Programada</th>
                  <th className="py-3.5 px-6">Estado</th>
                  <th className="py-3.5 px-6">Detalle / Error</th>
                  <th className="py-3.5 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                {scheduledList.length > 0 ? (
                  scheduledList.map((item) => {
                    const botMsg = botMessages.find(bm => bm.id === item.bot_message_id);
                    const contact = contacts.find(c => c.id === item.contact_id);

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-6 font-medium text-white">
                          {item.contact_id ? (
                            <span className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-emerald-400" />
                              {contact ? contact.name || contact.phone : 'Contacto'}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-teal-400" />
                              Etiqueta: <strong className="text-white">{item.tag_filter}</strong>
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-slate-200">
                          {botMsg ? botMsg.name : 'Plantilla eliminada'}
                        </td>
                        <td className="py-4 px-6 text-slate-400 font-mono">
                          {new Date(item.scheduled_at).toLocaleString()}
                        </td>
                        <td className="py-4 px-6">
                          {item.status === 'pending' && (
                            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-[11px] font-semibold">
                              Pendiente
                            </span>
                          )}
                          {item.status === 'sent' && (
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[11px] font-semibold flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Enviado
                            </span>
                          )}
                          {item.status === 'failed' && (
                            <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-[11px] font-semibold flex items-center gap-1 w-fit">
                              <AlertTriangle className="w-3.5 h-3.5" /> Fallido
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-slate-400 max-w-xs truncate">
                          {item.error_log || <span className="text-slate-600">Sin errores (Opt-In OK)</span>}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDeleteScheduled(item.id)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No hay campañas o seguimientos programados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Programar Campaña */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" /> Programar Mensaje o Campaña
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Destinatario</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetType('tag')}
                    className={`py-2 rounded-xl text-xs font-medium border transition-colors ${targetType === 'tag' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                  >
                    Grupo por Etiqueta
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('contact')}
                    className={`py-2 rounded-xl text-xs font-medium border transition-colors ${targetType === 'contact' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                  >
                    Contacto Individual
                  </button>
                </div>
              </div>

              {targetType === 'tag' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Seleccionar Etiqueta (Solo con Opt-In)</label>
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    {allTags.map(tg => (
                      <option key={tg} value={tg}>{tg}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Seleccionar Contacto</label>
                  <select
                    value={selectedContactId}
                    onChange={(e) => setSelectedContactId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>{c.name || c.phone} {c.opt_in ? '' : '(Sin Opt-In)'}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Plantilla de Bot / Mensaje</label>
                <select
                  value={selectedBotMsgId}
                  onChange={(e) => setSelectedBotMsgId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  {botMessages.map(bm => (
                    <option key={bm.id} value={bm.id}>{bm.name} ({bm.type})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Hora</label>
                  <input
                    type="time"
                    required
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium shadow-lg shadow-emerald-600/25"
                >
                  Programar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
