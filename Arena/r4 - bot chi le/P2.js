

if(true)
{
    console.log = function(){};
}



// 
// // ====================================================================================
// BOT CAMPER BY HUA THI LE
// ====================================================================================


// ====================================================================================
//                                  HOW TO RUN THIS
// ====================================================================================
// Call:
// "node Client.js -h [host] -p [port] -k [key] -l [logFilename]"
//
// If no argument given, it'll be 127.0.0.1:3011
// key is a secret string that authenticate the bot identity
// it is not required when testing
// ====================================================================================



// ====================================================================================
//       THE CONSTANT. YOU'RE GONNA NEED THIS. MARK THIS FOR LATER REFERENCE
// ====================================================================================
var STATE_WAITING_FOR_PLAYERS = 0;
var STATE_TANK_PLACEMENT = 1;
var STATE_ACTION = 2;
var STATE_SUDDEN_DEATH = 3;
var STATE_FINISHED = 4;

var TEAM_1 = 1;
var TEAM_2 = 2;

var MAP_W = 22;
var MAP_H = 22;

var BLOCK_GROUND = 0;
var BLOCK_WATER = 1;
var BLOCK_HARD_OBSTACLE = 2;
var BLOCK_SOFT_OBSTACLE = 3;
var BLOCK_BASE = 4;

var TANK_LIGHT = 1;
var TANK_MEDIUM = 2;
var TANK_HEAVY = 3;

var DIRECTION_NONE = 0;
var DIRECTION_UP = 1;
var DIRECTION_RIGHT = 2;
var DIRECTION_DOWN = 3;
var DIRECTION_LEFT = 4;

var NUMBER_OF_TANK = 4;

var BASE_MAIN = 1;
var BASE_SIDE = 2;


var MATCH_RESULT_NOT_FINISH = 0;
var MATCH_RESULT_TEAM_1_WIN = 1;
var MATCH_RESULT_TEAM_2_WIN = 2;
var MATCH_RESULT_DRAW = 3;
var MATCH_RESULT_BAD_DRAW = 4;

var POWERUP_AIRSTRIKE = 1;
var POWERUP_EMP = 2;

//object sizes
var TANK_SIZE = 1;
var BASE_SIZE = 2;

var BULLET_SPEED_LIGHT = 1;
var BULLET_SPEED_MEDIUM = 1;
var BULLET_SPEED_HEAVY = 0.8;

// ====================================================================================
//                        BEHIND THE SCENE. YOU CAN SAFELY SKIP THIS
//                  Note: Don't try to modify this. It can ruin your life.
// ====================================================================================

// =============================================
// Get the host and port from argurment
// =============================================

// Logger
var Logger;
try {
	Logger = require("./NodeWS/Logger");
}
catch (e) {
	Logger = require("./../NodeWS/Logger");
}
var logger = new Logger();

var host = "127.0.0.1";
var port = 3011;
var key = 0;

for (var i=0; i<process.argv.length; i++) {
	if (process.argv[i] == "-h") {
		host = process.argv[i + 1];
	}
	else if (process.argv[i] == "-p") {
		port = process.argv[i + 1];
	}
	else if (process.argv[i] == "-k") {
		key = process.argv[i + 1];
	}
	else if (process.argv[i] == "-l") {
		logger.startLogfile(process.argv[i + 1]);
	}
}
if (host == null) host = "127.0.0.1";
if (port == null) port = 3011;
if (key == null) key = 0;

// =============================================
// Some helping function
// =============================================
var EncodeInt8 = function (number) {
	var arr = new Int8Array(1);
	arr[0] = number;
	return String.fromCharCode(arr[0]);
};
var EncodeInt16 = function (number) {
	var arr = new Int16Array(1);
	var char = new Int8Array(arr.buffer);
	arr[0] = number;
	return String.fromCharCode(char[0], char[1]);
};
var EncodeUInt8 = function (number) {
	var arr = new Uint8Array(1);
	arr[0] = number;
	return String.fromCharCode(arr[0]);
};
var EncodeUInt16 = function (number) {
	var arr = new Uint16Array(1);
	var char = new Uint8Array(arr.buffer);
	arr[0] = number;
	return String.fromCharCode(char[0], char[1]);
};
var EncodeFloat32 = function (number) {
	var arr  = new Float32Array(1);
	var char = new Uint8Array(arr.buffer);
	
	arr[0] = number;
	return String.fromCharCode(char[0], char[1], char[2], char[3]);
};
var DecodeInt8 = function (string, offset) {
	var arr  = new Int8Array(1);
	var char = new Int8Array(arr.buffer);
	arr[0] = string.charCodeAt(offset);
	return char[0];
};
var DecodeInt16 = function (string, offset) {
	var arr  = new Int16Array(1);
	var char = new Int8Array(arr.buffer);
	
	for (var i=0; i<2; ++i) {
		char[i] = string.charCodeAt(offset + i);
	}
	return arr[0];
};
var DecodeUInt8 = function (string, offset) {
	return string.charCodeAt(offset);
};
var DecodeUInt16 = function (string, offset) {
	var arr  = new Uint16Array(1);
	var char = new Uint8Array(arr.buffer);
	
	for (var i=0; i<2; ++i) {
		char[i] = string.charCodeAt(offset + i);
	}
	return arr[0];
};
var DecodeFloat32 = function (string, offset) {
	var arr  = new Float32Array(1);
	var char = new Uint8Array(arr.buffer);
	
	for (var i=0; i<4; ++i) {
		char[i] = string.charCodeAt(offset + i);
	}
	return arr[0];
};

// =============================================
// Game objects
// =============================================
function Obstacle() {
	this.m_id = 0;
	this.m_x = 0;
	this.m_y = 0;
	this.m_HP = 0;
	this.m_destructible = true;
}
function Base () {
	this.m_id = 0;
	this.m_team = 0;
	this.m_type = 0;
	this.m_HP = 0;
	this.m_x = 0;
	this.m_y = 0;
}
function Tank() {
	this.m_id = 0;
	this.m_x = 0;
	this.m_y = 0;
	this.m_team = TEAM_1;
	this.m_type = TANK_LIGHT;
	this.m_HP = 0;
	this.m_direction = DIRECTION_UP;
	this.m_speed = 0;
	this.m_rateOfFire = 0;
	this.m_coolDown = 0;
	this.m_damage = 0;
	this.m_disabled = 0;
}
function Bullet() {
	this.m_id = 0;
	this.m_x = 0;
	this.m_y = 0;
	this.m_team = TEAM_1;
	this.m_type = TANK_MEDIUM;
	this.m_direction = DIRECTION_UP;
	this.m_speed = 0;
	this.m_damage = 0;
	this.m_live = false;
}
function Strike() {
	this.m_id = 0;
	this.m_x = 0;
	this.m_y = 0;
	this.m_team = TEAM_1;
	this.m_type = POWERUP_AIRSTRIKE;
	this.m_countDown = 0;
	this.m_live = false;
}
function PowerUp() {
	this.m_id = 0;
	this.m_active = 0;
	this.m_type = 0;
	this.m_x = 0;
	this.m_y = 0;
}
var g_team = -1;
var g_state = STATE_WAITING_FOR_PLAYERS;
var g_map = new Array();
var g_obstacles = new Array();
var g_hardObstacles = new Array();
var g_tanks = new Array();
	g_tanks[TEAM_1] = new Array();
	g_tanks[TEAM_2] = new Array();
var g_bullets = new Array();
	g_bullets[TEAM_1] = new Array();
	g_bullets[TEAM_2] = new Array();
var g_bases = new Array();
	g_bases[TEAM_1] = new Array();
	g_bases[TEAM_2] = new Array();
var g_powerUps = new Array();
var g_strikes = new Array();
	g_strikes[TEAM_1] = new Array();
	g_strikes[TEAM_2] = new Array();
	
var g_matchResult;
var g_inventory = new Array();
	g_inventory[TEAM_1] = new Array();
	g_inventory[TEAM_2] = new Array();

var g_timeLeft = 0;

// =============================================
// Protocol - Sending and updating
// =============================================
var WebSocket;
try {
	WebSocket = require("./NodeWS");
}
catch (e) {
	WebSocket = require("./../NodeWS");
}

var SOCKET_IDLE = 0;
var SOCKET_CONNECTING = 1;
var SOCKET_CONNECTED = 2;

var COMMAND_PING = 0;
var COMMAND_SEND_KEY = 1;
var COMMAND_SEND_TEAM = 2;
var COMMAND_UPDATE_STATE = 3;
var COMMAND_UPDATE_MAP = 4;
var COMMAND_UPDATE_TANK = 5;
var COMMAND_UPDATE_BULLET = 6;
var COMMAND_UPDATE_OBSTACLE = 7;
var COMMAND_UPDATE_BASE = 8;
var COMMAND_REQUEST_CONTROL = 9;
var COMMAND_CONTROL_PLACE = 10;
var COMMAND_CONTROL_UPDATE = 11;
var COMMAND_UPDATE_POWERUP = 12;
var COMMAND_MATCH_RESULT = 13;
var COMMAND_UPDATE_INVENTORY = 14;
var COMMAND_UPDATE_TIME = 15;
var COMMAND_CONTROL_USE_POWERUP = 16;
var COMMAND_UPDATE_STRIKE = 17;


var socket = null;
var socketStatus = SOCKET_IDLE;


socket = WebSocket.connect ("ws://" + host + ":" + port, [], function () {
	logger.print ("Socket connected");
	socketStatus = SOCKET_CONNECTED;
	SendKey();
});
socket.on("error", function (code, reason) {
	socketStatus = SOCKET_IDLE;
	logger.print ("Socket error: " + code);
});
socket.on("text", function (data) {
	OnMessage (data);
});
socketStatus = SOCKET_CONNECTING;


function Send(data) {
	//console.log ("Socket send: " + PacketToString(data));
	socket.sendText (data);
}
function OnMessage(data) {
	// console.log ("Data received: " + PacketToString(data));
	
	var readOffset = 0;
	
	while (true) {
		var command = DecodeUInt8 (data, readOffset); 
		readOffset++;
		
		if (command == COMMAND_SEND_TEAM) {
			g_team = DecodeUInt8 (data, readOffset); readOffset ++;
		}
		else if (command == COMMAND_UPDATE_STATE) {
			state = DecodeUInt8 (data, readOffset);
			readOffset++;
			
			if (g_state == STATE_WAITING_FOR_PLAYERS && state == STATE_TANK_PLACEMENT) {
				g_state = state;
				setTimeout(OnPlaceTankRequest, 100);
			}
		}
		else if (command == COMMAND_UPDATE_MAP) {
			g_hardObstacles = new Array();
			for (var i=0; i<MAP_W; i++) {
				for (var j=0; j<MAP_H; j++) {
					g_map[j * MAP_W + i] = DecodeUInt8 (data, readOffset);
					readOffset += 1;
					
					if (g_map[j * MAP_W + i] == BLOCK_HARD_OBSTACLE) {
						var temp = new Obstacle();
						temp.m_id = -1;
						temp.m_x = i;
						temp.m_y = j;
						temp.m_HP = 9999;
						temp.m_destructible = false;
						g_hardObstacles.push (temp);
					}
				}
			}
		}
		else if (command == COMMAND_UPDATE_TIME) {
			g_timeLeft = DecodeInt16 (data, readOffset); readOffset += 2;
		}
		else if (command == COMMAND_UPDATE_OBSTACLE) {
			readOffset += ProcessUpdateObstacleCommand(data, readOffset);
		}
		else if (command == COMMAND_UPDATE_TANK) {
			readOffset += ProcessUpdateTankCommand(data, readOffset);
		}
		else if (command == COMMAND_UPDATE_BULLET) {
			readOffset += ProcessUpdateBulletCommand(data, readOffset);
		}
		else if (command == COMMAND_UPDATE_BASE) {
			readOffset += ProcessUpdateBaseCommand(data, readOffset);
		}
		else if (command == COMMAND_MATCH_RESULT) {
			readOffset += ProcessMatchResultCommand(data, readOffset);
		}
		else if (command == COMMAND_UPDATE_POWERUP) {
			readOffset += ProcessUpdatePowerUpCommand(data, readOffset);
		}
		else if (command == COMMAND_UPDATE_STRIKE) {
			readOffset += ProcessUpdateStrikeCommand(data, readOffset);
		}
		else if (command == COMMAND_UPDATE_INVENTORY) {
			readOffset += ProcessUpdateInventoryCommand(data, readOffset);
		}
		else if (command == COMMAND_REQUEST_CONTROL) {
			Update();
		}		
		else {
			readOffset ++;
			logger.print ("Invalid command id: " + command)
		}
		
		if (readOffset >= data.length) {
			break;
		}
	}
}
function SendKey() {
	if (socketStatus == SOCKET_CONNECTED) {
		var packet = "";
		packet += EncodeUInt8(COMMAND_SEND_KEY);
		packet += EncodeInt8(key);
		Send (packet);
	}
}



function ProcessUpdateObstacleCommand (data, originalOffset) {
	var offset = originalOffset;
	var id = DecodeUInt8 (data, offset); offset++;
	var x = DecodeUInt8 (data, offset); offset++;
	var y = DecodeUInt8 (data, offset); offset++;
	var HP = DecodeUInt8 (data, offset); offset++;
	
	if (g_obstacles[id] == null) {
		g_obstacles[id] = new Obstacle();
	}
	g_obstacles[id].m_id = id;
	g_obstacles[id].m_x = x;
	g_obstacles[id].m_y = y;
	g_obstacles[id].m_HP = HP;
	
	if (g_obstacles[id].m_HP <= 0) {
		g_map[y * MAP_W + x] = BLOCK_GROUND;
	}
	
	return offset - originalOffset;
}

