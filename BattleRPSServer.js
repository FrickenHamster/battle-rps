/**
 * Created by Hamster on 7/11/2015.
 */

var debugging = true;

var webSocketServer = require('websocket').server;
var http = require('http');

var port = 1339;

var RPSGame = require('./RPSGame.js');
var RPSProtocol = require('./RPSProtocol.js');
var pIDs = RPSProtocol.protocol;

var maxPlayers = 2;
var maxClients = 10;
var freeIDs = [];

var clients = {};


function BattleRPSServer()
{
	this.port = 1339;
	this.maxPlayers = 2;
	this.maxClients = 10;
	this.freeIDs = [];

	this.clients = {};

}


BattleRPSServer.prototype.startServer = function ()
{
	var bs = this;
	freeIDs = [];
	for (var i = maxClients - 1; i >= 0; i--)
	{
		freeIDs.push(i);
	}

	this.httpServer = http.createServer(function (request, response)
	{
	});

	this.httpServer.listen(this.port, function ()
	{
		serverLog("Server started listening on port " + port);
		bs.game = new RPSGame.GameManager(bs);
	});

	this.wsServer = new webSocketServer({
		httpServer: this.httpServer
	});

	this.wsServer.on('request', function (request)
	{
		serverLog("connection");
		var socket = request.accept(null, request.origin);

		var client =
		{
			active: false,
			name: null
		};

		socket.on('message', function (message)
		{
			serverLog("receive message" + message);
			if (message.type === 'utf8')
			{
				var data = JSON.parse(message.utf8Data);
				serverLog("receive message " + data);
				//check length
				var id = data[0];
				if (!client.active)
				{
					if (id == pIDs.INIT_JOIN)
					{
						if (freeIDs.size == 0)
						{
							//reject
						}
						var newID = freeIDs.pop();
						client.active = true;
						client.name = data[1];
						client.id = newID;
						client.connection = socket;
						bs.game.addPlayer(newID, client);
						clients[client.id] = client;
						bs.sendAssignID(client, client.id);
						for (var i in clients)
						{
							var sendClient = clients[i];
							if (sendClient.active && sendClient.id != newID)
							{
								bs.sendNewClient(sendClient, client.id, client.name);
							}
						}

						bs.sendUsers(client);
					}

				}
				else
				{
					switch (id)
					{
						case pIDs.CHAT_MESSAGE:
							var message = stringCleaner(data[1]);
							for (i in clients)
							{
								sendClient = clients[i];
								if (sendClient.active)
								{
									bs.sendChatMessage(sendClient, client.id, message);
								}
							}
							break;

						case pIDs.DRAW_CARD:
							
							bs.game.drawCard(client.id, data[1]);
								
							break;
						
						case pIDs.UPDATE_DRAG_CARD:
							
							bs.game.updateDragCard(data[1], data[2], data[3]);
							break;
					}

				}
			}
		});
		socket.on('close', function (connection)
		{
			if (client.active)
			{
				serverLog("user " + client.name + "[" + client.id + "] disconnected.")
				delete clients[client.id];
				for (var i in clients)
				{
					var sendClient = clients[i];
					if (sendClient.active)
					{
						sendUserLeft(sendClient, client);
					}
				}
			}
		});
	});

};


var rpsServer = new BattleRPSServer();
rpsServer.startServer();

BattleRPSServer.prototype.sendAssignID = function (sendClient, id)
{
	var data = [pIDs.ASSIGN_ID, id];
	sendClient.connection.send(JSON.stringify(data));
	dLog("SEND", "assign id : " + id);
};

BattleRPSServer.prototype.sendChatMessage = function (sendClient, fromClient, message)
{
	var data = [pIDs.CHAT_MESSAGE, fromClient, message];
	sendClient.connection.send(JSON.stringify(data));
	dLog("send chat message to " + sendClient.id + ":" + message);
};

BattleRPSServer.prototype.sendNewClient = function (sendClient, id, name)
{
	var data = [pIDs.NEW_USER, id, name];
	sendClient.connection.send(JSON.stringify(data));
	dLog("SEND", "New Client to " + sendClient.id + " new client : " + id);
};

BattleRPSServer.prototype.sendUsers = function (sendClient)
{
	var data = [pIDs.SEND_USERS];
	for (var i in clients)
	{
		var client = clients[i];

		if (!client.active)
			continue;
		data.push(i, client.name);
	}
	sendClient.connection.send(JSON.stringify(data));
	dLog("SEND", "Users to " + sendClient.id);
};

BattleRPSServer.prototype.sendUserLeft = function (sendClient, disconnectedClient)
{
	var data = [pIDs.USER_LEFT, disconnectedClient.id];
	sendClient.connection.send(JSON.stringify(data));
	dLog("SEND", "User left to" + sendClient.id + " disconnected client : " + disconnectedClient.id);
};

BattleRPSServer.prototype.sendDrawCardToAll = function (clientID, id, value, x, y)
{
	var data = [pIDs.ENEMY_DRAW_CARD, clientID, id, x, y];
	for (var i in clients)
	{
		var sendClient = clients[i];
		if (sendClient.active)
		{
			if (sendClient.id == clientID)
			{
				var selfData = [pIDs.DRAW_CARD, id, value, x, y];

				sendClient.connection.send(JSON.stringify(selfData));
				dLog("SEND", "Self Draw Card to " + sendClient.id + " id: " + id);

			}
			else
			{
				sendClient.connection.send(JSON.stringify(data));
				dLog("SEND", "Draw Card to " + sendClient.id + " from : " + clientID);
			}
		}
	}
};



serverLog = function (str1)
{
	var date = new Date();
	var dtext = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
	console.log(dtext + "-" + str1);
};

function dLog()
{
	if (!debugging)
		return;
	if (arguments.length === 1)
	{
		console.log("DEBUG : " + arguments[0]);
	}
	else
	{
		console.log(arguments[0] + " : " + arguments[1])
	}
}

function stringCleaner(str)
{
	return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
		.replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

