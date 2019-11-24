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
    gameList.find(game => {
        if(game.host.id == ctx.from.id) {
            ctx.reply('Sie haben bereits Spiel ' + game.id + ' gestartet, beenden Sie es vorher mit \'/stop\'');
            return false;
        }
        else {
            gameList.push(new Game(ctx.from));
            game.addPlayer(game.host); 
            ctx.reply('Dein Spiel wurde gestartet mit der ID: ' + game.id 
            + '\nUm das Spiel zu starten tippe \'/begin\',\nUm dem Spiel beizutreten schreibe im Gruppen chat oder Privat \'/join' + game.id + '\'');
            return true
        }
    })
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
bot.command('join', (ctx) => {
    let pattern = new RegExp('^\/join(\d*)$');
    let match = pattern.exec(ctx.message.text);

    gameList.find(game => {
        if(game.id == parseInt(match[1])) {
            game.playerList.find(player => {
                if(player.id == ctx.from.id) {
                    ctx.reply('Sie sind bereits Teil des Spiels');
                    return false;
                }
                else {
                    game.addPlayer(new Player(ctx.from))
                    return true;
                }
            })
        } else {
            ctx.reply("Spiel wurde nicht gefunden")
            return false;
        }
    })
});

bot.command('begin', (ctx) => {
    gameList.find(game => game.host.id == ctx.from.id).startGame();
});

bot.command('die', (ctx) => {
    ctx.reply('Die you capitalist spazz');
});

bot.command('next', (ctx) => {
    gameList.find(game => game.host.id == ctx.from.id).nextRound();
});

bot.command('stop', (ctx) => {
    gameList.find(game => game.host.id == ctx.from.id).stopGame();
    ctx.reply("Spiel beendet. Ich hoffe ihr hattet Spass");
});

bot.on('message', (ctx) => {
    gameList.find(game => {
        if(!game.addWord(ctx.from.id, ctx.message.text)) {  
            ctx.reply('Das Spiel braucht keine weiteren Worte mehr.')
            return false;
        } else {
            return true;
        }
    })
});

bot.command('save', (ctx) => {
    for(let game of gameList) {
        ctx.reply(game.wordList);
    }
});

bot.command('leave', (ctx) => {
    gameList.find(game => {
        return game.playerList.some(player => player.id == ctx.from.id)
    }).removePlayer(ctx.from)
});

bot.launch();


class Game {
    id: number;
    host;
    ongoing: boolean = false;
    gathering: boolean = false;
    playerList: Player[] = [];
    wordList: string[] = [];
    round: number = 0;

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
        this.playerList.find(player => {
            if(player.id == id) {
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
            }
        })
        return true;
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

    constructor(host) {
        this.id = gameList.length + 1;
        this.host = host;
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
	    console.log("Started game with " + this.playerList.length + " Players");
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
        console.log('PLayer: ' + player.first_name + ' has joined the game.');
        this.playerList = this.playerList.filter((user) => user != player);
    }

}

class Player {
    id: string;
    user;
    wordList: string[] = [];

    constructor(user) {
        this.id = user.id;
        this.user = user;
    }
}
