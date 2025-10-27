import { Router } from 'express';
import pollController from '../../controllers/pollController.js';

const router = Router();

router.get('/', pollController.getAllPolls);
router.post('/', pollController.createPoll);
router.get('/:id', pollController.getPoll);
router.put('/:id', pollController.updatePoll);
router.delete('/:id', pollController.deletePoll);
router.get('/:id/stats', pollController.getPollStats);

export default router;