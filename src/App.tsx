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
  const [isEditing, setIsEditing] = useState(!settings);

  const handleSaveSettings = (newSettings: any) => {
    setSettings(newSettings);
    localStorage.setItem('jialeme_settings', JSON.stringify(newSettings));
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-emerald-50 text-emerald-900 font-sans selection:bg-emerald-200">
      {!isEditing && settings ? (
        <Dashboard settings={settings} onEditSettings={() => setIsEditing(true)} />
      ) : (
        <Settings 
          onSave={handleSaveSettings} 
          initialSettings={settings} 
          onCancel={settings ? () => setIsEditing(false) : undefined}
        />
      )}
    </div>
  );
}
