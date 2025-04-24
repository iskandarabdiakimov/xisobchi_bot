require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

// Token .env fayldan olinadi
const token = process.env.TELEGRAM_TOKEN;
if (!token) {
  console.error("TELEGRAM_TOKEN .env faylda aniqlanmagan!");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// Ma'lumotlarni JSON faylda saqlash
let groups = loadGroups();
let groupSettings = loadGroupSettings();

function saveGroups() {
  fs.writeFileSync("groups.json", JSON.stringify(groups, null, 2));
}

function loadGroups() {
  if (fs.existsSync("groups.json")) {
    return JSON.parse(fs.readFileSync("groups.json"));
  }
  return {};
}

function saveGroupSettings() {
  fs.writeFileSync(
    "groupSettings.json",
    JSON.stringify(groupSettings, null, 2)
  );
}

function loadGroupSettings() {
  if (fs.existsSync("groupSettings.json")) {
    return JSON.parse(fs.readFileSync("groupSettings.json"));
  }
  return {};
}

function getGroupSettings(chatId) {
  if (!groupSettings[chatId]) {
    groupSettings[chatId] = {
      minMembers: 3,
      forceAdd: true,
      customText: "",
      textTime: 30,
      exemptUsers: [],
      linkedChannels: [],
    };
    saveGroupSettings();
  }
  return groupSettings[chatId];
}

// Xabar yuborish uchun yagona funksiya
async function sendMessageSafe(chatId, text, options = {}) {
  try {
    await bot.sendMessage(chatId, text, { parse_mode: "HTML", ...options });
  } catch (e) {
    console.error(`Xabar yuborishda xato (chatId: ${chatId}):`, e.message);
  }
}

// Foydalanuvchi ID sini tekshirish
async function isValidUser(userId) {
  try {
    await bot.getChat(userId);
    return true;
  } catch (e) {
    return false;
  }
}

// Admin tekshiruvi
async function isAdmin(chatId, userId) {
  try {
    const admins = await bot.getChatAdministrators(chatId);
    return admins.some((admin) => admin.user.id === userId);
  } catch (e) {
    console.error("Adminlarni olishda xato:", e.message);
    return false;
  }
}

// /start buyrug'i
bot.onText(/\/start/, async (msg) => {
  if (msg.chat.type !== "private") return;

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

  await sendMessageSafe(
    msg.chat.id,
    `👋 Assalomu alaykum, ${msg.from.first_name}!\n` +
      `Men "Xisoblovchi" botiman. Guruhlarda qo‘shilgan a‘zolar sonini hisoblayman.\n\n` +
      `Meni guruhga qo‘shing va admin qiling!`,
    options
  );
});

// Bot guruhga qo‘shilganda
bot.on("message", async (msg) => {
  try {
    const botUser = await bot.getMe();

    if (msg.new_chat_members?.some((member) => member.id === botUser.id)) {
      const adder = msg.from;
      const group = msg.chat;

      await sendMessageSafe(
        group.id,
        `👋 Salom! Men "${group.title}" guruhiga qo'shildim.\n` +
          `Iltimos, meni ADMIN qiling!`
      );

      try {
        await sendMessageSafe(
          adder.id,
          `🤖 Siz meni "${group.title}" guruhiga qo'shdingiz!\n\n` +
            `Agar meni ADMIN qilsangiz, quyidagi funksiyalarni bajaraman:\n` +
            `- Yangi a'zolar sonini hisoblab berish\n` +
            `- Spamni oldini olish\n\n` +
            `/help - Yordam olish`
        );
      } catch (e) {
        console.error(
          `Foydalanuvchi ${adder.id} shaxsiy chatga xabar yuborib bo'lmadi`
        );
      }
    }

    if (
      msg.new_chat_member?.id === botUser.id &&
      msg.new_chat_member.status === "administrator"
    ) {
      const admin = msg.from;
      const group = msg.chat;

      await sendMessageSafe(
        group.id,
        `✅ Bot admin qilindi!\n` +
          `Endi men bu guruhda to'liq ishlashga tayyorman!`
      );

      try {
        await sendMessageSafe(
          admin.id,
          `🎉 Siz meni "${group.title}" guruhida ADMIN qildingiz!\n\n` +
            `Endi men quyidagi ishlarni bajaraman:\n` +
            `- Yangi a'zolar sonini hisoblayman\n` +
            `- Cheklovlarni qo'llayman\n\n` +
            `/settings - Sozlamalarni o'zgartirish`
        );
      } catch (e) {
        console.error(
          `Admin ${admin.id} shaxsiy chatga xabar yuborib bo'lmadi`
        );
      }
    }
  } catch (e) {
    console.error("Xatolik:", e.message);
  }
});

// Buyruqlar menyusini sozlash
async function setupCommands() {
  try {
    await bot.setMyCommands([
      { command: "start", description: "Botni ishga tushirish" },
      { command: "mymembers", description: "O'z hisobingiz" },
      { command: "yourmembers", description: "Boshqa foydalanuvchi hisobi" },
      { command: "plus", description: "Ballarni boshqaga o'tkazish" },
      { command: "hisob", description: "Hisob va holat" },
      { command: "help", description: "Yordam menyusi" },
    ]);

    console.log("Command menyusi muvaffaqiyatli sozlandi!");
  } catch (e) {
    console.error("Command menyusini sozlashda xato:", e.message);
  }
}

setupCommands();

// /help buyrug'i
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  const isAdminUser =
    msg.chat.type === "private" ? false : await isAdmin(chatId, msg.from.id);

  const helpText = `
<b>🤖 Xisoblovchi bot buyruqlar menyusi</b>

👤 <b>Foydalanuvchilar uchun buyruqlar:</b>
/start - Botni ishga tushirish
/mymembers - O'z hisobingiz
/yourmembers - Boshqa foydalanuvchi hisobi (reply bilan)
/plus [son] - Ballarni boshqaga o'tkazish
/hisob - Hisob va holat
/help - Yordam menyusi

${
  isAdminUser
    ? `
👑 <b>Adminlar uchun buyruqlar:</b>
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
`
    : ""
}`;

  const botInfo = await bot.getMe();
  await sendMessageSafe(chatId, helpText, {
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
  });
});

