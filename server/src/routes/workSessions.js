import { Router } from 'express';

import { requireAuthenticated } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as workSessionsController from '../controllers/workSessionsController.js';
import { taskIdParamSchema } from '../validation/workSessionSchemas.js';

// mergeParams so :id (the task id, from the parent tasks router) is visible
// on req.params here.
const router = Router({ mergeParams: true });

router.use(requireAuthenticated);
router.use(validate({ params: taskIdParamSchema }));

router.post('/start', workSessionsController.start);
router.post('/pause', workSessionsController.pause);
router.post('/resume', workSessionsController.resume);
router.post('/stop', workSessionsController.stop);
router.get('/', workSessionsController.list);
router.get('/summary', workSessionsController.summary);

export default router;
