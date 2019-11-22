const Telegraf = require('telegraf');
const dotenv = require('dotenv');
dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);
let gameList = [];
let wordPerRound = 2;
bot.command('start', (ctx) => {
    for (let game of gameList) {
        if (game.host.id == ctx.from.id) {
            ctx.reply('Sie haben bereits ein Spiel gestartet, beenden Sie es vorher mit \'/stop\'');
            return;
        }
    }
    let game = new Game(ctx.from);
    gameList.push(game);
    game.playerList.push(new Player(ctx.from));
    ctx.reply('Dein Spiel wurde gestartet mit der ID: ' + game.id + '\nUm das Spiel zu starten tippe \'/begin\',\nUm dem Spiel beizutreten schreibe im Gruppen chat oder Privat \'/join ' + game.id + '\'');
});
bot.command('help', (ctx) => {
    ctx.reply('Um ein Spiel zu starten \'/start\' eingeben,\nUm dem Spiel als Spieler beizutreten benutzt man \'/join {SpielID}\'\nNachdem jeder beigetreten ist und eine Nachricht vom Bot bekommen hat kann man das Spiel mit \'/start\' Starten, dann sammelt der Bot die Worte\nWenn die richtige Anzahl an Worten gesammelt wurde kann man mit \'/begin\' starten.\nNach jeder Runde muss man mit \'/begin\' das Spiel starten, jede Runde wird mit \'next\' beendet. Diese Befehle kann nur der Host, also die Person die das Spiel gestartet hat benutzen, falls das nicht gut geht, kann man das noch aendern. Falls Einstellungen gewuenscht werden, kann das auch noch getan werden, wie Viele Worte pro Runde, wie viele Spielrunden, scoring etc.');
});
bot.command('join', (ctx) => {
    let args = ctx.message.text.split(' ');
    for (let game of gameList) {
        if (game.id == args[1]
            && game.ongoing == false) {
            for (let player of game.playerList) {
                if (player.id == ctx.from.id) {
                    ctx.reply('Sie sind bereits Teil des Spiels.');
                    return;
                }
            }
            game.playerList.push(new Player(ctx.from));
            bot.telegram.sendMessage(ctx.from.id, "Du bist Spiel " + game.id + " beigetreten.");
            return;
        }
    }
    ctx.reply("Spiel wurde nicht gefunden.");
});
bot.command('begin', (ctx) => {
    for (let game of gameList) {
        if (game.host.id == ctx.from.id) {
            game.start();
            return;
        }
    }
});
bot.command('die', (ctx) => {
    ctx.reply('Die you capitalist spazz');
});
bot.command('next', (ctx) => {
    for (let game of gameList) {
        if (game.host.id == ctx.from.id) {
            game.nextRound();
            return;
        }
    }
});
bot.command('stop', (ctx) => {
    for (let game of gameList) {
        if (game.host.id == ctx.from.id) {
            ctx.reply("Spiel beendet. Ich hoffe ihr hattet Spass");
            game.broadcast("Spiel " + game.id + " wurde beendet.");
            gameList = gameList.filter((game) => game.host.id !== ctx.from.id);
            return;
        }
    }
});
bot.on('message', (ctx) => {
    for (let game of gameList) {
        if (game.gathering) {
            for (let player of game.playerList) {
                if (player.id == ctx.from.id) {
                    if (player.wordList.length < (Math.floor(game.round / 4) + 1) * wordPerRound) {
                        player.wordList.push(ctx.message.text);
                        game.wordList.push(ctx.message.text);
                    }
                    else {
                        ctx.reply("Das Spiel braucht momentan keine neuen Worte.");
                    }
                }
            }
            if (game.wordList.length ==
                (game.playerList.length * wordPerRound * (Math.floor(game.round / 4) + 1))) {
                console.log("Gathered " + game.wordList.length + " Words starting next round: " + (game.round));
                if (game.round % 5 == 0 && game.wordList.length != 0) {
                    game.nextRound();
                }
            }
        }
    }
});
bot.command('save', (ctx) => {
    let savestate;
    for (let game of gameList) {
        for (let word of game.wordList) {
            savestate += word;
        }
    }
    ctx.reply(savestate);
});
bot.launch();
class Game {
    constructor(host) {
        this.ongoing = false;
        this.gathering = false;
        this.playerList = [];
        this.wordList = [];
        this.round = 0;
        this.id = gameList.length + 1;
        this.host = host;
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
    pickWord() {
        let pickableWords = this.wordList;
        for (let player of this.playerList) {
            let pick = pickableWords[Math.floor(Math.random() * pickableWords.length)];
            bot.telegram.sendMessage(player.id, pick);
            pickableWords = pickableWords.filter((word) => word != pick);
        }
    }
    broadcast(message) {
        for (let player of this.playerList) {
            bot.telegram.sendMessage(player.id, message);
        }
    }
    gatherWords() {
        this.gathering = true;
        this.broadcast("Bitte schreib mir 2 Worte deiner Wahl.");
    }
    start() {
        console.log("Started game with " + this.playerList.length + " Players");
        this.ongoing = true;
        this.gatherWords();
    }
}
class Player {
    constructor(user) {
        this.wordList = [];
        this.id = user.id;
        this.user = user;
    }
}
