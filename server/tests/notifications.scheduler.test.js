import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/services/emailService.js', () => ({
  sendEmail: vi.fn(),
}));

import { sendEmail } from '../src/services/emailService.js';
import { supabase } from '../src/db/supabaseClient.js';
import { runNotificationSweep } from '../src/jobs/notificationScheduler.js';
import { asUser, newClerkUserId } from './helpers/client.js';
import { cleanupUser } from './helpers/db.js';
import { pastDeadline, taskPayload } from './helpers/fixtures.js';

async function countLogs(taskId, type) {
  const { data } = await supabase
    .from('notification_log')
    .select('id')
    .eq('task_id', taskId)
    .eq('type', type);
  return data?.length ?? 0;
}

// NOTE on test isolation: unlike every other test file, runNotificationSweep
// is deliberately cross-user (no user_id filter -- see PHASE_17.md section
// 4). Against this suite's shared live Supabase project (no separate test
// project is provisioned, see the Phase 7 decisions-log entry in STATE.md),
// that means a sweep triggered here could in principle also transition an
// overdue task belonging to another test file's user if it happens to run
// concurrently. In practice this hasn't been observed to cause flakiness,
// since every assertion below is scoped to this file's own user and Vitest
// runs each test file's own tests sequentially, but it's a real, disclosed
// gap rather than a solved one -- a dedicated test Supabase project would
// remove it entirely.
describe('notificationScheduler.runNotificationSweep', () => {
  const userId = newClerkUserId();
  const user = asUser(userId);

  beforeEach(() => {
    sendEmail.mockReset();
    sendEmail.mockResolvedValue({ id: 'ok' });
  });

  afterAll(() => cleanupUser(userId));

  it('flips an overdue ACTIVE task to MISSED and sends exactly one TASK_MISSED email, even across repeated sweeps', async () => {
    const created = await user.post('/api/tasks').send(taskPayload({ deadline: pastDeadline() }));
    sendEmail.mockClear();

    await runNotificationSweep();
    await runNotificationSweep();

    const check = await user.get(`/api/tasks/${created.body.id}`);
    expect(check.body.status).toBe('MISSED');

    // Scoped to this task's own notification_log rows, not a raw count of
    // sendEmail calls -- the sweep is genuinely cross-user (see the note
    // above), so other concurrently-running test files' overdue tasks can
    // also trigger a call to this file's mocked sendEmail. The dedup
    // guarantee that actually matters -- exactly one TASK_MISSED per task,
    // even across repeated sweeps -- is what this checks.
    expect(await countLogs(created.body.id, 'TASK_MISSED')).toBe(1);
  });

  it('does not touch an ACTIVE task whose deadline has not passed', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    sendEmail.mockClear();

    await runNotificationSweep();

    const check = await user.get(`/api/tasks/${created.body.id}`);
    expect(check.body.status).toBe('ACTIVE');
    expect(await countLogs(created.body.id, 'TASK_MISSED')).toBe(0);
  });

  it('sends one DEADLINE_REMINDER for a reminder-enabled task due within the configured window, deduped across repeated sweeps', async () => {
    const soon = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h from now
    const created = await user
      .post('/api/tasks')
      .send(taskPayload({ deadline: soon, reminder_enabled: true }));
    sendEmail.mockClear();

    await runNotificationSweep();
    await runNotificationSweep();

    expect(await countLogs(created.body.id, 'DEADLINE_REMINDER')).toBe(1);
  });

  it('does not send a reminder for a task due far beyond the reminder window', async () => {
    const farOut = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    const created = await user
      .post('/api/tasks')
      .send(taskPayload({ deadline: farOut, reminder_enabled: true }));
    sendEmail.mockClear();

    await runNotificationSweep();

    expect(await countLogs(created.body.id, 'DEADLINE_REMINDER')).toBe(0);
  });

  it('does not send a reminder for a task due within the window that has not opted in', async () => {
    const soon = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h from now
    const created = await user
      .post('/api/tasks')
      .send(taskPayload({ deadline: soon, reminder_enabled: false }));
    sendEmail.mockClear();

    await runNotificationSweep();

    expect(await countLogs(created.body.id, 'DEADLINE_REMINDER')).toBe(0);
  });

  it('reminder_enabled defaults to false and round-trips correctly, and can be toggled via PATCH', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    expect(created.body.reminder_enabled).toBe(false);

    const patched = await user
      .patch(`/api/tasks/${created.body.id}`)
      .send({ reminder_enabled: true });
    expect(patched.status).toBe(200);
    expect(patched.body.reminder_enabled).toBe(true);
  });
});
