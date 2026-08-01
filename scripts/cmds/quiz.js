const axios = require("axios");

// simple memory score (bot restart হলে reset হবে)
const userScores = {};

module.exports = {
    config: {
        name: "quiz",
        version: "2.0",
        author: "OPU",
        countDown: 5,
        prefix: true,
        description: "Advanced Quiz System",
        category: "fun",
        guide: {
            en: "{pn}quiz [easy/medium/hard]"
        }
    },

    onStart: async ({ api, event, args }) => {
        const { threadID, senderID } = event;

        const difficulty = ["easy", "medium", "hard"].includes(args[0])
            ? args[0]
            : "medium";

        try {
            const res = await axios.get(
                `https://sus-apis.onrender.com/api/quiz?amount=1&difficulty=${difficulty}&type=boolean`
            );

            if (!res.data?.results?.[0]) {
                return api.sendMessage("❌ Quiz load failed.", threadID);
            }

            const data = res.data.results[0];

            const clean = (t) =>
                t.replace(/&quot;/g, '"')
                 .replace(/&#039;/g, "'")
                 .replace(/&amp;/g, "&");

            const question = clean(data.question);
            const category = clean(data.category);

            const correctIndex =
                data.correct_answer.toLowerCase() === "true" ? 0 : 1;

            const msg = `🧠 Quiz (${difficulty.toUpperCase()})
📂 ${category}

❓ ${question}

a) True
b) False

⏱️ Time: 30s`;

            api.sendMessage(msg, threadID, (err, info) => {
                if (err) return;

                global.client.handleReply.push({
                    name: "quiz",
                    messageID: info.messageID,
                    author: senderID,
                    correctIndex,
                    timeout: setTimeout(() => {
                        const i = global.client.handleReply.findIndex(
                            x => x.messageID === info.messageID
                        );
                        if (i !== -1) {
                            global.client.handleReply.splice(i, 1);
                            api.sendMessage("⏰ Time up!", threadID);
                        }
                    }, 30000)
                });
            });

        } catch (e) {
            api.sendMessage("❌ API error.", threadID);
        }
    },

    handleReply: async ({ event, api, handleReply }) => {
        const { senderID, threadID, body, messageID } = event;

        if (senderID !== handleReply.author) return;

        const ans = body.trim().toLowerCase();
        if (!["a", "b"].includes(ans)) {
            return api.sendMessage("⚠️ Reply only a or b", threadID, messageID);
        }

        const index = global.client.handleReply.findIndex(
            x => x.messageID === handleReply.messageID
        );

        if (index !== -1) {
            clearTimeout(global.client.handleReply[index].timeout);
            global.client.handleReply.splice(index, 1);
        }

        const userIndex = ans === "a" ? 0 : 1;

        // score init
        if (!userScores[senderID]) userScores[senderID] = 0;

        if (userIndex === handleReply.correctIndex) {
            userScores[senderID] += 10;

            return api.sendMessage(
                `✅ Correct!\n🎯 Score: ${userScores[senderID]}`,
                threadID,
                messageID
            );
        } else {
            userScores[senderID] -= 5;

            return api.sendMessage(
                `❌ Wrong!\n💔 Score: ${userScores[senderID]}`,
                threadID,
                messageID
            );
        }
    }
};
