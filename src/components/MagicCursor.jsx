import React, { useRef, useEffect, useCallback } from 'react';

/**
 * MagicCursor — A flowing cyan/blue energy trail cursor.
 *
 * Renders as a full-size overlay canvas. Receives normalized coordinates
 * (0-1) and draws:
 * - Bright cyan core dot
 * - Soft electric-blue aura
 * - Flowing trailing particles
 * - Smooth motion interpolation
 * - Subtle wave/serpentine motion in the trail
 * - Slight glow pulse
 * - Brighter when interacting (pinching)
 * - Burst/ripple on collision events
 * - Tiny spark particles behind movement
 */
export default function MagicCursor({ pixel, pinching = false, interacting = false, color = '#4fd8ff', bursts = [] }) {
  const canvasRef = useRef(null);
  const trailRef = useRef([]);
  const particlesRef = useRef([]);
  const frameRef = useRef(0);
  const lastPosRef = useRef(null);

  // Parse color into RGB for manipulation
  const parseColor = useCallback((hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    // Calm-motion contract: users who ask for reduced motion get a bare wand,
    // no tracing tail at all.
    const reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      frameRef.current++;
      const frame = frameRef.current;
      const W = canvas.width;
      const H = canvas.height;
      const rgb = parseColor(color);

      ctx.clearRect(0, 0, W, H);

      if (!pixel) {
        trailRef.current = [];
        particlesRef.current = [];
        raf = requestAnimationFrame(draw);
        return;
      }

      const cx = pixel.x;
      const cy = pixel.y;
      const isActing = pinching || interacting;

      // --- Tracing tail: stepped pixel-dot comet, hard-edged, no laser ---
      // Record a point only when the wand moved >= 3px since the last
      // recorded point → the tail reads as discrete pixel steps, not a smear.
      const lastRec = trailRef.current[trailRef.current.length - 1];
      const movedEnough = !lastRec ||
        Math.hypot(cx - lastRec.x, cy - lastRec.y) >= 3;
      if (movedEnough && !reduceMotion) {
        trailRef.current.push({ x: cx, y: cy, t: frame, pinch: isActing });
      }
      if (trailRef.current.length > 10) {
        trailRef.current = trailRef.current.slice(-10);
      }

      lastPosRef.current = { x: cx, y: cy };

      // Draw the tail as stepped pixel squares (oldest = smallest/faintest)
      if (trailRef.current.length > 1) {
        ctx.save();
        for (let i = 0; i < trailRef.current.length - 1; i++) {
          const p = trailRef.current[i];
          const age = (frame - p.t);           // frames since recorded
          if (age > 24) continue;              // fully decayed
          const k = 1 - age / 24;              // 1 = fresh, 0 = gone
          const size = Math.max(2, Math.round(8 * k));   // 8px → 2px
          const alpha = 0.55 * k;
          const half = size / 2;
          ctx.fillStyle = p.pinch
            ? `rgba(255, 46, 147, ${alpha})`   // acting: pink tail
            : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`; // idle: cyan
          // black pixel outline for crispness
          ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
          ctx.fillRect(Math.round(p.x - half) - 1, Math.round(p.y - half) - 1, size + 2, size + 2);
          ctx.fillStyle = p.pinch
            ? `rgba(255, 46, 147, ${alpha})`
            : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
          ctx.fillRect(Math.round(p.x - half), Math.round(p.y - half), size, size);
        }
        ctx.restore();
      }

      // Draw particles
      ctx.save();
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // slight gravity
        p.life -= p.decay;
        if (p.life <= 0) return false;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${p.life * 0.7})`;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.fill();
        return true;
      });
      ctx.restore();

      // Draw burst effects
      ctx.save();
      for (const burst of bursts) {
        if (!burst || !burst.active) continue;
        const progress = burst.progress ?? 0;
        const bRadius = 20 + progress * 60;
        const bAlpha = Math.max(0, 1 - progress);

        // Expanding ring
        ctx.beginPath();
        ctx.arc(burst.x, burst.y, bRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${bAlpha * 0.6})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = color;
        ctx.shadowBlur = 16;
        ctx.stroke();

        // Inner glow
        const grad = ctx.createRadialGradient(burst.x, burst.y, 0, burst.x, burst.y, bRadius * 0.6);
        grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${bAlpha * 0.3})`);
        grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
        ctx.fillStyle = grad;
        ctx.fill();

        // Burst sparkles
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + progress * 2;
          const dist = bRadius * 0.8;
          const sx = burst.x + Math.cos(angle) * dist;
          const sy = burst.y + Math.sin(angle) * dist;
          ctx.beginPath();
          ctx.arc(sx, sy, 2 * bAlpha, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${bAlpha * 0.8})`;
          ctx.fill();
        }
      }
      ctx.restore();

      // Draw a hard-edged pixel wand. Its hot spot is the exact input point.
      ctx.save();
      const x = Math.round(cx);
      const y = Math.round(cy);
      // black outline, cyan handle, white magic tip — all integer pixels
      ctx.fillStyle = '#000000';
      ctx.fillRect(x - 4, y - 10, 8, 20);
      ctx.fillStyle = color;
      ctx.fillRect(x - 2, y - 8, 4, 14);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x - 2, y - 12, 4, 4);
      if (isActing) {
        ctx.fillStyle = '#FF2E93';
        ctx.fillRect(x - 6, y - 14, 12, 2);
        ctx.fillRect(x - 6, y + 10, 12, 2);
      }
      ctx.restore();

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [pixel, pinching, interacting, color, bursts, parseColor]);

  return (
    <canvas
      ref={canvasRef}
      className="magic-cursor-canvas"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 30,
      }}
    />
  );
}
