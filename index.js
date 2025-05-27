const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');

// 環境変数からトークン取得
const TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!TOKEN) {
  console.error('ERROR: DISCORD_BOT_TOKENが設定されていません。');
  process.exit(1);
}

const CHANNEL_ID = '1376213933697794142';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

let schedule = {};
const FILE_NAME = 'schedule.json';

// スケジュール読み込み
function loadSchedule() {
  if (fs.existsSync(FILE_NAME)) {
    const raw = fs.readFileSync(FILE_NAME);
    schedule = JSON.parse(raw);
    console.log('スケジュールを読み込みました:', schedule);
  } else {
    console.log('スケジュールファイルが存在しません。新規作成します。');
  }
}

// スケジュール保存
function saveSchedule() {
  fs.writeFileSync(FILE_NAME, JSON.stringify(schedule, null, 2));
  console.log('スケジュールを保存しました:', schedule);
}

// リマインダー確認
function checkReminders() {
  const today = new Date().toISOString().split('T')[0];
  console.log(`[${new Date().toISOString()}] checkReminders実行。今日の日付: ${today}`);
  if (schedule[today]) {
    const message = `【今日のリマインダー】${schedule[today]}`;
    client.channels.fetch(CHANNEL_ID)
      .then(channel => {
        console.log('メッセージ送信:', message);
        return channel.send(message);
      })
      .catch(console.error);
  } else {
    console.log('本日のリマインダーはありません。');
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

  // 1分毎にリマインダー確認
  setInterval(() => {
    checkReminders();
  }, 60 * 1000);
});

// ログイン試行
client.login(TOKEN)
  .then(() => console.log('Discordにログインしました'))
  .catch(err => {
    console.error('Discordログイン失敗:', err);
    process.exit(1);
  });

// RenderやUptimeRobotがアクセスするための簡単なHTTPルート
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

// Expressサーバー起動（1回だけ）
app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});

