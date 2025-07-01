require('dotenv').config();

module.exports = {
  token: process.env.TELEGRAM_BOT_TOKEN,
  adminId: process.env.ADMIN_TELEGRAM_ID,
  webhookUrl: process.env.WEBHOOK_URL,
  adminPassword: 'admin123'
};