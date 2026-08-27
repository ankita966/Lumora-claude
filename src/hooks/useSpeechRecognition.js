import { useCallback, useEffect, useRef, useState } from 'react';

function getRecognitionCtor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported() {
  return !!getRecognitionCtor();
}

/**
 * Levenshtein distance on character strings for syllable/phoneme closeness.
 */
function levenshteinDistance(s1, s2) {
  const m = s1.length;
  const n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

function stringSimilarity(s1, s2) {
  const clean1 = s1.trim().toLowerCase();
  const clean2 = s2.trim().toLowerCase();
  if (clean1 === clean2) return 1.0;
  if (!clean1.length || !clean2.length) return 0.0;
  const dist = levenshteinDistance(clean1, clean2);
  const maxLen = Math.max(clean1.length, clean2.length);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Phonetic Levenshtein alignment score.
 * Compares expected vs heard phrase with word order sensitivity
 * and character-level phonetic similarity.
 */
export function phoneticMatchScore(expected, heard) {
  const clean = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(Boolean);

  const expWords = clean(expected);
  const heardWords = clean(heard);

  if (expWords.length === 0) return 0;
  if (heardWords.length === 0) return 0;

  // Calculate sequential alignment
  let totalScore = 0;
  let heardIdx = 0;

  for (let i = 0; i < expWords.length; i++) {
    const target = expWords[i];
    let bestSim = 0;
    let bestMatchIdx = -1;

    // Search ahead up to 3 words to allow for slight skips or filler words
    const windowEnd = Math.min(heardWords.length, heardIdx + 3);
    for (let j = heardIdx; j < windowEnd; j++) {
      const sim = stringSimilarity(target, heardWords[j]);
      if (sim > bestSim) {
        bestSim = sim;
        bestMatchIdx = j;
      }
    }

    if (bestSim >= 0.65) {
      totalScore += bestSim;
      heardIdx = bestMatchIdx + 1;
    }
  }

  return Math.min(1, Math.max(0, totalScore / expWords.length));
}

// Backward compatible alias with improved alignment
export function wordOverlapScore(expected, heard) {
  return phoneticMatchScore(expected, heard);
}

export function useSpeechRecognition({ lang = 'en-US' } = {}) {
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [permission, setPermission] = useState('unknown'); // unknown|granted|denied
  const [supported] = useState(isSpeechRecognitionSupported());
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supported) return;
    const Ctor = getRecognitionCtor();
    const rec = new Ctor();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = lang;

    rec.onstart = () => {
      setListening(true);
      setPermission('granted');
      setError(null);
    };
    rec.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += chunk;
        else interimText += chunk;
      }
      if (finalText) setTranscript((prev) => (prev ? prev + ' ' + finalText : finalText).trim());
      setInterim(interimText);
    };
    rec.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setPermission('denied');
        setError('Microphone permission was denied.');
      } else if (event.error === 'no-speech') {
        setError('No speech detected — try again closer to the mic.');
      } else {
        setError(event.error);
      }
    };
    rec.onend = () => setListening(false);

    recRef.current = rec;
    return () => {
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
    };
  }, [supported, lang]);

  const start = useCallback(async () => {
    if (!supported || !recRef.current) return;
    setTranscript('');
    setInterim('');
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setPermission('granted');
      recRef.current.start();
    } catch {
      setPermission('denied');
      setError('Microphone permission was denied.');
    }
  }, [supported]);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* noop */
    }
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setInterim('');
  }, []);

  return { supported, listening, transcript, interim, permission, error, start, stop, reset };
}

export function speak(text, { lang = 'en-US', rate = 0.95 } = {}) {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = rate;
    utter.pitch = 1.05;
    window.speechSynthesis.speak(utter);
  } catch {
    /* speech synthesis unavailable — silently no-op */
  }
}
