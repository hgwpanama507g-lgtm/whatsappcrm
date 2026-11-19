import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Tag, Phone, Calendar, Trash2, Edit, X, Download, FileText } from 'lucide-react';
import { Contact } from '../types';
import { getStoredContacts, saveStoredContacts } from '../lib/mockStore';

export const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState('Todos');
  const [selectedTagFilter, setSelectedTagFilter] = useState('Todas');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [stage, setStage] = useState('Nuevo');
  const [tagInput, setTagInput] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setContacts(getStoredContacts());
  }, []);

  const handleOpenModal = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      setName(contact.name || '');
      setPhone(contact.phone);
      setStage(contact.stage || 'Nuevo');
      setTagInput(contact.tags.join(', '));
      setNotes(contact.notes || '');
    } else {
      setEditingContact(null);
      setName('');
      setPhone('+507 ');
      setStage('Nuevo');
      setTagInput('Nuevo');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    const tagsArray = tagInput.split(',').map((t) => t.trim()).filter(Boolean);

    let updatedContacts: Contact[];
    if (editingContact) {
      updatedContacts = contacts.map((c) => 
        c.id === editingContact.id 
          ? { ...c, name, phone, stage, tags: tagsArray, notes } 
          : c
      );
    } else {
      const newContact: Contact = {
        id: 'c-' + Date.now(),
        name,
        phone,
        stage,
        tags: tagsArray,
        notes,
        bot_paused: false,
        opt_in: true,
        created_at: new Date().toISOString(),
        last_message_at: null,
      };
      updatedContacts = [newContact, ...contacts];
    }

    setContacts(updatedContacts);
    saveStoredContacts(updatedContacts);
    setIsModalOpen(false);
  };

  const handleDeleteContact = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este contacto?')) {
      const updated = contacts.filter((c) => c.id !== id);
      setContacts(updated);
      saveStoredContacts(updated);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Nombre', 'Teléfono', 'Etapa', 'Etiquetas', 'Notas', 'Registro'];
    const rows = filteredContacts.map((c) => [
      c.id,
      `"${c.name || ''}"`,
      `"${c.phone}"`,
      `"${c.stage}"`,
      `"${c.tags.join(';')}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
      `"${c.created_at}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `contactos_whatsapp_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allTags = Array.from(new Set(contacts.flatMap((c) => c.tags)));
  const stages = ['Todos', 'Nuevo', 'Interesado', 'Cotizando', 'Cliente', 'Seguimiento'];

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch = 
      (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.phone.includes(searchTerm) ||
      (c.notes && c.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStage = selectedStageFilter === 'Todos' || c.stage === selectedStageFilter;
    const matchesTag = selectedTagFilter === 'Todas' || c.tags.includes(selectedTagFilter);
    return matchesSearch && matchesStage && matchesTag;
  });

  return (
    <div className="flex-1 bg-slate-950 p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Gestión de Contactos</h1>
            <p className="text-xs text-slate-400 mt-1">
              Administra tu base de datos de clientes, etiquetas, notas y exporta a CSV.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-medium transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              Exportar CSV
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Contacto
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, teléfono o notas..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedStageFilter}
              onChange={(e) => setSelectedStageFilter(e.target.value)}
              className="bg-slate-900 text-slate-300 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none"
            >
              <option value="Todos">Etapa: Todas</option>
              {stages.filter(s => s !== 'Todos').map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            <select
              value={selectedTagFilter}
              onChange={(e) => setSelectedTagFilter(e.target.value)}
              className="bg-slate-900 text-slate-300 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none"
            >
              <option value="Todas">Etiqueta: Todas</option>
              {allTags.map(tg => (
                <option key={tg} value={tg}>{tg}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Contacto</th>
                  <th className="py-3.5 px-6">Teléfono WhatsApp</th>
                  <th className="py-3.5 px-6">Etapa</th>
                  <th className="py-3.5 px-6">Etiquetas</th>
                  <th className="py-3.5 px-6">Notas</th>
                  <th className="py-3.5 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                {filteredContacts.length > 0 ? (
                  filteredContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-medium text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold">
                          {contact.name ? contact.name.charAt(0).toUpperCase() : 'W'}
                        </div>
                        {contact.name || 'Sin nombre'}
                      </td>
                      <td className="py-4 px-6 text-slate-300 font-mono">
                        {contact.phone}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg font-medium text-[11px]">
                          {contact.stage}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {contact.tags.map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded-md">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-400 max-w-xs truncate">
                        {contact.notes || <span className="text-slate-600 italic">Sin notas</span>}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(contact)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                            title="Editar contacto"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteContact(contact.id)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 rounded-lg transition-colors"
                            title="Eliminar contacto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No se encontraron contactos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Crear / Editar Contacto */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-bold text-sm">
                {editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Carlos Mendoza"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Teléfono WhatsApp</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej. +50761234567"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Etapa del Embudo</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="Nuevo">Nuevo</option>
                  <option value="Interesado">Interesado</option>
                  <option value="Cotizando">Cotizando</option>
                  <option value="Cliente">Cliente</option>
                  <option value="Seguimiento">Seguimiento</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Etiquetas (separadas por coma)</label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="VIP, Interesado, Software"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Notas Internas</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas sobre el cliente..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-emerald-500 resize-none"
                />
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium shadow-lg shadow-emerald-600/20"
                >
                  Guardar Contacto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
