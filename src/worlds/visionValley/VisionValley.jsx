import React, { useEffect, useMemo, useRef, useState } from 'react';
import TopBar from '../../components/TopBar';
import RoundHeader from '../../components/RoundHeader';
import Mascot from '../../components/Mascot';
import WorldCompleteOverlay from '../../components/WorldCompleteOverlay';
import HandCursorLayer from '../../components/HandCursorLayer';
import { useWorldFlow } from '../../hooks/useWorldFlow';
import { useCursor } from '../../hooks/useCursor';
import { WORLDS } from '../../data/worlds';

const COLOR = WORLDS.visionValley.color;

export default function VisionValley() {
  const flow = useWorldFlow({ worldKey: 'visionValley', skill: 'vision', xpPerRound: 150, worldBonus: 200 });
  const containerRef = useRef(null);
  const cursor = useCursor(containerRef, !flow.completed);

  const roundConfigs = [
    { title: 'ROUND 1 — TRACK & TOUCH', comp: TrackTouch },
    { title: 'ROUND 2 — COLOR MATCH', comp: ColorMatch },
    { title: 'ROUND 3 — SPOT THE DIFFERENCE', comp: SpotDifference },
    { title: 'ROUND 4 — PATTERN MATCH', comp: PatternMatch },
    { title: 'ROUND 5 — FOCUS CHALLENGE', comp: FocusChallenge },
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
            <div className="play-area" ref={containerRef} style={{ '--world-color': COLOR }}>
              <HandCursorLayer videoRef={cursor.videoRef} pixel={cursor.pixel} cameraStatus={cursor.cameraStatus} color={COLOR} />
              <RoundComp
                key={flow.roundIndex}
                cursor={cursor}
                containerRef={containerRef}
                onSolved={(acc, msg) => flow.completeRound(acc, msg)}
                onWrong={flow.registerAttempt}
              />
            </div>
          </>
        )}
        {flow.completed && (
          <WorldCompleteOverlay
            title="👁️ VISION VALLEY MASTER!"
            subtitle="You completed all 5 rounds of Visual & Focus Quests!"
            color={COLOR}
            onRestart={flow.restart}
          />
        )}
      </div>
      <Mascot color={COLOR} icon="🦉" message={flow.message} />
    </div>
  );
}

/* ---------------- Round 1: Track & Touch (pure camera dwell mechanic) ---------------- */
function TrackTouch({ cursor, onSolved }) {
  const [target, setTarget] = useState({ x: 50, y: 50 });
  const dwellRef = useRef(0);
  const lastTsRef = useRef(performance.now());
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const moveTarget = () => setTarget({ x: 15 + Math.random() * 70, y: 15 + Math.random() * 70 });
    moveTarget();
    const interval = setInterval(moveTarget, 2600);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const now = performance.now();
    const dt = now - lastTsRef.current;
    lastTsRef.current = now;
    if (!cursor.pixel) return;
    const el = cursor.pixel;
    const dx = el.nx * 100 - target.x;
    const dy = el.ny * 100 - target.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 9) {
      dwellRef.current = Math.min(1400, dwellRef.current + dt);
    } else {
      dwellRef.current = Math.max(0, dwellRef.current - dt * 1.5);
    }
    setProgress(dwellRef.current / 1400);
    if (dwellRef.current >= 1400) {
      onSolved(1, 'Great tracking! You followed the starlight ✨');
    }
  }, [cursor.pixel, target, onSolved]);

  return (
    <>
      <div className="floating-target" style={{ left: `${target.x}%`, top: `${target.y}%`, '--slide': '1.1s' }}>⭐</div>
      <div style={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', width: 220 }}>
        <div className="progress-track" style={{ margin: 0 }}>
          <div className="progress-fill" style={{ width: `${Math.round(progress * 100)}%`, '--world-color': COLOR }} />
        </div>
      </div>
    </>
  );
}
TrackTouch.subtitle = 'Follow the floating starlight with your finger (or mouse)!';

