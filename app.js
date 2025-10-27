import 'dotenv/config'; 
import express from 'express';
import db from './models/index.js';
import botService from './services/botService.js';
import config from './config/bot.js';
import apiRouter from './routes/api/index.js'; 
import botRouter from './routes/bot.js'; 

const { sequelize } = db;
const app = express();

app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use('/api', apiRouter); 
app.use('/', botRouter); 

app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal Server Error' : err.message;
  return res.status(statusCode).json({ status: 'error', message });
});

const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true }).then(() => {
  console.log('Database synchronized');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    if (process.env.NODE_ENV !== 'test') {
      if (config.webhookUrl) {
        const webhookPath = botService.bot.secretPathComponent();
        botService.bot.telegram.setWebhook(`${config.webhookUrl}/${webhookPath}`);
        console.log(`Webhook set to ${config.webhookUrl}/${webhookPath}`);
      } else {
        botService.start();
      }
    }
  });
}).catch(err => {
  console.error('Failed to sync database:', err);
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