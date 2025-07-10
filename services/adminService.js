import { Blacklist } from '../models/index.js';

class adminService {
  getBlacklist() {
    return Blacklist.findAll();
  }

   async addToBlacklist(telegramId, reason) {
    const [user, created] = await Blacklist.findOrCreate({
      where: { telegramId: String(telegramId) },
      defaults: { reason }
    });

    if (!created && user.reason !== reason) {
      await user.update({ reason });
    }

    return { user, created };
  }

  async removeFromBlacklist(telegramId) {
    const user = await Blacklist.findOne({ where: { telegramId: String(telegramId) } });
    if (user) {
      await user.destroy();
      return true;
    }
    return false;
  }
  
  checkBlacklist(userId) {
    return Blacklist.findOne({ where: { telegramId: String(userId) } });
  }
}

export default new adminService();