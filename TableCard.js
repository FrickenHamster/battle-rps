/**
 * Created by Hamster on 12/3/2015.
 */

exports.TableCard = TableCard;

function TableCard(clientID, id, value, x, y)
{
	this.clientID = clientID;
	this.id = id;
	this.value = value;
	this.x = x;
	this.y = y;
	return this;
}
