const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./models');
const apiRoutes = require('./routes/api');
const botRoutes = require('./routes/bot');
const botService = require('./services/botService');
const config = require('./config/bot');

const app = express();

// Middleware
app.use(bodyParser.json());

// Routes
app.use(apiRoutes);
app.use(botRoutes);

// Database synchronization
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synchronized');
    // Только после этого запускаем бота
    if (process.env.NODE_ENV !== 'test') {
      if (config.webhookUrl) {
        botService.bot.telegram.setWebhook(`${config.webhookUrl}/webhook`);
      } else {
        botService.start();
      }
    }
  });

  // В app.js после sequelize.sync
const { User } = require('./models');

async function ensureAdmin(telegramId) {
  const [user] = await User.findOrCreate({
    where: { telegramId },
    defaults: { isAdmin: true }
  });
  
  if (!user.isAdmin) {
    await user.update({ isAdmin: true });
  }
}

ensureAdmin(853826600); 

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  botService.stop();
  sequelize.close().then(() => {
    console.log('Database connection closed');
    process.exit(0);
  });
});

module.exports = app;