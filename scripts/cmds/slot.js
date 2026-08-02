module.exports = {
  config: {
    name: "slot",
    version: "5.0",
    author: "OPU",
    shortDescription: { en: "Slot Game" },
    longDescription: { en: "Advanced slot game with clean UI & animation feel" },
    category: "fun",
  },

  langs: {
    en: {
      invalid_amount: "❌ Enter a valid amount",
      not_enough_money: "❌ Not enough balance!",
      spinning: "🎰 Spinning...",
    },
  },

  onStart: async function ({ args, message, event, usersData, getLang, api }) {
    const { senderID } = event;
    const bet = parseInt(args[0]);

    // ❌ invalid input
    if (isNaN(bet) || bet <= 0) {
      return message.reply(getLang("invalid_amount"));
    }

    const userData = await usersData.get(senderID);

    // ❌ not enough money
    if (bet > userData.money) {
      return message.reply(
        `❌ Not enough balance!\n\n💰 Your Balance: $${userData.money}\n💸 You Tried: $${bet}`
      );
    }

    // 💸 cut balance first
    await usersData.set(senderID, {
      money: userData.money - bet,
    });

    const slots = ["🍓","🍆","🍎","🍌","🍍","🥭","🫐","🍊","🍋","🍒"];

    // 🎰 spinning message
    const spinMsg = await message.reply(getLang("spinning"));

    // ⏳ delay for animation feel
    await new Promise(res => setTimeout(res, 1500));

    // 🎲 random slots
    const s1 = rand(slots);
    const s2 = rand(slots);
    const s3 = rand(slots);
    const s4 = rand(slots);

    const win = calc(s1, s2, s3, s4, bet);

    const finalMoney = userData.money - bet + win;

    await usersData.set(senderID, {
      money: finalMoney,
    });

    // 🎯 RESULT UI
    let result = `🎰 𝗦𝗟𝗢𝗧 𝗥𝗘𝗦𝗨𝗟𝗧\n\n`;
    result += `┏━━━━━━━━━━━┓\n`;
    result += `  ${s1} | ${s2} | ${s3} | ${s4}\n`;
    result += `┗━━━━━━━━━━━┛\n`;

    if (win > 0) {
      if (s1 === s2 && s2 === s3 && s3 === s4) {
        result += `\n🔥 𝗝𝗔𝗖𝗞𝗣𝗢𝗧!!! +$${win}`;
      } else {
        result += `\n🎉 𝗪𝗜𝗡: +$${win}`;
      }
    } else {
      result += `\n😢 𝗟𝗢𝗦𝗦: -$${bet}`;
    }

    result += `\n\n💰 𝗕𝗮𝗹𝗮𝗻𝗰𝗲: $${finalMoney}`;

    // 🧹 remove spinning msg
    try {
      await api.unsendMessage(spinMsg.messageID);
    } catch (e) {}

    return message.reply(result);
  },
};

// 🎲 random
function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 🧠 win logic
function calc(a, b, c, d, bet) {
  // jackpot (4 same)
  if (a === b && b === c && c === d) {
    if (a === "🍆" || a === "🍍") return bet * 20;
    return bet * 10;
  }

  // 3 match
  if ((a === b && b === c) || (b === c && c === d)) {
    return bet * 5;
  }

  // 2 match
  if (
    a === b || a === c || a === d ||
    b === c || b === d || c === d
  ) {
    return bet * 2;
  }

  // lose
  return 0;
                   }
