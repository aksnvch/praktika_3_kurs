import { Blacklist } from '../models/index.js';

class adminService {
  getBlacklist() {
    return Blacklist.findAll();
  }

  addToBlacklist(telegramId, reason) {
    return Blacklist.findOrCreate({
      where: { telegramId: String(telegramId) },
      defaults: { reason }
    }).then(([user, created]) => {
      if (!created) {
        return user.update({ reason });
      }
      return user;
    });
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