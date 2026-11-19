import React from 'react';
import { MessageSquare, Users, GitFork, Bot, Megaphone, Settings, LogOut, PhoneCall } from 'lucide-react';
import { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userEmail: string;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userEmail,
  onLogout,
}) => {
  const navItems = [
    { id: 'inbox' as ActiveTab, label: 'Bandeja', icon: MessageSquare, badge: '3' },
    { id: 'contacts' as ActiveTab, label: 'Contactos', icon: Users },
    { id: 'funnel' as ActiveTab, label: 'Embudo', icon: GitFork },
    { id: 'bot' as ActiveTab, label: 'Mensajes del bot', icon: Bot },
    { id: 'campaigns' as ActiveTab, label: 'Campañas', icon: Megaphone },
    { id: 'settings' as ActiveTab, label: 'Ajustes', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
          <PhoneCall className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold text-white text-sm tracking-tight">CRM WhatsApp</h2>
          <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Meta API Conectada
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-semibold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-semibold text-xs shrink-0">
              {userEmail ? userEmail.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{userEmail}</p>
              <p className="text-[10px] text-slate-500">Agente Principal</p>
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full py-2 bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 border border-transparent text-slate-300 text-xs rounded-lg font-medium transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-3.5 h-3.5" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};
