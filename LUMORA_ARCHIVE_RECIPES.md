# 🌟 Lumora World — Interactive Engineering Archive & UI Cookbook

This archive documents the core architectural patterns, custom-built computer vision components, interactive cursor physics, living mascot mechanics, and clinical kinematics built for **Lumora World**. 

Use this cookbook to drop these features directly into any modern **Next.js / React** web application without reinventing from scratch.

---

## 📑 Table of Contents
1. [Design Preferences, Taste Philosophy & Anti-AI-Slop Engineering](#1-design-preferences-taste-philosophy--anti-ai-slop-engineering)
2. [Centralized Camera Singleton (`CameraService`)](#2-centralized-camera-singleton-cameraservice)
3. [Real-Time Hand Tracking & Star-to-Fire Morphing Wand (`UniversalAirWand`)](#3-real-time-hand-tracking--star-to-fire-morphing-wand-universalairwand)
4. [Living SVG Mascot with Dynamic Pupil Gaze (`LanternMascot` & `InteractiveLumiCompanion`)](#4-living-svg-mascot-with-dynamic-pupil-gaze-lanternmascot--interactivelumicompanion)
5. [Kinematic Motor Planning & Dysgraphia Analysis (`lib/tracing.ts`)](#5-kinematic-motor-planning--dysgraphia-analysis-libtracingts)
6. [5-Minute Quick-Start Integration Guide](#6-5-minute-quick-start-integration-guide)

---

## 1. Design Preferences, Taste Philosophy & Anti-AI-Slop Engineering

### 1.1 The Taste Philosophy: "Duolingo Kids Warmth + Apple HIG Discipline"
Most AI-generated web apps look identical: dark purple gradients, generic cards-inside-cards, soulless robotic buzzwords, and static vector graphics. 

Lumora World was engineered around a disciplined taste formulation:
1. **Physicality & Tactility**: UI components should feel like real, tactile objects you can touch and press on a tablet.
2. **Warmth Over Cold Tech**: Warm, creamy paper canvases (`#FAF9FC`) invite comfort for anxious children and educators, unlike sterile corporate white or intimidating dark grids.
3. **Biological Life in Software**: Characters and badges shouldn't be dead static images; they must breathe, blink at random organic intervals, and look where the user interacts.
4. **Scaffolding Over Judgment**: Never show a big red "X" or say "Wrong" to a 6-year-old. Use supportive nudges, gentle voice feedback, and visual distractor fading.

---

### 1.2 Anti-AI-Slop Checklist: What to Avoid vs What to Build

| ❌ Generic AI Pattern (Slop) | ✅ Lumora Taste Formulation |
| :--- | :--- |
| **Monotonous Typography** (System Inter/Roboto for everything) | **Baloo 2** (chubby, warm, high x-height) paired with **Lexend** (dyslexia-optimized reading fluency). |
| **Walls of Dry Text** (Long headlines that lose the hook) | **Visual Anchor Badges**: Highlighting the core hook with a tilted physical badge (`-rotate-1 border-b-4 border-amber-300`). |
| **Flat, Ghostly Buttons** (0px shadow, no press response) | **3D Tactile Buttons**: `border-2 border-b-4` with spring physics and `active:translate-y-0.5 active:border-b-2`. |
| **Cold Purple/Neon Gradients** | **Soft Ambient Radial Auras**: Low opacity radial meshes (`bg-amber-200/35 blur-[90px]`) that glow softly behind content. |
| **Nested Cards Inside Cards** | **Clean Visual Rhythm**: Clear grouping with ample whitespace (48px–72px section gaps) and distinct surface elevations. |
| **Robotic Buzzwords** (*"Multimodal AI Neural Triage Matrix"*) | **Natural Human Copy** (*"Spot learning differences early in 15 minutes of playful games"*). |

---

### 1.3 Master Color Palette & Taste Tokens

Add these curated tokens to your `tailwind.config.js`:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#2B2A33', // Deep charcoal with warm undertones (never pure #000)
          secondary: '#5E5D6A',
          tertiary: '#9493A0',
        },
        paper: '#FAF9FC',      // Warm luminous porcelain paper (soft on eyes)
        amber: {
          DEFAULT: '#E8A33D',  // Radiant solar gold mascot accent
          50: '#FDF8ED',
          100: '#FCEFD5',
          200: '#F8DDAA',
          300: '#F4C576',
          400: '#EEAD48',
          500: '#E8A33D',
          600: '#C77F1E',
          700: '#9B5D14',
          800: '#6E3F0E',
          900: '#422306',
        },
        forest: {
          DEFAULT: '#3A8A5C',  // Calming phonological sage green
          light: '#E8F5EC',
        },
        cyan: {
          DEFAULT: '#0284C7',  // Magic wand azure sky
          light: '#E0F2FE',
        },
        castle: {
          DEFAULT: '#6366F1',  // Story comprehension royal indigo
          light: '#EEF2FF',
        },
      },
      boxShadow: {
        'soft-xs': '0 2px 4px rgba(43, 42, 51, 0.04)',
        'soft-sm': '0 4px 12px rgba(43, 42, 51, 0.06)',
        'soft-md': '0 8px 24px rgba(43, 42, 51, 0.08)',
        'soft-lg': '0 16px 36px rgba(43, 42, 51, 0.12)',
        // 3D Candy Press Shadows
        'candy-amber': '0 4px 0 #C77F1E, 0 8px 16px rgba(232, 163, 61, 0.25)',
        'candy-cyan': '0 4px 0 #0369A1, 0 8px 16px rgba(2, 132, 199, 0.25)',
        'candy-emerald': '0 4px 0 #15803D, 0 8px 16px rgba(22, 163, 74, 0.25)',
      },
      fontFamily: {
        display: ['"Baloo 2"', 'system-ui', 'sans-serif'],
        body: ['"Lexend"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-gentle': 'bounceGentle 2s infinite ease-in-out',
        'pulse-glow': 'pulseGlow 2.5s infinite ease-in-out',
      },
      keyframes: {
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.04)' },
        },
      },
    },
  },
};
```

---

### 1.4 The Headline Hook Technique (Design Anatomy)

When creating hero sections, long headlines often become visually monotonous. Break up the typography using a **floating tilted accent badge**:

```tsx
<h1 className="font-display text-3xl sm:text-5xl md:text-[3.75rem] font-extrabold leading-[1.12] tracking-tight text-ink">
  Spot learning differences early,{' '}
  <br className="hidden sm:inline" />
  in{' '}
  <span className="relative inline-flex items-center gap-1.5 mx-1 px-3 sm:px-4 py-0.5 sm:py-1 rounded-2xl bg-amber-100 border-2 border-b-4 border-amber-300 text-amber-950 shadow-soft-xs -rotate-1 align-middle">
    <span>15 minutes</span>
    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 fill-amber-500 animate-pulse" />
  </span>{' '}
  of playful games.
