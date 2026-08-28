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

      // Add to trail
      trailRef.current.push({
        x: cx,
        y: cy,
        t: frame,
        pinch: isActing,
      });

      // Keep only the current point. A direct cursor must never paint a laser
      // across the page or lag behind the user's hand/mouse.
      if (trailRef.current.length > 1) {
        trailRef.current = trailRef.current.slice(-1);
      }

      // No particle exhaust: this is a crisp pixel wand, not a neon comet.
      lastPosRef.current = { x: cx, y: cy };

      // Draw trail — flowing serpent-like path
      if (trailRef.current.length > 1) {
        ctx.save();
        for (let pass = 0; pass < 3; pass++) {
          ctx.beginPath();
          const trail = trailRef.current;
          const offset = pass * 1.5; // slight offset for layered glow

          for (let i = 0; i < trail.length; i++) {
            const t = i / trail.length;
            const wave = Math.sin(t * Math.PI * 3 + frame * 0.08) * (3 - pass) * (1 - t);
            const px = trail[i].x + wave;
            const py = trail[i].y + Math.cos(t * Math.PI * 2 + frame * 0.06) * (2 - pass * 0.5);

            if (i === 0) ctx.moveTo(px, py);
            else {
              const prev = trail[i - 1];
              const prevWave = Math.sin(((i - 1) / trail.length) * Math.PI * 3 + frame * 0.08) * (3 - pass) * (1 - (i - 1) / trail.length);
              const cpx = (prev.x + prevWave + px) / 2;
              const cpy = (prev.y + Math.cos(((i - 1) / trail.length) * Math.PI * 2 + frame * 0.06) * (2 - pass * 0.5) + py) / 2;
              ctx.quadraticCurveTo(cpx, cpy, px, py);
            }
          }

          const alpha = pass === 0 ? 0.08 : pass === 1 ? 0.15 : 0.35;
          const width = pass === 0 ? 18 : pass === 1 ? 10 : 4;
          ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
          ctx.lineWidth = width;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.shadowColor = color;
          ctx.shadowBlur = pass === 2 ? 12 : 6;
          ctx.stroke();
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
