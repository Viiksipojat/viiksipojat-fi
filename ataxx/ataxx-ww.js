// web worker implementation of ataxx artifical intelligence opponent

importScripts('ataxx-common.js');

ATAXX = {}; // we have to create fake ATAXX so that we can use constants

function progress(completion) {
	postMessage({'status': 'progress', 'completion': completion});
};

function markMove(row, column) {
	postMessage({'status': 'markMove', 'row': row, 'column': column});
};

console = {};
console.log = function(msg) {
	postMessage({'status': 'debug', 'debug': msg});
};

onmessage = function(e) {
	var action = e.data.action;
	if (action == 'move') {
		var board = e.data.board;
		var difficulty = e.data.difficulty;
		var lastRow = e.data.lastRow;
		var lastColumn = e.data.lastColumn;		
		ATAXX = e.data.constants;
		
		var msg = {
			'status': 'finished',
			'board':  AI.move(board, difficulty, lastRow, lastColumn, markMove, progress)
		};
		
		postMessage(msg);
	}
};
