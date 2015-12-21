/**
 * Created by Hamster on 7/11/2015.
 */

var debugging = true;

var webSocketServer = require('websocket').server;
var http = require('http');

var RPSGame = require('./RPSGame.js');
var RPSProtocol = require('./RPSProtocol.js');
var pIDs = RPSProtocol.protocol;



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
	this.freeIDs = [];
	for (var i = this.maxClients - 1; i >= 0; i--)
	{
		this.freeIDs.push(i);
	}

	this.httpServer = http.createServer(function (request, response)
	{
	});

	this.httpServer.listen(this.port, function ()
	{
		serverLog("Server started listening on port " + bs.port);
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
				var dataView = new DataView(data.buffer);
				serverLog("message Protocol ID: " + protoID);
				
				if (!client.active)
				{
					if (protoID == pIDs.INIT_JOIN)
					{
						var userNameView = data.slice(1, data.length);
						var userName = ab2str(userNameView);
						if (bs.freeIDs.size == 0)
						{
							//reject
						}
						var newID = bs.freeIDs.pop();
						client.active = true;
						client.name = userName;
						client.id = newID;
						client.connection = socket;
						bs.game.addPlayer(newID, client);
						bs.clients[client.id] = client;
						bs.sendAssignID(client, client.id);
						serverLog("New User ID: " + client.id + " name: " + client.name);
						for (var i in bs.clients)
						{
							var sendClient = bs.clients[i];
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
					var cardID;
					var xx;
					var yy;

					switch(protoID)
					{
						case pIDs.CHAT_MESSAGE:
							var rawMessage = data.slice(1, data.length);
							var message = stringCleaner(ab2str(rawMessage));
							serverLog(message);
							for (i in bs.clients)
							{
								sendClient = bs.clients[i];
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
							cardID = dataView.getUint8(1);
							bs.game.startDragCard(client.id, cardID);
							break;

						case pIDs.UPDATE_DRAG_CARD:
							cardID = dataView.getUint8(1);
							xx = dataView.getUint16(2);
							yy = dataView.getUint16(4);
							bs.game.updateDragCard(client.id, cardID, xx, yy);
							break;

						case pIDs.COMPLETE_DRAG_CARD:
							cardID = dataView.getUint8(1);
							xx = dataView.getUint16(2);
							yy = dataView.getUint16(4);
							bs.game.completeDragCard(client.id, cardID, xx, yy);
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
				delete bs.clients[client.id];
				for (var i in bs.clients)
				{
					var sendClient = bs.clients[i];
					if (sendClient.active)
					{
						bs.sendUserLeft(sendClient, client);
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

BattleRPSServer.prototype.sendChatMessage = function (sendClient, fromClientID, message)
{
	var buffer = new Buffer(message.length + 2);
	buffer[0] = pIDs.CHAT_MESSAGE;
	buffer[1] = fromClientID;
	copyStringToBuffer(buffer, message, 2);
	sendClient.connection.sendBytes(buffer);
	dLog("send chat message to " + sendClient.id + " from: " + fromClientID + " msg: " + message);
};

BattleRPSServer.prototype.sendNewClient = function (sendClient, id, name)
{
	var buffer = new Buffer(name.length + 2);
	buffer[0] = pIDs.NEW_USER;
	buffer[1] = id;
	copyStringToBuffer(buffer, name, 2);
	
	sendClient.connection.sendBytes(buffer);
	dLog("SEND", "New Client to " + sendClient.id + " new client : " + id);
};

BattleRPSServer.prototype.sendUsers = function (sendClient)
{
	var sendSize = 3;
	var clientNum = 0;
	for (var i in this.clients)
	{
		var client = this.clients[i];
		if (!client.active)
			continue;
		var ss = client.name.length;
		sendSize += ss + 2;
		clientNum++;
	}
	var buffer = new Buffer(sendSize);
	buffer[0] = pIDs.SEND_USERS;
	var cNumArray = new ArrayBuffer(2);
	var dv = new DataView(cNumArray);
	dv.setUint16(0, clientNum);
	buffer[1] = dv.getInt8(0);
	buffer[2] = dv.getInt8(1);
	var bytePos = 3;
	for (var i in this.clients)
	{
		var client = this.clients[i];
		if (!client.active)
			continue;
		buffer[bytePos] = client.id;
		buffer[bytePos + 1] = client.name.length;
		copyStringToBuffer(buffer, client.name, bytePos + 2);
		bytePos += 2 + client.name.length;
	}
	sendClient.connection.send(buffer);
	dLog("SEND", "Users to " + sendClient.id);
};

BattleRPSServer.prototype.sendUserLeft = function (sendClient, disconnectedClient)
{
	var buffer = new Buffer(2);
	buffer[0] = pIDs.USER_LEFT;
	buffer[1] = disconnectedClient.id;
	sendClient.connection.sendBytes(buffer);
	dLog("SEND", "User left to" + sendClient.id + " disconnected client : " + disconnectedClient.id);
};

BattleRPSServer.prototype.sendDrawCardToAll = function (clientID, cardID, value, x, y)
{
	var buffer = new Buffer(7);
	var arrayBuffer = new ArrayBuffer(7);
	var dataView = new DataView(arrayBuffer);
	dataView.setUint8(0, pIDs.ENEMY_DRAW_CARD);
	dataView.setUint8(1, clientID);
	dataView.setUint8(2, cardID);
	dataView.setUint16(3, x);
	dataView.setUint16(5, y);
	copyArrayToBuffer(buffer, dataView, 0);
	for (var i in this.clients)
	{
		var sendClient = this.clients[i];
		if (sendClient.active)
		{
			if (sendClient.id == clientID)
			{
				var selfBuffer = new Buffer(7);
				var selfArrayBuffer = new ArrayBuffer(7);
				var selfDataView = new DataView(selfArrayBuffer);
				selfDataView.setUint8(0, pIDs.DRAW_CARD);
				selfDataView.setUint8(1, cardID);
				selfDataView.setUint8(2, value);
				selfDataView.setUint16(3, x);
				selfDataView.setUint16(5, y);
				copyArrayToBuffer(selfBuffer, selfDataView);
				
				sendClient.connection.sendBytes(selfBuffer);
				dLog("SEND", "Self Draw Card to " + sendClient.id + " id: " + cardID);
			}
			else
			{
				sendClient.connection.sendBytes(buffer);
				dLog("SEND", "Draw Card to " + sendClient.id + " from : " + clientID);
			}
		}
	}
};

BattleRPSServer.prototype.sendStartDragCardToAll = function (clientID, cardID)
{
	var buffer = new Buffer(7);
	var arrayBuffer = new ArrayBuffer(7);
	var dataView = new DataView(arrayBuffer);
	dataView.setUint8(0, pIDs.ENEMY_START_DRAG_CARD);
	dataView.setUint8(1, clientID);
	dataView.setUint8(2, cardID);
	copyArrayToBuffer(buffer, dataView, 0);
	for (var i in this.clients)
	{
		var sendClient = this.clients[i];
		if (sendClient.active)
		{
			if (sendClient.id == clientID)
			{
				var selfBuffer = new Buffer(7);
				var selfArrayBuffer = new ArrayBuffer(7);
				var selfDataView = new DataView(selfArrayBuffer);
				selfDataView.setUint8(0, pIDs.START_DRAG_CARD);
				selfDataView.setUint8(1, cardID);
				copyArrayToBuffer(selfBuffer, selfDataView);

				sendClient.connection.sendBytes(selfBuffer);
				dLog("SEND", "Self Draw Card to " + sendClient.id + " id: " + cardID);
			}
			else
			{
				sendClient.connection.sendBytes(buffer);
				dLog("SEND", "Draw Card to " + sendClient.id + " from : " + clientID);
			}
		}
	}
};

BattleRPSServer.prototype.sendUpdateDragCardToAll = function (clientID, cardID, x, y)
{
	var buffer = new Buffer(7);
	var arrayBuffer = new ArrayBuffer(7);
	var dataView = new DataView(arrayBuffer);
	dataView.setUint8(0, pIDs.ENEMY_UPDATE_DRAG_CARD);
	dataView.setUint8(1, clientID);
	dataView.setUint8(2, cardID);
	dataView.setUint16(3, x);
	dataView.setUint16(5, y);
	copyArrayToBuffer(buffer, dataView, 0);
	console.log(buffer);
	for (var i in this.clients)
	{
		var sendClient = this.clients[i];
		if (sendClient.active)
		{
			if (sendClient.id == clientID)
			{
				var selfBuffer = new Buffer(7);
				var selfArrayBuffer = new ArrayBuffer(7);
				var selfDataView = new DataView(selfArrayBuffer);
				selfDataView.setUint8(0, pIDs.UPDATE_DRAG_CARD);
				selfDataView.setUint8(1, cardID);
				dataView.setUint16(2, x);
				dataView.setUint16(4, y);
				copyArrayToBuffer(selfBuffer, selfDataView);

				sendClient.connection.sendBytes(selfBuffer);
				dLog("SEND", "Self update Draw Card to " + sendClient.id + " id: " + cardID);
			}
			else
			{
				sendClient.connection.sendBytes(buffer);
				dLog("SEND", "Update drag Card to " + sendClient.id + " from : " + clientID);
			}
		}
	}
};

BattleRPSServer.prototype.sendCompleteDragCardToAll = function (clientID, cardID, x, y)
{
	var buffer = new Buffer(7);
	var arrayBuffer = new ArrayBuffer(7);
	var dataView = new DataView(arrayBuffer);
	dataView.setUint8(0, pIDs.ENEMY_COMPLETE_DRAG_CARD);
	dataView.setUint8(1, clientID);
	dataView.setUint8(2, cardID);
	dataView.setUint16(3, x);
	dataView.setUint16(5, y);
	copyArrayToBuffer(buffer, dataView, 0);
	console.log(buffer);
	for (var i in this.clients)
	{
		var sendClient = this.clients[i];
		if (sendClient.active)
		{
			if (sendClient.id == clientID)
			{
				var selfBuffer = new Buffer(7);
				var selfArrayBuffer = new ArrayBuffer(7);
				var selfDataView = new DataView(selfArrayBuffer);
				selfDataView.setUint8(0, pIDs.COMPLETE_DRAG_CARD);
				selfDataView.setUint8(1, cardID);
				selfDataView.setUint16(2, x);
				selfDataView.setUint16(4, y);
				copyArrayToBuffer(selfBuffer, selfDataView);
				sendClient.connection.sendBytes(selfBuffer);
				dLog("SEND", "Self Complete drag Card to " + sendClient.id + " id: " + cardID);
			}
			else
			{
				sendClient.connection.sendBytes(buffer);
				dLog("SEND", "Complete drag Card to " + sendClient.id + " from : " + clientID);
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
	if (offset === undefined)
		offset = 0;
	var i;
	if (array instanceof DataView)
	{
		for (i = 0; i < array.byteLength; i++)
		{
			buffer[offset + i] = array.getUint8(i);
		}
	}
	else if (array instanceof ArrayBuffer)
	{
		var dataView = new DataView(array)
		for (i = 0; i < dataView.byteLength; i++)
		{
			buffer[offset + i] = dataView.getUint8(i);
		}
	}
	else
	{
		for (i = 0; i < array.length; i++)
		{
			buffer[offset + i] = array[i];
		}
	}
}
