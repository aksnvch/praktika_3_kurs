import { Sequelize } from 'sequelize';
import dbConfig from '../config/db.cjs'; 

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env]; 

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: config.dialect,
  logging: false,
});

export default sequelize; 