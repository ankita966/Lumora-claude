import React, { useEffect, useMemo, useState } from 'react';
import TopBar from '../../components/TopBar';
import RoundHeader from '../../components/RoundHeader';
import Mascot from '../../components/Mascot';
import WorldCompleteOverlay from '../../components/WorldCompleteOverlay';
import { useWorldFlow } from '../../hooks/useWorldFlow';
import { useSpeechRecognition, isSpeechRecognitionSupported, speak } from '../../hooks/useSpeechRecognition';
import { WORLDS } from '../../data/worlds';

const COLOR = WORLDS.storyCastle.color;

export default function StoryCastle() {
  const flow = useWorldFlow({ worldKey: 'storyCastle', skill: 'reading', xpPerRound: 160, worldBonus: 200 });

  const roundConfigs = [
    { title: 'ROUND 1 — WORD WARM-UP', comp: () => <ReadAloud text="castle" prompt="Read this magic word aloud:" isWord /> },
    { title: 'ROUND 2 — READ THE SENTENCE', comp: () => <ReadAloud text="The brave fox jumped over the wall." prompt="Read this sentence aloud:" /> },
    { title: 'ROUND 3 — SHORT PASSAGE', comp: () => <ReadAloud text="Maya found a glowing key in the old tower. She opened the door and saw a hidden garden." prompt="Read this short story aloud:" /> },
    { title: 'ROUND 4 — COMPREHENSION', comp: Comprehension },
    { title: 'ROUND 5 — FLUENCY CHALLENGE', comp: () => <ReadAloud text="Every child learns differently, and every story can be read in a new way." prompt="Read as smoothly as you can:" timed /> },
  ];
  const current = roundConfigs[flow.roundIndex];
  const RoundComp = current.comp;

  return (
    <div>
      <TopBar worldColor={COLOR} roundCount={flow.totalRounds} currentRound={flow.roundNumber} />
      <div className="game-shell">
        {!flow.completed && (
          <>
            <RoundHeader title={current.title} color={COLOR} />
            <div className="play-area" style={{ '--world-color': COLOR }}>
              <RoundContext.Provider value={{ onSolved: (acc, msg) => flow.completeRound(acc, msg), onWrong: flow.registerAttempt }}>
                <RoundComp key={flow.roundIndex} />
              </RoundContext.Provider>
            </div>
          </>
        )}
        {flow.completed && (
          <WorldCompleteOverlay
            title="🏰 STORY CASTLE MASTER!"
            subtitle="You completed all 5 rounds of Reading & Comprehension Quests!"
            color={COLOR}
            onRestart={flow.restart}
          />
        )}
      </div>
      <Mascot color={COLOR} icon="🦉" message={flow.message} />
    </div>
  );
}

const RoundContext = React.createContext({ onSolved: () => {}, onWrong: () => {} });

