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
      { command: "help", description: "Yordam menyusi" },
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
