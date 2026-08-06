module.exports = {
  config: {
    name: "upj",
    aliases: ["jup"],
    version: "1.7",
    author: "ncs pro",
    role: 0,
    category: "system",
    guide: {
      en: "Use {p}uptime to display bot's uptime and user stats."
    }
  },

  onStart: async function ({ api, event, usersData, threadsData }) {
    try {
      const allUsers = await usersData.getAll();
      const allThreads = await threadsData.getAll();
      const uptime = process.uptime();

      const days = Math.floor(uptime / (60 * 60 * 24));
      const hours = Math.floor((uptime % (60 * 60 * 24)) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);

      const uptimeString = `${days}𝗱𝗮𝘆𝘀 ${hours}𝗵𝗼𝘂𝗿𝘀 ${minutes}𝗠𝗶𝗻`;

      const msg = 
`╭─🎀 𝗷𝗲𝗿𝗿𝘆 𝘂𝗽𝘁𝗶𝗺𝗲💘༒|
│
├🚮 𝗨𝗽𝘁𝗶𝗺𝗲: ${uptimeString}  
├🤰🏾  𝘂𝘀𝗲𝗿𝘀 💘: ${allUsers.length.toLocaleString()}  
├🦆 𝗚𝗿𝗼𝘂𝗽𝘀: ${allThreads.length.toLocaleString()}  
│
╰───────────────◉`;

      api.sendMessage(msg, event.threadID, event.messageID);
    } catch (error) {
      console.error(error);
      api.sendMessage("An error occurred while retrieving uptime or user data.", event.threadID, event.messageID);
    }
  }
};
