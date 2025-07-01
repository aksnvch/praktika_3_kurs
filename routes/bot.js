const express = require('express');
const router = express.Router();
const botService = require('../services/botService');

// Webhook endpoint for Telegram
router.post(`/webhook/${botService.bot.secretPathComponent()}`, (req, res) => {
  botService.bot.handleUpdate(req.body, res);
});

module.exports = router;