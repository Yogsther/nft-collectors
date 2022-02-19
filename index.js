const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const fs = require("file-system");
const { v4: uuidv4 } = require('uuid');

app.use("/", express.static('dist'))
app.get("/", (req, res) => {
	res.sendFile(__dirname + "/dist/index.html");
});

var clients = {}
var lobbies = []


const NFTS = JSON.parse(fs.readFileSync("./nfts.json", "utf8"))

for (let nft of NFTS) {
	nft.id = uuidv4()
}

fs.writeFileSync("nfts.json", JSON.stringify(NFTS, null, 2))

const config = JSON.parse(fs.readFileSync("./config.json", "utf8"))

io.on('connection', socket => {
	clients[socket.id] = {}

	socket.on("join_lobby", (args) => {
		let lobby

		if (args.name == "") {
			socket.emit("error", "Please enter a name")
			return;
		}

		if (args.code.length > 0 && args.code.length != 5) {
			socket.emit("error", "Please enter a valid code")
			return;
		}

		if (args.code == "") {
			lobby = new Lobby()
		} else {
			lobby = getLobbyFromCode(args.code)
		}
		if (lobby == null) {
			socket.emit("error", "No lobby found.")
			return
		}

		if (lobby.players.length >= 6) {
			socket.emit("error", "Lobby is full.")
			return;
		}

		for (let player of lobby.players) {
			if (player.name.toLowerCase() == args.name.toLowerCase()) {
				socket.emit("error", "Name already taken.")
				return;
			}
		}



		if (lobby.inGame) {
			socket.emit("error", "Game already in progress.")
			return
		}

		lobby.addPlayer(args.name, socket.id)
	})

	socket.on("pick", nftID => {
		let lobby = getLobbyFromSocketID(socket.id)
		if (lobby != null) {
			lobby.pick(lobby.getPlayer(socket.id), nftID)
		}
	})

	socket.on("start_game", () => {
		let lobby = getLobbyFromSocketID(socket.id)
		if (lobby != null) {
			if (lobby.getLeader() == lobby.getPlayer(socket.id)) {
				lobby.startGame()
			}
		}
	})

	socket.on("disconnect", () => {
		// Remove player from lobby
		let lobby = getLobbyFromSocketID(socket.id)
		if (lobby != null) {
			lobby.removePlayer(socket.id)
		}

		delete clients[socket.id]
	})


});

server.listen(config.port, () => {
	console.log("Started server on port " + config.port)
});

function getLobbyFromCode(code) {
	for (let lobby of lobbies) {
		if (lobby.code == code)
			return lobby
	}
	return null
}

function getLobbyFromSocketID(socketID) {
	for (let lobby of lobbies) {
		for (let player of lobby.players) {
			if (player.socketID == socketID)
				return lobby
		}
	}
	return null
}



class Player {
	constructor(name, socketID) {
		this.name = name
		this.eth = 0
		this.socketID = socketID
		this.pick = ""
	}

	emit(identifier, data) {
		io.to(this.socketID).emit(identifier, data)
	}
}

function getNFT(id) {
	for (let nft of NFTS) {
		if (nft.id == id)
			return nft
	}
	return null
}

class Lobby {
	constructor() {
		this.code = this.generateCode()

		console.log(`Created new lobby (${this.code})`)

		this.players = []
		this.inGame = false
		this.round = 0
		this.timeout = null

		this.rounds = 10 // Number of rounds to play
		this.roundTime = 10 // seconds

		this.roundDatas = []

		lobbies.push(this)
	}

	getRoundData() {
		return this.roundDatas[this.round]
	}

