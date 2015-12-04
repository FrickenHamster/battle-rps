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

