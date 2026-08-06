const guessedNumbers = new Map(); // To store user game sessions

module.exports = {
  config: {
    name: "aiguess",
    aliases: ["guess", "gnumber"],
    version: "1.0",
    author: "Arafat",
    countDown: 3,
    role: 0,
    shortDescription: {
      en: "Guess a number between 1 and 10",
    },
    longDescription: {
      en: "AI thinks of a number between 1 and 10. Try to guess it!",
    },
    category: "game",
    guide: {
      en: "{p}aiguess [number]",
    },
  },

  onStart: async function ({ message, event, args }) {
    const userID = event.senderID;
    const guess = parseInt(args[0]);

    // Start a new game if no number is passed
    if (!args[0]) {
      const number = Math.floor(Math.random() * 10) + 1;
      guessedNumbers.set(userID, number);
      return message.reply(
        "🎯 I have thought of a number between 1 and 10. Try to guess it by typing:\n\n`aiguess [your number]`"
      );
    }

    // If there's no ongoing game
    if (!guessedNumbers.has(userID)) {
      return message.reply("❌ You haven't started a game yet! Type `aiguess` to start.");
    }

    // If user guessed
    const correctNumber = guessedNumbers.get(userID);
    if (guess === correctNumber) {
      guessedNumbers.delete(userID);
      return message.reply(`🎉 Correct! The number was ${correctNumber}. You won!`);
    } else {
      return message.reply(`❌ Wrong! Try again. Hint: It's not ${guess}.`);
    }
  },
};