function ProcessUpdateTankCommand (data, originalOffset) {
	var offset = originalOffset;
	var id = DecodeUInt8 (data, offset); offset++;
	var team = DecodeUInt8 (data, offset); offset++;
	var type = DecodeUInt8 (data, offset); offset++;
	var HP = DecodeUInt16 (data, offset); offset+=2;
	var dir = DecodeUInt8 (data, offset); offset++;
	var speed = DecodeFloat32 (data, offset); offset+=4;
	var ROF = DecodeUInt8 (data, offset); offset++;
	var cooldown = DecodeUInt8 (data, offset); offset++;
	var damage = DecodeUInt8 (data, offset); offset++;
	var disabled = DecodeUInt8 (data, offset); offset++;
	var x = DecodeFloat32 (data, offset); offset+=4;
	var y = DecodeFloat32 (data, offset); offset+=4;
	
	if (g_tanks[team][id] == null) {
		g_tanks[team][id] = new Tank();
	}
	g_tanks[team][id].m_id = id;
	g_tanks[team][id].m_team = team;
	g_tanks[team][id].m_type = type;
	g_tanks[team][id].m_HP = HP;
	g_tanks[team][id].m_direction = dir;
	g_tanks[team][id].m_speed = speed;
	g_tanks[team][id].m_rateOfFire = ROF;
	g_tanks[team][id].m_coolDown = cooldown;
	g_tanks[team][id].m_damage = damage;
	g_tanks[team][id].m_disabled = disabled;
	g_tanks[team][id].m_x = x;
	g_tanks[team][id].m_y = y;
	
	return offset - originalOffset;
}
function ProcessUpdateBulletCommand (data, originalOffset) {
	var offset = originalOffset;
	var id = DecodeUInt8 (data, offset); offset++;
	var live = DecodeUInt8 (data, offset); offset++;
	var team = DecodeUInt8 (data, offset); offset++;
	var type = DecodeUInt8 (data, offset); offset++;
	var dir = DecodeUInt8 (data, offset); offset++;
	var speed = DecodeFloat32 (data, offset); offset+=4;
	var damage = DecodeUInt8 (data, offset); offset++;
	var hit = DecodeUInt8 (data, offset); offset++; // not used 
	var x = DecodeFloat32 (data, offset); offset+=4;
	var y = DecodeFloat32 (data, offset); offset+=4;
	
	if (g_bullets[team][id] == null) {
		g_bullets[team][id] = new Bullet();
	}
	g_bullets[team][id].m_id = id;
	g_bullets[team][id].m_live = live;
	g_bullets[team][id].m_team = team;
	g_bullets[team][id].m_type = type;
	g_bullets[team][id].m_direction = dir;
	g_bullets[team][id].m_speed = speed;
	g_bullets[team][id].m_damage = damage;
	g_bullets[team][id].m_x = x;
	g_bullets[team][id].m_y = y;
	
	return offset - originalOffset;
}

function ProcessUpdatePowerUpCommand (data, originalOffset) {
	var offset = originalOffset;
	var id = DecodeUInt8 (data, offset); offset++;
	var active = DecodeUInt8 (data, offset); offset++;
	var type = DecodeUInt8 (data, offset); offset++;
	var x = DecodeFloat32 (data, offset); offset+=4;
	var y = DecodeFloat32 (data, offset); offset+=4;
	
	if (g_powerUps[id] == null) {
		g_powerUps[id] = new PowerUp();
	}
	g_powerUps[id].m_id = id;
	g_powerUps[id].m_active = active;
	g_powerUps[id].m_type = type;
	g_powerUps[id].m_x = x;
	g_powerUps[id].m_y = y;
	
	return offset - originalOffset;	
}

function ProcessUpdateBaseCommand (data, originalOffset) {
	var offset = originalOffset;
	var id = DecodeUInt8 (data, offset); offset++;
	var team = DecodeUInt8 (data, offset); offset++;
	var type = DecodeUInt8 (data, offset); offset++;
	var HP = DecodeUInt16 (data, offset); offset+=2;
	var x = DecodeFloat32 (data, offset); offset+=4;
	var y = DecodeFloat32 (data, offset); offset+=4;
	
	if (g_bases[team][id] == null) {
		g_bases[team][id] = new Base();
	}
	g_bases[team][id].m_id = id;
	g_bases[team][id].m_team = team;
	g_bases[team][id].m_type = type;
	g_bases[team][id].m_HP = HP;
	g_bases[team][id].m_x = x;
	g_bases[team][id].m_y = y;
	console.log("g_bases team: " + team + ", id: " + id + ", type: " + type);
	
	return offset - originalOffset;
}

function ProcessUpdateInventoryCommand (data, originalOffset) {
	g_inventory[TEAM_1] = new Array();
	g_inventory[TEAM_2] = new Array();

	var offset = originalOffset;
	var number1 = DecodeUInt8 (data, offset); offset++;
	for (var i=0; i<number1; i++) {
		g_inventory[TEAM_1][i] = DecodeUInt8 (data, offset); offset++;
	}
	var number2 = DecodeUInt8 (data, offset); offset++;
	for (var i=0; i<number2; i++) {
		g_inventory[TEAM_2][i] = DecodeUInt8 (data, offset); offset++;
	}
	
	return offset - originalOffset;
}

function ProcessUpdateStrikeCommand(data, originalOffset) {
	var offset = originalOffset;
	var id = DecodeUInt8 (data, offset); 		offset++;
	var team = DecodeUInt8 (data, offset); 		offset++;
	var type = DecodeUInt8 (data, offset); 		offset++;
	var live = DecodeUInt8 (data, offset); 		offset++;
	var countDown = DecodeUInt8 (data, offset);	offset++;
	var x = DecodeFloat32 (data, offset); 		offset+=4;
	var y = DecodeFloat32 (data, offset); 		offset+=4;
	
	if (g_strikes[team][id] == null) {
		g_strikes[team][id] = new Strike();
	}
	g_strikes[team][id].m_id = id;
	g_strikes[team][id].m_live = live;
	g_strikes[team][id].m_team = team;
	g_strikes[team][id].m_type = type;
	g_strikes[team][id].m_countDown = countDown;
	g_strikes[team][id].m_x = x;
	g_strikes[team][id].m_y = y;
	
	return offset - originalOffset;
}

function ProcessMatchResultCommand(data, originalOffset) {
	var offset = originalOffset;
	g_matchResult = DecodeUInt8 (data, offset); offset++;
	g_state = STATE_FINISHED; //update state for safety, server should also send a msg update state
	
	return offset - originalOffset;
}

// An object to hold the command, waiting for process
function ClientCommand() {
	var g_direction = 0;
	var g_move = false;
	var g_shoot = false;
	var g_dirty = false;
}
var clientCommands = new Array();
for (var i=0; i<NUMBER_OF_TANK; i++) {
	clientCommands.push (new ClientCommand());
}

// Pending command as a string.
var g_commandToBeSent = "";

//////////////////////////////////////////////////////////////////////////////////////
//                                                                                  //
//                                    GAME RULES                                    //
//                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////
// - The game is played on a map of 20x20 blocks where [x,y] is referred as the     //
// block at column x and row y.                                                     //
// - Each team has 1 main base, 2 side bases and 4 tanks.                           //
// - At the beginning of a game, each player will choose 4 tanks and place them     //
// on the map (not on any bases/obstacles/tanks).                                   //
// - The game is played in real-time mode. Each player will control 4 tanks in      //
// order to defend their bases and at the same time, try to destroy their enemy�s   //
// bases.                                                                           //
// -Your tank bullets or cannon shells will pass other allied tank (not friendly    //
// fire), but will damage your own bases, so watch where you firing.                //
// -A destroyed tank will allow bullet to pass through it, but still not allow      //
// other tanks to pass through.                                                     //
// - When the game starts (and after each 30 seconds) , a random power-up will be   //
// spawn at 1 of 3 bridges (if there are still space) at location:                  //
// [10.5, 1.5], [10.5, 10.5], [10.5, 19.5].                                         //
// - Power-ups are friendly-fired and have area of effect (AOE) damage. All units   //
// near the struck location will be affected. Use them wisely.                      //
// - The game is over when:                                                         //
//   + The main base of 1 team is destroyed. The other team is the winner.          //
//   + If all tanks of a team are destroyed, the other team is the winner.          //
//   + After 120 seconds, if both main bases are not destroyed, the team with more  //
//   side bases remaining is the winner.                                            //
//   + If both team have the same bases remaining, the game will change to �Sudden  //
//   Death� mode. In Sudden Death mode:                                             //
//     * 2 teams will play for extra 30 seconds.                                    //
//     * All destructible obstacles are removed.                                    //
//     * If 1 team can destroy any base, they are the winner.                       //
//     * After Sudden Death mode is over, the team has more tanks remaining is the  //
//     winner.                                                                      //
//   + The time is over. If it�s an active game (i.e. Some tanks and/or bases are   // 
//   destroyed), the result is a DRAW. If nothing is destroyed, it�s a BAD_DRAW.    //
//                                                                                  //
// Please read the detailed rule on our web site at:                                //
//   http://han-ai-contest2016.gameloft.com                                         //
//////////////////////////////////////////////////////////////////////////////////////

// ====================================================================================
//                                       NOTE:
// ====================================================================================
// Do not modify the code above, you won't be able to 'hack',
// all data sent to server is double checked there.
// Further more, if you cause any damage to the server or
// wrong match result, you'll be disqualified right away.
//
// 
//
// That's pretty much about it. Now, let's start coding.
// ====================================================================================

// ===========================================================
//	le.huathi - my vars
// ===========================================================

//status of a position, return by function CheckNextPosStatus
var POS_SAFE 		= 0;
var POS_UNAVAIL 	= 1;
var POS_UNSAFE 		= 2;

//collision types
var COLLISION_TANK 		= 0;
var COLLISION_BASE		= 1;
var COLLISION_HARD_OBS	= 2;
var COLLISION_SOFT_OBS	= 3;

var g_danger_1 = [
	2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
	2, 7, 6, 6, 6, 6, 6, 6, 6, 5, 5, 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 2,
	2, 7, 0, 0, 0, 6, 6, 5, 5, 5, 5, 5, 5, 3, 3, 2, 2, 0, 0, 0, 2, 2,
	2, 7, 0, 0, 0, 6, 6, 5, 5, 5, 0, 0, 3, 3, 3, 2, 2, 0, 0, 0, 2, 2,
	2, 7, 0, 0, 0, 6, 6, 5, 5, 5, 0, 0, 3, 3, 3, 2, 2, 0, 0, 0, 2, 2,
	2, 8, 7, 7, 7, 6, 6, 5, 5, 5, 0, 0, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2,
	2, 8, 7, 7, 7, 7, 6, 6, 5, 5, 0, 0, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2,
	2, 8, 8, 8, 8, 7, 7, 6, 5, 5, 0, 0, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2,
	2, 8, 8, 8, 8, 8, 8, 0, 5, 5, 0, 0, 3, 3, 0, 1, 1, 1, 1, 1, 1, 2,
	2, 9, 9, 9, 8, 8, 8, 0, 5, 5, 4, 4, 4, 3, 0, 1, 1, 1, 1, 1, 1, 2,
	2, 0, 0, 9, 8, 8, 8, 0, 5, 5, 4, 4, 4, 3, 0, 1, 1, 1, 1, 0, 0, 2,
	2, 0, 0, 9, 8, 8, 8, 0, 5, 5, 4, 4, 4, 3, 0, 1, 1, 1, 1, 0, 0, 2,
	2, 9, 9, 9, 8, 8, 8, 0, 5, 5, 4, 4, 4, 3, 0, 1, 1, 1, 1, 1, 1, 2,
	2, 8, 8, 8, 8, 8, 8, 0, 5, 5, 0, 0, 3, 3, 0, 1, 1, 1, 1, 1, 1, 2,
	2, 8, 8, 8, 8, 7, 7, 6, 5, 5, 0, 0, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2,
	2, 8, 7, 7, 7, 7, 6, 6, 5, 5, 0, 0, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2,
	2, 8, 7, 7, 7, 6, 6, 5, 5, 5, 0, 0, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2,
	2, 7, 0, 0, 0, 6, 6, 5, 5, 5, 0, 0, 3, 3, 3, 2, 2, 0, 0, 0, 2, 2,
	2, 7, 0, 0, 0, 6, 6, 5, 5, 5, 0, 0, 3, 3, 3, 2, 2, 0, 0, 0, 2, 2,
	2, 7, 0, 0, 0, 6, 6, 5, 5, 5, 5, 5, 5, 3, 3, 2, 2, 0, 0, 0, 2, 2,
	2, 7, 6, 6, 6, 6, 6, 6, 6, 5, 5, 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 2,
	2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2
];

var g_danger_2 = [
	2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
	2, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 7, 2,
	2, 2, 0, 0, 0, 2, 2, 3, 3, 5, 5, 5, 5, 5, 5, 6, 6, 0, 0, 0, 7, 2,
	2, 2, 0, 0, 0, 2, 2, 3, 3, 3, 0, 0, 5, 5, 5, 6, 6, 0, 0, 0, 7, 2,
	2, 2, 0, 0, 0, 2, 2, 3, 3, 3, 0, 0, 5, 5, 5, 6, 6, 0, 0, 0, 7, 2,
	2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 0, 0, 5, 5, 5, 6, 6, 7, 7, 7, 8, 2,
	2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 0, 0, 5, 5, 6, 6, 7, 7, 7, 7, 8, 2,
	2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 0, 0, 5, 5, 6, 7, 7, 7, 8, 8, 8, 2,
	2, 1, 1, 1, 1, 1, 1, 0, 3, 3, 0, 0, 5, 5, 0, 8, 8, 8, 8, 8, 8, 2,
	2, 1, 1, 1, 1, 1, 1, 0, 3, 4, 4, 4, 5, 5, 0, 8, 8, 8, 9, 9, 9, 2,
	2, 0, 0, 1, 1, 1, 1, 0, 3, 4, 4, 4, 5, 5, 0, 8, 8, 8, 9, 0, 0, 2,
	2, 0, 0, 1, 1, 1, 1, 0, 3, 4, 4, 4, 5, 5, 0, 8, 8, 8, 9, 0, 0, 2,
	2, 1, 1, 1, 1, 1, 1, 0, 3, 4, 4, 4, 5, 5, 0, 8, 8, 8, 9, 9, 9, 2,
	2, 1, 1, 1, 1, 1, 1, 0, 3, 3, 0, 0, 5, 5, 0, 8, 8, 8, 8, 8, 8, 2,
	2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 0, 0, 5, 5, 6, 7, 7, 7, 8, 8, 8, 2,
	2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 0, 0, 5, 5, 6, 6, 7, 7, 7, 7, 8, 2,
	2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 0, 0, 5, 5, 5, 6, 6, 7, 7, 7, 8, 2,
	2, 2, 0, 0, 0, 2, 2, 3, 3, 3, 0, 0, 5, 5, 5, 6, 6, 0, 0, 0, 7, 2,
	2, 2, 0, 0, 0, 2, 2, 3, 3, 3, 0, 0, 5, 5, 5, 6, 6, 0, 0, 0, 7, 2,
	2, 2, 0, 0, 0, 2, 2, 3, 3, 5, 5, 5, 5, 5, 5, 6, 6, 0, 0, 0, 7, 2,
	2, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 7, 2,
	2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2
];

var SUPPORT_DISTANCE 		= 4;
var TARGET_TANK_DISTANCE 	= 12;
var ENEMY_DANGER_DISTANCE 	= 12;
var POWERUP_DISTANCE 		= 16;
var BASE_DISTANCE 			= 20;

var ASTAR_DISTANCE 			= 10; //threshold for limiting A* calculation, don't use A* for distance that beyond this
var ASTAR_HALF_DISTANCE		= ASTAR_DISTANCE * 0.5;
var ASTAR_STEP_LIMIT		= 500;

