import React, { useEffect, useMemo, useState } from 'react';
import TopBar from '../../components/TopBar';
import RoundHeader from '../../components/RoundHeader';
import Mascot from '../../components/Mascot';
import WorldCompleteOverlay from '../../components/WorldCompleteOverlay';
import { useWorldFlow } from '../../hooks/useWorldFlow';
import { useSpeechRecognition, speak, wordOverlapScore, isSpeechRecognitionSupported } from '../../hooks/useSpeechRecognition';
import { WORLDS } from '../../data/worlds';

const COLOR = WORLDS.soundForest.color;

// word: label, emoji, starting phoneme
const WORD_BANK = [
  { word: 'Rabbit', emoji: '🐰', sound: '/r/' },
  { word: 'Rocket', emoji: '🚀', sound: '/r/' },
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
];

function shuffled(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function SoundForest() {
  const flow = useWorldFlow({ worldKey: 'soundForest', skill: 'sound', xpPerRound: 150, worldBonus: 200 });

  const roundConfigs = [
    { title: 'ROUND 1 — SOUND SLASH', comp: SoundSlash },
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
            <div className="play-area" style={{ '--world-color': COLOR }}>
              <RoundComp key={flow.roundIndex} onSolved={(acc, msg) => flow.completeRound(acc, msg)} onWrong={flow.registerAttempt} />
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

/* ---------------- Round 1: Sound Slash ---------------- */
function SoundSlash({ onSolved, onWrong }) {
  const target = useMemo(() => WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)], []);
  const matching = useMemo(() => WORD_BANK.filter((w) => w.sound === target.sound), [target]);
  const others = useMemo(() => WORD_BANK.filter((w) => w.sound !== target.sound), [target]);
  const [sliced, setSliced] = useState(0);
  const goal = Math.min(3, matching.length);
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    speak(`Catch objects starting with the ${target.sound.replace(/\//g, '')} sound`);
  }, [target]);

  useEffect(() => {
    let cancelled = false;
    function spawn() {
      if (cancelled) return;
      const useMatch = Math.random() < 0.55;
      const bank = useMatch ? matching : others;
      const item = bank[Math.floor(Math.random() * bank.length)];
      setCurrent({ ...item, x: 15 + Math.random() * 70, id: Math.random() });
    }
    spawn();
    const interval = setInterval(spawn, 1600);
    return () => { cancelled = true; clearInterval(interval); };
  }, [matching, others]);

  function tap() {
    if (!current) return;
    if (current.sound === target.sound) {
      const next = sliced + 1;
      setSliced(next);
      if (next >= goal) onSolved(1, `Great catching! All ${target.sound} sounds found 🍃`);
    } else {
      onWrong();
    }
    setCurrent(null);
  }

  return (
    <>
      <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
        <div style={{
          background: 'rgba(62,224,138,0.12)', border: `1px solid ${COLOR}`, borderRadius: 14,
          padding: '10px 20px', fontWeight: 800, color: COLOR,
        }}>
          {target.emoji} {target.word.toUpperCase()} ({target.sound})
        </div>
        <div style={{ color: 'var(--text-mid)', fontSize: 12, marginTop: 8 }}>{sliced}/{goal} caught</div>
      </div>
      {current && (
        <button
          className="floating-target"
          style={{ left: `${current.x}%`, top: '58%', '--slide': '0.9s' }}
          onClick={tap}
        >
          {current.emoji}
        </button>
      )}
    </>
  );
}
SoundSlash.subtitle = 'Catch objects that start with the highlighted sound!';

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
