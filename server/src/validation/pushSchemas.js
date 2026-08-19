import { z } from 'zod';

export const subscribeBodySchema = z
  .object({
    endpoint: z.string().trim().min(1, 'endpoint is required'),
    keys: z
      .object({
        p256dh: z.string().trim().min(1, 'keys.p256dh is required'),
        auth: z.string().trim().min(1, 'keys.auth is required'),
      })
      .strict(),
    userAgent: z.string().trim().min(1).optional(),
  })
  .strict();

export const unsubscribeBodySchema = z
  .object({
    endpoint: z.string().trim().min(1, 'endpoint is required'),
  })
  .strict();
