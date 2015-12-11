/**
 * Created by Hamster on 10/28/2015.
 */



function RPSHud(game, container)
{
	this.game = game;
	this.hudLayer = new PIXI.Container();
	container.addChild(this.hudLayer);
	
	this.clickList = [];
	
	this.rockButton = new CardButton(this, this.hudLayer, 'rockCard', 0);
	this.paperButton = new CardButton(this, this.hudLayer, 'paperCard', 1);
	this.scissorsButton = new CardButton(this, this.hudLayer, 'scissorsCard', 2);
	
	this.rockButton.spawn(30, 420);
	this.paperButton.spawn(80, 420);
	this.scissorsButton.spawn(130, 420);
	this.clickList.push(this.rockButton);
	this.clickList.push(this.paperButton);
	this.clickList.push(this.scissorsButton);
}
	
RPSHud.prototype.mouseDown = function(mouseX, mouseY)
{
	for (var i in this.clickList)
	{
		var clickable = this.clickList[i];
		if (clickable.checkClick(mouseX, mouseY))
		{
			return true;
		}
	}
	return false;
};

function CardButton(hud, container, spriteName, cardValue)
{
	this.hud = hud;
	this.container = container;
	this.cardValue = cardValue;
	this.alive = false;
	this.x = 0;
	this.y = 0;
	this.width = 70;
	this.height = 40;
	this.sprite = new PIXI.Sprite(PIXI.loader.resources[spriteName].texture);
}


CardButton.prototype = new HamClickable();

CardButton.prototype.spawn = function(x, y)
{
	this.alive = true;
	this.x = x;
	this.y = y;
	this.sprite.position.x = x;
	this.sprite.position.y = y;
	this.container.addChild(this.sprite);
	this.initClickable(x, y, 40, 70)
};

CardButton.prototype.onClick = function (mouseX, mouseY)
{
	//this.hud.game.addTableCard(this.hud.game.getFreeTableCardID(), this.cardValue, this.hud.game.deckX - 20 + 40 * Math.random(), this.hud.game.deckY - 20 + 40 * Math.random());
	this.hud.game.client.sendDrawCard(this.cardValue);
};

CardButton.prototype.die = function()
{
	this.alive = false;
	this.container.removeChild(this.sprite);
};


