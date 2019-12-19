class Zedeln {
    wordPerRound: number = 2;
    host: Player;
    ongoing: boolean = false;
    gathering: boolean = false;
    playerList: Player[] = [];
    wordList: string[] = [];
    pickedWords: boolean[] = []
    round: number = 0;

    constructor(host, wpr?) {
        this.host = new Player(host);
        this.addPlayer(this.host);
        console.log("Game from " + this.host + " created.")
        if(wpr) {
            this.wordPerRound = wpr;
        }
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
            if (player.wordList.length < (Math.floor(this.round / 4)+1) * this.wordPerRound) {
                player.wordList.push(word);
                this.wordList.push(word);
            }
            else {
                return false;
            }
            if (this.wordList.length ==
                (this.playerList.length * this.wordPerRound * (Math.floor(this.round / 4)+1)) ) {
                console.log("Gathered " + this.wordList.length + " Words starting next round: " + (this.round));
                if (this.round % 5 == 0 && this.wordList.length != 0) {
                    this.nextRound();
                }
            }
            return true;
        }
    }

    /*
    pickWord(): string {
        let pickableWords: string[] = this.wordList;
        for (let player of this.playerList) {
            let pick: string = pickableWords[Math.floor(Math.random() * pickableWords.length)];
            bot.telegram.sendMessage(player.id, pick);
            console.log(player.user.first_name + ": " + pick)
            pickableWords = pickableWords.filter((word) => word != pick);
        }
    }
    */

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
