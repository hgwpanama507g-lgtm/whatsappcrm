import React, { useState, useEffect } from 'react';
import { Bot, Plus, Zap, MessageSquare, Trash2, Edit, Copy, Send, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { BotMessage, BotTrigger, BotButton, BotSection } from '../types';
import { getStoredBotMessages, saveStoredBotMessages, getStoredBotTriggers, saveStoredBotTriggers, getStoredContacts } from '../lib/mockStore';
import { sendWhatsApp } from '../lib/whatsapp';

export const BotBuilder: React.FC = () => {
  const [botMessages, setBotMessages] = useState<BotMessage[]>([]);
  const [botTriggers, setBotTriggers] = useState<BotTrigger[]>([]);
  const [activeTabSub, setActiveTabSub] = useState<'messages' | 'triggers'>('messages');

  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testMessageTarget, setTestMessageTarget] = useState<BotMessage | null>(null);
  const [testPhone, setTestPhone] = useState('+50761234567');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);

  // Form bot message
  const [msgName, setMsgName] = useState('');
  const [msgType, setMsgType] = useState<'text' | 'buttons' | 'list' | 'cta_url'>('text');
  const [msgHeader, setMsgHeader] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgFooter, setMsgFooter] = useState('');
  const [msgButtons, setMsgButtons] = useState<BotButton[]>([
    { id: 'b1', title: 'Opción 1' },
    { id: 'b2', title: 'Opción 2' },
  ]);
  const [msgListButtonText, setMsgListButtonText] = useState('Ver opciones');
  const [msgSections, setMsgSections] = useState<BotSection[]>([
    {
      title: 'Sección 1',
      rows: [
        { id: 'r1', title: 'Opción A', description: 'Descripción detallada de la opción A' },
      ],
    },
  ]);
  const [msgCtaText, setMsgCtaText] = useState('Visitar Web');
  const [msgCtaUrl, setMsgCtaUrl] = useState('https://ejemplo.com');
  const [msgNextMessageId, setMsgNextMessageId] = useState<string>('');
  const [msgAddTag, setMsgAddTag] = useState('');
  const [msgSetStage, setMsgSetStage] = useState('');

  // Form trigger
  const [triggerKeyword, setTriggerKeyword] = useState('');
  const [triggerMatchType, setTriggerMatchType] = useState<'exact' | 'contains'>('contains');
  const [triggerMsgId, setTriggerMsgId] = useState('');

  useEffect(() => {
    setBotMessages(getStoredBotMessages());
    setBotTriggers(getStoredBotTriggers());
  }, []);

  const handleOpenMsgModal = (msg?: BotMessage) => {
    if (msg) {
      setEditingMsgId(msg.id);
      setMsgName(msg.name);
      setMsgType(msg.type);
      setMsgHeader(msg.header || '');
      setMsgBody(msg.body);
      setMsgFooter(msg.footer || '');
      setMsgButtons(msg.buttons || []);
      setMsgListButtonText(msg.list_button_text || 'Ver opciones');
      setMsgSections(msg.sections || []);
      setMsgCtaText(msg.cta_text || '');
      setMsgCtaUrl(msg.cta_url || '');
      setMsgNextMessageId(msg.next_message_id || '');
      setMsgAddTag(msg.add_tag || '');
      setMsgSetStage(msg.set_stage || '');
    } else {
      setEditingMsgId(null);
      setMsgName('');
      setMsgType('text');
      setMsgHeader('');
      setMsgBody('');
      setMsgFooter('');
      setMsgButtons([{ id: 'b1', title: 'Botón 1' }]);
      setMsgListButtonText('Ver menú');
      setMsgSections([{ title: 'Sección 1', rows: [{ id: 'r1', title: 'Elemento 1', description: 'Descripción breve' }] }]);
      setMsgCtaText('Sitio Web');
      setMsgCtaUrl('https://');
      setMsgNextMessageId('');
      setMsgAddTag('');
      setMsgSetStage('');
    }
    setIsMsgModalOpen(true);
  };

  const handleDuplicateMessage = (msg: BotMessage) => {
    const duplicated: BotMessage = {
      ...msg,
      id: 'bm-' + Date.now(),
      name: `${msg.name} (Copia)`,
      created_at: new Date().toISOString(),
    };
    const updated = [...botMessages, duplicated];
    setBotMessages(updated);
    saveStoredBotMessages(updated);
  };

  const handleSaveMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const msgData: BotMessage = {
      id: editingMsgId || 'bm-' + Date.now(),
      name: msgName,
      type: msgType,
      header: msgHeader || null,
      body: msgBody,
      footer: msgFooter || null,
      buttons: msgType === 'buttons' ? msgButtons : undefined,
      list_button_text: msgType === 'list' ? msgListButtonText : undefined,
      sections: msgType === 'list' ? msgSections : undefined,
      cta_text: msgType === 'cta_url' ? msgCtaText : undefined,
      cta_url: msgType === 'cta_url' ? msgCtaUrl : undefined,
      next_message_id: msgNextMessageId || null,
      add_tag: msgAddTag || null,
      set_stage: msgSetStage || null,
      created_at: new Date().toISOString(),
    };

    let updated: BotMessage[];
    if (editingMsgId) {
      updated = botMessages.map((m) => (m.id === editingMsgId ? msgData : m));
    } else {
      updated = [...botMessages, msgData];
    }

    setBotMessages(updated);
    saveStoredBotMessages(updated);
    setIsMsgModalOpen(false);
  };

  const handleDeleteMessage = (id: string) => {
    if (confirm('¿Eliminar esta plantilla de bot?')) {
      const updated = botMessages.filter((m) => m.id !== id);
      setBotMessages(updated);
      saveStoredBotMessages(updated);
    }
  };

  const handleSaveTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    const newTrigger: BotTrigger = {
      id: 'bt-' + Date.now(),
      keyword: triggerKeyword.toLowerCase().trim(),
      match_type: triggerMatchType,
      bot_message_id: triggerMsgId || botMessages[0]?.id || '',
      active: true,
      created_at: new Date().toISOString(),
    };

    const updated = [...botTriggers, newTrigger];
    setBotTriggers(updated);
    saveStoredBotTriggers(updated);
    setIsTriggerModalOpen(false);
    setTriggerKeyword('');
  };

  const handleDeleteTrigger = (id: string) => {
    const updated = botTriggers.filter((t) => t.id !== id);
    setBotTriggers(updated);
    saveStoredBotTriggers(updated);
  };

  const handleSendTestMessage = async () => {
    if (!testMessageTarget) return;
    setTestSending(true);
    setTestResult(null);

    try {
      await sendWhatsApp({
        to: testPhone,
        type: testMessageTarget.type,
        body: testMessageTarget.body,
        header: testMessageTarget.header || undefined,
        footer: testMessageTarget.footer || undefined,
        buttons: testMessageTarget.buttons,
        listButtonText: testMessageTarget.list_button_text || undefined,
        sections: testMessageTarget.sections,
        ctaText: testMessageTarget.cta_text || undefined,
        ctaUrl: testMessageTarget.cta_url || undefined,
      });
      setTestResult('Mensaje de prueba enviado exitosamente.');
    } catch (err: any) {
      setTestResult('Error al enviar prueba: ' + err.message);
    } finally {
      setTestSending(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-950 p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Mensajes del Bot & Automatización</h1>
            <p className="text-xs text-slate-400 mt-1">
              Diseña respuestas interactivas, botones, listas y disparadores de palabras clave.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTabSub('messages')}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeTabSub === 'messages'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Plantillas de Bot ({botMessages.length})
            </button>
            <button
              onClick={() => setActiveTabSub('triggers')}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeTabSub === 'triggers'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Disparadores ({botTriggers.length})
            </button>
          </div>
        </div>

        {activeTabSub === 'messages' ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" /> Mensajes Configurados
              </h2>
              <button
                onClick={() => handleOpenMsgModal()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Nueva Plantilla de Bot
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {botMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-white truncate">{msg.name}</h3>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] rounded uppercase font-semibold">
                        {msg.type}
                      </span>
                    </div>

                    {/* WhatsApp Bubble Preview */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 mb-4 text-xs space-y-2">
                      {msg.header && <p className="font-semibold text-slate-200">{msg.header}</p>}
                      <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                      {msg.footer && <p className="text-[10px] text-slate-500">{msg.footer}</p>}

                      {msg.type === 'buttons' && msg.buttons && (
                        <div className="pt-2 space-y-1.5 border-t border-slate-900">
                          {msg.buttons.map((b, idx) => (
                            <div
                              key={idx}
                              className="w-full py-1.5 bg-emerald-600/15 text-emerald-400 text-center rounded-lg text-[11px] font-medium border border-emerald-500/30"
                            >
                              💬 {b.title}
                            </div>
                          ))}
                        </div>
                      )}

                      {msg.type === 'list' && (
                        <div className="pt-2 border-t border-slate-900">
                          <div className="w-full py-1.5 bg-slate-900 text-slate-300 text-center rounded-lg text-[11px] font-medium border border-slate-800">
                            📋 {msg.list_button_text || 'Ver opciones'}
                          </div>
                        </div>
                      )}

                      {msg.type === 'cta_url' && (
                        <div className="pt-2 border-t border-slate-900">
                          <div className="w-full py-1.5 bg-teal-600/15 text-teal-400 text-center rounded-lg text-[11px] font-medium border border-teal-500/30">
                            🌐 {msg.cta_text || 'Visitar enlace'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tags & Stage meta */}
                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 mb-3">
                      {msg.add_tag && (
                        <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded">
                          Etiqueta: <strong className="text-emerald-400">{msg.add_tag}</strong>
                        </span>
                      )}
                      {msg.set_stage && (
                        <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded">
                          Etapa: <strong className="text-emerald-400">{msg.set_stage}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setTestMessageTarget(msg);
                        setIsTestModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" /> Enviar prueba
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDuplicateMessage(msg)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                        title="Duplicar mensaje"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenMsgModal(msg)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                        title="Editar mensaje"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-1.5 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 rounded-lg transition-colors"
                        title="Eliminar mensaje"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" /> Disparadores por Palabras Clave
              </h2>
              <button
                onClick={() => setIsTriggerModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Nuevo Disparador
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {botTriggers.map((trigger) => {
                const targetMsg = botMessages.find((m) => m.id === trigger.bot_message_id);
                return (
                  <div
                    key={trigger.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-mono font-bold">
                          "{trigger.keyword}"
                        </span>
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded uppercase font-medium">
                          {trigger.match_type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Responde con:{' '}
                        <span className="text-white font-semibold">
                          {targetMsg ? targetMsg.name : 'Mensaje no encontrado'}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                      </span>
                      <button
                        onClick={() => handleDeleteTrigger(trigger.id)}
                        className="p-1.5 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar Mensaje con Validación de Caracteres */}
      {isMsgModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-bold text-sm">
                {editingMsgId ? 'Editar Plantilla de Bot' : 'Nueva Plantilla de Bot'}
              </h3>
              <button onClick={() => setIsMsgModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMessage} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nombre Interno</label>
                  <input
                    type="text"
                    required
                    value={msgName}
                    onChange={(e) => setMsgName(e.target.value)}
                    placeholder="Ej. Menú Principal"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Mensaje</label>
                  <select
                    value={msgType}
                    onChange={(e: any) => setMsgType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="text">Texto simple</option>
                    <option value="buttons">Botones de respuesta (máx. 3)</option>
                    <option value="list">Lista interactiva</option>
                    <option value="cta_url">Botón con enlace (CTA)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Encabezado (Opcional)</label>
                <input
                  type="text"
                  value={msgHeader}
                  onChange={(e) => setMsgHeader(e.target.value)}
                  placeholder="Ej. 🤖 Bienvenido"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Texto Principal (Body)</label>
                <textarea
                  required
                  rows={3}
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  placeholder="Escribe el mensaje que leerá el cliente..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Pie de página (Opcional)</label>
                <input
                  type="text"
                  value={msgFooter}
                  onChange={(e) => setMsgFooter(e.target.value)}
                  placeholder="Ej. Selecciona una opción"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Botones de respuesta */}
              {msgType === 'buttons' && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Botones (Máx. 3)</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (msgButtons.length < 3) {
                          setMsgButtons([...msgButtons, { id: 'b' + (msgButtons.length + 1), title: 'Nuevo Botón' }]);
                        }
                      }}
                      className="text-xs text-emerald-400 hover:underline"
                    >
                      + Añadir botón
                    </button>
                  </div>
                  {msgButtons.map((btn, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={20}
                        required
                        value={btn.title}
                        onChange={(e) => {
                          const updated = [...msgButtons];
                          updated[idx].title = e.target.value;
                          setMsgButtons(updated);
                        }}
                        placeholder="Título (máx. 20 car.)"
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs"
                      />
                      <span className={`text-[10px] ${btn.title.length > 20 ? 'text-rose-400' : 'text-slate-500'}`}>
                        {btn.title.length}/20
                      </span>
                      <button
                        type="button"
                        onClick={() => setMsgButtons(msgButtons.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Lista Interactiva */}
              {msgType === 'list' && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Texto del botón que abre la lista (máx. 20 car.)
                    </label>
                    <input
                      type="text"
                      maxLength={20}
                      value={msgListButtonText}
                      onChange={(e) => setMsgListButtonText(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs"
                    />
                    <span className="text-[10px] text-slate-500">{msgListButtonText.length}/20</span>
                  </div>

                  <p className="text-xs font-semibold text-white mt-2">Opciones y Secciones de la Lista</p>
                  {msgSections.map((sec, secIdx) => (
                    <div key={secIdx} className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                      <input
                        type="text"
                        value={sec.title}
                        onChange={(e) => {
                          const updated = [...msgSections];
                          updated[secIdx].title = e.target.value;
                          setMsgSections(updated);
                        }}
                        placeholder="Título de Sección"
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1 text-white text-xs font-semibold"
                      />
                      {sec.rows.map((row, rowIdx) => (
                        <div key={rowIdx} className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <div>
                            <input
                              type="text"
                              maxLength={24}
                              value={row.title}
                              onChange={(e) => {
                                const updated = [...msgSections];
                                updated[secIdx].rows[rowIdx].title = e.target.value;
                                setMsgSections(updated);
                              }}
                              placeholder="Título (máx. 24)"
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-white text-xs"
                            />
                            <span className="text-[9px] text-slate-500">{row.title.length}/24</span>
                          </div>
                          <div>
                            <input
                              type="text"
                              maxLength={72}
                              value={row.description || ''}
                              onChange={(e) => {
                                const updated = [...msgSections];
                                updated[secIdx].rows[rowIdx].description = e.target.value;
                                setMsgSections(updated);
                              }}
                              placeholder="Descripción (máx. 72)"
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-white text-xs"
                            />
                            <span className="text-[9px] text-slate-500">{(row.description || '').length}/72</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Botón con Enlace CTA */}
              {msgType === 'cta_url' && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Texto del Botón (máx. 20 car.)
                      </label>
                      <input
                        type="text"
                        maxLength={20}
                        value={msgCtaText}
                        onChange={(e) => setMsgCtaText(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs"
                      />
                      <span className="text-[10px] text-slate-500">{msgCtaText.length}/20</span>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">URL de Destino</label>
                      <input
                        type="url"
                        value={msgCtaUrl}
                        onChange={(e) => setMsgCtaUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Enviar a continuación (Encadenamiento) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Enviar a continuación (Encadenar siguiente mensaje opcional)
                </label>
                <select
                  value={msgNextMessageId}
                  onChange={(e) => setMsgNextMessageId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Ninguno (Fin de flujo)</option>
                  {botMessages
                    .filter((m) => m.id !== editingMsgId)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.type})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Añadir Etiqueta al Contacto</label>
                  <input
                    type="text"
                    value={msgAddTag}
                    onChange={(e) => setMsgAddTag(e.target.value)}
                    placeholder="Ej. Interesado"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Cambiar Etapa del Embudo</label>
                  <select
                    value={msgSetStage}
                    onChange={(e) => setMsgSetStage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Sin cambios</option>
                    <option value="Lead">Lead</option>
                    <option value="Contactado">Contactado</option>
                    <option value="Propuesta">Propuesta</option>
                    <option value="Negociación">Negociación</option>
                    <option value="Cerrado">Cerrado</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMsgModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium shadow-lg shadow-emerald-600/20"
                >
                  Guardar Plantilla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Trigger */}
      {isTriggerModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-bold text-sm">Nuevo Disparador por Palabra Clave</h3>
              <button onClick={() => setIsTriggerModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTrigger} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Palabra Clave</label>
                <input
                  type="text"
                  required
                  value={triggerKeyword}
                  onChange={(e) => setTriggerKeyword(e.target.value)}
                  placeholder="Ej. hola, precio, productos"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Coincidencia</label>
                <select
                  value={triggerMatchType}
                  onChange={(e: any) => setTriggerMatchType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="contains">Contiene la palabra</option>
                  <option value="exact">Coincidencia exacta</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Responde con Plantilla</label>
                <select
                  value={triggerMsgId}
                  onChange={(e) => setTriggerMsgId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  {botMessages.map((bm) => (
                    <option key={bm.id} value={bm.id}>
                      {bm.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTriggerModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium shadow-lg shadow-emerald-600/20"
                >
                  Guardar Disparador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Enviar Prueba a mi número */}
      {isTestModalOpen && testMessageTarget && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-sm">Enviar Prueba de Bot</h3>
              <button onClick={() => setIsTestModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Se enviará la plantilla <strong className="text-white">"{testMessageTarget.name}"</strong> a través de la WhatsApp Cloud API.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Número de Teléfono (con código de país)</label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+50761234567"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              {testResult && (
                <div className={`p-3 rounded-xl text-xs ${testResult.includes('exitosamente') ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'}`}>
                  {testResult}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  disabled={testSending}
                  onClick={handleSendTestMessage}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium shadow-lg shadow-emerald-600/25 flex items-center gap-2"
                >
                  {testSending ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Enviar Prueba
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
