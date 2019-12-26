var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const Telegraf = require('telegraf');
const TelegrafInlineMenu = require('telegraf-inline-menu');
const dotenv = require('dotenv');
dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);
const menu = new TelegrafInlineMenu('Game Menu');
let gameMenuToggle = false;
let selectedKey = 'b';
menu.select('s', ['Zedeln', 'Personenraten'], {
    setFunc: (ctx, key) => __awaiter(this, void 0, void 0, function* () {
        selectedKey = key;
        yield ctx.answerCbQuery(`you selected ${key}`);
    }),
    isSetFunc: (_ctx, key) => key === selectedKey
});
menu.setCommand('start');
bot.use(menu.init());
let nextGDate;
let gameList = [];
let wordPerRound = 2;
bot.command('help', (ctx) => {
    ctx.reply('Um ein Spiel zu starten \'/start\' eingeben,\nUm dem Spiel als Spieler beizutreten benutzt man \'/join{SpielID}\'\nNachdem jeder beigetreten ist und eine Nachricht vom Bot bekommen hat kann man das Spiel mit \'/start\' Starten, dann sammelt der Bot die Worte\nWenn die richtige Anzahl an Worten gesammelt wurde kann man mit \'/begin\' starten.\nNach jeder Runde muss man mit \'/begin\' das Spiel starten, jede Runde wird mit \'next\' beendet. Diese Befehle kann nur der Host, also die Person die das Spiel gestartet hat benutzen, falls das nicht gut geht, kann man das noch aendern. Falls Einstellungen gewuenscht werden, kann das auch noch getan werden, wie Viele Worte pro Runde, wie viele Spielrunden, scoring etc.');
});
bot.command('show', (ctx) => {
    for (let game of gameList) {
        console.log("Running Game " + game.id);
    }
});
bot.command('/setg', (ctx) => {
    console.log('Info: ' + ctx.from + " tried to set G Time");
    if (ctx.from.last_name == "Heller") {
    }
});
bot.hears(/^\/join(\d*)$/gi, (ctx) => {
    let game = gameList.find(game => game.id == parseInt(ctx.match[1]));
    if (game instanceof Zedeln) {
        let player = game.playerList.find(player => player.id == ctx.from.id);
        if (player) {
            ctx.reply("Sie sind bereits Teil des Spiels.");
        }
        else {
            game.addPlayer(new ZedelPlayer(ctx.from));
        }
    }
});
bot.command('begin', (ctx) => {
    let game = gameList.find(game => game.host.id == ctx.from.id);
    if (game instanceof Zedeln) {
        game.startGame();
    }
});
bot.command('die', (ctx) => {
    ctx.reply('Die you capitalist spazz');
});
bot.command('next', (ctx) => {
    let game = gameList.find(game => game.host.id == ctx.from.id);
    if (game instanceof Zedeln)
        game.nextRound();
});
bot.command('stop', (ctx) => {
    let game = gameList.find(game => game.host.id == ctx.from.id);
    if (game instanceof Zedeln)
        game.stopGame();
    ctx.reply("Spiel beendet. Ich hoffe ihr hattet Spass");
});
bot.on('message', (ctx) => {
    let game = gameList.find(game => {
        return game.playerList.some(player => player.id == ctx.from.id);
    });
    if (game instanceof Zedeln) {
        if (!game.addWord(ctx.from.id, ctx.message.text)) {
            ctx.reply('Das Spiel braucht keine weiteren Worte mehr');
        }
    }
});
bot.command('save', (ctx) => {
    let game = gameList.find(game => game.host.id == ctx.from.id);
    if (game instanceof Zedeln) {
        ctx.reply(game.wordList);
    }
});
bot.command('leave', (ctx) => {
    let game = gameList.find(game => {
        return game.playerList.some(player => player.id == ctx.from.id);
    });
    if (game)
        game.removePlayer(ctx.from);
});
bot.startPolling();
bot.launch();
class Game {
    constructor(host) {
        this.id = 0;
        this.id++;
        this.host = host;
        this.addPlayer(host);
    }
    removePlayer(rmPlayer) {
        if (this.playerList.find(player => player == rmPlayer)) {
            console.log('Player: ' + rmPlayer.first_name + ' has left the game ' + typeof (this) + ": " + this.id);
            this.playerList = this.playerList.filter((user) => user != rmPlayer);
            return true;
        }
        else {
            return false;
        }
    }
    addPlayer(player) {
        console.log('Player: ' + player.first_name + ' has joined the game' + typeof (this) + ": " + this.id);
        this.playerList.push(player);
    }
    broadcast(message) {
        for (let player of this.playerList) {
            bot.telegram.sendMessage(player.id, message);
        }
    }
}
class Guessperson extends Game {
    constructor(host) {
        super(host);
        this.personList = [];
    }
    startGame() {
    }
    selectPairing() {
    }
}
class Zedeln extends Game {
    constructor(host) {
        super(host);
        this.ongoing = false;
        this.gathering = false;
        this.playerList = [];
        this.wordList = [];
        this.round = 0;
        console.log("Game " + this.id + " created.");
    }
    nextRound() {
        console.log("In nextRound: " + this.round);
        this.gathering = false;
        this.round++;
        switch (this.round % 5) {
            case 0:
                this.gatherWords();
                break;
            case 1:
                this.broadcast("Das Wort muss erklaert werden.");
                break;
            case 2:
                this.broadcast("Das Wort muss Gestikuliert werden.");
                break;
            case 3:
                this.broadcast("Das Wort muss mit einem Geraeusch vermittelt werden.");
                break;
            case 4:
                this.broadcast("Das Wort muss mit einem Wort beschrieben werden.");
                break;
        }
        if (this.round % 5 > 0) {
            this.pickWord();
        }
    }
    addWord(id, word) {
        let player = this.playerList.find(player => player.id == id);
        if (player) {
            if (player.wordList.length < (Math.floor(this.round / 4) + 1) * wordPerRound) {
                player.wordList.push(word);
                this.wordList.push(word);
            }
            else {
                return false;
            }
            if (this.wordList.length ==
                (this.playerList.length * wordPerRound * (Math.floor(this.round / 4) + 1))) {
                console.log("Gathered " + this.wordList.length + " Words starting next round: " + (this.round));
                if (this.round % 5 == 0 && this.wordList.length != 0) {
                    this.nextRound();
                }
            }
            return true;
        }
    }
    pickWord() {
        let pickableWords = this.wordList;
        for (let player of this.playerList) {
            let pick = pickableWords[Math.floor(Math.random() * pickableWords.length)];
            bot.telegram.sendMessage(player.id, pick);
            console.log(this.id + ": " + player.user.first_name + ": " + pick);
            pickableWords = pickableWords.filter((word) => word != pick);
        }
    }
    gatherWords() {
        console.log(this.wordList);
        this.gathering = true;
        this.broadcast("Bitte schreib mir 2 Worte deiner Wahl.");
    }
    startGame() {
        console.log("Started game " + this.id + " with " + this.playerList.length + " Players");
        this.ongoing = true;
        this.gatherWords();
    }
    stopGame() {
        console.log("Game " + this.id + " ended.");
        this.broadcast("Spiel " + this.id + " wurde beendet.");
        gameList = gameList.filter((game) => game != this);
        return;
    }
}
class Player {
    constructor(user) {
        this.id = user.id;
        this.user = user;
    }
}
class GuessPlayer extends Player {
    constructor(user) {
        super(user);
    }
}
class ZedelPlayer extends Player {
    constructor(user) {
        super(user);
        this.wordList = new Array();
    }
}
