import { Telegraf, Markup } from 'telegraf';
import config from '../config/bot.js';
import pollService from './pollService.js'; 
import adminService from './adminService.js'; 
import * as userController from '../controllers/userController.js'; 

//adminPassword: 'admin123'

class BotService {
  constructor() {
    if (!config.token) {
      throw new Error('Telegram bot token is not provided in config!');
    }
    this.bot = new Telegraf(config.token);
    this.pollCreationState = new Map();
    this.pollTypeState = new Map();
    this.pollEditingState = new Map();
    this.blacklistState = new Map();
    this.adminLoginState = new Map(); 
    this.authorizedAdmins = new Set();
    this.userRequestTimestamps = new Map();

    this.setupMiddlewares();
    this.setupCommands();
    this.setupActions();
  }

  async isAdmin(ctx, next) {
    if (this.authorizedAdmins.has(ctx.from.id)) {
      return next(); 
    }
    await ctx.answerCbQuery('⛔️ Доступ запрещен. Пожалуйста, войдите через /admin.', true);
    return;
  }

  async showStatsMenu(ctx) {
    try {
      const polls = await pollService.getAllPolls();
      if (polls.length === 0) {
        return ctx.editMessageText('Нет доступных опросов.', Markup.inlineKeyboard([[Markup.button.callback('🔙 Назад', 'back_to_admin')]])).catch(() => {});
      }

      const keyboard = polls.map(poll => {
        const icon = poll.type === 'quiz' ? '📝' : '📊';
        const status = poll.isActive ? '🟢' : '🔴';
        const text = `${status} ${icon} ${poll.question.substring(0, 30)}...`;
        return [Markup.button.callback(text, `view_stats_${poll.id}`)];
      });
      keyboard.push([Markup.button.callback('🔙 Назад', 'back_to_admin')]);

      const message = 'Выберите опрос для просмотра статистики:';
      await ctx.editMessageText(message, Markup.inlineKeyboard(keyboard)).catch(e => {});
    } catch (error) {
      console.error('Error in showStatsMenu:', error);
    }
  }

  async showDetailedStats(ctx, pollId) {
    try {
      const stats = await pollService.getPollStats(pollId);
      if (!stats) return ctx.answerCbQuery('Опрос не найден!', true);

      let message = `<b>${stats.type === 'quiz' ? '📝 Викторина' : '📊 Опрос'}: ${stats.question}</b>\n`;
      message += `Статус: ${stats.isActive ? '🟢 Активен' : '🔴 Остановлен'}\n\n`;

      if (stats.totalVotes === 0) {
          message += 'Голосов пока нет.\n';
      } else {
          message += `Всего голосов: ${stats.totalVotes}\n\n`;
          stats.options.forEach((opt, index) => {
              const percent = stats.totalVotes > 0 ? Math.round((opt.votes / stats.totalVotes) * 100) : 0;
              const isCorrect = stats.type === 'quiz' && !stats.isActive && stats.correctOption === index;
              const correctMark = isCorrect ? ' ✅ (Верный)' : '';
              message += `${index + 1}. ${opt.text}: <b>${opt.votes}</b> (${percent}%)${correctMark}\n`;
          });
      }
      if (stats.type === 'quiz' && stats.isActive) {
        message += '\n<i>❗️ Финальная статистика и верный ответ для викторин появятся после их остановки.</i>';
      }

      const keyboard = [
        [Markup.button.callback('🔄 Обновить', `view_stats_${pollId}`)],
        [Markup.button.callback('🔙 Назад к списку', 'show_stats_menu')]
      ];
      await ctx.editMessageText(message, { parse_mode: 'HTML', reply_markup: { inline_keyboard: keyboard } }).catch(e => {});
    } catch (error) {
      console.error("Error in showDetailedStats:", error);
      await ctx.answerCbQuery('Ошибка при загрузке статистики', true);
    }
  }