// Admin buyruqlar menyusini guruhda sozlash
bot.on("message", async (msg) => {
  if (msg.chat.type === "group" || msg.chat.type === "supergroup") {
    if (await isAdmin(msg.chat.id, msg.from.id)) {
      try {
        await bot.setMyCommands(
          [
            { command: "add", description: "Min qo'shish soni" },
            { command: "top", description: "Top 10" },
            { command: "clean", description: "Ballarni tozalash" },
            { command: "priv", description: "Foydalanuvchini chetlatish" },
          ],
          {
            scope: {
              type: "chat_administrators",
              chat_id: msg.chat.id,
            },
          }
        );
      } catch (e) {
        console.error("Admin commands setup error:", e);
      }
    }
  }
});

// Foydalanuvchi buyruqlari
bot.onText(/\/mymembers/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!groups[chatId]?.users[userId]) {
    return sendMessageSafe(chatId, `Siz hali hech kim qo'shmagansiz!`, {
      reply_to_message_id: msg.message_id,
    });
  }

  await sendMessageSafe(
    chatId,
    `📊 Siz ${groups[chatId].users[userId]} ta a'zo qo'shgansiz!`,
    { reply_to_message_id: msg.message_id }
  );
});

bot.onText(/\/yourmembers/, async (msg) => {
  if (!msg.reply_to_message) {
    return sendMessageSafe(
      msg.chat.id,
      "⚠️ Iltimos, kimdagi hisobni ko'rmoqchi bo'lsangiz, uning xabariga reply qilib yozing!",
      { reply_to_message_id: msg.message_id }
    );
  }

  const targetUserId = msg.reply_to_message.from.id;
  const targetUsername =
    msg.reply_to_message.from.username || msg.reply_to_message.from.first_name;
  const chatId = msg.chat.id;

  if (!groups[chatId]?.users[targetUserId]) {
    return sendMessageSafe(
      chatId,
      `@${targetUsername} hali hech kim qo'shmagan!`,
      { reply_to_message_id: msg.message_id }
    );
  }

  await sendMessageSafe(
    chatId,
    `📊 @${targetUsername} ${groups[chatId].users[targetUserId]} ta a'zo qo'shgan!`,
    { reply_to_message_id: msg.message_id }
  );
});

