/* 
 * Setting Up Environment
 */
const Telegraf = require('telegraf');
const dotenv = require('dotenv'); dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);
//const crypto = require("crypto");

const gameList: Game[] = [];

/*
 * Declaring Routes
 */


bot.command('start', (ctx) => {
//    this.gameList.push(new Game())
    ctx.reply("refreshed");
} 
	    
bot.launch();

class Game {
    id: number;
    host;
    ongoing: boolean = false;
    playerList: Player[];
    wordList: string[];

    constructor(host) {
	this.id = gameList.length+1;
	this.host = host;
    }

    addWord(words: string | string[]) {
	for(let word of words) {
	    this.wordList.push(word);
	}
    }

    addPlayer(player: Player) {
	this.playerList.push(player);
    }
}

class Player {
    pID;
    ready: boolean = false;

    player(id) {
	this.pID = id;
    }

    setReady() {
	this.ready = true;
    }
}

