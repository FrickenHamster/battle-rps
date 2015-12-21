/**
 * Created by Hamster on 11/29/2015.
 */


var TABLE_CARD_STATES = {
	IDLE: 0,
	DRAGGING: 1,
	FINISHING:2
};

function EnemyTableCard(game, container)
{
	this.game = game;
	this.container = container;
	this.sprite = new PIXI.Sprite();
	this.sprite.anchor.x = .5;
	this.sprite.anchor.y = .5;
	this.sprite.rotation = Math.PI;
}


EnemyTableCard.prototype.spawn = function(clientID, id, x, y)
{
	this.id = id;
	this.x = x;
	this.y = y;
	this.sprite.texture = PIXI.loader.resources['saltCardBack'].texture;

	this.displayX = game.width - this.x;
	this.displayY = game.height - this.y;
	this.cardValue = -1;
	this.state = TABLE_CARD_STATES.IDLE;
	this.targetX = x;
	this.targetY = y;
	this.targetSpeed = 0;
	this.sprite.x = this.displayX;
	this.sprite.y = this.displayY;
	
	this.container.addChild(this.sprite);
};

EnemyTableCard.prototype.update = function()
{
	var newX;
	var newY;
	switch(this.state)
	{
		case TABLE_CARD_STATES.DRAGGING:
			if (this.x != this.targetX || this.y != this.targetY)
			{
				var tarRad = Math.atan2( this.targetY - this.y, this.targetX - this.x);
				var dist = Math.sqrt(Math.pow(this.targetX - this.x, 2) + Math.pow(this.targetY - this.y, 2));
				
				if (dist > 10)
				{
					newX = this.x + Math.cos(tarRad) * this.targetSpeed;
					newY = this.y + Math.sin(tarRad) * this.targetSpeed;
				}
				else
				{
					newX = this.targetX;
					newY = this.targetY;
				}
				this.changePosition(newX, newY);
			}
			break;
		case TABLE_CARD_STATES.FINISHING:
			if (this.x != this.targetX || this.y != this.targetY)
			{
				var tarRad = Math.atan2( this.targetY - this.y, this.targetX - this.x);
				var dist = Math.sqrt(Math.pow(this.targetX - this.x, 2) + Math.pow(this.targetY - this.y, 2));

				if (dist > 10)
				{
					newX = this.x + Math.cos(tarRad) * this.targetSpeed;
					newY = this.y + Math.sin(tarRad) * this.targetSpeed;
				}
				else
				{
					newX = this.targetX;
					newY = this.targetY;
					this.state = TABLE_CARD_STATES.IDLE;
				}
				this.changePosition(newX, newY);
			}
	}
};

EnemyTableCard.prototype.startDrag = function()
{
	this.state = TABLE_CARD_STATES.DRAGGING;
	this.targetX = this.x;
	this.targetY = this.y;
	
};

EnemyTableCard.prototype.setDragTarget = function(tarX, tarY)
{
	this.targetX = tarX;
	this.targetY = tarY;
	var dist = Math.sqrt(Math.pow(this.targetX - this.x, 2) + Math.pow(this.targetY - this.y, 2));
	this.targetSpeed = dist / 3;
};

EnemyTableCard.prototype.stopDrag = function(tarx, tary)
{
	this.targetX = tarx;
	this.targetY = tary;
	var dist = Math.sqrt(Math.pow(this.targetX - this.x, 2) + Math.pow(this.targetY - this.y, 2));
	this.targetSpeed = dist / 3;
	this.state = TABLE_CARD_STATES.FINISHING;
};

EnemyTableCard.prototype.changePosition = function(x, y)
{
	this.x = x;
	this.y = y;
	this.displayX = game.width - this.x;
	this.displayY = game.height - this.y;
	this.sprite.x = this.displayX;
	this.sprite.y = this.displayY;
};

