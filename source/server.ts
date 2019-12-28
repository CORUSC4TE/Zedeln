/* 
 * Setting Up Environment
 */
const Telegraf = require('telegraf');
const TelegrafInlineMenu = require('telegraf-inline-menu')
const dotenv = require('dotenv'); dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);

// Inline Menu
const menu = new TelegrafInlineMenu('Wanna play a game?');
let gameMenuToggle = false;

/* menu.toggle('Start Game', 'a', {
    setFunc: (_ctx, newVal) => {
        gameMenuToggle = newVal
    },
    isSetFunc: () => gameMenuToggle
})

menu.simpleButton('Zedeln', 'z', {
    doFunc: async ctx => ctx.answerCbQuery('You started a game of Zedeln'),
    hide: () => gameMenuToggle
}) 

menu.simpleButton('Personenraten', 'p', {
    doFunc: async ctx => ctx.answerCbQuery('You started a game of "Personenraten".'),
    hide: () => gameMenuToggle
}) */

/* let selectedKey = 'b';
menu.select('s', ['Zedeln', 'Personenraten'], {
    setFunc: async (ctx, key) => {
        selectedKey = key
        switch(key) {
            case 'Zedeln': break;
            case 'Personenraten': break;
        }

        await ctx.answerCbQuery(`you selected ${key}`)
    },
    isSetFunc: (_ctx, key) => key === selectedKey
    
}) 

menu.setCommand('start')
 
bot.use(menu.init())
*/


let gameList: Game[] = []
let wordPerRound = 2;

// TODO : Random Word Pick
//        RegEx um /joinN zu finden

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
    ctx.reply('Dein Spiel wurde gestartet mit der ID: ' + game.id + 
    '\nUm das Spiel zu starten tippe \'/begin\', '+
    '\nUm dem Spiel beizutreten schreibe mir \'/join' + game.id + '\'');
});

bot.command('help', (ctx) => {
    ctx.reply('Um ein Spiel zu starten \'/start\' eingeben,'+
    '\nUm dem Spiel als Spieler beizutreten benutzt man \'/join-{SpielID}\''+
    '\nNachdem jeder beigetreten ist und eine Nachricht vom Bot bekommen hat kann man das Spiel mit \'/start\' Starten, '+
    'dann sammelt der Bot die Worte\nWenn die richtige Anzahl an Worten gesammelt wurde kann man mit \'/begin\' starten.'+
    '\nNach jeder Runde muss man mit \'/begin\' das Spiel starten, jede Runde wird mit \'next\' beendet. '+
    'Diese Befehle kann nur der Host, also die Person die das Spiel gestartet hat benutzen. '+
    '\nFalls Einstellungen gewuenscht werden, kann das auch noch getan werden, wie Viele Worte pro Runde, wie viele Spielrunden, scoring etc.');
});


//Join a game	    
bot.hears(/^\/join(\d*)$/gi, (ctx) => {
    let game = gameList.find(game => game.id == parseInt(ctx.match[1]))
    if(game) {
        let player = game.playerList.find(player => player.id == ctx.from.id)
        if (player) {
            ctx.reply("Sie sind bereits Teil des Spiels.");
        }
        else {
            game.playerList.push(new Player(ctx.from));
        }
    }
})


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
                    if (player.wordList.length < (Math.floor(game.round / 4)+1) * wordPerRound) {
                        player.wordList.push(ctx.message.text);
                        game.wordList.push(ctx.message.text);
                    }
                    else {
                        ctx.reply("Das Spiel braucht momentan keine neuen Worte.");
                    }
                }
            }
            if (game.wordList.length ==
                (game.playerList.length * wordPerRound * (Math.floor(game.round / 4)+1)) ) {
		console.log("Gathered " + game.wordList.length + " Words starting next round: " + (game.round));
                if (game.round % 5 == 0 && game.wordList.length != 0) {
                    game.nextRound();
                }
            }
        }
    }
});

bot.command('save', (ctx) => {
    let savestate: string;
    for(let game of gameList) {
        for(let word of game.wordList) {
            savestate += word;
        }
    }
    ctx.reply(savestate);
});

bot.command('leave', (ctx) => {
    for(let game of gameList) {
        for(let player of game.playerList) {
            if(player.id == ctx.from.id) {
                //game.removePlayer();
            }
        }
    }
})


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
    
    start() {
	console.log("Started game with " + this.playerList.length + " Players");
	this.ongoing = true;
	this.gatherWords();
    }

    removePlayer(player) {
      //  this.playerList = this.playerList.filter(() => player !=)
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
