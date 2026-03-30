/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Settings from './components/Settings';
import Dashboard from './components/Dashboard';
import FakeScreen from './components/FakeScreen';

export default function App() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('jialeme_settings');
    return saved ? JSON.parse(saved) : null;
  });
  const [isEditing, setIsEditing] = useState(!settings);
  const [showFakeScreen, setShowFakeScreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle fake screen on Esc
      if (e.key === 'Escape') {
        setShowFakeScreen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSaveSettings = (newSettings: any) => {
    setSettings(newSettings);
    localStorage.setItem('jialeme_settings', JSON.stringify(newSettings));
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-emerald-50 text-emerald-900 font-sans selection:bg-emerald-200">
      {showFakeScreen && <FakeScreen onClose={() => setShowFakeScreen(false)} />}
      
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
