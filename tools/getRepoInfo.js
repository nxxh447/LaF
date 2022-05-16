const fetch = require("node-fetch");

fetch("https://api.github.com/repos/Hiro527/LaF/releases")
	.then((res) => res.json())
	.then((data) => {
    	let downloads = 0;
    	Object.values(data[0].assets).forEach((v) => {
        	downloads += v.download_count;
    	});cconsole.log(`Downloads: ${downloads}`);
	}).catch((err) => console.error);
