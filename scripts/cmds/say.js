const axios = require("axios");

const baseApiUrl = async () => {
try {
const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
return base.data.mahmud;
} catch {
return "https://api.mahmudx7.xyz"; // fallback
}
};

module.exports = {
config: {
name: "say",
version: "2.0",
author: "OPU",
countDown: 5,
role: 0,
description: {
en: "Convert text to voice message"
},
category: "media",
guide: {
en: "{pn} <text> OR reply to message"
}
},

langs: {
    en: {
        noInput: "Write something or reply to a message!",
        error: "❌ Error: %1"
    }
},

onStart: async function ({ api, event, args, message, getLang }) {

    let text = args.join(" ");

    if (event.type === "message_reply" && event.messageReply?.body) {
        text = event.messageReply.body;
    }

    if (!text) return message.reply(getLang("noInput"));

    try {
        api.setMessageReaction("⏳", event.messageID, () => {}, true);

        const apiUrl = await baseApiUrl();

        const res = await axios({
            url: `${apiUrl}/api/say`,
            method: "GET",
            params: { text },
            responseType: "stream",
            timeout: 60000
        });

        return message.reply({
            attachment: res.data
        }, () => {
            api.setMessageReaction("🔊", event.messageID, () => {}, true);
        });

    } catch (err) {
        console.error(err);
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return message.reply(getLang("error", err.message));
    }
}

};
