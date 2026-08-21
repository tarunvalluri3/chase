import { createContext, useCallback, useContext, useState } from 'react';

// Minimal shared state for task data — no state library needed at this
// scale (CLAUDE.md prefers the smallest dependency set that works).
// `version` is a bump-to-refetch signal: any successful create/edit calls
// `refreshTasks()`, and every list/count hook re-fetches when it changes.
// `createSheetOpen` is lifted here (not local BottomNav state) so any
// screen — e.g. an Active-tab empty state's "New task" button — can open
// the same Create sheet that lives in the bottom nav.
const TasksContext = createContext(null);

const VIEW_MODE_STORAGE_KEY = 'chase.tasks.viewMode';

function readStoredViewMode() {
  try {
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return stored === 'grid' ? 'grid' : 'list';
  } catch {
    return 'list';
  }
}

export function TasksProvider({ children }) {
  const [version, setVersion] = useState(0);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [sortBy, setSortBy] = useState('deadline');
  const [viewMode, setViewModeState] = useState(readStoredViewMode);

  const refreshTasks = useCallback(() => setVersion((v) => v + 1), []);
  const openCreateSheet = useCallback(() => setCreateSheetOpen(true), []);
  const closeCreateSheet = useCallback(() => setCreateSheetOpen(false), []);
  const setViewMode = useCallback((mode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch {
      // Best-effort persistence only — a private/blocked storage context
      // just means the choice doesn't survive a reload.
    }
  }, []);

  const value = {
    version,
    refreshTasks,
    createSheetOpen,
    openCreateSheet,
    closeCreateSheet,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
  };

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasksContext() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error('useTasksContext must be used within a TasksProvider');
  return ctx;
}