  async showManagementList(ctx) {
    try {
      const polls = await pollService.getAllPolls();
      let message = 'Выберите опрос/викторину для управления:';
      const keyboard = [];

      if (polls.length === 0) {
        message = 'Нет доступных опросов.';
      } else {
        polls.forEach(poll => {
          const icon = poll.type === 'quiz' ? '📝' : '📊';
          const status = poll.isActive ? '🟢' : '🔴';
          const text = `${status} ${icon} ${poll.question.substring(0, 30)}...`;
          keyboard.push([Markup.button.callback(text, `manage_poll_${poll.id}`)]);
        });
      }
      keyboard.push([Markup.button.callback('🔄 Обновить', 'manage_polls_list')]);
      keyboard.push([Markup.button.callback('🔙 Назад', 'back_to_admin')]);

      await ctx.editMessageText(message, Markup.inlineKeyboard(keyboard)).catch(e => {});
    } catch (error) {
      console.error("Error in showManagementList:", error);
    }
  }

  async showSinglePollMenu(ctx, pollId) {
    try {
        const poll = await pollService.getPoll(pollId);
        if (!poll) {
            await ctx.answerCbQuery('Опрос не найден. Возможно, он был удален.', true);
            return this.showManagementList(ctx);
        }

        const message = `Управление:\n<b>${poll.question}</b>`;
        const keyboard = [];

        if (poll.isActive) {
            keyboard.push(
                [Markup.button.callback('🔴 Остановить', `stop_poll_${poll.id}`)],
                [Markup.button.callback('✏️ Изменить', `edit_poll_prompt_${poll.id}`)],
                [Markup.button.callback('🗑️ Удалить', `delete_poll_prompt_${poll.id}`)]
            );
        } else {
            keyboard.push([Markup.button.callback('🗑️ Удалить из БД', `delete_poll_prompt_${poll.id}`)]);
            message += '\n\n<i>Опрос уже остановлен. Вы можете только удалить его из базы.</i>'
        }
        
        keyboard.push([Markup.button.callback('🔙 К списку', 'manage_polls_list')]);

        await ctx.editMessageText(message, {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: keyboard }
        });
    } catch (error) {
        console.error('Error in showSinglePollMenu:', error);
    }
  }

  async showBlacklistMenu(ctx) {
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('➕ Добавить пользователя', 'add_to_blacklist_prompt')],
        [Markup.button.callback('📋 Показать список', 'show_blacklist_users')],
        [Markup.button.callback('🔙 Назад', 'back_to_admin')]
    ]);
    await ctx.editMessageText('Управление черным списком:', keyboard).catch(()=>{});
  }

  async showBlacklistedUsers(ctx) {
    const blacklist = await adminService.getBlacklist();
    let message = 'Заблокированные пользователи:\n\n';
    const keyboard = [];

    if (blacklist.length === 0) {
        message = 'Черный список пуст.';
    } else {
        blacklist.forEach(user => {
            message += `ID: <code>${user.telegramId}</code>\nПричина: ${user.reason || 'не указана'}\n\n`;
            keyboard.push([Markup.button.callback(
                `🔓 Разбанить (${user.telegramId})`, `remove_from_blacklist_${user.telegramId}`
            )]);
        });
    }

    keyboard.push([Markup.button.callback('🔄 Обновить', 'show_blacklist_users')]);
    keyboard.push([Markup.button.callback('🔙 Назад', 'manage_blacklist')]);

    await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: keyboard }
    }).catch(()=>{});
  }

  setupMiddlewares() {    
    this.bot.use(async (ctx, next) => {
      if (!ctx.from || !ctx.from.id) {
        return next(); 
      };

      const userId = ctx.from.id;
      const now = Date.now();
      const lastRequestTime = this.userRequestTimestamps.get(userId);

      if (lastRequestTime) {
        const timeDiff = now - lastRequestTime;
        if (timeDiff < 2000) {
          console.log(`Request from user ${userId} blocked due to spam.`);
          return;
        }
      }

      this.userRequestTimestamps.set(userId, now);
      return next();
    });

    this.bot.use(async (ctx, next) => {
      if (ctx.from) {
        ctx.state.user = await userController.registerUser(ctx.from.id, ctx.from.username, ctx.from.first_name, ctx.from.last_name);
      }
      return next();
    });
  
    this.bot.on('poll_answer', async (ctx) => {
      const { poll_id, user, option_ids } = ctx.pollAnswer;
      const optionIndex = option_ids[0]; 

      const blacklistedUser = await adminService.checkBlacklist(user.id);
      if (blacklistedUser) {
        console.log(`Blocked vote from blacklisted user ${user.id}.`);
        return;
      }
      if (optionIndex !== undefined) {
        await pollService.recordUserVote(poll_id, user.id, optionIndex);
    }
    });
  }

  setupCommands() {
    this.bot.command('start', (ctx) => ctx.reply('Привет! Отправь /polls для просмотра активных опросов и викторин.'));
    
    this.bot.command('admin', async (ctx) => {
      if (this.authorizedAdmins.has(ctx.from.id)) {
          return this.showMainMenu(ctx);
      }
      this.adminLoginState.set(ctx.from.id, true);
      await ctx.reply('🔑 Пожалуйста, введите пароль для доступа к админ-панели:');
  });

    this.bot.command('polls', async (ctx) => {
      try {
        const activePolls = (await pollService.getAllPolls()).filter(p => p.isActive);

        if (activePolls.length === 0) {
          return ctx.reply('На данный момент активных опросов нет.');
        }

        await ctx.reply(`Доступно для голосования: ${activePolls.length} опросов/викторин.`);

        for (const poll of activePolls) {
          if (poll.chatId && poll.messageId) {
            
            const userVote = await pollService.checkUserVote(poll.id, ctx.from.id);
            if (userVote) {
              await ctx.reply(`Вы уже отвечали на опрос "${poll.question}". Вот он:`);
            }
            
            await ctx.telegram.forwardMessage(ctx.chat.id, poll.chatId, poll.messageId);

          } else {
            console.warn(`Poll ${poll.id} has no messageId. Sending as new.`);
            const options = Object.values(poll.options).map(o => o.text);
            const pollConfig = { is_anonymous: true };
            if (poll.type === 'quiz') {
                pollConfig.type = 'quiz';
                pollConfig.correct_option_id = poll.correctOption;
            } else {
                pollConfig.type = 'regular';
            }
            await ctx.telegram.sendPoll(ctx.chat.id, poll.question, options, pollConfig);
          }
        }

      } catch (error) {
          console.error("Error in /polls command:", error);
          await ctx.reply('Произошла ошибка при загрузке опросов.');
      }
    });
  }

  async showMainMenu(ctx) {
    const message = 'Админ-панель:';
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('Создать анонимный опрос', 'create_anonymous_poll'), Markup.button.callback('Создать викторину', 'create_quiz')],
      [Markup.button.callback('Управление опросами', 'manage_polls_list')],
      [Markup.button.callback('Показать статистику', 'show_stats_menu'), 
      Markup.button.callback('🚫 Черный список', 'manage_blacklist')]
    ]);
    if (ctx.callbackQuery) {
        await ctx.editMessageText(message, keyboard).catch(()=>{});
    } else {
        await ctx.reply(message, keyboard);
    }
  }