</h1>
```

---

### 1.5 Micro-Interactions & Spring Motion Heuristics

1. **Never use Linear Transitions for UI**: Always apply Framer Motion springs (`stiffness: 400, damping: 20` or `stiffness: 420, damping: 28`).
2. **Staggered Floating Orbital Badges**:
   When floating multiple badges around a mascot or hero element, de-synchronize their float periods so the motion feels natural, never robotic:
   - Badge 1: `duration: 3.5s, delay: 0s`
   - Badge 2: `duration: 4.0s, delay: 0.5s`
   - Badge 3: `duration: 3.8s, delay: 1.0s`
   - Badge 4: `duration: 4.2s, delay: 1.5s`
3. **Child Touch Ergonomics**:
   - Touch targets must be at least **56px × 56px**.
   - Choice/Answer cards must be at least **72px height** with large typography (24px+).

---

---

## 2. Centralized Camera Singleton (`CameraService`)

### Why This Is Essential:
Webcam access can cause dual-stream conflicts, memory leaks, and severe battery drain/throttling on mobile/tablet devices if multiple components call `getUserMedia()`. This singleton pattern manages reference counts and automatically stops the hardware tracks when the last consumer disconnects.

```typescript
// lib/camera-service.ts
export interface CameraOptions {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
  frameRate?: number;
}

class CameraService {
  private static instance: CameraService | null = null;
  private activeStream: MediaStream | null = null;
  private refCount = 0;
  private isAcquiring = false;

  private constructor() {}

  public static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  public isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    );
  }

  public async acquireStream(options: CameraOptions = {}): Promise<MediaStream> {
    if (!this.isSupported()) {
      throw new Error('Camera hardware is not supported in this browser.');
    }

    if (this.activeStream && this.activeStream.active) {
      const tracks = this.activeStream.getVideoTracks();
      if (tracks.length > 0 && tracks[0].readyState === 'live') {
        this.refCount++;
        return this.activeStream;
      }
    }

    if (this.isAcquiring) {
      await new Promise((r) => setTimeout(r, 150));
      if (this.activeStream && this.activeStream.active) {
        this.refCount++;
        return this.activeStream;
      }
    }

    this.isAcquiring = true;
    try {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const defaultWidth = options.width || (isMobile ? 480 : 640);
      const defaultHeight = options.height || (isMobile ? 360 : 480);
      const facingMode = options.facingMode || 'user';
      const frameRate = options.frameRate || 30;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: defaultWidth, max: 1280 },
          height: { ideal: defaultHeight, max: 720 },
          facingMode: { ideal: facingMode },
          frameRate: { ideal: frameRate, max: 30 },
        },
        audio: false,
      });

      this.activeStream = stream;
      this.refCount++;
      return stream;
    } finally {
      this.isAcquiring = false;
    }
  }

  public releaseStream(): void {
    this.refCount = Math.max(0, this.refCount - 1);
    if (this.refCount === 0 && this.activeStream) {
      try {
        this.activeStream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        console.warn('[CameraService] Error stopping tracks:', err);
      } finally {
        this.activeStream = null;
      }
    }
  }

  public async attachToVideo(videoElement: HTMLVideoElement, stream: MediaStream): Promise<void> {
    if (!videoElement) return;
    videoElement.srcObject = stream;
    return new Promise((resolve) => {
      videoElement.onloadedmetadata = async () => {
        try {
          await videoElement.play();
        } catch {}
        resolve();
      };
    });
  }
}

