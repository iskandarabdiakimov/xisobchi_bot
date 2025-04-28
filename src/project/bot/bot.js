require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const data = require("./data");
const utils = require("./utils");
const handlers = require("./handlers");
const commands = require("./commands");
const mongodb = require("./mongodb");

const token = process.env.TELEGRAM_TOKEN;
if (!token) {
  console.error("TELEGRAM_TOKEN .env faylda aniqlanmagan!");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

data.loadGroups();
data.loadGroupSettings();

handlers(bot);
commands(bot);

utils.setupCommands(bot);

console.log("🤖 Bot ishga tushdi.");
