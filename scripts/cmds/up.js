const os = require("os");
const { execSync } = require("child_process");
const puppeteer = require("puppeteer");
const fs = require("fs");

function formatBytes(bytes) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Bytes";
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
}

async function generateImage(data) {
  const html = `
  <html>
  <head>
  <style>
  body {
    margin:0;
    height:100vh;
    display:flex;
    justify-content:center;
    align-items:center;
    background:#020617;
    font-family: Arial;
  }

  .card {
    width:360px;
    padding:20px;
    border-radius:20px;
    background:rgba(0,0,0,0.6);
    color:white;
    backdrop-filter: blur(15px);
    box-shadow:0 0 30px cyan;
    animation: float 4s infinite;
  }

  @keyframes float {
    0% { transform:translateY(0px); }
    50% { transform:translateY(-10px); }
    100% { transform:translateY(0px); }
  }

  .title {
    color:cyan;
    font-size:22px;
    margin-bottom:10px;
  }

  .bar {
    height:10px;
    background:#333;
    border-radius:10px;
    margin:8px 0;
  }

  .fill {
    height:100%;
    background:cyan;
    border-radius:10px;
  }

  </style>
  </head>

  <body>
    <div class="card">
      <div class="title">⚡ BOT STATUS</div>
      <p>⏳ ${data.uptime}</p>
      <p>👥 Users: ${data.users}</p>
      <p>🖥 CPU: ${data.cpu}</p>

      <div class="bar"><div class="fill" style="width:${data.ram}%"></div></div>
      <p>RAM: ${data.ram}%</p>

      <div class="bar"><div class="fill" style="width:${data.disk}%"></div></div>
      <p>Disk: ${data.disk}%</p>
    </div>
  </body>
  </html>
  `;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setContent(html);
  await page.setViewport({ width: 400, height: 300 });

  await page.screenshot({ path: "uptime.png" });

  await browser.close();
}

module.exports = {
  config: {
    name: "uptime",
    aliases: ["up"],
    version: "2.0",
    author: "OPUSENSEI",
    shortDescription: "Premium uptime UI",
    category: "info"
  },

  onStart: async function ({ message, threadsData, usersData }) {
    try {
      const uptimeSec = process.uptime();
      const hours = Math.floor(uptimeSec / 3600);
      const minutes = Math.floor((uptimeSec % 3600) / 60);
      const seconds = Math.floor(uptimeSec % 60);

      const uptime = `${hours}H ${minutes}M ${seconds}S`;

      const users = (await usersData.getAll()).length;

      const totalMem = os.totalmem();
      const usedMem = totalMem - os.freemem();
      const memUsage = Math.round((usedMem / totalMem) * 100);

      let diskPercent = 0;

      try {
        const df = execSync("df -k /").toString().split("\n")[1].split(/\s+/);
        const used = parseInt(df[2]);
        const total = parseInt(df[1]);
        diskPercent = Math.round((used / total) * 100);
      } catch {}

      await generateImage({
        uptime,
        users,
        cpu: os.cpus()[0].model,
        ram: memUsage,
        disk: diskPercent
      });

      message.reply({
        body: "💎 Premium Uptime UI",
        attachment: fs.createReadStream("uptime.png")
      });

    } catch (err) {
      console.error(err);
      message.reply("❌ Error generating uptime UI");
    }
  }
};
