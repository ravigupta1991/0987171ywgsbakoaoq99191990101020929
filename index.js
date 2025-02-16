require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });
const app = express();
const port = process.env.PORT || 3000;
const channelUsername = '@polimage';

// Use a variable to track if the callback query listener has been set up
let callbackQueryListenerSetUp = false;

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Welcome to Polimage\nSend me any text and I will convert it into an image. It will take 10 sec to 1 min to generate the image.\n\nEx:- flower, happy dog");
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') return;

    const options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: "Verify ✅️", callback_data: `check_membership:${text}` }]
            ]
        }
    };

    bot.sendMessage(chatId, `Please join the channel @polimage to use this bot.`, options)
        .then(sentMessage => {
            const messageId = sentMessage.message_id;

            if (!callbackQueryListenerSetUp) {
                bot.on('callback_query', (callbackQuery) => {
                    const userId = callbackQuery.from.id;
                    const data = callbackQuery.data.split(':');
                    const command = data[0];
                    const text = data[1];

                    if (command === 'check_membership') {
                        console.log(`Verifying membership for user ID: ${userId}`);

                        bot.getChatMember(channelUsername, userId).then((member) => {
                            console.log(`Membership status for user ID ${userId}: ${member.status}`);

                            if (['member', 'administrator', 'creator'].includes(member.status)) {
                                const imageUrl = `https://image.pollinations.ai/prompt/${text}?nologo=true`;

                                axios.get(imageUrl, { responseType: 'arraybuffer' })
                                    .then(response => {
                                        bot.sendPhoto(userId, response.data)
                                            .then(() => {
                                                // Delete the membership message
                                                bot.deleteMessage(chatId, messageId);
                                            });
                                    })
                                    .catch(error => {
                                        console.error('Error fetching image:', error);
                                        bot.sendMessage(userId, `Sorry, I couldn't generate an image for that text. Error: ${error.message}`);
                                    });
                            } else {
                                bot.sendMessage(userId, "You are not a member of the channel.");
                            }
                        }).catch((error) => {
                            console.error('Error checking membership:', error);
                            bot.sendMessage(userId, `There was an error checking your membership status. Error: ${error.message}`);
                        });
                    }
                });

                callbackQueryListenerSetUp = true;
            }
        });
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
