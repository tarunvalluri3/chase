import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { asUser, newClerkUserId } from './helpers/client.js';
import { cleanupUser } from './helpers/db.js';
import { pastDeadline, taskPayload } from './helpers/fixtures.js';

describe('work sessions: lifecycle', () => {
  const userId = newClerkUserId();
  const user = asUser(userId);

  afterAll(() => cleanupUser(userId));

  it('Start -> Pause -> Resume -> Stop happy path produces the expected segments and total', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    const taskId = created.body.id;

    const start = await user.post(`/api/tasks/${taskId}/sessions/start`);
    expect(start.status).toBe(201);
    expect(start.body.ended_at).toBeNull();
    expect(start.body.end_reason).toBeNull();

    const pause = await user.post(`/api/tasks/${taskId}/sessions/pause`);
    expect(pause.status).toBe(200);
    expect(pause.body.end_reason).toBe('PAUSED');
    expect(pause.body.ended_at).not.toBeNull();

    const resume = await user.post(`/api/tasks/${taskId}/sessions/resume`);
    expect(resume.status).toBe(201);
    expect(resume.body.ended_at).toBeNull();
    expect(resume.body.id).not.toBe(start.body.id);

    const stop = await user.post(`/api/tasks/${taskId}/sessions/stop`);
    expect(stop.status).toBe(200);
    expect(stop.body.end_reason).toBe('STOPPED');

    const history = await user.get(`/api/tasks/${taskId}/sessions`);
    expect(history.status).toBe(200);
    expect(history.body).toHaveLength(2);
    expect(history.body.map((s) => s.id)).toEqual([start.body.id, resume.body.id]);

    const summary = await user.get(`/api/tasks/${taskId}/sessions/summary`);
    expect(summary.status).toBe(200);
    expect(summary.body.isRunning).toBe(false);
    expect(summary.body.currentSessionStartedAt).toBeNull();
    expect(summary.body.totalSeconds).toBeGreaterThanOrEqual(0);
  });

  it('a task can go through multiple full Start->Stop cycles', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    const taskId = created.body.id;

    await user.post(`/api/tasks/${taskId}/sessions/start`);
    await user.post(`/api/tasks/${taskId}/sessions/stop`);
    await user.post(`/api/tasks/${taskId}/sessions/start`);
    await user.post(`/api/tasks/${taskId}/sessions/stop`);

    const history = await user.get(`/api/tasks/${taskId}/sessions`);
    expect(history.body).toHaveLength(2);
    expect(history.body.every((s) => s.end_reason === 'STOPPED')).toBe(true);
  });
});

describe('work sessions: invalid-state rejections', () => {
  const userId = newClerkUserId();
  const user = asUser(userId);

  afterAll(() => cleanupUser(userId));

  it('rejects Start when a session is already open', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    const taskId = created.body.id;

    await user.post(`/api/tasks/${taskId}/sessions/start`);
    const res = await user.post(`/api/tasks/${taskId}/sessions/start`);
    expect(res.status).toBe(409);
  });

  it('rejects Pause with no open session', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    const res = await user.post(`/api/tasks/${created.body.id}/sessions/pause`);
    expect(res.status).toBe(409);
  });

  it('rejects Stop with no open session', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    const res = await user.post(`/api/tasks/${created.body.id}/sessions/stop`);
    expect(res.status).toBe(409);
  });

  it('rejects Resume when no segment exists yet', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    const res = await user.post(`/api/tasks/${created.body.id}/sessions/resume`);
    expect(res.status).toBe(409);
  });

  it('rejects Resume when the most recent segment was STOPPED, not PAUSED', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    const taskId = created.body.id;

    await user.post(`/api/tasks/${taskId}/sessions/start`);
    await user.post(`/api/tasks/${taskId}/sessions/stop`);

    const res = await user.post(`/api/tasks/${taskId}/sessions/resume`);
    expect(res.status).toBe(409);
  });

  it('rejects Start on a non-ACTIVE task (COMPLETED)', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    await user.post(`/api/tasks/${created.body.id}/complete`);

    const res = await user.post(`/api/tasks/${created.body.id}/sessions/start`);
    expect(res.status).toBe(409);
  });

  it('rejects Start on a non-ACTIVE task (DELETED)', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    await user.delete(`/api/tasks/${created.body.id}`).send({ reason: 'not needed' });

    const res = await user.post(`/api/tasks/${created.body.id}/sessions/start`);
    expect(res.status).toBe(409);
  });

  it('rejects Start on a MISSED task', async () => {
    const created = await user.post('/api/tasks').send(taskPayload({ deadline: pastDeadline() }));
    await user.get(`/api/tasks/${created.body.id}`); // triggers ACTIVE -> MISSED

    const res = await user.post(`/api/tasks/${created.body.id}/sessions/start`);
    expect(res.status).toBe(409);
  });
});

