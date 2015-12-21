/**
 * Created by Hamster on 12/3/2015.
 */

exports.Player = Player;

function Player(game, id, client)
{
	this.game = game;
	this.id = id;
	this.client = client;
	this.tableCards = [];
}

Player.prototype.addTableCard = function(card)
{
	this.tableCards.unshift(card);
};

Player.prototype.startDragTableCard = function(card)
{
	this.draggingCard = card;
	this.tableCards.splice(this.tableCards.indexOf(card));
	this.tableCards.unshift(card);
	serverLog("start dragging " + card.id);
};

Player.prototype.stopDragTableCard = function()
{
	this.draggingCard = undefined;
};

Player.prototype.selectTableCard = function(card)
{
	//var card = this.game.tableCardIndex[cardID];
	//this.tableCards.splice(this.tableCards.indexOf(card));
	this.selectedCard = card;
};

Player.prototype.unselectTableCard = function(card)
{
	this.selectedCard = undefined;
};

serverLog = function (str1)
{
	var date = new Date();
	var dtext = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
	console.log(dtext + " PLAYER-" + str1);
};