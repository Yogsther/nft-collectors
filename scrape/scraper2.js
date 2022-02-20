let els = document.getElementsByClassName("styles__StyledLink-sc-l6elh8-0 ekTmzq Asset--anchor")

for (let el of els) {
	let price = Number(els[0].getElementsByClassName("Price--raw-symbol")[0].parentElement.innerText)
	if (price != NaN) {
		let nft = {
			name: el.getElementsByClassName("AssetCardFooter--name")[0].innerText,
			image: el.getElementsByClassName("Image--image")[0].src,
			price
		}
		if (nft.image && nft.name && !exists(nft))
			nfts.push(nft)
	}
}

console.error(nfts.length)

function exists(nft) {
	for (let n of nfts)
		if (n.name == nft.name)
			return true
	return false
}

