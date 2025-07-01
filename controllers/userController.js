const { User } = require('../models');

module.exports = {
  registerUser: async (telegramId, username, firstName, lastName) => {
    try {
      const [user] = await User.findOrCreate({
        where: { telegramId },
        defaults: { 
          username, 
          firstName, 
          lastName,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      return user;
    } catch (error) {
      throw error;
    }
  }
};