var DANGER_RATIO_POS		= 1.0;
var DANGER_RATIO_TANK		= 2.0;
var DANGER_RATIO_SUPPORT	= 2.0;
var DANGER_THRESHOLD		= 4.0;
var DANGER_DOUBLE_THRESHOLD	= 6.0;
var DANGER_TRIPLE_THRESHOLD	= 8.0;

var TARGET_TANK				= 0;
var TARGET_BASE				= 1;
var TARGET_POWERUP			= 2;
var TARGET_MOVING			= 3; //moving to center point

var BASE_VAL_MAIN_BONUS		= 4;
var BASE_VAL_DIRECT_BONUS	= 3;
var BASE_VAL_PATH_RATIO		= 0.8;

var TANK_FIGHT_DISTANCE		= 4; //distance to fighting with opponent's tank

function Position (x, y) 
{
	this.x = x;
	this.y = y;
}

function BulletCollision(bullet, objectType, object, posX, posY) 
{
	this.bullet = bullet;
	this.objectType = objectType;
	this.object = object;
	this.x = posX;
	this.y = posY;
}

function TankTarget(type, object, posX, posY)
{
	this.type = type;
	this.object = object;
	this.x = posX;
	this.y = posY;
	this.dir2Target = DIRECTION_NONE;
	this.canShoot = false;
}

function BaseShootingPos(pos, value)
{
	this.pos = pos;
	this.value = value;
}

//for A* path finding
function PathNode(parentNode, pos, targetPos, cost)
{
	this.parent = parentNode;
	this.root = (parentNode != null)?parentNode.root:this;
	this.pos = new Position(pos.x, pos.y);
	if(parentNode != null)
		this.g = parentNode.g + cost;
	else //root node
		this.g = cost;
	this.h = Math.abs(this.pos.x - targetPos.x) + Math.abs(this.pos.y - targetPos.y);
	this.f = this.g + this.h;
}

//game parameters that need calculate at initialize
var arrShootBasePos = new Array();	//good positions to shoot enemy bases

var arrDanger = []; 		//array of DangerBullet that I need to avoid
var g_opponent = 0;
var arrOppDanger = [0.0, 0.0, 0.0, 0.0];
var arrAssigned = [];
var arrExpectPos = [];		//expected Position for the tanks (4 item for 4 tanks)
var arrShootDir = [];		//shoot direction assigned to my tanks
var nextMovingDirection = [];
var nextExpectDirection = [];
var nextTargetDirection = [];
var arrTargets = [];		//target for each tank (array of TankTarget)
var arrOldTargets = [];		//targets in previous frame(array of TankTarget)
var arrCanShoot = [];		//should shoot or not
var arrNextPosRecheck = [];	//next pos is not safe but can shoot oppTank, need recheck
var arrPos2Recheck = [];	//next positions to recheck (array of Position)
var arrDir2Recheck = [];	//next directions to recheck

//cache for next frames
var arrNotAvoiding = [];	//the tanks that decided to not avoid bullet (until enemy die or I die)
var arrAvoidPosition = [];	//the position to avoid bullet
var arrNotSafePos = [];		//the not-safe (expected) positions

// ====================================================================================
// COMMAND FUNCTIONS: THESE ARE FUNCTIONS THAT HELP YOU TO CONTROL YOUR LITTLE ARMY
// ====================================================================================

// You call this function inside OnPlaceTankRequest() 4 times, to pick and place your tank.
// First param is the tank you want to use: TANK_LIGHT, TANK_MEDIUM or TANK_HEAVY.
// Then the coordinate you want to place. Must be integer.
function PlaceTank(type, x, y) {
	g_commandToBeSent += EncodeUInt8(COMMAND_CONTROL_PLACE);
	g_commandToBeSent += EncodeUInt8(type);
	g_commandToBeSent += EncodeUInt8(x >> 0);
	g_commandToBeSent += EncodeUInt8(y >> 0);
}

// You call this function inside Update(). This function will help you control your tank.
// - First parameter is the id of your tank (0 to 3), in your creation order when you placed your tank
// - Second parameter is the direction you want to turn your tank into. I can be DIRECTION_UP, DIRECTION_LEFT, DIRECTION_DOWN or DIRECTION_RIGHT.
// If you leave this param null, the tank will keep on its current direction.
// - Third parameter: True / False, whether to move your tank forward, or stay till.
// - Fourth parameter: True / False, whether to use your tank's main cannon. aka. Pew pew pew! Careful about the cooldown though.
function CommandTank (id, turn, move, shoot) {
	// Save to a list of command, and send later
	// This is to prevent player to send duplicate command.
	// Duplicate command will overwrite the previous one.
	// We just send one.
	// Turn can be null, it won't change a tank direction.
	if (turn != null) {
		clientCommands[id].m_direction = turn;
	}
	else {
		clientCommands[id].m_direction = g_tanks[g_team][id].m_direction;
	}
	
	console.log("CommandTank, id: " + id + ", turn: " + turn + ", move: " + move + ", shoot: " + shoot);
	
	clientCommands[id].m_move = move;
	clientCommands[id].m_shoot = shoot;
	clientCommands[id].m_dirty = true;
}


// You call this function to use the Airstrike powerup on a position
// Param is coordination. Can be float or integer.
// WARNING: ALL POWERUP ARE FRIENDLY-FIRE ENABLED.
// YOUR TANK OR YOUR BASE CAN BE HARM IF IT'S INSIDE THE AOE OF THE STRIKE
function UseAirstrike(x, y) {
	if (HasAirstrike()) {
		g_commandToBeSent += EncodeUInt8(COMMAND_CONTROL_USE_POWERUP);
		g_commandToBeSent += EncodeUInt8(POWERUP_AIRSTRIKE);
		g_commandToBeSent += EncodeFloat32(x);
		g_commandToBeSent += EncodeFloat32(y);
	}
}
// Same as above, but EMP instead of Airstrike.
function UseEMP(x, y) {
	if (HasEMP()) {
		g_commandToBeSent += EncodeUInt8(COMMAND_CONTROL_USE_POWERUP);
		g_commandToBeSent += EncodeUInt8(POWERUP_EMP);
		g_commandToBeSent += EncodeFloat32(x);
		g_commandToBeSent += EncodeFloat32(y);
	}
}

// This function is called at the end of the function Update or OnPlaceTankRequest.
// I've already called it for you, don't delete it.
function SendCommand () {
	// Send all pending command
	for (var i=0; i<NUMBER_OF_TANK; i++) {
		if (clientCommands[i].m_dirty == true) {
			g_commandToBeSent += EncodeUInt8(COMMAND_CONTROL_UPDATE);
			g_commandToBeSent += EncodeUInt8(i);
			g_commandToBeSent += EncodeUInt8(clientCommands[i].m_direction);
			g_commandToBeSent += EncodeUInt8(clientCommands[i].m_move);
			g_commandToBeSent += EncodeUInt8(clientCommands[i].m_shoot);
			
			clientCommands.m_dirty = false;
		}
	}
	Send (g_commandToBeSent);
	g_commandToBeSent = "";
}

// ====================================================================================
// HELPING FUNCTIONS: THESE ARE FUNCTIONS THAT HELP YOU RETRIEVE GAME VARIABLES
// ====================================================================================
function GetTileAt(x, y) {
	// This function return landscape type of the tile block on the map
	// It'll return the following value:
	// BLOCK_GROUND
	// BLOCK_WATER
	// BLOCK_HARD_OBSTACLE
	// BLOCK_SOFT_OBSTACLE
	// BLOCK_BASE
	
	return g_map[y * MAP_W + x];
}
function GetObstacleList() {
	// Return the obstacle list, both destructible, and the non destructible
	// This does not return water type tile.
	var list = [];
	for (var i=0; i<g_obstacles.length; i++) {
		list.push (g_obstacles);
	}
	for (var i=0; i<g_hardObstacles.length; i++) {
		list.push (g_hardObstacles);
	}
	return list;
}
function GetMyTeam() {
	// This function return your current team.
	// It can be either TEAM_1 or TEAM_2
	// Obviously, your opponent is the other team.
	return g_team;
}

function GetOpponentTeam() {
	if(g_team == TEAM_1)
		return TEAM_2;
	else
		return TEAM_1;
}

function GetMyTank(id) {
	// Return your tank, just give the id.
	return g_tanks[g_team][id];
}

function GetEnemyTank(id) {
	// Return enemy tank, just give the id.
	return g_tanks[(TEAM_1 + TEAM_2) - g_team][id];
}

function GetPowerUpList() {
	// Return active powerup list
	var powerUp = [];
	for (var i=0; i<g_powerUps.length; i++) {
		if (g_powerUps[i].m_active) {
			powerUp.push (g_powerUps[i]);
		}
	}
	
	return powerUp;
}

function HasAirstrike() {
	// Call this function to see if you have airstrike powerup.
	for (var i=0; i<g_inventory[g_team].length; i++) {
		if (g_inventory[g_team][i] == POWERUP_AIRSTRIKE) {
			return true;
		}
	}
	return false;
}

function HasEMP() {
	// Call this function to see if you have EMP powerup.
	for (var i=0; i<g_inventory[g_team].length; i++) {
		if (g_inventory[g_team][i] == POWERUP_EMP) {
			return true;
		}
	}
	return false;
}

function GetIncomingStrike() {
	var incoming = [];
	
	for (var i=0; i<g_strikes[TEAM_1].length; i++) {
		if (g_strikes[TEAM_1][i].m_live) {
			incoming.push (g_strikes[TEAM_1][i]);
		}
	}
	for (var i=0; i<g_strikes[TEAM_2].length; i++) {
		if (g_strikes[TEAM_2][i].m_live) {
			incoming.push (g_strikes[TEAM_2][i]);
		}
	}
	
	return incoming;
}

function GetMyAttackDir() {
	if(GetMyTeam() == TEAM_1)
		return DIRECTION_RIGHT;
	else
		return DIRECTION_LEFT;
}

function IsPosInMySide(x) {
	if(GetMyTeam() == TEAM_1)
		return (x < MAP_W >> 1);
	else
		return (x > MAP_W >> 1);
}

function GetOppositeDir(direction)
{
	return (direction > 2)?(direction - 2):(direction + 2);
}

function IsOccupyBlock(object_mx, object_my, object_size, block_mx, block_my)
{
	//check this function accurate, minus 0.005 for float calculation :(
	//1 here is tank size
	if((Math.abs(object_mx - block_mx) < (object_size + 1) * 0.5 - 0.01) && (Math.abs(object_my - block_my) < (object_size + 1) * 0.5 - 0.01))
		return true;
	else
		return false;
}

function FindNextCell(direction, cellX, cellY, step)
{
	var nextX, nextY;
	if(direction == DIRECTION_UP)
	{
		nextX = cellX;
		nextY = cellY - step;
	}
	else if(direction == DIRECTION_DOWN)
	{
		nextX = cellX;
		nextY = cellY + step;
	}
	else if(direction == DIRECTION_LEFT)
	{
		nextX = cellX - step;
		nextY = cellY;
	}
	else if(direction == DIRECTION_RIGHT)
	{
		nextX = cellX + step;
		nextY = cellY;
	}
	else
	{
		nextX = cellX;
		nextY = cellY;
	}
	return (new Position(nextX, nextY));
}

function FindNextPosition(direction, tank)
{
	var nextX, nextY;
	if(direction == DIRECTION_UP)
	{
		nextX = tank.m_x;
		nextY = tank.m_y - tank.m_speed;
	}
	else if(direction == DIRECTION_DOWN)
	{
		nextX = tank.m_x;
		nextY = tank.m_y + tank.m_speed;
	}
	else if(direction == DIRECTION_LEFT)
	{
		nextX = tank.m_x - tank.m_speed;
		nextY = tank.m_y;
	}
	else if(direction == DIRECTION_RIGHT)
	{
		nextX = tank.m_x + tank.m_speed;
		nextY = tank.m_y;
	}
	else
	{
		nextX = tank.m_x;
		nextY = tank.m_y;
	}
	return (new Position(nextX, nextY));
}

function IsDirectionAvailable(direction, myTankId)
{
	var me = g_tanks[g_team][myTankId];
	var nextPos = FindNextPosition(direction, me);
	return IsPositionAvailable(nextPos, myTankId);
}

function IsPositionAvailable(nextPos, myTankId, ignoreOppIdx)
{
	if (typeof(ignoreOppIdx)==='undefined') ignoreOppIdx = -1;
	
	//console.log("IsPositionAvailable, nextPos (" + nextPos.x + "," + nextPos.y + "), ignoreOppIdx: " + ignoreOppIdx);
	
	//I hate javascript!!! :((
	// if (nextPos.x % 1 < 0.05) nextPos.x = (nextPos.x >> 0);
	// if (nextPos.x % 1 > 0.95) nextPos.x = (nextPos.x >> 0) + 1;
	// if (nextPos.y % 1 < 0.05) nextPos.y = (nextPos.y >> 0);
	// if (nextPos.y % 1 > 0.95) nextPos.y = (nextPos.y >> 0) + 1;
	
	//check tiles
	var roundedX = nextPos.x >> 0;
	var roundedY = nextPos.y >> 0;
	
	//correct the round number :((
	if (nextPos.x % 1 > 0.95) 
		roundedX++;
	if (nextPos.y % 1 > 0.95)
		roundedY++;
		
	var squareNeedToCheckX = new Array();
	var squareNeedToCheckY = new Array();
	
	// Find the square the tank occupy (even part of)
	var diffX = (Math.abs(nextPos.x - roundedX) < 0.001)?false:true;
	var diffY = (Math.abs(nextPos.y - roundedY) < 0.001)?false:true;
	if (!diffX && !diffY) {
		squareNeedToCheckX.push (roundedX); squareNeedToCheckY.push (roundedY);
	}
	else if (diffX && !diffY) {
		squareNeedToCheckX.push (roundedX); squareNeedToCheckY.push (roundedY);
		squareNeedToCheckX.push (roundedX+1); squareNeedToCheckY.push (roundedY);
	}
	else if (!diffX && diffY) {
		squareNeedToCheckX.push (roundedX); squareNeedToCheckY.push (roundedY);
		squareNeedToCheckX.push (roundedX); squareNeedToCheckY.push (roundedY+1);
	}
	else if (diffX && diffY) {
		squareNeedToCheckX.push (roundedX); squareNeedToCheckY.push (roundedY);
		squareNeedToCheckX.push (roundedX+1); squareNeedToCheckY.push (roundedY);
		squareNeedToCheckX.push (roundedX); squareNeedToCheckY.push (roundedY+1);
		squareNeedToCheckX.push (roundedX+1); squareNeedToCheckY.push (roundedY+1);
	}
	// Check if that square is invalid
	for (var i=0; i<squareNeedToCheckX.length; i++) {
		var x = squareNeedToCheckX[i];
		var y = squareNeedToCheckY[i];
		if (g_map[y * MAP_W + x] != BLOCK_GROUND) 
		{
			//console.log("return false here, not BLOCK_GROUND: (" + x + "," + y + ")");
			return false;
		}
	}
		
	//check tanks
	for (var i=0; i<NUMBER_OF_TANK; i++)
	{
		if(i != myTankId) //don't check myself
		{
			var tank = g_tanks[g_team][i];
			if(IsOccupyBlock(tank.m_x, tank.m_y, TANK_SIZE, nextPos.x, nextPos.y))
			{
				//console.log("return false here, my team tank occupy , i: " + i);
				return false;
			}
		}
	}
	
	for (var i=0; i<NUMBER_OF_TANK; i++)
	{
		if(i != ignoreOppIdx)
		{
			var tank = g_tanks[g_opponent][i];
			if(IsOccupyBlock(tank.m_x, tank.m_y, TANK_SIZE, nextPos.x, nextPos.y))
			{
				// console.log("return false here, opponent tank occupy , i: " + i);
				return false;
			}
		}
	}
	
	//check bases
	var base_count = g_bases[g_team].length;
	for(var i=0; i < base_count; i++)
	{
		var base = g_bases[g_team][i];
		if(IsOccupyBlock(base.m_x, base.m_y, BASE_SIZE, nextPos.x, nextPos.y))
			return false;
			
		var baseOpp = g_bases[g_opponent][i];
		if(IsOccupyBlock(baseOpp.m_x, baseOpp.m_y, BASE_SIZE, nextPos.x, nextPos.y))
			return false;
	}
	
	return true;
}