bot.onText(/\/plus (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const fromUserId = msg.from.id;
  const amount = parseInt(match[1]);

  if (!msg.reply_to_message) {
    return sendMessageSafe(
      chatId,
      "⚠️ Iltimos, ballarni kimga o'tkazmoqchi bo'lsangiz, uning xabariga reply qilib yozing!",
      { reply_to_message_id: msg.message_id }
    );
  }

  const toUserId = msg.reply_to_message.from.id;
  await transferPoints(chatId, fromUserId, toUserId, amount, msg);
});

async function transferPoints(
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
    chatId,
    `✅ @${fromUser} ${amount} ballni @${toUser} ga o'tkazdi!\n\n` +
      `Yangi hisob:\n` +
      `@${fromUser}: ${groups[chatId].users[fromUserId]} ball\n` +
      `@${toUser}: ${groups[chatId].users[toUserId]} ball`,
    { reply_to_message_id: originalMsg.message_id }
  );
}

// Yangi a'zolar qo'shilganda
bot.on("new_chat_members", async (msg) => {
  const chatId = msg.chat.id;
  const adderId = msg.from.id;

  if (await isAdmin(chatId, adderId)) return;

  if (!groups[chatId]) groups[chatId] = { users: {} };
  if (!groups[chatId].users[adderId]) groups[chatId].users[adderId] = 0;

  const realMembers = msg.new_chat_members.filter((m) => !m.is_bot);
  groups[chatId].users[adderId] += realMembers.length;
  saveGroups();

  const userTotal = groups[chatId].users[adderId];
  if (userTotal >= 3) {
    await sendMessageSafe(
      chatId,
      `🎉 @${
        msg.from.username || msg.from.first_name
      }, endi xabar yoza olasiz!\nJami: ${userTotal} ta`
    );
  }
});

// Admin buyruqlari
bot.onText(/\/add (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!(await isAdmin(chatId, msg.from.id))) {
    return sendMessageSafe(chatId, "⚠️ Bu buyruq faqat adminlar uchun!", {
      reply_to_message_id: msg.message_id,
    });
  }

  const min = parseInt(match[1]);
  const settings = getGroupSettings(chatId);
  settings.minMembers = min;
  saveGroupSettings();

  await sendMessageSafe(
    chatId,
    `✅ Guruhda yozish uchun minimal ${min} ta a'zo qo'shish sharti belgilandi!`,
    { reply_to_message_id: msg.message_id }
  );
});

bot.onText(/\/add off/, async (msg) => {
  const chatId = msg.chat.id;
  if (!(await isAdmin(chatId, msg.from.id))) {
    return sendMessageSafe(chatId, "⚠️ Bu buyruq faqat adminlar uchun!", {
      reply_to_message_id: msg.message_id,
    });
  }

  const settings = getGroupSettings(chatId);
  settings.forceAdd = false;
  saveGroupSettings();

  await sendMessageSafe(
    chatId,
    "❌ Majburiy a'zo qo'shish tizimi o'chirildi!",
    { reply_to_message_id: msg.message_id }
  );
});

bot.onText(/\/top/, async (msg) => {
  const chatId = msg.chat.id;
  if (!(await isAdmin(chatId, msg.from.id))) {
    return sendMessageSafe(chatId, "⚠️ Bu buyruq faqat adminlar uchun!", {
      reply_to_message_id: msg.message_id,
    });
  }

  if (!groups[chatId]) {
    return sendMessageSafe(chatId, "⚠️ Hozircha hech qanday ma'lumot yo'q!", {
      reply_to_message_id: msg.message_id,
    });
  }

  const topUsers = Object.entries(groups[chatId].users)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  let text = "🏆 Top 10 foydalanuvchi:\n\n";
  for (let i = 0; i < topUsers.length; i++) {
    const [userId, count] = topUsers[i];
    const user = await bot
      .getChat(userId)
      .catch(() => ({ username: userId, first_name: "Noma'lum" }));
    const username = user.username ? `@${user.username}` : user.first_name;
    text += `${i + 1}. ${username} - ${count} ta\n`;
  }

  await sendMessageSafe(chatId, text, { reply_to_message_id: msg.message_id });
});

bot.onText(/\/delson/, async (msg) => {
  const chatId = msg.chat.id;
  if (!(await isAdmin(chatId, msg.from.id))) {
    return sendMessageSafe(chatId, "⚠️ Bu buyruq faqat adminlar uchun!", {
      reply_to_message_id: msg.message_id,
    });
  }

  if (groups[chatId]) {
    groups[chatId].users = {};
    saveGroups();
  }

  await sendMessageSafe(
    chatId,
    "🔄 Barcha foydalanuvchilarning ballari nolga tushirildi!",
    { reply_to_message_id: msg.message_id }
  );
});

