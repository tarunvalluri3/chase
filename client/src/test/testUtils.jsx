import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { TasksProvider } from '../lib/tasksStore';
import { ToastProvider } from '../lib/toastStore';

// Shared render helper — wraps a component in the same provider stack
// App.jsx uses in production (router + TasksProvider + ToastProvider),
// scoped down to what components under test actually reach for via
// context, without pulling in ClerkProvider (mocked per-file instead,
// since @clerk/clerk-react needs a real publishable key to initialize).
export function renderWithProviders(ui, { route = '/', ...options } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ToastProvider>
        <TasksProvider>{ui}</TasksProvider>
      </ToastProvider>
    </MemoryRouter>,
    options,
  );
}

let idCounter = 0;

// Minimal valid task object matching CLAUDE.md's data model — tests override
// only the fields relevant to what they're checking.
export function buildTask(overrides = {}) {
  idCounter += 1;
  return {
    id: `task-${idCounter}`,
    title: `Task ${idCounter}`,
    description: null,
    deadline: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    priority: 'MEDIUM',
    status: 'ACTIVE',
    missed_reason: null,
    incomplete_reason: null,
    deletion_reason: null,
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null,
    missed_at: null,
    incomplete_at: null,
    deleted_at: null,
    ...overrides,
  };
}
