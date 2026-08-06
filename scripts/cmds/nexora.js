const axios = require("axios");

/* ===============================
   🔧 CONFIG
================================*/
const CONFIG = {
  NAME: "Nexora AI",
  TRIGGER: "nexora",
  MAX_MEMORY: 20,
  COOLDOWN: 4000,

  API_KEY: "",
  MODEL: "openrouter/free",
  FALLBACK_MODEL: "mistralai/mistral-7b"
};

/* ===============================
   🌐 INIT
================================*/
function init() {
  if (!global.nexora) {
    global.nexora = {
      memory: {},
      stats: { total: 0, users: {} },
      cooldown: {}
    };
  }
}

/* ===============================
   🧠 MEMORY
================================*/
const Memory = {
  get(id) {
    if (!global.nexora.memory[id]) global.nexora.memory[id] = [];
    return global.nexora.memory[id];
  },
  add(id, role, content) {
    const m = this.get(id);
    m.push({ role, content });
    if (m.length > CONFIG.MAX_MEMORY) m.shift();
  },
  clear(id) {
    global.nexora.memory[id] = [];
  }
};

/* ===============================
   📊 STATS
================================*/
const Stats = {
  add(id) {
    global.nexora.stats.total++;
    global.nexora.stats.users[id] = (global.nexora.stats.users[id] || 0) + 1;
  }
};

/* ===============================
   🚫 COOLDOWN
================================*/
const Cooldown = {
  check(id) {
    const now = Date.now();
    const cd = global.nexora.cooldown;
    if (cd[id] && now - cd[id] < CONFIG.COOLDOWN) return true;
    cd[id] = now;
    return false;
  }
};

/* ===============================
   🎨 IMAGE GENERATOR
================================*/
async function generateImage(prompt) {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
}

/* ===============================
   🤖 AI
================================*/
const AI = {
  async ask(messages) {
    try {
      const res = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: CONFIG.MODEL,
          messages
        },
        {
          headers: {
            Authorization: `Bearer ${CONFIG.API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );
      return res.data.choices[0].message.content;
    } catch {
      const res = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: CONFIG.FALLBACK_MODEL,
          messages
        },
        {
          headers: {
            Authorization: `Bearer ${CONFIG.API_KEY}`
          }
        }
      );
      return res.data.choices[0].message.content;
    }
  },

  system() {
    return {
      role: "system",
      content: `
You are Nexora AI 🤖
Smart, futuristic, confident 😏
Reply short, clean, powerful
      `
    };
  }
};

/* ===============================
   🎨 UI
================================*/
function format(reply, id) {
  return `╭━━〔 ✨ NEXORA AI 〕━━╮

${reply}

┣━━ 🧠 ${Memory.get(id).length}/${CONFIG.MAX_MEMORY}
┣━━ 📊 ${global.nexora.stats.total}
╰━━ ⚡ Elite`;
}

/* ===============================
   📦 EXPORT
================================*/
module.exports = {
  config: {
    name: "nexora",
    version: "ULTIMATE",
    author: "OPUSENSEI",
    category: "ai"
  },

  // 🔥 PREFIX
  async onStart({ message, args, event }) {
    init();

    const id = event.senderID;
    const input = args.join(" ").trim();

    if (!input) return message.reply("⚠️ Ask something.");

    // 🧹 clear
    if (input === "clear") {
      Memory.clear(id);
      return message.reply("🧹 Memory cleared.");
    }

    // 🖼️ IMAGE
    if (input.toLowerCase().startsWith("gen image")) {
      const prompt = input.replace(/gen image/i, "").trim();
      if (!prompt) return message.reply("⚠️ prompt dao");

      const img = await generateImage(prompt);
      return message.reply(`🖼️ Image:\n${img}`);
    }

    if (Cooldown.check(id)) return;

    Memory.add(id, "user", input);
    Stats.add(id);

    const loading = await message.reply("🤖 Thinking...");

    try {
      const reply = await AI.ask([
        AI.system(),
        ...Memory.get(id)
      ]);

      Memory.add(id, "assistant", reply);

      return message.edit(format(reply, id), loading.messageID);

    } catch {
      return message.edit("❌ API error", loading.messageID);
    }
  },

  // 🤖 AUTO
  async onChat({ event, message }) {
    init();

    if (!event.body) return;

    const text = event.body.toLowerCase();
    const id = event.senderID;

    if (!text.includes(CONFIG.TRIGGER)) return;

    // 🎨 AUTO IMAGE
    if (text.includes("gen image")) {
      const prompt = text.replace("nexora", "").replace("gen image", "").trim();
      if (!prompt) return;

      const img = await generateImage(prompt);
      return message.reply(`🖼️ ${img}`);
    }

    if (Cooldown.check(id)) return;

    Memory.add(id, "user", event.body);

    try {
      const reply = await AI.ask([
        AI.system(),
        ...Memory.get(id)
      ]);

      Memory.add(id, "assistant", reply);

      return message.reply("🤖 " + reply);

    } catch {}
  }
};
