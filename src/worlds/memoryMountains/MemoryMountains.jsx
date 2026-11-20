import React, { useEffect, useMemo, useRef, useState } from 'react';
import TopBar from '../../components/TopBar';
import RoundHeader from '../../components/RoundHeader';
import Mascot from '../../components/Mascot';
import WorldCompleteOverlay from '../../components/WorldCompleteOverlay';
import HandCursorLayer from '../../components/HandCursorLayer';
import { useWorldFlow } from '../../hooks/useWorldFlow';
import { useCursor } from '../../hooks/useCursor';
import { WORLDS } from '../../data/worlds';

const COLOR = WORLDS.memoryMountains.color;
const CURSOR_COLOR = '#4fd8ff';
const ICON_POOL = ['💎', '🔑', '🍎', '🦋', '🌙', '👑', '⚡', '☁️', '🎭', '⭐', '🍇', '🔔'];

function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pickIcons(n, exclude = []) {
  const pool = ICON_POOL.filter((i) => !exclude.includes(i));
  return shuffled(pool).slice(0, n);
}

export default function MemoryMountains() {
  const flow = useWorldFlow({ worldKey: 'memoryMountains', skill: 'memory', xpPerRound: 160, worldBonus: 200 });
  const playAreaRef = useRef(null);
  const cursor = useCursor(playAreaRef, !flow.completed);
  const roundConfigs = [
    { title: 'ROUND 1 — REMEMBER OBJECTS', comp: RememberObjects, skill: 'memory' },
    { title: 'ROUND 2 — WHAT\u2019S MISSING?', comp: WhatsMissing, skill: 'memory' },
    { title: 'ROUND 3 — REMEMBER THE ORDER', comp: RememberOrder, skill: 'memory' },
    { title: 'ROUND 4 — FOLLOW THE PATTERN', comp: PatternMatch, skill: 'numberSense' },
    { title: 'ROUND 5 — MEMORY MASTER CHALLENGE', comp: MemoryMaster, skill: 'memory' },
  ];
  const current = roundConfigs[flow.roundIndex];
  const RoundComp = current.comp;

  return (
    <div>
      <TopBar worldColor={COLOR} roundCount={flow.totalRounds} currentRound={flow.roundNumber} />
      <div className="game-shell">
        {!flow.completed && (
          <>
            <RoundHeader title={current.title} color={COLOR} subtitle={RoundComp.subtitle} />
            <div className="play-area" ref={playAreaRef} style={{ '--world-color': COLOR }}>
              <HandCursorLayer
                videoRef={cursor.videoRef}
                pixel={cursor.pixel}
                cameraStatus={cursor.cameraStatus}
                handDetected={cursor.handDetected}
                pinching={cursor.pinching}
                interacting={cursor.pinching}
                color={CURSOR_COLOR}
                showMirror
                showCursor
              />
              <RoundComp key={flow.roundIndex} onSolved={(acc, msg) => flow.completeRound(acc, msg)} onWrong={flow.registerAttempt} />
            </div>
          </>
        )}
        {flow.completed && (
          <WorldCompleteOverlay
            title="🧠 MEMORY MOUNTAINS MASTER!"
            subtitle="You completed all 5 rounds of Memory & Sequencing Quests!"
            color={COLOR}
            onRestart={flow.restart}
          />
        )}
      </div>
      <Mascot color={COLOR} icon="🐼" message={flow.message} />
    </div>
  );
}

