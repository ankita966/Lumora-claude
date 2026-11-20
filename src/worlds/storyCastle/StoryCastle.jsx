import React, { useEffect, useRef, useState } from 'react';
import TopBar from '../../components/TopBar';
import RoundHeader from '../../components/RoundHeader';
import Mascot from '../../components/Mascot';
import WorldCompleteOverlay from '../../components/WorldCompleteOverlay';
import HandCursorLayer from '../../components/HandCursorLayer';
import { useWorldFlow } from '../../hooks/useWorldFlow';
import { useCursor } from '../../hooks/useCursor';
import { useSpeechRecognition, isSpeechRecognitionSupported, speak, wordOverlapScore } from '../../hooks/useSpeechRecognition';
import { WORLDS } from '../../data/worlds';

const COLOR = WORLDS.storyCastle.color;
const MAGIC = '#4fd8ff';
const rounds = [
  { title: '✨ MAGIC WORDS', subtitle: 'Find the magical word!' },
  { title: '🧩 MISSING WORD', subtitle: 'Build the story with the right word.' },
  { title: '🎤 READ ALOUD', subtitle: 'Read the little story to Phono.' },
  { title: '📖 STORY PATH', subtitle: 'Choose what Luna should do next.' },
  { title: '👑 STORY QUESTION', subtitle: 'Show what you remember from Luna’s story.' },
];

export default function StoryCastle() {
  const flow = useWorldFlow({ worldKey: 'storyCastle', skill: 'reading', xpPerRound: 160, worldBonus: 250 });
  const areaRef = useRef(null); const cursor = useCursor(areaRef, true);
  const [intro, setIntro] = useState(true);
  const round = rounds[flow.roundIndex];
  useEffect(() => { const timer = setTimeout(() => setIntro(false), 900); return () => clearTimeout(timer); }, [flow.roundIndex]);
  const finish = (accuracy, message) => flow.completeRound(accuracy, message);
  return <div>
    <TopBar worldColor={COLOR} roundCount={5} currentRound={flow.completed ? 5 : flow.roundNumber} />
    <div className="game-shell">
      {!flow.completed && <RoundHeader title={round.title} subtitle={round.subtitle} color={COLOR} />}
      <div className="play-area story-castle-area" ref={areaRef} style={{ '--world-color': COLOR }}>
        <CastleAtmosphere />
        <HandCursorLayer
          videoRef={cursor.videoRef}
          pixel={cursor.pixel}
          cameraStatus={cursor.cameraStatus}
          handDetected={cursor.handDetected}
          gesture={cursor.gesture}
          gestureLabel={cursor.gestureLabel}
          pinching={cursor.pinching}
          interacting={cursor.pinching}
          color={MAGIC}
          showMirror
          showCursor
        />
        {!flow.completed && !intro && <StoryRound key={flow.roundIndex} index={flow.roundIndex} cursor={cursor} onSolved={finish} onWrong={flow.registerAttempt} />}
        {intro && !flow.completed && <div className="story-intro"><span>🏰</span><strong>{flow.roundIndex === 0 ? 'Your story awaits…' : `Round ${flow.roundNumber}`}</strong></div>}
        {flow.transitioning && <div className="round-transition-overlay"><span className="round-transition-text">✨ The castle portal is opening…</span></div>}
        {flow.completed && <WorldCompleteOverlay title="✨ STORY MASTERED ✨" subtitle="🏆 CASTLE COMPLETE — Reading, voice, and comprehension magic unlocked!" bonusXp={250} color={COLOR} results={[{ label: 'Reading Quest', value: 'Complete' }, { label: 'Voice Quest', value: 'Complete' }, { label: 'Comprehension', value: 'Complete' }]} onRestart={flow.restart} />}
      </div>
    </div>
    <Mascot color={COLOR} icon="🦉" message={flow.message || 'Your magical story is ready!'} />
  </div>;
}

