import { useCallback, useEffect, useMemo, useState } from 'react';
import { sessionsApi } from '../lib/apiClient';
import { useToast } from '../lib/toastStore';
import { sessionErrorMessage } from '../lib/taskLifecycle';

// Derives total/running/paused state from the full segment history
// (server/API.md's GET /sessions), the same math as the backend's own
// GET /sessions/summary — done client-side so one fetch also tells us
// whether the most recent segment ended PAUSED (needed to show Resume vs.
// Start), which the summary endpoint alone doesn't expose.
function deriveState(sessions) {
  const now = Date.now();
  let totalMs = 0;
  let isRunning = false;
  let currentSessionStartedAt = null;

  for (const session of sessions) {
    const startedAtMs = new Date(session.started_at).getTime();
    if (session.ended_at) {
      totalMs += new Date(session.ended_at).getTime() - startedAtMs;
    } else {
      totalMs += now - startedAtMs;
      isRunning = true;
      currentSessionStartedAt = session.started_at;
    }
  }

  const mostRecent = sessions[sessions.length - 1];
  const isPaused = !isRunning && mostRecent?.end_reason === 'PAUSED';

  return {
    totalSeconds: Math.floor(totalMs / 1000),
    isRunning,
    isPaused,
    currentSessionStartedAt,
  };
}

// Backs the Start/Pause/Resume/Stop controls on TaskCard/TaskDetail.
// `enabled` gates the initial fetch — session data is only relevant while
// a task is (or has been) ACTIVE, so callers can skip the request entirely
// for e.g. a COMPLETED task with no history worth showing.
export function useWorkSession(taskId, { enabled = true } = {}) {
  const [sessions, setSessions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tick, setTick] = useState(0);
  const { showToast } = useToast();

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const data = await sessionsApi.list(taskId);
      setSessions(data);
    } catch {
      // Session data is supplementary, not core task info -- fail quietly
      // rather than blocking the rest of the card/detail view, matching
      // useTaskCounts' existing silent-failure posture for decorative data.
    } finally {
      setLoading(false);
    }
  }, [taskId, enabled]);

  useEffect(() => {
    setSessions(null);
    if (enabled) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, enabled]);

  const state = useMemo(() => deriveState(sessions ?? []), [sessions, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!state.isRunning) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [state.isRunning]);

  const runAction = useCallback(
    async (apiCall) => {
      setSubmitting(true);
      try {
        await apiCall();
        await refresh();
      } catch (err) {
        showToast(sessionErrorMessage(err));
      } finally {
        setSubmitting(false);
      }
    },
    [refresh, showToast],
  );

  return {
    loaded: sessions !== null,
    loading,
    submitting,
    totalSeconds: state.totalSeconds,
    isRunning: state.isRunning,
    isPaused: state.isPaused,
    hasHistory: (sessions ?? []).length > 0,
    start: useCallback(() => runAction(() => sessionsApi.start(taskId)), [runAction, taskId]),
    pause: useCallback(() => runAction(() => sessionsApi.pause(taskId)), [runAction, taskId]),
    resume: useCallback(() => runAction(() => sessionsApi.resume(taskId)), [runAction, taskId]),
    stop: useCallback(() => runAction(() => sessionsApi.stop(taskId)), [runAction, taskId]),
  };
}
