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

var MAX_TABLE_CARDS = 50;

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
	this.tableBottomLayer = new PIXI.Container();
	this.tableLayer = new PIXI.Container();
	this.stage.addChild(this.tableBottomLayer);
	this.stage.addChild(this.tableLayer);
	this.platformX = 300;
	this.platformY = 300;
	this.playerCardPlatform = new PIXI.Sprite(PIXI.loader.resources['cardPlatform'].texture);
	this.playerCardPlatform.anchor.x = 0.5;
	this.playerCardPlatform.anchor.y = 0.5;
	this.playerCardPlatform.position.x = 300;
	this.playerCardPlatform.position.y = 300;
	this.tableBottomLayer.addChild(this.playerCardPlatform);
	this.tableCardLayer = new PIXI.Container();
	this.stage.addChild(this.tableCardLayer);
	this.enemyCardPlatform = new PIXI.Sprite(PIXI.loader.resources['cardPlatform'].texture);
	this.enemyCardPlatform.anchor.x = 0.5;
	this.enemyCardPlatform.anchor.y = 0.5;
	this.enemyCardPlatform.rotation = Math.PI;
	this.enemyCardPlatform.x = this.width - this.platformX;
	this.enemyCardPlatform.y = this.height - this.platformY;
	this.tableBottomLayer.addChild(this.enemyCardPlatform);
	
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
	this.activeTableCards = [];
	this.tableCardPool = [];
	for (var i = 0; i < MAX_TABLE_CARDS; i++)
	{
		var card = new TableCard(this, this.tableCardLayer, i);
		this.tableCardPool.unshift(card);
	}

	this.enemyTableCards = [];
	this.activeEnemyTableCards = [];
	this.enemyTableCardPool = [];
	for (i = 0; i < MAX_TABLE_CARDS; i++)
	{
		var card = new EnemyTableCard(this, this.tableCardLayer, i);
		this.enemyTableCardPool.unshift(card);
	}
	
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
	for (var i in game.activeTableCards)
	{
		var tableCard = game.activeTableCards[i];
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

BattleRPSGame.prototype.addTableCard = function(cardID, type, x, y)
{
	if (this.tableCards[cardID] !== undefined)
		return undefined;
	if (this.tableCardPool.length == 0)
		return undefined;
	var card = this.tableCardPool.pop();
	card.spawn(cardID, type, x, y);
	this.tableCards[cardID] = card;
	this.activeTableCards.unshift(card);
	
	return card;
};

BattleRPSGame.prototype.completeDragTableCard = function(cardID, x, y)
{
	var card = this.tableCards[cardID];
	if (card === undefined)
		return undefined;
	card.changePosition(x, y);
};

BattleRPSGame.prototype.addEnemyTableCard = function(clientID, cardID, x, y)
{
	if (this.enemyTableCards[cardID] !== undefined)
		return undefined;
	if (this.enemyTableCardPool.length == 0)
		return undefined;
	var card = this.enemyTableCardPool.pop();
	card.spawn(clientID, cardID, x, y);
	this.enemyTableCards[cardID] = card;
	this.activeEnemyTableCards.unshift(card);

	return card;
};

BattleRPSGame.prototype.startDragEnemyTableCard = function(clientID, cardID)
{
	var card = this.enemyTableCards[cardID];
	if (card === undefined)
		return;
	card.startDrag();
};
BattleRPSGame.prototype.updateDragEnemyTableCard = function(clientID, cardID, x, y)
{
	var card = this.enemyTableCards[cardID];
	if (card === undefined)
		return;
	card.setDragTarget(x, y);
};
BattleRPSGame.prototype.completeDragEnemyTableCard = function(clientID, cardID, x, y)
{
	var card = this.enemyTableCards[cardID];
	if (card === undefined)
		return;
	card.stopDrag(x, y);
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

BattleRPSGame.prototype.getFreeTableCardID = function()
{
	for (var i = 0; i < MAX_TABLE_CARDS; i++)
	{
		if (this.tableCards[i] == undefined)
		{
			console.log(i);
			return i;
		}
	}
};

BattleRPSGame.prototype.drawLoop = function()
{
	var gx = this.renderer.plugins.interaction.mouse.global.x;
	var gy = this.renderer.plugins.interaction.mouse.global.y;
	if (gx >= 0 && gx <= this.width && gy >= 0 && gy <= this.height)
	{
		this.gameMouseX = gx;
		this.gameMouseY = gy;
	}
	
	var i;
	for (i in this.activeTableCards)
	{
		var tableCard = this.activeTableCards[i];
		tableCard.update(this.gameMouseX, this.gameMouseY);
	}
	for (i in this.activeEnemyTableCards)
	{
		var enemyTableCard = this.activeEnemyTableCards[i];
		enemyTableCard.update();
	}
	
	game.renderer.render(game.stage);
	requestAnimationFrame(function ()
	{
		game.drawLoop();
	});
	
};

BattleRPSGame.prototype.getView = function ()
{
	return this.renderer.view;
};

