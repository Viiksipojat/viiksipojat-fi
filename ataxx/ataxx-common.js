// functions which ataxx-webworker and ataxx-runner both need

var ATAXX = {  // only global variable
	// constants & data structures
	BOARDSIZE: 7,
	AILEVELS: {
		'BEGINNER':     0,
		'INTERMEDIATE': 1,
		'EXPERT':       3
	},
	AITYPES: {
		'REGULAR':   0,
		'WEBWORKER': 1
	},
	PLAYERS: {
		'HUMAN':    1,
		'AI':      -1,
		'NOPIECE':  0
	},
	HTML: {
		'LIGHTPIECE': '<img src="lightpiece.png" alt="light" />',
		'DARKPIECE':  '<img src="darkpiece.png" alt="dark" />',
		'HELPER':     '<img src="helper.png" alt="legal move" />',
		'JUMPING':    '<img src="lightpiece-dot.png" alt="light (jumping)" />',
		'LASTMOVE':   '<img src="darkpiece-dot.png" alt="dark (last move)" />',
		'EMPTY':      '<div/>'
	}
};

ATAXX.common = {
//RULEBOOK = {
	// returns if /player/ is allowed to place a new piece on /square/ on /board/
	allowed: function(board, player, square, jumping) {
		if (square.piece !== ATAXX.PLAYERS.NOPIECE) return false; // first requirement: square has to be empty
		if (jumping) {
			if (board[square.row-2][square.column-2].jumping ||  // assumption: only moving player can have jumping pieces
				board[square.row-2][square.column-1].jumping ||
				board[square.row-2][square.column  ].jumping ||
				board[square.row-2][square.column+1].jumping ||
				board[square.row-2][square.column+2].jumping ||
				board[square.row-1][square.column-2].jumping ||
				board[square.row-1][square.column+2].jumping ||
				board[square.row  ][square.column-2].jumping ||
				board[square.row  ][square.column+2].jumping ||
				board[square.row+1][square.column-2].jumping ||
				board[square.row+1][square.column+2].jumping ||
				board[square.row+2][square.column-2].jumping ||
				board[square.row+2][square.column-1].jumping ||
				board[square.row+2][square.column  ].jumping ||
				board[square.row+2][square.column+1].jumping ||
				board[square.row+2][square.column+2].jumping)
					return true;
			else
					return false;
		}
		else {
			if (board[square.row-1][square.column-1].piece === player ||
				board[square.row-1][square.column  ].piece === player ||
				board[square.row-1][square.column+1].piece === player ||
				board[square.row  ][square.column-1].piece === player ||
				board[square.row  ][square.column+1].piece === player ||
				board[square.row+1][square.column-1].piece === player ||
				board[square.row+1][square.column  ].piece === player ||
				board[square.row+1][square.column+1].piece === player) 
					return true;
			else 
					return false;
		}
	},
	
	// returns the move /player/ can make to /square/ on /board/ and undefined if no such move exists
	possible: function(board, player, square) { // TODO: always jumps from the same "angle", a bit of randomization?
		if (ATAXX.common.allowed(board, player, square, false)) 
			return {'jump':   false,
					'player': player,
					'toRow':  square.row,
					'toColumn': square.column };
		else if (board[square.row-2][square.column-2].piece == player)
			return {'jump':       true,
					'player':     player,
					'toRow':      square.row,
					'toColumn':   square.column,
					'fromRow':    square.row-2, 
					'fromColumn': square.column-2 };
		else if (board[square.row-2][square.column-1].piece == player)
			return {'jump':       true,
					'player':     player,
					'toRow':      square.row,
					'toColumn':   square.column,
					'fromRow':    square.row-2, 
					'fromColumn': square.column-1 };
		else if (board[square.row-2][square.column  ].piece == player)
			return {'jump':       true,
					'player':     player,
					'toRow':      square.row,
					'toColumn':   square.column,
					'fromRow':    square.row-2, 
					'fromColumn': square.column };
		else if (board[square.row-2][square.column+1].piece == player)
			return {'jump':       true,
					'player':     player,
					'toRow':      square.row,
					'toColumn':   square.column,
					'fromRow':    square.row-2, 
					'fromColumn': square.column+1 };
		else if (board[square.row-2][square.column+2].piece == player)
			return {'jump':       true,
					'player':     player,
					'toRow':      square.row,
					'toColumn':   square.column,
					'fromRow':    square.row-2, 
					'fromColumn': square.column+2 };
		else if (board[square.row-1][square.column-2].piece == player)
			return {'jump':       true,
					'player':     player,
					'toRow':      square.row,
					'toColumn':   square.column,
					'fromRow':    square.row-1, 
					'fromColumn': square.column-2 };
		else if (board[square.row-1][square.column+2].piece == player)
			return {'jump':       true,
					'player':     player,
					'toRow':      square.row,
					'toColumn':   square.column,
					'fromRow':    square.row-1, 
					'fromColumn': square.column+2 };
		else if (board[square.row  ][square.column-2].piece == player)
			return {'jump':       true,
					'player':     player,
					'toRow':      square.row,
					'toColumn':   square.column,
					'fromRow':    square.row, 
					'fromColumn': square.column-2 };
		else if (board[square.row  ][square.column+2].piece == player)
			return {'jump':       true,
					'player':     player,
					'toRow':      square.row,
					'toColumn':   square.column,
					'fromRow':    square.row, 
					'fromColumn': square.column+2 };
		else if (board[square.row+1][square.column-2].piece == player)
			return {'jump':       true,
					'player':     player,
					'toRow':      square.row,
					'toColumn':   square.column,
					'fromRow':    square.row+1, 
					'fromColumn': square.column-2 };
		else if (board[square.row+1][square.column+2].piece == player)
			return {'jump':       true,
					'player':     player,
					'toRow':      square.row,
					'toColumn':   square.column,
					'fromRow':    square.row+1, 
					'fromColumn': square.column+2 };
		else if (board[square.row+2][square.column-2].piece == player)
			return {'jump':       true,
					'player':     player,
					'toRow':      square.row,
					'toColumn':   square.column,
					'fromRow':    square.row+2, 
					'fromColumn': square.column-2 };
		else if (board[square.row+2][square.column-1].piece == player)
			return {'jump':       true,
					'player':     player,
					'toRow':      square.row,
					'toColumn':   square.column,
					'fromRow':    square.row+2, 
					'fromColumn': square.column-1 };
		else if (board[square.row+2][square.column  ].piece == player)
			return {'jump':       true,
					'player':     player,
					'toRow':      square.row,
					'toColumn':   square.column,
					'fromRow':    square.row+2, 
					'fromColumn': square.column };
		else if (board[square.row+2][square.column+1].piece == player)
			return {'jump':       true,
					'player':     player,
					'toRow':      square.row,
					'toColumn':   square.column,
					'fromRow':    square.row+2, 
					'fromColumn': square.column+1 };
		else if (board[square.row+2][square.column+2].piece == player)
			return {'jump':       true,
					'player':     player,
					'toRow':      square.row,
					'toColumn':   square.column,
					'fromRow':    square.row+2, 
					'fromColumn': square.column+2 };
		else
			return;
	},
	
	// returns if player can jump from /square/ on /board/
	jumpPossible: function(board, square) {
		if ((board[square.row-2][square.column-2].piece === ATAXX.PLAYERS.NOPIECE && !board[square.row-2][square.column-2].outside) || 
			(board[square.row-2][square.column-1].piece === ATAXX.PLAYERS.NOPIECE && !board[square.row-2][square.column-1].outside) ||
			(board[square.row-2][square.column  ].piece === ATAXX.PLAYERS.NOPIECE && !board[square.row-2][square.column  ].outside) ||
			(board[square.row-2][square.column+1].piece === ATAXX.PLAYERS.NOPIECE && !board[square.row-2][square.column+1].outside) ||
			(board[square.row-2][square.column+2].piece === ATAXX.PLAYERS.NOPIECE && !board[square.row-2][square.column+2].outside) ||
			(board[square.row-1][square.column-2].piece === ATAXX.PLAYERS.NOPIECE && !board[square.row-1][square.column-2].outside) ||
			(board[square.row-1][square.column+2].piece === ATAXX.PLAYERS.NOPIECE && !board[square.row-1][square.column+2].outside) ||
			(board[square.row  ][square.column-2].piece === ATAXX.PLAYERS.NOPIECE && !board[square.row  ][square.column-2].outside) ||
			(board[square.row  ][square.column+2].piece === ATAXX.PLAYERS.NOPIECE && !board[square.row  ][square.column+2].outside) ||
			(board[square.row+1][square.column-2].piece === ATAXX.PLAYERS.NOPIECE && !board[square.row+1][square.column-2].outside) ||
			(board[square.row+1][square.column+2].piece === ATAXX.PLAYERS.NOPIECE && !board[square.row+1][square.column+2].outside) ||
			(board[square.row+2][square.column-2].piece === ATAXX.PLAYERS.NOPIECE && !board[square.row+2][square.column-2].outside) ||
			(board[square.row+2][square.column-1].piece === ATAXX.PLAYERS.NOPIECE && !board[square.row+2][square.column-1].outside) ||
			(board[square.row+2][square.column  ].piece === ATAXX.PLAYERS.NOPIECE && !board[square.row+2][square.column  ].outside) ||
			(board[square.row+2][square.column+1].piece === ATAXX.PLAYERS.NOPIECE && !board[square.row+2][square.column+1].outside) ||
			(board[square.row+2][square.column+2].piece === ATAXX.PLAYERS.NOPIECE && !board[square.row+2][square.column+2].outside))
				return true;
		else
				return false;
	},
	
	// returns /board/ after /move/ is applied to it
	applyMove: function(move, board) {
		var player = move.player; // shortcut
		// remove jumping piece
		if (move.jump)
			board[move.fromRow][move.fromColumn].piece = ATAXX.PLAYERS.NOPIECE;
		// place the new piece
		board[move.toRow][move.toColumn].piece = player;
		// flip opponent's pieces
		var opponent = player * -1;
		if (board[move.toRow-1][move.toColumn-1].piece === opponent)
				board[move.toRow-1][move.toColumn-1].piece = player;
		if (board[move.toRow-1][move.toColumn  ].piece === opponent)
				board[move.toRow-1][move.toColumn  ].piece = player;
		if (board[move.toRow-1][move.toColumn+1].piece === opponent)
				board[move.toRow-1][move.toColumn+1].piece = player;
		if (board[move.toRow  ][move.toColumn-1].piece === opponent)
				board[move.toRow  ][move.toColumn-1].piece = player;
		if (board[move.toRow  ][move.toColumn+1].piece === opponent)
				board[move.toRow  ][move.toColumn+1].piece = player;
		if (board[move.toRow+1][move.toColumn-1].piece === opponent)
				board[move.toRow+1][move.toColumn-1].piece = player;
		if (board[move.toRow+1][move.toColumn  ].piece === opponent)
				board[move.toRow+1][move.toColumn  ].piece = player;
		if (board[move.toRow+1][move.toColumn+1].piece === opponent)
				board[move.toRow+1][move.toColumn+1].piece = player;
		// return board after move
		return board;
	},
	
	// returns current score on /board/
	score: function(board) {
		var human = 0;
		var ai = 0;
		var row, column;
		for (row = 2; row < ATAXX.BOARDSIZE+2; row++) {
			for (column = 2; column < ATAXX.BOARDSIZE+2; column++) {
				if (board[row][column].piece === ATAXX.PLAYERS.HUMAN) human++;
				if (board[row][column].piece === ATAXX.PLAYERS.AI)    ai++;
			}
		}
		return {'human': human, 'ai': ai};
	}
};