bot.onText(/\/clean(?:\s+(\d+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!(await isAdmin(chatId, msg.from.id))) {
    return sendMessageSafe(chatId, "⚠️ Bu buyruq faqat adminlar uchun!", {
      reply_to_message_id: msg.message_id,
    });
  }

  let userId;
  if (msg.reply_to_message) {
    userId = msg.reply_to_message.from.id;
  } else if (match[1]) {
    userId = parseInt(match[1]);
    if (!(await isValidUser(userId))) {
      return sendMessageSafe(
        chatId,
        "⚠️ Noto‘g‘ri yoki mavjud bo‘lmagan foydalanuvchi ID si!",
        { reply_to_message_id: msg.message_id }
      );
    }
  } else {
    return sendMessageSafe(
      chatId,
      "⚠️ Foydalanuvchiga reply qiling yoki ID kiriting (masalan, /clean 123456789)!",
      { reply_to_message_id: msg.message_id }
    );
  }

  if (groups[chatId]?.users[userId]) {
    delete groups[chatId].users[userId];
    saveGroups();
    await sendMessageSafe(
      chatId,
      `🧹 Foydalanuvchi (ID: ${userId}) ballari tozalandi!`,
      { reply_to_message_id: msg.message_id }
    );
  } else {
    await sendMessageSafe(
      chatId,
      `⚠️ Ushbu foydalanuvchi hali hech qanday ball to‘plamagan!`,
      { reply_to_message_id: msg.message_id }
    );
  }
});

bot.onText(/\/priv(?:\s+(\d+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!(await isAdmin(chatId, msg.from.id))) {
    return sendMessageSafe(chatId, "⚠️ Bu buyruq faqat adminlar uchun!", {
      reply_to_message_id: msg.message_id,
    });
  }

  let userId;
  if (msg.reply_to_message) {
    userId = msg.reply_to_message.from.id;
  } else if (match[1]) {
    userId = parseInt(match[1]);
    if (!(await isValidUser(userId))) {
      return sendMessageSafe(
        chatId,
        "⚠️ Noto‘g‘ri yoki mavjud bo‘lmagan foydalanuvchi ID si!",
        { reply_to_message_id: msg.message_id }
      );
    }
  } else {
    return sendMessageSafe(
      chatId,
      "⚠️ Foydalanuvchiga reply qiling yoki ID kiriting (masalan, /priv 123456789)!",
      { reply_to_message_id: msg.message_id }
    );
  }

  const settings = getGroupSettings(chatId);
  settings.exemptUsers.push(userId);
  saveGroupSettings();

  await sendMessageSafe(
    chatId,
    `🛡️ Foydalanuvchi (ID: ${userId}) majburiy qo'shishdan ozod qilindi!`,
    { reply_to_message_id: msg.message_id }
  );
});

bot.onText(/\/textforce (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!(await isAdmin(chatId, msg.from.id))) {
    return sendMessageSafe(chatId, "⚠️ Bu buyruq faqat adminlar uchun!", {
      reply_to_message_id: msg.message_id,
    });
  }

  const settings = getGroupSettings(chatId);
  settings.customText = match[1];
  saveGroupSettings();

  await sendMessageSafe(
    chatId,
    `📝 Majburiy qo'shish matni yangilandi:\n\n${match[1]}`,
    { reply_to_message_id: msg.message_id }
  );
});

bot.onText(/\/text_time (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!(await isAdmin(chatId, msg.from.id))) {
    return sendMessageSafe(chatId, "⚠️ Bu buyruq faqat adminlar uchun!", {
      reply_to_message_id: msg.message_id,
    });
  }

  const seconds = parseInt(match[1]);
  const settings = getGroupSettings(chatId);
  settings.textTime = seconds;
  saveGroupSettings();

  await sendMessageSafe(
    chatId,
    `⏳ Xabar o'chirilish vaqti ${seconds} sekundga sozlandi!`,
    { reply_to_message_id: msg.message_id }
  );
});

