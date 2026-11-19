import React, { useState, useEffect } from 'react';
import { 
  Send, Search, Bot, UserCheck, Paperclip, Phone, CheckCheck, 
  PauseCircle, PlayCircle, MoreVertical, Tag as TagIcon, X, Plus, 
  AlertTriangle, ArrowLeft, Zap, Sparkles 
} from 'lucide-react';
import { Contact, Message, BotMessage } from '../types';
import { 
  getStoredContacts, 
  saveStoredContacts, 
  getStoredMessages, 
  saveStoredMessages, 
  getStoredBotMessages 
} from '../lib/mockStore';
import { sendWhatsApp } from '../lib/whatsapp';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const Inbox: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [botMessages, setBotMessages] = useState<BotMessage[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState('Todos');
  const [selectedTagFilter, setSelectedTagFilter] = useState('Todas');
  
  // Mobile view state
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // Quick replies / Bot templates modal
  const [showBotSelector, setShowBotSelector] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagModal, setShowTagModal] = useState(false);

  useEffect(() => {
    const loadedContacts = getStoredContacts();
    const loadedMessages = getStoredMessages();
    const loadedBots = getStoredBotMessages();

    // Ordenar por último mensaje
    loadedContacts.sort((a, b) => {
      const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : new Date(a.created_at).getTime();
      const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : new Date(b.created_at).getTime();
      return timeB - timeA;
    });

    setContacts(loadedContacts);
    setMessages(loadedMessages);
    setBotMessages(loadedBots);

    if (loadedContacts.length > 0 && !selectedContactId) {
      setSelectedContactId(loadedContacts[0].id);
    }

    // Configurar Supabase Realtime si está configurado
    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel('public:messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
        })
        .subscribe();

      return () => {
        if (supabase) {
          supabase.removeChannel(channel);
        }
      };
    }
  }, []);

  const selectedContact = contacts.find((c) => c.id === selectedContactId);
  const contactMessages = messages.filter((m) => m.contact_id === selectedContactId);

  // Verificar si han pasado más de 24 horas desde el último mensaje del cliente
  const isOutside24Hours = () => {
    if (!selectedContact || !selectedContact.last_message_at) return false;
    const lastMsgTime = new Date(selectedContact.last_message_at).getTime();
    const now = Date.now();
    const diffHours = (now - lastMsgTime) / (1000 * 60 * 60);
    return diffHours > 24;
  };

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || inputText;
    if (!textToSend.trim() || !selectedContactId) return;

    const nowIso = new Date().toISOString();
    const newMsg: Message = {
      id: 'm-' + Date.now(),
      contact_id: selectedContactId,
      direction: 'out',
      type: 'text',
      body: textToSend.trim(),
      status: 'sent',
      created_at: nowIso,
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    saveStoredMessages(updatedMessages);

    // Actualizar last_message_at y reordenar contactos
    const updatedContacts = contacts.map((c) => 
      c.id === selectedContactId ? { ...c, last_message_at: nowIso } : c
    );
    updatedContacts.sort((a, b) => {
      const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : new Date(a.created_at).getTime();
      const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : new Date(b.created_at).getTime();
      return timeB - timeA;
    });
    setContacts(updatedContacts);
    saveStoredContacts(updatedContacts);

    if (!customText) {
      setInputText('');
    }

    try {
      await sendWhatsApp({
        to: selectedContact?.phone || '',
        body: textToSend.trim(),
      });
    } catch (err) {
      console.error('Error enviando mensaje WhatsApp:', err);
    }
  };

  const handleSendBotTemplateAsQuickReply = async (botMsg: BotMessage) => {
    if (!selectedContact) return;
    setShowBotSelector(false);

    await handleSendMessage(undefined, botMsg.body);
  };

  const toggleBotPause = () => {
    if (!selectedContactId) return;
    const updated = contacts.map((c) => 
      c.id === selectedContactId ? { ...c, bot_paused: !c.bot_paused } : c
    );
    setContacts(updated);
    saveStoredContacts(updated);
  };

  const handleStageChange = (newStage: string) => {
    if (!selectedContactId) return;
    const updated = contacts.map((c) => 
      c.id === selectedContactId ? { ...c, stage: newStage } : c
    );
    setContacts(updated);
    saveStoredContacts(updated);
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim() || !selectedContactId) return;
    const tag = newTagInput.trim();

    const updated = contacts.map((c) => {
      if (c.id === selectedContactId && !c.tags.includes(tag)) {
        return { ...c, tags: [...c.tags, tag] };
      }
      return c;
    });

    setContacts(updated);
    saveStoredContacts(updated);
    setNewTagInput('');
    setShowTagModal(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!selectedContactId) return;
    const updated = contacts.map((c) => {
      if (c.id === selectedContactId) {
        return { ...c, tags: c.tags.filter((t) => t !== tagToRemove) };
      }
      return c;
    });

    setContacts(updated);
    saveStoredContacts(updated);
  };

  // Obtener todas las etiquetas únicas para el filtro
  const allTags = Array.from(new Set(contacts.flatMap((c) => c.tags)));
  const stages = ['Todos', 'Lead', 'Contactado', 'Propuesta', 'Negociación', 'Cerrado'];

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch = 
      (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.phone.includes(searchTerm);
    const matchesStage = selectedStageFilter === 'Todos' || c.stage === selectedStageFilter;
    const matchesTag = selectedTagFilter === 'Todas' || c.tags.includes(selectedTagFilter);
    return matchesSearch && matchesStage && matchesTag;
  });

  return (
    <div className="flex-1 flex bg-slate-950 overflow-hidden relative">
      {/* Contact List Sidebar */}
      <div className={`w-full md:w-80 border-r border-slate-800 flex flex-col bg-slate-900/50 shrink-0 ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-white font-bold text-sm mb-3">Bandeja de Chats</h2>
          
          <div className="relative mb-3">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o teléfono..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <select
              value={selectedStageFilter}
              onChange={(e) => setSelectedStageFilter(e.target.value)}
              className="bg-slate-950 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] focus:outline-none"
            >
              <option value="Todos">Etapa: Todas</option>
              {stages.filter(s => s !== 'Todos').map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            <select
              value={selectedTagFilter}
              onChange={(e) => setSelectedTagFilter(e.target.value)}
              className="bg-slate-950 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] focus:outline-none"
            >
              <option value="Todas">Etiqueta: Todas</option>
              {allTags.map(tg => (
                <option key={tg} value={tg}>{tg}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {filteredContacts.map((contact) => {
            const isSelected = contact.id === selectedContactId;
            const lastMsg = messages
              .filter((m) => m.contact_id === contact.id)
              .slice(-1)[0];

            return (
              <div
                key={contact.id}
                onClick={() => {
                  setSelectedContactId(contact.id);
                  setMobileShowChat(true);
                }}
                className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                  isSelected ? 'bg-emerald-600/15 border-l-4 border-emerald-500' : 'hover:bg-slate-800/40'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs shrink-0">
                  {contact.name ? contact.name.charAt(0).toUpperCase() : 'W'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-semibold text-white truncate">
                      {contact.name || contact.phone}
                    </h3>
                    <span className="text-[10px] text-slate-500">
                      {contact.last_message_at ? new Date(contact.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mb-1.5">
                    {lastMsg ? lastMsg.body : 'Sin mensajes recientes'}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 bg-slate-800 text-emerald-400 text-[10px] rounded-md font-medium">
                      {contact.stage}
                    </span>
                    {contact.tags.slice(0, 2).map((t, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-slate-950 text-slate-400 text-[9px] rounded">
                        {t}
                      </span>
                    ))}
                    {contact.bot_paused && (
                      <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] rounded-md flex items-center gap-1">
                        <Bot className="w-3 h-3" /> Pausado
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Thread Area */}
      <div className={`flex-1 flex flex-col bg-slate-950 ${mobileShowChat ? 'flex' : 'hidden md:flex'}`}>
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="px-4 md:px-6 py-3.5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileShowChat(false)}
                  className="md:hidden p-1 text-slate-400 hover:text-white mr-1"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                  {selectedContact.name ? selectedContact.name.charAt(0).toUpperCase() : 'W'}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-xs md:text-sm">
                    {selectedContact.name || selectedContact.phone}
                  </h3>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-emerald-400" /> {selectedContact.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                {/* Stage selector */}
                <select
                  value={selectedContact.stage}
                  onChange={(e) => handleStageChange(e.target.value)}
                  className="bg-slate-950 text-emerald-400 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none"
                >
                  {stages.filter(s => s !== 'Todos').map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>

                {/* Bot Pause Switch */}
                <button
                  onClick={toggleBotPause}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    selectedContact.bot_paused
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {selectedContact.bot_paused ? (
                    <>
                      <PlayCircle className="w-4 h-4 text-emerald-400" /> <span className="hidden sm:inline">Reanudar Bot</span>
                    </>
                  ) : (
                    <>
                      <PauseCircle className="w-4 h-4 text-amber-400" /> <span className="hidden sm:inline">Pausar Bot</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Tags Bar */}
            <div className="px-4 py-2 bg-slate-900/30 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <TagIcon className="w-3 h-3" /> Etiquetas:
              </span>
              {selectedContact.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-200 text-[10px] rounded-lg flex items-center gap-1.5 font-medium"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-slate-400 hover:text-rose-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                onClick={() => setShowTagModal(true)}
                className="px-2 py-0.5 bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600/25 rounded-lg text-[10px] font-medium flex items-center gap-1 border border-emerald-500/30"
              >
                <Plus className="w-3 h-3" /> Añadir etiqueta
              </button>
            </div>

            {/* 24-Hour Window Warning Banner */}
            {isOutside24Hours() && (
              <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 flex items-center gap-2 text-amber-300 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Han pasado más de 24 horas desde el último mensaje del cliente. WhatsApp solo permite enviar plantillas aprobadas.
                </span>
              </div>
            )}

            {/* Messages List */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
              {contactMessages.map((msg) => {
                const isOut = msg.direction === 'out';
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-md px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                        isOut
                          ? 'bg-emerald-600 text-white rounded-br-xs shadow-md shadow-emerald-600/15'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-xs'
                      }`}
                    >
                      <p>{msg.body}</p>
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                          isOut ? 'text-emerald-200' : 'text-slate-500'
                        }`}
                      >
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isOut && <CheckCheck className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bot Quick Reply Selector Modal / Drawer */}
            {showBotSelector && (
              <div className="p-3 bg-slate-900 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Seleccionar Mensaje del Bot (Respuesta Rápida)
                  </span>
                  <button onClick={() => setShowBotSelector(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {botMessages.map((bm) => (
                    <button
                      key={bm.id}
                      onClick={() => handleSendBotTemplateAsQuickReply(bm)}
                      className="p-2.5 bg-slate-950 hover:bg-emerald-600/15 border border-slate-800 hover:border-emerald-500/30 rounded-xl text-left transition-all group"
                    >
                      <div className="font-semibold text-white text-xs group-hover:text-emerald-400 truncate">
                        {bm.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{bm.body}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setShowBotSelector(!showBotSelector)}
                  className="px-3 py-1 bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600/25 border border-emerald-500/30 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" /> Mensajes del Bot (Respuestas Rápidas)
                </button>
              </div>

              <form onSubmit={(e) => handleSendMessage(e)} className="flex items-center gap-3">
                <button
                  type="button"
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition-colors"
                  title="Adjuntar archivo"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Escribe un mensaje por WhatsApp..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Enviar
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
            Selecciona un chat de la lista
          </div>
        )}
      </div>

      {/* Modal Añadir Etiqueta */}
      {showTagModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-sm">Añadir Etiqueta</h3>
              <button onClick={() => setShowTagModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTag} className="space-y-4">
              <input
                type="text"
                required
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                placeholder="Ej. VIP, Cerrado, Soporte"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTagModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium"
                >
                  Añadir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
