/**
 * Created by Hamster on 9/23/2015.
 */

var game;

var BattleRPSTextures = 
{
};
BattleRPSTextures.textureNames = {};
BattleRPSTextures.textureNames[0] = 'rockCard';

function BattleRPSGame(client)
{
	this.width = 600;
	this.height = 500;
	this.gameMouseX = 0;
	this.gameMouseY = 0;
	this.stage = new PIXI.Container();
	this.stage.hitArea = new PIXI.Rectangle(0, 0, this.width, this.height);
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
	this.stage.interactive = true;
	
	this.tableLayer = new PIXI.Container();
	this.stage.addChild(this.tableLayer);
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
	
	this.deckSprite = new PIXI.Sprite(PIXI.loader.resources['saltCardBack'].texture);
	this.deckSprite.anchor.x = .5;
	this.deckSprite.anchor.y = .5;
	this.deckSprite.position.x = 300;
	this.deckSprite.position.y = 420;
	this.deckSprite.scale.x = .5;
	this.deckSprite.scale.y = .5;
	this.tableLayer.addChild(this.deckSprite);
	
	this.tableCards = [];
	
	this.drawLoop();
	
};

BattleRPSGame.prototype.mouseDown = function(mouseData)
{
	game.hud.mouseDown(mouseData.data.originalEvent.offsetX, mouseData.data.originalEvent.offsetY);
};

BattleRPSGame.prototype.mouseMove = function(mouseData)
{
	game.gameMouseX = mouseData.data.originalEvent.offsetX;
	game.gameMouseY = mouseData.data.originalEvent.offsetY;
};


BattleRPSGame.prototype.addPlayer = function (id, name)
{
	var player = {
		id: id,
		name: name
	};
	this.players[id] = player;
};

BattleRPSGame.prototype.addTableCard = function(x, y)
{
	var card = new TableCard(this.tableCardLayer);
	card.spawn('paperCard', x, y);
	this.tableCards.push(card);
};

BattleRPSGame.prototype.selectRock = function()
{
	this.client.addSystemMessage("Selected Rock");
};

BattleRPSGame.prototype.drawLoop = function()
{
	for (var i in game.tableCards)
	{
		var tableCard = game.tableCards[i];
		tableCard.update(game.gameMouseX, game.gameMouseY);
	}
	
	game.renderer.render(game.stage);
	requestAnimationFrame(game.drawLoop);
	//game.gameMouseX = game.renderer.plugins.interaction.mouse.originalEvent.offsetX;
	//game.gameMouseY = game.renderer.plugins.interaction.mouse.originalEvent.offsetY;
};

BattleRPSGame.prototype.getView = function ()
{
	return this.renderer.view;
};

