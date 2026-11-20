import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import TopBar from '../../components/TopBar';
import RoundHeader from '../../components/RoundHeader';
import Mascot from '../../components/Mascot';
import WorldCompleteOverlay from '../../components/WorldCompleteOverlay';
import HandCursorLayer from '../../components/HandCursorLayer';
import { useWorldFlow } from '../../hooks/useWorldFlow';
import { useCursor } from '../../hooks/useCursor';
import { useSpeechRecognition, speak, wordOverlapScore, isSpeechRecognitionSupported } from '../../hooks/useSpeechRecognition';
import { WORLDS } from '../../data/worlds';

const COLOR = WORLDS.soundForest.color;

// word: label, emoji, starting phoneme
const WORD_BANK = [
  { word: 'Rabbit', emoji: '🐰', sound: '/r/' },
  { word: 'Rocket', emoji: '🚀', sound: '/r/' },
  { word: 'Rainbow', emoji: '🌈', sound: '/r/' },
  { word: 'Robot', emoji: '🤖', sound: '/r/' },
  { word: 'Lion', emoji: '🦁', sound: '/l/' },
  { word: 'Frog', emoji: '🐸', sound: '/f/' },
  { word: 'Cupcake', emoji: '🧁', sound: '/k/' },
  { word: 'Sun', emoji: '☀️', sound: '/s/' },
  { word: 'Star', emoji: '⭐', sound: '/s/' },
  { word: 'Moon', emoji: '🌙', sound: '/m/' },
  { word: 'Bat', emoji: '🦇', sound: '/b/' },
  { word: 'Duck', emoji: '🦆', sound: '/d/' },
  { word: 'Cat', emoji: '🐱', sound: '/k/' },
  { word: 'Fish', emoji: '🐟', sound: '/f/' },
  { word: 'Apple', emoji: '🍎', sound: '/a/' },
  { word: 'Banana', emoji: '🍌', sound: '/b/' },
  { word: 'Dog', emoji: '🐶', sound: '/d/' },
  { word: 'Elephant', emoji: '🐘', sound: '/e/' },
];

const SOUND_SLASH_TARGET = { sound: '/r/', label: '/R/' };
const SOUND_SLASH_CORRECT = [
  { word: 'Rabbit', emoji: '🐰', sound: '/r/', kind: 'correct' },
  { word: 'Rainbow', emoji: '🌈', sound: '/r/', kind: 'correct' },
  { word: 'Robot', emoji: '🤖', sound: '/r/', kind: 'correct' },
];
const SOUND_SLASH_INCORRECT = [
  { word: 'Apple', emoji: '🍎', sound: '/a/', kind: 'incorrect' },
  { word: 'Banana', emoji: '🍌', sound: '/b/', kind: 'incorrect' },
];

function shuffled(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function segmentIntersectsCircle(start, end, center, radius) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const projection = lengthSquared === 0
    ? 0
    : Math.max(0, Math.min(1, ((center.x - start.x) * dx + (center.y - start.y) * dy) / lengthSquared));
  const nearestX = start.x + dx * projection;
  const nearestY = start.y + dy * projection;
  return Math.hypot(center.x - nearestX, center.y - nearestY) <= radius;
}

