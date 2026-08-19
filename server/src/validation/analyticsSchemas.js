import { z } from 'zod';

// GET /api/analytics/summary?range=7d|30d|90d|all -- 'all' is the default,
// matching Phase 15's prior unfiltered-by-default behavior so nothing
// regresses for a user who never touches the range filter.
export const summaryQuerySchema = z.object({
  range: z.enum(['7d', '30d', '90d', 'all']).optional().default('all'),
});
