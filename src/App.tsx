/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActiveTab } from './types';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { Inbox } from './components/Inbox';
import { Contacts } from './components/Contacts';
import { Funnel } from './components/Funnel';
import { BotBuilder } from './components/BotBuilder';
import { Campaigns } from './components/Campaigns';
import { Settings } from './components/Settings';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('inbox');

  useEffect(() => {
    const savedUser = localStorage.getItem('crm_user_email');
    if (savedUser) {
      setUserEmail(savedUser);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = (email: string) => {
    setUserEmail(email);
    setIsLoggedIn(true);
    localStorage.setItem('crm_user_email', email);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail('');
    localStorage.removeItem('crm_user_email');
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-100 antialiased overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userEmail={userEmail}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {activeTab === 'inbox' && <Inbox />}
        {activeTab === 'contacts' && <Contacts />}
        {activeTab === 'funnel' && <Funnel />}
        {activeTab === 'bot' && <BotBuilder />}
        {activeTab === 'campaigns' && <Campaigns />}
        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
  );
}
