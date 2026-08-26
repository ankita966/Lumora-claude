import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { useAuth } from '../auth/AuthProvider';
import { startGameSession, syncRoundAttempt } from '../services/progress';

/**
 * Drives the "5 smooth rounds" loop used by every world: tracks the current
 * round, attempts, timing, awards XP, logs the activity for the adaptive
 * engine, and transitions cleanly to the next round (or the world-complete
 * overlay after the last one) — never leaving a blank screen.
 */
export function useWorldFlow({ worldKey, skill, totalRounds = 5, xpPerRound = 150, worldBonus = 200 }) {
  const { configured, user, roles } = useAuth();
  const [roundIndex, setRoundIndex] = useState(0);
  const [attempts, setAttempts] = useState(1);
  const [startTime, setStartTime] = useState(() => Date.now());
  const [message, setMessage] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const transitionLockRef = useRef(false);
  const transitionTimerRef = useRef(null);
  const sessionIdRef = useRef(null);

  const logActivity = useGameStore((s) => s.logActivity);
  const addXp = useGameStore((s) => s.addXp);
  const completeWorld = useGameStore((s) => s.completeWorld);

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearTransitionTimer, [clearTransitionTimer]);

  useEffect(() => {
    sessionIdRef.current = null;
    if (!configured || !user || !roles.includes('student')) return undefined;
    let active = true;
    // Session creation is asynchronous and deliberately does not gate a round.
    startGameSession(user.id, worldKey).then((id) => { if (active) sessionIdRef.current = id; }).catch(() => {});
    return () => { active = false; };
  }, [configured, user, roles, worldKey]);

  const registerAttempt = useCallback(() => setAttempts((a) => a + 1), []);

  const completeRound = useCallback(
    (accuracy = 1, customMsg) => {
      // State updates are asynchronous. This ref prevents duplicate completion
      // callbacks in the same render/frame from scheduling multiple advances.
      if (transitionLockRef.current || completed) return;
      transitionLockRef.current = true;
      setTransitioning(true);
      const timeMs = Math.max(400, Date.now() - startTime);
      logActivity({ world: worldKey, round: roundIndex + 1, skill, accuracy, attempts, timeMs });
      addXp(xpPerRound);
      setMessage(customMsg || 'Great job! ✨');
      const isLast = roundIndex + 1 >= totalRounds;
      if (isLast) {
        completeWorld(worldKey);
        addXp(worldBonus);
        transitionTimerRef.current = setTimeout(() => {
          transitionTimerRef.current = null;
          setCompleted(true);
        }, 1000);
      } else {
        transitionTimerRef.current = setTimeout(() => {
          transitionTimerRef.current = null;
          setRoundIndex((r) => r + 1);
          setAttempts(1);
          setStartTime(Date.now());
          setMessage(null);
          setTransitioning(false);
          transitionLockRef.current = false;
        }, 1300);
      }
      if (configured && user && roles.includes('student')) {
        const snapshot = useGameStore.getState();
        void syncRoundAttempt(user.id, {
          session_id: sessionIdRef.current,
          world_key: worldKey,
          round_number: roundIndex + 1,
          skill,
          accuracy,
          attempts,
          time_ms: timeMs,
          xp_earned: xpPerRound + (isLast ? worldBonus : 0),
          completion_status: 'completed',
          world_completed: isLast,
        }, {
          xp: snapshot.xp,
          sessionsCompleted: snapshot.sessionsCompleted,
          totalTimeMs: snapshot.totalTimeMs,
        }).catch(() => {});
      }
    },
    [configured, user, roles, completed, startTime, worldKey, skill, roundIndex, attempts, totalRounds, xpPerRound, worldBonus, logActivity, addXp, completeWorld]
  );

  const restart = useCallback(() => {
    clearTransitionTimer();
    transitionLockRef.current = false;
    setRoundIndex(0);
    setAttempts(1);
    setStartTime(Date.now());
    setMessage(null);
    setCompleted(false);
    setTransitioning(false);
  }, [clearTransitionTimer]);

  return {
    roundIndex,
    roundNumber: roundIndex + 1,
    totalRounds,
    attempts,
    message,
    setMessage,
    completed,
    transitioning,
    registerAttempt,
    completeRound,
    restart,
  };
}
