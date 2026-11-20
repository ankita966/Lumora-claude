import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playChime, playClick } from '../lib/soundFx';

/**
 * 8-Bit Pixel Art Tamagotchi Companion (Lumi) — Inspired by retro Tamagotchi pet in reference.
 * Features:
 * - Pixelated 16x16 grid art rendered crisply via SVG block pixels.
 * - Real-time gaze-tracking pixel pupils.
 * - Organic randomized pixel blinking.
 * - Smooth bobbing float animation.
 * - Retro NES-style stepped pixel speech dialog box.
 */
export default function Mascot({ message, color = 'var(--cyan)' }) {
  const mascotRef = useRef(null);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [isExcited, setIsExcited] = useState(false);

  // Pixel Eye gaze tracking
  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!mascotRef.current) return;
      const rect = mascotRef.current.getBoundingClientRect();
      const mascotCenterX = rect.left + rect.width / 2;
      const mascotCenterY = rect.top + rect.height / 2;

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - mascotCenterX;
      const deltaY = clientY - mascotCenterY;
      const angle = Math.atan2(deltaY, deltaX);

      // Quantize to pixel steps: -1, 0, or 1
      const stepX = Math.abs(deltaX) > 40 ? (Math.cos(angle) > 0.3 ? 1 : Math.cos(angle) < -0.3 ? -1 : 0) : 0;
      const stepY = Math.abs(deltaY) > 40 ? (Math.sin(angle) > 0.3 ? 1 : Math.sin(angle) < -0.3 ? -1 : 0) : 0;

      setPupilOffset({ x: stepX * 2, y: stepY * 2 });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
    };
  }, []);

  // Organic pixel eyelid blinking
  useEffect(() => {
    let blinkTimeout;
    const scheduleNextBlink = () => {
      const delay = 2200 + Math.random() * 3200;
      blinkTimeout = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 160);
      }, delay);
    };

    scheduleNextBlink();
    return () => clearTimeout(blinkTimeout);
  }, []);

  // Interactive tap reaction
  const handleMascotClick = useCallback(() => {
    if (isExcited) return;
    setIsExcited(true);
    playClick(0.6);
    playChime(1.4, 0.6);
    setTimeout(() => setIsExcited(false), 800);
  }, [isExcited]);

  return (
    <div
      ref={mascotRef}
      className={`pixel-mascot-container ${isExcited ? 'excited' : ''}`}
      style={{ '--mascot-accent': color }}
    >
      <button
        className="pixel-mascot-btn"
        onClick={handleMascotClick}
        aria-label="Lumi the Pixel Pet"
        title="Tap Lumi!"
      >
        {/* Pixel Sprite: 24x24 Pixel Grid */}
        <svg
          viewBox="0 0 24 24"
          className="pixel-mascot-svg"
          aria-hidden="true"
          shapeRendering="crispEdges"
        >
          {/* Black Outer Pixel Outline (Tamagotchi Creature) */}
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
            fill="#090B14"
          />

          {/* Body Fill (Soft Ice Lavender / Cream Slate) */}
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

          {/* Cheerful Pixel Cheeks (Magenta) */}
          <rect x="5" y="13" width="2" height="2" fill="#FF2E93" />
          <rect x="17" y="13" width="2" height="2" fill="#FF2E93" />

          {/* Left Eye */}
          {isBlinking ? (
            <rect x="7" y="10" width="3" height="1" fill="#090B14" />
          ) : (
            <g transform={`translate(${pupilOffset.x}, ${pupilOffset.y})`}>
              <rect x="7" y="9" width="3" height="3" fill="#090B14" />
              <rect x="8" y="9" width="1" height="1" fill="#38B6FF" />
            </g>
          )}

          {/* Right Eye */}
          {isBlinking ? (
            <rect x="14" y="10" width="3" height="1" fill="#090B14" />
          ) : (
            <g transform={`translate(${pupilOffset.x}, ${pupilOffset.y})`}>
              <rect x="14" y="9" width="3" height="3" fill="#090B14" />
              <rect x="15" y="9" width="1" height="1" fill="#38B6FF" />
            </g>
          )}

          {/* Mouth */}
          {isExcited ? (
            <path d="M 10 13 H 14 V 16 H 10 Z" fill="#FF2E93" />
          ) : (
            <path d="M 11 14 H 13 V 15 H 11 Z" fill="#090B14" />
          )}
        </svg>
      </button>

      {/* Retro Pixel Speech Box */}
      {message && (
        <div className="pixel-speech-box">
          <div className="pixel-speech-text">{message}</div>
        </div>
      )}
    </div>
  );
}
