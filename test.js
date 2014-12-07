// lazy test
var youtube = require('./youtube-comments.js'),
	fs      = require('fs');

youtube.load(JSON.parse(fs.readFileSync('database.json')));

console.log(youtube.generate('news', 200, {
	stripSpecial: true,
	alwaysRandom: true
}));