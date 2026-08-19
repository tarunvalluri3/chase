import { Router } from 'express';

import { requireAuthenticated } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as analyticsController from '../controllers/analyticsController.js';
import { summaryQuerySchema } from '../validation/analyticsSchemas.js';

const router = Router();

router.use(requireAuthenticated);

router.get('/summary', validate({ query: summaryQuerySchema }), analyticsController.summary);

export default router;