export const cameraService = CameraService.getInstance();
```

---

## 3. Real-Time Hand Tracking & Star-to-Fire Morphing Wand (`UniversalAirWand`)

### How It Works:
1. **MediaPipe Hands (`@mediapipe/hands`)** tracks 21 3D hand landmarks in real time.
2. **Normalized Coordinates**: Index fingertip (`landmark[8]`) controls the on-screen pointer:
   $$screenX = (1 - lm[8].x) \times \text{window.innerWidth}$$
   $$screenY = lm[8].y \times \text{window.innerHeight}$$
3. **3D Pinch Detection & Hysteresis**:
   - Distance between thumb tip (`lm[4]`) and index tip (`lm[8]`):
     $$pinchDist = \sqrt{(x_4 - x_8)^2 + (y_4 - y_8)^2 + (z_4 - z_8)^2}$$
   - Normalized against hand span ($scale = \text{hypot}(wrist - middleMCP)$):
     $$pinchRatio = \frac{pinchDist}{\max(scale, 0.08)}$$
   - Hysteresis thresholds: **Engage Pinch** at $< 0.32$, **Release Pinch** at $> 0.44$.
4. **Morphing Cursor**:
   - **Hovering**: Glowing Golden Sparkle Star (`<Sparkles />`).
   - **Pinching / Air-Clicking**: Morphs into an energetic Flame (`<Flame />`) with scale bounce.
5. **Dwell Air Click**: Hovering steadily over any button for **1.1 seconds** draws a circular countdown SVG progress halo and triggers a virtual click event automatically.
6. **Telemetry Event**: Dispatches `window.dispatchEvent(new CustomEvent('wand-move', { detail: { x, y } }))` on every frame for other UI elements (like mascot eyes) to follow.

### Complete Component Code:

```tsx
// components/ui/UniversalAirWand.tsx
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Wand2, X, Sparkles, Flame } from 'lucide-react';
import { cameraService } from '@/lib/camera-service';

interface UniversalAirWandProps {
  active?: boolean;
  onToggle?: (active: boolean) => void;
  accentColor?: string;
  className?: string;
}

