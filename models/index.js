const sequelize = require('./db');
const User = require('./user')(sequelize);
const Poll = require('./poll')(sequelize);
const Blacklist = require('./blacklist')(sequelize);
const Vote = require('./vote')(sequelize)

module.exports = {
  sequelize,
  User,
  Poll,
  Blacklist,
  Vote
};