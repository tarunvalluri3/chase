import { Router } from 'express';

import { requireAuthenticated } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as notificationsController from '../controllers/notificationsController.js';
import { listQuerySchema, idParamSchema } from '../validation/notificationSchemas.js';

const router = Router();

router.use(requireAuthenticated);

router.get('/', validate({ query: listQuerySchema }), notificationsController.list);
router.post('/read-all', notificationsController.markAllRead);
router.post('/:id/read', validate({ params: idParamSchema }), notificationsController.markRead);

export default router;