function BubbleSortAStar(arrayNodes)
{
	//bubble sort, least first
	var swapped = false;
	var len = arrayNodes.length;
	do
	{
		swapped = false;
		for(var i = 1; i < len; i++)
		{
			if(arrayNodes[i-1].f > arrayNodes[i].f)
			{
				var tmp = arrayNodes[i-1];
				arrayNodes[i-1] = arrayNodes[i];
				arrayNodes[i] = tmp;
				swapped = true;
			}
		}
	}
	while(swapped);
}

//A* path finding
//posX, posY: current position of a tank
//targetPos: a position of a cell (int value)
//return TBD
function GetAStarPath(posX, posY, targetPos, myTankId, oppIdx)
{
	if (typeof(oppIdx)==='undefined') oppIdx = -1;
	
	//Note: don't round the pos, make step by tank's m_speed
	var curX = posX;
	var curY = posY;
	console.log("GetAStarPath, curPos: (" + curX + "," + curY + ") - target: (" + targetPos.x + "," + targetPos.y + ") - tankIdx: " + myTankId + " - oppIdx: " + oppIdx);
	//add 4 direction for root node
	var curNode = null;
	var direction;
	var arrNodes = new Array();
	var arrChecked = new Array();
	var node;
	
	var tank = g_tanks[g_team][myTankId];
	
	// if position not rounded -> add all neibourgh cells to arrNodes
	// var squareNeedToCheckX = new Array();
	// var squareNeedToCheckY = new Array();
	
	// Find the square the tank occupy (even part of)
	// if (posX == curX && posY == curY) {
		// // don't add current pos!!!
		// // squareNeedToCheckX.push (curX); squareNeedToCheckY.push (curY);
	// }
	// else if (posX != curX && posY == curY) {
		// squareNeedToCheckX.push (curX); squareNeedToCheckY.push (curY);
		// squareNeedToCheckX.push (curX+1); squareNeedToCheckY.push (curY);
	// }
	// else if (posX == curX && posY != curY) {
		// squareNeedToCheckX.push (curX); squareNeedToCheckY.push (curY);
		// squareNeedToCheckX.push (curX); squareNeedToCheckY.push (curY+1);
	// }
	// else {
		// squareNeedToCheckX.push (curX); squareNeedToCheckY.push (curY);
		// squareNeedToCheckX.push (curX+1); squareNeedToCheckY.push (curY);
		// squareNeedToCheckX.push (curX); squareNeedToCheckY.push (curY+1);
		// squareNeedToCheckX.push (curX+1); squareNeedToCheckY.push (curY+1);
	// }
	// Check if that square is invalid & add 2 arrNodes
	// for (var i=0; i<squareNeedToCheckX.length; i++) {
		// var x = squareNeedToCheckX[i];
		// var y = squareNeedToCheckY[i];
		// if (g_map[y * MAP_W + x] == BLOCK_GROUND) 
		// {
			// console.log("GetAStarPath add initial node: (" + x + "," + y + ")");
			// var dist = Math.abs(posX - x) + Math.abs(posY - y);
			// node = new PathNode(curNode, new Position(x,y), targetPos, dist);
			// arrNodes.push(node);
		// }
	// }
	
	// //initial step
	// if(arrNodes.length > 0)
	// {
		// BubbleSortAStar(arrNodes);
		// curNode = arrNodes[0];
		// arrNodes.splice(0, 1); //remove the first node from array
		// curX = curNode.pos.x;
		// curY = curNode.pos.y;
	// }
	
	var stepCount = 0;
	
	while(true)
	{
		for(direction = DIRECTION_UP; direction <= DIRECTION_LEFT; direction++)
		{
			var nextPos = FindNextCell(direction, curX, curY, tank.m_speed);
			
			//check if is target -> hurray, got it!
			if((Math.abs(nextPos.x - targetPos.x) < 0.1) && (Math.abs(nextPos.y - targetPos.y) < 0.1))
			{
				//return the PathNode at targetPos
				console.log("GetAStarPath return success!");
				return new PathNode(curNode, nextPos, targetPos, tank.m_speed);
			}
			
			//check if already in checked array
			var checked = false;
			for(var i = arrChecked.length - 1; i >= 0; i--)
			{
				if((Math.abs(nextPos.x - arrChecked[i].x) < 0.01) && (Math.abs(nextPos.y - arrChecked[i].y) < 0.01))
				{
					checked = true;
					break;
				}
			}
			if(checked)
				continue;
				
			//check if pos exist in arrNodes
			checked = false;
			for(var i = arrNodes.length - 1; i >= 0; i--)
			{
				if((Math.abs(nextPos.x - arrNodes[i].pos.x) < 0.01) && (Math.abs(nextPos.y - arrNodes[i].pos.y) < 0.01))
				{
					checked = true;
					break;
				}
			}
			if(checked)
				continue;
			
			//check if position available
			if(IsPositionAvailable(nextPos, myTankId, oppIdx))
			{
				node = new PathNode(curNode, nextPos, targetPos, tank.m_speed);
				arrNodes.push(node);
				//console.log("add node: (" + nextPos.x + "," + nextPos.y + "), f: " + node.f + ", arrNodes length: " + arrNodes.length);
			}
			// else
			// {
				// console.log("pos not available: (" + nextPos.x + "," + nextPos.y + "), dir: " + direction);
			// }
		}
		arrChecked.push(new Position(curX, curY));
		
		stepCount++;
		if(stepCount > ASTAR_STEP_LIMIT)
		{
			console.log("GetAStarPath return null! Beyond ASTAR_STEP_LIMIT.");
			return null;
		}
			
		if(arrNodes.length > 0)
		{
			BubbleSortAStar(arrNodes);
			curNode = arrNodes[0];
			arrNodes.splice(0, 1); //remove the first node from array
			curX = curNode.pos.x;
			curY = curNode.pos.y;
			//console.log("cur node: (" + curX + "," + curY + "), f: " + curNode.f);
		}
		else //worst case, cannot go anywhere else
		{
			console.log("GetAStarPath return null!");
			return null;
		}
	}
}

function UpdateNotSafePosition()
{
	for(var tankIdx = 0; tankIdx < NUMBER_OF_TANK; tankIdx++)
	{
		var tank = g_tanks[g_team][tankIdx];
		if(tank.m_HP == 0)
			continue;
		var len = arrNotSafePos[tankIdx].length;
		for(var i = len - 1; i >= 0; i--)
		{
			var pos = arrNotSafePos[tankIdx][i];
			if(!IsPositionAvailable(pos, tankIdx))
				continue;
			if(FindBulletCome2Pos(pos.x, pos.y, tank.m_speed, tankIdx, false) != null)
				continue;
				
			//else, remove this pos from arrNotSafePos
			arrNotSafePos[tankIdx].splice(i, 1);
		}
	}
}

//check if a tank can go by a direction
function CheckNextPosStatus(direction, myTankId)
{
	var me = g_tanks[g_team][myTankId];
	var nextPos = FindNextPosition(direction, me);
	
	if(!IsPositionAvailable(nextPos, myTankId))
		return POS_UNAVAIL;
		
	console.log("CheckNextPosStatus, direction: " + direction + ", myTankId: " + myTankId + " (" + me.m_x + "," + me.m_y + "), nextPos: (" + nextPos.x + "," + nextPos.y + ")");
	
	//check if position safe
	var danger = FindBulletCome2Pos(nextPos.x, nextPos.y, me.m_speed, myTankId, false);
	if(danger != null)
		return POS_UNSAFE;
	
	return POS_SAFE;
}

function DangerBullet(index, distance, hasObstacle)
{
	this.idx = index;
	this.distance = distance;
	this.isHard = hasObstacle;
}

//return a BulletColision object if has collision or null if not
function CheckBulletCollision(bulletX, bulletY, needCheckTank, bullet)
{
	if(needCheckTank)
	{
		//TODO - do we need to also check collision for g_team?
		for (var i=0; i<g_tanks[g_opponent].length; i++) {
			var tempTank = g_tanks[g_opponent][i];
			if (tempTank.m_HP > 0) {
				if (Math.abs(bulletX - tempTank.m_x) <= 0.5 && Math.abs(bulletY - tempTank.m_y) <= 0.5) {
					return new BulletCollision(bullet, COLLISION_TANK, tempTank, bulletX, bulletY);
				}
			}
		}
	}
	
	// Check landscape
	var checkX = 1;
	var checkY = 1;
	var roundedX = (bulletX + 0.499) >> 0;
	var roundedY = (bulletY + 0.499) >> 0;
	//console.log("CheckBulletCollision, roundedX: " + roundedX + ", roundedY: " + roundedY);
	
	if (bulletX % 1 > 0.49999 && bulletX % 1 < 0.50001) {
		checkX = 2;
	}
	if (bulletY % 1 > 0.49999 && bulletY % 1 < 0.50001) {
		checkY = 2;
	}
	
	for (var i=0; i<checkX; i++) {
		for (var j=0; j<checkY; j++) {
			var tempX = roundedX + i;
			var tempY = roundedY + j;
			
			if(g_map[tempY * MAP_W + tempX] == BLOCK_BASE) 
			{
				console.log("Collision BLOCK_BASE, bullet: (" + bulletX + "," + bulletY + ")");
				//TODO - let the BASE object of BulletCollision == null for now
				return new BulletCollision(bullet, COLLISION_BASE, null, bulletX, bulletY);
			}
			else if (g_map[tempY * MAP_W + tempX] == BLOCK_HARD_OBSTACLE)
			{
				console.log("Collision BLOCK_HARD_OBSTACLE, bullet: (" + bulletX + "," + bulletY + ")");
				//TODO - let the HARD_OBSTACLE object of BulletCollision == null for now
				return new BulletCollision(bullet, COLLISION_HARD_OBS, null, bulletX, bulletY);
			}
			else if (g_map[tempY * MAP_W + tempX] == BLOCK_SOFT_OBSTACLE)
			{
				console.log("Collision BLOCK_SOFT_OBSTACLE, bullet: (" + bulletX + "," + bulletY + ")");
				//TODO - let the SOFT_OBSTACLE object of BulletCollision == null for now
				return new BulletCollision(bullet, COLLISION_SOFT_OBS, null, bulletX, bulletY);
			}
		}
	}
	
	return null;
}

function CanGoStraight2Pos(curX, curY, targetX, targetY, myTankId)
{
	if(Math.abs(curX - targetX) <= 0.5)
	{
		//check & return soon
		var y;
		if(curY < targetY)
		{
			y = curY + 1;
			if(y >= targetY)
				return true;
		}
		else
		{
			y = curY - 1;
			if(y <= targetY)
				return true;
		}
		while(true)
		{
			if(!IsPositionAvailable(new Position(curX, y), myTankId))
				return false;
			if(curY < targetY)
			{
				y++;
				if(y >= targetY)
					return true;
			}
			else
			{
				y--;
				if(y <= targetY)
					return true;
			}
		}
	}
	else if(Math.abs(curY - targetY) <= 0.5)
	{
		//check & return soon
		var x;
		if(curX < targetX)
		{
			x = curX + 1;
			if(x >= targetX)
				return true;
		}
		else
		{
			x = curX - 1;
			if(x <= targetX)
				return true;
		}
		while(true)
		{
			if(!IsPositionAvailable(new Position(x, curY), myTankId))
				return false;
			if(curX < targetX)
			{
				x++;
				if(x >= targetX)
					return true;
			}
			else
			{
				x--;
				if(x <= targetX)
					return true;
			}
		}
	}
	return false; //never go here
}

function CheckBulletRoad(bullet, maxDistance, needCheckTank)
{
	//console.log("CheckBulletRoad, (" + bullet.m_x + "," + bullet.m_y + "), m_speed: " + bullet.m_speed + ", direction:" + bullet.m_direction);
	var dist = 0;
	var bulletX = bullet.m_x;
	var bulletY = bullet.m_y;
	while(dist <= maxDistance)
	{
		//check collision
		//console.log("check collision, (" + bulletX + "," + bulletY + "), direction: " + bullet.m_direction);
		var collision = CheckBulletCollision(bulletX, bulletY, needCheckTank, bullet);
		if(collision != null)
		{
			return collision;
		}
		
		//calc next frame
		if(bullet.m_direction == DIRECTION_DOWN)
			bulletY += bullet.m_speed;
		else if(bullet.m_direction == DIRECTION_UP)
			bulletY -= bullet.m_speed;
		else if(bullet.m_direction == DIRECTION_LEFT)
			bulletX -= bullet.m_speed;
		else if(bullet.m_direction == DIRECTION_RIGHT)
			bulletX += bullet.m_speed;
		else
			console.log("WHY HERE?????");
		dist += bullet.m_speed;
	}
	return null;
}

