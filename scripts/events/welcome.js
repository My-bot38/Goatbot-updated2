const { getTime, drive } = global.utils;

module.exports = {
    config: {
        name: "welcome",
        version: "2.0",
        author: "Natking mod by OPu",
        category: "events"
    },

    langs: {
        en: {
            session1: "morning",
            session2: "noon",
            session3: "afternoon",
            session4: "night",
            multiple1: "you",
            multiple2: "everyone",

            // 🤖 When bot joins group
            welcomeMessage:
`🤖 NEXORA AI ONLINE

Hello! I'm NEXORA — your intelligent assistant.
Successfully connected to this group 💫

💡 You can talk to me naturally — no commands needed
⚡ I can help, generate, answer & automate tasks instantly

🚀 Let's make this group smarter together.`,

            // 👥 When user joins
            defaultWelcomeMessage:
`✨ NEXORA AI SYSTEM

🧠 Detecting new user...
✅ Identity confirmed

Welcome {userNameTag} to {boxName} 💫  
Have a great {session} 🌙

🤖 NEXORA is now monitoring this space  
⚡ Smart • Fast • Always Active`
        }
    },

    onStart: async ({ threadsData, message, event, api, getLang }) => {
        if (event.logMessageType !== "log:subscribe")
            return;

        return async function () {
            const { threadID } = event;
            const { addedParticipants } = event.logMessageData;
            if (!addedParticipants || addedParticipants.length === 0)
                return;

            const botID = api.getCurrentUserID();

            // 🤖 Case 1: Bot added
            if (addedParticipants.some(item => item.userFbId == botID)) {
                return message.send(getLang("welcomeMessage"));
            }

            // 👥 Case 2: User joined
            let threadData;
            try {
                threadData = await threadsData.get(threadID);
            } catch (e) {
                return;
            }

            if (!threadData.settings.sendWelcomeMessage)
                return;

            const hours = +getTime("HH");
            const session =
                hours < 10 ? getLang("session1") :
                hours < 12 ? getLang("session2") :
                hours < 18 ? getLang("session3") :
                             getLang("session4");

            const isMultiple = addedParticipants.length > 1;
            const multiple = isMultiple ? getLang("multiple2") : getLang("multiple1");
            const threadName = threadData.threadName;

            let { welcomeMessage = getLang("defaultWelcomeMessage") } = threadData.data;

            const hasMentionTag = welcomeMessage.includes("{userNameTag}");
            const mentions = hasMentionTag
                ? addedParticipants.map(u => ({ tag: u.fullName, id: u.userFbId }))
                : null;

            const namesList = addedParticipants.map(u => u.fullName).join(", ");
            const firstName = addedParticipants[0].fullName;

            welcomeMessage = welcomeMessage
                .replace(/\{userName\}/g, isMultiple ? namesList : firstName)
                .replace(/\{userNameTag\}/g, isMultiple ? namesList : firstName)
                .replace(/\{multiple\}/g, multiple)
                .replace(/\{boxName\}|\{threadName\}/g, threadName)
                .replace(/\{session\}/g, session);

            const form = { body: welcomeMessage };
            if (mentions) form.mentions = mentions;

            // 📎 Attachment support
            if (threadData.data.welcomeAttachment && threadData.data.welcomeAttachment.length > 0) {
                const streams = threadData.data.welcomeAttachment.map(fileId =>
                    drive.getFile(fileId, "stream")
                );
                const settled = await Promise.allSettled(streams);
                form.attachment = settled
                    .filter(({ status }) => status === "fulfilled")
                    .map(({ value }) => value);
            }

            message.send(form);
        };
    }
};
