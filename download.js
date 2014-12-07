var fs      = require('fs'),
    request = require('request-promise'),
    nconf   = require('nconf'),
    Promise = require('bluebird'),
    qs      = require('querystring'),
    pfs     = Promise.promisifyAll(require('fs'));

var config = nconf.file('config.json').env();

var key = config.get('youtube:key');

if(!fs.existsSync('download'))
	fs.mkdirSync('download');

var channels = JSON.parse(fs.readFileSync('channels.json'));
var downloadedVideos = {};
var downloadedChannels = [];

function processVideoComments(cat, video)
{
	return Promise.settle(video.videos.map(function(id) {
		if((downloadedVideos[video.name] || []).indexOf(id) > -1) return Promise.resolve('Video already parsed.');
		console.log('(Download comments ' + id + ')');
		return request('https://gdata.youtube.com/feeds/api/videos/'+id+'/comments?alt=json&max-results=50&key=' + key);
	})).then(function(result) {
		var promises = [];
		for(var i=0;i<result.length;i++)
		{
			console.log('(Downloaded comments ' + video.videos[i] + ')');
			if(typeof result[i]['_settledValue'] != 'string') continue;
			if(result[i]['_settledValue'] == 'Video already parsed.') continue;
			var data = JSON.parse(result[i]['_settledValue']);
			if(!data.feed.entry) continue;
			var comments = data.feed.entry.map(function(e) { return e.content['$t']; });
			var path = 'download/' + cat + '/' + video.name + '/' + video.videos[i] + '.json';
			var promise = fs.writeFileSync(path, JSON.stringify({comments: comments}));
		}
	}).catch(function(err) {
		if(err.error == 'Commenting is disabled for this video.') return;
		throw err;
	});
}

function processVideos(cat, videos)
{
	return Promise.all(videos.map(function(data) {
		return processVideoComments(cat, {name: data.name, videos: data.videos});
	}));
}

function processPlaylists(cat, playlists)
{
	return Promise.all(playlists.map(function(data) {
		var id = data.playlist;
		console.log('(Downloading playlist ' + data.name + ')');
		return request('https://www.googleapis.com/youtube/v3/playlistItems?' + qs.stringify({
			playlistId: id,
			maxResults: 10 + (downloadedVideos[data.name] || []).length,
			key: key,
			part: 'snippet',
			fields: 'items(snippet(resourceId))'
		}));
	})).then(function(result) {
		var videos = [];
		for(var i=0;i<result.length;i++)
		{
			console.log('(Downloaded playlist ' + playlists[i].name + ')');
			if(result[i].error) continue;
			var data = JSON.parse(result[i]);
			videos.push({
				name: playlists[i].name, 
				videos: data.items.map(function(e) { return e.snippet.resourceId.videoId; }).slice((downloadedVideos[data.name] || []).length)
			});
		}
		return processVideos(cat, videos);
	});
}

function processCategory(category)
{
	var path = 'download/' + category;
	if(!fs.existsSync(path))
		fs.mkdirSync(path);
	var requests = channels[category].map(function(channel) {
		if(downloadedChannels.indexOf(channel) > -1) return Promise.resolve('Channel already downloaded.');
		var path = 'download/' + category + '/' + channel;
		if(!fs.existsSync(path))
			fs.mkdirSync(path);
		return request('https://www.googleapis.com/youtube/v3/channels?' + qs.stringify({
			forUsername: channel,
			part: 'contentDetails',
			key: key
		}));
	});
	return Promise.all(requests).then(function(result) {
		var playlists = [];
		for(var i=0;i<channels[category].length;i++)
		{
			if(result[i] == 'Channel already downloaded.') continue;
			var data = JSON.parse(result[i]);
			if(data.items.length == 0) continue;
			playlists.push({name: channels[category][i], playlist: data.items[0].contentDetails.relatedPlaylists.uploads});
		}
		return processPlaylists(category, playlists);
	}).then(function(result) {
		console.log('-finished ' + category + '-');
	}).catch(function(err) { console.error(err); });
}

function processCategories(i)
{
	if(i >= Object.keys(channels).length) return Promise.resolve('No more categories to process.');
	return processCategory(Object.keys(channels)[i]).then(function(e) {
		processCategories(++i);
	});
}

function findDownloadedChannels(category)
{
	if(fs.existsSync('download/' + category))
	{
		channels[category].forEach(function(channel) {
			files = fs.readdirSync('download/' + category + '/' + channel);
			if(files.length >= 10)
				downloadedChannels.push(channel);
			downloadedVideos[channel] = [];
			files.forEach(function(file) {
				downloadedVideos[channel].push(file.replace('.json', ''));
			});
		});
	}
}

Object.keys(channels).map(function(e) { findDownloadedChannels(e); });

processCategories(0);