//check if any bullet comming to a pos & can hurt my tank
//isCurFrame = true if calc for current frame, = false if calc for next frame
//return DangerBullet object or null
function FindBulletCome2Pos(x, y, mySpeed, myTankIdx, isCurFrame)
{
	var arrDanger = new Array(); //array of bullet indices that I need to avoid
	var len = g_bullets[g_opponent].length;
	for (var t=0; t < len; t++) 
	{
		var bullet = g_bullets[g_opponent][t];
		if(!bullet.m_live)
			continue;
		
		//console.log("Bullet " + t + ", position: (" + bullet.m_x + "," + bullet.m_y + ")" + "; round position: (" + (bullet.m_x >> 0) + "," + (bullet.m_y >> 0) + ")");
		//check if this bullet comming to my pos
		var come2me = false;
		var distance = 0;
		var bulletX = bullet.m_x;
		var bulletY = bullet.m_y;
		
		//check if calc for next frame -> calc bullet's position for next frame
		if(!isCurFrame)
		{
			if(bullet.m_direction == DIRECTION_DOWN)
				bulletY += bullet.m_speed;
			else if(bullet.m_direction == DIRECTION_UP)
				bulletY -= bullet.m_speed;
			else if(bullet.m_direction == DIRECTION_LEFT)
				bulletX -= bullet.m_speed;
			else if(bullet.m_direction == DIRECTION_RIGHT)
				bulletX += bullet.m_speed;
			else
				console.log("WHY HERE?????");
			//console.log("Bullet " + t + ", next position: (" + bulletX + "," + bulletY + "), direction: " + bullet.m_direction);
		}
		
		var offset = (isCurFrame)?0:(bullet.m_speed + 0.51);
		
		//if (Math.abs(this.m_x - tempTank.m_x) <= 0.5 && Math.abs(this.m_y - tempTank.m_y) <= 0.5)
		if((Math.abs(bulletX - x) <= 0.55) && (bullet.m_direction % 2 == 1))
		{
			if(((bulletY <= y + offset) && (bullet.m_direction == DIRECTION_DOWN))
				||((bulletY >= y - offset) && (bullet.m_direction == DIRECTION_UP)))
			{
				//correct the distance
				if(bullet.m_direction == DIRECTION_DOWN)
					distance = (bulletY < y)?(y - bulletY):0;
				else
					distance = (bulletY > y)?(bulletY - y):0;
				//distance = Math.abs(bulletY - y);
				//check if there's obstacle between bullet and me, if not -> it's coming to me!
				if(CheckBulletRoad(bullet, distance, false) == null)
					come2me = true;
			}
		}
		else if((Math.abs(bulletY - y) <= 0.55) && (bullet.m_direction % 2 == 0))
		{
			if(((bulletX <= x + offset) && (bullet.m_direction == DIRECTION_RIGHT))
				||((bulletX >= x - offset) && (bullet.m_direction == DIRECTION_LEFT)))
			{
				//correct the distance
				if(bullet.m_direction == DIRECTION_RIGHT)
					distance = (bulletX < x)?(x - bulletX):0;
				else
					distance = (bulletX > x)?(bulletX - x):0;
				//distance = Math.abs(bulletX - x);
				//check if there's obstacle between bullet and me, if not -> it's coming to me!
				if(CheckBulletRoad(bullet, distance, false) == null)
					come2me = true;
			}
		}
		if(!come2me)
			continue;
			
		//console.log("Bullet coming to me!!! distance: " + distance + ", tankId: " + myTankIdx + ", bullet: (" + bullet.m_x + "," + bullet.m_y + ")");
			
		//check if I really need to avoid
		var dis2avoid = DIRECTION_NONE;
		var hasObstacle = false;
		//check if I has an obstacle when avoid this bullet
		if((bullet.m_direction == DIRECTION_DOWN) || (bullet.m_direction == DIRECTION_UP))
		{
			//if((GetTileAt(round_mx - 1, round_my) != BLOCK_GROUND) && (GetTileAt(round_mx + 1, round_my) != BLOCK_GROUND))
			if(!IsDirectionAvailable(DIRECTION_LEFT, myTankIdx) && !IsDirectionAvailable(DIRECTION_RIGHT, myTankIdx))
				hasObstacle = true;
		}
		else if((bullet.m_direction == DIRECTION_RIGHT) || (bullet.m_direction == DIRECTION_LEFT))
		{
			//if((GetTileAt(round_mx, round_my - 1) != BLOCK_GROUND) && (GetTileAt(round_mx, round_my + 1) != BLOCK_GROUND))
			if(!IsDirectionAvailable(DIRECTION_UP, myTankIdx) && !IsDirectionAvailable(DIRECTION_DOWN, myTankIdx))
				hasObstacle = true;
		}
		//normal, calc dis by m_speed
		if(!hasObstacle)
		{
			//console.log("Bullet speed: " + bullet.m_speed + ", tank speed: " + tempTank.m_speed);
			dis2avoid = bullet.m_speed / mySpeed + 0.5; //plus 0.5 for safety
		}
		else
		{
			dis2avoid = bullet.m_speed / mySpeed * 2 + 1; //plus 1 for safety buffer
		}
		
		//console.log("dis2avoid: " + dis2avoid + ", hasObstacle: " + hasObstacle);
			
		//consider if I need to avoid it
		if(distance <= dis2avoid)
		{
			arrDanger.push(new DangerBullet(t, distance, hasObstacle));
		}
	}
	
	//now check the arrDanger
	if(arrDanger.length == 0)
		return null;
	var minDistance = 9999;
	var minDangerIdx = -1;
	for(var i = 0; i < arrDanger.length; i++)
	{
		var danger = arrDanger[i];
		if(danger.isHard)
			return danger;
		if(danger.distance < minDistance)
		{
			minDistance = danger.distance;
			minDangerIdx = i;
		}
	}
	if(minDangerIdx > -1)
		return arrDanger[minDangerIdx];
	else
		return null;
}

//these code for get next direction for tanks
function CalcNextDirection()
{
	console.log("--------------- CalcNextDirection -------------------");
	//first, set to stay at my place
	nextMovingDirection = [0, 0, 0, 0];
	nextExpectDirection = [0, 0, 0, 0];
	arrNextPosRecheck = [false, false, false, false];
	
	for (var i=0; i<NUMBER_OF_TANK; i++) 
	{
		var tempTank = GetMyTank(i);
		if((tempTank == null) ||(tempTank.m_HP == 0))
			continue;
			
		//calc direction to expected position
		nextExpectDirection[i] = CalcDir2ExpectPos(tempTank, i, new Position(arrTargets[i].x, arrTargets[i].y));
	}
	
	//recheck the in-doubt tanks
	for (var i=0; i<NUMBER_OF_TANK; i++)
	{
		if(arrNextPosRecheck[i])
		{
			//check if there's another tank that in-doubt like me & have same target
			var sameTargetTankIdx = -1;
			for (var j=i+1; j<NUMBER_OF_TANK; j++)
			{
				if(arrNextPosRecheck[j] && (arrTargets[j].object == arrTargets[i].object))
				{
					sameTargetTankIdx = j;
					break;
				}
			}
			
			//if found -> go & shoot!
			if(sameTargetTankIdx != -1)
			{
				console.log("Go & Shoot! Tank: " + i + ", " + sameTargetTankIdx);
				nextExpectDirection[i] = arrDir2Recheck[i];
				nextExpectDirection[sameTargetTankIdx] = arrDir2Recheck[sameTargetTankIdx];
				arrNextPosRecheck[i] = false;
				arrNextPosRecheck[sameTargetTankIdx] = false;
				arrNotAvoiding[i] = true;
				arrNotAvoiding[sameTargetTankIdx] = true;
			}
			else //TODO - no, find other target? 
			{
                //hg: rem
                
				var tempTank = GetMyTank(i);
				if(FindOtherTankTarget(tempTank, i, false, false))
				{
					nextExpectDirection[i] = CalcDir2ExpectPos(tempTank, i, new Position(arrTargets[i].x, arrTargets[i].y));
				}
                
			}
		}
	}
	
	for (var i=0; i<NUMBER_OF_TANK; i++) 
	{
		var tempTank = GetMyTank(i);
		if((tempTank == null) ||(tempTank.m_HP == 0))
			continue;
			
		console.log("Tank " + i + " (" + tempTank.m_x + "," + tempTank.m_y + "), expectedDir: " + nextExpectDirection[i]);
		//calc direction to expected position
		//nextExpectDirection[i] = CalcDir2ExpectPos(tempTank, i, new Position(arrTargets[i].x, arrTargets[i].y));
		nextMovingDirection[i] = nextExpectDirection[i];
		
		//calculate for bullet avoiding
		if(!arrNotAvoiding[i])
		{	
			var round_mx = tempTank.m_x >> 0;
			var round_my = tempTank.m_y >> 0;
			
			//console.log("Tank " + i + " (" + tempTank.m_x + "," + tempTank.m_y + "), round position: (" + round_mx + "," + round_my + ")");
			
			//check if there is 1 bullet comming to my pos
			var danger = FindBulletCome2Pos(tempTank.m_x, tempTank.m_y, tempTank.m_speed, i, true);
			if(danger != null)
			{
				var bullet = g_bullets[g_opponent][danger.idx];
				console.log("Danger bullet, position: (" + bullet.m_x + "," + bullet.m_y + ")" + ", speed: " + bullet.m_speed + ", dir: " + bullet.m_direction);
				if(danger.isHard)
				{
					console.log("danger.isHard");
					if(IsDirectionAvailable(bullet.m_direction, i))
						nextMovingDirection[i] = bullet.m_direction; //TODO: need check further this point
					else
						nextMovingDirection[i] = GetOppositeDir(bullet.m_direction);
				}
				else
				{
					if((bullet.m_direction == DIRECTION_DOWN) || (bullet.m_direction == DIRECTION_UP))
					{
						var leftStatus = CheckNextPosStatus(DIRECTION_LEFT, i);
						var rightStatus = CheckNextPosStatus(DIRECTION_RIGHT, i);
						if(bullet.m_x < tempTank.m_x) //should turn right
						{
							console.log("should turn right");
							if((rightStatus == POS_SAFE)
								|| ((rightStatus == POS_UNSAFE) && (leftStatus != POS_SAFE)))
								nextMovingDirection[i] = DIRECTION_RIGHT;
							else if(leftStatus != POS_UNAVAIL)
								nextMovingDirection[i] = DIRECTION_LEFT;
						}
						else //should turn left
						{
							console.log("should turn left");
							if((leftStatus == POS_SAFE)
								|| ((leftStatus == POS_UNSAFE) && (rightStatus != POS_SAFE)))
								nextMovingDirection[i] = DIRECTION_LEFT;
							else if(rightStatus != POS_UNAVAIL)
								nextMovingDirection[i] = DIRECTION_RIGHT;
						}
					}
					else
					{
						var downStatus = CheckNextPosStatus(DIRECTION_DOWN, i);
						var upStatus = CheckNextPosStatus(DIRECTION_UP, i);
						console.log("downStatus: " + downStatus + ", upStatus: " + upStatus);
						if(bullet.m_y < tempTank.m_y) //should turn down
						{
							console.log("bullet.m_y < tempTank.m_y");
							if((downStatus == POS_SAFE)
								|| ((downStatus == POS_UNSAFE) && (upStatus != POS_SAFE)))
								nextMovingDirection[i] = DIRECTION_DOWN;
							else if(upStatus != POS_UNAVAIL)
								nextMovingDirection[i] = DIRECTION_UP;
						}
						else //should turn up
						{
							console.log("bullet.m_y >= tempTank.m_y");
							if((upStatus == POS_SAFE)
								|| ((upStatus == POS_UNSAFE) && (downStatus != POS_SAFE)))
								nextMovingDirection[i] = DIRECTION_UP;
							else if(downStatus != POS_UNAVAIL)
								nextMovingDirection[i] = DIRECTION_DOWN;
						}
					}
				}
				
				console.log("movingDir to avoid: " + nextMovingDirection[i]);
			}
		}
	}
	
	console.log("nextMovingDirection: " + nextMovingDirection[0] + ", " + nextMovingDirection[1] + ", " + nextMovingDirection[2] + ", " + nextMovingDirection[3]);
	console.log("nextExpectDirection: " + nextExpectDirection[0] + ", " + nextExpectDirection[1] + ", " + nextExpectDirection[2] + ", " + nextExpectDirection[3]);
	//console.log("targetDirection: " + arrTargets[0].dir2Target + ", " + arrTargets[1].dir2Target + ", " + arrTargets[2].dir2Target + ", " + arrTargets[3].dir2Target);
}

function CalcNextShoot()
{
	arrCanShoot = [false, false, false, false];
	for(var i = 0; i < NUMBER_OF_TANK; i++)
	{
		var temp = g_tanks[g_team][i];
		if(temp.m_HP == 0)
			continue;
		if(arrTargets[i] == null)
		{
			console.log("no target, tank: " + i);
			continue;
		}
		console.log("calc next shoot, tank: " + i + ", movingDir: " + nextMovingDirection[i] + ", targetDir: " + arrTargets[i].dir2Target);
		if(nextMovingDirection[i] != DIRECTION_NONE)
		{
			if(nextMovingDirection[i] == arrTargets[i].dir2Target)
				arrCanShoot[i] = true;
			else
				arrCanShoot[i] = false;
		}
		else
		{
			//
			arrCanShoot[i] = arrTargets[i].canShoot;
		}
	}
}

// ====================================================================================
// YOUR FUNCTIONS. YOU IMPLEMENT YOUR STUFF HERE.
// ====================================================================================
function SetExpectPositions() 
{
	if (GetMyTeam() == TEAM_1) {
		arrExpectPos.push(new Position(5, 1)); //border
		arrExpectPos.push(new Position(7, 7)); //center
		arrExpectPos.push(new Position(7, 14)); //center
		arrExpectPos.push(new Position(5, 20)); //border
	}
	else if (GetMyTeam() == TEAM_2) {
		arrExpectPos.push(new Position(16, 1)); //border
		arrExpectPos.push(new Position(14, 7)); //center
		arrExpectPos.push(new Position(14, 14)); //center
		arrExpectPos.push(new Position(16, 20)); //border
	}
}

//return number of tanks staying near a tank
function CountSupportTanks(team, tank, tankIdx)
{
	var count = 0;
	for(var i = 0; i < NUMBER_OF_TANK; i++)
	{
		if(i == tankIdx)
			continue;
		var temp = g_tanks[team][i];
		if(Math.abs(temp.m_x - tank.m_x) + Math.abs(temp.m_y - tank.m_y) <= SUPPORT_DISTANCE)
			count++;
	}
	return count;
}

