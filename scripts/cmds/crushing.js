const axios = require("axios");

module.exports = {
  config: {
    name: "crushimg",
    version: "2.0",
    author: "OPUSENSEI",
    countDown: 5,
    role: 0,
    shortDescription: "✨ AI Image Generator",
    longDescription: "Generate high-quality AI images using crushimg",
    category: "ai"
  },

  onStart: async function ({ message, args }) {

    const prompt = args.join(" ");
    if (!prompt) {
      return message.reply("⚠️ | Please provide a prompt!\n\nExample:\ncrushimg anime girl in dress");
    }

    const loading = await message.reply("⏳ | Generating your image... Please wait...");

    try {
      const apiUrl = `https://ceddsrestapi.vercel.app/imagegen/crushimg?prompt=${encodeURIComponent(prompt)}`;

      // retry system (2 times)
      let response;
      for (let i = 0; i < 2; i++) {
        try {
          response = await axios.get(apiUrl);
          break;
        } catch (err) {
          if (i === 1) throw err;
        }
      }

      const imageUrl = response.data?.image || response.data?.url || response.data;

      if (!imageUrl || typeof imageUrl !== "string") {
        return message.reply("❌ | Failed to get image from API.");
      }

      return message.reply({
        body: `✨ | Image Generated Successfully!\n\n📝 Prompt: ${prompt}`,
        attachment: await global.utils.getStreamFromURL(imageUrl)
      });

    } catch (error) {
      console.error("CRUSHIMG ERROR:", error.message);

      return message.reply("❌ | Something went wrong while generating image.\nTry again later.");
    }
  }
};
