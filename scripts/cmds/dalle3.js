const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseApiUrl = async () => {
    const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
    return base.data.mahmud;
};

module.exports = {
    config: {
        name: "dalle3",
        version: "2.0",
        author: "OPU",
        countDown: 15,
        role: 0,
        shortDescription: "Generate AI image using DALL-E 3",
        category: "ai",
        guide: {
            en: "{pn} <prompt>\nExample: {pn} futuristic city at night"
        }
    },

    onStart: async function ({ api, event, args, message }) {

        const prompt = args.join(" ");
        if (!prompt) {
            return message.reply("❌ Please provide a prompt!");
        }

        const cacheDir = path.join(__dirname, "cache");
        const filePath = path.join(cacheDir, `dalle3_${Date.now()}.png`);
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

        try {
            api.setMessageReaction("⏳", event.messageID, () => {}, true);
            const waitMsg = await message.reply("🔄 Generating image...");

            const baseUrl = await baseApiUrl();

            const response = await axios.post(
                `${baseUrl}/api/dalle3`,
                { prompt },
                { responseType: "arraybuffer" }
            );

            fs.writeFileSync(filePath, Buffer.from(response.data));

            if (waitMsg?.messageID) api.unsendMessage(waitMsg.messageID);
            api.setMessageReaction("✅", event.messageID, () => {}, true);

            return message.reply({
                body: `✅ Done\n📝 Prompt: ${prompt}`,
                attachment: fs.createReadStream(filePath)
            }, () => {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            });

        } catch (err) {
            console.error("Dalle3 Error:", err);
            api.setMessageReaction("❌", event.messageID, () => {}, true);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

            return message.reply("❌ Failed to generate image. Try again later.");
        }
    }
};
