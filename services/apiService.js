const express = require('express');
const router = express.Router();
const pollController = require('../controllers/pollController');
const adminController = require('../controllers/adminController');

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
    const { question, options } = req.body;
    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'Question and at least 2 options are required' });
    }

    const poll = await pollController.createPoll(question, options);
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

    const poll = await pollController.updatePoll(req.params.id, question, options);
    res.json(poll);
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

// Admin routes
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
    await adminController.removeFromBlacklist(parseInt(req.params.telegramId));
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;