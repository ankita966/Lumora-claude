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

      // Keep trail length
      if (trailRef.current.length > 50) {
        trailRef.current = trailRef.current.slice(-50);
      }

      // Add spark particles on movement
      if (lastPosRef.current) {
        const dx = cx - lastPosRef.current.x;
        const dy = cy - lastPosRef.current.y;
        const speed = Math.hypot(dx, dy);
        if (speed > 2) {
          for (let i = 0; i < Math.min(3, Math.floor(speed / 5)); i++) {
            particlesRef.current.push({
              x: cx + (Math.random() - 0.5) * 10,
              y: cy + (Math.random() - 0.5) * 10,
              vx: (Math.random() - 0.5) * 3,
              vy: (Math.random() - 0.5) * 3 - 1,
              life: 1,
              decay: 0.02 + Math.random() * 0.03,
              size: 1.5 + Math.random() * 2,
            });
          }
        }
      }
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

      // Draw cursor core
      if (pixel) {
        ctx.save();

        // Outer glow pulse
        const pulse = 1 + 0.15 * Math.sin(frame * 0.08);
        const coreRadius = isActing ? 14 : 10;
        const glowRadius = coreRadius * 2.2 * pulse;

        // Soft aura
        const auraGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
        auraGrad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${isActing ? 0.35 : 0.18})`);
        auraGrad.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.06)`);
        auraGrad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.3, color);
        coreGrad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`);
        ctx.fillStyle = coreGrad;
        ctx.shadowColor = color;
        ctx.shadowBlur = isActing ? 24 : 16;
        ctx.beginPath();
        ctx.arc(cx, cy, coreRadius * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Bright inner dot
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.restore();
      }

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
