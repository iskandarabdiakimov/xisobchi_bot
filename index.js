// require("dotenv").config();
// const { Telegraf, Markup, Scenes, session } = require("telegraf");
// const { MongoClient } = require("mongodb");

// // MongoDB ulanish
// const mongoClient = new MongoClient(process.env.MONGODB_URI);
// let db;

// // Botni ishga tushirish
// const bot = new Telegraf(process.env.BOT_TOKE);
// const token = "7917118515:AAG_ZbN1QmO8GFyJ_XXRiRLggdQTXnv7E8Q";

// // Database model funksiyalari
// async function connectDB() {
//   await mongoClient.connect();
//   db = mongoClient.db("xisoblovchi_bot");
//   console.log("MongoDB ga ulandi");
// }

// // Guruh sozlamalari modeli
// const groupSettings = {
//   chatId: { type: Number, required: true },
//   minMembers: { type: Number, default: 0 },
//   textForce: { type: String, default: "" },
//   textTime: { type: Number, default: 60 },
//   linkedChannels: { type: Array, default: [] },
//   createdAt: { type: Date, default: Date.now },
// };

// // Foydalanuvchi modeli
// const userModel = {
//   userId: { type: Number, required: true },
//   chatId: { type: Number, required: true },
//   addedMembers: { type: Number, default: 0 },
//   isPrivileged: { type: Boolean, default: false },
//   lastActive: { type: Date, default: Date.now },
// };

// // Bot ishga tushganda
// bot.start(async (ctx) => {
//   if (ctx.chat.type === "private") {
//     await ctx.reply(
//       `👋 Assalomu alaykum, ${ctx.from.first_name}!\n` +
//         `Men "Xisoblovchi" botiman. Guruhlarda qo'shilgan a'zolar sonini hisoblab beraman.\n\n` +
//         `Meni guruhga qo'shing va admin qiling!`,
//       Markup.inlineKeyboard([
//         Markup.button.url(
//           "➕ Guruhga qo'shish",
//           `https://t.me/${ctx.botInfo.username}?startgroup=true`
//         ),
//       ])
//     );
//   }
// });

// // Yordam menyusi
// bot.help(async (ctx) => {
//   const isGroup = ctx.chat.type !== "private";
//   let helpText = "📖 Bot yordam menyusi:\n\n";

//   if (isGroup) {
//     helpText +=
//       "👥 Barcha foydalanuvchilar uchun:\n" +
//       "/mymembers - Siz qo'shgan a'zolar soni\n" +
//       "/yourmembers - Boshqa a'zo statistikasi (reply bilan)\n" +
//       "/plus - Ballaringizni boshqaga o'tkazish\n\n" +
//       "👑 Adminlar uchun:\n" +
//       "/add - Minimal qo'shish sonini sozlash\n" +
//       "/top - Top 10 foydalanuvchi\n" +
//       "/delson - Barcha ballarni nolga tushirish\n" +
//       "/clean - A'zo ballarini tozalash\n" +
//       "/priv - Cheklovdan ozod qilish\n" +
//       "/textforce - Xabar matnini o'zgartirish\n" +
//       "/text_time - Xabar vaqtini sozlash\n" +
//       "/set - Kanalga ulash\n" +
//       "/unlink - Kanallarni olib tashlash";
//   } else {
//     helpText +=
//       "Shaxsiy chatda faqat quyidagi komandalar mavjud:\n" +
//       "/start - Botni ishga tushirish\n" +
//       "/help - Yordam menyusi";
//   }

//   await ctx.reply(helpText);
// });

// // Guruhga qo'shilganda
// bot.on("new_chat_members", async (ctx) => {
//   if (
//     ctx.message.new_chat_members.some((member) => member.id === ctx.botInfo.id)
//   ) {
//     // Bot o'zi guruhga qo'shilganda
//     const admins = await ctx.getChatAdministrators();
//     const isAdmin = admins.some((admin) => admin.user.id === ctx.botInfo.id);