/* ---------------- Round 1: Remember Objects ---------------- */
function RememberObjects({ onSolved, onWrong }) {
  const target = useMemo(() => pickIcons(3), []);
  const distractors = useMemo(() => pickIcons(3, target), [target]);
  const options = useMemo(() => shuffled([...target, ...distractors]), [target, distractors]);
  const [phase, setPhase] = useState('show'); // show | recall
  const [picked, setPicked] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => setPhase('recall'), 2600);
    return () => clearTimeout(timer);
  }, []);

  function toggle(icon) {
    if (picked.includes(icon)) {
      setPicked(picked.filter((p) => p !== icon));
      return;
    }
    const next = [...picked, icon];
    setPicked(next);
    if (next.length === target.length) {
      const correct = next.filter((i) => target.includes(i)).length;
      const accuracy = correct / target.length;
      if (accuracy === 1) onSolved(1, 'Perfect recall! Round 1 complete 🎉');
      else {
        onWrong();
        onSolved(accuracy, `Nice try — you remembered ${correct} of ${target.length}!`);
      }
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      {phase === 'show' ? (
        <>
          <p style={{ color: 'var(--text-mid)', marginBottom: 18 }}>Memorize these {target.length} magical treasures...</p>
          <div className="choice-row">
            {target.map((icon) => (
              <div className="choice-item" key={icon}>
                <div className="choice-orb" style={{ fontSize: 40 }}>{icon}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <p style={{ color: 'var(--text-mid)', marginBottom: 18 }}>Select the {target.length} treasures that were shown!</p>
          <div className="choice-row">
            {options.map((icon) => (
              <button key={icon} className={`choice-item ${picked.includes(icon) ? 'correct' : ''}`} onClick={() => toggle(icon)}>
                <div className="choice-orb">{icon}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
RememberObjects.subtitle = 'Watch closely, then find them again!';

/* ---------------- Round 2: What's Missing ---------------- */
function WhatsMissing({ onSolved, onWrong }) {
  const full = useMemo(() => pickIcons(5), []);
  const missingIndex = useMemo(() => Math.floor(Math.random() * full.length), [full]);
  const missingIcon = full[missingIndex];
  const [phase, setPhase] = useState('show');
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setPhase('recall'), 2800);
    return () => clearTimeout(timer);
  }, []);

  function choose(icon) {
    if (answered) return;
    setAnswered(true);
    if (icon === missingIcon) onSolved(1, 'Sharp eyes! You spotted it 👀');
    else {
      onWrong();
      setTimeout(() => setAnswered(false), 500);
      onSolved(0.6, `Close! It was the ${missingIcon}.`);
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: 'var(--text-mid)', marginBottom: 18 }}>
        {phase === 'show' ? `Look closely at these ${full.length} objects...` : 'One object vanished! Which one is missing?'}
      </p>
      <div className="choice-row">
        {full.map((icon, i) => (
          <button
            key={icon}
            className="choice-item"
            disabled={phase === 'show'}
            onClick={() => choose(icon)}
            style={{ visibility: phase === 'show' || i !== missingIndex ? 'visible' : 'hidden' }}
          >
            <div className="choice-orb">{icon}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
WhatsMissing.subtitle = 'One object will disappear — spot it!';

/* ---------------- Round 3: Remember the Order ---------------- */
function RememberOrder({ onSolved, onWrong }) {
  const sequence = useMemo(() => pickIcons(3), []);
  const options = useMemo(() => shuffled(sequence), [sequence]);
  const [phase, setPhase] = useState('show');
  const [highlight, setHighlight] = useState(-1);
  const [picks, setPicks] = useState([]);

  useEffect(() => {
    let i = 0;
    const step = () => {
      setHighlight(i);
      i += 1;
      if (i <= sequence.length) setTimeout(step, 850);
      else setTimeout(() => setPhase('recall'), 500);
    };
    const t = setTimeout(step, 400);
    return () => clearTimeout(t);
  }, [sequence]);

  function pick(icon) {
    const next = [...picks, icon];
    setPicks(next);
    const idx = next.length - 1;
    if (sequence[idx] !== icon) {
      onWrong();
      onSolved(Math.max(0, idx / sequence.length), 'So close — let\u2019s try the next one!');
      return;
    }
    if (next.length === sequence.length) onSolved(1, 'Perfect sequence! 🌟');
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: 'var(--text-mid)', marginBottom: 18 }}>
        {phase === 'show' ? 'Watch the sequence light up...' : 'Touch the items in the exact sequence!'}
      </p>
      <div className="choice-row">
        {(phase === 'show' ? sequence : options).map((icon, i) => (
          <button
            key={icon + i}
            className="choice-item"
            disabled={phase === 'show'}
            onClick={() => pick(icon)}
          >
            <div
              className="choice-orb"
              style={
                phase === 'show' && highlight === i
                  ? { borderColor: COLOR, boxShadow: `0 0 22px ${COLOR}`, transform: 'scale(1.15)' }
                  : undefined
              }
            >
              {icon}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
RememberOrder.subtitle = 'Watch the glow, then repeat the sequence.';

/* ---------------- Round 4: Follow the Pattern (number/pattern sense) ---------------- */
const PATTERN_COLORS = ['#4fd8ff', '#b98bff', '#ffc857', '#3ee08a', '#ff5cad'];
function PatternMatch({ onSolved, onWrong }) {
  // Build a simple repeating pattern of length 6, ask what comes next.
  const base = useMemo(() => shuffled(PATTERN_COLORS).slice(0, 2), []);
  const pattern = useMemo(() => Array.from({ length: 5 }, (_, i) => base[i % base.length]), [base]);
  const answer = base[5 % base.length];
  const choices = useMemo(() => shuffled([...new Set([answer, ...shuffled(PATTERN_COLORS).slice(0, 3)])]), [answer]);
  const [answered, setAnswered] = useState(false);

  function choose(color) {
    if (answered) return;
    setAnswered(true);
    if (color === answer) onSolved(1, 'You cracked the pattern! 🔮');
    else {
      onWrong();
      setTimeout(() => setAnswered(false), 500);
      onSolved(0.5, 'Not quite — look at how the colors repeat.');
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: 'var(--text-mid)', marginBottom: 22 }}>Which color continues the pattern?</p>
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 34 }}>
        {pattern.map((c, i) => (
          <div key={i} style={{ width: 46, height: 46, borderRadius: '50%', background: c, boxShadow: `0 0 12px ${c}` }} />
        ))}
        <div style={{ width: 46, height: 46, borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.4)' }} />
      </div>
      <div className="choice-row">
        {choices.map((c) => (
          <button key={c} className="choice-item" onClick={() => choose(c)}>
            <div className="choice-orb" style={{ background: c, boxShadow: `0 0 12px ${c}`, border: 'none' }} />
          </button>
        ))}
      </div>
    </div>
  );
}
PatternMatch.subtitle = 'Spot the repeating pattern, then complete it.';

/* ---------------- Round 5: Memory Master Challenge ---------------- */
function MemoryMaster({ onSolved, onWrong }) {
  const sequence = useMemo(() => pickIcons(4), []);
  const options = useMemo(() => shuffled(sequence), [sequence]);
  const [phase, setPhase] = useState('show');
  const [highlight, setHighlight] = useState(-1);
  const [picks, setPicks] = useState([]);

  useEffect(() => {
    let i = 0;
    const step = () => {
      setHighlight(i);
      i += 1;
      if (i <= sequence.length) setTimeout(step, 750);
      else setTimeout(() => setPhase('recall'), 500);
    };
    const t = setTimeout(step, 400);
    return () => clearTimeout(t);
  }, [sequence]);

  function pick(icon) {
    const next = [...picks, icon];
    setPicks(next);
    const idx = next.length - 1;
    if (sequence[idx] !== icon) {
      onWrong();
      onSolved(Math.max(0, idx / sequence.length), 'Almost! Memory takes practice 💪');
      return;
    }
    if (next.length === sequence.length) onSolved(1, 'Memory Mountains mastered! Incredible job! 🏆');
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: 'var(--text-mid)', marginBottom: 18 }}>
        {phase === 'show' ? 'Recall all 4 royal artifacts in order... 👑💎⭐🎭' : 'Touch the artifacts in the order shown!'}
      </p>
      <div className="choice-row">
        {(phase === 'show' ? sequence : options).map((icon, i) => (
          <button key={icon + i} className="choice-item" disabled={phase === 'show'} onClick={() => pick(icon)}>
            <div
              className="choice-orb"
              style={
                phase === 'show' && highlight === i
                  ? { borderColor: COLOR, boxShadow: `0 0 22px ${COLOR}`, transform: 'scale(1.15)' }
                  : undefined
              }
            >
              {icon}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
MemoryMaster.subtitle = 'The final challenge — recall the full sequence.';
