const Canvas = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

module.exports = {
  config: {
    name: "uptime",
    version: "10.0",
    author: "OPUSENSEI GLASS UI",
    shortDescription: "Glassmorphism uptime UI",
    category: "info"
  },

  onStart: async function ({ message, usersData }) {
    try {

      // ⏱ Uptime
      const t = process.uptime();
      const uptime = `${Math.floor(t/3600)}H ${Math.floor((t%3600)/60)}M ${Math.floor(t%60)}S`;

      const users = (await usersData.getAll()).length;

      const totalMem = os.totalmem();
      const usedMem = totalMem - os.freemem();
      const ram = Math.round((usedMem / totalMem) * 100);

      let disk = 0;
      try {
        const df = execSync("df -k /").toString().split("\n")[1].split(/\s+/);
        disk = Math.round(parseInt(df[2]) / parseInt(df[1]) * 100);
      } catch {}

      // 🎨 Canvas
      const width = 1200;
      const height = 650;
      const canvas = Canvas.createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // 🌌 Gradient BG
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, "#0f2027");
      bg.addColorStop(0.5, "#203a43");
      bg.addColorStop(1, "#2c5364");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // 💡 Soft glow orbs (fake blur)
      function glow(x, y, r, color) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, color);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      glow(200, 150, 200, "rgba(0,255,255,0.15)");
      glow(1000, 500, 250, "rgba(0,150,255,0.15)");

      // 🧊 Glass Card
      const cardX = 100;
      const cardY = 80;
      const cardW = 1000;
      const cardH = 500;

      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 30);
      ctx.fillStyle = "rgba(255,255,255,0.08)"; // glass
      ctx.fill();

      // ✨ Glass Border
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 🔥 Inner glow
      ctx.shadowColor = "#00f7ff";
      ctx.shadowBlur = 30;
      ctx.strokeStyle = "#00f7ff";
      ctx.stroke();

      // ⚡ Title
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#00f7ff";
      ctx.font = "bold 58px Arial";
      ctx.fillText("⚡ SYSTEM STATUS", cardX + 60, cardY + 100);

      // 📊 Info text
      ctx.shadowBlur = 5;
      ctx.fillStyle = "#eaffff";
      ctx.font = "30px Arial";

      ctx.fillText(`⏳ Uptime: ${uptime}`, cardX + 80, cardY + 180);
      ctx.fillText(`👥 Users: ${users}`, cardX + 80, cardY + 240);
      ctx.fillText(`🖥 CPU: ${os.cpus()[0].model}`, cardX + 80, cardY + 300);

      // 🔥 Glass bars
      function drawBar(y, percent, label) {
        const barX = cardX + 80;
        const barW = 800;
        const barH = 26;

        // track
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.beginPath();
        ctx.roundRect(barX, y, barW, barH, 20);
        ctx.fill();

        // fill glow
        const grad = ctx.createLinearGradient(barX, y, barX + barW, y);
        grad.addColorStop(0, "#00f7ff");
        grad.addColorStop(1, "#007bff");

        ctx.fillStyle = grad;
        ctx.shadowColor = "#00f7ff";
        ctx.shadowBlur = 20;

        ctx.beginPath();
        ctx.roundRect(barX, y, barW * (percent/100), barH, 20);
        ctx.fill();

        // text
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#00f7ff";
        ctx.font = "26px Arial";
        ctx.fillText(`${label} ${percent}%`, barX, y - 10);
      }

      drawBar(cardY + 350, ram, "RAM");
      drawBar(cardY + 420, disk, "Disk");

      // ⚡ Footer
      ctx.fillStyle = "#00f7ff";
      ctx.font = "24px Arial";
      ctx.fillText(
        "Powered by OPUSENSEI ⚡",
        cardX + cardW/2 - 150,
        cardY + cardH - 25
      );

      // 💾 Save
      const filePath = path.join(__dirname, "cache", "uptime.png");
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, canvas.toBuffer());

      return message.reply({
        body: "🧊 Glass UI Uptime",
        attachment: fs.createReadStream(filePath)
      });

    } catch (err) {
      console.error(err);
      message.reply("❌ Glass UI error");
    }
  }
};
