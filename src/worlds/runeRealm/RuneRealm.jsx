import React, { useEffect, useMemo, useRef, useState } from 'react';
import TopBar from '../../components/TopBar';
import RoundHeader from '../../components/RoundHeader';
import Mascot from '../../components/Mascot';
import WorldCompleteOverlay from '../../components/WorldCompleteOverlay';
import HandCursorLayer from '../../components/HandCursorLayer';
import { useWorldFlow } from '../../hooks/useWorldFlow';
import { useCursor } from '../../hooks/useCursor';
import { WORLDS } from '../../data/worlds';
import { getRuneDots, RUNE_ROUNDS } from './shapes';

const COLOR = WORLDS.runeRealm.color;
const BRUSH_COLOR = '#4fd8ff';
const DOT_HIT_RADIUS = 7.5;

export default function RuneRealm() {
  const flow = useWorldFlow({ worldKey: 'runeRealm', skill: 'motor', xpPerRound: 170, worldBonus: 220 });
  const containerRef = useRef(null);
  // It intentionally remains active during the final celebration too.
  const cursor = useCursor(containerRef, true);
  const [mouseDown, setMouseDown] = useState(false);
  const round = RUNE_ROUNDS[flow.roundIndex];
  const isDrawing = cursor.usingHand ? Boolean(cursor.pixel) : mouseDown;

  useEffect(() => {
    const area = containerRef.current; if (!area) return undefined;
    const start = (event) => { if (!event.target.closest('button')) setMouseDown(true); };
    const end = () => setMouseDown(false);
    area.addEventListener('pointerdown', start); window.addEventListener('pointerup', end);
    return () => { area.removeEventListener('pointerdown', start); window.removeEventListener('pointerup', end); };
  }, []);

  return <div>
    <TopBar worldColor={COLOR} roundCount={flow.totalRounds} currentRound={flow.completed ? 5 : flow.roundNumber} />
    <div className="game-shell">
      {!flow.completed && <RoundHeader title={round.title} subtitle={round.instruction} color={COLOR} />}
      <div className="play-area rune-realm-area" ref={containerRef} style={{ '--world-color': COLOR }}>
        <HandCursorLayer videoRef={cursor.videoRef} pixel={cursor.pixel} cameraStatus={cursor.cameraStatus} handDetected={cursor.handDetected} pinching={cursor.pinching} interacting={isDrawing} color={BRUSH_COLOR} showMirror showCursor />
        {!flow.completed && <TraceCanvas key={round.id} round={round} cursor={cursor} isDrawing={isDrawing} onSolved={flow.completeRound} />}
        {flow.transitioning && <div className="round-transition-overlay"><span className="round-transition-text">✨ The next rune is awakening…</span></div>}
        {flow.completed && <WorldCompleteOverlay title="🌌✨ RUNE REALM COMPLETE ✨🌌" subtitle="You mastered all five magical runes!" bonusXp={220} color={COLOR} results={[{ label: 'Runes completed', value: '✓ ✓ ✓ ✓ ✓' }, { label: 'XP earned', value: '+1070 XP' }]} onRestart={flow.restart} />}
      </div>
    </div>
    <Mascot color={COLOR} icon="🦋" message={flow.message} />
  </div>;
}

function TraceCanvas({ round, cursor, isDrawing, onSolved }) {
  const dots = useMemo(() => getRuneDots(round.target), [round.target]);
  const [completedDots, setCompletedDots] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const lastPointRef = useRef(null);
  const advancingRef = useRef(false);
  const sparkleTimerRef = useRef(null);
  const [sparkleDot, setSparkleDot] = useState(null);

  useEffect(() => {
    if (!isDrawing || !cursor.pixel || celebrating) { lastPointRef.current = null; return; }
    const next = { x: cursor.pixel.nx * 100, y: cursor.pixel.ny * 100 }; const previous = lastPointRef.current;
    lastPointRef.current = next;
    // Only the next required dot is tested. Crossing a future dot is ignored,
    // so the child cannot skip ahead or complete from approximate coverage.
    const currentDot = dots[completedDots];
    if (!currentDot || !segmentTouchesDot(previous ?? next, next, currentDot, DOT_HIT_RADIUS)) return;
    setCompletedDots((count) => count + 1);
    setSparkleDot(completedDots);
    clearTimeout(sparkleTimerRef.current);
    sparkleTimerRef.current = setTimeout(() => setSparkleDot(null), 260);
  }, [cursor.pixel, isDrawing, celebrating, completedDots, dots]);

  useEffect(() => () => clearTimeout(sparkleTimerRef.current), []);

  useEffect(() => {
    // The final dot is the sole completion gate. There is deliberately no
    // coverage, accuracy, drawing-length, or timeout completion path.
    if (advancingRef.current || completedDots !== dots.length) return;
    advancingRef.current = true; setCelebrating(true);
    const timer = setTimeout(() => onSolved(1, round.success), 800);
    return () => clearTimeout(timer);
  }, [completedDots, dots.length, round, onSolved]);

  const progress = Math.round((completedDots / dots.length) * 100);
  const guidance = completedDots === 0 ? '👆 Touch the bright starting dot' : completedDots + 1 === dots.length ? '✨ One more magical dot!' : '✨ Find the next bright dot!';
  return <div className="rune-drawing-stage">
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="rune-drawing-svg">
      {dots.map((dot, index) => {
        const complete = index < completedDots;
        const current = index === completedDots;
        return <g key={index}>
          <circle cx={dot.x} cy={dot.y} r={current ? '5.8' : complete ? '4.3' : '3.2'} fill={current ? 'rgba(79,216,255,.18)' : 'transparent'} />
          <circle cx={dot.x} cy={dot.y} r={current ? '2.8' : complete ? '2.1' : '1.45'} fill={complete || current ? '#4fd8ff' : 'rgba(232,248,255,.42)'} style={{ filter: `drop-shadow(0 0 ${current ? 13 : complete ? 8 : 4}px ${current || complete ? '#4fd8ff' : 'rgba(180,150,255,.7)'})` }} />
          {current && <circle cx={dot.x} cy={dot.y} r="5" fill="none" stroke="#ff9cdb" strokeWidth=".8" opacity=".9" />}
          {sparkleDot === index && <text x={dot.x} y={dot.y - 4} textAnchor="middle" fill="#fff3a8" fontSize="7">✦</text>}
        </g>;
      })}
    </svg>
    <Sparkles active={celebrating}/>
    <div className="rune-trace-hud"><strong>✨ DOTS: {completedDots} / {dots.length}</strong><span>TRACE PROGRESS {progress}%</span><div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%`, '--world-color': BRUSH_COLOR }}/></div></div>
    <div className="rune-trace-tip">{guidance} · {cursor.usingHand ? 'move your index fingertip' : 'hold and drag'}.</div>
    {celebrating && <><div className="rune-ripple"/><div className="rune-success">{round.success}</div></>}
  </div>;
}

function Sparkles({ active }) { return active ? <div className="rune-sparkles" aria-hidden="true">✦ ✧ ✦ ✧ ✦ ✧ ✦</div> : null; }
function segmentTouchesDot(start, end, dot, radius) {
  const dx = end.x - start.x; const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared ? Math.max(0, Math.min(1, ((dot.x - start.x) * dx + (dot.y - start.y) * dy) / lengthSquared)) : 0;
  return Math.hypot(dot.x - (start.x + dx * t), dot.y - (start.y + dy * t)) <= radius;
}