export default function SoundForest() {
  const flow = useWorldFlow({ worldKey: 'soundForest', skill: 'sound', xpPerRound: 150, worldBonus: 200 });
  const playAreaRef = useRef(null);
  // This one cursor/camera stays mounted for all five forest rounds.
  const cursor = useCursor(playAreaRef, true);

  const roundConfigs = [
    { title: 'ROUND 1 — SLASH QUEST', comp: SoundSlash },
    { title: 'ROUND 2 — SOUND MATCH', comp: SoundMatch },
    { title: 'ROUND 3 — PHONEME BLEND', comp: PhonemeBlend },
    { title: 'ROUND 4 — PRONOUNCE IT', comp: PronounceIt },
    { title: 'ROUND 5 — WORD RECOGNITION', comp: WordRecognitionRound },
  ];
  const current = roundConfigs[flow.roundIndex];
  const RoundComp = current.comp;

  return (
    <div>
      <TopBar worldColor={COLOR} roundCount={flow.totalRounds} currentRound={flow.roundNumber} />
      <div className="game-shell">
        {!flow.completed && (
          <>
            <RoundHeader title={current.title} subtitle={RoundComp.subtitle} color={COLOR} />
            <div className="play-area sound-forest-area" ref={playAreaRef} style={{ '--world-color': COLOR }}>
              <HandCursorLayer videoRef={cursor.videoRef} pixel={cursor.pixel} cameraStatus={cursor.cameraStatus} handDetected={cursor.handDetected} pinching={cursor.pinching} interacting={cursor.pinching} color="#4fd8ff" showMirror showCursor />
              <RoundComp key={flow.roundIndex} cursor={cursor} onSolved={(acc, msg) => flow.completeRound(acc, msg)} onWrong={flow.registerAttempt} />
            </div>
          </>
        )}
        {flow.completed && (
          <WorldCompleteOverlay
            title="🌲 SOUND FOREST MASTER!"
            subtitle="You completed all 5 rounds of Sound & Phoneme Quests!"
            color={COLOR}
            onRestart={flow.restart}
          />
        )}
      </div>
      <Mascot color={COLOR} icon="🐯" message={flow.message} />
    </div>
  );
}

/* ====================== Round 1: Sound Slash ======================
   Real Fruit-Ninja-style hand-controlled slash mechanic.
   Objects float through the game world. The child uses their REAL HAND.
   The cyan magic cursor follows their fingertip.
   When the cursor trajectory intersects an object → object slices/splits. */