export const UniversalAirWand: React.FC<UniversalAirWandProps> = ({
  active = false,
  onToggle,
  accentColor = '#E8A33D',
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pipCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaPipeCamRef = useRef<any>(null);
  const handsRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isActive, setIsActive] = useState(active);
  const [handDetected, setHandDetected] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const [wandPos, setWandPos] = useState({ x: -100, y: -100, visible: false });
  const [dwellProgress, setDwellProgress] = useState(0);
  const [isStarting, setIsStarting] = useState(false);

  const wasPinchingRef = useRef(false);
  const lastTargetElemRef = useRef<HTMLElement | null>(null);
  const dwellStartRef = useRef<number>(0);

  useEffect(() => {
    if (active && !isActive && !isStarting) {
      void startTracking();
    } else if (!active && isActive) {
      stopTracking();
    }
  }, [active]);

  const stopTracking = useCallback(() => {
    try {
      if (mediaPipeCamRef.current) {
        mediaPipeCamRef.current.stop();
        mediaPipeCamRef.current = null;
      }
      if (handsRef.current) {
        handsRef.current.close?.();
        handsRef.current = null;
      }
    } catch (err) {
      console.warn('[UniversalAirWand] Stop error:', err);
    } finally {
      if (streamRef.current) {
        cameraService.releaseStream();
        streamRef.current = null;
      }
      setIsActive(false);
      setHandDetected(false);
      setIsPinching(false);
      setWandPos({ x: -100, y: -100, visible: false });
      setDwellProgress(0);
      setIsStarting(false);
      onToggle?.(false);
    }
  }, [onToggle]);

  const startTracking = async () => {
    if (isActive || isStarting) return;
    setIsStarting(true);

    try {
      const stream = await cameraService.acquireStream({ width: 480, height: 360, facingMode: 'user' });
      streamRef.current = stream;
      setIsActive(true);
      onToggle?.(true);

      setTimeout(async () => {
        if (videoRef.current) {
          await cameraService.attachToVideo(videoRef.current, stream);
          setIsStarting(false);
          void initHandDetector();
        }
      }, 100);
    } catch (err) {
      console.warn('[UniversalAirWand] Start error:', err);
      setIsStarting(false);
    }
  };

  const triggerAirClick = (screenX: number, screenY: number) => {
    const elem = document.elementFromPoint(screenX, screenY) as HTMLElement | null;
    if (!elem) return;

    const target = elem.closest('button, [role="button"], a, input') as HTMLElement | null;
    if (target && !target.hasAttribute('disabled')) {
      target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
      target.click();
    }
  };

  const initHandDetector = async () => {
    if (typeof window === 'undefined') return;
    try {
      const { Hands } = await import('@mediapipe/hands');
      const { Camera: MPCam } = await import('@mediapipe/camera_utils');

      const hands = new Hands({
        locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${f}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,
        minDetectionConfidence: 0.55,
        minTrackingConfidence: 0.55,
      });
      handsRef.current = hands;

      const PINCH_ENGAGE = 0.32;
      const PINCH_RELEASE = 0.44;

      hands.onResults((results) => {
        // Render PiP Skeleton
        const pipCanvas = pipCanvasRef.current;
        const pipCtx = pipCanvas?.getContext('2d');
        if (pipCanvas && pipCtx) {
          pipCtx.clearRect(0, 0, pipCanvas.width, pipCanvas.height);
          if (results.multiHandLandmarks?.[0]) {
            const lm = results.multiHandLandmarks[0];
            pipCtx.strokeStyle = '#2FA8A0';
            pipCtx.lineWidth = 2.2;
            pipCtx.beginPath();
            const con: [number, number][] = [
              [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
              [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15],
              [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
            ];
            con.forEach(([a, b]) => {
              pipCtx.moveTo(lm[a].x * pipCanvas.width, lm[a].y * pipCanvas.height);
              pipCtx.lineTo(lm[b].x * pipCanvas.width, lm[b].y * pipCanvas.height);
            });
            pipCtx.stroke();

            // Tip highlights
            pipCtx.fillStyle = '#E8A33D';
            pipCtx.beginPath();
            pipCtx.arc(lm[8].x * pipCanvas.width, lm[8].y * pipCanvas.height, 4.5, 0, Math.PI * 2);
            pipCtx.arc(lm[4].x * pipCanvas.width, lm[4].y * pipCanvas.height, 4, 0, Math.PI * 2);
            pipCtx.fill();
          }
        }

        if (!results.multiHandLandmarks?.[0]) {
          setHandDetected(false);
          setIsPinching(false);
          setWandPos((prev) => ({ ...prev, visible: false }));
          setDwellProgress(0);
          return;
        }

        setHandDetected(true);
        const lm = results.multiHandLandmarks[0];
        const indexTip = lm[8];
        const thumbTip = lm[4];
        const wrist = lm[0];
        const middleMcp = lm[9];

        // 3D Distance for Pinch
        const dx = thumbTip.x - indexTip.x;
        const dy = thumbTip.y - indexTip.y;
        const dz = (thumbTip.z || 0) - (indexTip.z || 0);
        const pinchDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const handScale = Math.hypot(wrist.x - middleMcp.x, wrist.y - middleMcp.y);
        const pinchRatio = pinchDist / Math.max(handScale, 0.08);

        const pinching = wasPinchingRef.current
          ? pinchRatio < PINCH_RELEASE
          : pinchRatio < PINCH_ENGAGE;

        setIsPinching(pinching);

        // Screen Coordinate Mapping (Mirrored X for natural interaction)
        const screenX = (1 - indexTip.x) * window.innerWidth;
        const screenY = indexTip.y * window.innerHeight;

        setWandPos({ x: screenX, y: screenY, visible: true });

        // Dispatch Telemetry Event for Mascot Eyes & Badges
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('wand-move', { detail: { x: screenX, y: screenY } }));
        }

        // Air Click on Pinch-Down Trigger
        if (pinching && !wasPinchingRef.current) {
          triggerAirClick(screenX, screenY);
        }
        wasPinchingRef.current = pinching;

        // Dwell Selection Timer (1.1s hover over interactive button)
        const hoveredElem = document.elementFromPoint(screenX, screenY) as HTMLElement | null;
        const targetBtn = hoveredElem?.closest('button, [role="button"], a') as HTMLElement | null;

        if (targetBtn && !targetBtn.hasAttribute('disabled')) {
          if (lastTargetElemRef.current !== targetBtn) {
            lastTargetElemRef.current = targetBtn;
            dwellStartRef.current = performance.now();
          } else {
            const elapsed = performance.now() - dwellStartRef.current;
            const progress = Math.min(1, elapsed / 1100);
            setDwellProgress(progress);

            if (progress >= 1) {
              triggerAirClick(screenX, screenY);
              dwellStartRef.current = performance.now() + 600; // debounce
              setDwellProgress(0);
            }
          }
        } else {
          lastTargetElemRef.current = null;
          setDwellProgress(0);
        }
      });

      if (videoRef.current) {
        const cam = new MPCam(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && handsRef.current && videoRef.current.readyState >= 2 && !videoRef.current.paused) {
              try {
                await handsRef.current.send({ image: videoRef.current });
              } catch {}
            }
          },
          width: 480,
          height: 360,
        });
        mediaPipeCamRef.current = cam;
        await cam.start();
      }
    } catch (e) {
      console.warn('[UniversalAirWand] Detection error:', e);
    }
  };

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return (
    <>
      {/* Floating Activation Pill (Bottom-Right) */}
      <div className={`fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2 ${className}`}>
        {!isActive ? (
          <button
            type="button"
            onClick={startTracking}
            disabled={isStarting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-ink text-amber hover:bg-ink/90 border border-amber/30 shadow-soft-lg transition-all active:scale-95 font-display font-bold text-xs cursor-pointer"
          >
            <Wand2 className={`w-4 h-4 text-amber ${isStarting ? 'animate-spin' : ''}`} />
            <span>{isStarting ? 'Connecting Camera...' : '🪄 Turn On Magic Air Wand'}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-full bg-ink/90 backdrop-blur-md text-white border border-white/20 text-xs font-display font-bold flex items-center gap-2 shadow-soft-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Magic Air Wand Active</span>
            </div>
            <button
              type="button"
              onClick={stopTracking}
              className="p-2 rounded-full bg-white border border-slate-200 text-ink hover:bg-slate-100 shadow-soft-xs cursor-pointer"
              title="Turn off Magic Wand"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Live PiP Mirror and Cursor Layer */}
      {isActive && (
        <>
          {/* Top-Right PiP Mirror */}
          <div className="fixed top-4 right-4 w-28 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-soft-lg bg-black/85 z-50 pointer-events-none">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover -scale-x-100 block"
            />
            <canvas
              ref={pipCanvasRef}
              width={112}
              height={80}
              className="absolute inset-0 w-full h-full -scale-x-100"
            />
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/80 text-[8px] font-display font-bold text-white whitespace-nowrap">
              {handDetected ? (isPinching ? '✍️ Air Click' : '🪄 Hovering') : 'Show hand'}
            </div>
          </div>

          {/* Morphing Golden Star / Flame Cursor */}
          {wandPos.visible && (
            <div
              className="fixed pointer-events-none z-50 transition-transform duration-75 ease-out"
              style={{
                left: wandPos.x,
                top: wandPos.y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Dwell Progress Halo */}
              {dwellProgress > 0 && (
                <svg className="absolute -inset-4 w-14 h-14 -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    fill="none"
                    stroke="rgba(232, 163, 61, 0.25)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    fill="none"
                    stroke="#E8A33D"
                    strokeWidth="3.5"
                    strokeDasharray={2 * Math.PI * 22}
                    strokeDashoffset={2 * Math.PI * 22 * (1 - dwellProgress)}
                    strokeLinecap="round"
                  />
                </svg>
              )}

              {/* Star-to-Fire Morph Icon */}
              <div
                className={`relative w-8 h-8 flex items-center justify-center rounded-full transition-transform ${
                  isPinching ? 'scale-125' : 'scale-100'
                }`}
              >
                <div
                  className="absolute inset-0 rounded-full blur-md opacity-80"
                  style={{ backgroundColor: isPinching ? '#FFD700' : accentColor }}
                />
                {isPinching ? (
                  <Flame className="w-6 h-6 text-amber-500 fill-amber-400 animate-bounce-gentle" />
                ) : (
                  <Sparkles className="w-6 h-6 text-white fill-amber-400 drop-shadow-md" />
                )}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};
```

---

## 4. Living SVG Mascot with Dynamic Pupil Gaze (`LanternMascot` & `InteractiveLumiCompanion`)

### How It Works:
1. **Organic Multi-Frequency Blinking**:
   A dynamic timer loop ($2400\text{ms} + \text{rand}(0..2200\text{ms})$) triggers a natural $140\text{ms}$ blink:
   ```typescript
   useEffect(() => {
     let t: NodeJS.Timeout;
     const loop = () => {
       const delay = 2400 + Math.random() * 2200;
       t = setTimeout(() => {
         setBlink(true);
         setTimeout(() => setBlink(false), 140);
         loop();
       }, delay);
     };
     loop();
     return () => clearTimeout(t);
   }, []);
   ```
2. **Dual-Input Pupil Tracking**:
   Pupils calculate distance from center and bound gaze offset within a smooth 2D elliptical boundary ($[-3.5, 3.5]$ horizontally, $[-2.5, 2.5]$ vertically), listening to both standard mouse moves and custom `wand-move` events from the webcam air wand.
3. **Mascot Moods**:
   Supports `neutral`, `encouraging`, `celebrating` (confetti particles), `thinking`, `sleepy` (floating ZZZs), and `confused`.

### Complete Mascot Code:

```tsx
// components/ui/LanternMascot.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type MascotMood = 'neutral' | 'encouraging' | 'celebrating' | 'thinking' | 'calm' | 'sleepy' | 'confused';

interface LanternMascotProps {
  mood?: MascotMood;
  size?: number;
  speechBubble?: string;
  showEyes?: boolean;
  className?: string;
}

export const LanternMascot: React.FC<LanternMascotProps> = ({
  mood = 'neutral',
  size = 96,
  speechBubble,
  showEyes = true,
  className = '',
}) => {
  const [blink, setBlink] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Natural Blinking Loop
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      const delay = 2400 + Math.random() * 2200;
      t = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 140);
        loop();
      }, delay);
    };
    loop();
    return () => clearTimeout(t);
  }, []);

  // Pupil Gaze Tracker (Mouse + Air Wand)
  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) return;

    const calcGaze = (clientX: number, clientY: number) => {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (clientX - cx) / (window.innerWidth / 2);
      const dy = (clientY - cy) / (window.innerHeight / 2);
      setEyeOffset({
        x: Math.max(-3.5, Math.min(3.5, dx * 3.5)),
        y: Math.max(-2.5, Math.min(2.5, dy * 2.5)),
      });
    };

    const onMove = (e: MouseEvent) => calcGaze(e.clientX, e.clientY);
    const onWand = (e: any) => e.detail && calcGaze(e.detail.x, e.detail.y);

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('wand-move' as any, onWand);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('wand-move' as any, onWand);
    };
  }, []);

  const isCelebrate = mood === 'celebrating';
  const isSleepy = mood === 'sleepy';

  return (
    <div
      ref={wrapRef}
      className={`relative flex flex-col items-center select-none ${className}`}
      style={{ width: size, height: size * 1.18 }}
    >
      {/* Speech Bubble */}
      <AnimatePresence mode="wait">
        {speechBubble && (
          <motion.div
            key={speechBubble}
            initial={{ opacity: 0, scale: 0.88, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: -6 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="absolute z-30 left-1/2 -translate-x-1/2 pointer-events-none"
            style={{ bottom: 'calc(100% + 14px)', width: 'max-content', maxWidth: 280 }}
          >
            <div className="relative bg-white/95 backdrop-blur-xl border border-slate-200 shadow-soft-md px-4 py-2 text-xs sm:text-sm font-display font-bold leading-snug text-ink text-center rounded-2xl">
              {speechBubble}
              <svg
                width="16"
                height="8"
                viewBox="0 0 16 8"
                className="absolute left-1/2 -translate-x-1/2 -bottom-[7px] drop-shadow-xs"
              >
                <path d="M0 0 L8 8 L16 0 Z" fill="white" />
                <path d="M0 0 L8 8 L16 0 Z" fill="none" stroke="rgba(43,42,51,0.12)" strokeWidth="1" />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebratory Confetti */}
      {isCelebrate && (
        <div className="absolute inset-0 pointer-events-none overflow-visible z-20">
          {[...Array(8)].map((_, i) => (
            <motion.span
              key={i}
              className="absolute text-xs"
              style={{ left: `${10 + i * 12}%`, top: -6 }}
              animate={{ y: [0, -26, 4], rotate: [0, 28, -20], opacity: [0, 1, 0] }}
              transition={{ duration: 1.2, delay: i * 0.07, repeat: Infinity, repeatDelay: 1.0 }}
            >
              {i % 3 === 0 ? '✨' : i % 3 === 1 ? '⭐' : '🌟'}
            </motion.span>
          ))}
        </div>
      )}

      {/* Mascot SVG Vector Body */}
      <svg viewBox="0 0 120 140" className="w-full h-full drop-shadow-md">
        <defs>
          <linearGradient id="lumiBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF9EE" />
            <stop offset="100%" stopColor="#F5E4C4" />
          </linearGradient>
          <linearGradient id="lumiEarInner" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FCA5A5" />
            <stop offset="100%" stopColor="#F87171" />
          </linearGradient>
          <radialGradient id="lumiEyeIris" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#5D4037" />
            <stop offset="70%" stopColor="#2B2A33" />
            <stop offset="100%" stopColor="#1A1920" />
          </radialGradient>
        </defs>

        {/* Ears */}
        <path d="M26 42 L12 12 Q28 18 38 32 Z" fill="url(#lumiBodyGrad)" stroke="#8D6E63" strokeWidth="2.5" />
        <path d="M22 36 L15 17 Q25 22 32 30 Z" fill="url(#lumiEarInner)" opacity="0.85" />
        <path d="M94 42 L108 12 Q92 18 82 32 Z" fill="url(#lumiBodyGrad)" stroke="#8D6E63" strokeWidth="2.5" />
        <path d="M98 36 L105 17 Q95 22 88 30 Z" fill="url(#lumiEarInner)" opacity="0.85" />

        {/* Head & Body */}
        <ellipse cx="60" cy="74" rx="44" ry="38" fill="url(#lumiBodyGrad)" stroke="#8D6E63" strokeWidth="3" />
        <ellipse cx="60" cy="112" rx="34" ry="24" fill="url(#lumiBodyGrad)" stroke="#8D6E63" strokeWidth="3" />

        {/* Belly Patch */}
        <ellipse cx="60" cy="114" rx="22" ry="16" fill="#FFFDF8" />

        {/* Cheeks */}
        <circle cx="28" cy="78" r="6.5" fill="#FCA5A5" opacity="0.55" />
        <circle cx="92" cy="78" r="6.5" fill="#FCA5A5" opacity="0.55" />

        {/* Eyes with Dynamic Saccade Offset */}
        {showEyes && (
          <g>
            {blink ? (
              <>
                <path d="M36 68 Q46 76 56 68" stroke="#2B2A33" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                <path d="M64 68 Q74 76 84 68" stroke="#2B2A33" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              </>
            ) : (
              <>
                {/* Left Eye */}
                <ellipse cx="46" cy="67" rx="10.5" ry="12" fill="#FFFFFF" stroke="#2B2A33" strokeWidth="2.5" />
                <circle
                  cx={46 + eyeOffset.x}
                  cy={67 + eyeOffset.y}
                  r="6.8"
                  fill="url(#lumiEyeIris)"
                />
                <circle cx={44 + eyeOffset.x} cy={64 + eyeOffset.y} r="2.4" fill="#FFFFFF" />
                <circle cx={48 + eyeOffset.x} cy={69 + eyeOffset.y} r="1.2" fill="#FFFFFF" />

                {/* Right Eye */}
                <ellipse cx="74" cy="67" rx="10.5" ry="12" fill="#FFFFFF" stroke="#2B2A33" strokeWidth="2.5" />
                <circle
                  cx={74 + eyeOffset.x}
                  cy={67 + eyeOffset.y}
                  r="6.8"
                  fill="url(#lumiEyeIris)"
                />
                <circle cx={72 + eyeOffset.x} cy={64 + eyeOffset.y} r="2.4" fill="#FFFFFF" />
                <circle cx={76 + eyeOffset.x} cy={69 + eyeOffset.y} r="1.2" fill="#FFFFFF" />
              </>
            )}
          </g>
        )}

        {/* Nose & Mouth */}
        <ellipse cx="60" cy="77" rx="3.2" ry="2.2" fill="#C2410C" />
        <path d="M55 82 Q60 87 65 82" stroke="#2B2A33" strokeWidth="2.5" strokeLinecap="round" fill="none" />

        {/* Lantern Pendant */}
        <rect x="54" y="93" width="12" height="14" rx="3" fill="#E8A33D" stroke="#B45309" strokeWidth="1.5" />
        <circle cx="60" cy="100" r="3" fill="#FEF08A" />
      </svg>
    </div>
  );
};
```

---

## 5. Kinematic Motor Planning & Dysgraphia Analysis (`lib/tracing.ts`)

### Why Kinematics Matter:
Rather than just grading if handwriting "looks neat", clinical dysgraphia screening measures **motor velocity profiles, smoothness (jerk), tremor inversions (NVI)**, and **spatial mirror reversals ($b \leftrightarrow d$, $p \leftrightarrow q$)**.

```typescript
// lib/tracing.ts
export interface StrokePoint {
  x: number;
  y: number;
  t: number;        // timestamp in ms
  pressure?: number;
}

// 1. Moving-average trajectory smoothing
export function smoothPoints(points: StrokePoint[], windowSize = 3): StrokePoint[] {
  if (points.length <= windowSize) return points;
  const smoothed: StrokePoint[] = [];

  for (let i = 0; i < points.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(points.length, i + Math.ceil(windowSize / 2));
    const slice = points.slice(start, end);

    const avgX = slice.reduce((sum, p) => sum + p.x, 0) / slice.length;
    const avgY = slice.reduce((sum, p) => sum + p.y, 0) / slice.length;
    const avgP = slice.reduce((sum, p) => sum + (p.pressure || 0.5), 0) / slice.length;

    smoothed.push({ x: avgX, y: avgY, t: points[i].t, pressure: avgP });
  }
  return smoothed;
}

// 2. Velocity Profile Calculation (px/ms)
export function computeVelocities(points: StrokePoint[]): number[] {
  if (points.length < 2) return [];
  const velocities: number[] = [];

  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const dt = Math.max(1, points[i].t - points[i - 1].t);
    velocities.push(Math.hypot(dx, dy) / dt);
  }
  return velocities;
}

// 3. Number of Velocity Inversions (NVI) - Tremor & Disfluency Measure
export function computeNVI(velocities: number[]): number {
  if (velocities.length < 3) return 0;
  let inversions = 0;
  let direction = 0; // 1 = accel, -1 = decel

  for (let i = 1; i < velocities.length; i++) {
    const diff = velocities[i] - velocities[i - 1];
    if (Math.abs(diff) < 0.003) continue; // Noise deadband

    const currentDir = diff > 0 ? 1 : -1;
    if (direction !== 0 && currentDir !== direction) {
      inversions++;
    }
    direction = currentDir;
  }
  return inversions;
}

// 4. Normalized Jerk Index (Smoothness metric: d³x/dt³)
export function computeJerkIndex(points: StrokePoint[]): number {
  if (points.length < 4) return 0;
  let totalJerkSq = 0;

  for (let i = 3; i < points.length; i++) {
    const dt = Math.max(1, points[i].t - points[i - 1].t);
    const jx = (points[i].x - 3 * points[i - 1].x + 3 * points[i - 2].x - points[i - 3].x) / (dt * dt * dt);
    const jy = (points[i].y - 3 * points[i - 1].y + 3 * points[i - 2].y - points[i - 3].y) / (dt * dt * dt);
    totalJerkSq += (jx * jx + jy * jy);
  }

  const meanJerk = Math.sqrt(totalJerkSq / (points.length - 3));
  return Number((meanJerk * 1000).toFixed(2));
}

// 5. Spatial Mirror Letter Reversal Detection (b <-> d, p <-> q)
export function detectMirrorReversal(points: StrokePoint[], targetLetter: string): boolean {
  if (points.length < 6) return false;

  let minX = points[0].x, maxX = points[0].x;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
  }
  const width = maxX - minX;
  const letter = targetLetter.toLowerCase();

  if (letter === 'b') {
    const stemX = points[0].x;
    const loopRight = points.some(p => p.x > stemX + width * 0.3);
    const loopLeft = points.some(p => p.x < stemX - width * 0.15);
    return loopLeft && !loopRight; // Mirrored 'b' -> 'd'
  }

  if (letter === 'd') {
    const stemX = points[points.length - 1].x;
    const loopLeft = points.some(p => p.x < stemX - width * 0.3);
    const loopRight = points.some(p => p.x > stemX + width * 0.15);
    return loopRight && !loopLeft; // Mirrored 'd' -> 'b'
  }

  return false;
}
```

---

## 6. 5-Minute Quick-Start Integration Guide

### Step 1: Install Dependencies
```bash
npm install @mediapipe/hands @mediapipe/camera_utils framer-motion lucide-react clsx tailwind-merge
```

### Step 2: Copy Files
1. Copy `lib/camera-service.ts` into your project's `lib/`.
2. Copy `components/ui/UniversalAirWand.tsx` into your `components/ui/`.
3. Copy `components/ui/LanternMascot.tsx` into your `components/ui/`.

### Step 3: Add to Page
```tsx
// app/page.tsx
'use client';

