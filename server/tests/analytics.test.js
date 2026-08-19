import { afterAll, describe, expect, it } from 'vitest';

import { asUser, newClerkUserId, unauth } from './helpers/client.js';
import { cleanupUser } from './helpers/db.js';
import { pastDeadline, taskPayload } from './helpers/fixtures.js';

describe('analytics: auth and validation', () => {
  it('requires authentication', async () => {
    const res = await unauth().get('/api/analytics/summary');
    expect(res.status).toBe(401);
  });

  it('rejects an invalid range value', async () => {
    const userId = newClerkUserId();
    const res = await asUser(userId).get('/api/analytics/summary?range=6months');
    expect(res.status).toBe(400);
    await cleanupUser(userId);
  });

  it('defaults to range "all" and returns a fully-zeroed payload for a brand new user', async () => {
    const userId = newClerkUserId();
    const res = await asUser(userId).get('/api/analytics/summary');

    expect(res.status).toBe(200);
    expect(res.body.range).toBe('all');
    expect(res.body.kpis).toEqual({
      totalTasks: 0,
      completedTasks: 0,
      missedUnresolvedTasks: 0,
      missedEverTasks: 0,
      deletedTasks: 0,
      completionRate: 0,
      missedRate: 0,
      deletionRate: 0,
      totalTrackedSeconds: 0,
    });
    expect(res.body.unresolvedMissed).toEqual([]);
    expect(res.body.timePerTask).toEqual([]);
    expect(res.body.deadlinePerformance).toEqual({ onTime: 0, late: 0, total: 0 });

    await cleanupUser(userId);
  });

  it.each(['7d', '30d', '90d', 'all'])('accepts range=%s', async (range) => {
    const userId = newClerkUserId();
    const res = await asUser(userId).get(`/api/analytics/summary?range=${range}`);
    expect(res.status).toBe(200);
    expect(res.body.range).toBe(range);
    await cleanupUser(userId);
  });
});

describe('analytics: task-derived metrics', () => {
  const userId = newClerkUserId();
  const user = asUser(userId);

  afterAll(() => cleanupUser(userId));

  it('counts and rates reflect completed, deleted, and incomplete-via-missed tasks', async () => {
    // One completed task.
    const completed = await user.post('/api/tasks').send(taskPayload({ title: 'Completed task' }));
    await user.post(`/api/tasks/${completed.body.id}/complete`);

    // One deleted task.
    const deleted = await user.post('/api/tasks').send(taskPayload({ title: 'Deleted task' }));
    await user.delete(`/api/tasks/${deleted.body.id}`).send({ reason: 'no longer relevant' });

    // One task resolved MISSED -> INCOMPLETE with a reason.
    const missed = await user.post('/api/tasks').send(taskPayload({ title: 'Missed task', deadline: pastDeadline() }));
    await user.get(`/api/tasks/${missed.body.id}`); // lazily triggers ACTIVE -> MISSED
    await user
      .post(`/api/tasks/${missed.body.id}/resolve-missed`)
      .send({ resolution: 'INCOMPLETE', reason: 'ran out of time' });

    // One still-ACTIVE task, should count toward totalTasks only.
    await user.post('/api/tasks').send(taskPayload({ title: 'Active task' }));

    const res = await user.get('/api/analytics/summary');
    expect(res.status).toBe(200);

    const { kpis } = res.body;
    expect(kpis.totalTasks).toBe(4);
    expect(kpis.completedTasks).toBe(1);
    expect(kpis.deletedTasks).toBe(1);
    expect(kpis.missedEverTasks).toBe(1);
    expect(kpis.missedUnresolvedTasks).toBe(0); // resolved, no longer pending
    expect(kpis.completionRate).toBeCloseTo(1 / 2); // COMPLETED / (COMPLETED + INCOMPLETE)
    expect(kpis.missedRate).toBeCloseTo(1 / 4);
    expect(kpis.deletionRate).toBeCloseTo(1 / 4);

    expect(res.body.deletedReasons).toEqual([{ reason: 'no longer relevant', count: 1 }]);
    expect(res.body.incompleteReasons).toEqual([{ reason: 'ran out of time', count: 1 }]);

    const priorityRow = res.body.priorityBreakdown.find((row) => row.priority === 'MEDIUM');
    expect(priorityRow.completed).toBe(1);
    expect(priorityRow.incomplete).toBe(1);
    expect(priorityRow.total).toBe(2);
    expect(priorityRow.incompleteRate).toBeCloseTo(0.5);

    expect(res.body.deadlinePerformance.onTime).toBe(1);
    expect(res.body.deadlinePerformance.total).toBe(1);
  });

  it('an unresolved MISSED task appears in unresolvedMissed and counts toward missedUnresolvedTasks', async () => {
    const task = await user.post('/api/tasks').send(taskPayload({ title: 'Pending review', deadline: pastDeadline() }));
    await user.get(`/api/tasks/${task.body.id}`); // triggers ACTIVE -> MISSED, left unresolved

    const res = await user.get('/api/analytics/summary');
    expect(res.status).toBe(200);
    expect(res.body.kpis.missedUnresolvedTasks).toBe(1);
    expect(res.body.unresolvedMissed.some((entry) => entry.id === task.body.id)).toBe(true);
  });
});