function StoryRound({ index, cursor, onSolved, onWrong }) {
  if (index === 0) return <MagicWords cursor={cursor} onSolved={onSolved} onWrong={onWrong} />;
  if (index === 1) return <MissingWord cursor={cursor} onSolved={onSolved} onWrong={onWrong} />;
  if (index === 2) return <ReadAloud onSolved={onSolved} />;
  if (index === 3) return <StoryPath cursor={cursor} onSolved={onSolved} />;
  return <StoryQuestion cursor={cursor} onSolved={onSolved} onWrong={onWrong} />;
}

function MagicWords({ cursor, onSolved, onWrong }) {
  const choices = [{ label: 'FROG', x: 30, y: 38 }, { label: 'DOG', x: 53, y: 66 }, { label: 'SUN', x: 72, y: 38 }];
  return <ChoiceStage prompt="✨ Find FROG! ✨" choices={choices} correct="FROG" cursor={cursor} onCorrect={() => onSolved(1, '✨ Perfect! You found FROG!')} onWrong={onWrong} />;
}
function MissingWord({ cursor, onSolved, onWrong }) {
  const choices = [{ label: 'IN', x: 28, y: 63 }, { label: 'ON', x: 49, y: 72 }, { label: 'UNDER', x: 70, y: 60 }, { label: 'BLUE', x: 78, y: 35 }];
  return <ChoiceStage prompt={<>The cat is <span className="story-blank">___</span> the box.</>} choices={choices} correct="IN" cursor={cursor} onCorrect={() => onSolved(1, '✨ The story is complete!')} onWrong={onWrong} />;
}
function StoryQuestion({ cursor, onSolved, onWrong }) {
  const choices = [{ label: 'To find magic', x: 28, y: 58 }, { label: 'To go home', x: 51, y: 72 }, { label: 'To hide', x: 74, y: 58 }];
  return <ChoiceStage prompt="Why did Luna open the glowing door?" choices={choices} correct="To find magic" cursor={cursor} onCorrect={() => onSolved(1, '👑 Brilliant story magic!')} onWrong={onWrong} />;
}

function ChoiceStage({ prompt, choices, correct, cursor, onCorrect, onWrong }) {
  const [feedback, setFeedback] = useState(''); const doneRef = useRef(false);
  const choose = (choice) => {
    if (doneRef.current) return;
    if (choice === correct) { doneRef.current = true; setFeedback('✨ Wonderful!'); setTimeout(onCorrect, 550); }
    else { setFeedback('Try another glowing word ✨'); onWrong(); }
  };
  useDwellChoice(cursor, choices, choose, doneRef);
  return <div className="story-choice-stage">
    <div className="story-prompt">{prompt}</div><div className="story-choice-hint">Tap a word, or hold your fingertip over it.</div>
    {choices.map((choice, i) => <button key={choice.label} className="story-word-orb" style={{ left: `${choice.x}%`, top: `${choice.y}%`, '--delay': `${i * 120}ms` }} onClick={() => choose(choice.label)}>{choice.label}</button>)}
    {feedback && <div className="story-feedback">{feedback}</div>}
  </div>;
}

