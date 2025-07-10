import { Router } from 'express';
import adminController from '../../controllers/adminController.js';

const router = Router();

router.get('/blacklist', adminController.getBlacklist);
router.post('/blacklist', adminController.addToBlacklist);
router.delete('/blacklist/:telegramId', adminController.removeFromBlacklist);

export default router;