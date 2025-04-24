
async function sendMessageSafe(bot, chatId, text, options = {}) {
  try {
    await bot.sendMessage(chatId, text, { parse_mode: "HTML", ...options });
  } catch (e) {
    console.error(`Error sending message (chatId: ${chatId}):`, e.message);
  }
}


async function isValidUser(bot, userId) {
  try {
    await bot.getChat(userId);
    return true;
  } catch (e) {
    return false;
  }
}


async function isAdmin(bot, chatId, userId) {
  try {
    const admins = await bot.getChatAdministrators(chatId);
    return admins.some((admin) => admin.user.id === userId);
  } catch (e) {
    console.error("Error getting admins:", e.message);
    return false;
  }
}

async function setupCommands(bot) {
  try {
    await bot.setMyCommands([
      // Regular user commands
      { command: "start", description: "Botni ishga tushirish" },
      { command: "mymembers", description: "O'z hisobingiz" },
      {
        command: "yourmembers",
        description: "Boshqa foydalanuvchi hisobi (reply bilan)",
      },
      { command: "plus", description: "Ballarni boshqaga o'tkazish [son]" },
      { command: "hisob", description: "Hisob va holat" },
      { command: "help", description: "Yordam menyusi" },

      
      { command: "add", description: "Minimal qo'shish soni [admin]" },
      { command: "top", description: "Top 10 foydalanuvchi [admin]" },
      {
        command: "delson",
        description: "Barcha ballarni nolga tushirish [admin]",
      },
      {
        command: "clean",
        description: "Foydalanuvchi ballarini tozalash [admin]",
      },
      { command: "priv", description: "Foydalanuvchini chetlatish [admin]" },
      {
        command: "textforce",
        description: "Maxsus ogohlantirish matni [admin]",
      },
      { command: "text_time", description: "Xabar vaqtini sozlash [admin]" },
      { command: "deforce", description: "Chetlatishlarni tozalash [admin]" },
      { command: "set", description: "Kanalga a'zolikni sozlash [admin]" },
      {
        command: "unlink",
        description: "Bog'langan kanallarni o'chirish [admin]",
      },
    ]);

    console.log("Command menu set up successfully!");
  } catch (e) {
    console.error("Error setting up commands:", e.message);
  }
}
module.exports = {
  sendMessageSafe,
  isValidUser,
  isAdmin,
  setupCommands,
};
