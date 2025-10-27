import { Router } from 'express';
import * as pollController from './pollService.js';
import * as adminController from './adminService.js';

const router = Router();

router.get('/polls', async (req, res) => {
  try {
    const polls = await pollController.getAllPolls();
    res.json(polls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/polls/:id', async (req, res) => {
  try {
    const poll = await pollController.getPoll(req.params.id);
    if (!poll) return res.status(404).json({ error: 'Poll not found' });
    res.json(poll);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/polls/:id/stats', async (req, res) => {
  try {
    const stats = await pollController.getPollStats(req.params.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/polls', async (req, res) => {
  try {
    const { question, options, type = 'anonymous' } = req.body;
    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'Question and at least 2 options are required' });
    }
    
    const fakeTelegramId = `api-${Date.now()}`;
    const poll = await pollController.createPoll(
      fakeTelegramId, question, options, type, null, 'api_chat', 'api_message'
    );
    
    res.status(201).json(poll);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/polls/:id', async (req, res) => {
  try {
    const { question, options } = req.body;
    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'Question and at least 2 options are required' });
    }
    res.status(501).json({ error: 'Update poll function is not implemented in the controller.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/polls/:id', async (req, res) => {
  try {
    await pollController.deletePoll(req.params.id);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/blacklist', async (req, res) => {
  try {
    const blacklist = await adminController.getBlacklist();
    res.json(blacklist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/blacklist', async (req, res) => {
  try {
    const { telegramId, reason } = req.body;
    if (!telegramId || !reason) {
      return res.status(400).json({ error: 'Telegram ID and reason are required' });
    }

    const blacklistedUser = await adminController.addToBlacklist(telegramId, reason);
    res.status(201).json(blacklistedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/blacklist/:telegramId', async (req, res) => {
  try {
    await adminController.removeFromBlacklist(req.params.telegramId); 
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;