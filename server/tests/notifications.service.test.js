import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/repositories/notificationsRepository.js', () => ({
  claim: vi.fn(),
  markSent: vi.fn(),
  markFailed: vi.fn(),
  findRetryable: vi.fn(),
}));

vi.mock('../src/repositories/usersRepository.js', () => ({
  findById: vi.fn(),
}));

vi.mock('../src/repositories/tasksRepository.js', () => ({
  findByIdInternal: vi.fn(),
}));

vi.mock('../src/repositories/pushSubscriptionsRepository.js', () => ({
  listByUser: vi.fn(),
}));

vi.mock('../src/repositories/notificationsFeedRepository.js', () => ({
  create: vi.fn(),
}));

vi.mock('../src/services/emailService.js', () => ({
  sendEmail: vi.fn(),
}));

vi.mock('../src/services/pushService.js', () => ({
  sendPush: vi.fn(),
}));

import * as notificationsRepository from '../src/repositories/notificationsRepository.js';
import * as usersRepository from '../src/repositories/usersRepository.js';
import * as tasksRepository from '../src/repositories/tasksRepository.js';
import * as pushSubscriptionsRepository from '../src/repositories/pushSubscriptionsRepository.js';
import * as notificationsFeedRepository from '../src/repositories/notificationsFeedRepository.js';
import { sendEmail } from '../src/services/emailService.js';
import { sendPush } from '../src/services/pushService.js';
import * as notificationService from '../src/services/notificationService.js';

const task = {
  id: 'task-1',
  user_id: 'user-1',
  title: 'Ship it',
  status: 'ACTIVE',
  deadline: '2026-08-20T10:00:00.000Z',
  priority: 'HIGH',
  updated_at: '2026-08-18T10:00:00.000Z',
};

const user = { id: 'user-1', email: 'person@example.test' };
const subscription = { id: 'sub-1', endpoint: 'https://push.example/1', p256dh: 'k', auth: 's' };

beforeEach(() => {
  vi.clearAllMocks();
  pushSubscriptionsRepository.listByUser.mockResolvedValue([]);
  notificationsFeedRepository.create.mockResolvedValue(undefined);
});

describe('notificationService: happy path (email)', () => {
  it('claims, sends, and marks a notification SENT on the EMAIL channel', async () => {
    usersRepository.findById.mockResolvedValue(user);
    notificationsRepository.claim.mockResolvedValue({ id: 'log-1', attempts: 0 });
    sendEmail.mockResolvedValue({ id: 'email-1' });

    await notificationService.notifyTaskCreated(user.id, task);

    expect(notificationsRepository.claim).toHaveBeenCalledWith({
      userId: user.id,
      taskId: task.id,
      type: 'TASK_CREATED',
      dedupKey: 'once',
      channel: 'EMAIL',
    });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0][0].to).toBe(user.email);
    expect(notificationsRepository.markSent).toHaveBeenCalledWith('log-1');
  });
});

describe('notificationService: dedup', () => {
  it('never calls sendEmail when the claim insert is already taken', async () => {
    usersRepository.findById.mockResolvedValue(user);
    notificationsRepository.claim.mockResolvedValue(null); // already claimed

    await notificationService.notifyTaskCreated(user.id, task);

    expect(sendEmail).not.toHaveBeenCalled();
    expect(notificationsRepository.markSent).not.toHaveBeenCalled();
  });
});

