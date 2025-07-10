import { Router } from 'express';
import pollRoutes from './poll.js';
import adminRoutes from './admin.js';

const router = Router();

router.use('/polls', pollRoutes);
router.use('/admin', adminRoutes);
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default router;