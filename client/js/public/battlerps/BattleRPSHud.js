/**
 * Created by Hamster on 10/28/2015.
 */





function RPSHud(game, container)
{
	this.game = game;
	this.hudLayer = new PIXI.Container();
	container.addChild(this.hudLayer);
	
	this.clickList = [];
	
	this.rockButton = new CardButton(this, this.hudLayer, 'rockCard', 1);
	this.paperButton = new CardButton(this, this.hudLayer, 'paperCard', 2);
	this.scissorsButton = new CardButton(this, this.hudLayer, 'scissorsCard', 3);
	
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
	this.x = 0;
	this.y = 0;
	this.width = 70;
	this.height = 121;
	this.sprite = new PIXI.Sprite(PIXI.loader.resources[spriteName].texture);
	this.sprite.scale.x = .5;
	this.sprite.scale.y = .5;
}


CardButton.prototype = new HamClickable();

CardButton.prototype.spawn = function(x, y)
{
	this.x = x;
	this.y = y;
	this.sprite.position.x = x;
	this.sprite.position.y = y;
	this.container.addChild(this.sprite);
	this.initClickable(x, y, 70, 121)
};

CardButton.prototype.onClick = function (mouseX, mouseY)
{
	this.hud.game.addTableCard(200 + 100 * Math.random(), 200 + 100 * Math.random());
	
};


