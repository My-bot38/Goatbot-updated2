const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const baseApiUrl = async () => {
    const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
    return base.data.mahmud;
};

module.exports = {
    config: {
        name: "profile",
        aliases: ["pp", "dp", "pfp"],
        version: "2.0",
        author: "OPU",
        countDown: 5,
        role: 0,
        shortDescription: "Fetch user profile picture",
        category: "utility",
        guide: {
            en: "{pn} or {pn} @tag / reply / UID"
        }
    },

    onStart: async function ({ api, message, args, event, usersData }) {

        try {
            let uid = event.senderID;

            if (event.messageReply) {
                uid = event.messageReply.senderID;
            } else if (Object.keys(event.mentions).length > 0) {
                uid = Object.keys(event.mentions)[0];
            } else if (args[0]) {
                if (!isNaN(args[0])) {
                    uid = args[0];
                } else if (args[0].includes("facebook.com/")) {
                    const match = args[0].match(/(?:profile\.php\?id=|\/)([\d]+)/);
                    if (match) uid = match[1];
                }
            }

            if (!uid || isNaN(uid)) {
                return message.reply("❌ Invalid UID or link.");
            }

            api.setMessageReaction("⏳", event.messageID, () => {}, true);

            const baseUrl = await baseApiUrl();
            const avatarURL = `${baseUrl}/api/pfp?mahmud=${uid}`;
            const userName = await usersData.getName(uid);

            const cacheDir = path.join(__dirname, "cache");
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
            const cachePath = path.join(cacheDir, `pfp_${uid}.jpg`);

            const response = await axios.get(avatarURL, { responseType: "arraybuffer" });
            fs.writeFileSync(cachePath, Buffer.from(response.data));

            return message.reply({
                body: `✅ Profile of ${userName}`,
                attachment: fs.createReadStream(cachePath)
            }, () => {
                api.setMessageReaction("✅", event.messageID, () => {}, true);
                if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
            });

        } catch (err) {
            console.error("Profile Error:", err);
            api.setMessageReaction("❌", event.messageID, () => {}, true);
            return message.reply("❌ Failed to fetch profile picture.");
        }
    }
};
