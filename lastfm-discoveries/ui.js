function showResults(results) {
	var LASTFMROOT = "http://www.last.fm/music/";
	var boxWidth = 320;
	var year = $('#year').val();
	var $results = $('#results');
	var $ol = $('<ol></ol>').attr("id", "result-list");

	$.each(results, function(i, artist) {
		if (i > 11) return; // we are interested only in top 12
		
		var $wrapper = $('<div/>');
		var $img = $('<img>'); // .attr("title", artist[1] + " plays in " + year);
		var $name = $('<span/>')
						.addClass('artistTitle')
						.append($('<a href="'+LASTFMROOT+artist[0].replace(/ /g, "+")+'">'+artist[0]+'</a>'))
		
		LASTFMFUN.fetchPicture(artist[0], function(url, width, height) {
			if (url === "") url = "no-image.gif";
			
			$img
				.attr("src", url)
				.css("position", "relative");
			if (height > width) {
				var offset = ((((boxWidth/width)*height)-boxWidth)/2);
				$wrapper
					.css("height", boxWidth+"px")
					.css("overflow-y", "hidden")
					.css("overflow-x", "hidden");
				$img
					.attr("width", boxWidth)
					.css("top", "-" + offset + "px");
				$name
					.css("top", "-" + (offset*2+62) + "px");						
			}
			else {
				var offset = ((((boxWidth/height)*width)-boxWidth)/2);
				$wrapper
					.css("width", boxWidth+"px")
					.css("overflow-x", "hidden")
					.css("overflow-y", "hidden");
				$img
					.attr("height", boxWidth)
					.css("left", "-" + offset + "px");
				$name
					.css("top", "-62px");		
			}
				
			
		});
		
		var $li = $('<li>');
		$li.append($wrapper.append($img).append($name));
		$ol.append($li);
		
		
	});
	
	$results.empty();
	$results.append('<h2>The results are in! These are the artists you started listening in '+$('#year').val()+'.</h2>').append($ol);	
	$('#share').show();
	$('#link').attr('href', '?u='+$('#username').val()+'&y='+$('#year').val());
	

}

function error(msg) {
	var $error = $('#error');
	$error.show();
	$error.append(msg + "<br>");
	$('#results').empty();
}

$(document).ready(function() {
	// attach stuff. TODO: actually we depend on javascript, so the buttons should be made here
	
	// we depend on javascript, so we'll make this here
	var $form = $('<form>', {'id': 'action'});
	var $username = $('<input>', {'id': 'username', 'type': 'text', 'value': 'username'});
	var $lastyear = $('<input>', {'id': 'lastyear', 'type': 'button', 'value': '<'});
	var $year = $('<input>', {'id': 'year', 'type': 'text', 'value': (new Date()).getFullYear()-1, 'maxlength': 4});
	var $nextyear = $('<input>', {'id': 'nextyear', 'type': 'button', 'value': '>'});
	var $search = $('<input>', {'id': 'search', 'type': 'submit', 'value': 'enlighten me!'});
	var $demo = $('<input>', {'id': 'demo', 'type': 'button', 'value': 'DEMO'});
	
	$form
		.append('Color me interested! I am ')
		.append($username)
		.append(" and I'd like to know which artists I found in ")
		.append($lastyear)
		.append($year)
		.append($nextyear)
		.append(', ')
		.append($search); //.append($demo);
	
	$('#javascriptError').replaceWith($form);
	
	$lastyear.click(function() {
		$year.val( parseInt($year.val(),10)-1 );
	});

	$nextyear.click(function() {
		// you're not allowed to go t
		if ($year.val() < parseInt((new Date()).getFullYear(), 10)) 
			$year.val( parseInt($year.val(),10)+1 );
	});
	
	$username.click(function() {
		$username.unbind('click');
		$username.val('');
	});
	
	$form.submit(function(event) {
		var illegalUsername = /[^A-Za-z0-9\-_]/g;
		var illegalYear = /[^0-9]/g;
		var username = $username.val().replace(illegalUsername,"");
		var year = parseInt($year.val().replace(illegalYear,""),10);
		$username.val(username); // put it back to form, too!
		var $results = $('#results');
		var $error = $('#error');
		$results.empty();
		$error.empty();
		$error.hide();
		$('#share').hide();
		
		$results.append( 
			$('<div/>').css('width', 960)
					   .css('height', 200)
					   .css('text-align', 'center')
					   .css('padding-top', '100px')
					   .append('<img src="loading.gif"><br>')
					   .append('<span id="loading-message">Working! This will take a moment.</span>')
		);


		LASTFMFUN.newartists( 
			username,
			year,
			showResults,
			error
		);
		
		event.preventDefault();
	});
	
	$demo.click(function() {
	    var sample = [["Kid Cudi", 331], ["Royce da 5'9\"", 236], ["Raekwon", 213], ["Capone-N-Noreaga", 182], ["Drake", 130], ["Maino", 129], ["...And You Will Know Us By the Trail of Dead", 100], ["Wale", 94], ["Regina", 90], ["Asa", 81], ["Gucci Mane", 72], ["N.O.R.E", 71], ["Rakim", 69]];
//	    var sample = [["Kid Cudi", 331], ["Royce da 5'9\"", 236], ["Raekwon", 213], ["Capone-N-Noreaga", 182]];
		showResults(sample);
	});
	
	
	// check if we have parameters set in the query string
	var urlParams = {};
	(function () {
		var e,
			a = /\+/g,  // Regex for replacing addition symbol with a space
			r = /([^&=]+)=?([^&]*)/g,
			d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
			q = window.location.search.substring(1);

		while (e = r.exec(q))
		   urlParams[d(e[1])] = d(e[2]);
	})();
	if (urlParams.u != null && urlParams.y != null) {
		username = urlParams.u;
		$username.val(username);
		year = parseInt(urlParams.y, 10);
		$year.val(year);
		$form.submit();
	}
});
