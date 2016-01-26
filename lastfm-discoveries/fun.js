if(typeof(console) === 'undefined') {
    var console = {}
    console.log = console.error = console.info = console.debug = console.warn = console.trace = console.dir = console.dirxml = console.group = console.groupEnd = console.time = console.timeEnd = console.assert = console.profile = function() {};
}


var LASTFMFUN = (function($) {
	var pub = {}; // public functions

	/* Create a cache object */
	// FIXME: IE BUG, for now let's just disable the cache
	// var cache = new LastFMCache();

	/* Create a LastFM object */
	var lastfm = new LastFM({
		apiKey    : '4d4cc17c65e47eae3f2bedf8a9e4c9eb',
		apiSecret : 'ecc720a74300320cdac50cc102e9a182'
		//cache     : cache
	});

	var RETRYLIMIT = 5;

	/* utils */	
	function yearstart(year) {
		return parseInt((new Date(year, 0, 1)).getTime() / 1000);
	};
	function parseyear(timestamp) {
		return (new Date( timestamp *1000)).getFullYear();
	};
	function getHandleError(fn, args, successFn, tries) {
		return function(code, msg) {
			// api's error codes don't seem to match reality -> fall back on error messages 
			if (msg == "No user with that name was found") {
				error("Sorry, user " + $('#username').val() + " couldn't be found. Please, check spelling!");
			}
			else if (msg == "There are no charts available for this user.") {
				error("Sorry, couldn't find any scrobbles for user " + $('#username').val() + ". Please, check spelling!");
			}
			else {
				if (tries < RETRYLIMIT) {
					fn(
						args,
						{
							success: successFn,
							error: getHandleError(fn, args, successFn, tries+1)
						}
					);
					debug("failure! trying again!");
				}
				else {
					$('#error').append(code + ": " + msg + "<br>");
				}
			}
		};
	};
	
	function continueAnyway(fn) {
		fn();
	};

	function callLastfm(method, args, successFn) {
		var success = function(data) {
			successFn(data);
		};
		var error = getHandleError(method, args, success, 0);
		method( args, { success: success, error: error } );
		// TODO: add timeout handler
	};
	
	function debug(msg) {
		if ( console && console.log ) {
			if ( typeof msg === "string" ) 
				console.log( (new Date).toLocaleTimeString() + " " + msg );
			else
				console.log( msg );
		}
		else {
			alert(msg);
		}
	};

	/* /utils */

	pub.newartists = function(username, year, ready, error) {
		var MINPLAYS = 25;  // you have to have scrobbled at least this many songs from an artist before we consider it
		var DELAY = 1000;   // delay between batches of api calls
		var BATCHSIZE = 15; // calls per batch
		var $result = $('#result');
		var params = {
			user: username,
			from: yearstart(year),
			to:   yearstart(year+1)
		};
	
		var playcounts = {};
		var results = [];
		
		var chartCalls = 0;
		var artistCalls = 0;
		
		var calculatePlaycountsAlarm;

		// STEP 1: get weekly charts for the year
		var filterChartlists = function(data) {
			debug("filterChartlists");
			$.each( data.weeklychartlist.chart, function(i, chart) { 
				if (chart.to < params.from) return;
				if (chart.from > params.to) return;
				
				// get top artists from that week
				chartCalls++;
				lastfm.user.getWeeklyArtistChart(
					{
						user: params.user,
						from: chart.from,
						to:   chart.to
					},
					{
						success: calculatePlaycounts,
						error:   getHandleError()
					}
				);
			});
			
			if (chartCalls < 1) {
				error("Sorry, couldn't find any scrobbles from year " + year);
				//error("Sorry, couldn't find any scrobbles from year " + $('#year').val());
			}
		};
		
		// STEP 2: calculate playcounts for all the artists
		var calculatePlaycounts = function(data) {
			//debug("calculatePlaycounts");
			if (data.weeklyartistchart && data.weeklyartistchart.artist) {
				if ($.isArray(data.weeklyartistchart.artist)) {
					// more than 1 artist on chart this week
					$.each(data.weeklyartistchart.artist, function(i, artist) {
						if (playcounts[artist.name])
							playcounts[artist.name] += parseInt(artist.playcount, 10);
						else
							playcounts[artist.name] = parseInt(artist.playcount, 10);
					});
				}
				else {
					// just 1 artist this week
					if (playcounts[data.weeklyartistchart.artist.name])
						playcounts[data.weeklyartistchart.artist.name] += parseInt(data.weeklyartistchart.artist.playcount, 10);
					else
						playcounts[data.weeklyartistchart.artist.name] = parseInt(data.weeklyartistchart.artist.playcount, 10);
				}
			}
			// after all weekly charts have been processed, we can check for new artists
			if (--chartCalls === 0) {
				clearTimeout(calculatePlaycountsAlarm);
				debug("didn't get stuck at calculatePlaycounts");
				filterArtists();
			}
				
			// hackety hack TODO: make this better
			if (chartCalls === 1) {
				calculatePlaycountsAlarm = setTimeout(filterArtists, 5000);
			}
		};
		
		// STEP 3: filter out artists who do not have enough plays 
		var filterArtists = function() {
			debug("filterArtists");
			// copy playcounts to an array for sorting
			var tocheck = [];
			$.each(playcounts, function(artist, playcount) {
				// filter noise
				if (playcount < MINPLAYS) return;
				
				tocheck.push([artist, playcount]);
			});
			// sort
			tocheck.sort(function(a, b) {return b[1]-a[1];});			
			// ...and move on to the next step
			findNewArtists(tocheck);
		};
		
		// STEP 4: filter out artists who have plays before asked year
		var findNewArtists = function(artists) {
			debug("findNewArtists");
			var i = 0;
			var batchCalls = 0;	
			var calculated = 0;
			var stuck = 0;
			var firstOfJanuary = yearstart(params.year);
	
			var processNextBatch = function() {
				debug("processNextBatch " + i);
				if (stuck >= 8) { // forget about stuck calls
					debug("STUCK BUT CLEARED");
					batchCalls = 0;
					stuck = 0;
				}
				if (batchCalls > 0) {
					stuck++;
					setTimeout(processNextBatch, DELAY);
					return;
				}
				else {
					stuck = 0;
				}
				if (results.length >= 10) {
					printResults();
					return;
				}
				
				var batch = artists.slice(i, i+BATCHSIZE);
				$.each(batch, function(index, artist) {
					batchCalls++;
					var args = {
						user:         params.user,
						artist:       artist[0],
						endTimestamp: params.from
					};
					lastfm.user.getArtistTracks (
						args,
						{
							success: checkFreshness,
							error:   getHandleError(lastfm.user.getArtistTracks, args, checkFreshness, 0)
						}
					);
				});
				
				i += BATCHSIZE;
				if (results.length >= 10 || calculated >= artists.length) {
					printResults();
					return;
				}
				else {
					setTimeout(processNextBatch, DELAY);
					return;
				}
			};
			
			var checkFreshness = function(data) {
				batchCalls--;
				calculated++;
				// if (data.artisttracks['@attr'] && data.artisttracks['@attr'].items < MINPLAYS) {
				if (data.artisttracks['@attr'] && data.artisttracks.track.length < MINPLAYS) { // api broken, .items not found, workaround 2016-01-26, http://www.last.fm/api/show/user.getArtistTracks
					// some plays but less than minimum
					results.push([data.artisttracks['@attr'].artist, playcounts[data.artisttracks['@attr'].artist], data.artisttracks]); 
				}
				// else if (!data.artisttracks['@attr'] && data.artisttracks.items < MINPLAYS) {
				else if (!data.artisttracks['@attr'] && data.artisttracks.track.length < MINPLAYS) { // api broken, .items not found, workaround 2016-01-26, http://www.last.fm/api/show/user.getArtistTracks
					// no previous plays at all
					results.push([data.artisttracks.artist, playcounts[data.artisttracks.artist], data.artisttracks]);
				}
			};
			
			// start the mind boggling process!
			processNextBatch(); 
		};	
			
		// STEP 5: it's all ready TODO: is this useless?
		var printResults = function() {
			debug("printResults");
			results.sort(function(a,b){return b[1]-a[1];});
			ready(results);
		};
		
		// STEP -1: validate parameters
		if ( isNaN(params.from) || isNaN(params.to) ) {
			error("There's something wrong with the year. Please check it!");
			//error($('#year').val() +  " is not a valid year.");
			return;
		}
		
		// STEP 0: start the process!
		lastfm.user.getWeeklyChartList(
			{user: params.user},
			{
				success: filterChartlists,
				error:   getHandleError()
			}
		);
	};
	
	pub.fetchPicture = function(artist, ready) {
		var MINDIM = 320; // picture has to be atleast this wide & tall
	
		var showThePicture = function(data) {
			var url = "";
			var width = -1;
			var height = -1;
			var best = 100; // smaller is better

			if ($.isArray(data.images.image)) {
				// more than 1 image
				$.each(data.images.image, function(i, images) {
					if (images.sizes && images.sizes.size) {
						var orig = images.sizes.size[0];
						var origWidth = parseInt(orig.width, 10);
						var origHeight = parseInt(orig.height, 10);

						var score = Math.abs(1-origWidth/origHeight)+0.01*i;
						if (origWidth < MINDIM || origHeight < MINDIM) score += 100; // only if there's nothing better!
						if (origWidth > MINDIM*2 || origHeight > MINDIM*2) score += 1; // we prefer smaller images
						if (score < best) {
							url = orig['#text'];
							width = origWidth;
							height = origHeight;							
							best = score;
						}
					}
				});
			}
			else {
				// 1 image or no images at all
				if (data.images.image && data.images.image.sizes.size) {
					// 1
					var orig = data.images.image.sizes.size[0];
					url = orig['#text'];
					width = parseInt(orig.width, 10);
					height = parseInt(orig.height, 10);
				}
				else {
					// 0
				}	
				
			}
			ready(url, width, height);			
		};
		
		var args = {
			artist: artist,
			limit:  20,
			order:  "popularity"
		};
	
//		lastfm.artist.getImages(
//			args,
//			{
//				success: showThePicture,
//				error:   getHandleError(lastfm.artist.getImages, args, showThePicture, 0)
//			}
//		);
		callLastfm( lastfm.artist.getImages, args, showThePicture );		
	};

	return pub;
})(jQuery);

