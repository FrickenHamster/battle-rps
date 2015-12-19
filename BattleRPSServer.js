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
		
		socket.binaryType = "arraybuffer";
		
		var client =
		{
			active: false,
			name: null
		};

		socket.on('message', function (rawData)
		{
			//if (message is Array)

			if (rawData.type === 'binary')
			{
				serverLog("receive binary message size" + rawData.binaryData.byteLength);
				var data = new Uint8Array(rawData.binaryData);
				var protoID = data[0];
				serverLog("message Protocol ID: " + protoID);
				
				if (!client.active)
				{
					if (protoID == pIDs.INIT_JOIN)
					{
						var userNameView = data.slice(1, data.length);
						var userName = ab2str(userNameView);
						var test = new Uint8Array(data, 1, 4);
						console.log(test.length)
						if (freeIDs.size == 0)
						{
							//reject
						}
						var newID = freeIDs.pop();
						client.active = true;
						client.name = userName;
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
				else switch(protoID)
				{
					case pIDs.CHAT_MESSAGE:
						var rawMessage = data.slice(1, data.length);
						var message = stringCleaner(ab2str(rawMessage));
						serverLog(message);
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

					case pIDs.START_DRAG_CARD:

						break;

					case pIDs.UPDATE_DRAG_CARD:

						bs.game.updateDragCard(data[1], data[2], data[3]);
						break;

					case pIDs.COMPLETE_DRAG_CARD:

						break;
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
	var buffer = new Buffer(2);
	buffer[0] = pIDs.ASSIGN_ID;
	buffer[1] = id;
	
	sendClient.connection.sendBytes(buffer);
	dLog("SEND", "assign id : " + id);
};

BattleRPSServer.prototype.sendChatMessage = function (sendClient, fromClient, message)
{
	var buffer = new Buffer(message.length + 2);
	buffer[0] = pIDs.CHAT_MESSAGE;
	buffer[1] = fromClient.id;
	copyStringToBuffer(buffer, message, 2);
	sendClient.connection.sendBytes(buffer);
	console.log(buffer.size);
	dLog("send chat message to " + sendClient.id + ":" + message);
};

BattleRPSServer.prototype.sendNewClient = function (sendClient, id, name)
{
	var protoView = new Uint8Array(1);
	protoView[0] = pIDs.NEW_USER;

	var nameView = str2ab(name);

	var sendArray = new Uint8Array(messageView + 1);
	sendArray.set(protoView);
	sendArray.set(nameView);
	sendClient.connection.send(sendArray);
	dLog("SEND", "New Client to " + sendClient.id + " new client : " + id);
};

BattleRPSServer.prototype.sendUsers = function (sendClient)
{
	var sendSize = 1;
	
	var nameBuffers = [];
	for (var i in clients)
	{
		var client = clients[i];
		if (!client.active)
			continue;
		var ss = client.name.length;
		/*var nameView = str2ab(client.name);
		
		var ss = nameView.byteLength;
		
		var nameChunk = new Uint8Array(ss + 1);
		nameChunk[0] = client.id;
		nameChunk.set(nameView, 1);
		nameBuffers.push(nameChunk);*/
		sendSize += ss + 2;
	}
	var buffer = new Buffer(sendSize);
	buffer[0] = pIDs.SEND_USERS;
	var bytePos = 1;

	for (var i in clients)
	{
		var client = clients[i];
		if (!client.active)
			continue;
		buffer[bytePos] = client.id;
		buffer[bytePos + 1] = client.name.length;
		copyStringToBuffer(buffer, client.name, bytePos + 1);
		bytePos += 2 + client.name;
	}
	
	sendClient.connection.send(buffer);
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

function ab2str(buf)
{
	return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function str2ab(str) {
	var buf = new ArrayBuffer(str.length); // 2 bytes for each char
	var bufView = new Uint8Array(buf);
	for (var i=0, strLen=str.length; i<strLen; i++) {
		bufView[i] = str.charCodeAt(i);
	}
	return buf;
}

function copyStringToBuffer(buffer, string, offset)
{
	for (var i = 0; i < string.length; i++)
	{
		buffer[offset + i] = string.charCodeAt(i);
	}
}

function copyArrayToBuffer(buffer, array, offset)
{
	for (var i = 0; i < array.length; i++)
	{
		buffer[offset + i] = array[i];
	}
}
