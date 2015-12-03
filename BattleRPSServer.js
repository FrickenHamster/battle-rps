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


var game = new RPSGame.GameManager();

var server = http.createServer(function (request, response)
{
	// Not important for us. We're writing WebSocket server, not HTTP server
});

function startServer()
{
	freeIDs = [];
	for (var i = maxClients - 1; i >= 0; i--)
	{
		freeIDs.push(i);
	}
	
	
}
startServer();

server.listen(port, function ()
{
	serverLog("Server started listening on port " + port);
	new RPSGame.GameManager(this);
});

var wsServer = new webSocketServer({
	// WebSocket server is tied to a HTTP server. WebSocket request is just
	// an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
	httpServer: server
});

wsServer.on('request', function(request)
{
	serverLog("connection");
	var socket = request.accept(null, request.origin);

	var client =
	{
		active :false,
		name: null
	};
	
	socket.on('message', function(message)
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
					game.addPlayer(newID, client);
					clients[client.id] = client;
					sendAssignID(client, client.id);
					for (var i in clients)
					{
						var sendClient = clients[i];
						if (sendClient.active && sendClient.id != newID)
						{
							sendNewClient(sendClient, client.id, client.name);
						}
					}
					
					sendUsers(client);
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
								sendChatMessage(sendClient, client.id, message);
							}
						}
						break;
					
					case pIDs.DRAW_CARD:
					{
						
					}
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

function sendAssignID(sendClient, id)
{
	var data = [pIDs.ASSIGN_ID, id];
	sendClient.connection.send(JSON.stringify(data));
	dLog("SEND", "assign id : " + id);

}
function sendChatMessage(sendClient, fromClient, message)
{
	var data = [pIDs.CHAT_MESSAGE, fromClient, message];
	sendClient.connection.send(JSON.stringify(data));
	dLog("send chat message to " + sendClient.id + ":" + message);
}

function sendNewClient(sendClient, id, name)
{
	var data = [pIDs.NEW_USER, id, name];
	sendClient.connection.send(JSON.stringify(data));
	dLog("SEND", "New Client to " + sendClient.id + " new client : " + id);
}

function sendUsers(sendClient)
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
}

function sendUserLeft(sendClient, disconnectedClient)
{
	var data = [pIDs.USER_LEFT, disconnectedClient.id];
	sendClient.connection.send(JSON.stringify(data));
	dLog("SEND", "User left to" + sendClient.id + " disconnected client : " + disconnectedClient.id);
}

function sendDrawCardToAll(sendClient, id, value)
{
	var data = [pIDs.DRAW_ROCK, id, value];
	for (var i in clients)
	{
		var sendClient = clients[i];
		if (sendClient.active)
		{
			sendClient.connection.send(JSON.stringify(data));
			dLog("SEND", "Draw Card to " + sendClient.id + " client : " + id);
		}
	}
}



function serverLog(str1)
{
	var date = new Date();
	var dtext = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
	console.log(dtext + "-" + str1);
}

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