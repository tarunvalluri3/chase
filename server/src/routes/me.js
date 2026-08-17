import { Router } from 'express';

import { requireAuthenticated, getAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuthenticated, (req, res) => {
  const { userId } = getAuth(req);
  res.status(200).json({ clerkUserId: userId });
});

export default router;