describe('analytics: time-tracking metrics', () => {
  const userId = newClerkUserId();
  const user = asUser(userId);

  afterAll(() => cleanupUser(userId));

  it('total tracked time and per-task time reflect real work sessions', async () => {
    const task = await user.post('/api/tasks').send(taskPayload({ title: 'Tracked task' }));
    const taskId = task.body.id;

    await user.post(`/api/tasks/${taskId}/sessions/start`);
    await new Promise((resolve) => setTimeout(resolve, 50));
    await user.post(`/api/tasks/${taskId}/sessions/stop`);

    const res = await user.get('/api/analytics/summary');
    expect(res.status).toBe(200);
    expect(res.body.kpis.totalTrackedSeconds).toBeGreaterThanOrEqual(0);

    const row = res.body.timePerTask.find((entry) => entry.id === taskId);
    expect(row).toBeDefined();
    expect(row.title).toBe('Tracked task');
    expect(row.status).toBe('ACTIVE');
    expect(row.seconds).toBeGreaterThanOrEqual(0);

    const timeVsOutcomeActive = res.body.timeVsOutcome;
    expect(timeVsOutcomeActive.map((e) => e.status)).toEqual(['COMPLETED', 'INCOMPLETE', 'DELETED']);
  });

  it('completing the task moves its tracked time into the COMPLETED outcome bucket', async () => {
    const task = await user.post('/api/tasks').send(taskPayload({ title: 'Tracked then completed' }));
    const taskId = task.body.id;

    await user.post(`/api/tasks/${taskId}/sessions/start`);
    await new Promise((resolve) => setTimeout(resolve, 50));
    await user.post(`/api/tasks/${taskId}/complete`); // auto-closes the open session

    const res = await user.get('/api/analytics/summary');
    const completedBucket = res.body.timeVsOutcome.find((e) => e.status === 'COMPLETED');
    expect(completedBucket.count).toBeGreaterThanOrEqual(1);
    expect(completedBucket.avgSeconds).toBeGreaterThanOrEqual(0);
  });
});

describe('analytics: cross-user isolation', () => {
  const owner = newClerkUserId();
  const other = newClerkUserId();

  afterAll(async () => {
    await cleanupUser(owner);
    await cleanupUser(other);
  });

  it("one user's tasks and sessions never appear in another user's summary", async () => {
    const created = await asUser(owner).post('/api/tasks').send(taskPayload());
    await asUser(owner).post(`/api/tasks/${created.body.id}/sessions/start`);

    const otherRes = await asUser(other).get('/api/analytics/summary');
    expect(otherRes.body.kpis.totalTasks).toBe(0);
    expect(otherRes.body.kpis.totalTrackedSeconds).toBe(0);
    expect(otherRes.body.timePerTask).toEqual([]);

    const ownerRes = await asUser(owner).get('/api/analytics/summary');
    expect(ownerRes.body.kpis.totalTasks).toBe(1);
  });
});