/* ---------------- Shared Read-Aloud mechanic ---------------- */
function ReadAloud({ text, prompt, isWord = false, timed = false }) {
  const { onSolved, onWrong } = React.useContext(RoundContext);
  const words = useMemo(() => text.split(/\s+/), [text]);
  const speech = useSpeechRecognition({ lang: 'en-US' });
  const supported = isSpeechRecognitionSupported();
  const [heardWords, setHeardWords] = useState(new Set());
  const [finished, setFinished] = useState(false);
  const [startedAt, setStartedAt] = useState(null);

  useEffect(() => {
    if (!speech.transcript && !speech.interim) return;
    const combined = (speech.transcript + ' ' + speech.interim).toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const heardSet = new Set(combined.split(/\s+/).filter(Boolean));
    const nextHeard = new Set(heardWords);
    words.forEach((w) => {
      const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (heardSet.has(clean)) nextHeard.add(clean);
    });
    setHeardWords(nextHeard);
  }, [speech.transcript, speech.interim]); // eslint-disable-line react-hooks/exhaustive-deps

  function evaluate() {
    const cleanWords = words.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const matched = cleanWords.filter((w) => heardWords.has(w)).length;
    const accuracy = Math.max(0.15, matched / cleanWords.length);
    const timeMs = startedAt ? Date.now() - startedAt : 4000;
    setFinished(true);
    if (accuracy >= 0.6) onSolved(accuracy, isWord ? 'Lovely reading! 📖' : `Great fluency — ${Math.round(accuracy * 100)}% of words heard!`);
    else {
      onWrong();
      onSolved(accuracy, `You read ${matched} of ${cleanWords.length} words — nice try, want to hear it again?`);
    }
  }

  function toggleMic() {
    if (speech.listening) {
      speech.stop();
      evaluate();
    } else {
      setStartedAt(Date.now());
      setHeardWords(new Set());
      setFinished(false);
      speech.start();
    }
  }

  return (
    <div style={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <p style={{ color: 'var(--text-mid)', marginBottom: 14 }}>{prompt}</p>
      <div className="passage-card">
        {words.map((w, i) => {
          const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '');
          const cls = heardWords.has(clean) ? 'heard' : '';
          return (
            <span key={i} className={`word-span ${cls}`}>
              {w}{' '}
            </span>
          );
        })}
      </div>

      {supported ? (
        <>
          <button className={`mic-button ${speech.listening ? 'listening' : ''}`} onClick={toggleMic} disabled={finished}>
            🎤
          </button>
          <p style={{ color: 'var(--text-mid)', fontSize: 13, marginTop: 12 }}>
            {speech.listening
              ? 'Listening — read the ' + (isWord ? 'word' : 'text') + ' out loud, then tap the mic to finish.'
              : speech.permission === 'denied'
              ? 'Microphone permission was denied. Please allow mic access and try again.'
              : finished
              ? 'Nice work! Moving on…'
              : 'Tap the mic to start reading aloud.'}
          </p>
          {speech.error && <p style={{ color: '#ff9a9a', fontSize: 12 }}>{speech.error}</p>}
        </>
      ) : (
        <FallbackTapReading words={words} onDone={(accuracy) => {
          if (accuracy >= 0.6) onSolved(accuracy, 'Nice reading! 📖');
          else { onWrong(); onSolved(accuracy, 'Good effort — keep practicing!'); }
        }} />
      )}

      {timed && speech.listening && <p style={{ color: 'var(--text-low)', fontSize: 11, marginTop: 6 }}>⏱ Reading in progress…</p>}

      <button className="btn-pill btn-ghost" style={{ marginTop: 14, borderColor: COLOR }} onClick={() => speak(text)}>
        🔊 Hear it read aloud
      </button>
    </div>
  );
}

// Used only when the browser has no SpeechRecognition support at all —
// lets the child tap each word as they read it instead of pretending to
// detect speech that was never actually heard.
function FallbackTapReading({ words, onDone }) {
  const [tapped, setTapped] = useState(new Set());
  return (
    <div>
      <p style={{ color: 'var(--text-mid)', fontSize: 13, marginBottom: 10 }}>
        Speech recognition isn't supported in this browser. Read aloud and tap each word as you say it:
      </p>
      <div className="passage-card">
        {words.map((w, i) => (
          <button
            key={i}
            className="word-span"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: tapped.has(i) ? 'var(--green)' : 'var(--text-hi)' }}
            onClick={() => setTapped((prev) => new Set(prev).add(i))}
          >
            {w}{' '}
          </button>
        ))}
      </div>
      <button
        className="btn-pill btn-primary"
        onClick={() => onDone(tapped.size / words.length)}
      >
        I finished reading ✓
      </button>
    </div>
  );
}

/* ---------------- Round 4: Comprehension ---------------- */
function Comprehension() {
  const { onSolved, onWrong } = React.useContext(RoundContext);
  const passage = 'Maya found a glowing key in the old tower. She opened the door and saw a hidden garden.';
  const question = 'What did Maya find in the tower?';
  const choices = ['A glowing key', 'A sleeping dragon', 'A pile of books', 'A broken window'];
  const answer = 'A glowing key';
  const [answered, setAnswered] = useState(false);

  function choose(c) {
    if (answered) return;
    setAnswered(true);
    if (c === answer) onSolved(1, 'Great comprehension! You understood the story 🌟');
    else {
      onWrong();
      setTimeout(() => setAnswered(false), 500);
      onSolved(0.5, 'Let\u2019s re-read the story and try again.');
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="passage-card">{passage}</div>
      <p style={{ fontWeight: 700, marginBottom: 16 }}>{question}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 320, margin: '0 auto' }}>
        {choices.map((c) => (
          <button
            key={c}
            className="btn-pill btn-secondary"
            style={{ textAlign: 'left' }}
            onClick={() => choose(c)}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
