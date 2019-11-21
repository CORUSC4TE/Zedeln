/* 
 * Setting Up Environment
 */
const Telegraf = require('telegraf');
const dotenv = require('dotenv'); dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);
//const crypto = require("crypto");

let gameList: Game[] = [];

/*
 * Declaring Routes
 */


// TODO : Random Word Pick
//        RegEx um /joinN zu finden

bot.command('start', (ctx) => {
    for (let game of gameList) {
        if (game.host == ctx.from.id) {
            ctx.reply('Sie haben bereits ein Spiel gestartet, beenden Sie es vorher mit \'/stop\'');
            return;
        }
    }
    let game = new Game(ctx.from.id);
    gameList.push(game);
    game.playerList.push(new Player(ctx.from.id);
    ctx.reply('Dein Spiel wurde gestartet mit der ID: ' + game.id + '\nUm das Spiel zu starten tippe \'/begin\',\nUm dem Spiel beizutreten schreibe im Gruppen chat oder Privat \'/join ' + game.id + '\'');
});

bot.command('join', (ctx) => {
    let args = ctx.message.text.split(' ');

    for (let game of gameList) {
        if (game.id == args[1]
            && game.ongoing == false) {
            for (let player of game.playerList) {
                if (player.id == ctx.from.id) {
                    return;
                }
            }
            game.playerList.push(new Player(ctx.from.id));
            bot.telegram.sendMessage(ctx.from.id, "Du bist Spiel " + game.id + " beigetreten.");
	    break;
        }
	else {
	    ctx.reply('Spiel wurde nicht gefunden, sicher, dass die richtige Nummer angegeben wurde?');
	}
    }
});

bot.command('begin', (ctx) => {
    for (let game of gameList) {
        if (game.host == ctx.from.id) {
	    game.broadcast("Spiel " + game.id + " hat begonnen.\nBitte schreiben Sie mir alle ihre zwei Worte");
	    game.ongoing = true;
	    return;
        }
    }
});

bot.on('text', (ctx) => {
    for (let game of gameList) {
        if (game.ongoing) {
            for (let player of game.playerList) {
                if (player.id == ctx.from.id) {
		    if(player.wordList.length < game.round*2) {
			player.wordList.push(ctx.message);
			game.wordList.push(ctx.message);
		    }
		    else {
			ctx.reply("Tztztz, nicht cheaten.");
		    }
                }
            }
        }
    }
});

bot.command('next', (ctx) => {
    for(let game of gameList) {
	if(game.host == ctx.from.id) {
	    game.nextRound();
	    return;
	}
    }
});

bot.command('stop', (ctx) => {
    for (let game of gameList) {
        if (game.host == ctx.from.id) {
	    game.broadcast("Spiel " + game.id + " wurde beendet.");
	    gameList = gameList.filter((game) => game.host !== ctx.from.id);
	    return;
        }
    }
});
	    
	    
bot.launch();

class Game {
    id: number;
    host: string = "";
    ongoing: boolean = false;
    playerList: Player[] = [];
    wordList: string[] = [];
    round: number = 1;

    nextRound() {
	switch(this.round % 4) {
	    case 0: this.broadcast("Bitte schreib mir 2 Worte deiner Wahl."); break;
	    case 1: this.broadcast("Das Wort muss erklaert werden."); break;
	    case 2: this.broadcast("Das Wort muss Gestikuliert werden."); break;
	    case 3: this.broadcast("Das Wort muss mit einem Geraeusch vermittelt werden."); break;
	    case 4: this.broadcast("Das Wort muss mit einem Wort beschrieben werden."); break;
	}
	if(this.round++ > 0) {
	    this.pickWord();
	}
    }

    pickWord() {
	for(let player of this.playerList) {
	    
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
}

class Player {
    id: string;
    wordList: string[] = [];

    constructor(id: string) {
	this.id = id;
    }
}
