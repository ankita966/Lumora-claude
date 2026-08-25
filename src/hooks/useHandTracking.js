import { useEffect, useRef, useState, useCallback } from 'react';

// Loaded lazily so a page that never opens a camera-based world never pays
// the cost of fetching the vision WASM bundle.
let handLandmarkerPromise = null;
async function getHandLandmarker() {
  if (!handLandmarkerPromise) {
    handLandmarkerPromise = (async () => {
      const { HandLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );
      return HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
      });
    })();
  }
  return handLandmarkerPromise;
}

// Exponential smoothing helper
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Tracks a single hand's index-fingertip position via the device camera.
 * Falls back cleanly (fingertip = null, fallback = true) if the camera or
 * model can't be used, so callers can switch to mouse/touch input instead.
 *
 * Enhanced with smoothing/interpolation for stable cursor movement.
 * Stream is created once and reused across round changes.
 *
 * @param {boolean} active — only runs the camera + model while true
 * @returns {{
 *   videoRef: React.RefObject,
 *   point: {x:number, y:number} | null,   // normalized 0..1, mirrored for natural motion
 *   rawPoint: {x:number, y:number} | null, // unsmoothed for debug
 *   pinching: boolean,
 *   handDetected: boolean,
 *   confidence: number,
 *   status: 'idle'|'loading'|'ready'|'denied'|'error',
 * }}
 */
export function useHandTracking(active) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const smoothedRef = useRef({ x: 0.5, y: 0.5 });
  const confidenceRef = useRef(0);
  const [point, setPoint] = useState(null);
  const [rawPoint, setRawPoint] = useState(null);
  const [pinching, setPinching] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [status, setStatus] = useState('idle');

  // Smoothing factor: 0 = no smoothing (instant), 1 = never moves
  // 0.35 gives responsive but stable feel
  const SMOOTH_FACTOR = 0.35;
  const PINCH_THRESHOLD = 0.06;

  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;

    const releaseCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
    };

    async function start() {
      setStatus('loading');
      try {
        // MagicMirror keeps this React-mounted element mounted so this is the
        // one video used both for display and MediaPipe frame processing.
        const video = videoRef.current;
        if (!video) {
          setStatus('error');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        video.srcObject = stream;
        await video.play();

        const landmarker = await getHandLandmarker();
        if (cancelled) return;
        setStatus('ready');

        const loop = () => {
          if (cancelled || !videoRef.current) return;
          try {
            const now = performance.now();
            const result = landmarker.detectForVideo(videoRef.current, now);
            if (result?.landmarks?.length) {
              const lm = result.landmarks[0];
              const tip = lm[8]; // index fingertip
              const thumb = lm[4];

              // Mirror x so moving your hand right moves the cursor right
              const mx = 1 - tip.x;
              const rawX = mx;
              const rawY = tip.y;

              // Exponential smoothing for stability
              const prev = smoothedRef.current;
              const sx = lerp(prev.x, rawX, 1 - SMOOTH_FACTOR);
              const sy = lerp(prev.y, rawY, 1 - SMOOTH_FACTOR);
              smoothedRef.current = { x: sx, y: sy };

              // Confidence based on landmark visibility
              const vis = tip.visibility ?? 0.8;
              confidenceRef.current = Math.min(1, vis);

              setPoint({ x: sx, y: sy });
              setRawPoint({ x: rawX, y: rawY });
              setHandDetected(true);
              setConfidence(confidenceRef.current);

              const dist = Math.hypot(tip.x - thumb.x, tip.y - thumb.y);
              setPinching(dist < PINCH_THRESHOLD);
            } else {
              setPoint(null);
              setRawPoint(null);
              setHandDetected(false);
              setConfidence(0);
              setPinching(false);
              // Slowly drift cursor back to center when no hand
              smoothedRef.current = {
                x: lerp(smoothedRef.current.x, 0.5, 0.02),
                y: lerp(smoothedRef.current.y, 0.5, 0.02),
              };
            }
          } catch {
            // transient detection error — skip this frame
          }
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      } catch (err) {
        if (!cancelled) {
          setStatus(err?.name === 'NotAllowedError' ? 'denied' : 'error');
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      releaseCamera();
      setPoint(null);
      setRawPoint(null);
      setHandDetected(false);
      setConfidence(0);
      setStatus('idle');
    };
  }, [active]);

  // Expose a stop function for when we truly want to release the camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setStatus('idle');
  }, []);

  return { videoRef, point, rawPoint, pinching, handDetected, confidence, status, stopCamera };
}
