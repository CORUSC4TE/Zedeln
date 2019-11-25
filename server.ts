import { createContext } from "vm";

/* 
 * Setting Up Environment
 */
const Telegraf = require('telegraf');
const dotenv = require('dotenv'); dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);
//const crypto = require("crypto");

let gameList: Game[] = [];
let wordPerRound: number = 2;

/*
 * Declaring Routes
 */


// TODO : Random Word Pick
//        RegEx um /joinN zu finden

bot.command('start', (ctx) => {
    let game = gameList.find(game => game.host.id == ctx.from.id)
    if(game) {
        ctx.reply('Sie haben bereits Spiel ' + game.id + ' gestartet, beenden Sie es vorher mit \'/stop\'');
        return false;
    }
    else {
        game = new Game(ctx.from)
        gameList.push(game);
        ctx.reply('Dein Spiel wurde gestartet mit der ID: ' + game.id 
        + '\nUm das Spiel zu starten tippe \'/begin\',\nUm dem Spiel beizutreten schreibe mir \'/join' + game.id + '\'');
        return true
    }
});

bot.command('help', (ctx) => {
    ctx.reply('Um ein Spiel zu starten \'/start\' eingeben,\nUm dem Spiel als Spieler beizutreten benutzt man \'/join{SpielID}\'\nNachdem jeder beigetreten ist und eine Nachricht vom Bot bekommen hat kann man das Spiel mit \'/start\' Starten, dann sammelt der Bot die Worte\nWenn die richtige Anzahl an Worten gesammelt wurde kann man mit \'/begin\' starten.\nNach jeder Runde muss man mit \'/begin\' das Spiel starten, jede Runde wird mit \'next\' beendet. Diese Befehle kann nur der Host, also die Person die das Spiel gestartet hat benutzen, falls das nicht gut geht, kann man das noch aendern. Falls Einstellungen gewuenscht werden, kann das auch noch getan werden, wie Viele Worte pro Runde, wie viele Spielrunden, scoring etc.');
});

bot.command('show', (ctx) => {
    for(let game of gameList) {
        console.log("Running Game " + game.id);
    }
})

//Join a game	    
bot.hears(/^\/join(\d*)$/gi, (ctx) => {
    let game = gameList.find(game => game.id == parseInt(ctx.match[1]))
    if(game) {
        let player = game.playerList.find(player => player.id == ctx.from.id)
        if (player) {
            ctx.reply("Sie sind bereits Teil des Spiels.");
        }
        else {
            game.addPlayer(new Player(ctx.from));
        }
    }
})


bot.command('begin', (ctx) => {
    let game = gameList.find(game => game.host.id == ctx.from.id)
    if(game) { game.startGame(); }
});

bot.command('die', (ctx) => {
    ctx.reply('Die you capitalist spazz');
});

bot.command('next', (ctx) => {
    let game = gameList.find(game => game.host.id == ctx.from.id)
    if (game) game.nextRound();
});

bot.command('stop', (ctx) => {
    let game = gameList.find(game => game.host.id == ctx.from.id)
    if (game) game.stopGame();
    ctx.reply("Spiel beendet. Ich hoffe ihr hattet Spass");
});

bot.on('message', (ctx) => {
    let game = gameList.find(game => {
        return game.playerList.some(player => player.id == ctx.from.id)
    })
    if(game) {
        if(!game.addWord(ctx.from.id, ctx.message.text)) {
            ctx.reply('Das Spiel braucht keine weiteren Worte mehr')
        }
    }  
});

bot.command('save', (ctx) => {
    let game = gameList.find(game => game.host.id == ctx.from.id)
    if(game) {
        ctx.reply(game.wordList);
    }
});

bot.command('leave', (ctx) => {
    let game = gameList.find(game => {
        return game.playerList.some(player => player.id == ctx.from.id)
    })
    if (game) game.removePlayer(ctx.from)
});

bot.launch();


class Game {
    id: number;
    host: Player;
    ongoing: boolean = false;
    gathering: boolean = false;
    playerList: Player[] = [];
    wordList: string[] = [];
    round: number = 0;

    constructor(host) {
        this.id = gameList.length + 1;
        this.host = new Player(host);
        this.addPlayer(this.host);
        console.log("Game " + this.id + " created.")
    }

    nextRound() {
	    console.log("In nextRound: " + this.round);
	    this.gathering = false;
	    this.round++;
        switch (this.round % 5) {
            case 0: this.gatherWords(); break;
            case 1: this.broadcast("Das Wort muss erklaert werden."); break;
            case 2: this.broadcast("Das Wort muss Gestikuliert werden."); break;
            case 3: this.broadcast("Das Wort muss mit einem Geraeusch vermittelt werden."); break;
            case 4: this.broadcast("Das Wort muss mit einem Wort beschrieben werden."); break;
        }
        if (this.round % 5 > 0) {
            this.pickWord();
        }
    }
    
    addWord(id, word:string) :Boolean {
        let player = this.playerList.find(player => player.id == id);
        if(player) {
            if (player.wordList.length < (Math.floor(this.round / 4)+1) * wordPerRound) {
                player.wordList.push(word);
                this.wordList.push(word);
            }
            else {
                return false;
            }
            if (this.wordList.length ==
                (this.playerList.length * wordPerRound * (Math.floor(this.round / 4)+1)) ) {
                console.log("Gathered " + this.wordList.length + " Words starting next round: " + (this.round));
                if (this.round % 5 == 0 && this.wordList.length != 0) {
                    this.nextRound();
                }
            }
            return true;
        }
    }

    pickWord() {
        let pickableWords: string[] = this.wordList;
        for (let player of this.playerList) {
            let pick: string = pickableWords[Math.floor(Math.random() * pickableWords.length)];
            bot.telegram.sendMessage(player.id, pick);
            console.log(player.user.first_name + ": " + pick)
            pickableWords = pickableWords.filter((word) => word != pick);
        }
    }


    broadcast(message: string) {
        for (let player of this.playerList) {
            bot.telegram.sendMessage(player.id, message);
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

    removePlayer(rmPlayer):boolean {
        if(this.playerList.find(player => player == rmPlayer)) {
            console.log('Player: ' + rmPlayer.first_name + ' has left the game.')
            this.playerList = this.playerList.filter((user) => user != rmPlayer)
            return true;
        } else { return false }
    }

    addPlayer(player) {
        console.log('Player: ' + player.first_name + ' has joined the game.');
        this.playerList.push(player);
    }

}

class Player {
    id: string;
    user;
    wordList: string[] = new Array();

    constructor(user) {
        this.id = user.id;
        this.user = user;
    }
}