// ==============

// minimax with alpha-beta pruning implementation for ataxx
//AI = (function() {
ATAXX.ai = (function() {
	var calls;
	var calcTimes;
	var movesMade;
	
	// for benchmarking new features
	var tests = {
		'benchmark': 0,
		'testcase':  0
	};
	var testCase = false;
	

	
	function getMoveSort(row, column) {
		return function(a, b) { // returns negative number if a is closer to [row,column]
			return (Math.abs(a.toRow-row)+Math.abs(a.toColumn-column))-(Math.abs(b.toRow-row)+Math.abs(b.toColumn-column));
		};	
	};
	
	function valueSort(a, b) {
		return b.value - a.value;
	};

	// returns array of possible moves for /player/ on /board/
	function possibleMoves(player, board, lastRow, lastColumn) {
		var moves = [];
		var row, column, move;
		for (row = 2; row < ATAXX.BOARDSIZE+2; row++) { 
			for (column = 2; column < ATAXX.BOARDSIZE+2; column++) { 
				if (board[row][column].piece !== ATAXX.PLAYERS.NOPIECE) continue; 
				move = ATAXX.common.possible(board, player, board[row][column]);
				if (move) moves.push(move);
			}
		}
		return moves.sort( getMoveSort(lastRow, lastColumn) );
	};
	
	function copy(board) {
		var copyBoard = [];
		var row, column, copyRow, copySquare;
		for (row = 0; row < ATAXX.BOARDSIZE+4; row++) { 
			copyRow = [];
			for (column = 0; column < ATAXX.BOARDSIZE+4; column++) { 
				if (row < 2 || column < 2 || row > ATAXX.BOARDSIZE+2 || column > ATAXX.BOARDSIZE+2) {
					// create special empty square to simplify checks on pieces (makes out of bounds errors "impossible" for board array)
					copySquare = { 'piece': 0, 'outside': true };
				}
				else {
					copySquare = {'piece': board[row][column].piece, 'jumping': false, 'row': row, 'column': column};
				}
				copyRow.push(copySquare);
			}
			copyBoard.push(copyRow);
		}
		return copyBoard;
	};
	
	function alphabeta(board, depth, player, alpha, beta, lastRow, lastColumn) {
		calls++;
		//console.log("D: " + depth + ", P: " + player + ", A: " + alpha + ", B: " + beta);
		var i;
		var moves = possibleMoves(player, board, lastRow, lastColumn);
		if (depth === 0 || moves.length === 0) {
			var score = ATAXX.common.score(board);
			return score.ai-score.human;
		}
		else {
			// let's dig deeper!
			var bestValue = (player === ATAXX.PLAYERS.AI ? -50 : 50);
			var currentvalue;
			if (player === ATAXX.PLAYERS.AI) { // alpha-beta MAX
				for (i = 0; i < moves.length; i++) {
					currentValue = alphabeta(ATAXX.common.applyMove(moves[i], copy(board)), depth-1, player*-1, alpha, beta, moves[i].toRow, moves[i].toColumn);
					if (currentValue > bestValue) {
						bestValue = currentValue;
					}
					if (currentValue > alpha) {
						alpha = currentValue;
					}
					if (alpha > beta)
						return bestValue;
				}
			}
			else { // alpha-beta MIN
				for (i = 0; i < moves.length; i++) {
					currentValue = alphabeta(ATAXX.common.applyMove(moves[i], copy(board)), depth-1, player*-1, alpha, beta, moves[i].toRow, moves[i].toColumn);
					if (currentValue < bestValue) 
						bestValue = currentValue;
					if (currentValue < beta)
						beta = currentValue;
					if (alpha > beta)
						return bestValue;
				}
			}
		}		
		return bestValue;
	};
	
	// minimax entry point
	//
	// if /progress/ is defined, then we report our progress by calling it
	function minimax(board, depth, moves, progress, easy) {
		var bestValue = -50;
		var bestMoves = [];
		var currentValue;
		for (var i = 0; i < moves.length; i++) {
			currentValue = alphabeta(ATAXX.common.applyMove(moves[i], copy(board)), depth-1, ATAXX.PLAYERS.HUMAN, bestValue, 50, moves[i].toRow, moves[i].toColumn);
			if (depth === 1 && moves[i].jump) currentValue -= 2; // hack to make the aggressive ai a bit better
			if (easy) {
				moves[i].value = currentValue;
			}
			else if (currentValue > bestValue) {
				//console.log("FOUND NEW BEST " + currentValue);
				bestValue = currentValue;
				bestMoves = [moves[i]];
			}
			else if (currentValue === bestValue) {
				bestMoves.push(moves[i]);
			}
			if (typeof progress == 'function' && depth > 1) progress(i/moves.length);
		};
		if (easy) {
			var limit = Math.min(moves.length-1, 2);
			return moves.sort(valueSort)[Math.floor(Math.random()*limit)];
		}
		else {
			return bestMoves[Math.floor(Math.random()*bestMoves.length)];
		}
	};
	
	function move(board, difficulty, lastRow, lastColumn, markMove, progress) { 
		calls = 0;
		var startTime = new Date().getTime();
		var moves = possibleMoves(ATAXX.PLAYERS.AI, board, lastRow, lastColumn);
		var score = ATAXX.common.score(board);
		console.log("DEPTH-1 MOVES " + moves.length + " TOTAL PIECES " + (score.ai+score.human) + " MOVES MADE " + movesMade);
		var move;
		if (movesMade < 2) difficulty = 1; // first two moves make little difference, third move can be a mistake
		if (difficulty === 0) { // beginners get special treatment
			move = minimax(board, 1, moves, null, true);
		}
		else { // we apply minimax in depth /difficulty/
			/*//TESTING FOR PERFORMACE
			console.log("===================");
			
			testCase = false;
			var startFalse = new Date().getTime();
			move = minimax(board, difficulty, moves, progress);
			var totalFalse = new Date().getTime() - startFalse;
			
			testCase = true;
			var startTrue = new Date().getTime();
			move = minimax(board, difficulty, moves, progress);
			var totalTrue = new Date().getTime() - startTrue;

			tests.benchmark += totalFalse;
			tests.testcase  += totalTrue;
			
			console.log("BENCHMARK " + totalFalse + ", CUMULATIVE: " + tests.benchmark + " ms");
			console.log("TESTCASE  " + totalTrue + ", CUMULATIVE: " + tests.testcase + " ms");
			console.log("===================");
			// END TESTS*/
			
			if (difficulty > 1) { // on expert level we put a little extra effort
				if (movesMade > 17) // aggressively go one level deeper
					difficulty++;
				if (score.ai+score.human > 38) // ten or less empty squares, we'll go two levels deeper
					difficulty++;
			}
			move = minimax(board, difficulty, moves, progress);
		}
		markMove(move.toRow, move.toColumn);
		var moveTime = new Date().getTime() - startTime;
		calcTimes.max = Math.max(calcTimes.max, moveTime);
		calcTimes.all.push(moveTime);
		console.log(calcTimes.all);
		movesMade++;
		return ATAXX.common.applyMove(move, board);
	};
	
	function preGame() {
		movesMade = 0;
		calcTimes = {
			'max': -1,
			'all': []
		};
	};
	
	return {'move': move, 'preGame': preGame};
})();
