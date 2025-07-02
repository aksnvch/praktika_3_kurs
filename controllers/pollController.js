import pollService from '../services/pollService.js';

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
          const { question, options, type = 'anonymous' } = req.body;
          if (!question || !options || !Array.isArray(options) || options.length < 2) {
            return res.status(400).json({ message: 'Question and at least 2 options are required' });
          }
    
          const fakeTelegramId = `api-${Date.now()}`;
          const poll = await pollService.createPoll(
            fakeTelegramId, question, options, type, null, 'api_chat', 'api_message'
          );
          return res.status(201).json(poll); 
        } catch (error) {
          next(error);
        }
      }
  
      async updatePoll(req, res, next) {
        try {
          const updatedPoll = await pollService.updatePoll(req.params.id, req.body);
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