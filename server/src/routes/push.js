import { Router } from 'express';

import { requireAuthenticated } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as pushController from '../controllers/pushController.js';
import { subscribeBodySchema, unsubscribeBodySchema } from '../validation/pushSchemas.js';

const router = Router();

// Not gated behind auth: the VAPID public key isn't sensitive (it's meant
// to be embedded in the client-side subscribe() call) and the client needs
// it before it has anything else to authenticate with push-wise.
router.get('/vapid-public-key', pushController.vapidPublicKey);

router.use(requireAuthenticated);

router.post('/subscribe', validate({ body: subscribeBodySchema }), pushController.subscribe);
router.delete('/subscribe', validate({ body: unsubscribeBodySchema }), pushController.unsubscribe);

export default router;