//check if a tank can shoot to a tank!!!
function CanShootEm(tank, targetX, targetY)
{
	console.log("CanShootEm, myPos: (" + tank.m_x + "," + tank.m_y + "), target: (" + targetX + "," + targetY + ")");
	if(Math.abs(tank.m_x - targetX) <= 0.5)
	{
		var bullet = new Bullet();
		bullet.m_id = 0;
		bullet.m_x = tank.m_x;
		bullet.m_y = tank.m_y;
		bullet.m_team = g_team;
		bullet.m_direction = (tank.m_y < targetY)?DIRECTION_DOWN:DIRECTION_UP;
		bullet.m_speed = 1;
		bullet.m_damage = 0;
		bullet.m_live = false;
		if(CheckBulletRoad(bullet, Math.abs(tank.m_y - targetY), false) == null)
		{
			console.log("CanShootEm return true here 1");
			return true;
		}
	}
	else if(Math.abs(tank.m_y - targetY) <= 0.5)
	{
		var bullet = new Bullet();
		bullet.m_id = 0;
		bullet.m_x = tank.m_x;
		bullet.m_y = tank.m_y;
		bullet.m_team = g_team;
		bullet.m_direction = (tank.m_x < targetX)?DIRECTION_RIGHT:DIRECTION_LEFT;
		bullet.m_speed = 1;
		bullet.m_damage = 0;
		bullet.m_live = false;
		if(CheckBulletRoad(bullet, Math.abs(tank.m_x - targetX), false) == null)
		{
			console.log("CanShootEm return true here 2");
			return true;
		}
	}
	console.log("CanShootEm return false");
	return false;
}

function CanShootEm2(posX, posY, targetX, targetY)
{
	if(Math.abs(posX - targetX) <= 0.5)
	{
		var bullet = new Bullet();
		bullet.m_id = 0;
		bullet.m_x = posX;
		bullet.m_y = posY;
		bullet.m_team = g_team;
		bullet.m_direction = (posY < targetY)?DIRECTION_DOWN:DIRECTION_UP;
		bullet.m_speed = 1;
		bullet.m_damage = 0;
		bullet.m_live = false;
		if(CheckBulletRoad(bullet, Math.abs(posY - targetY), false) == null)
			return true;
	}
	else if(Math.abs(posY - targetY) <= 0.5)
	{
		var bullet = new Bullet();
		bullet.m_id = 0;
		bullet.m_x = posX;
		bullet.m_y = posY;
		bullet.m_team = g_team;
		bullet.m_direction = (posX < targetX)?DIRECTION_RIGHT:DIRECTION_LEFT;
		bullet.m_speed = 1;
		bullet.m_damage = 0;
		bullet.m_live = false;
		if(CheckBulletRoad(bullet, Math.abs(posX - targetX), false) == null)
			return true;
	}
	return false;
}

function CalcEnemyDangers()
{
	console.log("CalcEnemyDangers");
	arrOppDanger = [0.0, 0.0, 0.0, 0.0];
	var dangerBoard = (g_team == TEAM_1)?g_danger_1:g_danger_2;
	for(var i = 0; i < NUMBER_OF_TANK; i++)
	{
		var tank = g_tanks[g_opponent][i];
		
		//don't check death tank
		if(tank.m_HP == 0)
		{
			console.log("tank.m_HP == 0, i: " + i);
			continue;
		}
		
		//check the tank's position
		arrOppDanger[i] += DANGER_RATIO_POS * dangerBoard[tank.m_x >> 0 + (tank.m_y >> 0) * MAP_W];
		console.log("arrOppDanger[i] after pos: " + arrOppDanger[i]);
		
		//TODO - check if it can shoot my tanks
		//simple for now: check distance with my tanks
		for(var j = 0; j < NUMBER_OF_TANK; j++)
		{
			var temp = g_tanks[g_team][j];
			if(temp.m_HP == 0)
				continue;
			if(Math.abs(temp.m_x - tank.m_x) + Math.abs(temp.m_y - tank.m_y) <= ENEMY_DANGER_DISTANCE)
				arrOppDanger[i] += DANGER_RATIO_TANK;
		}
		
		//check if it has support
		arrOppDanger[i] += CountSupportTanks(g_opponent, tank, i) * DANGER_RATIO_SUPPORT;
		console.log("arrOppDanger[i]:" + arrOppDanger[i]);
	}
}

//Calculate expected positions for tanks in each frame base on match info
function CalcExpectTargets()
{
	//base on enemy danger's to assign my tanks to fight with enemy's tanks
	arrAssigned = [false, false, false, false];
	
	//sort arrOppDanger: greatest first
	console.log("arrOppDanger: " + arrOppDanger[0] + ", " + arrOppDanger[1] + ", " + arrOppDanger[2] + ", " + arrOppDanger[3]);
	var arrDangerIdx = [0, 1, 2, 3];
	var swapped = false;
	do
	{
		swapped = false;
		for(var i = 1; i < NUMBER_OF_TANK; i++)
		{
			if(arrOppDanger[arrDangerIdx[i-1]] < arrOppDanger[arrDangerIdx[i]])
			{
				var tmp = arrDangerIdx[i-1];
				arrDangerIdx[i-1] = arrDangerIdx[i];
				arrDangerIdx[i] = tmp;
				swapped = true;
			}
		}
	}
	while(swapped);
	//console.log("After sort: " + arrOppDanger[arrDangerIdx[0]] + ", " + arrOppDanger[arrDangerIdx[1]] + ", " + arrOppDanger[arrDangerIdx[2]] + ", " + arrOppDanger[arrDangerIdx[3]]);
	//console.log("Idx: " + arrDangerIdx[0] + ", " + arrDangerIdx[1] + ", " + arrDangerIdx[2] + ", " + arrDangerIdx[3]);
	
	//if has power up item in my bag, apply to the most danger tank! (Check if danger > threshold first.)
	if(arrOppDanger[arrDangerIdx[0]] >= DANGER_THRESHOLD)
	{
		if (HasAirstrike()) {
			var tank0 = g_tanks[g_opponent][arrDangerIdx[0]];
			UseAirstrike (tank0.m_x, tank0.m_y); //TODO - calc position to not bomb my tank!
		}
		if (HasEMP()) {
			var tank0 = g_tanks[g_opponent][arrDangerIdx[0]];
			UseEMP (tank0.m_x, tank0.m_y); //TODO - calc position to not bomb my tank!
		}
	}
		
	//assign
	var assignedCount = 0;
	var assignedCountMax = NUMBER_OF_TANK;
	for(var j = 0; j < NUMBER_OF_TANK; j++)
	{
		var temp = g_tanks[g_team][j];
		if(temp.m_HP == 0)
			assignedCountMax--;
	}
	
	//reset arrNotAvoiding if enemy tank's death
	for(var i = 0; i < NUMBER_OF_TANK; i++)
	{
		var opTank = g_tanks[g_opponent][i];
		if(opTank.m_HP == 0)
		{
			for(var j = 0; j < NUMBER_OF_TANK; j++)
			{
				if(arrOldTargets[j] != null && arrOldTargets[j].type == TARGET_TANK && arrOldTargets[j].object == opTank)
				{
					arrNotAvoiding[j] = false;
				}
			}
		}
	}
	
	for(var i = 0; i < NUMBER_OF_TANK; i++)
	{
		//don't fight if not danger atm
		if(arrOppDanger[arrDangerIdx[i]] < DANGER_THRESHOLD)
			break;
			
		var dangerTank = g_tanks[g_opponent][arrDangerIdx[i]];
			
		//check double threshold
		var needTanks = 1;
		if(arrOppDanger[arrDangerIdx[i]] >= DANGER_TRIPLE_THRESHOLD)
			needTanks = 3;
		else if(arrOppDanger[arrDangerIdx[i]] >= DANGER_DOUBLE_THRESHOLD)
			needTanks = 2;
		console.log("danger tank: " + arrDangerIdx[i] + ", needTanks: " + needTanks);
		
		var tankCount = 0;
		
		//check if there's a tank that has old target is this dangerTank
		for(var j = 0; j < NUMBER_OF_TANK; j++)
		{
			if(arrAssigned[j] == true)
				continue;
			var temp = g_tanks[g_team][j];
			if(temp.m_HP == 0)
				continue;
			if(arrOldTargets[j] != null && arrOldTargets[j].type == TARGET_TANK && arrOldTargets[j].object == dangerTank)
			{
				console.log("Assign to old tank & old target");
				console.log("TARGET --- tank: " + j + ", dangerTank: (" + dangerTank.m_x +"," + dangerTank.m_y + ")");
				arrTargets[j] = new TankTarget(TARGET_TANK, dangerTank, dangerTank.m_x, dangerTank.m_y);
				arrAssigned[j] = true;
				tankCount++;
				assignedCount++;
				if(tankCount == needTanks)
					break;
			}
		}
		
		//assign tanks base on needTanks
		while((tankCount < needTanks) && (assignedCount < assignedCountMax))
		{
			console.log("tankCount: " + tankCount + ", assignedCount: " + assignedCount);
			var assigned = false;
			var minDistance = 9999; //use min distance in worst case
			var minIdx = 99;
			for(var j = 0; j < NUMBER_OF_TANK; j++)
			{
				if(arrAssigned[j] == true)
					continue;
				var temp = g_tanks[g_team][j];
				if(temp.m_HP == 0)
					continue;
					
				var dist = Math.abs(temp.m_x - dangerTank.m_x) + Math.abs(temp.m_y - dangerTank.m_y);
				
				//check old target, if it's still not death & nearer -> not assign to this danger tank
				if(arrOldTargets[j] != null && arrOldTargets[j].type == TARGET_TANK)
				{
					var oldOpTank = arrOldTargets[j].object;
					if(oldOpTank.m_HP > 0)
					{
						var oldDist = Math.abs(temp.m_x - oldOpTank.m_x) + Math.abs(temp.m_y - oldOpTank.m_y);
						if(oldDist < dist)
							continue;
					}
				}
				
				//if my tank can shoot to it
				if(CanShootEm(temp, dangerTank.m_x, dangerTank.m_y))
				{
					//arrExpectPos[j] = new Position(dangerTank.m_x, dangerTank.m_y);
					console.log("TARGET --- tank: " + j + ", dangerTank: (" + dangerTank.m_x +"," + dangerTank.m_y + ")");
					arrTargets[j] = new TankTarget(TARGET_TANK, dangerTank, dangerTank.m_x, dangerTank.m_y);
					arrAssigned[j] = true;
					assigned = true;
					tankCount++;
					assignedCount++;
					break;
				}
				
				//if my tank's nearby it
				if(dist <= TARGET_TANK_DISTANCE)
				{
					//arrExpectPos[j] = new Position(dangerTank.m_x, dangerTank.m_y);
					console.log("TARGET --- tank: " + j + ", dangerTank: (" + dangerTank.m_x +"," + dangerTank.m_y + ")");
					arrTargets[j] = new TankTarget(TARGET_TANK, dangerTank, dangerTank.m_x, dangerTank.m_y);
					arrAssigned[j] = true;
					assigned = true;
					tankCount++;
					assignedCount++;
					break;
				}
				
				//min distance for last choice
				if(dist < minDistance)
				{
					minDistance = dist;
					minIdx = j;
				}
			}
			
			//pick a tank that in min distance
			if(!assigned && (minIdx < NUMBER_OF_TANK))
			{
				//arrExpectPos[minIdx] = new Position(dangerTank.m_x, dangerTank.m_y);
				console.log("TARGET --- tank: " + j + ", dangerTank: (" + dangerTank.m_x +"," + dangerTank.m_y + ")");
				arrTargets[minIdx] = new TankTarget(TARGET_TANK, dangerTank, dangerTank.m_x, dangerTank.m_y);
				arrAssigned[minIdx] = true;
				tankCount++;
				assignedCount++;
			}
			else //don't have free tank to assign
			{
				if(tankCount < needTanks)
					console.log("don't have free tank to assign!");
				break;
			}
		}
	}
	
	//check for unassigned tanks, can shoot to base or obstacle, or get the power up
	if(assignedCount < assignedCountMax)
	{
		for(var j = 0; j < NUMBER_OF_TANK; j++)
		{
			if(arrAssigned[j] == true)
				continue;
			var temp = g_tanks[g_team][j];
			if(temp.m_HP == 0)
				continue;
				
			FindOtherTankTarget(temp, j, true, true);
		}
	}
	
	//if(arrTargets[0] != null)
	//	console.log("Expect pos for tank 0 - type: " + arrTargets[0].type + ", post: (" + arrTargets[0].x + "," + arrTargets[0].y + ")");
		
	//calc expect position for tank targets
	for(var j = 0; j < NUMBER_OF_TANK; j++)
	{
		if((arrAssigned[j] == true) && (arrTargets[j].type == TARGET_TANK))
		{
			console.log("Check target tanks, idx: " + j);
			var temp = g_tanks[g_team][j];
			var target = arrTargets[j];
			var opp = target.object;
			var oppTankIdx = -1;
			for(var i = 0; i < NUMBER_OF_TANK; i++)
			{
				if(g_tanks[g_opponent][i] == opp)
				{
					oppTankIdx = i;
					break;
				}
			}
			if(oppTankIdx == -1)
				console.log("========================= CalcExpectedTargets, why oppTankIdx == -1 ???");
			//if can shoot 'em
			if(CanShootEm(temp, opp.m_x, opp.m_y))
			{
				console.log("CanShootEm");
				target.canShoot = true;
				if(Math.abs(temp.m_x - opp.m_x) <= 0.5) //vertical
				{
					var dist = Math.abs(temp.m_y - opp.m_y);
					target.dir2Target = (temp.m_y < opp.m_y)?DIRECTION_DOWN:DIRECTION_UP;
					if(dist <= TANK_FIGHT_DISTANCE)
					{
						//stay at current pos
						console.log("stay at current pos");
						target.x = temp.m_x;
						target.y = temp.m_y;
					}
					else
					{
						//set target pos 
						target.x = opp.m_x;//temp.m_x;
						target.y = opp.m_y;
						// target.y = (temp.m_y < opp.m_y)?(opp.m_y - TANK_FIGHT_DISTANCE):(opp.m_y + TANK_FIGHT_DISTANCE);
						// while(!IsPositionAvailable(new Position(target.x, target.y), j))
						// {
							// if(temp.m_y < opp.m_y)
								// target.y++;
							// else
								// target.y--;
						// }
						console.log("Target pos: (" + target.x + "," + target.y + ")");
					}
				}
				else //horizontal
				{
					var dist = Math.abs(temp.m_x - opp.m_x);
					target.dir2Target = (temp.m_x < opp.m_x)?DIRECTION_RIGHT:DIRECTION_LEFT;
					if(dist <= TANK_FIGHT_DISTANCE)
					{
						//stay at current pos
						console.log("stay at current pos");
						target.x = temp.m_x;
						target.y = temp.m_y;
					}
					else
					{
						//set target pos 
						target.y = opp.m_y; //temp.m_y;
						target.x = opp.m_x;
						// target.x = (temp.m_x < opp.m_x)?(opp.m_x - TANK_FIGHT_DISTANCE):(opp.m_x + TANK_FIGHT_DISTANCE);
						// while(!IsPositionAvailable(new Position(target.x, target.y), j))
						// {
							// if(temp.m_x < opp.m_x)
								// target.x++;
							// else
								// target.x--;
						// }
						console.log("Target pos: (" + target.x + "," + target.y + ")");
					}
				}
			}
			else //can't shoot atm -> moving to a pos that can shoot
			{
				console.log("!CanShootEm - moving");
				target.canShoot = false;
				//TODO - check bullet road to make sure that we can shoot opp at target pos 
				var pos1 = new Position(temp.m_x, opp.m_y);
				var pos2 = new Position(opp.m_x, temp.m_y);
				var checkPos1 = false;
				while(true)
				{
					if(IsPositionAvailable(pos1, j, oppTankIdx) && CanShootEm2(pos1.x, pos1.y, opp.m_x, opp.m_y))
					{
						checkPos1 = true;
						break;
					}
					if(temp.m_x > opp.m_x)
					{
						pos1.x--;
						if(pos1.x <= opp.m_x)
							break;
					}
					else
					{
						pos1.x++;
						if(pos1.x >= opp.m_x)
							break;
					}
				}
				var checkPos2 = false;
				while(true)
				{
					if(IsPositionAvailable(pos2, j, oppTankIdx) && CanShootEm2(pos2.x, pos2.y, opp.m_x, opp.m_y))
					{
						checkPos2 = true;
						break;
					}
					if(temp.m_y > opp.m_y)
					{
						pos2.y--;
						if(pos2.y <= opp.m_y)
							break;
					}
					else
					{
						pos2.y++;
						if(pos2.y >= opp.m_y)
							break;
					}
				}
				if(checkPos1 && 
				(!checkPos2 || (Math.abs(temp.m_x - pos1.x) + Math.abs(temp.m_y - pos1.y) < Math.abs(temp.m_x - pos2.x) + Math.abs(temp.m_y - pos2.y)))) //should go to pos1
				{
					target.x = pos1.x;
					target.y = pos1.y;
				}
				else if(checkPos2)//should go to pos2
				{
					target.x = pos2.x;
					target.y = pos2.y;
				}
				console.log("Target pos: (" + target.x + "," + target.y + ")");
			}
		}
	}
}

