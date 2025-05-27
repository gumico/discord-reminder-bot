const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');

const TOKEN = 'process.env.DISCORD_BOT_TOKEN';
const CHANNEL_ID = '1376213933697794142';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

let schedule = {};
const FILE_NAME = 'schedule.json';

function loadSchedule() {
  if (fs.existsSync(FILE_NAME)) {
    const raw = fs.readFileSync(FILE_NAME);
    schedule = JSON.parse(raw);
  }
}

function saveSchedule() {
  fs.writeFileSync(FILE_NAME, JSON.stringify(schedule, null, 2));
}

function checkReminders() {
  const today = new Date().toISOString().split('T')[0];
  if (schedule[today]) {
    const message = `【今日のリマインダー】${schedule[today]}`;
    client.channels.fetch(CHANNEL_ID)
      .then(channel => channel.send(message))
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

  setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 30) {
      checkReminders();
    }
  }, 60 * 1000);
});

client.login(TOKEN);
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// RenderやUptimeRobotがアクセスする用の簡単なルート
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

// サーバー起動
app.listen(port, () => {
  console.log(`Express server is running on port ${port}`);
});
