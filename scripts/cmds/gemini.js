const axios = require("axios");

const baseApiUrl = async () => {
    const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
    return base.data.mahmud;
};

module.exports = {
    config: {
        name: "gemini",
        version: "2.0",
        author: "OPU",
        countDown: 5,
        role: 0,
        category: "ai",
        guide: {
            en: "{pn} <prompt> or reply to an image"
        }
    },

    onStart: async function ({ api, event, args, message }) {

        const prompt = args.join(" ");
        if (!prompt) {
            return message.reply("❌ Please provide a prompt!");
        }

        let requestBody = { prompt };

        if (event.type === "message_reply" && event.messageReply.attachments.length > 0) {
            const attachment = event.messageReply.attachments[0];
            if (attachment.type === "photo") {
                requestBody.imageUrl = attachment.url;
            }
        }

        return await handleGemini(api, event, requestBody, this.config.name);
    },

    onReply: async function ({ api, event, Reply, args }) {
        if (Reply.author !== event.senderID) return;

        const prompt = args.join(" ");
        if (!prompt) return;

        return await handleGemini(api, event, { prompt }, this.config.name);
    }
};

async function handleGemini(api, event, requestBody, commandName) {
    try {
        api.setMessageReaction("⏳", event.messageID, () => {}, true);

        const baseUrl = await baseApiUrl();
        const response = await axios.post(`${baseUrl}/api/gemini`, requestBody, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        const replyText = response.data.response || "No response received.";

        api.setMessageReaction("✅", event.messageID, () => {}, true);

        api.sendMessage(replyText, event.threadID, (error, info) => {
            if (!error) {
                global.GoatBot.onReply.set(info.messageID, {
                    commandName: commandName,
                    author: event.senderID
                });
            }
        }, event.messageID);

    } catch (err) {
        console.error("Gemini Error:", err);
        api.setMessageReaction("❌", event.messageID, () => {}, true);

        api.sendMessage("❌ Failed to get response. Try again later.", event.threadID, event.messageID);
    }
}
