const axios = require("axios"); const fs = require("fs-extra"); const path = require("path");

const baseApiUrl = async () => { const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json"); return base.data.mahmud; };

module.exports = { config: { name: "edit", aliases: ["imgedit"], version: "2.0", author: "OPU", countDown: 10, role: 0, description: { en: "Edit your image using AI prompt" }, category: "image", guide: { en: "{pn} → Reply to an image\nExample: {pn} add sunglasses" } },

langs: { en: { noInput: "Reply to an image with a prompt!", wait: "⏳ Editing image...", success: "✅ Done!\nPrompt: %1", error: "❌ Error: %1" } }, onStart: async function ({ api, event, args, message, getLang }) { const prompt = args.join(" "); const repliedImage = event.messageReply?.attachments?.[0]; if (!prompt || !repliedImage || repliedImage.type !== "photo") { return message.reply(getLang("noInput")); } const cacheDir = path.join(__dirname, "cache"); const imgPath = path.join(cacheDir, `${Date.now()}_edit.jpg`); await fs.ensureDir(cacheDir); const waitMsg = await message.reply(getLang("wait")); try { const res = await axios.post( `${await baseApiUrl()}/api/edit`, { prompt, imageUrl: repliedImage.url }, { responseType: "arraybuffer" } ); await fs.writeFile(imgPath, Buffer.from(res.data)); await message.reply({ body: getLang("success", prompt), attachment: fs.createReadStream(imgPath) }); } catch (err) { console.error(err); return message.reply(getLang("error", err.message)); } finally { if (waitMsg?.messageID) api.unsendMessage(waitMsg.messageID); setTimeout(() => { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); }, 10000); } } 

};