describe('notificationService: failure isolation', () => {
  it('never throws when the user has no email on file', async () => {
    usersRepository.findById.mockResolvedValue({ ...user, email: null });
    notificationsRepository.claim.mockResolvedValue({ id: 'log-1', attempts: 0 });

    await expect(notificationService.notifyTaskCreated(user.id, task)).resolves.toBeUndefined();
    expect(sendEmail).not.toHaveBeenCalled();
    expect(notificationsRepository.markFailed).toHaveBeenCalledWith(
      'log-1',
      expect.any(String),
      expect.any(Number),
    );
  });

  it('never throws when sendEmail rejects, and records the failure', async () => {
    usersRepository.findById.mockResolvedValue(user);
    notificationsRepository.claim.mockResolvedValue({ id: 'log-1', attempts: 0 });
    sendEmail.mockRejectedValue(new Error('Resend is down'));

    await expect(notificationService.notifyTaskCreated(user.id, task)).resolves.toBeUndefined();
    expect(notificationsRepository.markFailed).toHaveBeenCalledWith('log-1', 'Resend is down', 1);
  });

  it('never throws when the DB claim call itself rejects', async () => {
    usersRepository.findById.mockResolvedValue(user);
    notificationsRepository.claim.mockRejectedValue(new Error('DB unreachable'));

    await expect(notificationService.notifyTaskCreated(user.id, task)).resolves.toBeUndefined();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('is a no-op when the user does not exist', async () => {
    usersRepository.findById.mockResolvedValue(null);

    await notificationService.notifyTaskCreated(user.id, task);

    expect(notificationsRepository.claim).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });
});

describe('notificationService: TASK_UPDATED dedup key', () => {
  it('uses the task\'s updated_at as the dedup key, not a fixed constant', async () => {
    usersRepository.findById.mockResolvedValue(user);
    notificationsRepository.claim.mockResolvedValue({ id: 'log-1', attempts: 0 });
    sendEmail.mockResolvedValue({ id: 'email-1' });

    await notificationService.notifyTaskUpdated(user.id, task, ['priority']);

    expect(notificationsRepository.claim).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'TASK_UPDATED', dedupKey: task.updated_at }),
    );
  });
});

describe('notificationService: push channel', () => {
  it('sends nothing and claims nothing when the user has no subscriptions', async () => {
    usersRepository.findById.mockResolvedValue(user);
    notificationsRepository.claim.mockResolvedValue({ id: 'email-log', attempts: 0 });
    sendEmail.mockResolvedValue({ id: 'email-1' });
    pushSubscriptionsRepository.listByUser.mockResolvedValue([]);

    await notificationService.notifyTaskCreated(user.id, task);

    expect(sendPush).not.toHaveBeenCalled();
    expect(notificationsRepository.claim).not.toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'PUSH' }),
    );
  });

  it('sends to every subscription under one claimed PUSH row and marks it SENT if any succeed', async () => {
    usersRepository.findById.mockResolvedValue(user);
    pushSubscriptionsRepository.listByUser.mockResolvedValue([subscription, { ...subscription, id: 'sub-2' }]);
    notificationsRepository.claim.mockImplementation(({ channel }) =>
      Promise.resolve({ id: `log-${channel}`, attempts: 0 }),
    );
    sendEmail.mockResolvedValue({ id: 'email-1' });
    sendPush.mockResolvedValue({ ok: true });

    await notificationService.notifyTaskCreated(user.id, task);

    expect(notificationsRepository.claim).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'TASK_CREATED', dedupKey: 'once', channel: 'PUSH' }),
    );
    expect(sendPush).toHaveBeenCalledTimes(2);
    expect(notificationsRepository.markSent).toHaveBeenCalledWith('log-PUSH');
  });

  it('marks the PUSH row FAILED when every subscription send fails, without affecting the EMAIL row', async () => {
    usersRepository.findById.mockResolvedValue(user);
    pushSubscriptionsRepository.listByUser.mockResolvedValue([subscription]);
    notificationsRepository.claim.mockImplementation(({ channel }) =>
      Promise.resolve({ id: `log-${channel}`, attempts: 0 }),
    );
    sendEmail.mockResolvedValue({ id: 'email-1' });
    sendPush.mockResolvedValue({ ok: false, error: new Error('gone') });

    await notificationService.notifyTaskCreated(user.id, task);

    expect(notificationsRepository.markFailed).toHaveBeenCalledWith('log-PUSH', 'gone', 1);
    expect(notificationsRepository.markSent).toHaveBeenCalledWith('log-EMAIL');
  });

  it('a rejected push claim never blocks the email send', async () => {
    usersRepository.findById.mockResolvedValue(user);
    pushSubscriptionsRepository.listByUser.mockResolvedValue([subscription]);
    notificationsRepository.claim.mockImplementation(({ channel }) =>
      channel === 'PUSH' ? Promise.reject(new Error('DB unreachable')) : Promise.resolve({ id: 'log-EMAIL', attempts: 0 }),
    );
    sendEmail.mockResolvedValue({ id: 'email-1' });

    await expect(notificationService.notifyTaskCreated(user.id, task)).resolves.toBeUndefined();
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(notificationsRepository.markSent).toHaveBeenCalledWith('log-EMAIL');
  });
});

