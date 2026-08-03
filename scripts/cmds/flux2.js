const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseApiUrl = async () => {
    const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
    return base.data.mahmud;
};

module.exports = {
    config: {
        name: "flux2",
        version: "2.0",
        author: "OPU",
        countDown: 15,
        role: 0,
        shortDescription: "Generate AI image using Flux Pro",
        category: "ai",
        guide: {
            en: "{pn} <prompt> --ratio <value>\nExample: {pn} anime girl --ratio 1:1"
        }
    },

    onStart: async function ({ api, event, args, message }) {

        const fullArgs = args.join(" ");
        if (!fullArgs) {
            return message.reply("❌ Please provide a prompt!");
        }

        const [prompt, ratio = "1:1"] = fullArgs.includes("--ratio")
            ? fullArgs.split("--ratio").map(s => s.trim())
            : [fullArgs, "1:1"];

        const cacheDir = path.join(__dirname, "cache");
        const filePath = path.join(cacheDir, `fluxpro_${Date.now()}.png`);
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

        try {
            api.setMessageReaction("⏳", event.messageID, () => {}, true);
            const waitMsg = await message.reply("🔄 Generating image...");

            const baseUrl = await baseApiUrl();
            const url = `${baseUrl}/api/fluxpro?prompt=${encodeURIComponent(prompt)}&ratio=${ratio}`;

            const response = await axios.get(url, {
                responseType: "arraybuffer",
                timeout: 120000
            });

            fs.writeFileSync(filePath, Buffer.from(response.data));

            if (waitMsg?.messageID) api.unsendMessage(waitMsg.messageID);
            api.setMessageReaction("✅", event.messageID, () => {}, true);

            return message.reply({
                body: `✅ Done\n📝 Prompt: ${prompt}\n📐 Ratio: ${ratio}`,
                attachment: fs.createReadStream(filePath)
            }, () => {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            });

        } catch (err) {
            console.error("Flux Pro Error:", err);
            api.setMessageReaction("❌", event.messageID, () => {}, true);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

            return message.reply("❌ Failed to generate image. Try again later.");
        }
    }
};
