# YouTube Comments Simulator

It's a Javascript library for generating YouYube comments. I have my reasons.

Most of the scripts in here are ugly scripts used to generate the database that this uses. They are:

* **download.js**, which uses the Google Data APIs to download comments from the latest ten videos from channels specified in channels.json.
* **merge.js**, which merges the comments downloaded from download.js into a single JSON file for each category, and merges every file in database into database.json.
* **markov.js**, which splits up the comments from download.js and puts them into a Redis database i.e. generating the database that's needed to generate Markov chains.
* **download.js**, which takes 5000 random keys from the Redis database for each category and puts them into the database folder. The Redis database is involved because Node runs out of memory if you try to do this all in one step.
* **test.js**, the poor man's test file.

You will not need to run these scripts. You shouldn't even look at these scripts. They're really, really ugly.

## Usage

You'll need youtube-comments.js and database.json. database.json includes all the data that's needed to generate YouTube comments.

First, you need to load the data into the library. I leave this up to the user so you can use AJAX or `fs` or whatever you want.
```javascript
// if node
youtubeComments.load(databaseJSON);

// if browser
YoutubeComments.load(databaseJSON);
```

To generate a sentence, you need to provide a category and a target length. You can also provide an `options` object:
```javascript
youtubeComments.generate('news', 100, {
    alwaysRandom: true
});
```
`alwaysRandom`, the only option at the moment, means that the script will always choose a random word to form a sentence. This basically means you're stringing one random word after another, but you have the option.

## License
The MIT License (MIT)

Copyright (c) 2014 Andrew Rogers

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