describe('notificationService: in-app feed', () => {
  it('always writes a feed row, regardless of email/push outcome', async () => {
    usersRepository.findById.mockResolvedValue(user);
    notificationsRepository.claim.mockResolvedValue({ id: 'log-1', attempts: 0 });
    sendEmail.mockRejectedValue(new Error('Resend is down'));

    await notificationService.notifyTaskCreated(user.id, task);

    expect(notificationsFeedRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: user.id, taskId: task.id, type: 'TASK_CREATED' }),
    );
  });

  it('a rejected feed insert never blocks the email send', async () => {
    usersRepository.findById.mockResolvedValue(user);
    notificationsRepository.claim.mockResolvedValue({ id: 'log-1', attempts: 0 });
    sendEmail.mockResolvedValue({ id: 'email-1' });
    notificationsFeedRepository.create.mockRejectedValue(new Error('DB unreachable'));

    await expect(notificationService.notifyTaskCreated(user.id, task)).resolves.toBeUndefined();
    expect(notificationsRepository.markSent).toHaveBeenCalledWith('log-1');
  });
});

describe('notificationService.retryFailed', () => {
  it('re-sends a FAILED EMAIL row and marks it SENT on success', async () => {
    notificationsRepository.findRetryable.mockResolvedValue([
      { id: 'log-2', user_id: 'user-1', task_id: 'task-1', type: 'TASK_CREATED', channel: 'EMAIL', attempts: 1 },
    ]);
    usersRepository.findById.mockResolvedValue(user);
    tasksRepository.findByIdInternal.mockResolvedValue(task);
    sendEmail.mockResolvedValue({ id: 'email-2' });

    await notificationService.retryFailed();

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(notificationsRepository.markSent).toHaveBeenCalledWith('log-2');
  });

  it('gives up (caps out) an EMAIL row whose user/email/task no longer resolves', async () => {
    notificationsRepository.findRetryable.mockResolvedValue([
      { id: 'log-3', user_id: 'user-1', task_id: 'task-1', type: 'TASK_CREATED', channel: 'EMAIL', attempts: 4 },
    ]);
    tasksRepository.findByIdInternal.mockResolvedValue(task);
    usersRepository.findById.mockResolvedValue(null);

    await notificationService.retryFailed();

    expect(sendEmail).not.toHaveBeenCalled();
    expect(notificationsRepository.markFailed).toHaveBeenCalledWith(
      'log-3',
      expect.any(String),
      expect.any(Number),
    );
  });

  it('re-sends a FAILED PUSH row to every current subscription and marks it SENT on success', async () => {
    notificationsRepository.findRetryable.mockResolvedValue([
      { id: 'log-4', user_id: 'user-1', task_id: 'task-1', type: 'TASK_CREATED', channel: 'PUSH', attempts: 1 },
    ]);
    tasksRepository.findByIdInternal.mockResolvedValue(task);
    pushSubscriptionsRepository.listByUser.mockResolvedValue([subscription]);
    sendPush.mockResolvedValue({ ok: true });

    await notificationService.retryFailed();

    expect(sendPush).toHaveBeenCalledTimes(1);
    expect(notificationsRepository.markSent).toHaveBeenCalledWith('log-4');
  });

  it('caps out a PUSH row with no remaining subscriptions', async () => {
    notificationsRepository.findRetryable.mockResolvedValue([
      { id: 'log-5', user_id: 'user-1', task_id: 'task-1', type: 'TASK_CREATED', channel: 'PUSH', attempts: 3 },
    ]);
    tasksRepository.findByIdInternal.mockResolvedValue(task);
    pushSubscriptionsRepository.listByUser.mockResolvedValue([]);

    await notificationService.retryFailed();

    expect(sendPush).not.toHaveBeenCalled();
    expect(notificationsRepository.markFailed).toHaveBeenCalledWith(
      'log-5',
      expect.any(String),
      expect.any(Number),
    );
  });
});
