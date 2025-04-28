const { sendMessageSafe, isAdmin, isValidUser } = require("./utils");
const {
  groups,
  saveGroups,
  groupSettings,
  getGroupSettings,
  saveGroupSettings,
} = require("./data");

module.exports = function (bot) {
  const restrictToGroup = (msg) => {
    if (msg.chat.type !== "group" && msg.chat.type !== "supergroup") {
      sendMessageSafe(
        bot,
        msg.chat.id,
        "⚠️ Bu buyruq faqat guruhlarda ishlaydi!",
        { reply_to_message_id: msg.message_id }
      );
      return false;
    }
    return true;
  };

  const checkBotAdmin = async (bot, msg) => {
    if (msg.chat.type !== "group" && msg.chat.type !== "supergroup") {
      return false;
    }
    const chatId = msg.chat.id;
    const botId = (await bot.getMe()).id;
    try {
      const isBotAdmin = await isAdmin(bot, chatId, botId);
      return isBotAdmin;
    } catch (error) {
      console.error(`Bot adminlik tekshiruvida xato: chatId=${chatId}`, error);
      return false;
    }
  };

  bot.on("new_chat_members", async (msg) => {
    const chatId = msg.chat.id;
    const newMembers = msg.new_chat_members;

    for (const member of newMembers) {
      if (member.id === (await bot.getMe()).id) {
        const userId = msg.from.id;
        const messageText = `
👋 Assalomu alaykum, ${msg.from.first_name}!
Men "Xisoblovchi" botiman. Meni guruhga qo'shganingiz uchun rahmat!
Iltimos, meni guruhda admin qiling, shunda to'liq funksiyalarimni ishlatishingiz mumkin.
        `;

        try {
          await sendMessageSafe(bot, userId, messageText, {
            parse_mode: "HTML",
          });
        } catch (error) {
          console.error(
            `Foydalanuvchiga xabar yuborishda xato: userId=${userId}`,
            error
          );
          await sendMessageSafe(
            bot,
            chatId,
            "⚠️ Iltimos, bot bilan shaxsiy chatni boshlang!",
            { parse_mode: "HTML" }
          );
        }
      }
    }
  });

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const botInfo = await bot.getMe();
    const options = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "➕ Guruhga qo'shish",
              url: `https://t.me/${botInfo.username}?startgroup=true`,
            },
          ],
        ],
      },
    };

    if (
      (msg.chat.type === "group" || msg.chat.type === "supergroup") &&
      !(await checkBotAdmin(bot, msg))
    ) {
      return;
    }

    const messageText =
      msg.chat.type === "private"
        ? `👋 Assalomu alaykum, ${msg.from.first_name}!\n` +
          `Men "Xisoblovchi" botiman. Guruhlarda qo'shilgan a'zolar sonini hisoblayman.\n\n` +
          `Meni guruhga qo'shing va admin qiling!`
        : `👋 Assalomu alaykum, ${msg.from.first_name}!\n` +
          `Men "Xisoblovchi" botiman. Guruhlarda qo'shilgan a'zolar sonini hisoblayman.\n\n` +
          `Meni guruhda admin qiling!`;

    await sendMessageSafe(bot, chatId, messageText, options);
  });

  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (
      (msg.chat.type === "group" || msg.chat.type === "supergroup") &&
      !(await checkBotAdmin(bot, msg))
    ) {
      return;
    }

    let isAdminUser = false;
    if (msg.chat.type !== "private") {
      try {
        isAdminUser = await isAdmin(bot, chatId, userId);
      } catch (error) {
        console.error(
          `isAdmin xatosi: chatId=${chatId}, userId=${userId}`,
          error
        );
      }
    }

    const helpText =
      msg.chat.type === "private"
        ? `
<b>🤖 Xisoblovchi bot buyruqlar menyusi</b>

👤 <b>Foydalanuvchilar uchun buyruqlar:</b>
/start - Botni ishga tushirish
/mymembers - O'z hisobingiz
/yourmembers - Boshqa foydalanuvchi hisobi (reply bilan)
/plus [son] - Ballarni boshqaga o'tkazish
/hisob - Hisob va holat
/help - Yordam menyusi

👑 <b>Adminlar uchun buyruqlar (faqat adminlar ishlatishi mumkin):</b>
/add [son] - Minimal qo'shish soni
/top - Top 10 foydalanuvchi
/delson - Barcha ballarni nolga tushirish
/clean [ID] - Foydalanuvchi ballarini tozalash
/priv [ID] - Foydalanuvchini chetlatish
/textforce [matn] - Maxsus ogohlantirish matni
/text_time [sekund] - Xabar vaqtini sozlash
/deforce - Chetlatishlarni tozalash
/set [kanal ID] - Kanalga a'zolikni sozlash
/unlink - Bog'langan kanallarni o'chirish

🔹 <b>Eslatma:</b> Yuqoridagi buyruqlarning aksariyati faqat guruhlarda ishlaydi. Meni guruhga qo'shing va admin qiling!
`
        : `
<b>🤖 Xisoblovchi bot buyruqlar menyusi</b>

👤 <b>Foydalanuvchilar uch tinha buyruqlar:</b>
/start - Botni ishga tushirish
/mymembers - O'z hisobingiz
/yourmembers - Boshqa foydalanuvchi hisobi (reply bilan)
/plus [son] - Ballarni boshqaga o'tkazish
/hisob - Hisob va holat
/help - Yordam menyusi

👑 <b>Adminlar uchun buyruqlar (faqat adminlar ishlatishi mumkin):</b>
/add [son] - Minimal qo'shish soni
/top - Top 10 foydalanuvchi
/delson - Barcha ballarni nolga tushirish
/clean [ID] - Foydalanuvchi ballarini tozalash
/priv [ID] - Foydalanuvchini chetlatish
/textforce [matn] - Maxsus ogohlantirish matni
/text_time [sekund] - Xabar vaqtini sozlash
/deforce - Chetlatishlarni tozalash
/set [kanal ID] - Kanalga a'zolikni sozlash
/unlink - Bog'langan kanallarni o'chirish

🔹 <b>Holat:</b> ${
            isAdminUser
              ? "Siz admin ekansiz, barcha buyruqlar siz uchun ochiq!"
              : "Admin buyruqlari faqat guruh adminlari uchun ishlaydi."
          }
`;

    let botInfo;
    try {
      botInfo = await bot.getMe();
    } catch (error) {
      console.error("Bot info olishda xato:", error);
      botInfo = { username: "" };
    }

    const options = {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "➕ Guruhga qo'shish",
              url: botInfo.username
                ? `https://t.me/${botInfo.username}?startgroup=true`
                : "https://t.me/",
            },
          ],
        ],
      },
    };

    await sendMessageSafe(bot, chatId, helpText, options);
  });

  bot.onText(/\/mymembers/, async (msg) => {
    if (restrictToGroup(msg) && !(await checkBotAdmin(bot, msg))) return;

    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!groups[chatId]?.users[userId]) {
      return sendMessageSafe(bot, chatId, `Siz hali hech kim qo'shmagansiz!`, {
        reply_to_message_id: msg.message_id,
      });
    }

    await sendMessageSafe(
      bot,
      chatId,
      `📊 Siz ${groups[chatId].users[userId]} ta a'zo qo'shgansiz!`,
      { reply_to_message_id: msg.message_id }
    );
  });

  bot.onText(/\/yourmembers/, async (msg) => {
    if (restrictToGroup(msg) && !(await checkBotAdmin(bot, msg))) return;

    if (!msg.reply_to_message) {
      return sendMessageSafe(
        bot,
        msg.chat.id,
        "⚠️ Iltimos, kimdagi hisobni ko'rmoqchi bo'lsangiz, uning xabariga reply qilib yozing!",
        { reply_to_message_id: msg.message_id }
      );
    }

    const targetUserId = msg.reply_to_message.from.id;
    const targetUsername =
      msg.reply_to_message.from.username ||
      msg.reply_to_message.from.first_name;
    const chatId = msg.chat.id;

    if (!groups[chatId]?.users[targetUserId]) {
      return sendMessageSafe(
        bot,
        chatId,
        `@${targetUsername} hali hech kim qo'shmagan!`,
        { reply_to_message_id: msg.message_id }
      );
    }

    await sendMessageSafe(
      bot,
      chatId,
      `📊 @${targetUsername} ${groups[chatId].users[targetUserId]} ta a'zo qo'shgan!`,
      { reply_to_message_id: msg.message_id }
    );
  });

  bot.onText(/\/plus (\d+)/, async (msg, match) => {
    if (restrictToGroup(msg) && !(await checkBotAdmin(bot, msg))) return;

    const chatId = msg.chat.id;
    const fromUserId = msg.from.id;
    const amount = parseInt(match[1]);

    if (!msg.reply_to_message) {
      return sendMessageSafe(
        bot,
        chatId,
        "⚠️ Iltimos, ballarni kimga o'tkazmoqchi bo'lsangiz, uning xabariga reply qilib yozing!",
        { reply_to_message_id: msg.message_id }
      );
    }

    const toUserId = msg.reply_to_message.from.id;
    await transferPoints(bot, chatId, fromUserId, toUserId, amount, msg);
  });

  bot.onText(/\/hisob/, async (msg) => {
    if (restrictToGroup(msg) && !(await checkBotAdmin(bot, msg))) return;

    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const isUserAdmin = await isAdmin(bot, chatId, userId);
    const addedCount = groups[chatId]?.users[userId] || 0;
    const settings = getGroupSettings(chatId);

    let status = isUserAdmin
      ? "👑 Siz admin ekansiz - cheklovlar sizga taalluqli emas"
      : settings.exemptUsers.includes(userId)
      ? "🛡️ Siz cheklovlardan ozod qilingansiz"
      : addedCount >= settings.minMembers
      ? "✅ Xabar yozish mumkin"
      : "❌ Xabar yozish taqiqlangan";

    await sendMessageSafe(
      bot,
      chatId,
      `📊 <b>Sizning hisobingiz:</b>\n\n` +
        `${
          isUserAdmin ? "" : `👥 Qo'shgan a'zolar: <b>${addedCount} ta</b>\n`
        }` +
        `${isUserAdmin ? "" : `📌 Talab: <b>${settings.minMembers} ta</b>\n`}` +
        `🔹 Holat: <b>${status}</b>`,
      { parse_mode: "HTML", reply_to_message_id: msg.message_id }
    );
  });

  bot.onText(/\/add (\d+)/, async (msg, match) => {
    if (restrictToGroup(msg) && !(await checkBotAdmin(bot, msg))) return;

    const chatId = msg.chat.id;
    if (!(await isAdmin(bot, chatId, msg.from.id))) {
      return sendMessageSafe(
        bot,
        chatId,
        "⚠️ Bu buyruq faqat adminlar uchun!",
        {
          reply_to_message_id: msg.message_id,
        }
      );
    }

    const min = parseInt(match[1]);
    const settings = getGroupSettings(chatId);
    settings.minMembers = min;
    saveGroupSettings();
  });

  bot.onText(/\/top/, async (msg) => {
    if (restrictToGroup(msg) && !(await checkBotAdmin(bot, msg))) return;

    const chatId = msg.chat.id;
    if (!(await isAdmin(bot, chatId, msg.from.id))) {
      return sendMessageSafe(
        bot,
        chatId,
        "⚠️ Bu buyruq faqat adminlar uchun!",
        {
          reply_to_message_id: msg.message_id,
        }
      );
    }

    if (!groups[chatId]) {
      return sendMessageSafe(
        bot,
        chatId,
        "⚠️ Hozircha hech qanday ma'lumot yo'q!",
        {
          reply_to_message_id: msg.message_id,
        }
      );
    }

    const topUsers = Object.entries(groups[chatId].users)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    let text = "🏆 Top 10 foydalanuvchi:\n\n";
    for (let i = 0; i < topUsers.length; i++) {
      const [userId, count] = topUsers[i];
      try {
        const user = await bot.getChat(userId);
        const username = user.username ? `@${user.username}` : user.first_name;
        text += `${i + 1}. ${username} - ${count} ta\n`;
      } catch (error) {
        console.error(
          `Foydalanuvchi ma'lumotini olishda xato: ${userId}`,
          error
        );
        text += `${i + 1}. ID:${userId} - ${count} ta\n`;
      }
    }

    await sendMessageSafe(bot, chatId, text, {
      reply_to_message_id: msg.message_id,
    });
  });

  bot.onText(/\/delson/, async (msg) => {
    if (restrictToGroup(msg) && !(await checkBotAdmin(bot, msg))) return;

    const chatId = msg.chat.id;
    if (!(await isAdmin(bot, chatId, msg.from.id))) {
      return sendMessageSafe(
        bot,
        chatId,
        "⚠️ Bu buyruq faqat adminlar uchun!",
        {
          reply_to_message_id: msg.message_id,
        }
      );
    }

    if (!groups[chatId]) {
      return sendMessageSafe(bot, chatId, "⚠️ Guruhda hech qanday ball yo'q!", {
        reply_to_message_id: msg.message_id,
      });
    }

    groups[chatId].users = {};
    saveGroups();

    await sendMessageSafe(bot, chatId, "✅ Barcha ballar nolga tushirildi!", {
      reply_to_message_id: msg.message_id,
    });
  });

  bot.onText(/\/clean (\d+)/, async (msg, match) => {
    if (restrictToGroup(msg) && !(await checkBotAdmin(bot, msg))) return;

    const chatId = msg.chat.id;
    const userId = parseInt(match[1]);

    if (!(await isAdmin(bot, chatId, msg.from.id))) {
      return sendMessageSafe(
        bot,
        chatId,
        "⚠️ Bu buyruq faqat adminlar uchun!",
        {
          reply_to_message_id: msg.message_id,
        }
      );
    }

    if (!groups[chatId]?.users[userId]) {
      return sendMessageSafe(
        bot,
        chatId,
        `⚠️ Foydalanuvchi (ID: ${userId}) hali hech qanday ball to'plamagan!`,
        { reply_to_message_id: msg.message_id }
      );
    }

    delete groups[chatId].users[userId];
    saveGroups();

    await sendMessageSafe(
      bot,
      chatId,
      `✅ Foydalanuvchi (ID: ${userId}) ballari tozalandi!`,
      { reply_to_message_id: msg.message_id }
    );
  });

  bot.onText(/\/priv (\d+)/, async (msg, match) => {
    if (restrictToGroup(msg) && !(await checkBotAdmin(bot, msg))) return;

    const chatId = msg.chat.id;
    const userId = parseInt(match[1]);

    if (!(await isAdmin(bot, chatId, msg.from.id))) {
      return sendMessageSafe(
        bot,
        chatId,
        "⚠️ Bu buyruq faqat adminlar uchun!",
        {
          reply_to_message_id: msg.message_id,
        }
      );
    }

    try {
      await bot.kickChatMember(chatId, userId);
      await sendMessageSafe(
        bot,
        chatId,
        `✅ Foydalanuvchi (ID: ${userId}) guruhdan chetlatildi!`,
        { reply_to_message_id: msg.message_id }
      );
    } catch (error) {
      console.error(`Chetlatishda xato: userId=${userId}`, error);
      await sendMessageSafe(
        bot,
        chatId,
        `⚠️ Foydalanuvchi (ID: ${userId}) ni chetlatishda xato yuz berdi!`,
        { reply_to_message_id: msg.message_id }
      );
    }
  });

  bot.onText(/\/textforce (.+)/, async (msg, match) => {
    if (restrictToGroup(msg) && !(await checkBotAdmin(bot, msg))) return;

    const chatId = msg.chat.id;
    const text = match[1];

    if (!(await isAdmin(bot, chatId, msg.from.id))) {
      return sendMessageSafe(
        bot,
        chatId,
        "⚠️ Bu buyruq faqat adminlar uchun!",
        {
          reply_to_message_id: msg.message_id,
        }
      );
    }

    await sendMessageSafe(bot, chatId, `📢 ${text}`, {
      parse_mode: "HTML",
      reply_to_message_id: msg.message_id,
    });
  });

  bot.onText(/\/text_time (\d+)/, async (msg, match) => {
    if (restrictToGroup(msg) && !(await checkBotAdmin(bot, msg))) return;

    const chatId = msg.chat.id;
    const seconds = parseInt(match[1]);

    if (!(await isAdmin(bot, chatId, msg.from.id))) {
      return sendMessageSafe(
        bot,
        chatId,
        "⚠️ Bu buyruq faqat adminlar uchun!",
        {
          reply_to_message_id: msg.message_id,
        }
      );
    }

    const settings = getGroupSettings(chatId);
    settings.textTime = seconds;
    saveGroupSettings();

    await sendMessageSafe(
      bot,
      chatId,
      `✅ Xabarlar ${seconds} sekunddan keyin o'chiriladi!`,
      { reply_to_message_id: msg.message_id }
    );
  });

  bot.onText(/\/deforce/, async (msg) => {
    if (restrictToGroup(msg) && !(await checkBotAdmin(bot, msg))) return;

    const chatId = msg.chat.id;
    if (!(await isAdmin(bot, chatId, msg.from.id))) {
      return sendMessageSafe(
        bot,
        chatId,
        "⚠️ Bu buyruq faqat adminlar uchun!",
        {
          reply_to_message_id: msg.message_id,
        }
      );
    }

    try {
      const bannedMembers = await bot.getChatAdministrators(chatId);
      await sendMessageSafe(
        bot,
        chatId,
        "✅ Barcha chetlatishlar bekor qilinmoqda (agar API ruxsat bersa)!",
        { reply_to_message_id: msg.message_id }
      );
    } catch (error) {
      console.error(`Chetlatishlarni tozalashda xato: chatId=${chatId}`, error);
      await sendMessageSafe(
        bot,
        chatId,
        "⚠️ Chetlatishlarni tozalashda xato yuz berdi!",
        { reply_to_message_id: msg.message_id }
      );
    }
  });

  bot.onText(/\/set (.+)/, async (msg, match) => {
    if (restrictToGroup(msg) && !(await checkBotAdmin(bot, msg))) return;

    const chatId = msg.chat.id;
    const channelId = match[1];

    if (!(await isAdmin(bot, chatId, msg.from.id))) {
      return sendMessageSafe(
        bot,
        chatId,
        "⚠️ Bu buyruq faqat adminlar uchun!",
        {
          reply_to_message_id: msg.message_id,
        }
      );
    }

    const settings = getGroupSettings(chatId);
    settings.requiredChannel = channelId;
    saveGroupSettings();

    await sendMessageSafe(
      bot,
      chatId,
      `✅ Guruhga kirish uchun ${channelId} kanaliga a'zolik talab qilinadi!`,
      { reply_to_message_id: msg.message_id }
    );
  });

  bot.onText(/\/unlink/, async (msg) => {
    if (restrictToGroup(msg) && !(await checkBotAdmin(bot, msg))) return;

    const chatId = msg.chat.id;
    if (!(await isAdmin(bot, chatId, msg.from.id))) {
      return sendMessageSafe(
        bot,
        chatId,
        "⚠️ Bu buyruq faqat adminlar uchun!",
        {
          reply_to_message_id: msg.message_id,
        }
      );
    }

    const settings = getGroupSettings(chatId);
    if (!settings.requiredChannel) {
      return sendMessageSafe(bot, chatId, "⚠️ Hozirda bog'langan kanal yo'q!", {
        reply_to_message_id: msg.message_id,
      });
    }

    settings.requiredChannel = null;
    saveGroupSettings();

    await sendMessageSafe(bot, chatId, "✅ Bog'langan kanallar o'chirildi!", {
      reply_to_message_id: msg.message_id,
    });
  });

  bot.onText(/\/plus (\d+)/, async (msg, match) => {
    if (restrictToGroup(msg) && !(await checkBotAdmin(bot, msg))) return;

    const chatId = msg.chat.id;
    const fromUserId = msg.from.id;
    const amount = parseInt(match[1]);

    if (!msg.reply_to_message) {
      return sendMessageSafe(
        bot,
        chatId,
        "⚠️ Iltimos, ballarni kimga o'tkazmoqchi bo'lsangiz, uning xabariga reply qilib yozing!",
        { reply_to_message_id: msg.message_id }
      );
    }

    const toUserId = msg.reply_to_message.from.id;
    await transferPoints(bot, chatId, fromUserId, toUserId, amount, msg);
  });

  async function transferPoints(
    bot,
    chatId,
    fromUserId,
    toUserId,
    amount,
    originalMsg
  ) {
    if (!groups[chatId]) groups[chatId] = { users: {} };
    if (
      !groups[chatId].users[fromUserId] ||
      groups[chatId].users[fromUserId] < amount
    ) {
      return sendMessageSafe(
        bot,
        chatId,
        `⚠️ Sizda yetarli ball yo'q! (Sizda: ${
          groups[chatId]?.users[fromUserId] || 0
        } ta)`,
        { reply_to_message_id: originalMsg.message_id }
      );
    }

    groups[chatId].users[fromUserId] -= amount;
    groups[chatId].users[toUserId] =
      (groups[chatId].users[toUserId] || 0) + amount;
    saveGroups();

    const fromUser = originalMsg.from.username || originalMsg.from.first_name;
    const toUser =
      originalMsg.reply_to_message.from.username ||
      originalMsg.reply_to_message.from.first_name;

    await sendMessageSafe(
      bot,
      chatId,
      `✅ @${fromUser} ${amount} ballni @${toUser} ga o'tkazdi!\n\n` +
        `Yangi hisob:\n` +
        `@${fromUser}: ${groups[chatId].users[fromUserId]} ball\n` +
        `@${toUser}: ${groups[chatId].users[toUserId]} ball`,
      { reply_to_message_id: originalMsg.message_id }
    );
  }

  async function transferPoints(
    bot,
    chatId,
    fromUserId,
    toUserId,
    amount,
    originalMsg
  ) {
    if (!groups[chatId]) groups[chatId] = { users: {} };
    if (
      !groups[chatId].users[fromUserId] ||
      groups[chatId].users[fromUserId] < amount
    ) {
      return sendMessageSafe(
        bot,
        chatId,
        `⚠️ Sizda yetarli ball yo'q! (Sizda: ${
          groups[chatId]?.users[fromUserId] || 0
        } ta)`,
        { reply_to_message_id: originalMsg.message_id }
      );
    }

    groups[chatId].users[fromUserId] -= amount;
    groups[chatId].users[toUserId] =
      (groups[chatId].users[toUserId] || 0) + amount;
    saveGroups();

    const fromUser = originalMsg.from.username || originalMsg.from.first_name;
    const toUser =
      originalMsg.reply_to_message.from.username ||
      originalMsg.reply_to_message.from.first_name;

    await sendMessageSafe(
      bot,
      chatId,
      `✅ @${fromUser} ${amount} ballni @${toUser} ga o'tkazdi!\n\n` +
        `Yangi hisob:\n` +
        `@${fromUser}: ${groups[chatId].users[fromUserId]} ball\n` +
        `@${toUser}: ${groups[chatId].users[toUserId]} ball`,
      { reply_to_message_id: originalMsg.message_id }
    );
  }
};
