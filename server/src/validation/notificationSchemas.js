import { z } from 'zod';

export const listQuerySchema = z
  .object({
    unreadOnly: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => value === 'true'),
  })
  .strict();

export const idParamSchema = z.object({
  id: z.string().uuid({ message: 'id must be a valid UUID' }),
});
