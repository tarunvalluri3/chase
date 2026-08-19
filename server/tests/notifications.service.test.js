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

vi.mock('../src/services/emailService.js', () => ({
  sendEmail: vi.fn(),
}));

import * as notificationsRepository from '../src/repositories/notificationsRepository.js';
import * as usersRepository from '../src/repositories/usersRepository.js';
import * as tasksRepository from '../src/repositories/tasksRepository.js';
import { sendEmail } from '../src/services/emailService.js';
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe('notificationService: happy path', () => {
  it('claims, sends, and marks a notification SENT', async () => {
    usersRepository.findById.mockResolvedValue(user);
    notificationsRepository.claim.mockResolvedValue({ id: 'log-1', attempts: 0 });
    sendEmail.mockResolvedValue({ id: 'email-1' });

    await notificationService.notifyTaskCreated(user.id, task);

    expect(notificationsRepository.claim).toHaveBeenCalledWith({
      userId: user.id,
      taskId: task.id,
      type: 'TASK_CREATED',
      dedupKey: 'once',
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

describe('notificationService.retryFailed', () => {
  it('re-sends a FAILED row and marks it SENT on success', async () => {
    notificationsRepository.findRetryable.mockResolvedValue([
      { id: 'log-2', user_id: 'user-1', task_id: 'task-1', type: 'TASK_CREATED', attempts: 1 },
    ]);
    usersRepository.findById.mockResolvedValue(user);
    tasksRepository.findByIdInternal.mockResolvedValue(task);
    sendEmail.mockResolvedValue({ id: 'email-2' });

    await notificationService.retryFailed();

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(notificationsRepository.markSent).toHaveBeenCalledWith('log-2');
  });

  it('gives up (caps out) a row whose user/email/task no longer resolves', async () => {
    notificationsRepository.findRetryable.mockResolvedValue([
      { id: 'log-3', user_id: 'user-1', task_id: 'task-1', type: 'TASK_CREATED', attempts: 4 },
    ]);
    usersRepository.findById.mockResolvedValue(null);

    await notificationService.retryFailed();

    expect(sendEmail).not.toHaveBeenCalled();
    expect(notificationsRepository.markFailed).toHaveBeenCalledWith(
      'log-3',
      expect.any(String),
      expect.any(Number),
    );
  });
});
