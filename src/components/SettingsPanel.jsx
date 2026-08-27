import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { LANGUAGES } from '../data/i18n';
import { playClick, playChime } from '../lib/soundFx';

/**
 * Pro Camera & Sensory Tuning Studio.
 * Replaces basic toggle with an elite calibration center:
 * - Camera HUD Grid Overlays (None, Rule of Thirds, Crosshairs, Gesture Target Box)
 * - Tracking Sensitivity & Smoothing Slider
 * - Sensory Profiles (Vibrant, Gentle Calming, Focus, High Contrast)
 * - Web Audio Sound FX Volume & Chimes
 * - Language Switcher
 */
export default function SettingsPanel() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'sensory' | 'lang'

  const {
    cameraGrid,
    setCameraGrid,
    cameraSensitivity,
    setCameraSensitivity,
    sensoryProfile,
    setSensoryProfile,
    soundFxEnabled,
    setSoundFxEnabled,
    soundFxVolume,
    setSoundFxVolume,
    language,
    setLanguage,
  } = useGameStore();

  const handleToggleOpen = () => {
    playClick(0.5);
    setOpen((v) => !v);
  };

  const handleGridChange = (mode) => {
    playChime(1.1, 0.4);
    setCameraGrid(mode);
  };

  const handleSensoryChange = (profile) => {
    playChime(1.2, 0.4);
    setSensoryProfile(profile);
  };

  return (
    <>
      <button
        className={`settings-fab ${open ? 'active' : ''}`}
        onClick={handleToggleOpen}
        aria-label="Studio Settings & Camera Calibration"
        title="Pro Camera & Sensory Studio"
      >
        ⚙️
      </button>

      {open && (
        <div className="pro-studio-panel">
          {/* Studio Header */}
          <div className="studio-header">
            <div className="studio-title">
              <span className="studio-icon">✨</span>
              <span>Pro Studio & Calibration</span>
            </div>
            <button
              className="studio-close"
              onClick={() => setOpen(false)}
              aria-label="Close settings"
            >
              ✕
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="studio-tabs">
            <button
              className={`studio-tab-btn ${activeTab === 'camera' ? 'active' : ''}`}
              onClick={() => {
                playClick(0.3);
                setActiveTab('camera');
              }}
            >
              📷 Camera HUD
            </button>
            <button
              className={`studio-tab-btn ${activeTab === 'sensory' ? 'active' : ''}`}
              onClick={() => {
                playClick(0.3);
                setActiveTab('sensory');
              }}
            >
              🧘 Sensory & Audio
            </button>
            <button
              className={`studio-tab-btn ${activeTab === 'lang' ? 'active' : ''}`}
              onClick={() => {
                playClick(0.3);
                setActiveTab('lang');
              }}
            >
              🌐 Language
            </button>
          </div>

          {/* Tab 1: Camera HUD & Tracking Grids */}
          {activeTab === 'camera' && (
            <div className="studio-section">
              <div className="studio-field-label">
                <span>🎯 Camera Grid Overlay</span>
                <small>Assists hand framing & targeting</small>
              </div>
              <div className="studio-grid-options">
                {[
                  { id: 'none', label: 'None', desc: 'Clean video' },
                  { id: 'thirds', label: '3x3 Thirds', desc: 'Rule of thirds' },
                  { id: 'crosshair', label: 'Crosshairs', desc: 'Kinematic axis' },
                  { id: 'box', label: 'Target Box', desc: 'Interaction zone' },
                ].map((item) => (
                  <button
                    key={item.id}
                    className={`studio-pill-btn ${cameraGrid === item.id ? 'active' : ''}`}
                    onClick={() => handleGridChange(item.id)}
                  >
                    <strong>{item.label}</strong>
                    <span>{item.desc}</span>
                  </button>
                ))}
              </div>

              <div className="studio-field-label" style={{ marginTop: 18 }}>
                <span>⚡ Tracking Sensitivity ({Math.round(cameraSensitivity * 100)}%)</span>
                <small>Higher = faster response, Lower = ultra smooth</small>
              </div>
              <input
                type="range"
                min="0.15"
                max="0.75"
                step="0.05"
                value={cameraSensitivity}
                onChange={(e) => setCameraSensitivity(parseFloat(e.target.value))}
                className="studio-slider"
              />
              <div className="slider-ticks">
                <span>Smooth</span>
                <span>Balanced</span>
                <span>Fast</span>
              </div>
            </div>
          )}

          {/* Tab 2: Sensory Profiles & Sound FX */}
          {activeTab === 'sensory' && (
            <div className="studio-section">
              <div className="studio-field-label">
                <span>🌈 Visual Comfort Profile</span>
                <small>Tailored for sensory comfort & focus</small>
              </div>
              <div className="studio-grid-options">
                {[
                  { id: 'vibrant', label: '🌟 Celestial', desc: 'Full glow & stars' },
                  { id: 'gentle', label: '🧘 Gentle Calm', desc: 'Reduced motion & sound' },
                  { id: 'focus', label: '🎯 High Focus', desc: 'Minimal distractions' },
                  { id: 'contrast', label: '👁️ High Contrast', desc: 'WCAG AAA clarity' },
                ].map((item) => (
                  <button
                    key={item.id}
                    className={`studio-pill-btn ${sensoryProfile === item.id ? 'active' : ''}`}
                    onClick={() => handleSensoryChange(item.id)}
                  >
                    <strong>{item.label}</strong>
                    <span>{item.desc}</span>
                  </button>
                ))}
              </div>

              <div className="studio-field-label" style={{ marginTop: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🔊 Procedural Sound Synthesis</span>
                  <button
                    className={`toggle ${soundFxEnabled ? 'on' : ''}`}
                    onClick={() => {
                      playClick(0.4);
                      setSoundFxEnabled(!soundFxEnabled);
                    }}
                  >
                    <span className="knob" />
                  </button>
                </div>
                <small>Celestial chimes & tactile button clicks</small>
              </div>

              {soundFxEnabled && (
                <div style={{ marginTop: 10 }}>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={soundFxVolume}
                    onChange={(e) => {
                      const vol = parseFloat(e.target.value);
                      setSoundFxVolume(vol);
                      playChime(1.0, vol);
                    }}
                    className="studio-slider"
                  />
                  <div className="slider-ticks">
                    <span>Quiet</span>
                    <span>50%</span>
                    <span>Max</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Language */}
          {activeTab === 'lang' && (
            <div className="studio-section">
              <div className="studio-field-label">
                <span>🌐 Interface Language</span>
                <small>Select preferred reading & voice dialect</small>
              </div>
              <div className="lang-row" style={{ marginTop: 10 }}>
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    className={`lang-btn ${language === l.code ? 'active' : ''}`}
                    onClick={() => {
                      playChime(1.25, 0.4);
                      setLanguage(l.code);
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
