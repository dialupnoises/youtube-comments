var Promise = require('bluebird'),
	realFs  = require('fs'),
	fs      = Promise.promisifyAll(require('graceful-fs')),
    nconf   = require('nconf'),
    path    = require('path');

var config = nconf.file('config.json').env();

var channels = JSON.parse(realFs.readFileSync('channels.json'));

function readdirCombineAsync(dir)
{
	return fs.readdirAsync(dir).then(function(result) {
		return Promise.resolve(result.map(function(e) {
			return path.join(dir, e)
		}));
	});
}

function addFiles(category, files)
{
	var flattened = [];
	var filesComplete = 0;
	files.forEach(function(file) { file.forEach(function(f) { flattened.push(f); }); });
	var comments = flattened.map(function(f) { return JSON.parse(f).comments; }).reduce(function(a, b) { return a.concat(b); });
	return fs.writeFileAsync('download/' + category + '.json', JSON.stringify({'comments': comments})).then(function(e) {
		console.log('Saved ' + comments.length + ' comments from ' + flattened.length + ' files.');
	});
}

fs.readdirAsync('download').then(function(result) {
	return Promise.all(Object.keys(channels).map(function(e) {
		return readdirCombineAsync('download/' + e);
	}));
}).then(function(result) {
	var promises = [];
	for(var i=0;i<result.length;i++)
	{
		var reads = [];
		result[i].forEach(function(channel) {
			reads.push(readdirCombineAsync(channel));
		});
		promises.push(Promise.all(reads));
	}
	return Promise.all(promises);
}).then(function(result) {
	var promises = [];
	for(var i=0;i<result.length;i++)
	{
		var reads = [];
		var category = Object.keys(channels)[i];
		result[i].forEach(function(channels) {
			var files = [].concat.apply(channels);
			reads.push(Promise.all(
				files.map(function(e) { return fs.readFileAsync(e, {encoding: 'utf8'}); })
			));
		});
		promises.push(Promise.all(reads));
	}
	return Promise.all(promises);
}).then(function(files) {
	function processCategory(i)
	{
		if(i >= files.length) return;
		console.log('Processing category ' + Object.keys(channels)[i]);
		addFiles(Object.keys(channels)[i], files[i]).then(function() {
			processCategory(++i);
		});
	}
	processCategory(0);
});

var categories = Object.keys(channels).sort();

fs.readdirAsync('database').then(function(results) {
	return Promise.all(results.map(function(file) {
		return fs.readFileAsync('database/' + file, {encoding: 'utf8'});
	}));
}).then(function(results) {
	var output = {};
	for(var i=0;i<results.length;i++)
		output[categories[i]] = JSON.parse(results[i]);
	return fs.writeFileAsync('database.json', JSON.stringify(output));
});