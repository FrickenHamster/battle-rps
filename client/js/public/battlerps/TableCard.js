/**
 * Created by Hamster on 11/14/2015.
 */



function TableCard(game, container)
{
	this.game = game;
	this.container = container;
	this.sprite = new PIXI.Sprite();
	this.sprite.anchor.x = .5;
	this.sprite.anchor.y = .5;
	this.alive = false;
}

TableCard.prototype = new HamClickable();


TableCard.prototype.spawn = function(id, cardValue, x, y)
{
	this.id = id;
	this.cardValue = cardValue;
	this.alive = true;
	this.sprite.texture = PIXI.loader.resources[BattleRPSTextures.textureNames[cardValue]].texture;
	this.x = x;
	this.y = y;
	this.sprite.anchor.x = .5;
	this.sprite.anchor.y = .5;
	this.sprite.position.x = x;
	this.sprite.position.y = y;
	this.sprite.tint = 0xffffff;
	this.container.addChild(this.sprite);
	this.initClickable(x - 20, y - 35, 40, 70);
	
	this.dragging = false;
	this.selected = false;
	
};

TableCard.prototype.update = function(mouseX, mouseY)
{
	if (this.dragging == true)
	{
		var dx = mouseX - this.dragXOff;
		var dy = mouseY - this.dragYOff;
		this.x = dx;
		this.y = dy;
		this.x = Math.floor(Math.min(Math.max(this.x, 20), this.game.width - 20));
		this.y = Math.floor(Math.min(Math.max(this.y, 285), this.game.height - 35));
		this.updateClickPosition(this.x - 20, this.y - 35);
		this.sprite.position.x = this.x;
		this.sprite.position.y = this.y;
		if (Math.abs(this.x - this.game.deckX) < 20 && Math.abs(this.y - this.game.deckY) < 30)
		{
			this.sprite.tint = 0xff8888;
		}
		else if (this.game.selectedCard == undefined)
		{
			if (Math.abs(this.x - this.game.platformX) < 40 && Math.abs(this.y - this.game.platformY) < 50)
			{
				this.sprite.tint = 0x88FF88;
			}
			else
			{
				this.sprite.tint = 0xffffff;
			}
		}
		else
		{
			if (Math.abs(this.x - this.game.platformX) < 60 && Math.abs(this.y - this.game.platformY) < 80)
			{
				this.sprite.tint = 0xFF8888;
			}
			else
			{
				this.sprite.tint = 0xffffff;
			}
		}
		
		var curTime = Date.now();
		if (curTime > this.lastUpdated + 30)
		{
			this.lastUpdated = curTime;
			this.game.client.sendUpdateDragCard(this.id, this.x, this.y);
		}
		
	}
};

TableCard.prototype.completeDrag = function()
{
	if (Math.abs(this.x - this.game.deckX) < 20 && Math.abs(this.y - this.game.deckY) < 30)
	{
		this.backToDeck();
	}
	else 
	{
		this.dragging = false;
		if (this.game.selectedCard == undefined)
		{
			if (Math.abs(this.x - this.game.platformX) < 40 && Math.abs(this.y - this.game.platformY) < 50)
			{
				this.x = this.game.platformX;
				this.y = this.game.platformY;

				this.game.selectCard(this);
				this.selected = true;
			}
		}
		else 
		{
			if (Math.abs(this.x - this.game.platformX) < 60 && Math.abs(this.y - this.game.platformY) < 80)
			{
				if (Math.abs(this.y - this.game.platformY) < 30)
				{
					if (this.x > this.game.platformX)
					{
						this.x = this.game.platformX + 60;
					}
					else
					{
						this.x = this.game.platformX - 60;
					}
				}
				else
				{
					if (this.y > this.game.platformY)
					{
						this.y = this.game.platformY + 80;
					}
					else
					{
						this.y = this.game.platformY - 80;
					}
				}
			}
		}
		this.x = Math.floor(Math.min(Math.max(this.x, 20), this.game.width - 20));
		this.y = Math.floor(Math.min(Math.max(this.y, 285), this.game.height - 35));
		this.updateClickPosition(this.x - 20, this.y - 35);
		this.sprite.position.x = this.x;
		this.sprite.position.y = this.y;
		
		this.game.client.sendCompleteDragCard(this.id, this.x, this.y);
		
	}
};

TableCard.prototype.onClick = function(mouseX, mouseY)
{
	this.dragging = true;
	this.dragXOff = mouseX - this.x;
	this.dragYOff = mouseY - this.y;
	this.game.draggingCard = this;
	this.game.activeTableCards.splice(this.game.activeTableCards.indexOf(this), 1);
	this.game.activeTableCards.unshift(this);
	this.container.removeChild(this.sprite);
	this.container.addChild(this.sprite);
	if (this.selected)
	{
		this.selected = false;
		this.game.unselectCard();
	}
	this.lastUpdated = Date.now();
	this.game.client.sendStartDragCard(this.id);
};

TableCard.prototype.backToDeck = function()
{
	this.die();
};

TableCard.prototype.die = function()
{
	this.game.activeTableCards.splice(this.game.activeTableCards.indexOf(this), 1);
	this.alive = false;
	this.container.removeChild(this.sprite);
};
	
	

