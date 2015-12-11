/**
 * Created by Hamster on 7/13/2015.
 */
"use strict";
var debugging = true;
function BattleRPSClient()
{

	this.chatTicker = $('.js-chat-ticker');
	this.chatInput = $('.js-chat-input');
	this.chatInput.attr("placeholder", "Choose a username");

	this.connected = false;
	this.gameClient = new BattleRPSGame(this);
	this.client;
	this.clients = {};
	this.tempName = "testing";
	this.connection;
	
	var bc = this;

	$('.js-game-container').append(this.gameClient.getView());

	window.WebSocket = window.WebSocket || window.MozWebSocket;
// if browser doesn't support WebSocket, just show some notification and exit
	if (!window.WebSocket)
	{
		this.addChatError("Your browser does not support websockets");
		return;
	}

	this.chatInput.keydown(function (e)
	{
		if (e.keyCode === 13)
		{
			/*if (chatClient.userName == false)
			 {
			 initiateConnect(chatInput.val());
			 chatInput.val("");
			 }
			 else
			 {
			 sendMessage(chatInput.val());
			 chatInput.val("");
			 }*/
			var val = bc.chatInput.val();

			if (bc.connected == false)
			{
				if (val != "")
				{
					bc.initiateConnect(val);
					bc.chatInput.val("");
				}
			}
			else
			{
				if (val != "")
				{
					bc.sendMessage(val);
					bc.chatInput.val("");
				}
			}
		}
	});
}

BattleRPSClient.prototype.connect = function()
{

	this.connection = new WebSocket('ws://127.0.0.1:1339');

	this.addSystemMessage("CONNECTING");
	this.setupConnection();
};

BattleRPSClient.prototype.setupConnection = function(connection)
{
	if (connection == undefined)
	{
		return false;
	}
	var bc = this;
	connection.onopen = function ()
	{
		bc.chatInput.val("Connecting");
		bc.chatInput.prop("disabled", true);

		bc.sendJoin(bc.tempName);

		/*setInterval(function ()
		 {
		 if (chatClient.username != false)
		 {
		 input.attr('disabled', 'disabled').val('Unable to comminucate '
		 + 'with the WebSocket server.');
		 }
		 }, 3000);*/
	};

	connection.onerror = function (error)
	{
		dLog(error);
		bc.addChatError("Connection error");
	};

	connection.onmessage = function (message)
	{
		try
		{
			var data = JSON.parse(message.data);
		} catch (e)
		{
			console.log('Invalid message received form server', message.data);
			return;
		}
		dLog("received message" + data);

		switch (data[0])
		{
			case RPS_PROTOCOL.NEW_USER:
				console.log("received id" + data[1]);
				var newID = data[1];
				var newName = data[2];
				bc.gameClient.addPlayer(data[1], data[2]);
				var newClient = {
					id:newID,
					name:newName
				};
				bc.clients[newID] = newClient;
				bc.addSystemMessage(newClient.name + " has connected.");
				break;

			case RPS_PROTOCOL.ASSIGN_ID:
				newID = data[1];
				console.log("received id " + newID);
				bc.client = {id: newID};
				bc.chatInput.val("");
				bc.chatInput.attr("placeholder", "");
				bc.chatInput.prop("disabled", false);
				bc.connected = true;
				bc.addSystemMessage("CONNECTED");

				break;

			case RPS_PROTOCOL.SEND_USERS:
				for (var i = 1; i < data.length; i += 2)
				{
					bc.clients[data[i]] =
					{
						id: data[i],
						name: data[i + 1]
					};
					console.log(clients[data[i]]);
				}
				break;

			case RPS_PROTOCOL.USER_LEFT:
				var disconnectedUser = bc.clients[data[1]];
				bc.addSystemMessage(disconnectedUser.name + " has disconnected.");

				break;

			case RPS_PROTOCOL.CHAT_MESSAGE:
				var msgID = data[1];
				var msgClient = bc.clients[msgID];
				bc.addChatMessage(msgClient.name,  data[2]);

				break;
			
			case RPS_PROTOCOL.DRAW_CARD:
				this.game.addTableCard(message[0], message[1], message[2], message[3]);
				break;
		}

	};

	connection.onclose = function ()
	{
		bc.addChatError("Connection to the server closed");
	};
};

BattleRPSClient.prototype.addSystemMessage = function(message)
{
	this.chatTicker.prepend('<span class="system-message">' + message + '</span>');
	this.chatTicker.scrollTop(this.chatTicker.prop("scrollHeight"));
};

BattleRPSClient.prototype.addChatMessage = function(user, message)
{
	this.chatTicker.prepend('<span class="chat-message">' + user + ': ' + message + '</span>');
	this.chatTicker.scrollTop(this.chatTicker.prop("scrollHeight"));
};

BattleRPSClient.prototype.addChatError = function(errorMessage)
{
	this.chatTicker.prepend('<span class="chat-error">ERROR: ' + errorMessage + '</span>');
	this.chatTicker.scrollTop = this.chatTicker.scrollHeight;
};

BattleRPSClient.prototype.initiateConnect = function(tn)
{
	this.tempName = tn;

	var conn = new WebSocket('ws://127.0.0.1:1339');

	this.addSystemMessage("CONNECTING");
	this.setupConnection(conn);
	this.connection = conn;
};

BattleRPSClient.prototype.sendJoin = function(userName)
{
	var data = [RPS_PROTOCOL.INIT_JOIN, userName];
	this.connection.send(JSON.stringify(data));
	dLog("SEND", "JOIN");
};

BattleRPSClient.prototype.sendMessage = function(message)
{
	var data = [RPS_PROTOCOL.CHAT_MESSAGE, message];
	this.connection.send(JSON.stringify(data));
	dLog("SEND", "CHAT" + message);
};

BattleRPSClient.prototype.sendDrawCard = function(value)
{
	var data = [RPS_PROTOCOL.DRAW_CARD, value];
	this.connection.send(JSON.stringify(data));
	dLog("SEND", "DRAW:" + value);
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
