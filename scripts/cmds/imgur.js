const axios = require("axios");

const apikey = "66e0cfbb-62b8-4829-90c7-c78cacc72ae2";

module.exports = {
  config: {
    name: "imgur",
    version: "1.0",
    author: "nexo_here",
    category: "image",
    shortDescription: "Upload replied image to Imgur & get link",
    longDescription: "Reply to an image with this command to get its Imgur link",
    guide: "{pn}imgur (reply to an image)"
  },

  onStart: async function ({ api, event }) {
    try {
      if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
        return api.sendMessage("❌ Please reply to an image.", event.threadID, event.messageID);
      }

      const imageUrl = event.messageReply.attachments[0].url;
      const apiUrl = `https://kaiz-apis.gleeze.com/api/imgur?url=${encodeURIComponent(imageUrl)}&apikey=${apikey}`;

      const response = await axios.get(apiUrl);
      const data = response.data;

      if (data.uploaded && data.uploaded.status === "success" && data.uploaded.image) {
        return api.sendMessage(`✅ Uploaded successfully!\n\nLink:\n${data.uploaded.image}`, event.threadID, event.messageID);
      } else {
        return api.sendMessage("❌ Upload failed.", event.threadID, event.messageID);
      }
    } catch (error) {
      console.error("imgur command error:", error);
      return api.sendMessage("❌ Something went wrong.", event.threadID, event.messageID);
    }
  }
};