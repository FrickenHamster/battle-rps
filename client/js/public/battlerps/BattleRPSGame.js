/**
 * Created by Hamster on 9/23/2015.
 */

var game;

var BattleRPSTextures = 
{
};
BattleRPSTextures.textureNames = {};
BattleRPSTextures.textureNames[0] = 'rockCard';
BattleRPSTextures.textureNames[1] = 'paperCard';
BattleRPSTextures.textureNames[2] = 'scissorsCard';

function BattleRPSGame(client)
{
	this.width = 600;
	this.height = 500;
	this.gameMouseX = 0;
	this.gameMouseY = 0;
	this.stage = new PIXI.Container();
	this.stage.hitArea = new PIXI.Rectangle(0, 0, this.width, 500);
	this.renderer = PIXI.autoDetectRenderer(this.width, this.height);
	this.renderer.backgroundColor = 0x98FF98;
	
	this.client = client;
	this.players = {};
	

	game = this;
	PIXI.loader.add([
		{
			name: "cardPlatform",
			url: "images/battlerps/card_platform.png"
		},
		{
			name: "rockCard",
			url: "images/battlerps/cards/card_rock.png"
		},
		{
			name: "paperCard",
			url: "images/battlerps/cards/card_paper.png"
		},
		{
			name: "scissorsCard",
			url: "images/battlerps/cards/card_scissors.png"
		},
		{
			name: "saltCardBack",
			url: "images/battlerps/cards/card_saltback.png"
		}
	])
		.on("progress", this.loadProgressHandler)
		.load(this.loaded);
}

BattleRPSGame.prototype.loadProgressHandler = function (loader, resource)
{
};


BattleRPSGame.prototype.loaded = function ()
{
	game.hud = new RPSHud(game, game.stage);
	game.renderer.render(game.stage);
	game.startMatch();
};
	
BattleRPSGame.prototype.startMatch = function()
{
	this.stage.on('mousedown', this.mouseDown);
	this.stage.on('mousemove', this.mouseMove);
	this.stage.on('mouseup', this.mouseUp);
	this.stage.on('mouseout', function(e)
	{
	});
	
	this.stage.interactive = true;
	
	this.tableLayer = new PIXI.Container();
	this.stage.addChild(this.tableLayer);
	this.platformX = 300;
	this.platformY = 300;
	this.playerCardPlatform = new PIXI.Sprite(PIXI.loader.resources['cardPlatform'].texture);
	this.playerCardPlatform.anchor.x = 0.5;
	this.playerCardPlatform.anchor.y = 0.5;
	this.playerCardPlatform.position.x = 300;
	this.playerCardPlatform.position.y = 300;
	this.tableLayer.addChild(this.playerCardPlatform);
	this.tableCardLayer = new PIXI.Container();
	this.stage.addChild(this.tableCardLayer);
	
	
	
	this.tableLine = new PIXI.Graphics();
	this.tableLine.lineStyle(2, 0x000000, 1);
	this.tableLine.moveTo(0, this.height / 2);
	this.tableLine.lineTo(this.width, this.height / 2);
	
	this.tableLayer.addChild(this.tableLine);

	this.deckX = 300;
	this.deckY = 440;
	this.deckSprite = new PIXI.Sprite(PIXI.loader.resources['saltCardBack'].texture);
	this.deckSprite.anchor.x = .5;
	this.deckSprite.anchor.y = .5;
	this.deckSprite.position.x = this.deckX;
	this.deckSprite.position.y = this.deckY;
	
	this.tableLayer.addChild(this.deckSprite);
	
	this.tableCards = [];
	
	this.drawLoop();
	
};

BattleRPSGame.prototype.mouseDown = function(mouseData)
{
	var mx = mouseData.data.originalEvent.offsetX;
	var my = mouseData.data.originalEvent.offsetY;
	if (game.hud.mouseDown(mx, my))
	{
		return;
	}
	for (var i in game.tableCards)
	{
		var tableCard = game.tableCards[i];
		if (tableCard.checkClick(mx, my))
		{
			return;
		}
	}
};

BattleRPSGame.prototype.mouseMove = function(mouseData)
{
	/*var gx = mouseData.data.global.x;
	var gy = mouseData.data.global.y;
	if (gx < 0 || gx > game.width || gy < 0 || gy > game.height)
		return;
	game.gameMouseX = gx;
	game.gameMouseY = gy;*/
};

BattleRPSGame.prototype.mouseUp = function(mouseData)
{
	if (game.draggingCard != undefined)
	{
		game.draggingCard.completeDrag();
		game.draggingCard = undefined;
		
	}
};


BattleRPSGame.prototype.addPlayer = function (id, name)
{
	var player = {
		id: id,
		name: name
	};
	this.players[id] = player;
};

BattleRPSGame.prototype.addTableCard = function(type, x, y)
{
	var card = new TableCard(this, this.tableCardLayer);
	card.spawn(type, x, y);
	this.tableCards.unshift(card);
};

BattleRPSGame.prototype.selectCard = function(card)
{
	this.selectedCard = card;
	this.client.addSystemMessage("Selected " + card.cardValue)
};

BattleRPSGame.prototype.unselectCard = function()
{
	this.selectedCard = undefined;
};

BattleRPSGame.prototype.selectRock = function()
{
	this.client.addSystemMessage("Selected Rock");
};

BattleRPSGame.prototype.drawLoop = function()
{
	var gx = game.renderer.plugins.interaction.mouse.global.x;
	var gy = game.renderer.plugins.interaction.mouse.global.y;
	if (gx >= 0 && gx <= game.width && gy >= 0 && gy <= game.height)
	{
		game.gameMouseX = gx;
		game.gameMouseY = gy;
	}
	for (var i in game.tableCards)
	{
		var tableCard = game.tableCards[i];
		tableCard.update(game.gameMouseX, game.gameMouseY);
	}
	
	game.renderer.render(game.stage);
	requestAnimationFrame(game.drawLoop);
	
};

BattleRPSGame.prototype.getView = function ()
{
	return this.renderer.view;
};

