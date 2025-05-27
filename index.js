const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = '1376213933697794142';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

let schedule = {};
const SCHEDULE_FILE = path.join(__dirname, 'schedule.json');

let reminded = {};
const REMINDED_FILE = path.join(__dirname, 'reminded.json');

function loadSchedule() {
  if (fs.existsSync(SCHEDULE_FILE)) {
    schedule = JSON.parse(fs.readFileSync(SCHEDULE_FILE));
  }
}

function saveSchedule() {
  fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(schedule, null, 2));
  console.log('schedule.json saved');
}

function loadReminded() {
  if (fs.existsSync(REMINDED_FILE)) {
    reminded = JSON.parse(fs.readFileSync(REMINDED_FILE));
  }
}

function saveReminded() {
  fs.writeFileSync(REMINDED_FILE, JSON.stringify(reminded, null, 2));
  console.log('reminded.json saved');
}

function getJSTDate() {
  const now = new Date();
  return new Date(now.getTime() + 9 * 60 * 60 * 1000);
}

function checkReminders() {
  const now = getJSTDate();
  const today = now.toISOString().split('T')[0];
  const hour = now.getHours();
  const minute = now.getMinutes();

  console.log(`Checking reminders at ${hour}:${minute} JST for date ${today}`);

  if (hour === 20 && minute === 30 && schedule[today] && !reminded[today]) {
    const message = `【今日のリマインダー】${schedule[today]}`;
    client.channels.fetch(CHANNEL_ID)
      .then(channel => {
        channel.send(message);
        reminded[today] = true;
        saveReminded();
        console.log('Reminder sent and saved.');
      })
      .catch(console.error);
  }
}

client.on('messageCreate', (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!add ')) return;

  const args = message.content.slice(5).split(' ');
  const date = args[0];
  const content = args.slice(1).join(' ');

  if (!date || !content) {
    message.reply('使い方：`!add yyyy-mm-dd 内容`');
    return;
  }

  schedule[date] = content;
  saveSchedule();
  message.reply(`登録しました：${date} - ${content}`);
});

client.once('ready', () => {
  console.log('Botは起動しました');
  loadSchedule();
  loadReminded();

  setInterval(checkReminders, 60 * 1000);
});

client.login(TOKEN);

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});

