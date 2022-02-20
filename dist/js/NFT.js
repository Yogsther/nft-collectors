
class NFT {
	constructor(data) {
		this.name = data.name
		this.image = data.image
		this.price = data.price
		this.id = data.id

		this.claimable = true

		this.createCard()
	}

	revealPrice() {
		let price = this.card.getElementsByClassName("nft-display-price")[0]
		let dollarPrice = String(Math.round(this.price * 2647))
		// Insert a space for each 3 digits in dollarPrice
		dollarPrice = dollarPrice.replace(/\B(?=(\d{3})+(?!\d))/g, " ")

		price.innerHTML = `${this.price} <span style="color:gray;">($${dollarPrice})</span>`
	}

	setClaimable(claimable) {
		this.claimable = claimable
	}

	setClaimIconVisible(visible) {
		this.card.getElementsByClassName("nft-display-check")[0].style.display = visible ? "block" : "none"
	}

	onClick() {
		if (!this.claimable) return
		socket.emit("pick", this.id)
		for (let nft of nftCards) {
			nft.setClaimIconVisible(false)
		}
		this.setClaimIconVisible(true)
	}

	onClaimerAnimationDone() {

	}

	remove() {
		this.card.remove()
	}

	showClaimers(claimers) {

		let winner = claimers[0]
		shuffleArr(claimers)

		if (claimers.length == 0) return

		let el = this.card.getElementsByClassName("claims")[0]
		el.style.display = "block"
		el.innerHTML = ""

		let claimElements = []
		for (let name of claimers) {
			claimElements.push(stringToHTML(`
			<div class="claim ">
				<svg class="claim-icon" viewBox="0 0 24 24" fill="#000000">
					<path d="M0 0h24v24H0V0z" fill="none" />
					<path
						d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 3c0 .55.45 1 1 1h1l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h11c.55 0 1-.45 1-1s-.45-1-1-1H7l1.1-2h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.37-.66-.11-1.48-.87-1.48H5.21l-.67-1.43c-.16-.35-.52-.57-.9-.57H2c-.55 0-1 .45-1 1zm16 15c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
				</svg>
				<div class="claim-name">${name}</div>
			</div>`))
		}

		for (let claimEl of claimElements) {
			el.appendChild(claimEl)
		}

		let animationSteps = 22;
		let animationDelay = 30;
		let animationDelayPadding = 1.13;
		let lastUpdate = Date.now()

		let animationIndex = 0;
		let winnerIndex = claimers.indexOf(winner)

		let interval = setInterval(() => {

			if (animationIndex > animationSteps && animationIndex % claimElements.length == winnerIndex) {
				clearInterval(interval)
				this.onClaimerAnimationDone()
			}

			if (Date.now() - lastUpdate > animationDelay) {
				claimElements[(animationIndex) % claimElements.length].classList.remove("winner-claim")
				animationIndex++
				claimElements[(animationIndex) % claimElements.length].classList.add("winner-claim")
				animationDelay *= animationDelayPadding
				lastUpdate = Date.now()
			}
		}, 50)



	}



	createCard() {
		let html = `<div class="nft-display nft-display-interactive">
		<img src="${this.image}"
			class="nft-display-image" alt="">
		<div class="nft-display-name">${this.name}</div>
		<img class="nft-display-ether" src="img/ether.png" alt="">
		<div class="nft-display-price">???</div>
		<svg class="nft-display-check" viewBox="0 0 24 24" fill="#000000">
			<path d="M0 0h24v24H0V0z" fill="none" />
			<path
				d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 3c0 .55.45 1 1 1h1l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h11c.55 0 1-.45 1-1s-.45-1-1-1H7l1.1-2h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.37-.66-.11-1.48-.87-1.48H5.21l-.67-1.43c-.16-.35-.52-.57-.9-.57H2c-.55 0-1 .45-1 1zm16 15c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
		</svg>
		<div class="claims">
			
		</div>
	</div>`


		this.card = stringToHTML(html)
		this.card.addEventListener("click", () => {
			this.onClick()
		})

		nftArea.appendChild(this.card)
	}
}