//     if (isAdmin) {
//       await ctx.reply(
//         "✅ BOT GURUHGA ADMIN QILINDI\n\n" +
//           "Men bu guruhda ishlashga tayyorman!\n" +
//           "Guruh sozlamalarini /add buyrug'i orqali sozlashingiz mumkin."
//       );
//     } else {
//       await ctx.reply(
//         "⚠️ Iltimos, meni admin qiling!\n\n" +
//           "Aks holda men to'liq ishlay olmayman."
//       );
//     }
//   } else {
//     // Boshqa a'zolar qo'shilganda
//     const adderId = ctx.message.from.id;
//     const chatId = ctx.chat.id;

//     // Adminlar qo'shgan a'zolarni hisoblamaymiz
//     const admins = await ctx.getChatAdministrators();
//     const isAdderAdmin = admins.some((admin) => admin.user.id === adderId);

//     if (!isAdderAdmin) {
//       const realMembers = ctx.message.new_chat_members.filter(
//         (m) => !m.is_bot
//       ).length;

//       // Ma'lumotlar bazasiga yozamiz
//       await db
//         .collection("users")
//         .updateOne(
//           { userId: adderId, chatId: chatId },
//           { $inc: { addedMembers: realMembers } },
//           { upsert: true }
//         );

//       // Guruh sozlamalarini o'qiymiz
//       const group = await db.collection("groups").findOne({ chatId: chatId });
//       const minMembers = group?.minMembers || 0;

//       // Foydalanuvchi statistikasini o'qiymiz
//       const user = await db
//         .collection("users")
//         .findOne({ userId: adderId, chatId: chatId });
//       const totalAdded = user?.addedMembers || 0;

//       if (minMembers > 0 && totalAdded >= minMembers) {
//         await ctx.reply(
//           `🎉 @${ctx.message.from.username}, endi xabar yoza olasiz!\n` +
//             `Jami qo'shgan a'zolar: ${totalAdded} ta`,
//           { reply_to_message_id: ctx.message.message_id }
//         );
//       }
//     }
//   }
// });

// // Xabar yozishni tekshirish
// bot.on("message", async (ctx) => {
//   if (ctx.chat.type === "private") return;
//   if (ctx.from.is_bot) return;

//   // Adminlarni tekshirish
//   const admins = await ctx.getChatAdministrators();
//   const isAdmin = admins.some((admin) => admin.user.id === ctx.from.id);
//   if (isAdmin) return;

//   // Guruh sozlamalarini o'qiymiz
//   const group = await db.collection("groups").findOne({ chatId: ctx.chat.id });
//   const minMembers = group?.minMembers || 0;

//   if (minMembers > 0) {
//     // Foydalanuvchi statistikasini o'qiymiz
//     const user = await db.collection("users").findOne({
//       userId: ctx.from.id,
//       chatId: ctx.chat.id,
//     });

//     const addedMembers = user?.addedMembers || 0;
//     const isPrivileged = user?.isPrivileged || false;

//     if (addedMembers < minMembers && !isPrivileged) {
//       try {
//         await ctx.deleteMessage();

//         const remaining = minMembers - addedMembers;
//         const textForce = group.textForce || "";
//         const textTime = group.textTime || 60;

//         const reply = await ctx.reply(
//           `⚠️ @${ctx.from.username}, sizga xabar yozish taqiqlangan!\n\n` +
//             `Sababi: Kamida ${minMembers} ta a'zo qo'shishingiz kerak\n` +
//             `Siz hali ${addedMembers} ta (Yana ${remaining} ta kerak)\n\n` +
//             `${textForce}\n` +
//             `/mymembers - Hisobingizni ko'rish`,
//           { parse_mode: "HTML" }
//         );

//         // Xabarni vaqt o'tgach o'chirish
//         if (textTime > 0) {
//           setTimeout(async () => {
//             try {
//               await ctx.telegram.deleteMessage(ctx.chat.id, reply.message_id);
//             } catch (e) {
//               console.log("Xabarni o'chirishda xato:", e.message);
//             }
//           }, textTime * 1000);
//         }
//       } catch (e) {
//         console.log("Xabarni o'chirishda xato:", e.message);
//       }
//     }
//   }
// });

// // /mymembers - Foydalanuvchi statistikasi
// bot.command("mymembers", async (ctx) => {
//   if (ctx.chat.type === "private") {
//     return ctx.reply("Bu buyruq faqat guruhlarda ishlaydi!");
//   }

//   const user = await db.collection("users").findOne({
//     userId: ctx.from.id,
//     chatId: ctx.chat.id,
//   });

