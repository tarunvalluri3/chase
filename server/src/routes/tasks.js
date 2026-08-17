import { Router } from 'express';

import { requireAuthenticated } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as tasksController from '../controllers/tasksController.js';
import {
  createTaskBodySchema,
  editTaskBodySchema,
  deleteReasonBodySchema,
  resolveMissedBodySchema,
  listQuerySchema,
  idParamSchema,
} from '../validation/taskSchemas.js';

const router = Router();

router.use(requireAuthenticated);

router.post('/', validate({ body: createTaskBodySchema }), tasksController.create);
router.get('/', validate({ query: listQuerySchema }), tasksController.list);
router.post('/sweep-missed', tasksController.sweep);
router.get('/:id', validate({ params: idParamSchema }), tasksController.getOne);
router.patch(
  '/:id',
  validate({ params: idParamSchema, body: editTaskBodySchema }),
  tasksController.edit,
);
router.post('/:id/complete', validate({ params: idParamSchema }), tasksController.complete);
router.post(
  '/:id/resolve-missed',
  validate({ params: idParamSchema, body: resolveMissedBodySchema }),
  tasksController.resolveMissed,
);
router.delete(
  '/:id',
  validate({ params: idParamSchema, body: deleteReasonBodySchema }),
  tasksController.remove,
);

export default router;
