$(function() {
	console.log("BOOM! let's ciné!")
	$('.thumbnail').click(clickHandler);
	$(".nav a").click(nav);

	// stash init
	!localStorage.getItem("stash") && localStorage.setItem("stash", "{}");

	//showmine();
	visualz(null);
});

function nav(e) {
	e.preventDefault();
	var $this = $(this);
	//if ($this.parent().hasClass("active")) return;
	$(".nav>li").removeClass("active");
	$this.parent().addClass("active");	
	//BOOM( $this.attr("href").search("mun") >= 0 );
	BOOM( $this.text().search("Mun") >= 0 );
}

function $get(id) {
	return $('div[data-id="'+id+'"]');
}

function visualz($clicked) {
	var stash = JSON.parse(localStorage.getItem("stash"));

	var classes = {};

	$("[data-id]").each(function() {
		var $this    = $(this);
		var id       = $this.data("id");
		var overlaps = getOverlaps(id);
		var alts     = getAltShows(id); 
		classes[id]  = [];

		if (stash[id]) { // chosen one
			classes[id].push("myboogie");
			if (selected(overlaps)) { // good
				classes[id].push("conflict");
			}
		}
		else { // not chosen
			if (selected(overlaps)) { // selected overlapping
				// dehilight
				classes[id].push("dehilight");
			}
		}

	});

	// ALTERNATIVE SOLUTIONS NOT WORKING TODO: MAKE WORK
	// 
	// $("[data-id]").each(function() {
	// 	var $this    = $(this);
	// 	var id       = $this.data("id");
	// 	var alts     = getAltShows(id); 

	// 	if (selected(alts)) {
	// 		var sids = selectedIds(alts);
	// 		if ($clicked && $clicked.data("id") == id) {
	// 			classes[id].push("myboogie");
	// 			sids.forEach(function(sid) {
	// 				classes[sid].splice(classes.sid.indexOf("myboogie"),1);
	// 				if ( classes[id].indexOf("conflict") != -1 ) {
	// 					classes[sid].push("solution");
	// 				}
	// 				else {
	// 					classes[sid].push("alternative");
	// 				}
	// 			});
	// 		}
	// 		// else if ($clicked) { // at first we call $clicked == null
	// 		// 	console.log("IMPOSSIBLE");
	// 		// 	classes[id].splice(classes.id.indexOf("myboogie"),1);
	// 		// 	var conflictingSid = false;
	// 		// 	sids.forEach(function(sid) {
	// 		// 		classes[sid].push("myboogie");
	// 		// 		if (classes[sid].indexOf("conflict") != -1) {
	// 		// 			conflictingSid = true;
	// 		// 		}
	// 		// 	});
	// 		// 	if (conflictingSid) {
	// 		// 		classes[id].push("solution");
	// 		// 	}
	// 		// 	else {
	// 		// 		classes[id].push("alternative");
	// 		// 	}
	// 		// 	// this: -myboogie +solution/+alternative
	// 		// 	// alt:  myboogie
	// 		// }
	// 	}
	// });

	showClasses(classes);
}

function selected(ids) { // expects an array of ids
	return ids.some(stashed);
}

function selectedIds(ids) { // expects an array of ids
	return ids.filter(stashed);
}

function stashed(id) {
	return JSON.parse(localStorage.getItem("stash"))[id];
}

function showClasses(classes) {
	var defaults = ["thumbnail", "span2", "show"];
	for (var id in classes) {
		var $elem = $get(id);
		var currclasses = $elem.attr("class").split(" ");

		// console.log(id, "CURRRR", currclasses);
		// console.log(id, "REMOVE", _.difference(currclasses, _.union(defaults, classes[id])).join(" "));
		// console.log(id, "ADDDDD", _.difference(classes[id], currclasses).join(" "));

		// plus minus sign business
		if (classes[id].indexOf("myboogie") != -1) {
			$elem.find(".icon").addClass("icon-minus-sign");
			$elem.find(".icon").removeClass("icon-plus-sign");		
		} 
		else {
			$elem.find(".icon").removeClass("icon-minus-sign");
			$elem.find(".icon").addClass("icon-plus-sign");		
		}

		$elem.removeClass(_.difference(currclasses, _.union(defaults, classes[id])).join(" "));
		$elem.addClass(_.difference(classes[id], currclasses).join(" "));
	}
}

function showmine() {
	var stash = JSON.parse(localStorage.getItem("stash"));
	for (var id in stash)
		stash[id] && hilight(id);
}

