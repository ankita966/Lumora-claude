import React, { useCallback, useEffect, useRef, useState } from 'react';
import TopBar from '../../components/TopBar';
import RoundHeader from '../../components/RoundHeader';
import Mascot from '../../components/Mascot';
import WorldCompleteOverlay from '../../components/WorldCompleteOverlay';
import HandCursorLayer from '../../components/HandCursorLayer';
import { useWorldFlow } from '../../hooks/useWorldFlow';
import { useCursor } from '../../hooks/useCursor';
import { useGameStore } from '../../store/useGameStore';
import { WORLDS } from '../../data/worlds';

const COLOR = WORLDS.visionValley.color;
const VISION_ROUNDS = [
  { title: 'ROUND 1 — FOLLOW', comp: FollowRound },
  { title: 'ROUND 2 — CATCH', comp: CatchRound },
  { title: 'ROUND 3 — SELECT', comp: SelectRound },
  { title: 'ROUND 4 — SLASH', comp: SlashRound },
  { title: 'ROUND 5 — MIXED MAGIC', comp: MixedRound },
];
const point = (cursor) => cursor.pixel ? { x: cursor.pixel.nx * 100, y: cursor.pixel.ny * 100 } : null;
const randomPoint = () => ({ x: 14 + Math.random() * 72, y: 18 + Math.random() * 62 });
const near = (a, b, r = 8) => Math.hypot(a.x - b.x, a.y - b.y) < r;
function segmentHits(a, b, c, r = 8) {
  const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy;
  const t = l ? Math.max(0, Math.min(1, ((c.x - a.x) * dx + (c.y - a.y) * dy) / l)) : 0;
  return Math.hypot(c.x - (a.x + dx * t), c.y - (a.y + dy * t)) < r;
}

function useActionScore() {
  const addXp = useGameStore((s) => s.addXp);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bursts, setBursts] = useState([]);
  const reward = useCallback((x, y, amount = 20) => {
    const id = `${Date.now()}-${Math.random()}`;
    setScore((n) => n + 1); setCombo((n) => n + 1); addXp(amount);
    setBursts((items) => [...items, { id, x, y, amount }]);
    setTimeout(() => setBursts((items) => items.filter((item) => item.id !== id)), 800);
  }, [addXp]);
  return { score, combo, bursts, reward, miss: useCallback(() => setCombo(0), []) };
}
function Score({ label, score, total, combo }) {
  return <div className="game-score-panel"><div className="game-score-item">{label}: <span className="score-value">{score}/{total}</span></div>{combo > 1 && <div className="combo-counter">✨ Combo x{combo}</div>}</div>;
}
function Effects({ bursts, feedback = [] }) {
  return <>{bursts.map((b) => <div key={b.id} className="xp-burst" style={{ left: `${b.x}%`, top: `${b.y}%` }}>+{b.amount} XP ✨</div>)}{feedback.map((f) => <div key={f.id} style={{ position: 'absolute', left: `${f.x}%`, top: `${f.y}%`, transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 18, color: f.good ? '#d7fff0' : '#ffd0d0', fontSize: 34, fontWeight: 900, textShadow: `0 0 18px ${f.good ? COLOR : '#ff6b7a'}`, animation: 'slice-explode .45s ease-out forwards' }}>{f.good ? '✦' : '×'}</div>)}</>;
}
function Instruction({ title, detail }) {
  return <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 12, textAlign: 'center', pointerEvents: 'none' }}><div style={{ fontWeight: 900, color: 'var(--text-hi)', textShadow: `0 0 14px ${COLOR}` }}>{title}</div><div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 3 }}>{detail}</div></div>;
}
function Bubble({ item, label }) {
  return <div className="floating-target" style={{ left: `${item.x}%`, top: `${item.y}%`, transform: 'translate(-50%,-50%)', width: item.size || 58, height: item.size || 58, borderColor: item.color || COLOR, boxShadow: `0 0 23px ${item.color || COLOR}`, background: item.background || 'rgba(79,216,255,.14)', '--slide': item.slide || '.12s', flexDirection: label ? 'column' : undefined, gap: label ? 3 : undefined }}><span style={{ fontSize: item.fontSize || 27 }}>{item.icon}</span>{label && <span style={{ fontSize: 11, fontWeight: 800 }}>{label}</span>}</div>;
}

