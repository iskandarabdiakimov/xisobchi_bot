const { sendMessageSafe, isAdmin } = require("./utils");
const {
  groups,
  saveGroups,
  groupSettings,
  getGroupSettings,
  saveGroupSettings,
} = require("./data");

module.exports = function (bot) {
 
  bot.on("message", async (msg) => {
    try {
      const botUser = await bot.getMe();

      if (msg.new_chat_members?.some((member) => member.id === botUser.id)) {
        const adder = msg.from;
        const group = msg.chat;

        await sendMessageSafe(
          bot,
          group.id,
          `👋 Salom! Men "${group.title}" guruhiga qo'shildim.\n` +
            `Iltimos, meni ADMIN qiling!`
        );

        try {
          await sendMessageSafe(
            bot,
            adder.id,
            `🤖 Siz meni "${group.title}" guruhiga qo'shdingiz!\n\n` +
              `Agar meni ADMIN qilsangiz, quyidagi funksiyalarni bajaraman:\n` +
              `- Yangi a'zolar sonini hisoblab berish\n` +
              `- Spamni oldini olish\n\n` +
              `/help - Yordam olish`
          );
        } catch (e) {
          console.error(`Couldn't message user ${adder.id}`);
        }
      }

      if (
        msg.new_chat_member?.id === botUser.id &&
        msg.new_chat_member.status === "administrator"
      ) {
        const admin = msg.from;
        const group = msg.chat;

        await sendMessageSafe(
          bot,
          group.id,
          `✅ Bot admin qilindi!\n` +
            `Endi men bu guruhda to'liq ishlashga tayyorman!`
        );

        try {
          await sendMessageSafe(
            bot,
            admin.id,
            `🎉 Siz meni "${group.title}" guruhida ADMIN qildingiz!\n\n` +
              `Endi men quyidagi ishlarni bajaraman:\n` +
              `- Yangi a'zolar sonini hisoblayman\n` +
              `- Cheklovlarni qo'llayman\n\n` +
              `/settings - Sozlamalarni o'zgartirish`
          );
        } catch (e) {
          console.error(`Couldn't message admin ${admin.id}`);
        }
      }
    } catch (e) {
      console.error("Error in message handler:", e.message);
    }
  });


  bot.on("new_chat_members", async (msg) => {
    const chatId = msg.chat.id;
    const adderId = msg.from.id;

    if (await isAdmin(bot, chatId, adderId)) return;

    if (!groups[chatId]) groups[chatId] = { users: {} };
    if (!groups[chatId].users[adderId]) groups[chatId].users[adderId] = 0;

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


  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (
      msg.chat.type === "private" ||
      msg.from.is_bot ||
      (await isAdmin(bot, chatId, userId)) ||
      getGroupSettings(chatId).exemptUsers.includes(userId)
    ) {
      return;
    }

    const settings = getGroupSettings(chatId);
    if (
      !groups[chatId]?.users[userId] ||
      groups[chatId].users[userId] < settings.minMembers
    ) {
      await bot
        .deleteMessage(chatId, msg.message_id)
        .catch((e) => console.error("Error deleting message:", e.message));

      const addedCount = groups[chatId]?.users[userId] || 0;
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
          `/hisob - Hisobingizni ko'rish`
      );

      if (settings.textTime > 0 && warningMsg) {
        setTimeout(() => {
          bot.deleteMessage(chatId, warningMsg.message_id).catch(() => {});
        }, settings.textTime * 1000);
      }
    }
  });
};
