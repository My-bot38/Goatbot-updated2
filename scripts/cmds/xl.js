module.exports = {
  config: {
    name: 'xl',
    version: '1.0',
    author: 'Team Calyx',
    countDown: 10,
    role: 0,
    longDescription: {
      en: 'Generate an image from text using SDXL.'
    },
    category: 'ai',
    guide: {
      en: '{pn} prompt [--ar=<ratio>] or [==ar <ratio>]'
    }
  },

  onStart: async function ({ message, api, args, event }) {
    const promptText = args.join(' ');

    if (!promptText) {
      return message.reply(`😖 Please enter a text prompt\nExample: \n${global.GoatBot.config.prefix}xl a cat or,\n${global.GoatBot.config.prefix}xl a girl --ar 2:3`);
    }

    let ratio = '1:1';

    const ratioIndex = args.findIndex(arg => arg.startsWith('--ar='));
    if (ratioIndex !== -1) {
      ratio = args[ratioIndex].split('=')[1];
      args.splice(ratioIndex, 1);
    } else {
      const ratioFlagIndex = args.findIndex(arg => arg === '--ar');
      if (ratioFlagIndex !== -1 && args[ratioFlagIndex + 1]) {
        ratio = args[ratioFlagIndex + 1];
        args.splice(ratioFlagIndex, 2); 
      }
    }

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const startTime = new Date().getTime();

    try {
      const prompt = args.join(' ');
      const world = `&ratio=${ratio}`;
      const team = `xl31?prompt=${encodeURIComponent(prompt)}${world}`;
        const o = "xyz";
      const imageURL = `https://smfahim.${o}/${team}`;
      const attachment = await global.utils.getStreamFromURL(imageURL);

      const endTime = new Date().getTime();
      const timeTaken = (endTime - startTime) / 1000;

      message.reply({
        body: `Here is your XL Model 🖼\nTime taken: ${timeTaken} seconds`,
        attachment: attachment
      });

      api.setMessageReaction("✅", event.messageID, () => {}, true);

    } catch (error) {
      console.error(error);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};