export default function VisionValley() {
  const flow = useWorldFlow({ worldKey: 'visionValley', skill: 'vision', totalRounds: VISION_ROUNDS.length, xpPerRound: 150, worldBonus: 200 });
  const xp = useGameStore((s) => s.xp);
  const startingXpRef = useRef(xp);
  const areaRef = useRef(null);
  const cursor = useCursor(areaRef, !flow.completed);
  const current = VISION_ROUNDS[flow.roundIndex];
  const Round = current?.comp;
  const earnedXp = Math.max(0, xp - startingXpRef.current);
  const replay = () => { startingXpRef.current = xp; flow.restart(); };
  return <div><TopBar worldColor={COLOR} roundCount={flow.totalRounds} currentRound={flow.roundNumber} /><div className="game-shell">{!flow.completed && <>{current && <RoundHeader title={current.title} subtitle={Round.subtitle} color={COLOR} />}<div className="play-area" ref={areaRef} style={{ '--world-color': COLOR }}><HandCursorLayer videoRef={cursor.videoRef} pixel={cursor.pixel} cameraStatus={cursor.cameraStatus} handDetected={cursor.handDetected} gesture={cursor.gesture} gestureLabel={cursor.gestureLabel} pinching={cursor.pinching} interacting={cursor.pinching} color={COLOR} showMirror showCursor />{Round ? <Round key={flow.roundIndex} cursor={cursor} onSolved={(a, m) => flow.completeRound(a, m)} onWrong={flow.registerAttempt} /> : <div className="round-transition-overlay">Preparing the next Vision Valley challenge…</div>}{flow.transitioning && <div className="round-transition-overlay">✨ Great job! The next challenge is appearing…</div>}</div></>}{flow.completed && <div className="play-area" style={{ '--world-color': COLOR }}><WorldCompleteOverlay title="👁️ Vision Valley Complete!" subtitle="You completed all five hand-powered visual quests!" bonusXp={200} color={COLOR} results={[{ label: 'Final progress', value: '5/5 rounds' }, { label: 'XP earned', value: `+${earnedXp}` }]} continueLabel="Continue to World Map" onRestart={replay} /></div>}</div><Mascot color={COLOR} icon="🦉" message={flow.message} /></div>;
}

function FollowRound({ cursor, onSolved }) {
  const total = 4, [target, setTarget] = useState(randomPoint), [feedback, setFeedback] = useState([]), locked = useRef(false);
  const { score, combo, bursts, reward } = useActionScore();
  useEffect(() => { const id = setInterval(() => !locked.current && setTarget(randomPoint()), 1800); return () => clearInterval(id); }, []);
  useEffect(() => { const p = point(cursor); if (!p || locked.current || !near(p, target)) return; locked.current = true; const id = `${Date.now()}-follow`; reward(target.x, target.y); setFeedback([{ id, ...target, good: true }]); setTimeout(() => setFeedback([]), 420); setTimeout(() => { if (score + 1 >= total) onSolved(1, 'Starlight followed perfectly! ✨'); else { setTarget(randomPoint()); locked.current = false; } }, 450); }, [cursor.pixel, target, score, reward, onSolved]);
  return <><Instruction title="FOLLOW the glowing star" detail="Move your cyan magic cursor onto it" /><Score label="Stars followed" score={score} total={total} combo={combo} /><Bubble item={{ ...target, icon: '⭐', size: 64, slide: '1.6s' }} /><Effects bursts={bursts} feedback={feedback} /></>;
}
FollowRound.subtitle = 'Follow each moving star with your fingertip.';

function CatchRound({ cursor, onSolved, onWrong }) {
  const total = 5, [objects, setObjects] = useState([]), [feedback, setFeedback] = useState([]), ids = useRef(0), done = useRef(false);
  const { score, combo, bursts, reward, miss } = useActionScore();
  const spawn = useCallback(() => { const good = Math.random() > .3, pos = randomPoint(); setObjects((items) => items.length >= 4 ? items : [...items, { id: ++ids.current, ...pos, good, icon: good ? ['💎', '🌟', '🔮'][Math.floor(Math.random() * 3)] : '🌧️', color: good ? COLOR : '#ff7a91', dx: (Math.random() - .5) * .10, dy: .035 + Math.random() * .07 }]); }, []);
  useEffect(() => { spawn(); spawn(); const id = setInterval(spawn, 1050); return () => clearInterval(id); }, [spawn]);
  useEffect(() => { let frame; const move = () => { setObjects((items) => items.map((o) => ({ ...o, x: Math.max(8, Math.min(92, o.x + o.dx)), y: o.y > 91 ? 12 : o.y + o.dy }))); frame = requestAnimationFrame(move); }; frame = requestAnimationFrame(move); return () => cancelAnimationFrame(frame); }, []);
  useEffect(() => { const p = point(cursor); if (!p || done.current) return; setObjects((items) => { const hit = items.find((o) => near(p, o, 7)); if (!hit) return items; const id = `${Date.now()}-catch`; setFeedback((f) => [...f, { id, ...hit, good: hit.good }]); setTimeout(() => setFeedback((f) => f.filter((x) => x.id !== id)), 420); if (hit.good) { reward(hit.x, hit.y); if (score + 1 >= total) { done.current = true; setTimeout(() => onSolved(1, 'You caught every light! 🌟'), 430); } } else { miss(); onWrong(); } return items.filter((o) => o.id !== hit.id); }); }, [cursor.pixel, score, reward, miss, onSolved, onWrong]);
  return <><Instruction title="CATCH the sparkling lights" detail="Touch gems — avoid rainy clouds" /><Score label="Lights caught" score={score} total={total} combo={combo} />{objects.map((o) => <Bubble key={o.id} item={{ ...o, size: 54, background: o.good ? 'rgba(79,216,255,.14)' : 'rgba(255,90,120,.14)', slide: '.08s' }} />)}<Effects bursts={bursts} feedback={feedback} /></>;
}
CatchRound.subtitle = 'Catch glowing objects with your fingertip; avoid clouds.';

