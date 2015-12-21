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

	this.initiateConnect(Math.random().toString(36).slice(2));

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
		/*if (rawData.type != "binary")
		{
			dLog("Invalid message");
			return;
		}*/
		dLog("received message size: " + rawData.data.byteLength);
		var data = new Uint8Array(rawData.data);
		var dataView = new DataView(rawData.data);
		var protoID = data[0];
		dLog("protocol: " + protoID);

		var namewView, clientID, cardID, xx, yy;
		switch (protoID)
		{
			case RPS_PROTOCOL.NEW_USER:
				var newID = data[1];
				var nameView = data.slice(2, data.length);
				var newName = ab2str(nameView);
				bc.gameClient.addPlayer(newID, newName);
				var newClient = {
					id:newID,
					name:newName
				};
				bc.clients[newID] = newClient;
				dLog("New Client ID: " + newClient.id + " name: " + newClient.name);
				bc.addSystemMessage(newClient.name + " has connected.");
				break;

			case RPS_PROTOCOL.ASSIGN_ID:
				newID = data[1];
				bc.client = {id: newID};
				//bc.clients[newID] = bc.client;
				bc.chatInput.val("");
				bc.chatInput.attr("placeholder", "");
				bc.chatInput.prop("disabled", false);
				bc.connected = true;
				bc.addSystemMessage("CONNECTED");
				dLog("Assigned ID: " + newID);
				break;

			case RPS_PROTOCOL.SEND_USERS:
				
				var userNum = dataView.getUint16(1);
				var byteOffset = 3;

				for (var i = 0; i < userNum; i ++)
				{
					var nameLength = data[byteOffset + 1];
					nameView = data.slice(byteOffset + 2, byteOffset + 2 + nameLength);
					var name = ab2str(nameView);
					var userId = data[byteOffset];
					bc.clients[userId] =
					{
						id: userId,
						name: name
					};
					byteOffset += 2 + nameLength;
				}
				break;

			case RPS_PROTOCOL.USER_LEFT:
				var disconnectedID = data[1];
				var disconnectedUser = bc.clients[disconnectedID];
				bc.addSystemMessage(disconnectedUser.name + " has disconnected.");
				delete bc.clients[disconnectedID];
				break;

			case RPS_PROTOCOL.CHAT_MESSAGE:
				var msgID = data[1];
				var msgClient = bc.clients[msgID];
				var msgView = data.slice(2);
				var msg = ab2str(msgView);
				bc.addChatMessage(msgClient.name, msg);

				break;
			
			case RPS_PROTOCOL.DRAW_CARD:
				cardID = data[1];
				var cardValue = data[2];
				xx = dataView.getUint16(3);
				yy = dataView.getUint16(5);
				bc.gameClient.addTableCard(cardID, cardValue, xx, yy);
				
				break;

			case RPS_PROTOCOL.COMPLETE_DRAG_CARD:
				cardID = data[1];
				xx = dataView.getUint16(2);
				yy = dataView.getUint16(4);
				console.log(xx, yy);
				bc.gameClient.completeDragTableCard(cardID, xx, yy);
				break;
			
			case RPS_PROTOCOL.ENEMY_DRAW_CARD:
				clientID = data[1];
				cardID = data[2];
				xx = dataView.getUint16(3);
				yy = dataView.getUint16(5);
				bc.gameClient.addEnemyTableCard(clientID, cardID, xx, yy);
				break;
			
			case RPS_PROTOCOL.ENEMY_START_DRAG_CARD:
				clientID = data[1];
				cardID = data[2];
				bc.gameClient.startDragEnemyTableCard(clientID, cardID);
				break;
			
			case RPS_PROTOCOL.ENEMY_UPDATE_DRAG_CARD:
				clientID = data[1];
				cardID = data[2];
				xx = dataView.getUint16(3);
				yy = dataView.getUint16(5);
				bc.gameClient.updateDragEnemyTableCard(clientID, cardID, xx, yy);
				break;
			
			case RPS_PROTOCOL.ENEMY_COMPLETE_DRAG_CARD:
				clientID = data[1];
				cardID = data[2];
				xx = dataView.getUint16(3);
				yy = dataView.getUint16(5);
				console.log(xx, yy);
				bc.gameClient.completeDragEnemyTableCard(clientID, cardID, xx, yy);
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
	var sendView = new Uint8Array(2);
	sendView[0] = RPS_PROTOCOL.DRAW_CARD;
	sendView[1] = value;
	this.connection.send(sendView);
	dLog("SEND", "DRAW:" + value);
};

BattleRPSClient.prototype.sendStartDragCard = function(cardID)
{
	if (!this.connected)
		return;
	var sendView = new Uint8Array(2);
	sendView[0] = RPS_PROTOCOL.START_DRAG_CARD;
	sendView[1] = cardID;
	this.connection.send(sendView);
	dLog("SEND", "Start Drag id:" + cardID);
};

BattleRPSClient.prototype.sendUpdateDragCard = function(cardID, x, y)
{
	if (!this.connected)
		return;
	var arrayBuffer = new ArrayBuffer(6);
	var dataView = new DataView(arrayBuffer);
	dataView.setUint8(0, RPS_PROTOCOL.UPDATE_DRAG_CARD);
	dataView.setUint8(1, cardID);
	dataView.setUint16(2, x);
	dataView.setUint16(4, y);
	
	this.connection.send(arrayBuffer);
	dLog("SEND", "update drag id:" + cardID + " x: " + x + " y: " + y);
};

BattleRPSClient.prototype.sendCompleteDragCard = function(cardID, x, y)
{
		if (!this.connected)
		return;
	var arrayBuffer = new ArrayBuffer(6);
	var dataView = new DataView(arrayBuffer);
	dataView.setUint8(0, RPS_PROTOCOL.COMPLETE_DRAG_CARD);
	dataView.setUint8(1, cardID);
	dataView.setUint16(2, x);
	dataView.setUint16(4, y);

	this.connection.send(arrayBuffer);
	dLog("SEND", "Complete Drag" + cardID + " x: " + x + " y: " + y);
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
