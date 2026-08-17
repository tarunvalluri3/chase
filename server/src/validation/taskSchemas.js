import { z } from 'zod';

const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
const statusSchema = z.enum(['ACTIVE', 'COMPLETED', 'MISSED', 'INCOMPLETE', 'DELETED']);

export const idParamSchema = z.object({
  id: z.string().uuid({ message: 'id must be a valid UUID' }),
});

export const listQuerySchema = z.object({
  status: statusSchema.optional(),
});

export const createTaskBodySchema = z
  .object({
    title: z.string().trim().min(1, 'title is required'),
    description: z.string().trim().min(1).optional().nullable(),
    deadline: z.coerce.date({
      invalid_type_error: 'deadline must be a valid date',
      required_error: 'deadline is required',
    }),
    priority: prioritySchema,
  })
  .strict();

export const editTaskBodySchema = z
  .object({
    title: z.string().trim().min(1, 'title cannot be empty').optional(),
    description: z.string().trim().min(1).optional().nullable(),
    deadline: z.coerce
      .date({ invalid_type_error: 'deadline must be a valid date' })
      .optional(),
    priority: prioritySchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one of title, description, deadline, priority is required',
  });

export const deleteReasonBodySchema = z
  .object({
    reason: z.string().trim().min(1, 'reason is required'),
  })
  .strict();

export const resolveMissedBodySchema = z.discriminatedUnion('resolution', [
  z
    .object({
      resolution: z.literal('INCOMPLETE'),
      reason: z.string().trim().min(1, 'reason is required'),
    })
    .strict(),
  z
    .object({
      resolution: z.literal('COMPLETED'),
    })
    .strict(),
]);
