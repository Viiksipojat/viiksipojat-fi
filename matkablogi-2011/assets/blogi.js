$(document).ready(function(){
	$("#eurooppa-i").affix({
		offset: {
			top: 105,
			bottom: 1290,
			fade: 1111
		}
	});
	$("#kiina").affix({
		offset: {
			top: 1290,
			bottom: 9663
		}
	});
	$("#thaimaa").affix({
		offset: {
			top: 9663,
			bottom: 15979
		}
	});
	$("#japani").affix({
		offset: {
			top: 15979,
			bottom: 27218
		}
	});
	$("#amerikka").affix({
		offset: {
			top: 27218,
			bottom: 36861
		}
	});
	$("#eurooppa-ii").affix({
		offset: {
			top: 36861
		}
	});
	$("img.lazy").show().lazyload({
		effect : "fadeIn"
	});
});