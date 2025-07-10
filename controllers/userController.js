import { User } from '../models/index.js';

export async function registerUser(telegramId, username, firstName, lastName) {
  const [user] = await User.findOrCreate({
    where: { telegramId },
    defaults: { 
      username, 
      firstName, 
      lastName
    }
  });
  return user;
}