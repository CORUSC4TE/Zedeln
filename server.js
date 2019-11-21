const Telegraf = require('telegraf');
const dotenv = require('dotenv');
dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);
const gameList = [];
bot.command('start', (ctx) => {
    ctx.reply('One');
    ctx.reply('two');
}, bot.launch());
class Game {
    constructor(host) {
        this.ongoing = false;
        this.id = gameList.length + 1;
        this.host = host;
    }
    addWord(words) {
        for (let word of words) {
            this.wordList.push(word);
        }
    }
    addPlayer(player) {
        this.playerList.push(player);
    }
}
class Player {
    constructor() {
        this.ready = false;
    }
    player(id) {
        this.pID = id;
    }
    setReady() {
        this.ready = true;
    }
}
