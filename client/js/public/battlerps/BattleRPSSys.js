/**
 * Created by Hamster on 11/14/2015.
 */



function HamClickable()
{
}

HamClickable.prototype.initClickable = function(x, y, width, height)
{
	this.clickX = x;
	this.clickY = y;
	this.clickWidth = width;
	this.clickHeight = height;
};

HamClickable.prototype.checkClick = function(mouseX, mouseY)
{
	var ww = this.clickWidth * this.sprite.scale.x;
	var hh = this.clickHeight * this.sprite.scale.y;
	if (this.clickX + ww < mouseX || this.clickX > mouseX || this.clickY + hh < mouseY || this.clickY > mouseY)
		return false;
	this.onClick(mouseX, mouseY);
	return true;
};

HamClickable.prototype.onClick = function(mouseX, mouseY)
{
	
};

HamClickable.prototype.updateClickPosition = function(x, y)
{
	this.clickX = x;
	this.clickY = y;
};
