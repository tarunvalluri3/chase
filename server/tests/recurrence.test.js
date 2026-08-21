import { afterAll, describe, expect, it } from 'vitest';

import { asUser, newClerkUserId } from './helpers/client.js';
import { cleanupUser } from './helpers/db.js';
import { pastDeadline, taskPayload } from './helpers/fixtures.js';

async function listTaskTitles(user, title) {
  const res = await user.get('/api/tasks');
  return res.body.filter((task) => task.title === title);
}

describe('recurring tasks', () => {
  const userId = newClerkUserId();
  const user = asUser(userId);

  afterAll(() => cleanupUser(userId));

  it('completing a DAILY task spawns exactly one new ACTIVE occurrence, deadline advanced by 1 day from the original', async () => {
    const deadline = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const created = await user
      .post('/api/tasks')
      .send(taskPayload({ title: 'Daily standup', deadline, repeat_rule: 'DAILY' }));
    expect(created.body.repeat_group_id).not.toBeNull();

    await user.post(`/api/tasks/${created.body.id}/complete`);

    const matches = await listTaskTitles(user, 'Daily standup');
    const spawned = matches.find((task) => task.id !== created.body.id);

    expect(matches).toHaveLength(2);
    expect(spawned.status).toBe('ACTIVE');
    expect(spawned.repeat_rule).toBe('DAILY');
    expect(spawned.repeat_group_id).toBe(created.body.repeat_group_id);
    expect(new Date(spawned.deadline).getTime() - new Date(deadline).getTime()).toBe(
      24 * 60 * 60 * 1000,
    );
  });

  it('completing a WEEKLY task advances the deadline by 7 days', async () => {
    const deadline = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const created = await user
      .post('/api/tasks')
      .send(taskPayload({ title: 'Weekly review', deadline, repeat_rule: 'WEEKLY' }));

    await user.post(`/api/tasks/${created.body.id}/complete`);

    const matches = await listTaskTitles(user, 'Weekly review');
    const spawned = matches.find((task) => task.id !== created.body.id);

    expect(new Date(spawned.deadline).getTime() - new Date(deadline).getTime()).toBe(
      7 * 24 * 60 * 60 * 1000,
    );
  });

  it('completing a MONTHLY task advances the deadline by one calendar month', async () => {
    const deadline = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const created = await user
      .post('/api/tasks')
      .send(taskPayload({ title: 'Monthly report', deadline, repeat_rule: 'MONTHLY' }));

    await user.post(`/api/tasks/${created.body.id}/complete`);

    const matches = await listTaskTitles(user, 'Monthly report');
    const spawned = matches.find((task) => task.id !== created.body.id);

    const expected = new Date(deadline);
    expected.setUTCMonth(expected.getUTCMonth() + 1);
    expect(new Date(spawned.deadline).toISOString()).toBe(expected.toISOString());
  });

  it('completing a task with repeat_rule NONE (default) spawns nothing', async () => {
    const created = await user.post('/api/tasks').send(taskPayload({ title: 'One-off task' }));

    await user.post(`/api/tasks/${created.body.id}/complete`);

    const matches = await listTaskTitles(user, 'One-off task');
    expect(matches).toHaveLength(1);
  });

  it('resolve-missed with resolution=COMPLETED on a repeating MISSED task also spawns the next occurrence', async () => {
    const created = await user
      .post('/api/tasks')
      .send(
        taskPayload({ title: 'Missed but recurring', deadline: pastDeadline(), repeat_rule: 'DAILY' }),
      );
    await user.get(`/api/tasks/${created.body.id}`); // triggers ACTIVE -> MISSED

    await user
      .post(`/api/tasks/${created.body.id}/resolve-missed`)
      .send({ resolution: 'COMPLETED' });

    const matches = await listTaskTitles(user, 'Missed but recurring');
    expect(matches).toHaveLength(2);
    expect(matches.some((task) => task.status === 'ACTIVE')).toBe(true);
  });

  it('resolve-missed with resolution=INCOMPLETE does not spawn a next occurrence', async () => {
    const created = await user.post('/api/tasks').send(
      taskPayload({ title: 'Missed and abandoned', deadline: pastDeadline(), repeat_rule: 'DAILY' }),
    );
    await user.get(`/api/tasks/${created.body.id}`);

    await user
      .post(`/api/tasks/${created.body.id}/resolve-missed`)
      .send({ resolution: 'INCOMPLETE', reason: 'never got to it' });

    const matches = await listTaskTitles(user, 'Missed and abandoned');
    expect(matches).toHaveLength(1);
  });

  it('deleting a repeating task does not spawn a next occurrence', async () => {
    const created = await user
      .post('/api/tasks')
      .send(taskPayload({ title: 'Deleted recurring task', repeat_rule: 'DAILY' }));

    await user.delete(`/api/tasks/${created.body.id}`).send({ reason: 'no longer needed' });

    const matches = await listTaskTitles(user, 'Deleted recurring task');
    expect(matches).toHaveLength(1);
  });

  it('the spawned occurrence belongs to the same user', async () => {
    const created = await user
      .post('/api/tasks')
      .send(taskPayload({ title: 'Owned recurring task', repeat_rule: 'DAILY' }));

    const completeRes = await user.post(`/api/tasks/${created.body.id}/complete`);
    expect(completeRes.status).toBe(200);

    const matches = await listTaskTitles(user, 'Owned recurring task');
    expect(matches).toHaveLength(2);
  });

  it('chain continuation: completing a spawned occurrence spawns a third occurrence sharing the same repeat_group_id', async () => {
    const created = await user
      .post('/api/tasks')
      .send(taskPayload({ title: 'Chained recurring task', repeat_rule: 'DAILY' }));

    await user.post(`/api/tasks/${created.body.id}/complete`);
    const afterFirst = await listTaskTitles(user, 'Chained recurring task');
    const second = afterFirst.find((task) => task.id !== created.body.id);

    await user.post(`/api/tasks/${second.id}/complete`);
    const afterSecond = await listTaskTitles(user, 'Chained recurring task');

    expect(afterSecond).toHaveLength(3);
    expect(afterSecond.every((task) => task.repeat_group_id === created.body.repeat_group_id)).toBe(
      true,
    );
  });

  it('rejects an invalid repeat_rule value on create', async () => {
    const res = await user.post('/api/tasks').send(taskPayload({ repeat_rule: 'YEARLY' }));
    expect(res.status).toBe(400);
  });

  it('repeat_rule is editable via PATCH on an ACTIVE task', async () => {
    const created = await user.post('/api/tasks').send(taskPayload());
    const res = await user.patch(`/api/tasks/${created.body.id}`).send({ repeat_rule: 'WEEKLY' });

    expect(res.status).toBe(200);
    expect(res.body.repeat_rule).toBe('WEEKLY');
  });
});
