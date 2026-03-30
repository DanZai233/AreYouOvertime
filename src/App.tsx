/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import Settings from './components/Settings';
import Dashboard from './components/Dashboard';

export default function App() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('jialeme_settings');
    return saved ? JSON.parse(saved) : null;
  });

  const handleSaveSettings = (newSettings: any) => {
    setSettings(newSettings);
    localStorage.setItem('jialeme_settings', JSON.stringify(newSettings));
  };

  return (
    <div className="min-h-screen bg-emerald-50 text-emerald-900 font-sans selection:bg-emerald-200">
      {settings ? (
        <Dashboard settings={settings} onEditSettings={() => setSettings(null)} />
      ) : (
        <Settings onSave={handleSaveSettings} initialSettings={settings} />
      )}
    </div>
  );
}
