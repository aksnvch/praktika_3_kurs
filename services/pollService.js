import { Poll, Option, Vote, PollMapping, sequelize  } from '../models/index.js';

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

class pollService {
  async createPoll(telegramPollId, question, optionsText, type, correctOption, chatId, messageId) {
    const t = await sequelize.transaction(); 
    try {
      const poll = await Poll.create({
        id: String(telegramPollId),
        question,
        type,
        correctOption,
        isActive: true,
        chatId: String(chatId),
        messageId: String(messageId)
      }, { transaction: t });

      const optionsToCreate = optionsText.map((text, index) => ({
        text,
        pollId: poll.id,
        position: index
      }));
      await Option.bulkCreate(optionsToCreate, { transaction: t });

      await t.commit();
      
      return this.getPoll(poll.id);

    } catch (error) {
      await t.rollback();
      console.error('Poll creation failed, transaction rolled back.', error);
      throw error;
    }
  }

  getAllPolls() {
    return Poll.findAll({ order: [['createdAt', 'DESC']] });
  }

  getPoll(id) {
    return Poll.findByPk(String(id), {
      include: [{
        model: Option,
        as: 'options', 
      }],
      order: [
        [{ model: Option, as: 'options' }, 'position', 'ASC'] 
      ]
    });
  }


  async getPollStats(id) {
        const poll = await this.getPoll(id); 
        if (!poll) {
            throw new ApiError(404, 'Poll not found');
        }

        const voteCounts = await Vote.findAll({
            attributes: [
                'optionId',
                [sequelize.fn('COUNT', sequelize.col('optionId')), 'voteCount']
            ],
            where: { pollId: id },
            group: ['optionId']
        });

        const votesMap = voteCounts.reduce((acc, item) => {
            acc[item.optionId] = parseInt(item.getDataValue('voteCount'), 10);
            return acc;
        }, {});
        
        const optionsWithVotes = poll.options.map(option => ({
            index: option.position,
            text: option.text,
            votes: votesMap[option.id] || 0 
        }));

        const totalVotes = Object.values(votesMap).reduce((sum, count) => sum + count, 0);

        return {
            question: poll.question,
            options: optionsWithVotes,
            totalVotes,
            type: poll.type,
            isActive: poll.isActive,
            correctOption: poll.correctOption
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

  async updateOptionVotes(pollId, voteCounts) {
    const t = await sequelize.transaction();
    try {
      const options = await Option.findAll({
        where: { pollId: String(pollId) },
        order: [['position', 'ASC']],
        transaction: t
      });

      if (options.length !== voteCounts.length) {
        throw new Error('Mismatch between options count in DB and vote counts from Telegram.');
      }
      
      const updatePromises = options.map((option, index) => {
        return option.update({ votes: voteCounts[index] }, { transaction: t });
      });

      await Promise.all(updatePromises);

      await t.commit();
      console.log(`Votes for poll ${pollId} updated successfully.`);
      
    } catch (error) {
      await t.rollback();
      console.error(`Failed to update votes for poll ${pollId}:`, error);
      throw error;
    }
  }

   async recordUserVote(pollId, userId, optionIndex) {
    const option = await Option.findOne({
      where: {
        pollId: String(pollId),
        position: optionIndex
      }
    });

    if (!option) {
      console.error(`Could not find option with position ${optionIndex} for poll ${pollId}`);
      throw new Error('Invalid option for this poll');
    }

    const [vote, created] = await Vote.findOrCreate({
      where: {
        userId: String(userId),
        pollId: String(pollId)
      },
      defaults: {
        optionId: option.id
      }
    });

    if (!created) {
      await vote.update({ optionId: option.id });
    }
    
    return vote;
  }


  checkUserVote(pollId, userId) {
    return Vote.findOne({
      where: { pollId: String(pollId), userId: String(userId) }
    });
  }

  findPollByQuestion(question) {
    return Poll.findOne({
      where: {
        question,
        isActive: true
      }
    });
  }

  async findPollByTelegramId(telegramPollId) {
    return Poll.findByPk(String(telegramPollId));
  }

  createPollMapping(telegramPollId, internalPollId) {
    return PollMapping.create({ telegramPollId, internalPollId });
  }

  async findInternalPollId(telegramPollId) {
    const mapping = await PollMapping.findByPk(String(telegramPollId));
    return mapping ? mapping.internalPollId : null;
  }

   getAllVotesForPoll(pollId) {
    return Vote.findAll({
      where: {
        pollId: String(pollId)
      }
    });
  }
}

export default new pollService();