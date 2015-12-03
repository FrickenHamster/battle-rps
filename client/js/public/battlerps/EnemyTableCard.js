/**
 * Created by Hamster on 11/29/2015.
 */


function EnemyTableCard(game, container)
{
	this.game = game;
	this.container = container;
	this.sprite = new PIXI.Sprite();
	this.sprite.anchor.x = .5;
	this.sprite.anchor.y = .5;
}


EnemyTableCard.prototype.spawn = function(x, y, id)
{
	this.id = id;
	this.x = x;
	this.y = y;
	this.cardValue = -1;
	this.moving = false;
	this.targetX = x;
	this.targetY = y;
};

EnemyTableCard.prototype.update = function()
{
	
};

