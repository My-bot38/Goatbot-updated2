module.exports = {
  config: {
    name: "slot",
    version: "4.0",
    author: "OPU (Fixed)",
    shortDescription: { en: "Slot game" },
    longDescription: { en: "Advanced Slot game with jackpot + animation." },
    category: "fun",
  },

  langs: {
    en: {
      invalid_amount: "❌ Enter a valid positive amount.",
      not_enough_money: "💸 Bro you're broke! Check balance 😤",
      spinning: "🎰 Spinning...",
      result_win: "💰 SLOT RESULT 🎰\n\n🎉 YOU WON!\n💸 Amount: $%1",
      result_lose: "💰 SLOT RESULT 🎰\n\n😢 YOU LOST!\n💸 Lost: $%1",
      jackpot: "🔥 JACKPOT!!! 🔥\n\n💥 BIG WIN!\n💸 Amount: $%1\n🎯 Symbol: %2",
    },
  },

  onStart: async function ({ args, message, event, usersData, getLang }) {
    const { senderID } = event;
    const bet = parseInt(args[0]);

    if (isNaN(bet) || bet <= 0) {
      return message.reply(getLang("invalid_amount"));
    }

    const userData = await usersData.get(senderID);

    if (bet > userData.money) {
      return message.reply(getLang("not_enough_money"));
    }

    // deduct first (fair play)
    await usersData.set(senderID, { money: userData.money - bet });

    const slots = ["🍓","🍆","🍎","🍌","🍍","🥭","🫐","🍊","🍋","🍒","🥞","🍔"];

    // spinning msg
    const spinMsg = await message.reply(getLang("spinning"));

    // delay for animation feel
    await new Promise(res => setTimeout(res, 1500));

    const s1 = rand(slots);
    const s2 = rand(slots);
    const s3 = rand(slots);
    const s4 = rand(slots);

    const win = calc(s1, s2, s3, s4, bet);

    let finalMoney = userData.money - bet + win;
    await usersData.set(senderID, { money: finalMoney });

    let resultText = "";

    if (win > 0) {
      if (s1 === s2 && s2 === s3 && s3 === s4) {
        resultText = getLang("jackpot", win, s1);
      } else {
        resultText = getLang("result_win", win);
      }
    } else {
      resultText = getLang("result_lose", bet);
    }

    const slotView = `\n\n[ ${s1} | ${s2} | ${s3} | ${s4} ]\n\n💰 Balance: $${finalMoney}`;

    return message.edit(resultText + slotView, spinMsg.messageID);
  },
};

// random pick
function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// winning logic
function calc(a, b, c, d, bet) {
  if (a === b && b === c && c === d) {
    if (a === "🍆" || a === "🍍") return bet * 20; // mega jackpot
    return bet * 10;
  }

  if ((a === b && b === c) || (b === c && c === d)) {
    return bet * 5;
  }

  if (a === b || a === c || a === d || b === c || b === d || c === d) {
    return bet * 2;
  }

  return 0;
}