//   const addedMembers = user?.addedMembers || 0;
//   const isPrivileged = user?.isPrivileged || false;

//   const group = await db.collection("groups").findOne({ chatId: ctx.chat.id });
//   const minMembers = group?.minMembers || 0;

//   let status;
//   if (isPrivileged) {
//     status = "✅ Siz cheklovdan ozod qilingansiz";
//   } else if (minMembers === 0) {
//     status = "ℹ️ Guruhda cheklov yo'q";
//   } else if (addedMembers >= minMembers) {
//     status = "✅ Xabar yozish mumkin";
//   } else {
//     status = `❌ Xabar yozish uchun ${
//       minMembers - addedMembers
//     } ta odam qo'shishingiz kerak`;
//   }

//   await ctx.reply(
//     `📊 <b>Sizning statistikangiz:</b>\n\n` +
//       `👥 Qo'shgan a'zolar: <b>${addedMembers} ta</b>\n` +
//       `📌 Minimal talab: <b>${minMembers} ta</b>\n` +
//       `🔹 Holat: <b>${status}</b>`,
//     { parse_mode: "HTML" }
//   );
// });

// // /yourmembers - Boshqa foydalanuvchi statistikasi
// bot.command("yourmembers", async (ctx) => {
//   if (ctx.chat.type === "private") {
//     return ctx.reply("Bu buyruq faqat guruhlarda ishlaydi!");
//   }

//   if (!ctx.message.reply_to_message) {
//     return ctx.reply(
//       "Iltimos, biron bir foydalanuvchi xabariga reply qilib yozing!"
//     );
//   }

//   const targetUserId = ctx.message.reply_to_message.from.id;

//   const user = await db.collection("users").findOne({
//     userId: targetUserId,
//     chatId: ctx.chat.id,
//   });

//   const addedMembers = user?.addedMembers || 0;
//   const username =
//     ctx.message.reply_to_message.from.username ||
//     ctx.message.reply_to_message.from.first_name;

//   await ctx.reply(
//     `👤 @${username} statistikasi:\n\n` +
//       `📊 Jami qo'shgan a'zolar: <b>${addedMembers} ta</b>`,
//     { parse_mode: "HTML" }
//   );
// });

// // /plus - Ballarni o'tkazish
// bot.command("plus", async (ctx) => {
//   if (ctx.chat.type === "private") {
//     return ctx.reply("Bu buyruq faqat guruhlarda ishlaydi!");
//   }

//   const args = ctx.message.text.split(" ");
//   if (args.length < 2 && !ctx.message.reply_to_message) {
//     return ctx.reply(
//       "Iltimos, foydalanuvchi ID yoki reply qiling!\n" +
//         "Masalan: /plus 5 @foydalanuvchi yoki reply bilan /plus 5"
//     );
//   }

//   const amount = parseInt(args[1]) || 1;
//   if (isNaN(amount) || amount <= 0) {
//     return ctx.reply("Iltimos, musbat son kiriting!");
//   }

//   let targetUserId;
//   if (ctx.message.reply_to_message) {
//     targetUserId = ctx.message.reply_to_message.from.id;
//   } else if (args[2] && args[2].startsWith("@")) {
//     const username = args[2].substring(1);
//     try {
//       const member = await ctx.getChatMember(username);
//       targetUserId = member.user.id;
//     } catch (e) {
//       return ctx.reply("Bunday foydalanuvchi topilmadi!");
//     }
//   } else {
//     return ctx.reply("Iltimos, foydalanuvchini belgilang!");
//   }

//   if (targetUserId === ctx.from.id) {
//     return ctx.reply("O'zingizga ball o'tkaza olmaysiz!");
//   }

//   // Foydalanuvchi balansini tekshirish
//   const sender = await db.collection("users").findOne({
//     userId: ctx.from.id,
//     chatId: ctx.chat.id,
//   });

//   const senderBalance = sender?.addedMembers || 0;
//   if (senderBalance < amount) {
//     return ctx.reply(
//       `Sizda yetarli ball yo'q! Sizda faqat ${senderBalance} ta ball bor.`
//     );
//   }

//   // Ballarni o'tkazish
//   await db
//     .collection("users")
//     .updateOne(
//       { userId: ctx.from.id, chatId: ctx.chat.id },
//       { $inc: { addedMembers: -amount } }
//     );

