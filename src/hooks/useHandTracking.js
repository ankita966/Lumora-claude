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

/**
 * Tracks a single hand's index-fingertip position via the device camera.
 * Falls back cleanly (fingertip = null, fallback = true) if the camera or
 * model can't be used, so callers can switch to mouse/touch input instead.
 *
 * @param {boolean} active — only runs the camera + model while true
 * @returns {{
 *   videoRef: React.RefObject,
 *   point: {x:number, y:number} | null,   // normalized 0..1, mirrored for natural motion
 *   pinching: boolean,
 *   status: 'idle'|'loading'|'ready'|'denied'|'error',
 * }}
 */
export function useHandTracking(active) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const [point, setPoint] = useState(null);
  const [pinching, setPinching] = useState(false);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;

    async function start() {
      setStatus('loading');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 480, height: 360, facingMode: 'user' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = document.createElement('video');
        video.playsInline = true;
        video.muted = true;
        video.srcObject = stream;
        await video.play();
        videoRef.current = video;

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
              // mirror x so moving your hand right moves the cursor right
              const mx = 1 - tip.x;
              setPoint({ x: mx, y: tip.y });
              const dist = Math.hypot(tip.x - thumb.x, tip.y - thumb.y);
              setPinching(dist < 0.055);
            } else {
              setPoint(null);
              setPinching(false);
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
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      setPoint(null);
      setStatus('idle');
    };
  }, [active]);

  return { videoRef, point, pinching, status };
}
