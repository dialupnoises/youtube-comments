var YoutubeComments = (function() {
	var database = {};

	function shuffle(o) {
		for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
		return o;
	}

	// genetic algorithms to the moon
	function selectKey(population)
	{
		var sum = 0, probSum = 0, probabilities = [];
		Object.keys(population).forEach(function(key) {
			sum += population[key];
		});
		Object.keys(population).forEach(function(i, key) {
			probabilities[i] = sum + (population[key] / sum);
			probSum = probabilities[i];
		});
		var rand = Math.random();
		for(var i=0;i<population.length;i++)
		{
			if(!probabilities[i + 1] || rand < probabilities[i + 1])
				return Object.keys(population)[i];
		}
		return Object.keys(population)[0];
	}

	function loadDatabase(data)
	{
		database = data;
	}

	function generate(category, targetLength, options)
	{
		var options = options || {};
		var alwaysRandom = options.alwaysRandom || false;
		var stripSpecial = options.stripSpecial || true;
		var data = database[category];
		var keys = shuffle(Object.keys(data));
		var totalLength = 0;
		function generatePortion(start)
		{
			var startKeys = Object.keys(data[start]).filter(function(e) { return typeof data[e] !== 'undefined'; });
			var key;
			if(startKeys.length == 0)
			{
				var newKey = shuffle(Object.keys(data))[0];
				key = {};
				key[newKey] = 1;
			}
			else
			{
				key = {};
				startKeys.forEach(function(k) {
					key[k] = data[start][k];
				});
			}
			if(alwaysRandom)
				nextKey = shuffle(keys)[0];
			else
			{
				var nextKey = null;
				while(!nextKey)
					nextKey = selectKey(key);
			}
			var text = start + ' ';
			totalLength += text.length;
			if(totalLength >= targetLength)
				return text + nextKey;
			return text + generatePortion(nextKey);
		}
		if(stripSpecial)
			return (generatePortion(keys[0]).replace(/[^\d\w\.\?\!\s]+/, ''));
		return generatePortion(keys[0]);
	}

	return {
		load: loadDatabase,
		generate: generate
	};
})();

if(typeof module !== 'undefined' && module.exports)
	module.exports = YoutubeComments;