//Find a target for tank, use in CalcExpectTargets or in CalcDir2ExpectPos if not find dir to current target
function FindOtherTankTarget(tank, tankIdx, firstTime, force2Choose)
{
	//no target yet -> check target tank
	//TODO - need more code to choose tank
	// if(firstTime || arrTargets[tankIdx] == null)
	// {
		// for(var i = 0; i < NUMBER_OF_TANK; i++)
		// {
			// //don't fight if not danger atm
			// if(arrOppDanger[arrDangerIdx[i]] < DANGER_THRESHOLD)
				// break;
				
			// var dangerTank = g_tanks[g_opponent][arrDangerIdx[i]];
			
			// var dist = Math.abs(tank.m_x - dangerTank.m_x) + Math.abs(tank.m_y - dangerTank.m_y);
				
			// //if my tank's nearby it
			// if(dist <= TARGET_TANK_DISTANCE)
			// {
				// //arrExpectPos[tankIdx] = new Position(dangerTank.m_x, dangerTank.m_y);
				// console.log("TARGET --- tank: " + tankIdx + ", dangerTank: (" + dangerTank.m_x +"," + dangerTank.m_y + ")");
				// arrTargets[tankIdx] = new TankTarget(TARGET_TANK, dangerTank, dangerTank.m_x, dangerTank.m_y);
				// arrAssigned[tankIdx] = true;
				// assigned = true;
				// tankCount++;
				// assignedCount++;
				// return true;
			// }
		// }
	// }
	
	//power-ups - find power up near me
	if((arrTargets[tankIdx] == null) || (arrTargets[tankIdx].type == TARGET_TANK))
	{
		var powerUp = GetPowerUpList();
		for (var i=0; i < powerUp.length; i++) {
			var x = powerUp[i].m_x;
			var y = powerUp[i].m_y;
			var dist = Math.abs(tank.m_x - x) + Math.abs(tank.m_y - y);
			if(dist <= POWERUP_DISTANCE)
			{
				//arrExpectPos[tankIdx] = new Position(x, y);
				console.log("TARGET POWERUP --- tank: " + tankIdx + ", pos: (" + x + "," + y + ")");
				arrTargets[tankIdx] = new TankTarget(TARGET_POWERUP, powerUp, x, y);
				arrAssigned[tankIdx] = true;
				return true;
			}
		}
	}
	
	//bases - find base near me
	if((arrTargets[tankIdx] == null) || (arrTargets[tankIdx].type == TARGET_TANK) || (arrTargets[tankIdx].type == TARGET_POWERUP))
	{
		var maxValue = -100;
		var maxPosX, maxPosY;
		var maxBase = null;
		var baseOpp = g_bases[g_opponent];
		for (var i=0; i < baseOpp.length; i++) 
		{
			if(baseOpp[i].m_HP == 0)
				continue;
			var x = baseOpp[i].m_x;
			var y = baseOpp[i].m_y;
			var dist = Math.abs(tank.m_x - x) + Math.abs(tank.m_y - y);
			if(dist <= BASE_DISTANCE)
			{
				//check positions that can shoot base
				var arrPos2Check = new Array();
				var curX, curY;
				if(baseOpp[i].m_type == BASE_MAIN)
				{
					console.log("BASE_MAIN");
					//main face
					//loop 2 lines
					curX = (g_opponent == TEAM_1)?3:18;
					for(curY = 10; curY <= 11; curY++)
					{
						var bonus = (g_map[curY * MAP_W + curX] == BLOCK_GROUND)?true:false;
						var curPos = new Position((g_opponent == TEAM_1)?(curX+1):(curX-1), curY);
						while((g_map[curPos.y * MAP_W + curPos.x] != BLOCK_HARD_OBSTACLE) && (curPos.x < tank.m_x + 1))
						{
							var value = BASE_VAL_MAIN_BONUS + (bonus)?BASE_VAL_DIRECT_BONUS:0;
							value -= (Math.abs(tank.m_x - curPos.x) + Math.abs(tank.m_y - curPos.y)) * BASE_VAL_PATH_RATIO;
							//var shootingPos = new BaseShootingPos(curPos, value);
							if(value > maxValue)
							{
								maxValue = value;
								maxPosX = curPos.x;
								maxPosY = curPos.y;
								maxBase = baseOpp[i];
							}
							if(g_opponent == TEAM_1)
								curPos.x++;
							else
								curPos.x--;
						}
					}
					
					//side face 1
					console.log("side face 1");
					var startX = (g_opponent == TEAM_1)?1:19;
					curY = 9;
					for(curX = startX; curX <= startX + 1; curX++)
					{
						var bonus = (g_map[curY * MAP_W + curX] == BLOCK_GROUND)?true:false;
						var curPos = new Position(curX, curY - 1);
						while((g_map[curPos.y * MAP_W + curPos.x] != BLOCK_HARD_OBSTACLE) && (curPos.x < tank.m_x + 1))
						{
							var value = BASE_VAL_MAIN_BONUS + (bonus)?BASE_VAL_DIRECT_BONUS:0;
							value -= (Math.abs(tank.m_x - curPos.x) + Math.abs(tank.m_y - curPos.y)) * BASE_VAL_PATH_RATIO;
							//var shootingPos = new BaseShootingPos(curPos, value);
							if(value > maxValue)
							{
								maxValue = value;
								maxPosX = curPos.x;
								maxPosY = curPos.y;
								maxBase = baseOpp[i];
							}
							curPos.y--;
						}
					}
					
					//side face 2
					console.log("side face 2");
					curY = 12;
					for(curX = startX; curX <= startX + 1; curX++)
					{
						var bonus = (g_map[curY * MAP_W + curX] == BLOCK_GROUND)?true:false;
						var curPos = new Position(curX, curY + 1);
						while((g_map[curPos.y * MAP_W + curPos.x] != BLOCK_HARD_OBSTACLE) && (curPos.x < tank.m_x + 1))
						{
							var value = BASE_VAL_MAIN_BONUS + (bonus)?BASE_VAL_DIRECT_BONUS:0;
							value -= (Math.abs(tank.m_x - curPos.x) + Math.abs(tank.m_y - curPos.y)) * BASE_VAL_PATH_RATIO;
							//var shootingPos = new BaseShootingPos(curPos, value);
							if(value > maxValue)
							{
								maxValue = value;
								maxPosX = curPos.x;
								maxPosY = curPos.y;
								maxBase = baseOpp[i];
							}
							curPos.y++;
						}
					}
				}
				else //BASE_SIDE
				{
					console.log("BASE_SIDE: (" + baseOpp[i].m_x + "," + baseOpp[i].m_y + ")");
					//horizontal
					curX = (g_opponent == TEAM_1)?5:16;
					var endX = (g_opponent == TEAM_1)?13:8;
					var startY = (baseOpp[i].m_y < 10)?3:17; 
					for(curY = startY; curY <= startY + 1; curY++)
					{
						var check1 = (g_opponent == TEAM_1)?(curX + 1):(curX - 1);
						var check2 = (g_opponent == TEAM_1)?(curX + 2):(curX - 2);
						var bonus = (g_map[curY * MAP_W + check1] == BLOCK_GROUND && g_map[curY * MAP_W + check2] == BLOCK_GROUND)?true:false;
						var curPos = new Position(curX, curY);
						while(true)
						{
							if(g_map[curPos.y * MAP_W + curPos.x] == BLOCK_GROUND)
							{
								var value = BASE_VAL_MAIN_BONUS;
								if((curPos.x == curX) || bonus)
									value += BASE_VAL_DIRECT_BONUS;
								value -= (Math.abs(tank.m_x - curPos.x) + Math.abs(tank.m_y - curPos.y)) * BASE_VAL_PATH_RATIO;
								//var shootingPos = new BaseShootingPos(curPos, value);
								if(value > maxValue)
								{
									maxValue = value;
									maxPosX = curPos.x;
									maxPosY = curPos.y;
									maxBase = baseOpp[i];
								}
							}
							if(g_opponent == TEAM_1)
							{
								curPos.x++;
								if((curPos.x >= tank.m_x + 1) || (curPos.x > endX))
									break;
							}
							else
							{
								curPos.x--;
								if((curPos.x <= tank.m_x - 1) || (curPos.x < endX))
									break;
							}
						}
					}
					
					//vertical
					console.log("vertical");
					curY = (baseOpp[i].m_y < 10)?5:16;
					var endY = (baseOpp[i].m_y < 10)?10:11;
					startX = (g_opponent == TEAM_1)?3:17; 
					for(curX = startX; curX <= startX+1; curX++)
					{
						var curPos = new Position(curX, curY);
						while(true)
						{
							if(g_map[curPos.y * MAP_W + curPos.x] == BLOCK_GROUND)
							{
								var value = BASE_VAL_MAIN_BONUS + BASE_VAL_DIRECT_BONUS;
								value -= (Math.abs(tank.m_x - curPos.x) + Math.abs(tank.m_y - curPos.y)) * BASE_VAL_PATH_RATIO;
								//var shootingPos = new BaseShootingPos(curPos, value);
								if(value > maxValue)
								{
									maxValue = value;
									maxPosX = curPos.x;
									maxPosY = curPos.y;
									maxBase = baseOpp[i];
								}
							}
							if(baseOpp[i].m_y < 10)
							{
								curPos.y++;
								if((curPos.y >= tank.m_y + 1)||(curPos.y > endY))
									break;
							}
							else
							{
								curPos.y--;
								if((curPos.y <= tank.m_y - 1)||(curPos.y < endY))
									break;
							}
						}
					}
				}
			}
		}
		
		//if found a pos!
		if(maxBase != null)
		{
			console.log("TARGET BASE: (" + maxBase.m_x + "," + maxBase.m_y + "), maxPos: (" + maxPosX + "," + maxPosY + "), tankIdx: " + tankIdx);
			arrTargets[tankIdx] = new TankTarget(TARGET_BASE, maxBase, maxPosX, maxPosY);
			arrAssigned[tankIdx] = true;
			return true;
		}
	}
	
	if(!force2Choose) //can't choose better target
		return false;
	
	//TODO - what else target?
	//go to 1 of 2 pos in main bridge's sides
	var pos1 = new Position((g_team == TEAM_1)?9:12, 7);
	var pos2 = new Position(pos1.x, 14);
	var dist1 = Math.abs(tank.m_x - pos1.x) + Math.abs(tank.m_y - pos1.y);
	var dist2 = Math.abs(tank.m_x - pos2.x) + Math.abs(tank.m_y - pos2.y);
	if(dis1 < dist2)
	{
		arrTargets[tankIdx] = new TankTarget(TARGET_MOVING, null, pos1.x, pos1.y);
		arrAssigned[tankIdx] = true;
		return true;
	}
	else
	{
		arrTargets[tankIdx] = new TankTarget(TARGET_MOVING, null, pos2.x, pos2.y);
		arrAssigned[tankIdx] = true;
		return true;
	}
}

