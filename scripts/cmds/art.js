const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const baseApiUrl = async () => {
try {
const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
return base.data.mahmud;
} catch {
return "https://api.mahmudx7.xyz"; // fallback API
}
};

module.exports = {
config: {
name: "art",
aliases: ["artify", "photoart"],
version: "2.0",
author: "OPU",
countDown: 10,
role: 0,
description: {
en: "Transform your photo into art styles"
},
category: "ai",
guide: {
en: "{pn} [1-100] → Reply to photo\n{pn} list → Show styles"
}
},

langs: {
    en: {
        list_header: "🎨 Available Art Styles:\n\n",
        no_image: "Reply to a photo first!",
        invalid_style: "Style must be between 1 - 100",
        generating: "⏳ Creating art...\nStyle: %1\nName: %2",
        error: "❌ Error: %1",
        success: "✅ Done!\nStyle: %1\nName: %2"
    }
},

onStart: async function ({ api, event, args, message, getLang }) {

    const { threadID, messageID } = event;
    const cacheDir = path.join(__dirname, "cache");
    const cachePath = path.join(cacheDir, `art_${Date.now()}.png`);
    let waitMsg;

    try {
        const apiUrl = await baseApiUrl();

        // LIST
        if (args[0] === "list") {
            const res = await axios.get(`${apiUrl}/api/art/list`);
            const styles = res.data.styles || {};
            let text = getLang("list_header");
            for (const key in styles) {
                text += `${key}: ${styles[key]}\n`;
            }
            return message.reply(text);
        }

        // IMAGE CHECK
        const replied = event.messageReply?.attachments?.[0];
        if (!replied || replied.type !== "photo") {
            return message.reply(getLang("no_image"));
        }

        // STYLE CHECK
        const styleNum = parseInt(args[0] || "1");
        if (isNaN(styleNum) || styleNum < 1 || styleNum > 100) {
            return message.reply(getLang("invalid_style"));
        }

        const imageUrl = encodeURIComponent(replied.url);

        // STYLE NAME
        let styleName = "Art";
        try {
            const listRes = await axios.get(`${apiUrl}/api/art/list`);
            styleName = listRes.data.styles?.[styleNum] || "Art";
        } catch {}

        api.setMessageReaction("⏳", messageID, () => {}, true);
        waitMsg = await message.reply(getLang("generating", styleNum, styleName));

        // API CALL
        const res = await axios({
            url: `${apiUrl}/api/art?imageUrl=${imageUrl}&style=${styleNum}`,
            method: "GET",
            responseType: "arraybuffer",
            timeout: 120000
        });

        await fs.ensureDir(cacheDir);
        await fs.writeFile(cachePath, Buffer.from(res.data));

        if (waitMsg) message.unsend(waitMsg.messageID);

        return message.reply({
            body: getLang("success", styleNum, styleName),
            attachment: fs.createReadStream(cachePath)
        }, () => {
            api.setMessageReaction("✅", messageID, () => {}, true);
            if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        });

    } catch (err) {
        if (waitMsg) message.unsend(waitMsg.messageID);
        api.setMessageReaction("❌", messageID, () => {}, true);
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        return message.reply(getLang("error", err.message));
    }
}

};
