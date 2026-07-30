const axios = require("axios");
const fs = require("fs");
const path = require("path");

const apiKey = "66e0cfbb-62b8-4829-90c7-c78cacc72ae2";
let searchCache = {};

module.exports = {
  config: {
    name: "sing",
    version: "1.1",
    role: 0,
    author: "opu",
    category: "media",
    shortDescription: "Search and play SoundCloud songs",
    longDescription: "Searches for a song using SoundCloud API and lets you play any of the top 4 results",
    guide: "{pn} <song name>"
  },

  onStart: async function ({ api, event, args }) {
    const query = args.join(" ");
    if (!query) return api.sendMessage("❌ Please enter a song title.", event.threadID, event.messageID);

    const searchUrl = `https://kaiz-apis.gleeze.com/api/soundcloud-search?title=${encodeURIComponent(query)}&apikey=${apiKey}`;

    try {
      const res = await axios.get(searchUrl);
      const results = res.data?.results;

      if (!results || results.length === 0) {
        return api.sendMessage("❌ No songs found.", event.threadID, event.messageID);
      }

      const top4 = results.slice(0, 4);
      let msg = `🎵 Search results for: "${query}"\n\n`;

      top4.forEach((song, index) => {
        msg += `${index + 1}. ${song.title} — ${song.artist} (${song.duration})\n`;
      });

      msg += `\nReply with a number (1-4) to play the song.`;
      searchCache[event.senderID] = top4;

      return api.sendMessage(msg, event.threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "sing",
          author: event.senderID,
          messageID: info.messageID // store for unsend
        });
      });

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ Failed to fetch songs.", event.threadID, event.messageID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    if (event.senderID !== Reply.author) return;

    const choice = parseInt(event.body);
    if (isNaN(choice) || choice < 1 || choice > 4) {
      return api.sendMessage("❌ Please reply with a number between 1 and 4.", event.threadID, event.messageID);
    }

    const selected = searchCache[event.senderID][choice - 1];
    if (!selected) return api.sendMessage("❌ Song not found in cache.", event.threadID, event.messageID);

    const dlUrl = `https://kaiz-apis.gleeze.com/api/soundcloud-dl?url=${encodeURIComponent(selected.url)}&apikey=${apiKey}`;

    try {
      const dlRes = await axios.get(dlUrl);
      const audioUrl = dlRes.data?.downloadUrl;
      const title = dlRes.data?.title || selected.title;

      if (!audioUrl) return api.sendMessage("❌ Couldn't fetch download URL.", event.threadID, event.messageID);

      const filePath = path.join(__dirname, "tmp", `${Date.now()}.mp3`);
      const writer = fs.createWriteStream(filePath);

      const audioStream = await axios({
        url: audioUrl,
        method: "GET",
        responseType: "stream"
      });

      audioStream.data.pipe(writer);

      writer.on("finish", () => {
        // Unsend the search message before sending the audio
        api.unsendMessage(Reply.messageID, (err) => {
          if (err) console.log("⚠️ Failed to unsend search message:", err);

          api.sendMessage({
            body: `🎶 Now Playing: ${title}`,
            attachment: fs.createReadStream(filePath)
          }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);
        });
      });

      writer.on("error", () => {
        return api.sendMessage("❌ Failed to download song.", event.threadID, event.messageID);
      });

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ Error playing the song.", event.threadID, event.messageID);
    }
  }
};