const QUESTIONS = [
  { text: 'Select the blue moon', correct: 'moon', options: [['moon', '🌙', 'Blue Moon', COLOR], ['sun', '☀️', 'Sun', '#ffc857'], ['leaf', '🍃', 'Leaf', '#3ee08a']] },
  { text: 'Select the golden star', correct: 'star', options: [['crystal', '💎', 'Crystal', COLOR], ['star', '⭐', 'Golden Star', '#ffc857'], ['heart', '💗', 'Heart', '#ff5cad']] },
  { text: 'Select the cyan crystal', correct: 'crystal', options: [['crystal', '💎', 'Cyan Crystal', COLOR], ['moon', '🌙', 'Moon', '#b98bff'], ['cloud', '☁️', 'Cloud', '#c9d7ff']] },
];
const SELECT_SPOTS = [{ x: 25, y: 58 }, { x: 50, y: 42 }, { x: 75, y: 58 }];
function SelectRound({ cursor, onSolved, onWrong }) {
  const [index, setIndex] = useState(0), [feedback, setFeedback] = useState([]), locked = useRef(false);
  const { score, combo, bursts, reward, miss } = useActionScore(), question = QUESTIONS[index];
  useEffect(() => { const p = point(cursor); if (!p || locked.current) return; const i = SELECT_SPOTS.findIndex((spot) => near(p, spot, 9)); if (i < 0) return; locked.current = true; const [idName] = question.options[i], spot = SELECT_SPOTS[i], good = idName === question.correct, id = `${Date.now()}-select`; setFeedback([{ id, ...spot, good }]); setTimeout(() => setFeedback([]), 420); if (good) reward(spot.x, spot.y); else { miss(); onWrong(); } setTimeout(() => { if (good && score + 1 >= QUESTIONS.length) onSolved(1, 'Your visual choices were brilliant! 👁️'); else { setIndex((n) => (n + 1) % QUESTIONS.length); locked.current = false; } }, 480); }, [cursor.pixel, question, score, reward, miss, onSolved, onWrong]);
  return <><Instruction title={question.text} detail="Move your fingertip onto the matching visual" /><Score label="Correct selections" score={score} total={QUESTIONS.length} combo={combo} />{question.options.map(([id, icon, label, color], i) => <Bubble key={id} item={{ ...SELECT_SPOTS[i], icon, color, size: 94, background: 'rgba(10,22,48,.76)' }} label={label} />)}<Effects bursts={bursts} feedback={feedback} /></>;
}
SelectRound.subtitle = 'Select the visual target that matches the instruction.';