//   await db
//     .collection("users")
//     .updateOne(
//       { userId: targetUserId, chatId: ctx.chat.id },
//       { $inc: { addedMembers: amount } },
//       { upsert: true }
//     );

//   const targetUser = await ctx.getChatMember(targetUserId);
//   const targetUsername = targetUser.user.username || targetUser.user.first_name;

//   await ctx.reply(
//     `✅ @${ctx.from.username} ${amount} ta ballni @${targetUsername} ga o'tkazdi!\n\n` +
//       `Sizda qolgan ballar: ${senderBalance - amount} ta`
//   );
// });

// // Admin komandalari
// // /add - Minimal qo'shish sonini sozlash
// bot.command("add", async (ctx) => {
//   if (ctx.chat.type === "private") {
//     return ctx.reply("Bu buyruq faqat guruhlarda ishlaydi!");
//   }

//   // Adminlikni tekshirish
//   const admins = await ctx.getChatAdministrators();
//   const isAdmin = admins.some((admin) => admin.user.id === ctx.from.id);
//   if (!isAdmin) {
//     return ctx.reply("Bu buyruq faqat adminlar uchun!");
//   }

//   const args = ctx.message.text.split(" ");
//   if (args.length === 1) {
//     // Inline tugmalar bilan sozlash
//     const currentSettings = await db
//       .collection("groups")
//       .findOne({ chatId: ctx.chat.id });
//     const currentMin = currentSettings?.minMembers || 0;

//     await ctx.reply(
//       `🔧 Minimal qo'shish sonini sozlash:\n` +
//         `Hozirgi qiymat: ${currentMin} ta\n\n` +
//         `Quyidagi tugmalardan birini tanlang yoki raqam kiriting:`,
//       Markup.inlineKeyboard([
//         [
//           Markup.button.callback("3 ta", "set_min_3"),
//           Markup.button.callback("5 ta", "set_min_5"),
//         ],
//         [
//           Markup.button.callback("10 ta", "set_min_10"),
//           Markup.button.callback("O'chirish", "set_min_off"),
//         ],
//       ])
//     );
//   } else if (args[1] === "off") {
//     // Cheklovni o'chirish
//     await db
//       .collection("groups")
//       .updateOne(
//         { chatId: ctx.chat.id },
//         { $set: { minMembers: 0 } },
//         { upsert: true }
//       );

//     await ctx.reply("✅ Majburiy odam qo'shish tizimi o'chirildi!");
//   } else {
//     // Raqam bilan sozlash
//     const minMembers = parseInt(args[1]);
//     if (isNaN(minMembers) || minMembers < 0) {
//       return ctx.reply("Iltimos, musbat son kiriting!");
//     }

//     await db
//       .collection("groups")
//       .updateOne(
//         { chatId: ctx.chat.id },
//         { $set: { minMembers: minMembers } },
//         { upsert: true }
//       );

//     await ctx.reply(
//       `✅ Minimal qo'shish soni ${minMembers} ta deb sozlandi!\n` +
//         `Endi har bir foydalanuvchi kamida ${minMembers} ta odam qo'shgandan keyin xabar yozishi mumkin bo'ladi.`
//     );
//   }
// });

// // /top - Top 10 foydalanuvchi
// bot.command("top", async (ctx) => {
//   if (ctx.chat.type === "private") {
//     return ctx.reply("Bu buyruq faqat guruhlarda ishlaydi!");
//   }

//   // Adminlikni tekshirish
//   const admins = await ctx.getChatAdministrators();
//   const isAdmin = admins.some((admin) => admin.user.id === ctx.from.id);
//   if (!isAdmin) {
//     return ctx.reply("Bu buyruq faqat adminlar uchun!");
//   }

//   const topUsers = await db
//     .collection("users")
//     .find({ chatId: ctx.chat.id })
//     .sort({ addedMembers: -1 })
//     .limit(10)
//     .toArray();

//   if (topUsers.length === 0) {
//     return ctx.reply("Hali hech qanday statistikalar to'plalmagan!");
//   }

//   let topText = "🏆 Guruhda eng ko'p odam qo'shgan TOP 10 foydalanuvchi:\n\n";

