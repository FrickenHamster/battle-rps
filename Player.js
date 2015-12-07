/**
 * Created by Hamster on 12/3/2015.
 */

exports.Player = Player;

function Player(id, client)
{
	this.id = id;
	this.client = client;
	this.tableCards = [];
}

Player.prototype.addTableCard = function(x, y)
{
	var card = new TableCard(x, y)
	
	this.tableCards.unshift(card);
};



function TableCard(x, y)
{
	this.x = x;
	this.y = y;
	this.revealed = false;
}