setupActions() {
    this.bot.on('poll', async (ctx) => {
      try {
        const receivedPoll = ctx.poll;
        const pollId = receivedPoll.id.toString();
        
        const dbPoll = await pollService.getPoll(pollId);
        if (!dbPoll) return;

        const votes = receivedPoll.options.map(opt => opt.voter_count || 0);
        const isClosed = receivedPoll.is_closed;

        await pollService.updatePollStats(pollId, votes, isClosed);
        console.log(`Stats for poll ${pollId} updated. Votes: [${votes.join(', ')}], Is Closed: ${isClosed}`);
        
        if (isClosed && dbPoll.isActive) {
          await this.bot.telegram.sendMessage(config.userId, `📊 Опрос "${receivedPoll.question.substring(0, 50)}..." был остановлен. Финальная статистика сохранена.`);
        }
      } catch (error) {
        console.error('Error processing poll update:', error);
      }
    });

    // Навигация
    this.bot.action('back_to_admin', this.isAdmin.bind(this), (ctx) => { 
      this.showMainMenu(ctx); 
      ctx.answerCbQuery(); 
    });
    this.bot.action('manage_polls_list', this.isAdmin.bind(this), async (ctx) => { 
        await this.showManagementList(ctx); 
        await ctx.answerCbQuery(); 
    });

    
    // Управление
    this.bot.action(/^manage_poll_(.+)$/, this.isAdmin.bind(this), async (ctx) => {
      await this.showSinglePollMenu(ctx, ctx.match[1]);
      await ctx.answerCbQuery();
    });

    this.bot.action(/^stop_poll_(.+)$/, this.isAdmin.bind(this), async (ctx) => {
      const pollId = ctx.match[1];
      try {
          const poll = await pollService.getPoll(pollId);
          if (!poll) return ctx.answerCbQuery('Опрос не найден в БД.', true);
          if (!poll.isActive) return ctx.answerCbQuery('ℹ️ Опрос уже не активен.', true);
          if (!poll.chatId || !poll.messageId) return ctx.answerCbQuery('❌ Невозможно остановить: старый опрос без данных о чате.', true);

          await ctx.telegram.stopPoll(poll.chatId, poll.messageId); 
          await ctx.answerCbQuery('✅ Команда на остановку отправлена!', true);
          await this.showSinglePollMenu(ctx, pollId); 
      } catch (error) {
          let userMessage = '❌ Ошибка при остановке.';
          if (error.description && error.description.includes('poll has already been closed')) {
              userMessage = 'ℹ️ Опрос уже был остановлен.';
              await pollService.updatePollStats(pollId, [], true); 
          } else {
              console.error("Error stopping poll:", error);
          }
          await ctx.answerCbQuery(userMessage, true);
          await this.showSinglePollMenu(ctx, pollId);
      }
    });

    this.bot.action(/^delete_poll_prompt_(.+)$/, async (ctx) => {
      const pollId = ctx.match[1];
      const keyboard = Markup.inlineKeyboard([
          Markup.button.callback('‼️ Да, удалить', `delete_poll_confirm_${pollId}`),
          Markup.button.callback('Отмена', `manage_poll_${pollId}`)
      ]);
      await ctx.editMessageText('Вы уверены, что хотите удалить этот опрос?\nСообщение в канале и вся статистика будут удалены безвозвратно.', keyboard);
      await ctx.answerCbQuery();
    });

    this.bot.action(/^delete_poll_confirm_(.+)$/, async (ctx) => {
    const pollId = ctx.match[1];
    try {
        const poll = await pollService.getPoll(pollId);
        if (!poll) return ctx.answerCbQuery('Опрос уже удален.', true);

        if (poll.chatId && poll.messageId) {
            await ctx.telegram.deleteMessage(poll.chatId, poll.messageId).catch(err => {
                console.warn(`Could not delete message for poll ${pollId}: ${err.message}`);
            });
        }

        await pollService.deletePoll(pollId);
        
        await ctx.answerCbQuery('✅ Опрос успешно удален!', true);
        await this.showManagementList(ctx); 

    } catch (error) {
        console.error('Error in delete_poll_confirm:', error);
        await ctx.answerCbQuery('❌ Произошла ошибка при удалении.', true);
    }
    });

    this.bot.action(/^edit_poll_prompt_(.+)$/, async (ctx) => {
    const pollId = ctx.match[1];
    const poll = await pollService.getPoll(pollId);
    if (!poll) return ctx.answerCbQuery('Опрос не найден.', true);

    let pollDataString = poll.question;
    const options = Object.values(poll.options).map(opt => opt.text);
    pollDataString += '|' + options.join('|');
    if (poll.type === 'quiz') {
        pollDataString += '|' + poll.correctOption;
    }

    this.pollEditingState.set(ctx.from.id, pollId);

    await ctx.reply(`Редактирование опроса. Отправьте исправленную версию:\n\n<code>${pollDataString}</code>`, { parse_mode: 'HTML' });
    await ctx.answerCbQuery('Приготовьтесь к редактированию');
    });

    // Статистика
    this.bot.action('show_stats_menu', async (ctx) => { await this.showStatsMenu(ctx); await ctx.answerCbQuery(); });
    this.bot.action(/^view_stats_(.+)$/, async (ctx) => {
        await this.showDetailedStats(ctx, ctx.match[1]);
        await ctx.answerCbQuery();
    });

    // Создание
    this.bot.action('create_quiz', async (ctx) => {
      this.pollTypeState.set(ctx.from.id, 'quiz');
      this.pollCreationState.set(ctx.from.id, true);
      await ctx.editMessageText('Отправьте вопрос, варианты ответов и индекс правильного ответа (начиная с 0) через "|"\n\n*Пример:*\n`Столица Беларуси?|Минск|Брест|Гомель|0`', { parse_mode: 'Markdown' });
      await ctx.answerCbQuery();
    });

    this.bot.action('create_anonymous_poll', async (ctx) => {
      this.pollTypeState.set(ctx.from.id, 'anonymous');
      this.pollCreationState.set(ctx.from.id, true);
      await ctx.editMessageText('Отправьте вопрос и варианты ответов через "|"\n\n*Пример:*\n`Лучший город?|Минск|Брест|Гродно`', { parse_mode: 'Markdown' });
      await ctx.answerCbQuery();
    });

    this.bot.action('manage_blacklist', async (ctx) => {
      await this.showBlacklistMenu(ctx);
      await ctx.answerCbQuery();
    });
  
    this.bot.action('show_blacklist_users', async (ctx) => {
        await this.showBlacklistedUsers(ctx);
        await ctx.answerCbQuery();
    });
  
    this.bot.action('add_to_blacklist_prompt', async (ctx) => {
        this.blacklistState.set(ctx.from.id, true);
        await ctx.editMessageText('Отправьте ID пользователя и причину бана через "|".\n\n*Пример:*\n`123456789|Спам`', { parse_mode: 'Markdown' });
        await ctx.answerCbQuery();
    });

    this.bot.action(/^remove_from_blacklist_(.+)$/, async (ctx) => {
        const telegramId = ctx.match[1];
        try {
            await adminService.removeFromBlacklist(telegramId);
            await ctx.answerCbQuery(`✅ Пользователь ${telegramId} удален из черного списка!`, true);
            await this.showBlacklistedUsers(ctx); 
        } catch (error) {
            console.error('Error removing from blacklist:', error);
            await ctx.answerCbQuery('❌ Ошибка при удалении.', true);
        }
    });

    this.bot.on('text', async (ctx) => {
      const userId  = ctx.from.id;
      
       // СЦЕНАРИЙ -1: ВВОД ПАРОЛЯ
    if (this.adminLoginState.has(userId)) {
      this.adminLoginState.delete(userId);
      const enteredPassword = ctx.message.text;

      // Стираем сообщение с паролем для безопасности
      ctx.deleteMessage().catch(() => {});

      if (enteredPassword === config.adminPassword) {
          this.authorizedAdmins.add(userId);
          await ctx.reply('✅ Пароль верный! Доступ разрешен.');
          await this.showMainMenu(ctx);
      } else {
          await ctx.reply('❌ Неверный пароль. Доступ запрещен.');
      }
      return;
    }

    if (!this.authorizedAdmins.has(userId)) {
      return;
    }
      // СЦЕНАРИЙ 0: ДОБАВЛЕНИЕ В ЧЕРНЫЙ СПИСОК
      if (this.blacklistState.has(userId)) {
        this.blacklistState.delete(userId);
        try {
            const [telegramId, ...reasonParts] = ctx.message.text.split('|');
            const reason = reasonParts.join('|').trim();
            if (!telegramId || !/^\d+$/.test(telegramId)) {
                throw new Error('Некорректный ID пользователя. Укажите только цифры.');
            }
            if (!reason) {
                throw new Error('Необходимо указать причину блокировки.');
            }
            
            await adminService.addToBlacklist(telegramId.trim(), reason);
            await ctx.reply(`✅ Пользователь <code>${telegramId.trim()}</code> добавлен в черный список.`, { parse_mode: 'HTML' });
            
            const keyboard = Markup.inlineKeyboard([[Markup.button.callback('Вернуться в меню ЧС', 'manage_blacklist')]]);
            await ctx.reply('Что дальше?', keyboard);

        } catch (error) {
            await ctx.reply(`❌ Ошибка: ${error.message}`);
        }
        return;
      }

      // СЦЕНАРИЙ 1: РЕДАКТИРОВАНИЕ СУЩЕСТВУЮЩЕГО ОПРОСА
      if (this.pollEditingState.has(userId)) {
        const pollIdToEdit = this.pollEditingState.get(userId);
        this.pollEditingState.delete(userId);

    try {
        const oldPoll = await pollService.getPoll(pollIdToEdit);
        if (!oldPoll) throw new Error('Исходный опрос для редактирования не найден.');

        const { question, options, pollConfig, pollType } = this.parsePollData(ctx.message.text, oldPoll.type);

        await ctx.telegram.deleteMessage(oldPoll.chatId, oldPoll.messageId).catch(err => console.warn(`Could not delete old poll message: ${err.message}`));
        
        await pollService.deletePoll(oldPoll.id);

        const sentMessage = await ctx.telegram.sendPoll(oldPoll.chatId, question, options, pollConfig);
        
        await pollService.createPoll(
            sentMessage.poll.id, question, options, pollType,
            pollConfig.correct_option_id, sentMessage.chat.id, sentMessage.message_id
        );
        await ctx.reply('✅ Опрос успешно изменен!');
        } catch (error) {
            console.error('Poll editing error:', error);
            await ctx.reply(`❌ Ошибка при изменении: ${error.message}`);
        }
        return;
      }

      // --- СЦЕНАРИЙ 2: СОЗДАНИЕ НОВОГО ОПРОСА ---
    if (this.pollCreationState.has(userId)) {
      const pollType = this.pollTypeState.get(userId);
      this.pollCreationState.delete(userId);
      this.pollTypeState.delete(userId);

      try {
          const { question, options, pollConfig } = this.parsePollData(ctx.message.text, pollType);

          const sentMessage = await ctx.telegram.sendPoll(ctx.chat.id, question, options, pollConfig);

          await pollService.createPoll(
              sentMessage.poll.id, question, options, pollType,
              pollConfig.correct_option_id, sentMessage.chat.id, sentMessage.message_id
          );
          await ctx.reply(`✅ ${pollType === 'quiz' ? 'Викторина' : 'Опрос'} успешно создан!`);
          } catch (error) {
              console.error('Poll creation error:', error);
              await ctx.reply(`❌ Ошибка при создании: ${error.message}`);
          }
    }
  });
  }

  parsePollData(text, pollType) {
    const parts = text.split('|').map(s => s.trim());
    const question = parts[0];
    let options, pollConfig = { is_anonymous: true };

    if (pollType === 'anonymous') {
      options = parts.slice(1);
      if (!question || options.length < 2) throw new Error('Нужен вопрос и минимум 2 варианта ответа.');
      pollConfig.type = 'regular';
    } else if (pollType === 'quiz') {
      if (parts.length < 4) throw new Error('Нужен вопрос, минимум 2 варианта и индекс правильного ответа.');
      const correctOptionId = parseInt(parts[parts.length - 1], 10);
      options = parts.slice(1, -1);
      if (isNaN(correctOptionId) || correctOptionId < 0 || correctOptionId >= options.length) {
        throw new Error(`Неверный индекс правильного ответа: от 0 до ${options.length - 1}.`);
      }
      pollConfig.type = 'quiz';
      pollConfig.correct_option_id = correctOptionId;
      pollConfig.is_anonymous = true;
    } else {
        throw new Error('Неизвестный тип опроса для парсинга.');
    }
    return { question, options, pollConfig, pollType };
  }

  start() {
    this.bot.launch().then(() => {
        console.log('Bot started successfully');
        this.bot.telegram.sendMessage(config.userId, 'Бот перезапущен. /admin');
    });
  }

  stop() {
    this.bot.stop('SIGINT');
  }
}

const botServiceInstance = new BotService();
export default botServiceInstance;