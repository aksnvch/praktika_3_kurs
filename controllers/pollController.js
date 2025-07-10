import pollService from '../services/pollService.js';
import config from '../config/bot.js';
import botService from '../services/botService.js';

class PollController {
      async getAllPolls(req, res, next) {
        try {
          const polls = await pollService.getAllPolls();
          return res.json(polls); 
        } catch (error) {
          next(error);
        }
      }

      async getPoll(req, res, next) {
        try {
        const poll = await pollService.getPoll(req.params.id);

        if (!poll) {
          return res.status(404).json({ message: 'Poll not found' });
        }
        
        return res.json(poll);
        } catch (error) {
          next(error);
        }
      }

      async getPollStats(req, res, next) {
        try {
          const stats = await pollService.getPollStats(req.params.id);
          return res.json(stats); 
        } catch (error) {
          next(error);
        }
      }

      async createPoll(req, res, next) {
      try {

        if (!req.body) { 
          return res.status(400).json({ message: 'Request body is missing or has incorrect Content-Type' });
      }

      let { question, options, type = 'anonymous', correctOption = null } = req.body;

      if (!question || !options || !Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ message: 'Question and at least 2 options are required' });
      }

      const MAX_QUESTION_LENGTH = 290; 
      if (question.length > MAX_QUESTION_LENGTH) {
        console.log(`Question was too long, truncated to ${MAX_QUESTION_LENGTH} chars.`);
        question = question.substring(0, MAX_QUESTION_LENGTH - 3) + '...';
      }

      if (!config.adminId) {
        throw new Error('ADMIN_TELEGRAM_ID is not configured...');
      }

      const createdPollInDb = await botService.createPollAndSave({
        question, 
        options,
        type,
        correctOption,
        targetChatId: config.adminId
      });

      return res.status(201).json(createdPollInDb);
    } catch (error) {
      next(error);
    }
  }
  
      async updatePoll(req, res, next) {
        try {
        const { question } = req.body;
        if (!question) {
          return res.status(400).json({ message: 'Question field is required for update' });
        }
      
        const updatedPoll = await pollService.updatePoll(req.params.id, req.body);

        if (!updatedPoll) {
            return res.status(404).json({ message: 'Poll not found' });
        }

          return res.json(updatedPoll);
        } catch (error) {
          next(error);
        }
      }
      
      async deletePoll(req, res, next) {
        try {
          await pollService.deletePoll(req.params.id);
          return res.status(204).end(); 
        } catch (error) {
          next(error);
        }
      }
    }

export default new PollController();