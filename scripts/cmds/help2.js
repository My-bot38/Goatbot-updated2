const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas"); // npm install canvas
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

const taglines = [
  "Power up your group with Baka-chan!",
  "Commands forged for legends only!",
  "Built for speed, made for you.",
  "Your bot, your power, your rules!",
  "Explore. Command. Conquer.",
];

// ---------------------------------------------------------
// Draws a rounded rectangle path (used everywhere below)
// ---------------------------------------------------------
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ---------------------------------------------------------
// Draws glowing neon text
// ---------------------------------------------------------
function glowText(ctx, text, x, y, { font, fill, glow, glowBlur = 20, align = "left" }) {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = align;
  ctx.shadowColor = glow;
  ctx.shadowBlur = glowBlur;
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ---------------------------------------------------------
// Builds the actual menu image and returns a PNG buffer
// ---------------------------------------------------------
async function buildMenuImage({ prefix, role, botName = "NEXORA Ai", ownerName = "OPUSENSEi" }) {
  // ---- gather + group commands by category ----
  const categories = {};
  for (const [name, value] of commands) {
    if (value.config.role > 1 && role < value.config.role) continue;
    const key = (value.config.category || "Uncategorized").trim().toUpperCase();
    categories[key] = categories[key] || [];
    categories[key].push(name);
  }
  const sortedCategories = Object.keys(categories).sort();
  const totalCommands = commands.size;
  const tagline = taglines[Math.floor(Math.random() * taglines.length)];

  // ---- layout constants (scaled up ~1.35x from the original) ----
  const width = 1220;
  const padding = 65;
  const lineHeight = 40;
  const headerHeight = 200;
  const footerHeight = 160;

  // pre-measure how tall the category block will be (rough estimate,
  // ~ 55 chars per line at this larger font size)
  let bodyLines = 0;
  const catLines = {};
  sortedCategories.forEach((cat) => {
    const names = categories[cat].sort().map((c) => `◍${c}`).join("  ");
    const wrapped = Math.ceil(names.length / 55) || 1;
    catLines[cat] = wrapped;
    bodyLines += wrapped + 1.4; // +1.4 for the category header row
  });
  const bodyHeight = Math.max(270, bodyLines * lineHeight + 55);
  const height = headerHeight + bodyHeight + footerHeight;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // ---- background gradient (deep navy -> electric blue) ----
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#050b24");
  bg.addColorStop(0.5, "#0a1854");
  bg.addColorStop(1, "#123a8f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // ---- outer card panel ----
  const cardX = 32, cardY = 32, cardW = width - 64, cardH = height - 64;
  const panel = ctx.createLinearGradient(0, cardY, 0, cardY + cardH);
  panel.addColorStop(0, "rgba(10, 20, 60, 0.85)");
  panel.addColorStop(1, "rgba(5, 10, 35, 0.9)");
  ctx.fillStyle = panel;
  roundRect(ctx, cardX, cardY, cardW, cardH, 28);
  ctx.fill();
  ctx.strokeStyle = "rgba(0, 220, 255, 0.35)";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // ---- header: bolt icon + title ----
  glowText(ctx, "⚡", cardX + 48, cardY + 104, {
    font: "80px sans-serif",
    fill: "#38e0ff",
    glow: "#00c8ff",
    glowBlur: 30,
  });
  glowText(ctx, botName, cardX + 135, cardY + 104, {
    font: "bold 64px sans-serif",
    fill: "#ffffff",
    glow: "#33d6ff",
    glowBlur: 28,
  });
  ctx.font = "27px sans-serif";
  ctx.fillStyle = "#8fd6ff";
  ctx.textAlign = "left";
  ctx.fillText(tagline, cardX + 48, cardY + 156);

  // divider
  ctx.strokeStyle = "rgba(0, 200, 255, 0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cardX + 40, cardY + headerHeight - 20);
  ctx.lineTo(cardX + cardW - 40, cardY + headerHeight - 20);
  ctx.stroke();

  // ---- body: categories ----
  let cursorY = cardY + headerHeight + 27;
  sortedCategories.forEach((cat) => {
    glowText(ctx, `◉ ${cat}`, cardX + 48, cursorY, {
      font: "bold 30px sans-serif",
      fill: "#38e0ff",
      glow: "#00c8ff",
      glowBlur: 18,
    });
    cursorY += lineHeight - 5;

    const names = categories[cat].sort().map((c) => `◍${c}`);
    // wrap manually at ~55 chars (font is bigger now, so fewer chars per line)
    let line = "";
    const wrappedLines = [];
    names.forEach((n) => {
      if ((line + " " + n).trim().length > 55) {
        wrappedLines.push(line.trim());
        line = n;
      } else {
        line += " " + n;
      }
    });
    if (line.trim()) wrappedLines.push(line.trim());

    ctx.font = "24px sans-serif";
    ctx.fillStyle = "#d6f0ff";
    wrappedLines.forEach((wl) => {
      ctx.fillText(wl, cardX + 68, cursorY);
      cursorY += lineHeight;
    });
    cursorY += 8;
  });

  // ---- footer: stats box ----
  const footerY = cardY + cardH - footerHeight + 27;
  ctx.strokeStyle = "rgba(0, 200, 255, 0.4)";
  ctx.beginPath();
  ctx.moveTo(cardX + 40, footerY - 20);
  ctx.lineTo(cardX + cardW - 40, footerY - 20);
  ctx.stroke();

  ctx.font = "27px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.fillText(`⬤ Total cmds: ${totalCommands}`, cardX + 48, footerY + 27);
  ctx.fillText(`⬤ Type "${prefix}help <cmd>" for usage`, cardX + 48, footerY + 67);
  ctx.fillText(`⬤ Owner: ${ownerName}`, cardX + 48, footerY + 107);

  ctx.textAlign = "center";
  ctx.font = "21px sans-serif";
  ctx.fillStyle = "#66c9ff";
  ctx.fillText(`Powered by ${ownerName} ⚡`, cardX + cardW / 2, cardY + cardH - 19);

  return canvas.toBuffer("image/png");
}

// ---------------------------------------------------------
// Builds a single-command detail image
// ---------------------------------------------------------
async function buildCommandImage({ configCommand, prefix, roleText }) {
  const width = 1080;
  const height = 570;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#050b24");
  bg.addColorStop(1, "#123a8f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  roundRect(ctx, 27, 27, width - 54, height - 54, 27);
  ctx.fillStyle = "rgba(10, 20, 60, 0.85)";
  ctx.fill();
  ctx.strokeStyle = "rgba(0, 220, 255, 0.35)";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  glowText(ctx, "COMMAND INFO", width / 2, 108, {
    font: "bold 46px sans-serif",
    fill: "#ffffff",
    glow: "#33d6ff",
    glowBlur: 27,
    align: "center",
  });

  const longDescription = configCommand.longDescription?.en || "No description";
  const guideBody = configCommand.guide?.en || "No guide available.";
  const usage = guideBody.replace(/{p}/g, prefix).replace(/{n}/g, configCommand.name);

  const rows = [
    ["📌 Name", configCommand.name],
    ["📖 Description", longDescription],
    ["📂 Aliases", configCommand.aliases ? configCommand.aliases.join(", ") : "None"],
    ["⚙️ Version", configCommand.version || "1.0"],
    ["🛡️ Role", roleText],
    ["⏱️ Cooldown", `${configCommand.countDown || 1}s`],
    ["👤 Author", configCommand.author || "Unknown"],
    ["💡 Usage", usage],
  ];

  let y = 189;
  ctx.textAlign = "left";
  rows.forEach(([label, value]) => {
    ctx.font = "bold 24px sans-serif";
    ctx.fillStyle = "#38e0ff";
    ctx.fillText(label, 68, y);
    ctx.font = "24px sans-serif";
    ctx.fillStyle = "#e6f6ff";
    ctx.fillText(String(value), 338, y);
    y += 43;
  });

  return canvas.toBuffer("image/png");
}

module.exports = {
  config: {
    name: "help2",
    version: "3.0",
    author: "OPU",
    countDown: 5,
    role: 0,
    shortDescription: { en: "View all commands or details about one (image UI)" },
    longDescription: { en: "Browse the full list of commands or check detailed usage for a specific one, rendered as an image." },
    category: "info",
    guide: { en: "{pn} / help <cmdName>" },
    priority: 1,
  },

  onStart: async function ({ message, args, event, role }) {
    const { threadID } = event;
    const prefix = getPrefix(threadID);

    const tmpDir = path.join(process.cwd(), "cache");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    if (args.length === 0) {
      const buffer = await buildMenuImage({ prefix, role });
      const filePath = path.join(tmpDir, `help_menu_${Date.now()}.png`);
      fs.writeFileSync(filePath, buffer);

      return message.reply({
        attachment: fs.createReadStream(filePath),
      }).then(() => fs.unlink(filePath, () => {}));
    }

    const commandName = args[0].toLowerCase();
    const command = commands.get(commandName) || commands.get(aliases.get(commandName));
    if (!command) {
      return message.reply(`⚠️ Command "${commandName}" not found.`);
    }

    const configCommand = command.config;
    const roleText = roleTextToString(configCommand.role);

    const buffer = await buildCommandImage({ configCommand, prefix, roleText });
    const filePath = path.join(tmpDir, `help_cmd_${Date.now()}.png`);
    fs.writeFileSync(filePath, buffer);

    return message.reply({
      attachment: fs.createReadStream(filePath),
    }).then(() => fs.unlink(filePath, () => {}));
  },
};

function roleTextToString(roleText) {
  switch (roleText) {
    case 0: return "0 - All Users";
    case 1: return "1 - Group Admins";
    case 2: return "2 - Bot Admins";
    case 3: return "3 - Super Admins";
    default: return "Unknown role";
  }
}
