require("dotenv").config();
const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ MongoDB-ga muvaffaqiyatli ulandi");
  } catch (error) {
    console.error("❌ MongoDB ulanishida xato:", error.message);
    process.exit(1);
  }
}

function setupConnectionListeners() {
  mongoose.connection.on("connected", () =>
    console.log("Mongoose MongoDB-ga ulandi")
  );
  mongoose.connection.on("error", (error) =>
    console.error("Mongoose ulanish xatosi:", error.message)
  );
  mongoose.connection.on("disconnected", () =>
    console.warn("Mongoose ulanishi uzildi")
  );
  process.on("SIGINT", async () => {
    await mongoose.connection.close();
    console.log("MongoDB ulanishi yopildi");
    process.exit(0);
  });
}

const userSchema = new mongoose.Schema(
  {
    userId: { type: Number, required: true, unique: true, index: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    username: { type: String, trim: true, index: true },
    isBot: { type: Boolean, default: false },
    joinDate: { type: Date, default: Date.now },
    lastActivity: { type: Date },
  },
  { timestamps: true }
);

const memberSchema = new mongoose.Schema({
  userId: { type: Number, ref: "User", required: true },
  addedCount: { type: Number, default: 0 },
  lastAdded: { type: Date },
  isExempt: { type: Boolean, default: false },
});

const groupSchema = new mongoose.Schema(
  {
    chatId: { type: Number, required: true, unique: true, index: true },
    title: { type: String, trim: true },
    type: { type: String, trim: true },
    members: [memberSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: { updatedAt: "updatedAt" } }
);

const groupSettingsSchema = new mongoose.Schema(
  {
    chatId: { type: Number, required: true, unique: true, index: true },
    minMembers: { type: Number, default: 3 },
    forceAdd: { type: Boolean, default: true },
    customText: { type: String, trim: true, default: "" },
    textTime: { type: Number, default: 30 },
    exemptUsers: [{ type: Number, ref: "User" }],
    linkedChannels: [
      {
        channelId: { type: String, required: true },
        channelTitle: { type: String, trim: true },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: { updatedAt: "updatedAt" } }
);

const activitySchema = new mongoose.Schema(
  {
    userId: { type: Number, ref: "User", required: true, index: true },
    chatId: { type: Number, ref: "Group", required: true, index: true },
    actionType: {
      type: String,
      enum: ["add_member", "send_message", "command"],
      required: true,
    },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

const User = mongoose.model("User", userSchema);
const Group = mongoose.model("Group", groupSchema);
const GroupSettings = mongoose.model("GroupSettings", groupSettingsSchema);
const Activity = mongoose.model("Activity", activitySchema);

async function getUser(userId) {
  try {
    return await User.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId } },
      { upsert: true, new: true }
    );
  } catch (error) {
    throw new Error(`Foydalanuvchi olishda xato: ${error.message}`);
  }
}

async function getGroup(chatId) {
  try {
    return (
      (await Group.findOne({ chatId })) || new Group({ chatId, members: [] })
    );
  } catch (error) {
    throw new Error(`Guruh olishda xato: ${error.message}`);
  }
}

async function updateGroupMember(chatId, userId, update) {
  try {
    return await Group.findOneAndUpdate(
      { chatId, "members.userId": userId },
      { $set: { "members.$": update } },
      { upsert: true, new: true }
    );
  } catch (error) {
    throw new Error(`Guruh a'zosini yangilashda xato: ${error.message}`);
  }
}

async function getGroupSettings(chatId) {
  try {
    return (
      (await GroupSettings.findOne({ chatId })) || new GroupSettings({ chatId })
    );
  } catch (error) {
    throw new Error(`Guruh sozlamalarini olishda xato: ${error.message}`);
  }
}

async function logActivity(userId, chatId, actionType, details = {}) {
  try {
    const activity = new Activity({ userId, chatId, actionType, details });
    await activity.save();
    return activity;
  } catch (error) {
    throw new Error(`Faollikni saqlashda xato: ${error.message}`);
  }
}

async function cleanAndCreateIndexes() {
  try {
    await Group.deleteMany({ chatId: null });
    await GroupSettings.deleteMany({ chatId: null });
    await User.createIndexes();
    await Group.createIndexes();
    await GroupSettings.createIndexes();
    await Activity.createIndexes();
    console.log("✅ Barcha indekslar muvaffaqiyatli yaratildi");
  } catch (error) {
    console.error("❌ Indekslar yaratishda xato:", error.message);
  }
}

async function initializeDB() {
  try {
    await connectDB();
    setupConnectionListeners();
    await cleanAndCreateIndexes();
  } catch (error) {
    console.error(
      "Ma'lumotlar bazasini ishga tushirishda xato:",
      error.message
    );
    process.exit(1);
  }
}

initializeDB();
