import 'dotenv/config'; 
import express from 'express';
import db from './models/index.js';
const { sequelize } = db;
import apiRoutes from './routes/api.js';
import botRoutes from './routes/bot.js';
import botService from './services/botService.js';
import config from './config/bot.js';

const app = express();

app.use(express.json());

app.use('/api', apiRoutes); 
app.use(botRoutes); 

sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synchronized');

    if (process.env.NODE_ENV !== 'test') {
      if (config.webhookUrl) {
        const webhookPath = botService.bot.secretPathComponent();
        botService.bot.telegram.setWebhook(`${config.webhookUrl}/webhook/${webhookPath}`);
        console.log(`Webhook set to ${config.webhookUrl}/webhook/${webhookPath}`);
      } else {
        botService.start();
      }
    }
  })
  .catch(err => console.error('Database sync error:', err));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;

app.use((err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal Server Error' : err.message;

  return res.status(statusCode).json({
    status: 'error',
    message: message
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  botService.stop();
  try {
    await sequelize.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
  process.exit(0);
});

export default app; 