function ReadAloud({ onSolved }) {
  const speech = useSpeechRecognition({ lang: 'en-US' }); const [finished, setFinished] = useState(false); const [started, setStarted] = useState(false); const [phase, setPhase] = useState('ready'); const [feedback, setFeedback] = useState(''); const completedRef = useRef(false);
  const sentence = 'The little fox runs to the moon.';
  const supported = isSpeechRecognitionSupported();
  const startReading = async () => {
    setStarted(true); setFinished(false); setFeedback(''); setPhase('listening');
    await speech.start();
  };
  const toggle = () => {
    if (speech.listening) { speech.stop(); setPhase('processing'); }
    else startReading();
  };
  useEffect(() => { if (speech.listening) setPhase('listening'); }, [speech.listening]);
  useEffect(() => {
    if (!speech.error) return;
    setStarted(false); setPhase('retry');
  }, [speech.error]);
  useEffect(() => {
    if (!supported || !started || speech.listening || !speech.transcript || completedRef.current) return;
    const score = wordOverlapScore(sentence, speech.transcript);
    if (score >= .67) { completedRef.current = true; setFinished(true); setPhase('success'); setFeedback('✅ HEARD — ✨ Great reading!'); setTimeout(() => onSolved(score, '✨ Great reading!'), 650); }
    else { setStarted(false); setPhase('retry'); setFeedback('Almost there — try reading the whole sentence once more.'); }
  }, [supported, started, speech.listening, speech.transcript, sentence, onSolved]);
  const status = phase === 'listening' ? 'Phono is listening to your real voice…' : phase === 'processing' ? '✨ Processing what Phono heard…' : feedback || (supported ? '🟢 READY — Tap to read aloud.' : 'You can still listen to the sentence below.');
  return <div className="story-read-stage"><div className="story-prompt">“{sentence}”</div>{supported ? <button className={`story-mic ${speech.listening ? 'listening' : ''}`} onClick={toggle} disabled={finished}>{speech.listening ? '🔴 LISTENING…' : phase === 'processing' ? '✨ PROCESSING…' : phase === 'retry' ? '🎤 TRY AGAIN' : '🎤 START READING'}</button> : <div className="story-voice-unavailable">Voice reading isn’t supported in this browser. Try Chrome to use Phono’s microphone check.</div>}<p>{status}</p>{speech.interim && <div className="story-heard">Hearing: “{speech.interim}”</div>}{speech.transcript && <div className="story-heard">You said: “{speech.transcript}”</div>}{speech.error && <div className="story-voice-unavailable">{speech.error}</div>}<button className="story-listen-btn" onClick={() => speak(sentence)}>🔊 Hear the story</button></div>;
}

function StoryPath({ cursor, onSolved }) {
  const scenes = [
    { text: 'Luna entered the enchanted forest. A tiny glowing door appeared beneath an old oak tree.', action: '🌟 Open the glowing door' },
    { text: 'Behind the door, Luna found a moon-map and a friendly fox. The map pointed toward the castle.', action: '🗺 Follow the moon-map' },
    { text: 'At the castle, Luna shared the moon-map with her friends. Together, they made the stars shine brighter.', action: '🏰 Finish the story' },
  ];
  const [scene, setScene] = useState(0); const choices = [{ label: scenes[scene].action, x: 50, y: 68 }];
  const advance = () => { if (scene + 1 >= scenes.length) setTimeout(() => onSolved(1, '📖 You played the whole story!'), 400); else setScene((n) => n + 1); };
  useDwellChoice(cursor, choices, advance, useRef(false));
  return <div className="story-path-stage"><div className="story-scene-count">Story scene {scene + 1} of {scenes.length}</div><div className="story-scroll">{scenes[scene].text}</div><button className="story-portal-choice" onClick={advance}>{scenes[scene].action} ✨</button><button className="story-listen-btn" onClick={() => speak(scenes[scene].text)}>🔊 Read with Phono</button></div>;
}

function useDwellChoice(cursor, choices, choose, doneRef) {
  const dwellRef = useRef({ label: null, started: 0 });
  useEffect(() => {
    if (!cursor.usingHand || !cursor.pixel || doneRef.current) { dwellRef.current = { label: null, started: 0 }; return; }
    const point = { x: cursor.pixel.nx * 100, y: cursor.pixel.ny * 100 };
    const target = choices.find((choice) => Math.hypot(point.x - choice.x, point.y - choice.y) < 9);
    if (!target) { dwellRef.current = { label: null, started: 0 }; return; }
    if (dwellRef.current.label !== target.label) dwellRef.current = { label: target.label, started: Date.now() };
    else if (Date.now() - dwellRef.current.started > 650) { dwellRef.current.started = Number.MAX_SAFE_INTEGER; choose(target.label); }
  }, [cursor.pixel, cursor.usingHand, choices, choose, doneRef]);
}

function CastleAtmosphere() { return <div className="castle-atmosphere" aria-hidden="true"><span>✦</span><span>📖</span><span>✧</span><span>🕯️</span><span>✦</span></div>; }