//   for (let i = 0; i < topUsers.length; i++) {
//     try {
//       const user = await ctx.getChatMember(topUsers[i].userId);
//       const username = user.user.username || user.user.first_name;
//       topText += `${i + 1}. @${username} - ${topUsers[i].addedMembers} ta\n`;
//     } catch (e) {
//       topText += `${i + 1}. ID:${topUsers[i].userId} - ${
//         topUsers[i].addedMembers
//       } ta\n`;
//     }
//   }

//   await ctx.reply(topText);
// });

// // /delson - Barcha ballarni nolga tushirish
// bot.command("delson", async (ctx) => {
//   if (ctx.chat.type === "private") {
//     return ctx.reply("Bu buyruq faqat guruhlarda ishlaydi!");
//   }

//   // Adminlikni tekshirish
//   const admins = await ctx.getChatAdministrators();
//   const isAdmin = admins.some((admin) => admin.user.id === ctx.from.id);
//   if (!isAdmin) {
//     return ctx.reply("Bu buyruq faqat adminlar uchun!");
//   }

//   await db
//     .collection("users")
//     .updateMany({ chatId: ctx.chat.id }, { $set: { addedMembers: 0 } });

//   await ctx.reply("✅ Barcha foydalanuvchilarning ballari nolga tushirildi!");
// });

// // /clean - Foydalanuvchi ballarini tozalash
// bot.command("clean", async (ctx) => {
//   if (ctx.chat.type === "private") {
//     return ctx.reply("Bu buyruq faqat guruhlarda ishlaydi!");
//   }

//   // Adminlikni tekshirish
//   const admins = await ctx.getChatAdministrators();
//   const isAdmin = admins.some((admin) => admin.user.id === ctx.from.id);
//   if (!isAdmin) {
//     return ctx.reply("Bu buyruq faqat adminlar uchun!");
//   }

//   if (!ctx.message.reply_to_message) {
//     return ctx.reply("Iltimos, foydalanuvchi xabariga reply qiling!");
//   }

//   const targetUserId = ctx.message.reply_to_message.from.id;

//   await db
//     .collection("users")
//     .updateOne(
//       { userId: targetUserId, chatId: ctx.chat.id },
//       { $set: { addedMembers: 0 } }
//     );

//   const username =
//     ctx.message.reply_to_message.from.username ||
//     ctx.message.reply_to_message.from.first_name;

//   await ctx.reply(`✅ @${username} ning barcha ballari tozalandi!`, {
//     reply_to_message_id: ctx.message.reply_to_message.message_id,
//   });
// });

// // /priv - Cheklovdan ozod qilish
// bot.command("priv", async (ctx) => {
//   if (ctx.chat.type === "private") {
//     return ctx.reply("Bu buyruq faqat guruhlarda ishlaydi!");
//   }

//   // Adminlikni tekshirish
//   const admins = await ctx.getChatAdministrators();
//   const isAdmin = admins.some((admin) => admin.user.id === ctx.from.id);
//   if (!isAdmin) {
//     return ctx.reply("Bu buyruq faqat adminlar uchun!");
//   }

//   const args = ctx.message.text.split(" ");
//   let targetUserId;

//   if (ctx.message.reply_to_message) {
//     targetUserId = ctx.message.reply_to_message.from.id;
//   } else if (args[1]) {
//     targetUserId = parseInt(args[1]);
//     if (isNaN(targetUserId)) {
//       return ctx.reply("Iltimos, to'g'ri foydalanuvchi ID kiriting!");
//     }
//   } else {
//     return ctx.reply("Iltimos, foydalanuvchi ID yoki reply qiling!");
//   }

//   // Foydalanuvchi ma'lumotlarini o'qiymiz
//   const user = await db.collection("users").findOne({
//     userId: targetUserId,
//     chatId: ctx.chat.id,
//   });

//   const currentStatus = user?.isPrivileged || false;

//   // Statusni o'zgartirish
//   await db
//     .collection("users")
//     .updateOne(
//       { userId: targetUserId, chatId: ctx.chat.id },
//       { $set: { isPrivileged: !currentStatus } },
//       { upsert: true }
//     );

//   // Foydalanuvchi ma'lumotlarini olish
//   let username;
//   try {
//     const member = await ctx.getChatMember(targetUserId);
//     username = member.user.username || member.user.first_name;
//   } catch (e) {
//     username = `ID:${targetUserId}`;
//   }

