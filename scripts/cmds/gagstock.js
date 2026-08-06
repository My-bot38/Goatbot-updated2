const axios = require("axios");
const WebSocket = require("ws");

const activeSessions = new Map();
const lastSentCache = new Map();
const favoriteMap = new Map();
const globalLastSeen = new Map();

let sharedWebSocket = null;
let keepAliveInterval = null;
let connecting = false;

// Utility functions
function formatValue(val) {
  if (val >= 1_000_000) return `x${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `x${(val / 1_000).toFixed(1)}K`;
  return `x${val}`;
}

function getPHTime() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
}

function cleanText(text) {
  if (!text) return "";
  return String(text).trim().toLowerCase();
}

function ensureWebSocketConnection() {
  if (connecting) return;
  if (sharedWebSocket && sharedWebSocket.readyState === WebSocket.OPEN) return;

  connecting = true;
  sharedWebSocket = new WebSocket("wss://gagstock.gleeze.com");

  sharedWebSocket.on("open", () => {
    connecting = false;
    if (keepAliveInterval) clearInterval(keepAliveInterval);
    keepAliveInterval = setInterval(() => {
      try {
        if (sharedWebSocket && sharedWebSocket.readyState === WebSocket.OPEN) {
          sharedWebSocket.send("ping");
        }
      } catch {}
    }, 10000);
    console.log("[gagstock] websocket opened");
  });

  sharedWebSocket.on("close", () => {
    if (keepAliveInterval) clearInterval(keepAliveInterval);
    sharedWebSocket = null;
    connecting = false;
    setTimeout(ensureWebSocketConnection, 3000);
  });

  sharedWebSocket.on("error", () => {
    try { sharedWebSocket.close(); } catch {}
  });
}

module.exports = {
  config: {
    name: "gagstock",
    version: "1.0",
    author: "OPU SENSEI",
    countDown: 5,
    role: 0,
    shortDescription: "Track Grow A Garden stock",
    category: "utility",
    guide: {
      en: "gagstock on | gagstock off | gagstock fav add <item> | gagstock lastseen | gagstock predict"
    }
  },

  onStart: async function({ message, args }) {
    const senderId = message.senderID;
    const subcmd = args[0]?.toLowerCase();

    if (subcmd === "off") {
      if (!activeSessions.has(senderId)) {
        return message.reply("⚠️ You don't have an active gagstock session.");
      }
      activeSessions.delete(senderId);
      lastSentCache.delete(senderId);
      return message.reply("🛑 Gagstock tracking stopped.");
    }

    if (subcmd === "on") {
      if (activeSessions.has(senderId)) {
        return message.reply("📡 You're already tracking Gagstock. Use gagstock off to stop.");
      }
      activeSessions.set(senderId, {});
      ensureWebSocketConnection();
      return message.reply("✅ Gagstock tracking started via WebSocket!");
    }

    if (subcmd === "fav") {
      const action = args[1]?.toLowerCase();
      const input = args.slice(2).join(" ").split("|").map(i => cleanText(i)).filter(Boolean);
      if (!action || !["add", "remove"].includes(action) || input.length === 0) {
        return message.reply("📌 Usage: gagstock fav add/remove Item1 | Item2");
      }
      const currentFav = favoriteMap.get(senderId) || [];
      const updated = new Set(currentFav);
      for (const name of input) {
        if (action === "add") updated.add(name);
        else if (action === "remove") updated.delete(name);
      }
      favoriteMap.set(senderId, Array.from(updated));
      return message.reply(`✅ Favorite list updated: ${Array.from(updated).join(", ") || "(empty)"}`);
    }

    if (subcmd === "lastseen") {
      return message.reply("📦 Last Seen feature not implemented yet.");
    }

    if (subcmd === "predict") {
      return message.reply("🔮 Predict feature not implemented yet.");
    }

    return message.reply("📌 Usage:\n• gagstock on\n• gagstock off\n• gagstock fav add Carrot | Watering Can\n• gagstock lastseen\n• gagstock predict");
  }
};
