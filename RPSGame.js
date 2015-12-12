/**
 * Created by Hamster on 7/11/2015.
 */

var Player = require('./Player').Player;
var TableCard = require('./TableCard').TableCard;

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
	this.tableCardIDCounter = 0;
};
Game.prototype.addPlayer = function(id, client)
{
	/*var player = {
		id:id,
		client:client, 
		cards:[],
		tableCards:[],
		choice:null
	};*/
	var player = new Player();
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

Game.prototype.drawCard = function(clientID, value, x, y)
{
	var card = new TableCard(clientID, this.tableCardIDCounter, value, x, y);
	this.tableCards.push(card);
	this.server.sendDrawCardToAll(clientID, card.id, card.value, card.x, card.y);
	this.tableCardIDCounter++;
};




exports.GameManager = Game;



