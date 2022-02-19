var lobbyPlayersContainer = document.getElementById("lobby-players")
var startGameButton = document.getElementById("start-game-button")

startGameButton.addEventListener("click", () => {
	socket.emit("start_game")
})

function updateLobby(players) {

	document.getElementById("lobby-code-text").innerText = info.code
	document.getElementById("game-code-window").innerText = info.code

	if (players[0].name == info.name)
		startGameButton.removeAttribute("disabled")
	else startGameButton.setAttribute("disabled", "disabled")

	let html = ""
	for (let player of players) {
		html += `<div class="lobby-player">
		<div class="lobby-player-name">${player.name}</div>
		<div class="lobby-player-wallet">
			<img src="img/ether.png" class="lobby-player-ether-icon" alt="">
			<div class="lobby-player-amount">${Math.round(Math.floor(player.eth * 100)) / 100}</div>
		</div>
		</div>`
	}
	lobbyPlayersContainer.innerHTML = html
}

