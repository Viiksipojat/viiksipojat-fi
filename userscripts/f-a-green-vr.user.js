// ==UserScript==
// @name 			Reittiopas VR Fix
// @namespace		http://viiksipojat.fi/userscripts/
// @description		Switch to a red icon for trains in Reittiopas
// @icon 			http://viiksipojat.fi/userscripts/pict_juna-fixed.gif
// @include			http://*.reittiopas.fi/*
// @resource 		fixed_20 http://viiksipojat.fi/userscripts/pict_juna-fixed.gif
// @resource 		fixed_24 http://viiksipojat.fi/userscripts/train_icon-fixed.gif
// @version 		1.0
// ==/UserScript==
// TODO:
// - recolor the lines on the map, too
// - rewrite css rule .stop_list_bar_train

var pooped_20 = [
		"http://www.reittiopas.fi/images/resultSummary/pict_juna.gif", 
		"http://linjakartta.reittiopas.fi/img/train.png"
	],
    pooped_24 = [
    	"http://aikataulut.reittiopas.fi/images/ytv/train_icon.jpg"
    ];

var imgs = document.getElementsByTagName("img");
for (var i = 0; i < imgs.length; i++) {
	if (pooped_20.indexOf(imgs[i].src) != -1) {
		imgs[i].src = GM_getResourceURL("fixed_20");
	}
	else if (pooped_24.indexOf(imgs[i].src) != -1) {
		imgs[i].src = GM_getResourceURL("fixed_24");
	}
}

// TODO -> 
// var pooped_color = "#2dbe2c";
// var proper_color = "#cc0000";
// https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver