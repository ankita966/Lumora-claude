import { useEffect, useRef, useState, useCallback } from 'react';

// Loaded lazily so pages without camera requirements do not load vision WASM.
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

// 1D Kalman Filter for zero-jitter coordinates
class KalmanFilter1D {
  constructor(processNoise = 0.005, measurementNoise = 0.03) {
    this.q = processNoise;
    this.r = measurementNoise;
    this.x = 0.5;
    this.p = 1.0;
    this.k = 0;
  }
  filter(measurement) {
    this.p = this.p + this.q;
    this.k = this.p / (this.p + this.r);
    this.x = this.x + this.k * (measurement - this.x);
    this.p = (1 - this.k) * this.p;
    return this.x;
  }
}

/**
 * Geometric Multi-Gesture Classifier.
 * Identifies 6 core interactive gestures:
 * 1. 'point'      - 🌟 Star Pointer (Index extended, others curled)
 * 2. 'pinch'      - 🤏 Magic Pinch / Cast (Thumb + Index tip contact)
 * 3. 'palm'       - ✋ Palm Shield / Erase (All 5 fingers extended)
 * 4. 'fist'       - ✊ Earth Fist / Stamp (All fingers curled)
 * 5. 'peace'      - ✌️ Dual Wand Swipe (Index + Middle extended)
 * 6. 'thumbs_up'  - 👍 Thumbs Up (Thumb upright, fingers curled)
 */
function classifyGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) return 'none';

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const indexPip = landmarks[6];
  const middleTip = landmarks[12];
  const middlePip = landmarks[10];
  const ringTip = landmarks[16];
  const ringPip = landmarks[14];
  const pinkyTip = landmarks[20];
  const pinkyPip = landmarks[18];

  // Distances to wrist to detect extension
  const distToWrist = (lm) => Math.hypot(lm.x - wrist.x, lm.y - wrist.y);
  const isExtended = (tip, pip) => distToWrist(tip) > distToWrist(pip) * 1.15;
  const isCurled = (tip, pip) => distToWrist(tip) < distToWrist(pip) * 1.05;

  const indexExt = isExtended(indexTip, indexPip);
  const middleExt = isExtended(middleTip, middlePip);
  const ringExt = isExtended(ringTip, ringPip);
  const pinkyExt = isExtended(pinkyTip, pinkyPip);

  const indexThumbDist = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);

  // 1. Pinch Check (Highest priority when thumb and index touch)
  if (indexThumbDist < 0.055) {
    return 'pinch';
  }

  // 2. Thumbs Up Check (Thumb pointing upward relative to wrist, other fingers curled)
  const thumbUpward = thumbTip.y < landmarks[3].y && thumbTip.y < landmarks[2].y;
  if (thumbUpward && isCurled(indexTip, indexPip) && isCurled(middleTip, middlePip) && isCurled(ringTip, ringPip)) {
    return 'thumbs_up';
  }

  // 3. Palm Check (All fingers extended)
  if (indexExt && middleExt && ringExt && pinkyExt) {
    return 'palm';
  }

  // 4. Fist Check (All fingers curled)
  if (isCurled(indexTip, indexPip) && isCurled(middleTip, middlePip) && isCurled(ringTip, ringPip) && isCurled(pinkyTip, pinkyPip)) {
    return 'fist';
  }

  // 5. Peace / Dual Wand Check (Index + Middle extended, others curled)
  if (indexExt && middleExt && !ringExt && !pinkyExt) {
    return 'peace';
  }

  // 6. Pointing / Star Wand Check (Index extended, others curled)
  if (indexExt && !middleExt && !ringExt && !pinkyExt) {
    return 'point';
  }

  return 'point'; // Default wand tracking
}

const GESTURE_LABELS = {
  point: '🌟 Star Wand',
  pinch: '🤏 Magic Pinch',
  palm: '✋ Palm Shield',
  fist: '✊ Earth Fist',
  peace: '✌️ Dual Swipe',
  thumbs_up: '👍 Ready / Confirm',
  none: '',
};

export function useHandTracking(active) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  const kalmanX = useRef(new KalmanFilter1D(0.005, 0.025));
  const kalmanY = useRef(new KalmanFilter1D(0.005, 0.025));
  const smoothedRef = useRef({ x: 0.5, y: 0.5 });
  const rawCoordsRef = useRef({ x: 0.5, y: 0.5 });
  const lastGestureRef = useRef('none');
  const gestureStartTimeRef = useRef(0);
  const lastStateFlushRef = useRef(0);

  const [point, setPoint] = useState(null);
  const [rawPoint, setRawPoint] = useState(null);
  const [gesture, setGesture] = useState('none');
  const [gestureLabel, setGestureLabel] = useState('');
  const [gestureHoldMs, setGestureHoldMs] = useState(0);
  const [pinching, setPinching] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [status, setStatus] = useState('idle');

  const SMOOTH_FACTOR = 0.35;
  const PINCH_RELEASE_THRESHOLD = 0.08;
  const isPinchingRef = useRef(false);

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

        const loop = (now) => {
          if (cancelled || !videoRef.current) return;
          try {
            const result = landmarker.detectForVideo(videoRef.current, now);
            if (result?.landmarks?.length) {
              const lm = result.landmarks[0];
              const tip = lm[8]; // index fingertip
              const thumb = lm[4];

              // Mirror x for natural cursor steering
              const rawX = 1 - tip.x;
              const rawY = tip.y;
              rawCoordsRef.current = { x: rawX, y: rawY };

              // 1. Kalman Filtering for jitter suppression
              const kx = kalmanX.current.filter(rawX);
              const ky = kalmanY.current.filter(rawY);

              // 2. Exponential Lerp for smooth visual interpolation
              const prev = smoothedRef.current;
              const sx = lerp(prev.x, kx, 1 - SMOOTH_FACTOR);
              const sy = lerp(prev.y, ky, 1 - SMOOTH_FACTOR);
              smoothedRef.current = { x: sx, y: sy };

              // Gesture classification
              const detectedGesture = classifyGesture(lm);
              const dist = Math.hypot(tip.x - thumb.x, tip.y - thumb.y);

              // Hysteresis for pinch stability
              if (dist < 0.055) {
                isPinchingRef.current = true;
              } else if (dist > PINCH_RELEASE_THRESHOLD) {
                isPinchingRef.current = false;
              }

              // Track gesture hold duration
              if (detectedGesture !== lastGestureRef.current) {
                lastGestureRef.current = detectedGesture;
                gestureStartTimeRef.current = now;
              }
              const holdDuration = Math.round(now - gestureStartTimeRef.current);

              const vis = Math.min(1, tip.visibility ?? 0.85);

              // Batch/throttle React state updates to ~30 FPS to eliminate UI thrashing
              if (now - lastStateFlushRef.current > 32) {
                lastStateFlushRef.current = now;
                setPoint({ x: sx, y: sy });
                setRawPoint({ x: rawX, y: rawY });
                setHandDetected(true);
                setConfidence(vis);
                setPinching(isPinchingRef.current);
                setGesture(detectedGesture);
                setGestureLabel(GESTURE_LABELS[detectedGesture] || '');
                setGestureHoldMs(holdDuration);
              }
            } else {
              if (now - lastStateFlushRef.current > 64) {
                lastStateFlushRef.current = now;
                setPoint(null);
                setRawPoint(null);
                setHandDetected(false);
                setConfidence(0);
                setPinching(false);
                setGesture('none');
                setGestureLabel('');
                setGestureHoldMs(0);
              }
            }
          } catch {
            // Transient video frame error — skip frame
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
      setGesture('none');
    };
  }, [active]);

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

  return {
    videoRef,
    point,
    rawPoint,
    smoothedRef,
    gesture,
    gestureLabel,
    gestureHoldMs,
    pinching,
    handDetected,
    confidence,
    status,
    stopCamera,
  };
}
