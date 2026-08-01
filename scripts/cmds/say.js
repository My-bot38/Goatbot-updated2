const axios = require("axios")

const baseApiUrl = async () => {
  try {
    const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json")
    return base.data.mahmud
  } catch (e) {
    return "https://api.mahmudx7.xyz"
  }
}

module.exports = {
  config: {
    name: "say",
    version: "2.0",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    category: "media",
    guide: "{pn} <text> (or reply to a message)"
  },

  onStart: async function ({ api, message, args, event }) {
    try {
      let text = args.join(" ")

      if (event.type === "message_reply" && event.messageReply && event.messageReply.body) {
        text = event.messageReply.body
      }

      if (!text) {
        return message.reply("⚠️ Please write something or reply!")
      }

      const baseUrl = await baseApiUrl()

      const response = await axios({
        url: baseUrl + "/api/say",
        method: "GET",
        params: { text: text },
        headers: {
          Author: "MahMUD"
        },
        responseType: "stream",
        timeout: 60000
      })

      return message.reply({
        attachment: response.data
      })

    } catch (e) {
      return message.reply("❌ Error: " + e.message)
    }
  }
}