/* ---------------- Round 2: Color Match ---------------- */
const COLOR_SET = [
  { name: 'Cyan', hex: '#4fd8ff' },
  { name: 'Magenta', hex: '#ff5cad' },
  { name: 'Emerald', hex: '#3ee08a' },
  { name: 'Amber', hex: '#ffc857' },
];
function ColorMatch({ onSolved, onWrong }) {
  const target = useMemo(() => COLOR_SET[Math.floor(Math.random() * COLOR_SET.length)], []);
  const [answered, setAnswered] = useState(false);

  function choose(c) {
    if (answered) return;
    setAnswered(true);
    if (c.hex === target.hex) onSolved(1, `Perfect eye for color! 🎨`);
    else {
      onWrong();
      setTimeout(() => setAnswered(false), 500);
      onSolved(0.6, `Close! We wanted ${target.name}.`);
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="choice-row">
        {COLOR_SET.map((c) => (
          <button key={c.hex} className="choice-item" onClick={() => choose(c)}>
            <div className="choice-orb" style={{ background: c.hex, boxShadow: `0 0 16px ${c.hex}`, border: 'none' }} />
            <span className="choice-label">{c.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
ColorMatch.subtitle = 'Find and touch the target crystal color!';

/* ---------------- Round 3: Spot the Difference ---------------- */
function SpotDifference({ onSolved, onWrong }) {
  const count = 4;
  const special = useMemo(() => Math.floor(Math.random() * count), []);
  const [answered, setAnswered] = useState(false);

  function choose(i) {
    if (answered) return;
    setAnswered(true);
    if (i === special) onSolved(1, 'Found it! The crowned star! 👑');
    else {
      onWrong();
      setTimeout(() => setAnswered(false), 500);
      onSolved(0.6, 'Keep looking closely — try again!');
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="choice-row">
        {Array.from({ length: count }).map((_, i) => (
          <button key={i} className="choice-item" onClick={() => choose(i)}>
            <div className="choice-orb" style={{ fontSize: 30 }}>{i === special ? '🌟' : '⭐'}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
SpotDifference.subtitle = 'Touch the star with the MAGICAL CROWN!';

/* ---------------- Round 4: Pattern Match ---------------- */
const ORB_COLORS = ['#4fd8ff', '#b98bff', '#ff5cad', '#3ee08a'];
function PatternMatch({ onSolved, onWrong }) {
  const seq = useMemo(() => {
    const a = ORB_COLORS[Math.floor(Math.random() * ORB_COLORS.length)];
    let b = ORB_COLORS[Math.floor(Math.random() * ORB_COLORS.length)];
    while (b === a) b = ORB_COLORS[Math.floor(Math.random() * ORB_COLORS.length)];
    return [a, b, a, b];
  }, []);
  const answer = seq[0];
  const choices = useMemo(() => {
    const others = ORB_COLORS.filter((c) => c !== answer);
    return [answer, others[0]].sort(() => Math.random() - 0.5);
  }, [answer]);
  const [answered, setAnswered] = useState(false);

  function choose(c) {
    if (answered) return;
    setAnswered(true);
    if (c === answer) onSolved(1, 'Pattern spotted! 🔮');
    else {
      onWrong();
      setTimeout(() => setAnswered(false), 500);
      onSolved(0.5, 'Look at the repeating order again!');
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 30 }}>
        {seq.map((c, i) => (
          <div key={i} style={{ width: 50, height: 50, borderRadius: '50%', background: c, boxShadow: `0 0 14px ${c}` }} />
        ))}
        <div style={{ width: 50, height: 50, borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.4)' }} />
      </div>
      <div className="choice-row">
        {choices.map((c) => (
          <button key={c} className="choice-item" onClick={() => choose(c)}>
            <div className="choice-orb" style={{ background: c, boxShadow: `0 0 14px ${c}`, border: 'none' }} />
          </button>
        ))}
      </div>
    </div>
  );
}
PatternMatch.subtitle = 'Which orb continues the pattern?';

/* ---------------- Round 5: Focus Challenge ---------------- */
function FocusChallenge({ onSolved, onWrong }) {
  const total = 3;
  const [found, setFound] = useState(0);
  const [star, setStar] = useState({ x: 50, y: 50 });
  const [expiring, setExpiring] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setExpiring(true), 2200);
    return () => clearTimeout(t);
  }, [star]);

  useEffect(() => {
    if (!expiring) return undefined;
    const t = setTimeout(() => {
      onWrong();
      setStar({ x: 15 + Math.random() * 70, y: 15 + Math.random() * 70 });
      setExpiring(false);
    }, 900);
    return () => clearTimeout(t);
  }, [expiring, onWrong]);

  function tap() {
    const nextFound = found + 1;
    setFound(nextFound);
    setExpiring(false);
    if (nextFound >= total) {
      onSolved(1, 'Amazing focus! All stars caught 🌟');
    } else {
      setStar({ x: 15 + Math.random() * 70, y: 15 + Math.random() * 70 });
    }
  }

  return (
    <>
      <div
        className="floating-target"
        style={{ left: `${star.x}%`, top: `${star.y}%`, opacity: expiring ? 0.4 : 1, '--slide': '0.4s' }}
        onClick={tap}
      >
        ⭐
      </div>
      <div style={{ position: 'absolute', top: 16, right: 20, color: 'var(--text-mid)', fontSize: 13 }}>
        {found}/{total} caught
      </div>
    </>
  );
}
FocusChallenge.subtitle = 'Touch the glowing stars before they drift away!';