describe('work sessions: ownership', () => {
  const owner = newClerkUserId();
  const intruder = newClerkUserId();
  let taskId;

  beforeAll(async () => {
    const res = await asUser(owner).post('/api/tasks').send(taskPayload());
    taskId = res.body.id;
  });

  afterAll(async () => {
    await cleanupUser(owner);
    await cleanupUser(intruder);
  });

  it('a foreign user cannot start a session on the task', async () => {
    const res = await asUser(intruder).post(`/api/tasks/${taskId}/sessions/start`);
    expect(res.status).toBe(404);
  });

  it('a foreign user cannot pause/resume/stop the task', async () => {
    const pause = await asUser(intruder).post(`/api/tasks/${taskId}/sessions/pause`);
    const resume = await asUser(intruder).post(`/api/tasks/${taskId}/sessions/resume`);
    const stop = await asUser(intruder).post(`/api/tasks/${taskId}/sessions/stop`);
    expect(pause.status).toBe(404);
    expect(resume.status).toBe(404);
    expect(stop.status).toBe(404);
  });

  it('a foreign user cannot read the task\'s sessions or summary', async () => {
    const list = await asUser(intruder).get(`/api/tasks/${taskId}/sessions`);
    const summary = await asUser(intruder).get(`/api/tasks/${taskId}/sessions/summary`);
    expect(list.status).toBe(404);
    expect(summary.status).toBe(404);
  });

  it('a session action on a nonexistent task id 404s identically', async () => {
    const nonexistentId = '11111111-1111-4111-8111-111111111111';
    const res = await asUser(owner).post(`/api/tasks/${nonexistentId}/sessions/start`);
    expect(res.status).toBe(404);
  });

  it('the owner can still start a session after every rejected cross-user attempt', async () => {
    const res = await asUser(owner).post(`/api/tasks/${taskId}/sessions/start`);
    expect(res.status).toBe(201);
  });
});

describe('work sessions: auto-close on task leaving ACTIVE', () => {
  const userId = newClerkUserId();
  const user = asUser(userId);

  afterAll(() => cleanupUser(userId));

  it('an open session is auto-closed with AUTO_STOPPED when the task is Completed', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    const taskId = created.body.id;

    await user.post(`/api/tasks/${taskId}/sessions/start`);
    await user.post(`/api/tasks/${taskId}/complete`);

    const history = await user.get(`/api/tasks/${taskId}/sessions`);
    expect(history.body).toHaveLength(1);
    expect(history.body[0].end_reason).toBe('AUTO_STOPPED');
    expect(history.body[0].ended_at).not.toBeNull();

    const stopAgain = await user.post(`/api/tasks/${taskId}/sessions/stop`);
    expect(stopAgain.status).toBe(409);
  });

  it('an open session is auto-closed with AUTO_STOPPED when the task is Deleted', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    const taskId = created.body.id;

    await user.post(`/api/tasks/${taskId}/sessions/start`);
    await user.delete(`/api/tasks/${taskId}`).send({ reason: 'no longer needed' });

    const history = await user.get(`/api/tasks/${taskId}/sessions`);
    expect(history.body).toHaveLength(1);
    expect(history.body[0].end_reason).toBe('AUTO_STOPPED');
  });

  it('an open session is auto-closed with AUTO_STOPPED when the task auto-transitions to MISSED', async () => {
    // Deadline is briefly in the future so Start (which itself lazily
    // checks the deadline) still sees the task as ACTIVE; by the time the
    // deadline check below runs, it has passed.
    const created = await user
      .post('/api/tasks')
      .send(taskPayload({ deadline: new Date(Date.now() + 5000).toISOString() }));
    const taskId = created.body.id;

    const start = await user.post(`/api/tasks/${taskId}/sessions/start`);
    expect(start.status).toBe(201);

    await new Promise((resolve) => setTimeout(resolve, 6000));

    const getRes = await user.get(`/api/tasks/${taskId}`); // triggers ACTIVE -> MISSED
    expect(getRes.body.status).toBe('MISSED');

    const history = await user.get(`/api/tasks/${taskId}/sessions`);
    expect(history.body).toHaveLength(1);
    expect(history.body[0].end_reason).toBe('AUTO_STOPPED');
    expect(history.body[0].ended_at).not.toBeNull();

    const resumeRes = await user.post(`/api/tasks/${taskId}/sessions/resume`);
    expect(resumeRes.status).toBe(409);
  });
});

describe('work sessions: summary math', () => {
  const userId = newClerkUserId();
  const user = asUser(userId);

  afterAll(() => cleanupUser(userId));

  it('a task with zero sessions returns a zeroed summary, not an error', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    const res = await user.get(`/api/tasks/${created.body.id}/sessions/summary`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ totalSeconds: 0, isRunning: false, currentSessionStartedAt: null });
  });

  it('multiple closed segments plus one open segment sum correctly', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    const taskId = created.body.id;

    await user.post(`/api/tasks/${taskId}/sessions/start`);
    await new Promise((resolve) => setTimeout(resolve, 50));
    await user.post(`/api/tasks/${taskId}/sessions/pause`);

    await user.post(`/api/tasks/${taskId}/sessions/resume`);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const summary = await user.get(`/api/tasks/${taskId}/sessions/summary`);
    expect(summary.status).toBe(200);
    expect(summary.body.isRunning).toBe(true);
    expect(summary.body.currentSessionStartedAt).not.toBeNull();
    expect(summary.body.totalSeconds).toBeGreaterThan(0);
  });
});