bot.onText(/\/deforce/, async (msg) => {
  const chatId = msg.chat.id;
  if (!(await isAdmin(chatId, msg.from.id))) {
    return sendMessageSafe(chatId, "⚠️ Bu buyruq faqat adminlar uchun!", {
      reply_to_message_id: msg.message_id,
    });
  }

  const settings = getGroupSettings(chatId);
  settings.exemptUsers = [];
  saveGroupSettings();

  await sendMessageSafe(
    chatId,
    "🧹 Majburiy qo'shish ma'lumotlari tozalandi!",
    { reply_to_message_id: msg.message_id }
  );
});

bot.onText(/\/set(?:\s+(-100\d+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!(await isAdmin(chatId, msg.from.id))) {
    return sendMessageSafe(chatId, "⚠️ Bu buyruq faqat adminlar uchun!", {
      reply_to_message_id: msg.message_id,
    });
  }

  const channelId =
    match[1] || msg.reply_to_message?.text.match(/-100\d+/)?.[0];
  if (!channelId) {
    return sendMessageSafe(
      chatId,
      "⚠️ Iltimos, kanal ID sini kiriting yoki kanal postiga reply qiling!",
      { reply_to_message_id: msg.message_id }
    );
  }

  const settings = getGroupSettings(chatId);
  settings.linkedChannels.push(channelId);
  saveGroupSettings();

  await sendMessageSafe(
    chatId,
    `🔗 Kanal ${channelId} majburiy a'zolik ro'yxatiga qo'shildi!`,
    { reply_to_message_id: msg.message_id }
  );
});

bot.onText(/\/unlink/, async (msg) => {
  const chatId = msg.chat.id;
  if (!(await isAdmin(chatId, msg.from.id))) {
    return sendMessageSafe(chatId, "⚠️ Bu buyruq faqat adminlar uchun!", {
      reply_to_message_id: msg.message_id,
    });
  }

  const settings = getGroupSettings(chatId);
  settings.linkedChannels = [];
  saveGroupSettings();

  await sendMessageSafe(chatId, "🔓 Barcha bog'langan kanallar o'chirildi!", {
    reply_to_message_id: msg.message_id,
  });
});

// Xabar cheklovlari
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (
    msg.chat.type === "private" ||
    msg.from.is_bot ||
    (await isAdmin(chatId, userId)) ||
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
      .catch((e) => console.error("Xabar o'chirishda xato:", e));

    const addedCount = groups[chatId]?.users[userId] || 0;
    const needed = settings.minMembers - addedCount;

    await sendMessageSafe(
      chatId,
      `⚠️ @${
        msg.from.username || msg.from.first_name
      }, sizga xabar yozish taqiqlangan!\n\n` +
        `Sababi: Kamida ${settings.minMembers} ta a'zo qo'shishingiz kerak\n` +
        `Siz hali ${addedCount} ta (Yana ${needed} ta kerak)\n\n` +
        (settings.customText ? `${settings.customText}\n\n` : "") +
        `/hisob - Hisobingizni ko'rish`
    );

    if (settings.textTime > 0) {
      setTimeout(() => {
        bot.deleteMessage(chatId, msg.message_id + 1).catch(() => {});
      }, settings.textTime * 1000);
    }
  }
});

// /hisob buyrug'i
bot.onText(/\/hisob/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  const isUserAdmin = await isAdmin(chatId, userId);
  const addedCount = groups[chatId]?.users[userId] || 0;
  const settings = getGroupSettings(chatId);

  let status = isUserAdmin
    ? "👑 Siz admin ekansiz - cheklovlar sizga taalluqli emas"
    : settings.exemptUsers.includes(userId)
    ? "🛡️ Siz cheklovlardan ozod qilingansiz"
    : addedCount >= settings.minMembers
    ? "✅ Xabar yozish mumkin'siz"
    : "❌ Xabar yozish taqiqlangan";

  await sendMessageSafe(
    chatId,
    `📊 <b>Sizning hisobingiz:</b>\n\n` +
      `${isUserAdmin ? "" : `👥 Qo'shgan a'zolar: <b>${addedCount} ta</b>\n`}` +
      `${isUserAdmin ? "" : `📌 Talab: <b>${settings.minMembers} ta</b>\n`}` +
      `🔹 Holat: <b>${status}</b>`
  );
});

console.log("🤖 Bot ishga tushdi. Adminlar uchun cheklovsiz versiya.");
