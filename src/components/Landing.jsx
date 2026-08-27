import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { AVATARS, WORLDS, WORLD_ORDER } from '../data/worlds';
import { t } from '../data/i18n';
import HandCursorLayer from './HandCursorLayer';
import { useCursor } from '../hooks/useCursor';
import { useAuth } from '../auth/AuthProvider';
import { authorizedPortal } from '../auth/roleRouting';
import { playClick, playChime, playCoin, playSwoosh } from '../lib/soundFx';

export default function Landing() {
  const {
    setScreen,
    setAuthMode,
    setAuthPortal,
    language,
    handConnected,
    xp,
    worldsCompleted,
  } = useGameStore();

  const { configured, user, roles, displayName, signOut } = useAuth();
  const landingRef = useRef(null);
  const transitionRef = useRef(null);
  const cursor = useCursor(landingRef, true);
  const [entering, setEntering] = useState(false);
  const [activeTab, setActiveTab] = useState('heroes');
  const [selectedHero, setSelectedHero] = useState('Kai');

  useEffect(() => () => window.clearTimeout(transitionRef.current), []);

  const enterWorld = useCallback(
    (worldKey = null) => {
      if (entering) return;
      setEntering(true);
      playClick(0.6);
      playCoin(0.7);
      const destination = configured && user ? worldKey || authorizedPortal(roles)?.destination : null;
      transitionRef.current = window.setTimeout(
        () => setScreen(user ? destination || 'map' : 'auth', worldKey),
        260
      );
    },
    [configured, entering, roles, setScreen, user]
  );

  const login = () => {
    playClick(0.5);
    setAuthPortal(null);
    setAuthMode('login');
    setScreen('auth');
  };

  const createAccount = () => {
    playClick(0.5);
    setAuthPortal(null);
    setAuthMode('signup');
    setScreen('portalChoice');
  };

  return (
    <div className={`ref-tamagotchi-canvas ${entering ? 'ref-entering' : ''}`} ref={landingRef}>
      {/* Hand Gesture Air Tracking Overlay */}
      <HandCursorLayer
        videoRef={cursor.videoRef}
        pixel={cursor.pixel}
        cameraStatus={cursor.cameraStatus}
        handDetected={cursor.handDetected}
        gesture={cursor.gesture}
        gestureLabel={cursor.gestureLabel}
        pinching={cursor.pinching}
        interacting={cursor.pinching}
        color="#38B6FF"
        showMirror
        showCursor
      />

      {/* =========================================================================
          TOP SECTION: PHOTOREALISTIC BLUE SKY + CUMULUS CLOUDS
          ========================================================================= */}
      <section className="ref-top-sky-section">
        {/* Giant Pixel Headline with Amber Tagline Box (Exact Reference Alignment) */}
        <div className="ref-giant-title-container">
          <h1 className="ref-title-pixel-text">
            LUMORA
          </h1>

          {/* Embedded Amber Subtitle Tagline Box (Exact match to reference) */}
          <div className="ref-amber-badge-box">
            <span>Your pixel AI companion, your spatial quest, your learning universe.</span>
            <span>Empowering unique minds with spatial vision, voice & touch.</span>
          </div>
        </div>

        {/* Floating Center Pixel Pet (Exact Tamagotchi mascot from reference) */}
        <div
          className="ref-center-pet-wrapper"
          onClick={() => {
            playClick(0.5);
            playChime(1.5, 0.6);
          }}
          title="Click to play!"
        >
          <svg viewBox="0 0 24 24" className="ref-pet-svg" shapeRendering="crispEdges">
            <path
              d="
                M 5 2 H 7 V 5 H 5 Z
                M 17 2 H 19 V 5 H 17 Z
                M 8 4 H 16 V 5 H 8 Z
                M 4 5 H 5 V 8 H 4 Z
                M 19 5 H 20 V 8 H 19 Z
                M 3 8 H 4 V 18 H 3 Z
                M 20 8 H 21 V 18 H 20 Z
                M 4 18 H 6 V 21 H 4 Z
                M 18 18 H 20 V 21 H 18 Z
                M 6 21 H 8 V 22 H 6 Z
                M 16 21 H 18 V 22 H 16 Z
                M 8 20 H 16 V 21 H 8 Z
              "
              fill="#000000"
            />
            <path
              d="
                M 5 5 H 19 V 8 H 5 Z
                M 4 8 H 20 V 18 H 4 Z
                M 6 18 H 18 V 20 H 6 Z
                M 6 4 H 7 V 5 H 6 Z
                M 17 4 H 18 V 5 H 17 Z
                M 6 20 H 8 V 21 H 6 Z
                M 16 20 H 18 V 21 H 16 Z
              "
              fill="#E2E8F0"
            />
            <rect x="5" y="13" width="2" height="2" fill="#FF2E93" />
            <rect x="17" y="13" width="2" height="2" fill="#FF2E93" />
            <rect x="7" y="9" width="3" height="3" fill="#000000" />
            <rect x="8" y="9" width="1" height="1" fill="#38B6FF" />
            <rect x="14" y="9" width="3" height="3" fill="#000000" />
            <rect x="15" y="9" width="1" height="1" fill="#38B6FF" />
            <path d="M 11 14 H 13 V 15 H 11 Z" fill="#000000" />
          </svg>
        </div>

        {/* Stepped Chamfered Black Button "[ ▶ Press start ]" (Exact reference button) */}
        <div className="ref-press-start-wrap">
          {!user ? (
            <button className="ref-press-start-btn" onClick={login}>
              <span className="ref-play-arrow">▶</span>
              <span className="ref-btn-text">Press start</span>
            </button>
          ) : (
            <button className="ref-press-start-btn" onClick={() => enterWorld()}>
              <span className="ref-play-arrow">▶</span>
              <span className="ref-btn-text">Enter quest</span>
            </button>
          )}
        </div>

        {/* Scattered Pixel Blocks along Sky (Pink & Black pixels from reference) */}
        <div className="ref-pixel-block p-pink-1" />
        <div className="ref-pixel-block p-pink-2" />
        <div className="ref-pixel-block p-pink-3" />
        <div className="ref-pixel-block p-black-1" />
        <div className="ref-pixel-block p-black-2" />
        <div className="ref-pixel-block p-black-3" />
      </section>

      {/* =========================================================================
          MIDDLE SECTION: STEPPED SKYLINE HORIZON + HOT PINK TAB MENU BAR
          ========================================================================= */}
      <div className="ref-skyline-horizon-divider">
        {/* Stepped Pixel SVG Skyline (Exact stepped silhouette from reference) */}
        <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="ref-skyline-svg" shapeRendering="crispEdges">
          <path
            d="
              M 0 60
              L 0 35 H 50 V 20 H 120 V 45 H 180 V 25 H 250 V 10 H 340 V 38 H 430 V 18 H 530 V 30 H 620 V 8 H 730 V 35 H 850 V 20 H 960 V 40 H 1050 V 15 H 1130 V 35 H 1200 V 60 Z
            "
            fill="#090B14"
          />
        </svg>

        {/* Magenta / Hot Pink Horizontal Menu Bar (Exact match to reference) */}
        <nav className="ref-magenta-menu-bar" aria-label="Main Navigation">
          <button
            className={`ref-menu-tab ${activeTab === 'heroes' ? 'active' : ''}`}
            onClick={() => {
              playClick(0.35);
              setActiveTab('heroes');
            }}
          >
            Who are they
          </button>
          <button
            className={`ref-menu-tab ${activeTab === 'realms' ? 'active' : ''}`}
            onClick={() => {
              playClick(0.35);
              setActiveTab('realms');
            }}
          >
            5 Realms
          </button>
          <button
            className={`ref-menu-tab ${activeTab === 'vision' ? 'active' : ''}`}
            onClick={() => {
              playClick(0.35);
              setActiveTab('vision');
            }}
          >
            Vision Lab
          </button>
          <button
            className={`ref-menu-tab ${activeTab === 'quests' ? 'active' : ''}`}
            onClick={() => {
              playClick(0.35);
              setActiveTab('quests');
            }}
          >
            Quest Log
          </button>
        </nav>
      </div>

      {/* =========================================================================
          BOTTOM SECTION: OBSIDIAN DEEP SPACE, 16-BIT EARTH & EDITORIAL TYPOGRAPHY
          ========================================================================= */}
      <main className="ref-bottom-space-section">
        {/* Pixel Constellation Stars (Exact + and diamond clusters from reference) */}
        <div className="ref-star-plus star-loc-1" />
        <div className="ref-star-plus star-loc-2" />
        <div className="ref-star-diamond star-loc-3" />
        <div className="ref-star-diamond star-loc-4" />
        <div className="ref-star-dot star-loc-5" />
        <div className="ref-star-dot star-loc-6" />
        <div className="ref-star-dot star-loc-7" />

        <div className="ref-content-layout">
          {/* Left Large Column: Giant Stacked Title + Editorial Story + Tags */}
          <div className="ref-story-column">
            {/* Giant Stacked 2-Line Pixel Heading (Exact match to reference "КТО ОНИ ТАКИЕ?") */}
            <h2 className="ref-giant-stacked-heading">
              <span>WHO</span>
              <span>ARE THEY?</span>
            </h2>

            <div className="ref-editorial-columns">
              {/* Left Column with Pink Pill Highlight */}
              <div className="ref-lead-col">
                <p className="ref-lead-paragraph">
                  Lumora is an inclusive learning realm for{' '}
                  <span className="ref-pink-highlight">young explorers</span> with dyslexia, ADHD, dyscalculia, and autism.
                </p>
                <p className="ref-body-paragraph">
                  Every child learns through curiosity, spatial play, and adaptive neural feedback.
                </p>
              </div>

              {/* Right Column with Paragraphs and Pink Tags */}
              <div className="ref-sub-col">
                <p>
                  Learners interact using <span className="ref-pink-tag">camera air-gestures</span>, speech phonetics, and
                  handwriting physics <span className="ref-pink-tag">without judgment</span>.
                </p>
                <p>
                  From phoneme blending in sound forests to spatial rune tracing, difficulty adapts in real-time.
                  Practice is saved with <span className="ref-pink-tag">zero punitive timers</span> and sensory calm.
                </p>
                <p>
                  Each hero brings a unique talent: Kai decodes words, Maya reads scrolls, Leo finds rhythm patterns, and Zara traces kinetic runes.
                </p>
              </div>
            </div>

            {/* Quick Hero Selector Chips */}
            <div className="ref-heroes-row">
              {AVATARS.map((a) => (
                <button
                  key={a.name}
                  className={`ref-hero-chip ${selectedHero === a.name ? 'active' : ''}`}
                  onClick={() => {
                    playClick(0.35);
                    setSelectedHero(a.name);
                  }}
                >
                  <span className="ref-chip-icon">{a.icon}</span>
                  <span className="ref-chip-name">{a.name}</span>
                </button>
              ))}
            </div>

            {/* Auth / Account Action Bar */}
            <div className="ref-bottom-auth-bar">
              {!user ? (
                <>
                  <button className="ref-action-btn-primary" onClick={createAccount}>
                    [ CREATE ACCOUNT ]
                  </button>
                  <button className="ref-action-btn-secondary" onClick={login}>
                    [ SIGN IN ]
                  </button>
                </>
              ) : (
                <>
                  <button className="ref-action-btn-primary" onClick={() => enterWorld('map')}>
                    [ 🗺 GALAXY MAP ]
                  </button>
                  <button className="ref-action-btn-secondary" onClick={signOut}>
                    [ SIGN OUT ({displayName}) ]
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Bottom Left 16-Bit Earth Globe (Exact placement and style from reference) */}
          <div className="ref-earth-globe-wrapper">
            <svg viewBox="0 0 200 200" className="ref-earth-globe-svg" shapeRendering="crispEdges">
              <defs>
                <clipPath id="refGlobeClip">
                  <circle cx="100" cy="100" r="92" />
                </clipPath>
              </defs>

              {/* Globe Outer Black Outline */}
              <circle cx="100" cy="100" r="96" fill="#000000" />
              <circle cx="100" cy="100" r="92" fill="#1D4ED8" />

              <g clipPath="url(#refGlobeClip)">
                {/* Ocean Base */}
                <rect x="0" y="0" width="200" height="200" fill="#1D4ED8" />

                {/* Pixel Continents in Sky Teal / Cyan (Zero green, compliant with color rules) */}
                <path
                  d="
                    M 20 50 H 70 V 80 H 40 V 110 H 90 V 150 H 30 Z
                    M 80 30 H 130 V 70 H 100 V 100 H 150 V 140 H 110 Z
                    M 110 100 H 180 V 170 H 130 V 180 H 100 Z
                    M 50 110 H 100 V 180 H 50 Z
                    M 120 20 H 170 V 60 H 140 Z
                  "
                  fill="#38B6FF"
                />
                <path
                  d="
                    M 35 65 H 60 V 80 H 35 Z
                    M 90 40 H 120 V 60 H 90 Z
                    M 120 110 H 160 V 140 H 120 Z
                    M 60 120 H 85 V 150 H 60 Z
                  "
                  fill="#48B8D0"
                />
                {/* Grid Lines */}
                <path
                  d="
                    M 0 70 H 200
                    M 0 100 H 200
                    M 0 130 H 200
                  "
                  stroke="#0E234B"
                  strokeWidth="3"
                  strokeDasharray="6 6"
                />
              </g>
            </svg>
          </div>
        </div>
      </main>
    </div>
  );
}
