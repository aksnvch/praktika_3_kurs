import { Router } from 'express';
import pollController from '../controllers/pollController.js';
import adminController from '../controllers/adminController.js';

const router = Router();

const pollRouter = Router();
pollRouter.get('/', pollController.getAllPolls);
pollRouter.post('/', pollController.createPoll);
pollRouter.get('/:id', pollController.getPoll);
pollRouter.put('/:id', pollController.updatePoll);
pollRouter.delete('/:id', pollController.deletePoll);
pollRouter.get('/:id/stats', pollController.getPollStats);

const adminRouter = Router();
adminRouter.get('/blacklist', adminController.getBlacklist);
adminRouter.post('/blacklist', adminController.addToBlacklist);
adminRouter.delete('/blacklist/:telegramId', adminController.removeFromBlacklist);

router.use('/polls', pollRouter);
router.use('/admin', adminRouter); 

export default router;