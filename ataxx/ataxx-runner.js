if (typeof(console) === 'undefined') {
    var console = {};
    console.log = console.error = console.info = console.debug = console.warn = console.trace = console.dir = console.dirxml = console.group = console.groupEnd = console.time = console.timeEnd = console.assert = console.profile = function() {};
}

ATAXX.runner = (function($) {


	var ui = {
		'$illegal':  $('<div id="illegal">X</div>'),
		'$thinking': $('<img src="ai-thinking.gif" alt="artificial intelligence is planning your demise" />') // TODO: should <progress> be used? 
	};
	
	var game = {
		'ai':           null,
		'ais':          {
							'webworker': null,
							'regular':   aiFactory(ATAXX.AITYPES.REGULAR)
						},
		'board':        [],
		'difficulty':   null,
		'human':		{
							'isJumping':       false,
							'jumpingSquare': null,
							'lastRow':       null,
							'lastColumn':    null
						},
		'lastmove':		{
							'row':    null,
							'column': null
						},
		'over':			false,
		'playerPassed': false,
		'scoreHistory': [],
		'turn':         null
	};
	
	function aiFactory(type) {
		var ai = {};
	
		if (type === ATAXX.AITYPES.REGULAR) {
			ai.move = function(board, difficulty) {
				ATAXX.ai.move(board, difficulty, game.human.lastRow, game.human.lastColumn, markAIMove);
				nextTurn();
			};
			ai.preGame = ATAXX.ai.preGame;
		}
		else if (type === ATAXX.AITYPES.WEBWORKER)  {
			ai.worker = new Worker('ataxx-webworker.js');
			ai.worker.onmessage = function(e) {
				if (e.data.status == 'finished') {
					game.board = e.data.board;
					// because functions do not travel between us and web workers, we have to recreate $elem links in squares & $().data-links
					var row, column;
					for (row = 2; row < ATAXX.BOARDSIZE+2; row++)
						for (column = 2; column < ATAXX.BOARDSIZE+2; column++)
							game.board[row][column].$elem = $('#square_'+row+column).data('square', game.board[row][column]);
					updateProgress('1');
					$('#ai > img').fadeOut('fast');
					nextTurn();
				}
				else if (e.data.status == 'progress') {
					updateProgress(e.data.completion);
				}
				else if (e.data.status == 'markMove') {
					markAIMove(e.data.row, e.data.column);
				}
				else if (e.data.status == 'debug') {
					console.log(e.data.debug);
				}
			};
			ai.worker.onerror = function(e) {
				// TODO
				console.log("WEB WORKER FAILED " + e.message + " @" + e.filename + ":" + e.lineno );
			};
			ai.move = function(board, difficulty) {
				var row, column;
				if (difficulty > 1) $('#ai > img').fadeIn();
				for (row = 0; row < ATAXX.BOARDSIZE+4; row++)
					for (column = 0; column < ATAXX.BOARDSIZE+4; column++)
						delete board[row][column].$elem;  // web workers cannot receive functions. SIDEBAR: firefox silently strips functions whereas chrome throws NOT_SUPPORTED_ERR
				ai.worker.postMessage({
					'action':     'move',
					'board':      board,
					'lastRow':    game.human.lastRow,
					'lastColumn': game.human.lastColumn,
					'difficulty': difficulty
				});
			};
			ai.preGame = function() {
				ai.worker.postMessage({'action': 'preGame'});
			};
		}
		
		return ai;
	};
	
	function changeDifficulty(difficulty) {
		if (difficulty === ATAXX.AILEVELS.EXPERT && game.ais.webworker)
			game.ai = game.ais.webworker;
		else
			game.ai = game.ais.regular;
		game.difficulty = difficulty;
		return game.difficulty;
	}; 
	
	function clearJump() {
		if (game.human.isJumping) {
			game.human.jumpingSquare.jumping = false;
			game.human.jumpingSquare = null;
			game.human.isJumping = false;
		}
	};
	
	function hideIllegal() {
		ui.$illegal.fadeOut();
	};
	
	function updateScoreboard() {
		var score = ATAXX.common.score(game.board);
		if (game.turn === ATAXX.PLAYERS.HUMAN || game.difficulty == ATAXX.AILEVELS.EXPERT) { // flicker prevention
			$('#human > .score').text(score.human);
			$('#ai > .score').text(score.ai);
		}
		if (!game.playerPassed) {
			score.difficulty = game.difficulty;
			game.scoreHistory.push(score);
		}
		return score;
	};
	
	function markAIMove(row, column) {
		game.lastmove.row = row;
		game.lastmove.column = column
	};
	
	function updateProgress(completion) {
		//$('#debug').text(completion);
	};
	
	function drawGameboard() {
		var row, column, square;
		for (row = 2; row < ATAXX.BOARDSIZE+2; row++) {
			for (column = 2; column < ATAXX.BOARDSIZE+2; column++) {
				square = game.board[row][column];
				if      (game.human.isJumping && row === game.human.jumpingSquare.row && column === game.human.jumpingSquare.column) // jumping has to be before light
	  				square.$elem.html(ATAXX.HTML.JUMPING).addClass('jumping').removeClass('light dark helper empty lastmove');
				else if (square.piece === ATAXX.PLAYERS.HUMAN) 
					square.$elem.html(ATAXX.HTML.LIGHTPIECE).addClass('light').removeClass('dark helper empty lastmove jumping');
				else if (row === game.lastmove.row && column === game.lastmove.column)												 // lastmove has to be before darkpiece
					square.$elem.html(ATAXX.HTML.LASTMOVE).addClass('lastmove').removeClass('dark light helper empty jumping');
				else if (square.piece === ATAXX.PLAYERS.AI) 
					square.$elem.html(ATAXX.HTML.DARKPIECE).addClass('dark').removeClass('light helper empty lastmove jumping');
				else if (game.turn === ATAXX.PLAYERS.HUMAN && ATAXX.common.allowed(game.board, ATAXX.PLAYERS.HUMAN, square, game.human.isJumping))  // only humans get helpers
					square.$elem.html(ATAXX.HTML.HELPER).addClass('helper').removeClass('dark light empty lastmove jumping');
				else
					square.$elem.html(ATAXX.HTML.EMPTY).addClass('empty').removeClass('dark helper light lastmove jumping');
			}
		}
	};
	
	function isGameover(playerPassing, score) {
		if (typeof playerPassing === "undefined") playerPassing = mustPass();
		score = score || ATAXX.common.score();
	
		// special case: either player lost all her pieces
		if (score.human === 0 || score.ai === 0)
			return true;
		
		// special case: board is full -> avoid two passes
		if (score.human + score.ai == ATAXX.BOARDSIZE*ATAXX.BOARDSIZE)
			return true;
		
		// two passes in a row means neither player can move
		if (game.playerPassed && playerPassing)
			return true;

		return false;
	};
	
	function mustPass() {
		var row, column, square;
		for (row = 2; row < ATAXX.BOARDSIZE+2; row++) {
			for (column = 2; column < ATAXX.BOARDSIZE+2; column++) {
				square = game.board[row][column];
				if (square.piece !== ATAXX.PLAYERS.NOPIECE) continue; // only empty squares may prove that player has legal moves
				if (ATAXX.common.possible(game.board, game.turn, square))
					return false;
			}
		}	
		return true;
	};
	
	function gameover() {
		game.over = true;
		var finalScore = ATAXX.common.score(game.board);

		var result = '';
		if (finalScore.human > finalScore.ai) {
			// human won
			$('#human > .score').addClass('winner');
			$('#ai > .score').addClass('loser');
			result += "You beat the Artificial Intelligence! You're a credit to humanity.";
		}
		else {
			// cpu won
			$('#ai > .score').addClass('winner');
			$('#human > .score').addClass('loser');
			result += 'Artificial Intelligence outsmarted you this time.';
		}
		$('#result').text(result);
		
		var gameSummary = [];
		$.each(game.scoreHistory, function(index, score) {
			//if (index % 2 === 0) return; // for smoother chart, show scores after human moves
			gameSummary.push(score.human - score.ai);
		});
		$('#scorehistory').sparkline(gameSummary, {
			'type':        'bar',
			'height':      '96px',
			'barColor':    '#A8808B',
			'negBarColor': '#2B130D'
		});
		$('#human > .score').text(finalScore.human);
		$('#ai > .score').text(finalScore.ai);
		$('#gameover').slideDown();
	};
	
	function squareClicked() {
		if (game.turn === ATAXX.PLAYERS.AI || game.over) return;
		
		var square = $(this).data('square');
		if (game.human.isJumping && square.jumping) {
			clearJump();
			drawGameboard();
		}
		else if (!game.human.isJumping && square.piece === ATAXX.PLAYERS.HUMAN) {
			if (ATAXX.common.jumpPossible(game.board, square)) {
				game.human.isJumping = true;
				game.human.jumpingSquare = square;
				square.jumping = true;
				drawGameboard();
			}
			else {
				var pos = square.$elem.position();
				ui.$illegal.css({'left': pos.left, 'top': pos.top}).fadeIn();
				setTimeout(hideIllegal, 200);
			}
		}
		else if (ATAXX.common.allowed(game.board, ATAXX.PLAYERS.HUMAN, square, game.human.isJumping)) {
			// HUMAN MOVES!
			var move;
			if (game.human.isJumping) {
				move = {'player':     ATAXX.PLAYERS.HUMAN,
				        'jump':       true, 
				        'fromRow':    game.human.jumpingSquare.row, 
						'fromColumn': game.human.jumpingSquare.column,
						'toRow':      square.row,
						'toColumn':   square.column};
				game.human.lastRow    = game.human.jumpingSquare.row;
				game.human.lastColumn = game.human.jumpingSquare.column;
				clearJump();
			}
			else {
				move = {'player':   ATAXX.PLAYERS.HUMAN,
				        'jump':     false,
				        'toRow':    square.row,
						'toColumn': square.column};
				game.human.lastRow    = square.row;
				game.human.lastColumn = square.column;
			}
			ATAXX.common.applyMove(move, game.board);
			nextTurn(); 
		}
	};

	// players call this after their turn
	function nextTurn() {
		game.turn *= -1;
		var score = updateScoreboard(); // optimization for isGameover
		drawGameboard();
		var playerPasses = mustPass(); // optimization for isGameover
		if (isGameover(playerPasses, score)) {
			gameover();
			return;
		};
		if (playerPasses) {
			game.playerPassed = true;
			nextTurn();
		}
		else if (game.turn === ATAXX.PLAYERS.AI) {
			game.playerPassed = false;
			if (game.difficulty !== ATAXX.AILEVELS.EXPERT)
				setTimeout(function() {game.ai.move(game.board, game.difficulty);}, 100);
			else
				game.ai.move(game.board, game.difficulty);
		}
		else {
			game.playerPassed = false;
			// wait for human to move
		}
	};

	// initializes data structures, builds game board ui 
	function init(settings) {
		// HIDE LAST GAME
		$('.score').removeClass('loser winner');
		$('#scorehistory').empty();
		$('#board').attr('id', 'oldgame');
		$('#gameover').hide();

	
		// CREATE BOARD UI
		var $board = $('<div/>', {'id': 'board'});
		var row, column, $row, $square;
		for (row = 0; row < ATAXX.BOARDSIZE; row++) {
			$row = $('<div/>', {'id': 'row_'+row+2, 'class': 'row'});
			for (column = 0; column < ATAXX.BOARDSIZE; column++) {
				$square = $('<div/>', {'id': 'square_'+(row+2)+(column+2), 'class': 'square'});
				$square.click(squareClicked);
				$row.append($square);
			}
			$board.append($row);
		}
		ui.$illegal.appendTo( $('#container') );
		ui.$thinking.appendTo( $('#ai') );
		
		// DISPLAY BOARD
		$('#oldgame').replaceWith($board);
			
		
		// INITIALIZE BOARD DATA
		game.board = [];
		var gameRow, gameSquare;
		for (row = 0; row < ATAXX.BOARDSIZE+4; row++) {
			gameRow = [];
			for (column = 0; column < ATAXX.BOARDSIZE+4; column++) {
				if (row < 2 || column < 2 || row >= ATAXX.BOARDSIZE+2 || column >= ATAXX.BOARDSIZE+2) {
					// create special empty square to simplify checks on pieces (makes out of bounds errors "impossible" for board array)
					gameSquare = { 'piece': 0, 'outside': true };
				}
				else {
					gameSquare = { 'piece': 0, 'jumping': false, '$elem': $('#square_'+row+column), 'row': row, 'column': column, 'outside': false };
					$('#square_'+row+column).data('square', gameSquare);
					if ((row === 2 && column === 2)||(row === ATAXX.BOARDSIZE+1 && column === ATAXX.BOARDSIZE+1)) gameSquare.piece = ATAXX.PLAYERS.HUMAN;
					if ((row === 2 && column === ATAXX.BOARDSIZE+1)||(row === ATAXX.BOARDSIZE+1 && column === 2)) gameSquare.piece = ATAXX.PLAYERS.AI;
				}
				gameRow.push(gameSquare);
			}
			game.board.push(gameRow);
		}
		
		// INITIALIZE OTHER GAME DATA
		game.difficulty = settings.difficulty || ATAXX.AILEVELS.BEGINNER;
		game.human = {};
		game.human.isJumping = false;
		game.human.jumpingSquare = null;
		game.lastmove.row = null;
		game.lastmove.column = null;
		game.over = false;
		game.playerPassed = false;
		game.scoreHistory = [];
		game.turn = ATAXX.PLAYERS.AI; // kind of ugly, because this way it's actually ATAXX.PLAYERS.HUMAN who has the first turn

		// INITIALIZE AI
		if (settings.workerAI) game.ais.webworker = settings.workerAI;
		game.ai = (game.difficulty === ATAXX.AILEVELS.EXPERT ? game.ais.webworker : game.ais.regular);
		game.ais.regular.preGame();
		if (game.ais.webworker) game.ais.webworker.preGame();  // both ais are initialized to enable in game difficulty switches
	};
	return {
		'play': function(settings) {
			init(settings);
			nextTurn();
		},
		'changeAI':  changeDifficulty,
		'aiFactory': aiFactory,
		'AILEVELS':  ATAXX.AILEVELS,
		'AITYPES':   ATAXX.AITYPES,
		'BOARDSIZE': ATAXX.BOARDSIZE,
		'PLAYERS':   ATAXX.PLAYERS
	}

})(jQuery);



// 
$(document).ready(function() {
	var workerAI = null;
	
	$('#playagain').click(function(event) {
		ATAXX.runner.play({'difficulty': ATAXX.AILEVELS[$('input[name=difficulty]:checked').val().toUpperCase()]});
		event.preventDefault();
	});
	
	$('input[name=difficulty]').change(function() {
		ATAXX.runner.changeAI(ATAXX.AILEVELS[$(this).val().toUpperCase()]);
	});
	
	// feature detect web workers
	if (!!window.Worker) {
		$('#expert').attr('title', 'This option is computationally demanding. Consequently, you may have to wait a bit for the AI to move.').removeClass('disabled');
		$('#expert > input').attr('disabled', false);
		
		workerAI = ATAXX.runner.aiFactory(ATAXX.AITYPES.WEBWORKER);
	}

	// preload lightpiece-dot.png to avoid flicker. TODO: is this necessary? feels wrong.
	var $lightDot = $('<img/>').attr('src', 'lightpiece-dot.png');

	$('#jserror').remove();
	$('#container').show();
	ATAXX.runner.play({'workerAI': workerAI, 'difficulty': ATAXX.AILEVELS[$('input[name=difficulty]:checked').val().toUpperCase()]});

});
