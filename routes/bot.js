import { Router } from 'express';
import botService from '../services/botService.js';

const router = Router();

router.post(`/webhook/${botService.bot.secretPathComponent()}`, (req, res) => {
  botService.bot.handleUpdate(req.body, res);
});

export default router;