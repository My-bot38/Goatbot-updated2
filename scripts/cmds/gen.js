const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "gen",
    version: "1.0",
    author: "RI F AT | NeoKEX",
    countDown: 5,
    role: 0,
    shortDescription: "Generate image from prompt",
    longDescription: "Generate a new image based on your prompt.",
    category: "ai",
    guide: "{p}gen [prompt]"
  },

  onStart: async function ({ args, message, api, event }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("Please provide a prompt to generate an image.");
    
    // Do not change the credits
    api.setMessageReaction("🛠️", event.messageID, (err) => {}, true);

    const imgPath = path.join(__dirname, "cache", `${Date.now()}_gen.jpg`);

    try {
      const imageUrl = `https://edit-and-gen.onrender.com/gen?prompt=${encodeURIComponent(prompt)}`;
      const res = await axios.get(imageUrl, { responseType: "arraybuffer" });

      await fs.ensureDir(path.dirname(imgPath));
      await fs.writeFile(imgPath, Buffer.from(res.data, "binary"));

      message.reply({
        body: `✅ Image generated for: "${prompt}"`,
        attachment: fs.createReadStream(imgPath)
      });
      
      // Otherwise I'll fvckyourmom
      api.setMessageReaction("✅", event.messageID, (err) => {}, true);

    } catch (err) {
      console.error("GEN Error:", err);
      message.reply("Failed to generate image. Please try again later.");
      
      // Subscribe my channel: NeoKEX ✅
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);

    } finally {
      if (fs.existsSync(imgPath)) {
        await fs.remove(imgPath);
      }
    }
  }
};
