var nconf    = require('nconf'),
    fs       = require('fs'),
    redis    = require('redis');

var config = nconf.file('config.json').env();

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

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

var categories = Object.keys(JSON.parse(fs.readFileSync('channels.json'))).sort();

createClients(categories.length, function() {
	for(var i=0;i<categories.length;i++)
	{
		(function(i) {
			console.log('Processing ' + categories[i]);
			var output = {};
			clients[i].keys('*', function(err, keys) {
				var roots = shuffleArray(keys).slice(0, 5000);
				var rootProcessed = 0;
				roots.forEach(function(root) {
					output[root] = {};
					clients[i].hgetall(root, function(err, k) {
						var sortedKeys = Object.keys(k).sort(function(a, b) {
							if(k[a] > k[b])
								return 1;
							if(k[a] < k[b])
								return -1;
							return 0;
						});
						sortedKeys.forEach(function(key) {
							output[root][key] = k[key];
						});
						rootProcessed++;
						if(rootProcessed >= roots.length)
						{
							fs.writeFile('database/' + categories[i] + '.json', JSON.stringify(output));
							console.log('finished ' + categories[i]);
						}
					});
				});
			});
		})(i);
	}
});