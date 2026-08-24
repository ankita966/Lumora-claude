import { useCallback, useEffect, useRef, useState } from 'react';

function getRecognitionCtor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported() {
  return !!getRecognitionCtor();
}

/**
 * Wraps the Web Speech API's SpeechRecognition with clear state so the UI
 * can show "listening", handle denied mic permission, and gracefully fall
 * back when the browser doesn't support speech recognition at all (e.g.
 * Firefox) instead of pretending speech was detected.
 */
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
        setError('No speech detected — try again a little closer to the mic.');
      } else {
        setError(event.error);
      }
    };
    rec.onend = () => setListening(false);

    recRef.current = rec;
    return () => {
      try { rec.stop(); } catch { /* already stopped */ }
    };
  }, [supported, lang]);

  const start = useCallback(async () => {
    if (!supported || !recRef.current) return;
    setTranscript('');
    setInterim('');
    setError(null);
    try {
      // Explicitly request mic permission first so the UI can react to a
      // denial distinctly from "recognition failed to start".
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
    try { recRef.current?.stop(); } catch { /* noop */ }
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

// Simple, dependency-free fuzzy match: fraction of expected words that
// appear (in any order, case/punctuation-insensitive) in the heard text.
export function wordOverlapScore(expected, heard) {
  const clean = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const expWords = clean(expected);
  const heardWords = new Set(clean(heard));
  if (expWords.length === 0) return 0;
  const matched = expWords.filter((w) => heardWords.has(w)).length;
  return matched / expWords.length;
}
