const axios = require("axios");

const baseApiUrl = async () => {
    const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
    return base.data.mahmud;
};

module.exports = {
    config: {
        name: "4k",
        aliases: ["hd", "upscale"],
        version: "2.0",
        author: "OPU",
        countDown: 10,
        role: 0,
        shortDescription: "Upscale image to HD/4K",
        category: "image",
        guide: {
            en: "{pn} [image url] or reply to an image"
        }
    },

    onStart: async function ({ api, message, args, event }) {

        let imgUrl;

        if (event.messageReply?.attachments?.[0]?.type === "photo") {
            imgUrl = event.messageReply.attachments[0].url;
        } else if (args[0]) {
            imgUrl = args.join(" ");
        }

        if (!imgUrl) {
            return api.sendMessage("❌ Please reply to an image or provide an image URL.", event.threadID, event.messageID);
        }

        api.setMessageReaction("⏳", event.messageID, () => {}, true);

        try {
            const response = await axios.get(
                `${await baseApiUrl()}/api/hd/mahmud?imgUrl=${encodeURIComponent(imgUrl)}`,
                {
                    responseType: "stream",
                    headers: { "User-Agent": "Mozilla/5.0" }
                }
            );

            api.setMessageReaction("✅", event.messageID, () => {}, true);

            return api.sendMessage({
                body: "✅ Image upscaled successfully!",
                attachment: response.data
            }, event.threadID, event.messageID);

        } catch (err) {
            console.error("4K Error:", err);
            api.setMessageReaction("❌", event.messageID, () => {}, true);

            return api.sendMessage("❌ Failed to upscale image. Try again later.", event.threadID, event.messageID);
        }
    }
};