//   await ctx.reply(
//     `✅ @${username} uchun cheklov ${
//       !currentStatus ? "yoqildi" : "o'chirildi"
//     }!\n` + `Endi u ${!currentStatus ? "cheklovdan ozod" : "qayta cheklangan"}.`
//   );
// });

// // /textforce - Xabar matnini o'zgartirish
// bot.command("textforce", async (ctx) => {
//   if (ctx.chat.type === "private") {
//     return ctx.reply("Bu buyruq faqat guruhlarda ishlaydi!");
//   }

//   // Adminlikni tekshirish
//   const admins = await ctx.getChatAdministrators();
//   const isAdmin = admins.some((admin) => admin.user.id === ctx.from.id);
//   if (!isAdmin) {
//     return ctx.reply("Bu buyruq faqat adminlar uchun!");
//   }

//   const text = ctx.message.text.substring("/textforce".length).trim();

//   await db
//     .collection("groups")
//     .updateOne(
//       { chatId: ctx.chat.id },
//       { $set: { textForce: text } },
//       { upsert: true }
//     );

//   if (text) {
//     await ctx.reply(`✅ Majburiy qo'shish xabari matni sozlandi:\n\n${text}`);
//   } else {
//     await ctx.reply("✅ Majburiy qo'shish xabari matni o'chirildi!");
//   }
// });

// // /text_time - Xabar vaqtini sozlash
// bot.command("text_time", async (ctx) => {
//   if (ctx.chat.type === "private") {
//     return ctx.reply("Bu buyruq faqat guruhlarda ishlaydi!");
//   }

//   // Adminlikni tekshirish
//   const admins = await ctx.getChatAdministrators();
//   const isAdmin = admins.some((admin) => admin.user.id === ctx.from.id);
//   if (!isAdmin) {
//     return ctx.reply("Bu buyruq faqat adminlar uchun!");
//   }

//   const args = ctx.message.text.split(" ");
//   if (args.length < 2) {
//     return ctx.reply(
//       "Iltimos, vaqtni sekundlarda kiriting!\nMasalan: /text_time 30"
//     );
//   }

//   const time = parseInt(args[1]);
//   if (isNaN(time) || time < 0) {
//     return ctx.reply("Iltimos, musbat son kiriting!");
//   }

//   await db
//     .collection("groups")
//     .updateOne(
//       { chatId: ctx.chat.id },
//       { $set: { textTime: time } },
//       { upsert: true }
//     );

//   await ctx.reply(
//     `✅ Majburiy qo'shish xabari ${time} soniyadan keyin o'chiriladi!`
//   );
// });

// // /set - Kanalga ulash
// bot.command("set", async (ctx) => {
//   if (ctx.chat.type === "private") {
//     return ctx.reply("Bu buyruq faqat guruhlarda ishlaydi!");
//   }

//   // Adminlikni tekshirish
//   const admins = await ctx.getChatAdministrators();
//   const isAdmin = admins.some((admin) => admin.user.id === ctx.from.id);
//   if (!isAdmin) {
//     return ctx.reply("Bu buyruq faqat adminlar uchun!");
//   }

//   const args = ctx.message.text.split(" ");
//   if (args.length < 2) {
//     return ctx.reply(
//       "Iltimos, kanal ID yoki @username kiriting!\nMasalan: /set @mychannel"
//     );
//   }

//   const channel = args[1].startsWith("@") ? args[1] : parseInt(args[1]);
//   if (!channel) {
//     return ctx.reply("Iltimos, to'g'ri kanal identifikator kiriting!");
//   }

//   // Kanalga admin ekanligimizni tekshiramiz
//   try {
//     const chatMember = await ctx.telegram.getChatMember(
//       channel,
//       ctx.botInfo.id
//     );
//     if (chatMember.status !== "administrator") {
//       return ctx.reply(
//         "Men bu kanalda admin emasman! Iltimos, avval meni kanalga admin qiling."
//       );
//     }
//   } catch (e) {
//     return ctx.reply("Kanal topilmadi yoki men unda a'zo emasman!");
//   }

