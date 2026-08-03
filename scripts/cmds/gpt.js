const axios = require("axios");

const baseApiUrl = async () => {
    const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
    return base.data.mahmud;
};

module.exports = {
    config: {
        name: "gpt",
        aliases: ["gpt4"],
        version: "2.0",
        author: "OPU",
        countDown: 5,
        role: 0,
        shortDescription: "Chat with AI",
        category: "ai",
        guide: {
            en: "{pn} <question>"
        }
    },

    onStart: async function ({ api, event, args, message, commandName }) {

        const prompt = args.join(" ");
        if (!prompt) {
            return message.reply("❌ Please ask something!");
        }

        return this.handleGPT({ api, event, prompt, commandName });
    },

    onReply: async function ({ api, event, Reply, commandName }) {
        if (Reply.author !== event.senderID) return;

        const prompt = event.body;
        if (!prompt) return;

        return this.handleGPT({ api, event, prompt, commandName });
    },

    handleGPT: async function ({ api, event, prompt, commandName }) {
        try {
            api.setMessageReaction("⏳", event.messageID, () => {}, true);

            const baseUrl = await baseApiUrl();
            const response = await axios.get(`${baseUrl}/api/ai`, {
                params: {
                    prompt: prompt,
                    ai: "gpt"
                }
            });

            const replyText = response.data.response || "No response received.";

            api.setMessageReaction("✅", event.messageID, () => {}, true);

            return api.sendMessage(replyText, event.threadID, (error, info) => {
                if (!error) {
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName,
                        author: event.senderID
                    });
                }
            }, event.messageID);

        } catch (err) {
            console.error("GPT Error:", err);
            api.setMessageReaction("❌", event.messageID, () => {}, true);

            return api.sendMessage("❌ Failed to get response. Try again later.", event.threadID, event.messageID);
        }
    }
};