function SoundSlash({ cursor, onSolved, onWrong }) {
  const containerRef = useRef(null);
  const speech = useSpeechRecognition({ lang: 'en-US' });

  const target = SOUND_SLASH_TARGET;
  const matching = SOUND_SLASH_CORRECT;
  const others = SOUND_SLASH_INCORRECT;

  const goal = Math.min(4, matching.length);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [objects, setObjects] = useState([]);
  const [slices, setSlices] = useState([]); // slice particle effects
  const [xpBursts, setXpBursts] = useState([]);
  const [slashSegment, setSlashSegment] = useState(null);
  const [slashHits, setSlashHits] = useState([]);
  const [showOnboard, setShowOnboard] = useState(true);
  const [goSignal, setGoSignal] = useState(false);
  const [phase, setPhase] = useState('slash'); // slash | speak
  const previousCursorRef = useRef(null);
  const currentCursorRef = useRef(null);
  const slashSequenceRef = useRef(0);
  const processedSlashRef = useRef(0);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const objectIdRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const containerSizeRef = useRef({ w: 880, h: 380 });

  useEffect(() => {
    speak('Slash everything that starts with R!');
    // Show onboarding then GO!
    const t1 = setTimeout(() => {
      setShowOnboard(false);
      setGoSignal(true);
    }, 2800);
    const t2 = setTimeout(() => setGoSignal(false), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [target]);

  // Track container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      containerSizeRef.current = { w: rect.width, h: rect.height };
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Spawn objects
  useEffect(() => {
    if (showOnboard || phase !== 'slash') return undefined;
    let cancelled = false;
    function spawn(itemOverride) {
      if (cancelled) return;
      const useMatch = Math.random() < 0.6;
      const bank = useMatch ? matching : others;
      const item = itemOverride || bank[Math.floor(Math.random() * bank.length)];
      const id = ++objectIdRef.current;
      const w = containerSizeRef.current.w;
      const h = containerSizeRef.current.h;
      setObjects((prev) => [
        ...prev,
        {
          ...item,
          id,
          x: 92 + Math.random() * Math.max(1, w - 184),
          y: 82 + Math.random() * Math.max(1, h - 164),
          speed: 0.18 + Math.random() * 0.18,
          rotation: Math.random() * 8 - 4,
          wobble: Math.random() * Math.PI * 2,
          born: Date.now(),
        },
      ]);
    }
    [...matching, ...others].forEach(spawn);
    const interval = setInterval(spawn, 1800);
    return () => { cancelled = true; clearInterval(interval); };
  }, [showOnboard, phase, matching, others]);

  // Animate objects upward
  useEffect(() => {
    let raf;
    function tick() {
      setObjects((prev) =>
        prev
          .map((o) => ({
            ...o,
            y: o.y - o.speed,
            x: o.x + Math.sin((Date.now() - o.born) * 0.0015 + o.wobble) * 0.22,
            rotation: o.rotation + Math.sin((Date.now() - o.born) * 0.001 + o.wobble) * 0.03,
          }))
          .filter((o) => o.y > -80) // remove off-screen
      );
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Consecutive cursor positions form a slash segment. `cursor.pixel` is the
  // MediaPipe index fingertip whenever a hand is detected, with mouse/touch
  // retained as the existing fallback.
  useEffect(() => {
    if (!cursor.pixel || showOnboard || phase !== 'slash') {
      previousCursorRef.current = null;
      currentCursorRef.current = null;
      return;
    }

    const current = {
      x: cursor.pixel.x,
      y: cursor.pixel.y,
      t: Date.now(),
    };
    previousCursorRef.current = currentCursorRef.current;
    currentCursorRef.current = current;

    if (previousCursorRef.current) {
      slashSequenceRef.current += 1;
      setSlashSegment({ id: slashSequenceRef.current, start: previousCursorRef.current, end: current });
    }
  }, [cursor.pixel, showOnboard, phase]);

  // Collision detection — test the full swipe segment against each bubble's
  // hit radius so fast fingertip movements do not skip over an object.
  useEffect(() => {
    if (!slashSegment || phase !== 'slash') return;
    if (processedSlashRef.current === slashSegment.id) return;
    processedSlashRef.current = slashSegment.id;

    setObjects((prevObjects) => {
      let hit = false;
      const remaining = [];
      for (const obj of prevObjects) {
        const hitRadius = 58;
        if (segmentIntersectsCircle(slashSegment.start, slashSegment.end, obj, hitRadius)) {
          // HIT!
          hit = true;
          const isCorrect = obj.sound === target.sound;
          const hitId = `${obj.id}-${Date.now()}`;

          // The bubble is removed immediately, while this short-lived state
          // preserves its position for current hit feedback and later effects.
          setSlashHits((prev) => [...prev, { id: hitId, x: obj.x, y: obj.y, isCorrect }]);
          setTimeout(() => {
            setSlashHits((prev) => prev.filter((effect) => effect.id !== hitId));
          }, 420);

          // Spawn slice particles
          const particles = [];
          for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            particles.push({
              id: Date.now() + i,
              x: obj.x,
              y: obj.y,
              px: Math.cos(angle) * (40 + Math.random() * 40),
              py: Math.sin(angle) * (40 + Math.random() * 40),
              char: i < 6 ? obj.emoji : '✨',
              life: 1,
            });
          }

          if (isCorrect) {
            setScore((s) => s + 1);
            scoreRef.current++;
            setCombo((c) => c + 1);
            comboRef.current++;

            // XP burst
            const xp = 10 + comboRef.current * 5;
            setXpBursts((prev) => [
              ...prev,
              { id: Date.now(), x: obj.x, y: obj.y, xp },
            ]);

            if (scoreRef.current >= goal) {
              setTimeout(() => {
                setObjects([]);
                setPhase('speak');
              }, 300);
            }
          } else {
            setCombo(0);
            comboRef.current = 0;
            onWrong();
          }

          setSlices((prev) => [...prev, ...particles]);
          // Remove particle effects after animation
          setTimeout(() => {
            setSlices((prev) => prev.filter((p) => !particles.includes(p)));
          }, 600);
        } else {
          remaining.push(obj);
        }
      }
      return hit ? remaining : prevObjects;
    });
  }, [slashSegment, target, goal, phase, onWrong]);

  // The slash task leads into a real, separate speech-recognition action.
  // A retry control remains available because browsers can require a user
  // gesture before allowing microphone permission.
  useEffect(() => {
    if (phase !== 'speak') return undefined;
    speak('Wonderful slashing! Now say Rabbit.');
    speech.start();
    return () => speech.stop();
  }, [phase, speech.start, speech.stop]);

  useEffect(() => {
    if (phase !== 'speak' || !speech.transcript) return;
    if (wordOverlapScore('rabbit', speech.transcript) >= 0.5) {
      onSolved(1, 'You slashed the R sounds and said Rabbit! 🌟');
    }
  }, [phase, speech.transcript, onSolved]);

  // Clean up XP bursts
  useEffect(() => {
    if (xpBursts.length === 0) return;
    const t = setTimeout(() => setXpBursts((prev) => prev.slice(1)), 1000);
    return () => clearTimeout(t);
  }, [xpBursts]);

  return (
    <div ref={containerRef} className="sound-slash-stage">
      {/* Score panel */}
      <div className="game-score-panel">
        <div className="game-score-item">
          ✂️ Slash everything that starts with {target.label}
        </div>
        <div className="game-score-item">
          ⚡ Score: <span className="score-value">{score}/{goal}</span>
        </div>
        {comboRef.current > 1 && (
          <div className="game-score-item" style={{ color: 'var(--gold)' }}>
            🔥 Combo x{comboRef.current}
          </div>
        )}
      </div>

      {/* Floating objects */}
      {objects.map((obj) => (
        <div
          key={obj.id}
          className="slash-object"
          style={{
            left: obj.x - 68,
            top: obj.y - 44,
            width: 136,
            height: 88,
            padding: '8px 12px',
            flexDirection: 'column',
            gap: 2,
            transform: `rotate(${obj.rotation}deg)`,
            '--world-color': obj.kind === 'correct' ? COLOR : '#ffb45c',
            borderColor: obj.kind === 'correct' ? 'rgba(62, 224, 138, 0.9)' : 'rgba(255, 180, 92, 0.85)',
            background: obj.kind === 'correct'
              ? 'radial-gradient(circle at 30% 20%, rgba(179, 255, 214, 0.42), rgba(17, 83, 62, 0.78))'
              : 'radial-gradient(circle at 30% 20%, rgba(255, 220, 166, 0.38), rgba(98, 51, 23, 0.78))',
            boxShadow: obj.kind === 'correct'
              ? '0 0 24px rgba(62, 224, 138, 0.64), inset 0 0 14px rgba(255,255,255,0.15)'
              : '0 0 20px rgba(255, 180, 92, 0.48), inset 0 0 14px rgba(255,255,255,0.1)',
            fontSize: 30,
          }}
        >
          <span aria-hidden="true">{obj.emoji}</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.55)' }}>
            {obj.word}
          </span>
        </div>
      ))}

      {/* Brief feedback remains at the bubble position after it is removed. */}
      {slashHits.map((hit) => (
        <div
          key={hit.id}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: hit.x - 28,
            top: hit.y - 28,
            width: 56,
            height: 56,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            pointerEvents: 'none',
            zIndex: 16,
            color: hit.isCorrect ? '#d7ffe8' : '#ffd2d2',
            border: `3px solid ${hit.isCorrect ? COLOR : '#ff7474'}`,
            boxShadow: `0 0 24px ${hit.isCorrect ? COLOR : '#ff7474'}`,
            fontSize: 28,
            fontWeight: 900,
            animation: 'slice-explode 0.42s ease-out forwards',
          }}
        >
          {hit.isCorrect ? '✦' : '×'}
        </div>
      ))}

      {/* Slice particle effects */}
      {slices.map((p) => (
        <div
          key={p.id}
          className="slice-part"
          style={{
            left: p.x,
            top: p.y,
            '--px': `${p.px}px`,
            '--py': `${p.py}px`,
            '--pr': `${Math.random() * 90 - 45}deg`,
          }}
        >
          {p.char}
        </div>
      ))}

      {/* XP bursts */}
      {xpBursts.map((b) => (
        <div
          key={b.id}
          className="xp-burst"
          style={{ left: b.x, top: b.y - 20 }}
        >
          +{b.xp} XP ✨
        </div>
      ))}

      {/* Onboarding instruction */}
      {showOnboard && (
        <div className="onboard-instruction">
          <div className="onboard-icon">✋</div>
          <div className="onboard-text">Move your hand to slash!</div>
          <div className="onboard-sub">Your magic cursor follows you</div>
        </div>
      )}

      {/* GO signal */}
      {goSignal && (
        <div className="onboard-instruction" style={{ top: '40%' }}>
          <div className="go-badge">GO! 🚀</div>
        </div>
      )}

      {phase === 'speak' && (
        <div className="sound-speech-prompt">
          <div style={{ fontSize: 34 }}>🐰</div>
          <div className="sound-speech-title">✨ Now say RABBIT ✨</div>
          <div className="sound-speech-copy">
            {speech.listening ? 'Listening… say “Rabbit” out loud!' : 'Use the microphone, then say “Rabbit”.'}
          </div>
          {speech.supported ? (
            <button className={`mic-button ${speech.listening ? 'listening' : ''}`} onClick={() => (speech.listening ? speech.stop() : speech.start())} aria-label="Start microphone">
              🎤
            </button>
          ) : <div className="sound-speech-copy">Speech recognition is not supported in this browser.</div>}
          {speech.interim && <div className="sound-speech-copy">Hearing: “{speech.interim}”</div>}
          {speech.error && <div className="sound-speech-error">{speech.error}</div>}
        </div>
      )}
    </div>
  );
}
SoundSlash.subtitle = 'Slash everything that starts with /R/! ✋✨';

/* ---------------- Round 2: Sound Match ---------------- */
function SoundMatch({ onSolved, onWrong }) {
  const target = useMemo(() => WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)], []);
  const choices = useMemo(() => {
    const correct = target;
    const wrong = shuffled(WORD_BANK.filter((w) => w.sound !== target.sound)).slice(0, 3);
    return shuffled([correct, ...wrong]);
  }, [target]);
  const [answered, setAnswered] = useState(false);

  useEffect(() => { speak(`${target.word}`); }, [target]);

  function choose(item) {
    if (answered) return;
    setAnswered(true);
    if (item.word === target.word) onSolved(1, `Yes! ${item.word} starts like ${target.word} 🌟`);
    else {
      onWrong();
      setTimeout(() => setAnswered(false), 500);
      onSolved(0.6, `Listen again — we want the ${target.sound} sound.`);
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <button
        className="panel-card"
        style={{ marginBottom: 30, display: 'inline-flex', gap: 10, alignItems: 'center', cursor: 'pointer', border: 'none' }}
        onClick={() => speak(target.word)}
      >
        <span style={{ fontSize: 22 }}>{target.emoji}</span>
        <span style={{ fontWeight: 800, color: 'var(--text-hi)' }}>{target.word.toUpperCase()} ({target.sound})</span>
        <span>🔊</span>
      </button>
      <div className="choice-row">
        {choices.map((c) => (
          <button key={c.word} className="choice-item" onClick={() => choose(c)}>
            <div className="choice-orb">{c.emoji}</div>
            <span className="choice-label">{c.word}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
SoundMatch.subtitle = 'Find the word that starts like the highlighted sound!';

/* ---------------- Round 3: Phoneme Blend ---------------- */
const BLEND_WORDS = [
  { word: 'Cat', parts: ['c', 'a', 't'], emoji: '🐱' },
  { word: 'Sun', parts: ['s', 'u', 'n'], emoji: '☀️' },
  { word: 'Bat', parts: ['b', 'a', 't'], emoji: '🦇' },
  { word: 'Dog', parts: ['d', 'o', 'g'], emoji: '🐶' },
];
function PhonemeBlend({ onSolved, onWrong }) {
  const target = useMemo(() => BLEND_WORDS[Math.floor(Math.random() * BLEND_WORDS.length)], []);
  const choices = useMemo(() => shuffled([target, ...shuffled(BLEND_WORDS.filter((w) => w.word !== target.word)).slice(0, 2)]), [target]);
  const [playedIdx, setPlayedIdx] = useState(-1);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    let i = 0;
    const step = () => {
      setPlayedIdx(i);
      speak(target.parts[i], { rate: 0.8 });
      i += 1;
      if (i < target.parts.length) setTimeout(step, 750);
    };
    const t = setTimeout(step, 400);
    return () => clearTimeout(t);
  }, [target]);

  function choose(c) {
    if (answered) return;
    setAnswered(true);
    if (c.word === target.word) onSolved(1, `Blended it perfectly: ${target.word}! 🎶`);
    else {
      onWrong();
      setTimeout(() => setAnswered(false), 500);
      onSolved(0.5, 'Listen to each sound again, then blend them together.');
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 26 }}>
        {target.parts.map((p, i) => (
          <div
            key={i}
            style={{
              width: 56, height: 56, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, background: 'rgba(255,255,255,0.05)',
              border: `2px solid ${playedIdx === i ? COLOR : 'rgba(255,255,255,0.15)'}`,
              boxShadow: playedIdx === i ? `0 0 16px ${COLOR}` : 'none',
              transition: 'all 0.3s',
            }}
          >
            {p}
          </div>
        ))}
      </div>
      <p style={{ color: 'var(--text-mid)', marginBottom: 20 }}>What word do these sounds make?</p>
      <div className="choice-row">
        {choices.map((c) => (
          <button key={c.word} className="choice-item" onClick={() => choose(c)}>
            <div className="choice-orb">{c.emoji}</div>
            <span className="choice-label">{c.word}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
PhonemeBlend.subtitle = 'Listen to each sound, then blend them into a word!';

/* ---------------- Round 4: Pronounce It (voice) ---------------- */
function PronounceIt({ onSolved, onWrong }) {
  const target = useMemo(() => WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)], []);
  const speech = useSpeechRecognition({ lang: 'en-US' });
  const supported = isSpeechRecognitionSupported();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!speech.transcript || checked) return;
    setChecked(true);
    const score = wordOverlapScore(target.word, speech.transcript);
    if (score >= 0.5) onSolved(1, `Beautiful pronunciation of "${target.word}"! 🎤`);
    else {
      onWrong();
      setTimeout(() => setChecked(false), 500);
      onSolved(0.5, `I heard "${speech.transcript}" — let's try "${target.word}" again.`);
    }
  }, [speech.transcript, checked, target, onSolved, onWrong]);

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 54, marginBottom: 10 }}>{target.emoji}</div>
      <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 22 }}>{target.word}</div>

      {supported ? (
        <>
          <button
            className={`mic-button ${speech.listening ? 'listening' : ''}`}
            onClick={() => (speech.listening ? speech.stop() : speech.start())}
          >
            🎤
          </button>
          <p style={{ color: 'var(--text-mid)', fontSize: 13, marginTop: 14 }}>
            {speech.listening
              ? 'Listening… say the word out loud!'
              : speech.permission === 'denied'
              ? 'Microphone permission denied — you can retry below.'
              : 'Tap the mic, then say the word.'}
          </p>
          {speech.interim && <p style={{ color: 'var(--text-low)', fontSize: 13 }}>Hearing: "{speech.interim}"</p>}
          {speech.error && <p style={{ color: '#ff9a9a', fontSize: 12 }}>{speech.error}</p>}
        </>
      ) : (
        <div>
          <p style={{ color: 'var(--text-mid)', fontSize: 13, marginBottom: 14 }}>
            Speech recognition isn't available in this browser. Say the word out loud, then confirm below.
          </p>
          <button className="btn-pill btn-primary" onClick={() => onSolved(1, `Great job practicing "${target.word}"! 🎤`)}>
            I said it! ✓
          </button>
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        <button className="btn-pill btn-ghost" style={{ borderColor: COLOR }} onClick={() => speak(target.word)}>
          🔊 Hear it again
        </button>
      </div>
    </div>
  );
}
PronounceIt.subtitle = 'Say the word out loud into the microphone.';

/* ---------------- Round 5: Word Recognition ---------------- */
function WordRecognitionRound({ onSolved, onWrong }) {
  const target = useMemo(() => WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)], []);
  const choices = useMemo(() => shuffled([target, ...shuffled(WORD_BANK.filter((w) => w.word !== target.word)).slice(0, 3)]), [target]);
  const [answered, setAnswered] = useState(false);

  function choose(c) {
    if (answered) return;
    setAnswered(true);
    if (c.word === target.word) onSolved(1, 'Word recognized perfectly! 📖');
    else {
      onWrong();
      setTimeout(() => setAnswered(false), 500);
      onSolved(0.6, `That word was ${target.word}.`);
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 60, marginBottom: 20 }}>{target.emoji}</div>
      <p style={{ color: 'var(--text-mid)', marginBottom: 18 }}>Which word matches the picture?</p>
      <div className="choice-row">
        {choices.map((c) => (
          <button key={c.word} className="choice-item" onClick={() => choose(c)}>
            <div className="choice-orb" style={{ fontSize: 16, fontWeight: 800 }}>{c.word}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
WordRecognitionRound.subtitle = 'Match the picture to the written word.';