function hilight(id) {
	var $this = $get(id);
	$this.addClass("myboogie");
	$this.removeClass("dehilight"); // in any case
	$this.find(".icon").toggleClass("icon-minus-sign");
	$this.find(".icon").toggleClass("icon-plus-sign");

	var overlaps = getOverlaps(id);
	overlaps.forEach(function(oid) {
		var $other = $get(oid);
		if ($other.hasClass("myboogie")) {
			// konflik
			$this.addClass("conflict");
			$other.addClass("conflict");
		}
		else {
			// dehilight
			$other.addClass("dehilight");
		}
	});

	var alts = getAltShows(id);
	alts.forEach(function(alt) {

	});
}

function dehilight(id) {
	var $this = $get(id);
	$this.removeClass("myboogie");
	$this.removeClass("conflict"); // cannot be conflict anymore
	$this.find(".icon").toggleClass("icon-minus-sign");
	$this.find(".icon").toggleClass("icon-plus-sign");

	var overlaps = getOverlaps(id);
	overlaps.forEach(function(oid) {
		var $other = $get(oid);
		if ($other.hasClass("dehilight")) {
			// check if still valid
			var valid = false;
			var otherOverlaps = getOverlaps(oid);
			otherOverlaps.forEach(function(ooid) {
				var $oother = $get(ooid);
				if ($oother.hasClass("myboogie"))
					valid = true;
			});
			if (!valid) 
				$other.removeClass("dehilight");
		}
		else if ($other.hasClass("conflict")) {
			// check if still conflict
			var valid = false;
			var otherOverlaps = getOverlaps(oid);
			otherOverlaps.forEach(function(ooid) {
				var $oother = $get(ooid);
				if ($oother.hasClass("myboogie"))
					valid = true;
			});
			if (!valid) {
				$other.removeClass("conflict");
			}
		}
	});
	var dehilight = false;
	overlaps.forEach(function(oid) {
		var $other = $get(oid);
		if ($other.hasClass("myboogie")) {
			dehilight = true;
		}
	});
	if (dehilight) 
		$this.addClass("dehilight");	
}

function save(id) {
	var stash = JSON.parse(localStorage.getItem("stash"));
	stash[id] = !stash[id];
	localStorage.setItem("stash", JSON.stringify(stash));	
}

function clickHandler() {
	var $this = $(this);
	var id = $this.data("id");
	save(id);
	visualz($this);
}

function handleKLIK() {
	var $this = $(this);
	var id = $this.data("id");
	save(id);
	if ($this.hasClass("myboogie")) {
		// removed favorite
		dehilight(id);
	}
	else {
		// added favorite
		hilight(id);
	}
}

// myfest: true if switchng to MY FESTIVAL view
function toggleBoogies(myfest) {
	$('.thumbnail:not(.myboogie)')
		.add('tr:has(.thumbnail):not(:has(.myboogie))')
		.add('table:has(.thumbnail):not(:has(.myboogie))')
		.toggle(!myfest)
}

// myfest: true if switchng to MY FESTIVAL view
function BOOM(myfest) {
	// 1. SAVE CURRENT POSITIONS
	$('.thumbnail.myboogie').each(function() {
		$(this).data('old-position', $(this).position())
		$(this).css('position', 'relative') // 1.5 WHILE AT IT
		$(this).addClass('no-animation')
	})

	// 2. TURN OFF COMPLETELY NON-BOOGIES
	toggleBoogies(myfest)

	// 3. REVERT OLD POSITIONS (LOL)
	$('.thumbnail.myboogie').each(function() {
		var now = $(this).position()
		var was = $(this).data('old-position')
		$(this).css({
			top: was.top - now.top,
			left: was.left - now.left
		})		
	})

	// 4. ANIMATE TO ZERO!!!
	$('.thumbnail.myboogie').removeClass('no-animation').css({
			top: 0,
			left: 0
	})

	// 5. AT SAME TIME, FADE OUT NON-BOOGIE THUMBNAILS
	// $('.thumbnail:not(.myboogie)').fadeToggle()
}

function crapBOOM() {
	$('.thumbnail:not(.myboogie)').animate({
		opacity: 0,
		height: 0
	}, function() {
		$(this).css({
			visibility: "hidden"
		})
	})	
}

function getOverlaps(id) {
	return $get(id).data("overlaps").trim().split(" ");
}

function getAltShows(id) {
	var title = $get(id).data("title");
	return $("div[data-title='"+title+"']:not([data-id='"+id+"'])").map(function() { return $(this).data("id") }).get();
}