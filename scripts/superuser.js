import 'dotenv/config';
import db from '../models/index.js';

const { sequelize, User } = db;

const createSuperuser = async (telegramId) => {
  if (!telegramId || isNaN(Number(telegramId))) {
    console.error('Ошибка: Пожалуйста, укажите корректный Telegram ID в качестве аргумента.');
    console.log('Пример: node scripts/create-superuser.js 123456789');
    return;
  }
  
  const id = Number(telegramId);
  
  console.log(`Начинаем создание или обновление суперпользователя с ID: ${id}`);

  try {
    await sequelize.authenticate();
    console.log('Подключение к базе данных установлено.');
    
    const [user, created] = await User.findOrCreate({
      where: { telegramId: id },
      defaults: {
        telegramId: id,
        isAdmin: true,
      }
    });

    if (created) {
      console.log(`✅ Суперпользователь с ID ${id} успешно создан.`);
    } else {
      if (!user.isAdmin) {
        await user.update({ isAdmin: true });
        console.log(`✅ Пользователю с ID ${id} успешно выданы права суперпользователя.`);
      } else {
        console.log(`ℹ️ Пользователь с ID ${id} уже является суперпользователем.`);
      }
    }

  } catch (error) {
    console.error('❌ Произошла ошибка при создании суперпользователя:', error);
  } finally {
    await sequelize.close();
    console.log('Соединение с базой данных закрыто.');
  }
};

const telegramIdFromArgs = process.argv[2];

createSuperuser(telegramIdFromArgs);