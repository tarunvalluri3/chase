export function taskPayload(overrides = {}) {
  return {
    title: 'Test task',
    description: 'A task created for automated testing',
    deadline: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    priority: 'MEDIUM',
    ...overrides,
  };
}

export function pastDeadline(msAgo = 60_000) {
  return new Date(Date.now() - msAgo).toISOString();
}
