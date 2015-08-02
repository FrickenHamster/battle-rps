/**
 * Created by Hamster on 7/11/2015.
 */


exports.ROCK = 0;
exports.PAPER = 0;

exports.WAITING_CONNECT = 0;
exports.STARTING = 1;
exports.WAIT_PHASE = 2;
exports.SHOW_PHASE = 3;

exports.PLAYER = 0;
exports.SPECTATOR = 1;


exports.GameManager = function()
{
	
	var maxPlayers = 2;
	
	var game = {
		players:[],
		playerNum:0,
		
		turnTimer:0,
		state: exports.WAITING_CONNECT,
		stateTimer: 0,
	};
	game.addPlayer = function(id, name)
	{
		var player = {id:id, 
			name:name,
			cards:[],
			choice:null
		};
		game.players[id] = player;
		
		return (game.playerNum == maxPlayers);
	};
	
	
	
	game.startGame = function()
	{
		game.state = exports.WAIT_PHASE;
	};
	
	game.update = function()
	{
		switch (game.state)
		{
			case exports.STARTING:
				
				break;
		}
	};
	
	return game;
};





