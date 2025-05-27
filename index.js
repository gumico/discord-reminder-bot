const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = '1376213933697794142';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

let schedule = {};
const SCHEDULE_FILE = 'schedule.json';

let reminded = {};
const REMINDED_FILE = 'reminded.json';

// スケジュール読み込み
function loadSchedule() {
  if (fs.existsSync(SCHEDULE_FILE)) {
    schedule = JSON.parse(fs.readFileSync(SCHEDULE_FILE));
  }
}

// スケジュール保存
function saveSchedule() {
  fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(schedule, null, 2));
}

// リマインド済み情報読み込み
function loadReminded() {
  if (fs.existsSync(REMINDED_FILE)) {
    reminded = JSON.parse(fs.readFileSync(REMINDED_FILE));
  }
}

// リマインド済み情報保存
function saveReminded() {
  fs.writeFileSync(REMINDED_FILE, JSON.stringify(reminded, null, 2));
}

// 19時に一回だけリマインドを送る関数
function checkReminders() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const hour = now.getHours();
  const minute = now.getMinutes();

  if (hour === 19 && minute === 15 && schedule[today] && !reminded[today]) {
    const message = `【今日のリマインダー】${schedule[today]}`;
    client.channels.fetch(CHANNEL_ID)
      .then(channel => {
        channel.send(message);
        reminded[today] = true;  // 一度送ったら記録
        saveReminded();
      })
      .catch(console.error);
  }
}

// Discordメッセージ受信処理
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

// Bot起動時処理
client.once('ready', () => {
  console.log('Botは起動しました');
  loadSchedule();
  loadReminded();

  setInterval(checkReminders, 60 * 1000); // 1分ごとにチェック
});

client.login(TOKEN);

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});

