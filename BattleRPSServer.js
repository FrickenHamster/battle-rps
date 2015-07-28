/**
 * Created by Hamster on 7/11/2015.
 */

var webSocketServer = require('websocket').server;
var http = require('http');
	
var port = 1339;

var RPSGame = require('./RPSGame.js');
var RPSProtocol = require('./RPSProtocol.js');
var pIDs = RPSProtocol.protocol;

var clients = [];


var server = http.createServer(function (request, response)
{
	// Not important for us. We're writing WebSocket server, not HTTP server
});
server.listen(port, function ()
{
	serverLog("Server started listening on port " + port);
	new RPSGame.GameManager();
});

var wsServer = new webSocketServer({
	// WebSocket server is tied to a HTTP server. WebSocket request is just
	// an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
	httpServer: server
});

wsServer.on('request', function(request)
{
	
	var socket = request.accept(null, request.origin);

	var client =
	{
		active :false,

	};
	
	socket.on('message', function(message)
	{
		if (message.type === 'utf8')
		{
			var data = JSON.parse(message.utf8Data);
			//check length
			var id = data[0];
			if (!client.active)
			{
				if (id == pIDs.INIT_JOIN)
				{

				}
			}
		}
	});
	
});

function serverLog(str1)
{
	var date = new Date();
	var dtext = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
	console.log(dtext + "-" + str1);
}
function stringCleaner(str)
{
	return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
		.replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}