const fs = require("fs");


let groups = {};
let groupSettings = {};


function loadGroups() {
  try {
    if (fs.existsSync("groups.json")) {
      const data = fs.readFileSync("groups.json", "utf8");
      groups = JSON.parse(data);
    }
  } catch (err) {
    console.error("Error loading groups:", err);
  }
}

function loadGroupSettings() {
  try {
    if (fs.existsSync("groupSettings.json")) {
      const data = fs.readFileSync("groupSettings.json", "utf8");
      groupSettings = JSON.parse(data);
    }
  } catch (err) {
    console.error("Error loading group settings:", err);
  }
}


function saveGroups() {
  try {
    fs.writeFileSync("groups.json", JSON.stringify(groups, null, 2));
  } catch (err) {
    console.error("Error saving groups:", err);
  }
}

function saveGroupSettings() {
  try {
    fs.writeFileSync(
      "groupSettings.json",
      JSON.stringify(groupSettings, null, 2)
    );
  } catch (err) {
    console.error("Error saving group settings:", err);
  }
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

module.exports = {
  groups,
  groupSettings,
  loadGroups,
  loadGroupSettings,
  saveGroups,
  saveGroupSettings,
  getGroupSettings,
};
