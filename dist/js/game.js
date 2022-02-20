
var nftCards = []
var countdown;
var round = 0
var totalRounds = 0

socket.on("play_round", data => {
	round = data.round;
	totalRounds = data.rounds

	startRound(data.nfts)

})

socket.on("end_round", picks => {
	onRoundOver(picks)
})

socket.on("end_game", () => {
	removeCards()
	stopCountdown()
	openView(views.LOBBY)
})

function onRoundOver(picks) {
	stopCountdown()
	for (let i = 0; i < nftCards.length; i++) {
		let nft = nftCards[i]
		setTimeout(() => {
			nft.setClaimable(false)
			nft.setClaimIconVisible(false)
			nft.revealPrice()
			for (let nftID in picks) {
				if (nftID == nft.id) {
					nft.showClaimers(picks[nftID])
				}
			}
		}, i * 250)
	}
}


var playersElement = document.getElementById("players")

function updateScoreboard(players) {
	let html = ""

	players.sort((a, b) => { return b.eth - a.eth })

	for (let i = 0; i < players.length; i++) {
		let player = players[i]
		html += `
		<div class="player">
				<div class="player-name ${player.name == info.name ? "me" : ""}"">${i + 1}. ${player.name}</div>
				<div class="etherium">
					<div class="etherium-amount ${player.name == info.name ? "me" : ""}">${Math.round(Math.floor(player.eth * 100)) / 100}</div>
					<div class="etherium-symbol">
						<img class="ether" src="img/ether.png" alt="">
					</div>
				</div>
			</div>`
	}
	playersElement.innerHTML = html
}


function removeCards() {
	for (let nft of nftCards) {
		nft.remove()
	}
	nftCards = []
}

function startRound(nfts) {

	removeCards()

	for (let i = 0; i < nfts.length; i++) {
		setTimeout(() => {
			nftCards.push(new NFT(nfts[i]))
		}, i * 50)
	}

	startCountdown()
}



var countdownBar = document.getElementById("countdown-animation")
var countdownText = document.getElementById("countdown")

function stopCountdown() {
	clearInterval(countdown)
	countdownText.innerText = "Time's up!"
	countdownBar.style.width = "0%"
}



function startCountdown() {
	let start = Date.now()
	countdownText.innerText = `Pick an NFT (${round + 1}/${totalRounds})`
	countdown = setInterval(() => {
		let timeLeft = 10 - Math.floor((Date.now() - start)) / 1000
		let timeLeftString = String(Math.round(timeLeft * 10) / 10)
		if (timeLeftString.length == 1) timeLeftString = timeLeftString + ".0"

		countdownBar.style.width = `${timeLeft / 10 * 100}%`

		if (timeLeft <= 0) {
			stopCountdown()
		}

	}, 10)
}

function shuffleArr(array) {
	for (var i = array.length - 1; i > 0; i--) {
		var rand = Math.floor(Math.random() * (i + 1));
		[array[i], array[rand]] = [array[rand], array[i]]
	}
}