	startGame() {
		console.log(`Starting game (${this.code})`)
		this.inGame = true
		this.pickingNfts = false;
		this.picksPerRound = this.players.length < 3 ? 3 : this.players.length - 1
		let avalibleIndexes = []

		for (let i = 0; i < NFTS.length; i++) {
			avalibleIndexes.push(i)
		}

		for (let i = 0; i < this.rounds; i++) {
			let roundData = []
			for (let j = 0; j < this.picksPerRound; j++) {
				let index = Math.floor(Math.random() * avalibleIndexes.length)
				roundData.push(avalibleIndexes[index])
				avalibleIndexes.splice(index, 1)
			}
			this.roundDatas.push(roundData)
		}

		this.emit("start_game")
		this.timeout = setTimeout(() => {
			this.playRound()
		}, 250)
	}

	playRound() {
		this.pickingNfts = true;
		let round = []
		let indexes = this.getRoundData()
		for (let index of indexes) {
			round.push(NFTS[index])
		}

		this.emit("play_round", round)
		this.timeout = setTimeout(() => {
			this.endRound()
		}, (this.roundTime * 1000))
	}

	endRound() {
		this.pickingNfts = false;

		let picks = {}
		let clashingPicks = false;

		for (let player of this.players) {
			if (player.pick) {
				if (picks[player.pick]) {
					picks[player.pick].push(player.name)
					clashingPicks = true
				}
				else picks[player.pick] = [player.name]
			}
		}

		for (let id in picks) {
			shuffleArr(picks[id])
			this.getPlayerFromName(picks[id][0]).eth += Number(getNFT(id).price)
		}

		this.emit("end_round", picks)
		this.round++
		for (let player of this.players) player.pick = null

		setTimeout(() => {
			this.update()
			setTimeout(() => {
				this.rounds > this.round ? this.playRound() : this.endGame()
			}, 2000)
		}, clashingPicks ? 5000 : 1000)
	}

	endGame() {
		this.inGame = false
		this.update()
		this.round = 0
		this.roundDatas = []
		this.emit("end_game")
		console.log(`Game ended (${this.code})`)
	}

	getPlayerFromName(name) {
		for (let player of this.players) {
			if (player.name == name)
				return player
		}
		return null
	}

	getPlayer(socketID) {
		for (let player of this.players) {
			if (player.socketID == socketID)
				return player
		}
		return null
	}

	pick(player, nftID) {
		if (this.pickingNfts) {
			player.pick = nftID
		}
		if (this.allPlayersReady()) {
			clearTimeout(this.timeout)
			this.endRound()
		}
	}

	allPlayersReady() {
		for (let player of this.players) {
			if (!player.pick) return false;
		}
		return true
	}


	addPlayer(name, socketID) {
		let player = new Player(name, socketID)
		this.players.push(player)
		player.emit("joined", {
			code: this.code,
			name: name,
		})
		this.update()
		console.log(`${name} joined (${this.code})`)
	}

	removePlayer(socketID) {
		for (let i = 0; i < this.players.length; i++) {
			if (this.players[i].socketID == socketID) {
				this.players.splice(i, 1)
				break;
			}
		}
		if (this.players.length == 0)
			this.deleteGame()
		else this.update()
	}

	deleteGame() {
		for (let i = 0; i < lobbies.length; i++) {
			if (lobbies[i] == this) {
				lobbies.splice(i, 1)
				break;
			}
		}
		clearTimeout(this.timeout)
		console.log(`Lobby terminated (${this.code})`)
	}

	update() {
		this.emit("update", {
			players: this.players,
			inGame: this.inGame,
		})
	}

	emit(identifier, data) {
		for (let player of this.players) {
			player.emit(identifier, data)
		}
	}

	getLeader() {
		return this.players[0]
	}

	generateCode() {
		// Generate a random code with five upper case letters
		let code = ""
		for (let i = 0; i < 5; i++) {
			let letter = String.fromCharCode(Math.floor(Math.random() * 26) + 65)
			code += letter
		}
		return code
	}
}

function shuffleArr(array) {
	for (var i = array.length - 1; i > 0; i--) {
		var rand = Math.floor(Math.random() * (i + 1));
		[array[i], array[rand]] = [array[rand], array[i]]
	}
}