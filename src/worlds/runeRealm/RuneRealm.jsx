import React, { useEffect, useMemo, useRef, useState } from 'react';
import TopBar from '../../components/TopBar';
import RoundHeader from '../../components/RoundHeader';
import Mascot from '../../components/Mascot';
import WorldCompleteOverlay from '../../components/WorldCompleteOverlay';
import HandCursorLayer from '../../components/HandCursorLayer';
import { useWorldFlow } from '../../hooks/useWorldFlow';
import { useCursor } from '../../hooks/useCursor';
import { WORLDS } from '../../data/worlds';
import { RUNE_ROUNDS } from './shapes';

const COLOR = WORLDS.runeRealm.color;
const HIT_RADIUS = 9; // in 0-100 normalized units
const GOAL_COVERAGE = 0.75;

export default function RuneRealm() {
  const flow = useWorldFlow({ worldKey: 'runeRealm', skill: 'motor', xpPerRound: 170, worldBonus: 220 });
  const containerRef = useRef(null);
  const cursor = useCursor(containerRef, !flow.completed);
  const [mouseDown, setMouseDown] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const down = () => setMouseDown(true);
    const up = () => setMouseDown(false);
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
    };
  }, []);

  const round = RUNE_ROUNDS[flow.roundIndex];
  const isDrawing = cursor.usingHand ? cursor.pinching : mouseDown;

  return (
    <div>
      <TopBar worldColor={COLOR} roundCount={flow.totalRounds} currentRound={flow.roundNumber} />
      <div className="game-shell">
        {!flow.completed && (
          <>
            <RoundHeader title={round.title} subtitle={round.instruction} color={COLOR} />
            <div className="play-area" ref={containerRef} style={{ '--world-color': COLOR }}>
              <HandCursorLayer videoRef={cursor.videoRef} pixel={cursor.pixel} cameraStatus={cursor.cameraStatus} color={COLOR} />
              <TraceCanvas
                key={flow.roundIndex}
                round={round}
                cursor={cursor}
                isDrawing={isDrawing}
                attempts={flow.attempts}
                onRetry={flow.registerAttempt}
                onSolved={(acc, msg) => flow.completeRound(acc, msg)}
              />
            </div>
          </>
        )}
        {flow.completed && (
          <WorldCompleteOverlay
            title="✍️ RUNE REALM MASTER!"
            subtitle="You completed all 5 rounds of Tracing & Rune Magic Quests!"
            color={COLOR}
            onRestart={flow.restart}
          />
        )}
      </div>
      <Mascot color={COLOR} icon="🦋" message={flow.message} />
    </div>
  );
}

function TraceCanvas({ round, cursor, isDrawing, attempts, onRetry, onSolved }) {
  const targetPoints = useMemo(() => round.getPoints(), [round]);
  const [drawn, setDrawn] = useState([]);
  const [touched, setTouched] = useState(() => new Array(targetPoints.length).fill(false));
  const [startTime] = useState(() => Date.now());
  const [solved, setSolved] = useState(false);
  const lastPointRef = useRef(null);

  const coverage = touched.filter(Boolean).length / touched.length;
  const accuracyPct = Math.round(coverage * 100);

  useEffect(() => {
    if (!isDrawing || !cursor.pixel || solved) {
      lastPointRef.current = null;
      return;
    }
    const nx = cursor.pixel.nx * 100;
    const ny = cursor.pixel.ny * 100;
    const last = lastPointRef.current;
    if (last && Math.hypot(nx - last.x, ny - last.y) < 0.6) return; // avoid over-dense points
    lastPointRef.current = { x: nx, y: ny };

    setDrawn((prev) => [...prev.slice(-400), { x: nx, y: ny }]);
    setTouched((prev) => {
      let changed = false;
      const next = prev.slice();
      targetPoints.forEach((tp, i) => {
        if (next[i]) return;
        if (Math.hypot(tp.x - nx, tp.y - ny) < HIT_RADIUS) {
          next[i] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor.pixel, isDrawing, solved]);

  useEffect(() => {
    if (solved) return;
    if (coverage >= GOAL_COVERAGE) {
      setSolved(true);
      const timeMs = Date.now() - startTime;
      const accuracy = Math.min(1, coverage);
      const seconds = Math.round(timeMs / 1000);
      onSolved(accuracy, `Rune complete in ${seconds}s — ${Math.round(accuracy * 100)}% accuracy! ✨`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverage, solved]);

  function clearTrace() {
    onRetry();
    setDrawn([]);
    setTouched(new Array(targetPoints.length).fill(false));
    lastPointRef.current = null;
  }

  const pathD = (pts, closed) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y} `;
    for (let i = 1; i < pts.length; i++) d += `L ${pts[i].x} ${pts[i].y} `;
    if (closed) d += 'Z';
    return d;
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <path d={pathD(targetPoints, round.closed)} className="trace-target" />
        {drawn.length > 1 && <path d={pathD(drawn, false)} className="trace-path" style={{ '--world-color': COLOR }} />}
        {targetPoints.map(
          (tp, i) =>
            touched[i] && <circle key={i} cx={tp.x} cy={tp.y} r={1.4} fill={COLOR} opacity={0.85} />
        )}
      </svg>

      <div style={{ position: 'absolute', top: 14, right: 16, textAlign: 'right' }}>
        <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>Accuracy: <b style={{ color: COLOR }}>{accuracyPct}%</b> · Goal: {Math.round(GOAL_COVERAGE * 100)}%</div>
        <div style={{ fontSize: 11, color: 'var(--text-low)' }}>Attempts: {attempts}</div>
      </div>

      <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 10 }}>
        <button className="btn-pill btn-ghost" style={{ borderColor: COLOR, fontSize: 12, padding: '8px 18px' }} onClick={clearTrace}>
          ↻ Clear trace
        </button>
      </div>
    </div>
  );
}
