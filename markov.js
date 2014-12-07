var nconf    = require('nconf'),
    Promise  = require('bluebird'),
    fs       = Promise.promisifyAll(require('fs')),
    redis    = require('redis');

var config = nconf.file('config.json').env();

var clients = [];
function createClients(number, callback)
{
	var selected = 0;
	for(var i=0;i<number;i++)
	{
		clients[i] = redis.createClient(config.get('redis:port'), config.get('redis:host'), {
			auth_pass: config.get('redis:pass')
		});
		clients[i].select(i + 1, function() {
			selected++;
			if(selected >= number)
				callback();
		});
	}
}

function processCategory(num, comments, callback)
{
	var completedComments = 0;
	comments.forEach(function(comment) {
		// byte order mark
		comment = comment.replace(/\ufeff/g, '');
		if(comment.trim() == '') return;
		// stupid comments like "ctrl-f number five"
		if((comment.match(/\d/g) || []).length > 20) return;
		// no unicode emotes, we want words
		if(/[^\x00-\x7f]/.test(comment)) return;
		// stop spamming pls
		if(/https:\/\//.test(comment) || /\.com/.test(comment)) return;
		// newlines mess stuff up
		comment = comment.replace(/\n/g, ' ');
		// and multiple spaces
		comment = comment.replace(/\s+/g, ' ');
		var words = comment.split(' ');
		var wordComplete = 0;
		for(var i=1;i<words.length;i++)
		{
			var prefix = words[i - 1].replace(/\s+/g, '');
			clients[num].hincrby(prefix, words[i], 1);
		}
	});
	callback();
}

var categories;

fs.readdirAsync('download').then(function(files) {
	files = files.filter(function(f) { return f.substr(-5) == '.json'; });
	categories = files.map(function(f) { return f.substr(0, f.length - 5); });
	return Promise.all(files.map(function(file) {
		return fs.readFileAsync('download/' + file);
	}));
}).then(function(data) {
	createClients(categories.length, function() {
		function nextCategory(i)
		{
			if(i >= data.length) return;
			console.log('Processing category ' + i + ' - ' + categories[i]);
			processCategory(i, JSON.parse(data[i]).comments, function() {
				nextCategory(++i);
			});
		}

		nextCategory(0);
	});
});