const { getTime, drive } = global.utils;

module.exports = {
	config: {
		name: "leave",
		version: "2.0",
		author: "natking mod by opu",
		category: "events"
	},

	langs: {
		en: {
			session1: "morning",
			session2: "noon",
			session3: "afternoon",
			session4: "night",

			leaveType1: "disconnected",
			leaveType2: "removed",

			defaultLeaveMessage:
`⚠️ NEXORA AI SYSTEM

🧠 Monitoring activity...
❌ User status changed

{userNameTag} has {type} {boxName}

🕒 Time: {time} ({session})

🤖 NEXORA remains active  
⚡ System stability: Normal`
		}
	},

	onStart: async ({ threadsData, message, event, api, usersData, getLang }) => {
		if (event.logMessageType == "log:unsubscribe")
			return async function () {

				const { threadID } = event;
				const threadData = await threadsData.get(threadID);

				if (!threadData.settings.sendLeaveMessage)
					return;

				const { leftParticipantFbId } = event.logMessageData;

				// ignore if bot leaves
				if (leftParticipantFbId == api.getCurrentUserID())
					return;

				const hours = +getTime("HH");

				const threadName = threadData.threadName;
				const userName = await usersData.getName(leftParticipantFbId);

				let { leaveMessage = getLang("defaultLeaveMessage") } = threadData.data;

				const type = leftParticipantFbId == event.author
					? getLang("leaveType1")   // self leave
					: getLang("leaveType2");  // kicked

				const session =
					hours < 10 ? getLang("session1") :
					hours < 12 ? getLang("session2") :
					hours < 18 ? getLang("session3") :
								 getLang("session4");

				const form = {};

				leaveMessage = leaveMessage
					.replace(/\{userName\}|\{userNameTag\}/g, userName)
					.replace(/\{type\}/g, type)
					.replace(/\{threadName\}|\{boxName\}/g, threadName)
					.replace(/\{time\}/g, hours)
					.replace(/\{session\}/g, session);

				form.body = leaveMessage;

				// mention system
				if (leaveMessage.includes(userName)) {
					form.mentions = [{
						id: leftParticipantFbId,
						tag: userName
					}];
				}

				// attachment support
				if (threadData.data.leaveAttachment && threadData.data.leaveAttachment.length > 0) {
					const files = threadData.data.leaveAttachment;
					const attachments = files.map(file => drive.getFile(file, "stream"));

					const settled = await Promise.allSettled(attachments);
					form.attachment = settled
						.filter(({ status }) => status === "fulfilled")
						.map(({ value }) => value);
				}

				message.send(form);
			};
	}
};
