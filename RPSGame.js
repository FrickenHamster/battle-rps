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




var maxPlayers = 2;

var Game = function(server){
	
	this.server = server;
	this.players ={};
	this.playerNum = 0;
	
	this.turnTimer = 0;
	this.state = exports.WAITING_CONNECT;
	this.stateTimer = 0;
	
	this.tableCards = [];
};
Game.prototype.addPlayer = function(id, client)
{
	var player = {
		id:id,
		client:client, 
		cards:[],
		choice:null
	};
	this.players[id] = player;
	
	return (this.playerNum == maxPlayers);
};

Game.prototype.removePlayer = function(id)
{
	var player = this.players[id]
	delete this.players[id];
};



Game.prototype.startGame = function()
{
	this.state = exports.WAIT_PHASE;
};

Game.prototype.update = function()
{
	switch (this.state)
	{
		case exports.STARTING:
			
			break;
	}
};

Game.prototype.drawCard = function(id, type)
{
	var card = new TableCard(id, type);
	this.tableCards.push(card);
	this.server.
};




exports.GameManager = Game;



