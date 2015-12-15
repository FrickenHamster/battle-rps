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

Player.prototype.selectTableCard = function(cardID)
{
	var card = this.game.tableCardIndex[cardID];
	this.tableCards.splice(this.tableCards.indexOf(card));
};

