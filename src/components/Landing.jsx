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
        {/* CRAFTED PIXEL SKY — dither band edges (no photo, no smooth gradient) */}
        <div className="ref-dither-strip d1" />
        <div className="ref-dither-strip d2" />
        <div className="ref-dither-strip d3" />
        <div className="ref-dither-strip d4" />
        <div className="ref-dither-strip d5" />

        {/* Pixel sun with stepped glow — top-right counterweight */}
        <div className="ref-pixel-sun" aria-hidden="true">
          <svg viewBox="0 0 16 16" shapeRendering="crispEdges">
            <rect className="ref-sun-glow-2" x="3" y="3" width="10" height="10" fill="#FFE9B8" />
            <rect className="ref-sun-glow-1" x="4" y="4" width="8" height="8" fill="#FFE9B8" />
            <rect x="5" y="5" width="6" height="6" fill="#FFE9B8" />
            <rect x="7" y="1" width="2" height="2" fill="#FFE9B8" />
            <rect x="7" y="13" width="2" height="2" fill="#FFE9B8" />
            <rect x="1" y="7" width="2" height="2" fill="#FFE9B8" />
            <rect x="13" y="7" width="2" height="2" fill="#FFE9B8" />
          </svg>
        </div>

        {/* Sprite clouds — back parallax layer (slower, smaller, softer) */}
        <div className="ref-cloud back c1" style={{ top: '18%' }} aria-hidden="true">
          <svg viewBox="0 0 32 16" shapeRendering="crispEdges">
            <path d="M2 16 V8 H8 V4 H12 V2 H20 V4 H24 V8 H30 V16 Z" fill="#FFFFFF" />
            <rect x="2" y="14" width="28" height="2" fill="#C8EBFD" />
          </svg>
        </div>
        <div className="ref-cloud back c2" style={{ top: '38%' }} aria-hidden="true">
          <svg viewBox="0 0 32 16" shapeRendering="crispEdges">
            <path d="M2 16 V8 H8 V4 H12 V2 H20 V4 H24 V8 H30 V16 Z" fill="#FFFFFF" />
            <rect x="2" y="14" width="28" height="2" fill="#C8EBFD" />
          </svg>
        </div>
        <div className="ref-cloud back c3" style={{ top: '62%' }} aria-hidden="true">
          <svg viewBox="0 0 32 16" shapeRendering="crispEdges">
            <path d="M2 16 V8 H8 V4 H12 V2 H20 V4 H24 V8 H30 V16 Z" fill="#FFFFFF" />
            <rect x="2" y="14" width="28" height="2" fill="#C8EBFD" />
          </svg>
        </div>

        {/* Sprite clouds — front parallax layer (faster, bigger) */}
        <div className="ref-cloud front" style={{ top: '7%' }} aria-hidden="true">
          <svg viewBox="0 0 32 16" shapeRendering="crispEdges">
            <path d="M2 16 V8 H8 V4 H12 V2 H20 V4 H24 V8 H30 V16 Z" fill="#FFFFFF" />
            <rect x="2" y="14" width="28" height="2" fill="#C8EBFD" />
          </svg>
        </div>
        <div className="ref-cloud front c2" style={{ top: '46%' }} aria-hidden="true">
          <svg viewBox="0 0 32 16" shapeRendering="crispEdges">
            <path d="M2 16 V8 H8 V4 H12 V2 H20 V4 H24 V8 H30 V16 Z" fill="#FFFFFF" />
            <rect x="2" y="14" width="28" height="2" fill="#C8EBFD" />
          </svg>
        </div>
        <div className="ref-cloud front c3" style={{ top: '70%' }} aria-hidden="true">
          <svg viewBox="0 0 32 16" shapeRendering="crispEdges">
            <path d="M2 16 V8 H8 V4 H12 V2 H20 V4 H24 V8 H30 V16 Z" fill="#FFFFFF" />
            <rect x="2" y="14" width="28" height="2" fill="#C8EBFD" />
          </svg>
        </div>

        {/* Scattered pixel confetti — 8 committed cubes, varied sizes, full opacity */}
        <div className="ref-pixel-block p-pink-1" />
        <div className="ref-pixel-block p-pink-2" />
        <div className="ref-pixel-block p-pink-3" />
        <div className="ref-pixel-block p-pink-4" />
        <div className="ref-pixel-block p-black-1" />
        <div className="ref-pixel-block p-black-2" />
        <div className="ref-pixel-block p-black-3" />
        <div className="ref-pixel-block p-amber-1" />

        {/* Distant pixel mountains — TRUE stair-step diagonals (8px 45° stairs),
            sharp triangular peaks, 2-tone depth + chunky outline */}
        <div className="ref-far-mountains" aria-hidden="true">
          <svg viewBox="0 0 1200 200" preserveAspectRatio="none" shapeRendering="crispEdges">
            {/* BACK range: lighter blue, mid-height peaks peeking between front peaks */}
            <path
              d="M 0 200 H 156 V 190 H 166 V 180 H 176 V 170 H 186 V 160 H 196 V 150 H 200 V 140 V 88 H 210 V 98 H 220 V 108 H 230 V 118 H 240 V 128 H 250 V 138 H 254 V 148 H 368 V 190 H 378 V 180 H 388 V 170 H 398 V 160 H 408 V 150 H 418 V 140 H 420 V 130 V 76 H 430 V 86 H 440 V 96 H 450 V 106 H 460 V 116 H 470 V 126 H 480 V 136 H 482 V 146 H 592 V 190 H 602 V 180 H 612 V 170 H 622 V 160 H 632 V 150 H 640 V 140 V 82 H 650 V 92 H 660 V 102 H 670 V 112 H 680 V 122 H 690 V 132 H 698 V 142 H 800 V 190 H 810 V 180 H 820 V 170 H 830 V 160 H 840 V 150 H 850 V 140 V 80 H 860 V 90 H 870 V 100 H 880 V 110 H 890 V 120 H 900 V 130 H 910 V 140 H 1018 V 190 H 1028 V 180 H 1038 V 170 H 1048 V 160 H 1058 V 150 H 1060 V 140 V 90 H 1070 V 100 H 1080 V 110 H 1090 V 120 H 1100 V 130 H 1110 V 140 H 1112 V 150 H 1200 V 200 Z"
              fill="#7AB8E6"
            />
            {/* FRONT range: deeper blue, tall sharp peaks, chunky dark outline */}
            <path
              d="M 0 200 H 38 V 190 H 48 V 180 H 58 V 170 H 68 V 160 H 78 V 150 H 88 V 140 H 90 V 130 V 60 H 100 V 70 H 110 V 80 H 120 V 90 H 130 V 100 H 140 V 110 H 150 V 120 H 152 V 130 H 232 V 190 H 242 V 180 H 252 V 170 H 262 V 160 H 272 V 150 H 282 V 140 H 292 V 130 H 300 V 120 V 30 H 310 V 40 H 320 V 50 H 330 V 60 H 340 V 70 H 350 V 80 H 360 V 90 H 370 V 100 H 378 V 110 H 472 V 190 H 482 V 180 H 492 V 170 H 502 V 160 H 512 V 150 H 520 V 140 V 46 H 530 V 56 H 540 V 66 H 550 V 76 H 560 V 86 H 570 V 96 H 578 V 106 H 684 V 190 H 694 V 180 H 704 V 170 H 714 V 160 H 724 V 150 H 734 V 140 H 740 V 130 V 22 H 750 V 32 H 760 V 42 H 770 V 52 H 780 V 62 H 790 V 72 H 800 V 82 H 806 V 92 H 904 V 190 H 914 V 180 H 924 V 170 H 934 V 160 H 944 V 150 H 950 V 140 V 52 H 960 V 62 H 970 V 72 H 980 V 82 H 990 V 92 H 1000 V 102 H 1006 V 112 H 1080 V 190 H 1090 V 180 H 1100 V 170 H 1110 V 160 H 1120 V 150 H 1130 V 140 V 40 H 1140 V 50 H 1150 V 60 H 1160 V 70 H 1170 V 80 H 1180 V 90 H 1190 V 100 H 1200 V 200 Z"
              fill="#4E9FD6"
              stroke="#2E6FA8"
              strokeWidth="3"
            />
          </svg>
        </div>

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
            <svg viewBox="0 0 200 200" className="ref-earth-globe-svg" shapeRendering="crispEdges" role="img" aria-label="Pixel-art Earth globe with cyan continents">
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
