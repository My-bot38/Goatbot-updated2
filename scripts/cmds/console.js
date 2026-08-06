const chalk = require("chalk");
const moment = require("moment-timezone");

module.exports = {
    config: {
        name: "console",
        version: "1.0.0",
        hasPermission: 3,
        credits: "SaGor",
        description: "Log group messages with styled console output",
        commandCategory: "owner",
        usages: "console",
        cooldowns: 0
    },

    languages: {
        vi: {
            on: "Bật",
            off: "Tắt",
            successText: "console thành công",
        },
        en: {
            on: "on",
            off: "off",
            successText: "console success!",
        }
    },

    // 🔹 Handles console logging on every message
    handleEvent: async function ({ event, Users }) {
        try {
            const { threadID, senderID } = event;

            // Skip bot's own messages
            if (senderID == global.data.botID) return;

            // Respect thread settings
            const thread = global.data.threadData.get(threadID) || {};
            if (thread["console"] === true) return;

            // Fetch thread and user details
            const nameBox = global.data.threadInfo.get(threadID)?.threadName || "Unknown Group";
            const nameUser = await Users.getNameUser(senderID);
            const msg = event.body || "Non-text content";

            // Colors pool
            const colors = [
                "FF9900", "FFFF33", "33FFFF", "FF99FF", "FF3366",
                "FFFF66", "FF00FF", "66FF99", "00CCFF", "FF0099",
                "FF0066", "7900FF", "93FFD8", "CFFFDC", "FF5B00",
                "3B44F6", "A6D1E6", "7F5283", "A66CFF", "F05454",
                "FCF8E8", "94B49F", "47B5FF", "B8FFF9", "42C2FF", "FF7396"
            ];
            const pick = () => colors[Math.floor(Math.random() * colors.length)];

            // Current time
            const time = moment.tz("Asia/Dhaka").format("YYYY-MM-DD HH:mm:ss");

            // Console log (clean style)
            console.log(
                chalk.hex("#" + pick())(`Group: ${nameBox}`) + `\n` +
                chalk.hex("#" + pick())(`Group ID: ${threadID}`) + `\n` +
                chalk.hex("#" + pick())(`User: ${nameUser}`) + `\n` +
                chalk.hex("#" + pick())(`User ID: ${senderID}`) + `\n` +
                chalk.hex("#" + pick())(`Message: ${msg}`) + `\n` +
                chalk.hex("#" + pick())(`Time: ${time}`) + `\n` +
                chalk.hex("#" + pick())(`───────────────[ CONSOLE LOG ]───────────────`)
            );
        } catch (err) {
            console.error("Console logging error:", err.message || err);
        }
    },

    // 🔹 Command to toggle console logging
    onStart: async function ({ api, event, Threads, getText }) {
        const { threadID, messageID } = event;
        let data = (await Threads.getData(threadID)).data;

        // Toggle console state
        data["console"] = !(data["console"] === false);
        await Threads.setData(threadID, { data });
        global.data.threadData.set(threadID, data);

        return api.sendMessage(
            `${data["console"] === false ? getText("on") : getText("off")} ${getText("successText")}`,
            threadID,
            messageID
        );
    }
};
