import React, { useState, useEffect } from 'react';
import { GitFork, Phone, ArrowRight, Tag, MoreHorizontal, GripVertical } from 'lucide-react';
import { Contact } from '../types';
import { getStoredContacts, saveStoredContacts } from '../lib/mockStore';

export const Funnel: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [draggedContactId, setDraggedContactId] = useState<string | null>(null);

  useEffect(() => {
    setContacts(getStoredContacts());
  }, []);

  const stages = ['Nuevo', 'Interesado', 'Cotizando', 'Cliente', 'Seguimiento'];

  const handleMoveStage = (contactId: string, newStage: string) => {
    const updated = contacts.map((c) => 
      c.id === contactId ? { ...c, stage: newStage } : c
    );
    setContacts(updated);
    saveStoredContacts(updated);
  };

  const handleDragStart = (e: React.DragEvent, contactId: string) => {
    setDraggedContactId(contactId);
    e.dataTransfer.setData('text/plain', contactId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    if (!draggedContactId) return;
    handleMoveStage(draggedContactId, targetStage);
    setDraggedContactId(null);
  };

  return (
    <div className="flex-1 bg-slate-950 p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white tracking-tight">Embudo de Ventas (Kanban)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Arrastra las tarjetas de contacto entre columnas para actualizar su etapa en tiempo real.
          </p>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
          {stages.map((stage) => {
            const stageContacts = contacts.filter((c) => (c.stage || 'Nuevo') === stage);
            return (
              <div
                key={stage}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col min-h-[550px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">{stage}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 bg-slate-800 text-emerald-400 rounded-full text-xs font-bold shadow-sm">
                    {stageContacts.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 space-y-3">
                  {stageContacts.map((contact) => (
                    <div
                      key={contact.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, contact.id)}
                      className="bg-slate-950 border border-slate-800/85 hover:border-emerald-500/50 rounded-xl p-3.5 transition-all shadow-md cursor-grab active:cursor-grabbing group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 shrink-0" />
                          <h4 className="text-xs font-semibold text-white truncate">
                            {contact.name || contact.phone}
                          </h4>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 font-mono mb-2.5 pl-5">
                        {contact.phone}
                      </p>

                      <div className="flex flex-wrap gap-1 mb-3 pl-5">
                        {contact.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 bg-slate-900 text-slate-400 text-[9px] rounded font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {contact.notes && (
                        <p className="text-[10px] text-slate-500 bg-slate-900/60 p-2 rounded-lg mb-3 pl-5 truncate">
                          📝 {contact.notes}
                        </p>
                      )}

                      {/* Quick stage selector */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[10px] text-slate-400 pl-5">
                        <span>{new Date(contact.created_at).toLocaleDateString()}</span>
                        <select
                          value={contact.stage}
                          onChange={(e) => handleMoveStage(contact.id, e.target.value)}
                          className="bg-slate-900 text-emerald-400 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] font-medium focus:outline-none"
                        >
                          {stages.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  {stageContacts.length === 0 && (
                    <div className="h-40 flex items-center justify-center text-slate-600 text-xs italic border border-dashed border-slate-800/60 rounded-xl">
                      Arrastra contactos aquí
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
