if(typeof(console) === 'undefined') {
    var console = {}
    console.log = console.error = console.info = console.debug = console.warn = console.trace = console.dir = console.dirxml = console.group = console.groupEnd = console.time = console.timeEnd = console.assert = console.profile = function() {};
}

ATAXX = (function($) {
	var boardSize = 7;
	var game = {};
	var human = {};
	var board = [];
	var scoreHistory = [];
	var WHITE   =  1;
	var BLACK   = -1;
	var NOPIECE =  0;
	var AILevels = {
		'BEGINNER':   0,
		'AGGRESSIVE': 1,
		'MASTER':     2
	};
	var difficulty = AILevels.BEGINNER;
	
	// keeps to game rolling
	// returns BOOLEAN which indicates if the player passed and turn has already ended
	function preTurn() {
		// update scoreboard
		// only on human's turn to prevent unnecessary flicker 
		// ... or max difficulty as it takes so long
		var currentScore = score();
		if (game.turn === WHITE || difficulty == AILevels.MASTER) {
			$('#white .score').text(currentScore.white);
			$('#black .score').text(currentScore.black);
		}

		// keep score history, if last player passed, then nothing has changed
		if (!game.passed) {
			scoreHistory.push(currentScore);
		}
		
		// special case: either player lost every one her pieces
		if (currentScore.white === 0 || currentScore.black === 0) {
			gameover();
			return false;
		}
		
		// special case: board is full -> avoid two passes
		if (currentScore.white + currentScore.black == boardSize*boardSize) {
			gameover();
			return false;
		}

		var hasToPass = mustPass();
		
		// two passes in a row means neither player can move
		if (game.passed && hasToPass) {
			gameover();
		}
		// this is the first pass -> next turn!
		else if (hasToPass) {
			console.log("PASSED");
			game.passed = true;
			game.turn = game.turn * -1;
			drawGame();
			preTurn();
			return true;
		}
		else {
			game.passed = false;
		}
		
		/*// when played on max difficulty we display indicator for ai's turn
		if (difficulty == AILevels.MASTER || game.turn === BLACK) {
			$('#black img').show();
		}
		// ...and hide when it's players turn
		if (difficulty == AILevels.MASTER || game.turn === WHITE) {
			$('#black img').hide();
		}*/
		return false;
	};
	
	function cpu2 () {
		var moves = possibleMoves(board, BLACK);
	};
	
	// return array of all possible moves for /player/ on /moveBoard/
	function possibleMoves(moveBoard, player) {
		var moves = [];
		var row, column;
		for (row = 2; row < boardSize+2; row++) {
			for (column = 2; column < boardSize+2; column++) {
				square = moveBoard[row][column];
				if (square.piece !== NOPIECE) continue; // cannot move to square that isn't empty
				
			}
		}
	};
	
	function cpu() {
		console.log("CPU MOVE");
		var square, jumpFrom, currentScore, move, simulationBoard;
		var bestScore = -49;
		var bestMoves = [];
		var row, column;
		// loop over all squares, see where cpu could move, choose the move which has the biggest plusminus (AND HACKS)
		for (row = 2; row < boardSize+2; row++) {
			for (column = 2; column < boardSize+2; column++) {
				square = board[row][column];
				if (square.piece !== NOPIECE) continue;
				move = null;
				if (movable(square)) {
					move = {'jump': false, 'toRow': row, 'toColumn': column};
				}
				else if (jumpFrom = jumpTo(square), jumpFrom.possible) {
					move = {'jump':       true, 
					        'fromRow':    jumpFrom.fromRow, 
							'fromColumn': jumpFrom.fromColumn,
							'toRow':      row,
							'toColumn':   column}
				}
				if (move != null) {
					
					if (difficulty == AILevels.MASTER) {
						simulationBoard = makeMove($.extend(true, {}, board), move, true);
						//currentScore = simulateHuman($.extend(true, {}, simulationBoard));
						currentScore = simulateHuman(simulationBoard);
					}
					else {
						currentScore = plusminus(makeMove($.extend(true, {}, board), move, true));
						if (move.jump) currentScore -= 2;
					}
					
					if (currentScore > bestScore) {
						bestScore = currentScore;
						bestMoves = [move];
					}
					else if (currentScore === bestScore) {
						bestMoves.push(move);
					}
				}
			}
		}
		console.log("BEST MOVE SCORE " + bestScore + " AND TOTAL BEST MOVES " + bestMoves.length);
		if (bestMoves.length > 0) {
			var bestMove = bestMoves[Math.floor(Math.random()*bestMoves.length)]
			makeMove(board, bestMove, false);
			$('.lastmove').removeClass('lastmove');
			$('#square_'+bestMove.toRow+bestMove.toColumn).addClass('lastmove');
		}
		drawGame();
		var humanPassed = preTurn();
		if (humanPassed) {
			cpu();
		}
	};
	
	/* TODO: merge this & cpu to make awesome recursive minimax */
	function simulateHuman(moveBoard) {
		var square, jumpFrom, currentScore, move;
		var bestScore = -49;
		var bestMoves = [];
		var row, column;
		for (row = 2; row < boardSize+2; row++) {
			for (column = 2; column < boardSize+2; column++) {
				square = moveBoard[row][column];
				if (square.piece !== NOPIECE) continue;
				move = null;
				if (movable(square, WHITE, moveBoard)) {
					move = {'jump': false, 'toRow': row, 'toColumn': column};
				}
				else if (jumpFrom = jumpTo(square, WHITE, moveBoard), jumpFrom.possible) {
					move = {'jump':       true, 
					        'fromRow':    jumpFrom.fromRow, 
							'fromColumn': jumpFrom.fromColumn,
							'toRow':      row,
							'toColumn':   column}
				}
				if (move != null) {
					currentScore = plusminus(makeMove($.extend(true, {}, moveBoard), move, true, WHITE), WHITE);
					if (move.jump) currentScore -= 1.5;
					if (currentScore > bestScore) {
						bestScore = currentScore;
						bestMoves = [move];
					}
					else if (currentScore === bestScore) {
						bestMoves.push(move);
					}
				}
			}
		}
		
		return bestScore * -1;
	};	
	
	function makeMove(moveBoard, move, simulation, player) {
		player = player || game.turn;
		if (move.jump)
			moveBoard[move.fromRow][move.fromColumn].piece = NOPIECE;
		moveBoard[move.toRow][move.toColumn].piece = player;
		flipPieces(moveBoard, moveBoard[move.toRow][move.toColumn], player);
		if (!simulation) {
			clearJumping();
			game.turn = (game.turn === WHITE ? BLACK : WHITE);
		}
		return moveBoard;
	};
	
	function flipPieces(moveBoard, square, player) {
		player = player || game.turn;
		var opponent = player * -1;
		if (moveBoard[square.row-1][square.column-1].piece === opponent)
				moveBoard[square.row-1][square.column-1].piece = player;
		if (moveBoard[square.row-1][square.column  ].piece === opponent)
				moveBoard[square.row-1][square.column  ].piece = player;
		if (moveBoard[square.row-1][square.column+1].piece === opponent)
				moveBoard[square.row-1][square.column+1].piece = player;
		if (moveBoard[square.row  ][square.column-1].piece === opponent)
				moveBoard[square.row  ][square.column-1].piece = player;
		if (moveBoard[square.row  ][square.column+1].piece === opponent)
				moveBoard[square.row  ][square.column+1].piece = player;
		if (moveBoard[square.row+1][square.column-1].piece === opponent)
				moveBoard[square.row+1][square.column-1].piece = player;
		if (moveBoard[square.row+1][square.column  ].piece === opponent)
				moveBoard[square.row+1][square.column  ].piece = player;
		if (moveBoard[square.row+1][square.column+1].piece === opponent)
				moveBoard[square.row+1][square.column+1].piece = player;
	}
	
	function clearJumping() {
		if (human.jumping) {
			human.jumpingSquare.$elem.removeClass('jumping');
			human.jumpingSquare.jumping = false;
			human.jumpingSquare = null;
			human.jumping = false;
		}
	}
	
	function drawGame() {
		console.log("DRAW GAME");
		var row, column, square;
		for (row = 2; row < boardSize+2; row++) {
			for (column = 2; column < boardSize+2; column++) {
				square = board[row][column];
				if      (square.piece === WHITE) 
					square.$elem.addClass('white').removeClass('black helper empty');
				else if (square.piece === BLACK) 
					square.$elem.addClass('black').removeClass('white helper empty');
				else if (game.turn === WHITE && movable(square))  // only humans get helpers
					square.$elem.addClass('helper').removeClass('black white empty');
				else
					square.$elem.addClass('empty').removeClass('black helper white');
			}
		}
	};
	
	function movable(square, player, moveBoard) { // TODO: this is a hassle, we could always update on moves
		player = player || game.turn;
		moveBoard = moveBoard || board;
		if (square.piece !== NOPIECE) return false; // you can't move on opponent's piece
		if (human.jumping) {
			if (moveBoard[square.row-2][square.column-2].jumping ||
				moveBoard[square.row-2][square.column-1].jumping ||
				moveBoard[square.row-2][square.column  ].jumping ||
				moveBoard[square.row-2][square.column+1].jumping ||
				moveBoard[square.row-2][square.column+2].jumping ||
				moveBoard[square.row-1][square.column-2].jumping ||
				moveBoard[square.row-1][square.column+2].jumping ||
				moveBoard[square.row  ][square.column-2].jumping ||
				moveBoard[square.row  ][square.column+2].jumping ||
				moveBoard[square.row+1][square.column-2].jumping ||
				moveBoard[square.row+1][square.column+2].jumping ||
				moveBoard[square.row+2][square.column-2].jumping ||
				moveBoard[square.row+2][square.column-1].jumping ||
				moveBoard[square.row+2][square.column  ].jumping ||
				moveBoard[square.row+2][square.column+1].jumping ||
				moveBoard[square.row+2][square.column+2].jumping)
					return true;
			else
					return false;
		}
		else {
			if (moveBoard[square.row-1][square.column-1].piece === player ||
				moveBoard[square.row-1][square.column  ].piece === player ||
				moveBoard[square.row-1][square.column+1].piece === player ||
				moveBoard[square.row  ][square.column-1].piece === player ||
				moveBoard[square.row  ][square.column+1].piece === player ||
				moveBoard[square.row+1][square.column-1].piece === player ||
				moveBoard[square.row+1][square.column  ].piece === player ||
				moveBoard[square.row+1][square.column+1].piece === player) 
					return true;
			else 
					return false;
		}
	};
	
	// returns object {possible: BOOLEAN, fromRow: NUMBER, fromColumn: NUMBER}
	// if player is able to jump to square on moveBoard then possible is set TRUE
	// and fromRow, fromColumn is set to that square's coordinates where player is able to jump to square
	function jumpTo(square, player, moveBoard) {
		player = player || game.turn;
		moveBoard = moveBoard || board;
		
		// TODO: seems a bit similar to code above => REFACTOR
		if      (moveBoard[square.row-2][square.column-2].piece == player)
			return {'possible': true, 'fromRow': square.row-2, 'fromColumn': square.column-2};
		else if (moveBoard[square.row-2][square.column-1].piece == player)
			return {'possible': true, 'fromRow': square.row-2, 'fromColumn': square.column-1};
		else if (moveBoard[square.row-2][square.column  ].piece == player)
			return {'possible': true, 'fromRow': square.row-2, 'fromColumn': square.column  };
		else if (moveBoard[square.row-2][square.column+1].piece == player)
			return {'possible': true, 'fromRow': square.row-2, 'fromColumn': square.column+1};
		else if (moveBoard[square.row-2][square.column+2].piece == player)
			return {'possible': true, 'fromRow': square.row-2, 'fromColumn': square.column+2};
		else if (moveBoard[square.row-1][square.column-2].piece == player)
			return {'possible': true, 'fromRow': square.row-1, 'fromColumn': square.column-2};
		else if (moveBoard[square.row-1][square.column+2].piece == player)
			return {'possible': true, 'fromRow': square.row-1, 'fromColumn': square.column+2};
		else if (moveBoard[square.row  ][square.column-2].piece == player)
			return {'possible': true, 'fromRow': square.row  , 'fromColumn': square.column-2};
		else if (moveBoard[square.row  ][square.column+2].piece == player)
			return {'possible': true, 'fromRow': square.row  , 'fromColumn': square.column+2};
		else if (moveBoard[square.row+1][square.column-2].piece == player)
			return {'possible': true, 'fromRow': square.row+1, 'fromColumn': square.column-2};
		else if (moveBoard[square.row+1][square.column+2].piece == player)
			return {'possible': true, 'fromRow': square.row+1, 'fromColumn': square.column+2};
		else if (moveBoard[square.row+2][square.column-2].piece == player)
			return {'possible': true, 'fromRow': square.row+2, 'fromColumn': square.column-2};
		else if (moveBoard[square.row+2][square.column-1].piece == player)
			return {'possible': true, 'fromRow': square.row+2, 'fromColumn': square.column-1};
		else if (moveBoard[square.row+2][square.column  ].piece == player)
			return {'possible': true, 'fromRow': square.row+2, 'fromColumn': square.column  };
		else if (moveBoard[square.row+2][square.column+1].piece == player)
			return {'possible': true, 'fromRow': square.row+2, 'fromColumn': square.column+1};
		else if (moveBoard[square.row+2][square.column+2].piece == player)
			return {'possible': true, 'fromRow': square.row+2, 'fromColumn': square.column+2};
		else
			return {'possible': false};
	};
	
	function plusminus(currentBoard, player) {
		player = player || game.turn;
		var row, column;
		var result = 0;
		for (row = 2; row < boardSize+2; row++)
			for (column = 2; column < boardSize+2; column++)
				result += currentBoard[row][column].piece;
		return result * player;
	};
	
	function score() {
		var row, column;
		var white = 0, black = 0;
		for (row = 2; row < boardSize+2; row++) {
			for (column = 2; column < boardSize+2; column++) {
				if (board[row][column].piece === WHITE) white++;
				if (board[row][column].piece === BLACK) black++;
			}
		}
		return {'white': white, 'black': black, 'difficulty': difficulty};
	};
	
	function mustPass() {
		for (row = 2; row < boardSize+2; row++) {
			for (column = 2; column < boardSize+2; column++) {
				square = board[row][column];
				if (square.piece !== 0) continue;
				if (movable(square)) {
					return false;
				}
				else if (jumpTo(square).possible) {
					return false;
				}
			}
		}	
		return true;
	}; 
	
	function gameover() {
		game.over = true;
		var finalScore = score();

		var result = '';
		if (finalScore.white > finalScore.black) {
			// human won
			$('#white .score').addClass('winner');
			result += "You beat the Artificial Intelligence! You're a credit to humanity.";
		}
		else if (finalScore.white === finalScore.black) {
			// draw
			result += "It's a draw!";
		}
		else {
			// cpu won
			$('#black .score').addClass('winner');
			result += 'Artificial Intelligence outsmarted you this time.';
		}
		$('#result').text(result);
		
		var gameSummary = [];
		$.each(scoreHistory, function(index, score) {
			//if (index % 2 === 0) return; // for smoother chart, show scores after human moves
			gameSummary.push(score.white - score.black);
		});
		$('#scorehistory').sparkline(gameSummary, {
			'type':        'bar',
			'height':      '100px',
			'barColor':    '#A8808B',
			'negBarColor': '#2B130D'
		});
		$('#white .score').text(finalScore.white);
		$('#black .score').text(finalScore.black);
		$('#gameover').show();
		$('.lastmove').removeClass('lastmove'); // if human moved last, last move is in the wrong place
	};
	
	function clickHandler() {
		if (game.turn === BLACK || game.over) return; // TODO: umm, could be prettier. also: two-player game is now impossible
		var square = $(this).data('square');
		var madeMove = false;
		if (human.jumping && square.jumping) {
			clearJumping();
		}
		else if (!human.jumping && square.piece === game.turn) {
			human.jumping = true;
			human.jumpingSquare = square;
			square.jumping = true;
			square.$elem.addClass('jumping');
		}
		else if (movable(square)) {
			var move;
			if (human.jumping)
				move = {'jump':       true, 
				        'fromRow':    human.jumpingSquare.row, 
						'fromColumn': human.jumpingSquare.column,
						'toRow':      square.row,
						'toColumn':   square.column};
			else
				move = {'jump':     false,
				        'toRow':    square.row,
						'toColumn': square.column};
			makeMove(board, move, false);
			madeMove = true;
		}
		drawGame();
		if (madeMove) {
			$('.lastmove').removeClass('lastmove');
			var cpuPassed = preTurn();
			if (!cpuPassed) {
				setTimeout(cpu, 25); // we want to display our move before cpu starts thinking, HACK
			}
		}
	};
	
	function init(settings) {
		// CREATE BOARD UI
		var $board = $('<div/>', {'id': 'board'});
		var row, column, $row, $square;
		for (row = 0; row < boardSize; row++) {
			$row = $('<div/>', {'id': 'row_'+row+2, 'class': 'row'});
			for (column = 0; column < boardSize; column++) {
				$square = $('<div/>', {'id': 'square_'+(row+2)+(column+2), 'class': 'square'});
				$square.click(clickHandler);
				$row.append($square);
			}
			$board.append($row);
		}
		
		// DISPLAY BOARD
		$('#oldgame').replaceWith($board);
		
		// INITIALIZE BOARD DATA
		board = [];
		var gameRow, gameSquare;
		for (row = 0; row < boardSize+4; row++) {
			gameRow = [];
			for (column = 0; column < boardSize+4; column++) {
				if (row < 2 || column < 2 || row > boardSize+2 || column > boardSize+2) {
					// create special empty square to simplify checks on pieces (makes out of bounds errors "impossible" for board array)
					gameSquare = { 'piece': 0, 'outside': true };
				}
				else {
					gameSquare = { 'piece': 0, 'jumping': false, '$elem': $('#square_'+row+column), 'row': row, 'column': column };
					$('#square_'+row+column).data('square', gameSquare);
					if ((row === 2 && column === 2)||(row === boardSize+1 && column === boardSize+1)) gameSquare.piece = WHITE;
					if ((row === 2 && column === boardSize+1)||(row === boardSize+1 && column === 2)) gameSquare.piece = BLACK;
				}
				gameRow.push(gameSquare);
			}
			board.push(gameRow);
		}
		
		// INITIALIZE GAME DATA
		game = {};
		human = {};
		scoreHistory = [];
		game.turn = WHITE;
		human.jumping = false;
		scoreHistory.push(score());
		difficulty = settings.difficulty || AILevels.BEGINNER;
		
		// DRAW GAME
		drawGame();
	};
	
	return { 
		'play': function(settings) {
			init(settings);
		},
		'changeAI': function(level) {
			console.log("CHANGED AI TO " + level);
			difficulty = level;
		},
		'AILevels': AILevels
	};
})($);

$(document).ready(function() {
	$('#jserror').remove();
	$('#container').show();
	ATAXX.play({'difficulty': 2});
	
	$('#playagain').click(function(event) {
		$('#white .score').text('2');
		$('#black .score').text('2');
		$('.winner').removeClass('winner');
		$('#scorehistory').empty();
		$('#board').attr('id', 'oldgame');
		$('#gameover').hide();
		ATAXX.play({});
		event.preventDefault();
	});
	
	$('input[name=difficulty]').change(function() {
		ATAXX.changeAI(ATAXX.AILevels[$(this).val().toUpperCase()]);
	});
	
	// feature detect web workers
	if (!!window.Worker) {
		$('#defensive').attr('title', '').removeClass('disabled');
		$('#defensive input').attr('disabled', false);
	}
});
