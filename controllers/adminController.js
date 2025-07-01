const { User } = require('../models');
const { Blacklist } = require('../models');
const pollController = require('./pollController');

module.exports = {
  addAdmin: async (telegramId) => {
    try {
      const [user, created] = await User.findOrCreate({
        where: { telegramId },
        defaults: {
          isAdmin: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      if (!created && !user.isAdmin) {
        await user.update({ isAdmin: true });
      }

      return user;
    } catch (error) {
      console.error('Error in addAdmin:', error);
      throw error;
    }
  },

  removeAdmin: async (telegramId) => {
    const user = await User.findOne({ where: { telegramId } });
    if (!user) throw new Error('User not found');

    user.isAdmin = false;
    await user.save();
    return user;
  },

  addToBlacklist: async (telegramId, reason) => {
    // Проверка, чтобы не добавить дубликат
    const [user, created] = await Blacklist.findOrCreate({
      where: { telegramId: String(telegramId) },
      defaults: { reason }
    });
    if (!created) { // Если пользователь уже был, обновим причину
        await user.update({ reason });
    }
    return user;
  },

  removeFromBlacklist: async (telegramId) => {
    const user = await Blacklist.findOne({ where: { telegramId: String(telegramId) } });
    if (user) {
      await user.destroy();
      return true;
    }
    return false;
  },

  getBlacklist: async () => {
    return await Blacklist.findAll();
  },

  isAdmin: async (telegramId) => {
    const user = await User.findOne({ where: { telegramId } });
    return user && user.isAdmin;
  },

  checkBlacklist: async (userId) => {
    return await Blacklist.findOne({ where: { telegramId: String(userId) } });
  },

};