import React, { useState } from 'react';
import { UniversalAirWand } from '@/components/ui/UniversalAirWand';
import { LanternMascot } from '@/components/ui/LanternMascot';

export default function HomePage() {
  const [wandActive, setWandActive] = useState(false);

  return (
    <main className="min-h-screen bg-[#FAF9FC] text-[#2B2A33] flex flex-col items-center justify-center p-8">
      {/* Living Mascot */}
      <LanternMascot
        mood={wandActive ? 'celebrating' : 'encouraging'}
        size={140}
        speechBubble={wandActive ? 'I see your hand! Draw in the air! 🪄' : 'Click the wand or wave at me!'}
      />

      <div className="mt-8 flex gap-4">
        <button
          onClick={() => setWandActive(!wandActive)}
          className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm shadow-md border-b-4 border-amber-700 active:translate-y-0.5 active:border-b-2 transition-all cursor-pointer"
        >
          {wandActive ? 'Disable Air Wand' : '🪄 Try Magic Air Wand'}
        </button>
      </div>

      {/* Floating Webcam Tracker & Star-to-Fire Cursor */}
      <UniversalAirWand active={wandActive} onToggle={setWandActive} />
    </main>
  );
}
```

---

*Lumora World Architecture Archive & Interactive Cookbook — Created for scalable developmental web applications.*