function SlashRound({ cursor, onSolved, onWrong }) {
  const total = 4, [targets, setTargets] = useState([]), [feedback, setFeedback] = useState([]), previous = useRef(null), ids = useRef(0), done = useRef(false);
  const { score, combo, bursts, reward, miss } = useActionScore();
  const spawn = useCallback(() => { const good = Math.random() > .32, pos = randomPoint(); setTargets((items) => items.length >= 5 ? items : [...items, { id: ++ids.current, ...pos, good, icon: good ? '⭐' : '☁️', color: good ? COLOR : '#ff7a91', dx: (Math.random() - .5) * .11, dy: (Math.random() - .5) * .08 }]); }, []);
  useEffect(() => { spawn(); spawn(); spawn(); const id = setInterval(spawn, 1000); return () => clearInterval(id); }, [spawn]);
  useEffect(() => { let frame; const move = () => { setTargets((items) => items.map((o) => ({ ...o, x: Math.max(8, Math.min(92, o.x + o.dx)), y: Math.max(14, Math.min(88, o.y + o.dy)) }))); frame = requestAnimationFrame(move); }; frame = requestAnimationFrame(move); return () => cancelAnimationFrame(frame); }, []);
  useEffect(() => { const current = point(cursor), last = previous.current; previous.current = current; if (!current || !last || done.current) return; setTargets((items) => { const hits = items.filter((o) => segmentHits(last, current, o, 7)); if (!hits.length) return items; hits.forEach((hit) => { const id = `${Date.now()}-${hit.id}`; setFeedback((f) => [...f, { id, ...hit, good: hit.good }]); setTimeout(() => setFeedback((f) => f.filter((x) => x.id !== id)), 420); if (hit.good) { reward(hit.x, hit.y); if (score + 1 >= total) { done.current = true; setTimeout(() => onSolved(1, 'Lightning-fast star slashes! ⚡'), 440); } } else { miss(); onWrong(); } }); return items.filter((o) => !hits.some((hit) => hit.id === o.id)); }); }, [cursor.pixel, score, reward, miss, onSolved, onWrong]);
  return <><Instruction title="SLASH the stars" detail="Swipe through stars — avoid clouds" /><Score label="Stars slashed" score={score} total={total} combo={combo} />{targets.map((o) => <Bubble key={o.id} item={{ ...o, background: o.good ? 'rgba(79,216,255,.16)' : 'rgba(255,90,120,.14)', slide: '.08s' }} />)}<Effects bursts={bursts} feedback={feedback} /></>;
}
SlashRound.subtitle = 'Swipe your fingertip through moving star targets.';

function MixedRound({ cursor, onSolved, onWrong }) {
  const names = ['FOLLOW', 'CATCH', 'SELECT', 'SLASH'];
  const [stage, setStage] = useState(0), [target, setTarget] = useState(randomPoint), [slash, setSlash] = useState(randomPoint), previous = useRef(null), locked = useRef(false);
  const { score, combo, bursts, reward, miss } = useActionScore();
  const advance = useCallback((x, y) => { if (locked.current) return; locked.current = true; reward(x, y, 25); setTimeout(() => { if (stage === 3) onSolved(1, 'Vision Valley mastered — every magic move complete! 🏆'); else { setStage((n) => n + 1); setTarget(randomPoint()); setSlash(randomPoint()); locked.current = false; } }, 480); }, [stage, reward, onSolved]);
  useEffect(() => { if (stage !== 0 && stage !== 1) return undefined; const id = setInterval(() => !locked.current && setTarget(randomPoint()), stage === 0 ? 1500 : 700); return () => clearInterval(id); }, [stage]);
  useEffect(() => { const p = point(cursor); if (!p || locked.current) return; if ((stage === 0 || stage === 1) && near(p, target)) advance(target.x, target.y); if (stage === 2) { const spots = [{ x: 35, y: 57 }, { x: 65, y: 57 }], hit = spots.findIndex((s) => near(p, s, 9)); if (hit === 0) advance(spots[0].x, spots[0].y); else if (hit === 1) { miss(); onWrong(); setTarget(randomPoint()); } } if (stage === 3) { const last = previous.current; previous.current = p; if (last && segmentHits(last, p, slash, 8)) advance(slash.x, slash.y); } }, [cursor.pixel, stage, target, slash, advance, miss, onWrong]);
  const copy = ['Follow the star', 'Catch the moving comet', 'Select the cyan crystal', 'Slash the final star'][stage];
  return <><Instruction title={`MIXED MAGIC ${stage + 1}/4 — ${names[stage]}`} detail={copy} /><Score label="Magic moves" score={score} total={4} combo={combo} />{(stage === 0 || stage === 1) && <Bubble item={{ ...target, icon: stage === 0 ? '⭐' : '☄️', slide: stage === 0 ? '1.4s' : '.25s' }} />}{stage === 2 && <>{<Bubble item={{ x: 35, y: 57, icon: '💎', size: 94, color: COLOR, background: 'rgba(10,22,48,.76)' }} label="Cyan crystal" />}{<Bubble item={{ x: 65, y: 57, icon: '🔥', size: 94, color: '#ff5cad', background: 'rgba(10,22,48,.76)' }} label="Flame" />}</>}{stage === 3 && <Bubble item={{ ...slash, icon: '⭐' }} />}<Effects bursts={bursts} /></>;
}
MixedRound.subtitle = 'Finish with Follow, Catch, Select, and Slash.';
