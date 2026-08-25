import React, { useState, useRef, useEffect } from 'react';

/**
 * MagicMirror — A beautiful "Magic Mirror" camera experience.
 * Shows the child's live camera feed in a glowing portal/mirror shape.
 * Supports small (PiP) and large (immersive) modes with a toggle.
 */
export default function MagicMirror({ videoRef, cameraStatus, handDetected, expanded, onToggle, color = '#4fd8ff' }) {
  const canvasRef = useRef(null);

  // Draw glowing border effect on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame = 0;
    let raf;
    const W = canvas.width;
    const H = canvas.height;

    function draw() {
      frame++;
      ctx.clearRect(0, 0, W, H);

      // Outer glow ring
      const time = frame * 0.02;
      const glowIntensity = 0.3 + 0.15 * Math.sin(time);

      ctx.save();
      // Draw organic rounded shape
      const cx = W / 2, cy = H / 2;
      const rx = W / 2 - 4, ry = H / 2 - 4;

      // Glow layers
      for (let i = 3; i >= 0; i--) {
        ctx.beginPath();
        const spread = i * 3;
        ctx.ellipse(cx, cy, rx + spread, ry + spread, 0, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 - i * 0.4;
        ctx.globalAlpha = glowIntensity * (1 - i * 0.22);
        ctx.shadowColor = color;
        ctx.shadowBlur = 12 + i * 6;
        ctx.stroke();
      }

      // Floating sparkles around the mirror
      ctx.globalAlpha = 1;
      for (let i = 0; i < 6; i++) {
        const angle = time * 0.4 + (i * Math.PI * 2) / 6;
        const sparkleR = rx + 10 + 4 * Math.sin(time * 2 + i);
        const sx = cx + Math.cos(angle) * sparkleR;
        const sy = cy + Math.sin(angle) * (ry / rx) * sparkleR;
        const sparkleSize = 1.5 + Math.sin(time * 3 + i * 1.5) * 1;
        ctx.beginPath();
        ctx.arc(sx, sy, sparkleSize, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.globalAlpha = 0.5 + 0.3 * Math.sin(time * 2 + i);
        ctx.fill();
      }

      ctx.restore();
      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [color]);

  const isExpanded = expanded;
  const isReady = cameraStatus === 'ready';
  const isDenied = cameraStatus === 'denied' || cameraStatus === 'error';

  return (
    <div
      className={`magic-mirror ${isExpanded ? 'expanded' : 'compact'}`}
      style={{ '--mirror-color': color }}
    >
      {/* Camera feed */}
      <div className="mirror-portal">
        {/* Keep this element mounted while camera state changes. The shared
            ref is also the exact element MediaPipe reads from. */}
        <video
          ref={videoRef}
          className="mirror-video"
          autoPlay
          muted
          playsInline
        />

        {/* Overlay canvas for glow border */}
        <canvas
          ref={canvasRef}
          className="mirror-glow-canvas"
          width={320}
          height={240}
        />

        {/* Status overlays */}
        {cameraStatus === 'loading' && (
          <div className="mirror-status">
            <div className="mirror-spinner" style={{ borderColor: color }} />
            <span>Starting camera…</span>
          </div>
        )}

        {isDenied && (
          <div className="mirror-status">
            <span style={{ fontSize: 28 }}>📷</span>
            <span>Camera unavailable</span>
            <span className="mirror-status-sub">Using mouse/touch instead</span>
          </div>
        )}

        {!isReady && !isDenied && cameraStatus !== 'loading' && (
          <div className="mirror-status">
            <span style={{ fontSize: 28 }}>✨</span>
            <span>Move mouse to play</span>
          </div>
        )}

        {/* Hand detection indicator */}
        {isReady && (
          <div className={`mirror-hand-indicator ${handDetected ? 'detected' : ''}`}>
            {handDetected ? '✨ Hand detected!' : '✋ Show your hand'}
          </div>
        )}
      </div>

      {/* Expand/Collapse toggle */}
      <button
        className="mirror-toggle"
        onClick={onToggle}
        style={{ '--mirror-color': color }}
      >
        {isExpanded ? '✨ Shrink Mirror' : '✨ Expand Mirror'}
      </button>
    </div>
  );
}
