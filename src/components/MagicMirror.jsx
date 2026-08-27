import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';

/**
 * MagicMirror — Camera portal with live multi-gesture badges and Pro HUD Grids.
 * Supports:
 * - 3x3 Rule of Thirds grid
 * - Kinematic Crosshair grid
 * - Target Interaction Box
 * - Live confidence meter & active gesture chips
 */
export default function MagicMirror({
  videoRef,
  cameraStatus,
  handDetected,
  gesture = 'none',
  gestureLabel = '',
  expanded,
  onToggle,
  color = '#4fd8ff',
}) {
  const canvasRef = useRef(null);
  const cameraGrid = useGameStore((s) => s.cameraGrid);

  // Draw glowing border and HUD Grid on canvas
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

      const time = frame * 0.02;
      const glowIntensity = 0.3 + 0.15 * Math.sin(time);

      ctx.save();
      const cx = W / 2,
        cy = H / 2;
      const rx = W / 2 - 4,
        ry = H / 2 - 4;

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

      // Render HUD Grid Overlay
      if (cameraGrid === 'thirds') {
        ctx.save();
        ctx.strokeStyle = 'rgba(79, 216, 255, 0.45)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        // Vertical thirds
        ctx.beginPath();
        ctx.moveTo(W / 3, 0);
        ctx.lineTo(W / 3, H);
        ctx.moveTo((W * 2) / 3, 0);
        ctx.lineTo((W * 2) / 3, H);

        // Horizontal thirds
        ctx.moveTo(0, H / 3);
        ctx.lineTo(W, H / 3);
        ctx.moveTo(0, (H * 2) / 3);
        ctx.lineTo(W, (H * 2) / 3);
        ctx.stroke();

        // Intersection points
        ctx.setLineDash([]);
        const points = [
          [W / 3, H / 3],
          [(W * 2) / 3, H / 3],
          [W / 3, (H * 2) / 3],
          [(W * 2) / 3, (H * 2) / 3],
        ];
        points.forEach(([px, py]) => {
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = '#FFC857';
          ctx.fill();
        });
        ctx.restore();
      } else if (cameraGrid === 'crosshair') {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 92, 173, 0.55)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 24, cy);
        ctx.lineTo(cx + 24, cy);
        ctx.moveTo(cx, cy - 24);
        ctx.lineTo(cx, cy + 24);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(79, 216, 255, 0.5)';
        ctx.stroke();
        ctx.restore();
      } else if (cameraGrid === 'box') {
        ctx.save();
        const padX = W * 0.18;
        const padY = H * 0.18;
        const boxW = W - padX * 2;
        const boxH = H - padY * 2;

        ctx.strokeStyle = 'rgba(76, 227, 160, 0.5)';
        ctx.lineWidth = 1.5;

        // Corner brackets
        const cornerLen = 14;
        ctx.beginPath();
        // Top-left
        ctx.moveTo(padX, padY + cornerLen);
        ctx.lineTo(padX, padY);
        ctx.lineTo(padX + cornerLen, padY);
        // Top-right
        ctx.moveTo(padX + boxW - cornerLen, padY);
        ctx.lineTo(padX + boxW, padY);
        ctx.lineTo(padX + boxW, padY + cornerLen);
        // Bottom-left
        ctx.moveTo(padX, padY + boxH - cornerLen);
        ctx.lineTo(padX, padY + boxH);
        ctx.lineTo(padX + cornerLen, padY + boxH);
        // Bottom-right
        ctx.moveTo(padX + boxW - cornerLen, padY + boxH);
        ctx.lineTo(padX + boxW, padY + boxH);
        ctx.lineTo(padX + boxW, padY + boxH - cornerLen);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [color, cameraGrid]);

  const isExpanded = expanded;
  const isReady = cameraStatus === 'ready';
  const isDenied = cameraStatus === 'denied' || cameraStatus === 'error';

  return (
    <div
      className={`magic-mirror ${isExpanded ? 'expanded' : 'compact'}`}
      style={{ '--mirror-color': color }}
    >
      <div className="mirror-portal">
        <video
          ref={videoRef}
          className="mirror-video"
          autoPlay
          muted
          playsInline
        />

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
            <span className="mirror-status-sub">Using mouse/touch</span>
          </div>
        )}

        {!isReady && !isDenied && cameraStatus !== 'loading' && (
          <div className="mirror-status">
            <span style={{ fontSize: 28 }}>✨</span>
            <span>Move mouse to play</span>
          </div>
        )}

        {/* Gesture Badge indicator */}
        {isReady && (
          <div className={`mirror-hand-indicator ${handDetected ? 'detected' : ''}`}>
            {handDetected
              ? gestureLabel
                ? `${gestureLabel}`
                : '✨ Hand detected!'
              : '✋ Show your hand'}
          </div>
        )}
      </div>

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
