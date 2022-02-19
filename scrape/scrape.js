
let nfts = []

for (let el of document.getElementsByClassName("nfts")[0].children) {
	try {
		let image = el.getElementsByClassName("Image--image")[0].src
		let name = el.getElementsByClassName("AssetCardFooter--name")[0].innerText
		let price = el.getElementsByClassName("Overflowreact__OverflowContainer-sc-7qr9y8-0 jPSCbX Price--amount")[0].innerText
		let nft = {
			image, name, price
		}
		nfts.push(nft)
	} catch (e) { }

}
console.error(JSON.stringify(nfts))