//Calc direction from a tank's pos to its expected pos
function CalcDir2ExpectPos(tank, tankIdx, expectedPos)
{
	//log expected poses
	console.log("---------------- CalcDir2ExpectPos - tank: " + tankIdx + ", curPos: (" + tank.m_x + "," + tank.m_y + ")" + ", expectedPos: (" + expectedPos.x + "," + expectedPos.y + ")");
	
	if((Math.abs(expectedPos.x - tank.m_x) < 0.1) && (Math.abs(expectedPos.y - tank.m_y) < 0.1))
	{
		console.log("stay at my pos");
		//calc dir2Target & canShoot if needed
		if(arrTargets[tankIdx].dir2Target == DIRECTION_NONE)
		{
			var target = arrTargets[tankIdx].object;
			if(target == null)
				arrTargets[tankIdx].dir2Target = GetMyAttackDir();
			else
			{
				var targetSize = (arrTargets[tankIdx].type == TARGET_TANK)?TANK_SIZE:BASE_SIZE;
				targetSize = targetSize * 0.5;
				if(Math.abs(target.m_x - tank.m_x) <= targetSize)
				{
					if(arrTargets[tankIdx].type == TARGET_BASE)
						arrTargets[tankIdx].canShoot = true;
					arrTargets[tankIdx].dir2Target = (target.m_y < tank.m_y)?DIRECTION_UP:DIRECTION_DOWN;
				}
				else if(Math.abs(target.m_y - tank.m_y) <= targetSize)
				{
					if(arrTargets[tankIdx].type == TARGET_BASE)
						arrTargets[tankIdx].canShoot = true;
					arrTargets[tankIdx].dir2Target = (target.m_x < tank.m_x)?DIRECTION_LEFT:DIRECTION_RIGHT;
				}
			}
		}
		
		return DIRECTION_NONE;
	}
	
	// //check if can go straight to expected pos
	// if(((Math.abs(expectedPos.x - tank.m_x) <= 0.1) || (Math.abs(expectedPos.y - tank.m_y) <= 0.1))
		// && CanGoStraight2Pos(tank.m_x, tank.m_y, expectedPos.x, expectedPos.y, tankIdx))
	// {
		// console.log("CalcDir2ExpectPos go straight to target!");
		// if(Math.abs(expectedPos.x - tank.m_x) <= 0.1)
			// return (expectedPos.y < tank.m_y)?DIRECTION_UP:DIRECTION_DOWN;
		// else
			// return (expectedPos.x < tank.m_x)?DIRECTION_LEFT:DIRECTION_RIGHT;
	// }
	
	//not use this code after fix AStar bug (actually IsPositionAvailable bug)
	/*
	//check if expectedPos is too far from my pos -> 
	if(Math.abs(expectedPos.x - tank.m_x) + Math.abs(expectedPos.y - tank.m_y) > ASTAR_DISTANCE)
	{
		console.log("Too far expectedPos, need calc...");
		var nX, nY;
		var nearX = false;
		var nearY = false;
		if(Math.abs(expectedPos.x - tank.m_x) > ASTAR_HALF_DISTANCE)
			nX = (expectedPos.x > tank.m_x)?(tank.m_x + ASTAR_HALF_DISTANCE):(tank.m_x - ASTAR_HALF_DISTANCE);
		else
		{
			nX = expectedPos.x;
			nearX = true;
		}
		if(Math.abs(expectedPos.y - tank.m_y) > ASTAR_HALF_DISTANCE)
			nY = (expectedPos.y > tank.m_y)?(tank.m_y + ASTAR_HALF_DISTANCE):(tank.m_y - ASTAR_HALF_DISTANCE);
		else
		{
			nY = expectedPos.y;
			nearY = true;
		}
		var pos1 = new Position(nX, tank.m_y);
		var pos2 = new Position(tank.m_x, nY);
		var pos3 = new Position(nX, nY);
		
		if(nearY) //should check pos1 & pos3
		{
			while(true)
			{
				var avail1 = IsPositionAvailable(pos1, tankIdx);
				var avail3 = IsPositionAvailable(pos3, tankIdx)
				if(!avail1 && !avail3)
				{
					pos1.x = (expectedPos.x > tank.m_x)?(pos1.x - tank.m_speed):(pos1.x + tank.m_speed);
					pos3.x = pos1.x;
					if((pos3.x < 1) || (pos3.x > 20))
					{
						console.log("POOR ME, why I'm here? (nearX)");
						return DIRECTION_NONE;
					}
				}
				else if(!avail1)
				{
					expectedPos = pos3;
					break;
				}
				else if(!avail3)
				{
					expectedPos = pos1;
					break;
				}
				else
				{
					expectedPos = pos3;
					break;
				}
			}
		}
		else if(nearX) //should check pos2 & pos3
		{
			while(true)
			{
				var avail2 = IsPositionAvailable(pos2, tankIdx);
				var avail3 = IsPositionAvailable(pos3, tankIdx)
				if(!avail2 && !avail3)
				{
					pos2.y = (expectedPos.y > tank.m_y)?(pos2.y - tank.m_speed):(pos2.y + tank.m_speed);
					pos3.y = pos2.y;
					if((pos3.y < 1) || (pos3.y > 20))
					{
						console.log("POOR ME, why I'm here? (nearY)");
						return DIRECTION_NONE;
					}
				}
				else if(!avail2)
				{
					expectedPos = pos3;
					break;
				}
				else if(!avail3)
				{
					expectedPos = pos2;
					break;
				}
				else
				{
					expectedPos = pos3;
					break;
				}
			}
		}
		else //check pos3?
		{
			if(!IsPositionAvailable(pos3, tankIdx))
			{
				var canAssign = true;
				do
				{
					pos3.x = (expectedPos.x > tank.m_x)?(pos3.x - tank.m_speed):(pos3.x + tank.m_speed);
					pos3.y = (expectedPos.y > tank.m_y)?(pos3.y - tank.m_speed):(pos3.y + tank.m_speed);
					if((pos3.x < 1) || (pos3.x > 20) || (pos3.y < 1) || (pos3.y > 20))
					{
						canAssign = false;
						break;
					}
				}
				while(!IsPositionAvailable(pos3, tankIdx))
				if(canAssign)
					expectedPos = pos3;
				else
				{
					console.log("POOR ME, why I'm here?");
					return DIRECTION_NONE;
				}
			}
			else
				expectedPos = pos3;
		}
		console.log("New expectedPos: (" + expectedPos.x + "," + expectedPos.y + ")");
	}
	*/
	
	var nextPos;
	//need A* here
	// var roundExpected = new Position(expectedPos.x >> 0, expectedPos.y >> 0);
	var pathNode = null;
	var opTankIdx = -1;
	if(arrTargets[tankIdx].type == TARGET_TANK)
	{
		var opTank = arrTargets[tankIdx].object;
		for(var i = 0; i < NUMBER_OF_TANK; i++)
		{
			if(g_tanks[g_opponent][i] == opTank)
			{
				opTankIdx = i;
				break;
			}
		}
		if(opTankIdx == -1)
			console.log("========================= CalcDir2ExpectPos, why opTankIdx == -1 ???");
	}
	pathNode = GetAStarPath(tank.m_x, tank.m_y, expectedPos, tankIdx, opTankIdx);
	if(pathNode != null)
	{
		var root = pathNode.root;
		nextPos = root.pos;
		console.log("root pos: (" + nextPos.x + "," + nextPos.y + ")");
	}
	else //AStar failed, calc another target
	{
		if(FindOtherTankTarget(tank, tankIdx, false, false))
		{
			//call this function again
			return CalcDir2ExpectPos(tank, tankIdx, new Position(arrTargets[tankIdx].x, arrTargets[tankIdx].y));
		}
		else
		{
			return DIRECTION_NONE;
		}
	}
		
	//now find dir to move to nextPos
	//check y first, then check x
	var retDir = DIRECTION_NONE;
	if(nextPos.y > tank.m_y + 0.1)
	{
		retDir = DIRECTION_DOWN;
	}
	else if(nextPos.y < tank.m_y - 0.1)
	{
		retDir = DIRECTION_UP;
	}
	else if(nextPos.x > tank.m_x + 0.1)
	{
		retDir = DIRECTION_RIGHT;
	}
	else if(nextPos.x < tank.m_x - 0.1)
	{
		retDir = DIRECTION_LEFT;
	}
	console.log("retDir: " + retDir);
	
	//check with target canShoot -> don't move, stay & shoot!
	if(arrTargets[tankIdx] && arrTargets[tankIdx].canShoot && (retDir != arrTargets[tankIdx].dir2Target))
	{
		console.log("don't move, stay & shoot!");
		retDir = DIRECTION_NONE;
	}
	
	//if still cannot go left/right -> don't move
	var nextPosStatus = CheckNextPosStatus(retDir, tankIdx);
	if((retDir != DIRECTION_NONE) && (nextPosStatus != POS_SAFE))
	{
		console.log("not safe target!!! Status: " + nextPosStatus);
		//TODO - come up to fight or change the target?
		if(nextPosStatus == POS_UNSAFE)
		{
			//check if target is a tank & I can shoot him at nextPos
			//need check if other tank of my team can also shoot
			if(arrTargets[tankIdx] && arrTargets[tankIdx].type == TARGET_TANK)
			{
				var opTank = arrTargets[tankIdx].object;
				if(CanShootEm2(nextPos.x, nextPos.y, opTank.m_x, opTank.m_y))
				{
					console.log("adding to in-doubt list");
					arrNextPosRecheck[tankIdx] = true;
					arrPos2Recheck[tankIdx] = new Position(nextPos.x, nextPos.y);
					arrDir2Recheck[tankIdx] = retDir;
				}
			}
		}
		retDir = DIRECTION_NONE;
	}
	
	console.log("CalcDir2ExpectPos decided to dir: " + retDir + ", tankIdx: " + tankIdx);
	return retDir;
}

//Clear temporary variables, is called in end of Update function
function CleanTempVariables()
{
	arrDanger = [];
	
	//cache current targets for next frame
	for(var i = 0; i < NUMBER_OF_TANK; i++)
		arrOldTargets[i] = arrTargets[i];
		
	arrTargets = [];
}

//Initialize all for my bot
function InitializeBot()
{
	g_opponent = GetOpponentTeam();
	SetExpectPositions();
	arrNotAvoiding = [false, false, false, false];
	arrAvoidPosition = [null, null, null, null];
	for(var i = 0; i < NUMBER_OF_TANK; i++)
		arrNotSafePos[i] = new Array();
}

function OnPlaceTankRequest() {
	//le.huathi - initialize here
	InitializeBot();

	// This function is called at the start of the game. You place your tank according
	// to your strategy here.
	// if (GetMyTeam() == TEAM_1) {
		// PlaceTank(TANK_LIGHT, 5, 1);
		// PlaceTank(TANK_MEDIUM, 5, 7);
		// PlaceTank(TANK_HEAVY, 5, 14);
		// PlaceTank(TANK_LIGHT, 5, 20);
	// }
	// else if (GetMyTeam() == TEAM_2) {
		// PlaceTank(TANK_LIGHT, 16, 1);
		// PlaceTank(TANK_MEDIUM, 16, 7);
		// PlaceTank(TANK_HEAVY, 16, 14);
		// PlaceTank(TANK_HEAVY, 16, 20);
	// }
	
	for(var i = 0; i < NUMBER_OF_TANK; i++)
	{
		var pos = arrExpectPos[i];
		//PlaceTank(TANK_MEDIUM, pos.x, pos.y);
		PlaceTank(TANK_HEAVY, pos.x, pos.y);
	}
	
	// Leave this here, don't remove it.
	// This command will send all of your tank command to server
	SendCommand();
}

function Update() {
	// =========================================================================================================
	// Do nothing if the match is ended
	// You should keep this. Removing it probably won't affect much, but just keep it.
	// =========================================================================================================
	if(g_state == STATE_FINISHED) {
		if(((g_matchResult == MATCH_RESULT_TEAM_1_WIN) && (GetMyTeam() == TEAM_1)) || ((g_matchResult == MATCH_RESULT_TEAM_2_WIN) && (GetMyTeam() == TEAM_2))) {
			console.log("I WON. I WON. I'M THE BEST!!!");
		}
		else if(((g_matchResult == MATCH_RESULT_TEAM_2_WIN) && (GetMyTeam() == TEAM_1)) || ((g_matchResult == MATCH_RESULT_TEAM_1_WIN) && (GetMyTeam() == TEAM_2))) {
			console.log("DAMN, I LOST. THAT GUY WAS JUST LUCKY!!!");
		}
		else {
			console.log("DRAW.. BORING!");
		}
		return;
	}
	
	// //testing
	// var opp = g_tanks[g_opponent][1];
	// var test = IsOccupyBlock(opp.m_x, opp.m_y, TANK_SIZE, 16, 8.8);
	// console.log("IsOccupyBlock(16,8.8): " + test + ", opp: (" + opp.m_x + "," + opp.m_y + ")");
	// var testPos = new Position(16, 8.8);
	// var test2 = IsPositionAvailable(testPos, 0, 2);
	// console.log("IsPositionAvailable(16,8.8): " + test2 + ", opp: (" + opp.m_x + "," + opp.m_y + ")");
	
	// =========================================================================================================
	// Check if there will be any airstrike or EMP
	// The GetIncomingStrike() function will return an array of strike object. Both called by your team
	// or enemy team.
	// =========================================================================================================
	var strike = GetIncomingStrike();
	for (var i=0; i<strike.length; i++) {
		var x = strike[i].m_x;
		var y = strike[i].m_y;
		var count = strike[i].m_countDown; // Delay (in server loop) before the strike reach the battlefield.
		var type = strike[i].m_type;
		
		if (type == POWERUP_AIRSTRIKE) {
			// You may want to do something here, like moving your tank away if the strike is on top of your tank.
		}
		else if (type == POWERUP_EMP) {
			// Run... RUN!!!!
		}
	}
	
	
	console.log("--------------- UPDATE NEW FRAME -------------------");
	for (var i=0; i<NUMBER_OF_TANK; i++) {
		var tempTank = GetMyTank(i);
		console.log("--- Tank HP: " + tempTank.m_HP + ", pos: (" + tempTank.m_x + "," + tempTank.m_y + ") ---");
	}
	
	// =========================================================================================================
	// Get power up list on the map. You may want to move your tank there and secure it before your enemy
	// does it. You can get coordination, and type from this object
	// =========================================================================================================
	var powerUp = GetPowerUpList();
	for (var i=0; i<powerUp.length; i++) {
		var x = powerUp[i].m_x;
		var y = powerUp[i].m_y;
		var type = powerUp[i].m_type;
		if (type == POWERUP_AIRSTRIKE) {
			// You may want to move your tank to this position to secure this power up.
		}
		else if (type == POWERUP_EMP) {
			
		}
	}
	
	//update array not safe positions
	UpdateNotSafePosition();
	
	//Check opponent tanks' danger 
	CalcEnemyDangers();
	
	//Calculate expected target for each tank
	CalcExpectTargets();
	
	//Calculate next direction for tanks
	CalcNextDirection();
	
	//Check if can shoot or not
	CalcNextShoot();

	// Loop through all tank (if not dead yet)
	for (var i=0; i<NUMBER_OF_TANK; i++) {
		var tempTank = GetMyTank(i);
		// Don't waste effort if tank's death
		if((tempTank == null) ||(tempTank.m_HP == 0))
			continue;
		
		// // Run randomly and fire as soon as finish cooldown
		// if (Math.random() > 0.9) {
			// var direction = (Math.random() * 4) >> 0;
			// CommandTank (i, direction + 1, true, true);
		// }
		// else {
			// CommandTank (i, null, true, true);
		// }
		
		if(nextMovingDirection[i] != 0)
		{
			CommandTank (i, nextMovingDirection[i], true, arrCanShoot[i]);
		}
		else
		{
			//TODO - need accurate the expect direction
			//just stay and shoot at nextExpectDirection as much as possible :)
			if(arrTargets[i] && arrTargets[i].dir2Target != DIRECTION_NONE)
				CommandTank (i, arrTargets[i].dir2Target, false, arrCanShoot[i]);
			else if(nextExpectDirection[i] != DIRECTION_NONE)
				CommandTank (i, nextExpectDirection[i], false, arrCanShoot[i]);
			else //stay calm this frame :)
			{
				console.log("stay calm!!!");
				CommandTank(i, 0, false, false);
			}
		}
	}
	
	// If have airstrike, strike on the middle bridge
	if (HasAirstrike()) {
		//UseAirstrike (10.5, 10.5);
		UseAirstrike (Math.random() * 5 + 8, Math.random() * 5 + 8);
	}
	
	//Clear temporary variables here
	CleanTempVariables();
	
	// Leave this here, don't remove it.
	// This command will send all of your tank command to server
	SendCommand();
}

//TODO: danger tank has wrong value sometime, value = 0 when tank is very near my tank