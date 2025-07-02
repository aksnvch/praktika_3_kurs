import { Sequelize } from 'sequelize';
import dbConfig from '../config/db.cjs';

import { initUserModel } from './user.js';
import { initPollModel } from './poll.js';
import { initVoteModel } from './vote.js';
import { initBlacklistModel } from './blacklist.js';

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

const sequelize = config.use_env_variable
  ? new Sequelize(process.env[config.use_env_variable], config)
  : new Sequelize(config.database, config.username, config.password, { ...config, logging: false });

const db = {};

db.User = initUserModel(sequelize);
db.Poll = initPollModel(sequelize);
db.Vote = initVoteModel(sequelize);
db.Blacklist = initBlacklistModel(sequelize);

Object.values(db).forEach(model => {
  if (model && typeof model.associate === 'function') {
    model.associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;

export const User = db.User;
export const Poll = db.Poll;
export const Vote = db.Vote;
export const Blacklist = db.Blacklist;