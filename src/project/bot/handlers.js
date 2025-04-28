const { sendMessageSafe, isAdmin } = require("./utils");
const {
  groups,
  saveGroups,
  groupSettings,
  getGroupSettings,
  saveGroupSettings,
} = require("./data");

module.exports = function (bot) {
  // Foydalanuvchi ma'lumotlarini boshqarish uchun yordamchi funksiya
  function ensureUser(chatId, userId) {
    if (!groups[chatId]) groups[chatId] = { users: {} };
    if (!groups[chatId].users[userId]) {
      groups[chatId].users[userId] = 0;
      saveGroups();
    }
    return groups[chatId].users[userId];
  }

  // Yangi a'zolar qo'shilganda hisobga olish
  bot.on("new_chat_members", async (msg) => {
    const chatId = msg.chat.id;
    const adderId = msg.from.id;

    if (await isAdmin(bot, chatId, adderId)) return;

    ensureUser(chatId, adderId);
    const realMembers = msg.new_chat_members.filter((m) => !m.is_bot);
    groups[chatId].users[adderId] += realMembers.length;
    saveGroups();

    const userTotal = groups[chatId].users[adderId];
    if (userTotal >= 3) {
      await sendMessageSafe(
        bot,
        chatId,
        `🎉 @${
          msg.from.username || msg.from.first_name
        }, endi xabar yoza olasiz!\nJami: ${userTotal} ta`
      );
    }
  });

  // Inline keyboard tugmalarini boshqarish uchun callback_query ishlovchisi
  bot.on("callback_query", async (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;

    // Tugma bosilganini tasdiqlash
    await bot.answerCallbackQuery(callbackQuery.id);

    // Agar "❌" (bekor qilish) tugmasi bosilsa, xabarni o‘chirish
    if (data === "cancel") {
      await bot
        .deleteMessage(chatId, msg.message_id)
        .catch((e) =>
          console.error(
            `Error deleting panel message in chat ${chatId}:`,
            e.message
          )
        );
      return;
    }

    // Raqam tugmasi bosilgan bo‘lsa
    const newMinMembers = parseInt(data);

    // Guruh sozlamalarini yangilash
    const settings = getGroupSettings(chatId);
    settings.minMembers = newMinMembers;
    saveGroupSettings();

    // Guruh nomini olish
    const groupName = msg.chat.title || "Bu guruh";

    // Xabar yuborish
    if (newMinMembers === 0) {
      await sendMessageSafe(
        bot,
        chatId,
        `${groupName} guruhida majburiy odam qo'shish to'xtatildi!`
      );
    } else {
      await sendMessageSafe(
        bot,
        chatId,
        `${groupName} guruhida yozish uchun minimal ${newMinMembers} ta a'zo qo'shish sharti belgilandi!`
      );
    }

    // Panel xabarini o‘chirish
    await bot
      .deleteMessage(chatId, msg.message_id)
      .catch((e) =>
        console.error(
          `Error deleting panel message in chat ${chatId}:`,
          e.message
        )
      );
  });

  // Xabarlar va /add buyrug'ini boshqarish
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // /add buyrug‘ini tekshirish
    if (msg.text && msg.text.startsWith("/add")) {
      if (!(await isAdmin(bot, chatId, userId))) {
        await sendMessageSafe(
          bot,
          chatId,
          `⚠️ Faqat adminlar /add buyrug‘idan foydalana oladi!`
        );
        return;
      }

      const args = msg.text.split(" ")[1]?.toLowerCase(); // Argumentni olish va kichik harfga aylantirish
      let newMinMembers;

      // /add off holati
      if (args === "off") {
        newMinMembers = 0;
      } else if (/^\d+$/.test(args)) {
        // Agar argument raqam bo‘lsa
        newMinMembers = parseInt(args);

        // Validatsiya: Salfiy qiymatlar
        if (newMinMembers < 0) {
          await sendMessageSafe(
            bot,
            chatId,
            `⚠️ Noto‘g‘ri qiymat! /add <raqam> yoki /add off formatida yozing, masalan: /add 3 yoki /add off`
          );
          return;
        }

        // Validatsiya: O‘nlik sonlarni rad etish
        if (args && parseFloat(args) !== newMinMembers) {
          await sendMessageSafe(
            bot,
            chatId,
            `⚠️ Faqat butun sonlar qabul qilinadi! Masalan: /add 3`
          );
          return;
        }
      } else {
        // Agar argument noto‘g‘ri bo‘lsa (raqam yoki "off" emas), panel chiqarish
        const keyboard = {
          inline_keyboard: [
            [
              { text: "0🗑", callback_data: "0" },
              { text: "5", callback_data: "5" },
              { text: "10", callback_data: "10" },
              { text: "15", callback_data: "15" },
              { text: "20", callback_data: "20" },
            ],
            [
              { text: "40", callback_data: "40" },
              { text: "60", callback_data: "60" },
              { text: "80", callback_data: "80" },
              { text: "100", callback_data: "100" },
              { text: "❌", callback_data: "cancel" },
            ],
          ],
        };

        await sendMessageSafe(
          bot,
          chatId,
          `Guruhda odam qo‘shishni qancha qilib belgilaysiz?`,
          { reply_markup: keyboard }
        );
        return;
      }

      // Guruh sozlamalarini yangilash
      const settings = getGroupSettings(chatId);
      settings.minMembers = newMinMembers;
      saveGroupSettings();

      // Guruh nomini olish
      const groupName = msg.chat.title || "Bu guruh";

      // Xabar yuborish
      if (newMinMembers === 0) {
        await sendMessageSafe(
          bot,
          chatId,
          `${groupName} guruhida majburiy odam qo'shish to'xtatildi!`
        );
      } else {
        await sendMessageSafe(
          bot,
          chatId,
          `${groupName} guruhida yozish uchun minimal ${newMinMembers} ta a'zo qo'shish sharti belgilandi!`
        );
      }
      return;
    }

    // Maxsus holatlarni tekshirish
    if (
      msg.chat.type === "private" ||
      msg.from.is_bot ||
      (await isAdmin(bot, chatId, userId)) ||
      getGroupSettings(chatId).exemptUsers.includes(userId)
    ) {
      return;
    }

    // Guruh sozlamalari va foydalanuvchi ma'lumotlarini olish
    const settings = getGroupSettings(chatId);
    if (settings.minMembers === 0) return; // Agar minMembers 0 bo‘lsa, cheklov yo‘q

    ensureUser(chatId, userId);

    // Agar foydalanuvchi yetarlicha a'zo qo‘shmagan bo‘lsa
    if (groups[chatId].users[userId] < settings.minMembers) {
      await bot.deleteMessage(chatId, msg.message_id).catch((e) => {
        console.error(
          `Error deleting message in chat ${chatId} for user ${userId}:`,
          e.message
        );
        sendMessageSafe(
          bot,
          chatId,
          `⚠️ Xabar o‘chirishda xato yuz berdi. Admin bilan bog‘laning.`
        );
      });

      const addedCount = groups[chatId].users[userId];
      const needed = settings.minMembers - addedCount;

      const warningMsg = await sendMessageSafe(
        bot,
        chatId,
        `⚠️ @${
          msg.from.username || msg.from.first_name
        }, sizga xabar yozish taqiqlangan!\n\n` +
          `Sababi: Kamida ${settings.minMembers} ta a'zo qo'shishingiz kerak\n` +
          `Siz hali ${addedCount} ta (Yana ${needed} ta kerak)\n\n` +
          (settings.customText ? `${settings.customText}\n\n` : "") +
          `Yangi a'zo qo'shish uchun do'stlaringizni guruhga taklif qiling!\n` +
          `/hisob - Hisobingizni ko'rish`
      );

      if (settings.textTime > 0 && warningMsg) {
        setTimeout(() => {
          bot
            .deleteMessage(chatId, warningMsg.message_id)
            .catch((e) =>
              console.error(
                `Error deleting warning message in chat ${chatId}:`,
                e.message
              )
            );
        }, settings.textTime * 1000);
      }
    }
  });
};