//   // Kanalni guruhga ulash
//   await db
//     .collection("groups")
//     .updateOne(
//       { chatId: ctx.chat.id },
//       { $addToSet: { linkedChannels: channel } },
//       { upsert: true }
//     );

//   await ctx.reply(
//     `✅ Kanal ${channel} guruhga muvaffaqiyatli ulandi!\n` +
//       `Endi yangi a'zolar ushbu kanalga a'zo bo'lishlari shart qilinadi.`
//   );
// });

// // /unlink - Kanallarni olib tashlash
// bot.command("unlink", async (ctx) => {
//   if (ctx.chat.type === "private") {
//     return ctx.reply("Bu buyruq faqat guruhlarda ishlaydi!");
//   }

//   // Adminlikni tekshirish
//   const admins = await ctx.getChatAdministrators();
//   const isAdmin = admins.some((admin) => admin.user.id === ctx.from.id);
//   if (!isAdmin) {
//     return ctx.reply("Bu buyruq faqat adminlar uchun!");
//   }

//   const group = await db.collection("groups").findOne({ chatId: ctx.chat.id });
//   if (!group?.linkedChannels || group.linkedChannels.length === 0) {
//     return ctx.reply("Guruhga ulangan kanallar mavjud emas!");
//   }

//   if (ctx.message.text.split(" ").length < 2) {
//     // Ulangan kanallar ro'yxatini ko'rsatish
//     let channelsText = "📌 Guruhga ulangan kanallar:\n\n";
//     group.linkedChannels.forEach((channel, index) => {
//       channelsText += `${index + 1}. ${channel}\n`;
//     });

//     channelsText +=
//       "\nKanalni o'chirish uchun /unlink <kanal raqami> buyrug'ini yuboring.";

//     return ctx.reply(channelsText);
//   }

//   const channelIndex = parseInt(ctx.message.text.split(" ")[1]) - 1;
//   if (
//     isNaN(channelIndex) ||
//     channelIndex < 0 ||
//     channelIndex >= group.linkedChannels.length
//   ) {
//     return ctx.reply("Iltimos, to'g'ri kanal raqamini kiriting!");
//   }

//   const channelToRemove = group.linkedChannels[channelIndex];

//   await db
//     .collection("groups")
//     .updateOne(
//       { chatId: ctx.chat.id },
//       { $pull: { linkedChannels: channelToRemove } }
//     );

//   await ctx.reply(
//     `✅ Kanal ${channelToRemove} guruhdan muvaffaqiyatli olib tashlandi!`
//   );
// });

// // Inline tugmalar uchun handler
// bot.action(/set_min_(\d+|off)/, async (ctx) => {
//   // Adminlikni tekshirish
//   const admins = await ctx.getChatAdministrators();
//   const isAdmin = admins.some((admin) => admin.user.id === ctx.from.id);
//   if (!isAdmin) {
//     return ctx.answerCbQuery("Bu tugma faqat adminlar uchun!", {
//       show_alert: true,
//     });
//   }

//   const action = ctx.match[1];

//   if (action === "off") {
//     await db
//       .collection("groups")
//       .updateOne(
//         { chatId: ctx.chat.id },
//         { $set: { minMembers: 0 } },
//         { upsert: true }
//       );

//     await ctx.editMessageText("✅ Majburiy odam qo'shish tizimi o'chirildi!");
//   } else {
//     const minMembers = parseInt(action);

//     await db
//       .collection("groups")
//       .updateOne(
//         { chatId: ctx.chat.id },
//         { $set: { minMembers: minMembers } },
//         { upsert: true }
//       );

//     await ctx.editMessageText(
//       `✅ Minimal qo'shish soni ${minMembers} ta deb sozlandi!\n` +
//         `Endi har bir foydalanuvchi kamida ${minMembers} ta odam qo'shgandan keyin xabar yozishi mumkin bo'ladi.`
//     );
//   }
// });

// // Botni ishga tushirish
// (async () => {
//   try {
//     await connectDB();
//     await bot.launch();
//     console.log("🤖 Xisoblovchi bot ishga tushdi!");
//   } catch (e) {
//     console.error("Botni ishga tushirishda xato:", e);
//   }
// })();

// // Graceful shutdown
// process.once("SIGINT", () => bot.stop("SIGINT"));
// process.once("SIGTERM", () => bot.stop("SIGTERM"));
