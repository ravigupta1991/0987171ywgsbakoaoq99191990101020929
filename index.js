require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express'); // Import express

const token = process.env.TOKEN; 
const bot = new TelegramBot(token, { polling: true });

const app = express(); // Create express app
const port = process.env.PORT || 3000; // Use environment port or 3000

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🤖 Bot Name   :-Polimage\n\nSend me any text and I will convert it into an image.It will take 10 sec to 1 min to generate the image.\n\nEx-: flower, happy dog");
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') return;

    const imageUrl = `https://image.pollinations.ai/prompt/${text}`;

    axios.get(imageUrl, { responseType: 'arraybuffer' })
        .then(response => {
            bot.sendPhoto(chatId, response.data);
        })
        .catch(error => {
            console.error('Error fetching image:', error);
            bot.sendMessage(chatId, "Sorry, I couldn't generate an image for that text.");
        });
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
