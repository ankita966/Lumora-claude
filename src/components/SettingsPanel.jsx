import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { LANGUAGES } from '../data/i18n';

export default function SettingsPanel() {
  const [open, setOpen] = useState(false);
  const { calmMode, toggleCalm, language, setLanguage } = useGameStore();

  return (
    <>
      <button className="settings-fab" onClick={() => setOpen((v) => !v)} aria-label="Settings">
        ⚙️
      </button>
      {open && (
        <div className="settings-panel">
          <div className="settings-row">
            <span>🧘 Calm Mode</span>
            <button className={`toggle ${calmMode ? 'on' : ''}`} onClick={toggleCalm}>
              <span className="knob" />
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 14, lineHeight: 1.4 }}>
            Softer motion, quieter effects, bigger buttons, slower pacing.
          </div>
          <div className="settings-row" style={{ display: 'block' }}>
            <span style={{ display: 'block', marginBottom: 8 }}>🌐 Language</span>
            <div className="lang-row">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  className={`lang-btn ${language === l.code ? 'active' : ''}`}
                  onClick={() => setLanguage(l.code)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
