/**
 * Created by Hamster on 11/14/2015.
 */



function TableCard(container)
{
	this.container = container;
	this.sprite = new PIXI.Sprite();
	this.sprite.anchor.x = .5;
	this.sprite.anchor.y = .5;
	this.sprite.scale.x = .5;
	this.sprite.scale.y = .5;
}

TableCard.prototype = new HamClickable();


TableCard.prototype.spawn = function(spriteName, x, y)
{
	this.sprite.texture = PIXI.loader.resources[spriteName].texture;
	this.x = x;
	this.y = y;
	this.sprite.position.x = x;
	this.sprite.position.y = y;
	this.container.addChild(this.sprite);
	this.initClickable(x - 35, y - 60, 70, 121);
	
	this.dragging = false;
};

TableCard.prototype.update = function(mouseX, mouseY)
{
	if (this.dragging == true)
	{
		this.x = mouseX;
		this.y = mouseY;
		this.clickX = this.x - 35;
		this.clickY = this.y - 60;
		this.sprite.position.x = this.x;
		this.sprite.position.y = this.y;
	}
};



TableCard.prototype.onClick = function(mouseX, mouseY)
{
	this.dragging = true;
	this.dragXOff = mouseX - this.x;
	this.dragYOff = mouseY - this.y;
	
};



	
	

