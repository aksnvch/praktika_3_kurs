import { Poll, Vote } from '../models/index.js';

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

class pollService {
  createPoll(telegramPollId, question, options, type, correctOption, chatId, messageId) {
    console.log(`Poll ${telegramPollId} saving to DB from chat ${chatId}.`);
    return Poll.create({
      id: String(telegramPollId),
      question,
      options: options.reduce((acc, text, index) => ({ ...acc, [index]: { text, votes: 0 } }), {}),
      type,
      correctOption,
      isActive: true,
      chatId: String(chatId),
      messageId: String(messageId),
    });
  }

  getAllPolls() {
    return Poll.findAll({ order: [['createdAt', 'DESC']] });
  }

  async getPoll(id) {
    const poll = await Poll.findByPk(String(id));
    if (!poll) {
      throw new ApiError(404, 'Poll not found');
    }
    return poll;
  }

  async getPollStats(id) {
    const poll = await this.getPoll(id); 
    
    const optionsArray = Object.values(poll.options).map((value, index) => ({
      index, text: value.text, votes: value.votes || 0,
    }));
    const totalVotes = optionsArray.reduce((sum, opt) => sum + opt.votes, 0);

    return {
      question: poll.question, options: optionsArray, totalVotes,
      type: poll.type, isActive: poll.isActive, correctOption: poll.correctOption
    };
  }
  
  async updatePoll(id, data) {
    const poll = await this.getPoll(id); 
    return poll.update(data);
  }

  async deletePoll(id) {
    const poll = await this.getPoll(id); 
    await poll.destroy();
    return true;
  }

  async updatePollStats(pollId, votes, isClosed = false) {
    const poll = await this.getPoll(pollId);
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
  }

  async recordUserVote(pollId, userId, optionIndex) {
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
  }

  checkUserVote(pollId, userId) {
    return Vote.findOne({
      where: { pollId: String(pollId), userId: String(userId) }
    });
  }
}

export default new pollService();