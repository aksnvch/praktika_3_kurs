// ЗАМЕНИТЬ СОДЕРЖИМОЕ ФАЙЛА /controllers/pollController.js

const { Poll, Vote } = require('../models');

module.exports = {
  createPoll: async (telegramPollId, question, options, type, correctOption, chatId, messageId) => {
    try {
      const poll = await Poll.create({
        id: String(telegramPollId),
        question,
        options: options.reduce((acc, text, index) => ({ ...acc, [index]: { text, votes: 0 } }), {}),
        type,
        correctOption,
        isActive: true,
        chatId: String(chatId),
        messageId: String(messageId),
      });
      console.log(`Poll ${telegramPollId} saved to DB from chat ${chatId}.`);
      return poll;
    } catch (error) {
      console.error('Poll creation error in controller:', error);
      throw error;
    }
  },

  getPoll: async (pollId) => {
    return await Poll.findByPk(String(pollId));
  },

  getAllPolls: async () => {
    return await Poll.findAll({ order: [['createdAt', 'DESC']] });
  },

  // --- НОВАЯ ФУНКЦИЯ ---
  deletePoll: async (pollId) => {
    try {
        const poll = await Poll.findByPk(String(pollId));
        if (poll) {
            await poll.destroy();
            console.log(`Poll ${pollId} deleted from DB.`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Error deleting poll ${pollId}:`, error);
        throw error;
    }
  },
  // ---------------------

  updatePollStats: async (pollId, votes, isClosed = false) => {
    try {
      const poll = await Poll.findByPk(String(pollId));
      if (!poll) {
        console.log(`[updatePollStats] Poll ${pollId} not found in DB. Skipping.`);
        return;
      }
  
      let optionsChanged = false;
      let statusChanged = false;
  
      if (votes && votes.length > 0) {
        const currentOptions = poll.get('options', { plain: true });
        
        votes.forEach((count, index) => {
          if (currentOptions[index] && currentOptions[index].votes !== count) {
            currentOptions[index].votes = count;
            optionsChanged = true;
          }
        });
  
        if (optionsChanged) {
          poll.options = currentOptions;
        }
      }
  
      if (isClosed && poll.isActive) {
        poll.isActive = false;
        statusChanged = true;
      }
      
      if (optionsChanged || statusChanged) {
        if (optionsChanged) {
          poll.changed('options', true);
        }
        
        await poll.save(); 
        console.log(`[SAVED] Stats for poll ${pollId}. Options changed: ${optionsChanged}, Status changed: ${statusChanged}`);
      }
  
    } catch (error) {
      console.error(`Error updating poll stats for poll ${pollId}:`, error);
      throw error;
    }
  },

  getPollStats: async (pollId) => {
    const poll = await Poll.findByPk(String(pollId));
    if (!poll) throw new Error('Poll not found');

    const optionsArray = Object.values(poll.options).map((value, index) => ({
      index, text: value.text, votes: value.votes || 0,
    }));

    const totalVotes = optionsArray.reduce((sum, opt) => sum + opt.votes, 0);

    return {
      question: poll.question, options: optionsArray, totalVotes,
      type: poll.type, isActive: poll.isActive, correctOption: poll.correctOption
    };
  },

  recordUserVote: async (pollId, userId, optionIndex) => {
    try {
        const [vote, created] = await Vote.findOrCreate({
            where: { pollId: String(pollId), userId: String(userId) },
            defaults: { optionIndex }
        });
        if (!created) {
            await vote.update({ optionIndex });
            console.log(`User ${userId} changed vote in poll ${pollId} to option ${optionIndex}.`);
        } else {
            console.log(`User ${userId} voted in poll ${pollId} for option ${optionIndex}.`);
        }
        return vote;
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            console.log(`Duplicate vote attempt by user ${userId} for poll ${pollId}. Ignored.`);
            return null;
        }
        console.error('Error recording vote:', error);
        throw error;
    }
  },

  checkUserVote: async (pollId, userId) => {
    return await Vote.findOne({
        where: { pollId: String(pollId), userId: String(userId) }
    });
  }
};