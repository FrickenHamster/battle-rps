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

	connection.onmessage = function (rawData)
	{
		console.log(rawData);
		/*if (rawData.type != "binary")
		{
			dLog("Invalid message");
			return;
		}*/
		dLog("received message size: " + rawData.data.byteLength);
		var data = new Uint8Array(rawData.data);
		var protoID = data[0];
		dLog("protocol: " + protoID);
		switch (protoID)
		{
			case RPS_PROTOCOL.NEW_USER:
				console.log("received id" + data[1]);
				var newID = data[1];
				var nameView = data.slice(2, data.length);
				var newName = ab2str(nameView);
				bc.gameClient.addPlayer(newID, newName);
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
				var byteOffset = 1;
				for (var i = 1; i < data.length; i += 2)
				{
					var nameLength = data[byteOffset + 1];
					bc.clients[data[i]] =
					{
						id: data[byteOffset],
						name: data[i + 1]
					};
					console.log(bc.clients[data[i]]);
				}
				break;

			case RPS_PROTOCOL.USER_LEFT:
				var disconnectedUser = bc.clients[data[1]];
				bc.addSystemMessage(disconnectedUser.name + " has disconnected.");

				break;

			case RPS_PROTOCOL.CHAT_MESSAGE:
				var msgID = data[1];
				var msgClient = bc.clients[msgID];
				var msgView = data.slice(2);
				console.log("mv" + msgView);
				var msg = ab2str(msgView);
				bc.addChatMessage(msgClient.name, msg);

				break;
			
			case RPS_PROTOCOL.DRAW_CARD:
				bc.gameClient.addTableCard(data[1], data[2], data[3], data[4]);
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
	conn.binaryType = "arraybuffer";

	this.addSystemMessage("CONNECTING");
	this.setupConnection(conn);
	this.connection = conn;
};

BattleRPSClient.prototype.sendJoin = function(userName)
{
	var protoView = new Uint8Array(1);
	protoView[0] = RPS_PROTOCOL.INIT_JOIN;
	
	var userNameView = str2ab(userName);
	var sendArray = new Uint8Array(userNameView.byteLength + 1);
	sendArray.set(protoView);
	sendArray.set(userNameView, 1);
	this.connection.send(sendArray);
	dLog("SEND", "JOIN");
};

BattleRPSClient.prototype.sendMessage = function(message)
{
	if (!this.connected)
		return;
	var protoView = new Uint8Array(1);
	protoView[0] = RPS_PROTOCOL.CHAT_MESSAGE;

	var messageView = str2ab(message);
	var sendArray = new Uint8Array(messageView.byteLength + 1);
	sendArray.set(protoView);
	sendArray.set(messageView, 1);
	this.connection.send(sendArray);
	dLog("SEND", "CHAT" + message);
};

BattleRPSClient.prototype.sendDrawCard = function(value)
{
	if (!this.connected)
		return;
	var data = [RPS_PROTOCOL.DRAW_CARD, value];
	this.connection.send(JSON.stringify(data));
	dLog("SEND", "DRAW:" + value);
};

BattleRPSClient.prototype.sendStartDragCard = function(id)
{
	if (!this.connected)
		return;
	var data = [RPS_PROTOCOL.START_DRAG_CARD, id];
	this.connection.send(JSON.stringify(data));
	dLog("SEND", "Start Drag id:" + id);
};

BattleRPSClient.prototype.sendUpdateDragCard = function(id, x, y)
{
	if (!this.connected)
		return;
	var data = [RPS_PROTOCOL.UPDATE_DRAG_CARD, id, x, y];
	this.connection.send(JSON.stringify(data));
	dLog("SEND", "update drag id:" + id + " x: " + x + " y: " + y);
};

BattleRPSClient.prototype.sendCompleteDragCard = function(id, x, y)
{
	if (!this.connected)
		return;
	var data = [RPS_PROTOCOL.COMPLETE_DRAG_CARD, id];
	this.connection.send(JSON.stringify(data));
	dLog("SEND", "Complete Drag" + id + " x: " + x + " y: " + y);
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

function ab2str(buf) {
	return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function str2ab(str) {
	var buf = new ArrayBuffer(str.length); // 2 bytes for each char
	var bufView = new Uint8Array(buf);
	for (var i=0, strLen=str.length; i<strLen; i++) {
		bufView[i] = str.charCodeAt(i);
	}
	return bufView;
}
