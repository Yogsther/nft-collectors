
var socket = io.connect()

var info = {
	code: "",
	name: ""
}

const params = new Proxy(new URLSearchParams(window.location.search), {
	get: (searchParams, prop) => searchParams.get(prop),
});



socket.on("connect", () => {
	console.log("Connected to NFT nodes")
})

var views = {
	LOGIN: "start-screen",
	LOBBY: "lobby-view",
	GAME: "game-window",
}

openView(views.LOGIN)

var nftArea = document.getElementById("nft-claim-area")

var nameInput = document.getElementById("name-input")
var codeInput = document.getElementById("code-input")
var joinButton = document.getElementById("create-or-join-game-button")
var buttonIcon = document.getElementById("join-icon")
var joinButtonText = document.getElementById("join-button-text")

document.getElementById("copy-link-button").addEventListener("click", () => {
	navigator.clipboard.writeText(`${window.location.origin}?code=${info.code}`);
})

if (params.code) {
	codeInput.value = params.code
	setButtonState(false)
} else {
	setButtonState()
}

function openView(view) {
	for (let v in views)
		document.getElementById(views[v]).style.display = "none"

	document.getElementById(view).style.display = "block"
}

joinButton.addEventListener("click", () => {
	let request = {
		code: codeInput.value,
		name: nameInput.value
	}
	console.log("Sending")
	socket.emit("join_lobby", request)
})

socket.on("error", message => {
	displayError(message)
})

socket.on("update", data => {
	if (!data.inGame) {
		openView(views.LOBBY)
		updateLobby(data.players)
	}
	updateScoreboard(data.players)
})


socket.on("start_game", () => {
	openView(views.GAME)
})

socket.on("joined", data => {
	info = data
})


codeInput.addEventListener("input", el => {
	el.target.value = el.target.value.toUpperCase()
	setButtonState(el.target.value.length == 0)
})



function displayError(message = "") {
	var error = document.getElementById("error-message")
	error.innerText = message
}




function setButtonState(newGame = true) {
	joinButtonText.innerText = newGame ? "New Game" : "Join Game"
	buttonIcon.innerHTML = newGame ? `<path d="M0 0h24v24H0V0z" fill="none"/><path d="M18 13h-5v5c0 .55-.45 1-1 1s-1-.45-1-1v-5H6c-.55 0-1-.45-1-1s.45-1 1-1h5V6c0-.55.45-1 1-1s1 .45 1 1v5h5c.55 0 1 .45 1 1s-.45 1-1 1z"/>`
		: `<g>
	<rect fill="none" height="24" width="24" />
	<rect fill="none" height="24" width="24" />
</g>
<g>
	<path
		d="M10.3,7.7L10.3,7.7c-0.39,0.39-0.39,1.01,0,1.4l1.9,1.9H3c-0.55,0-1,0.45-1,1v0c0,0.55,0.45,1,1,1h9.2l-1.9,1.9 c-0.39,0.39-0.39,1.01,0,1.4l0,0c0.39,0.39,1.01,0.39,1.4,0l3.59-3.59c0.39-0.39,0.39-1.02,0-1.41L11.7,7.7 C11.31,7.31,10.69,7.31,10.3,7.7z M20,19h-7c-0.55,0-1,0.45-1,1v0c0,0.55,0.45,1,1,1h7c1.1,0,2-0.9,2-2V5c0-1.1-0.9-2-2-2h-7 c-0.55,0-1,0.45-1,1v0c0,0.55,0.45,1,1,1h7V19z" />
</g>`


}




function stringToHTML(str) {
	var dom = document.createElement('div');
	dom.innerHTML = str;
	return dom;
};