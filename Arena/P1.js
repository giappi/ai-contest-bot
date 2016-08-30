

"use strict";

var _DEBUG = true;

/* To calculate time execute to test performance */
var performance =
{
    "now" : function()
    {
        var t = process.hrtime();
        return t[0] + t[1]/1e9;
    }
};

_DEBUG || (console.log = function(){});

function echo()
{
    console.log.apply(0, arguments);
}

function var_dump(v)
{
    console.log(v);
}


function printf()
{
    if(_DEBUG)
    {

        var s = arguments[0];
        for(var i = 1; i < arguments.length; i++)
        {
            s = s.replace(/%[dfs]/, arguments[i]);
        }
        console.log(s);
    }
}






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

// Đo mức độ cản trở của khối
var BLOCK_OBSTACLNESS = [0, 0, 99, 1, 99];

var BLOCK_TANK = 5;
var BLOCKS = ["BLOCK_GROUND", "BLOCK_WATER", "BLOCK_HARD_OBSTACLE", "BLOCK_SOFT_OBSTACLE", "BLOCK_BASE", "TANK", "block 6"];

var TANK_LIGHT = 1;
var TANK_MEDIUM = 2;
var TANK_HEAVY = 3;

var DIRECTION_UP = 1;
var DIRECTION_RIGHT = 2;
var DIRECTION_DOWN = 3;
var DIRECTION_LEFT = 4;

var DIRECTIONS = ["0", "DIRECTION_UP", "DIRECTION_RIGHT", "DIRECTION_DOWN", "DIRECTION_LEFT"];

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


// Init My Tank
var $INITED = false;




function PathFinding()
{
	// the world data are integers:
	// anything higher than this number is considered blocked
	// this is handy is you use numbered sprites, more than one
	// of which is walkable road, grass, mud, etc
	var maxWalkableTileNum = 0;
    this.worldWidth = 0;
    this.worldHeight = 0;


	// which heuristic should we use?
	// default: no diagonals (Manhattan)
	this.distanceFunction = ManhattanDistance;
	var findNeighbours = function(){}; // empty

	/*

	// alternate heuristics, depending on your game:

	// diagonals allowed but no sqeezing through cracks:
	var distanceFunction = DiagonalDistance;
	var findNeighbours = DiagonalNeighbours;

	// diagonals and squeezing through cracks allowed:
	var distanceFunction = DiagonalDistance;
	var findNeighbours = DiagonalNeighboursFree;

	// euclidean but no squeezing through cracks:
	var distanceFunction = EuclideanDistance;
	var findNeighbours = DiagonalNeighbours;

	// euclidean and squeezing through cracks allowed:
	var distanceFunction = EuclideanDistance;
	var findNeighbours = DiagonalNeighboursFree;

	*/

	// distanceFunction functions
	// these return how far away a point is to another

	function ManhattanDistance(Point, Goal)
	{	// linear movement - no diagonals - just cardinal directions (NSEW)
		return Math.abs(Point.x - Goal.x) + Math.abs(Point.y - Goal.y);
	}

	function DiagonalDistance(Point, Goal)
	{	// diagonal movement - assumes diag dist is 1, same as cardinals
		return Math.max( Math.abs(Point.x - Goal.x), Math.abs(Point.y - Goal.y));
	}

	function EuclideanDistance(Point, Goal)
	{	// diagonals are considered a little farther than cardinal directions
		// diagonal movement using Euclide (AC = sqrt(AB^2 + BC^2))
		// where AB = x2 - x1 and BC = y2 - y1 and AC will be [x3, y3]
		return Math.sqrt( Math.pow(Point.x - Goal.x, 2) + Math.pow(Point.y - Goal.y, 2));
	}

	// Neighbours functions, used by findNeighbours function
	// to locate adjacent available cells that aren't blocked

	// Returns every available North, South, East or West
	// cell that is empty. No diagonals,
	// unless distanceFunction function is not Manhattan
	var Neighbours = function(x, y, worldWidth, worldHeight)
	{
        var	N = y - 1,
            S = y + 1,
            E = x + 1,
            W = x - 1,
            myN = N > -1 && canWalkHere(x, N),
            myS = S < worldHeight && canWalkHere(x, S),
            myE = E < worldWidth && canWalkHere(E, y),
            myW = W > -1 && canWalkHere(W, y),
            result = [];
    
        if(myN)
        {
            result.push({x:x, y:N});
        }
        if(myE)
        {
            result.push({x:E, y:y});
        }
        if(myS)
        {
            result.push({x:x, y:S});
        }
        if(myW)
        {
            result.push({x:W, y:y});
        }
		findNeighbours(myN, myS, myE, myW, N, S, E, W, result);
		return result;
	};



	// returns boolean value (world cell is available and open)
	var canWalkHere = function(){};
    
    

	// Node function, returns a new object with Node properties
	// Used in the calculatePath function to store route costs, etc.
	var Node = function(Parent, Point, world_width)
	{

		return {
			// pointer to another Node object
			Parent:Parent,
			// array index of this Node in the world linear array
			value:Point.x + Point.y * world_width,
			// the location coordinates of this Node
			x:Point.x,
			y:Point.y,
			// the heuristic estimated cost
			// of an entire path using this node
			f:0,
			// the distanceFunction cost to get
			// from the starting point to this node
			g:0
		};
	};
    
    
    
    var isTargetFunction1 = function(pointerNode, targetNode)
    {
        return pointerNode.value == targetNode.value;
    };
    
    var isTargetFunction2 = function(pointerNode, targetNode)
    {
        //return pointerNode.value == targetNode.value;
        var is_target = false;
        if( pointerNode.x == targetNode.x)
        {
            is_target = true;
            if(pointerNode.y < targetNode.y)
            {
                for( var i = pointerNode.y + 1; i < targetNode.y; i++)
                {
                    is_target &= canWalkHere(pointerNode.x, i);
                }
            }
            else
            {
                for( var i = targetNode.y + 1; i < pointerNode.y; i++)
                {
                    is_target &= canWalkHere(pointerNode.x, i);
                }
            }
        }
        else
        if( pointerNode.y == targetNode.y)
        {
            is_target = true;
            if(pointerNode.x < targetNode.x)
            {
                for( var i = pointerNode.x + 1; i < targetNode.x; i++)
                {
                    is_target &= canWalkHere(i, pointerNode.y);
                }
            }
            else
            {
                for( var i = targetNode.x + 1; i < pointerNode.x; i++)
                {
                    is_target &= canWalkHere(i, pointerNode.y);
                }
            }
        }

        if(is_target)
        {
            console.log(targetNode);
        }

        return is_target;
    };
    
    
    /**
     * Function to evaluate
     * @param {Node} pointerNode
     * @param {Node} targetNode
     * @returns {Boolean}
     */
    var isTarget = isTargetFunction1;
    


	// Path function, executes AStar algorithm operations
    // actually calculate the a-star path!
	// this returns an array of coordinates
	// that is empty if no path is possible
    // world is a 2d array of integers (eg world[10][15] = 0)
    // pathStart and pathEnd are arrays like [5,10]
	this.findPath = function(world, pathStart, pathEnd, target_function)
	{
           
        var t0 = performance.now();
        

        // keep track of the world dimensions
        // Note that this A-star implementation expects the world array to be square: 
        // it must have equal height and width. If your game world is rectangular, 
        // just fill the array with dummy values to pad the empty space.
        var worldWidth = world[0].length;
        var worldHeight = world.length;
        var worldSize =	worldWidth * worldHeight;
        
        canWalkHere = function(x, y)
        {
            return ((world[y] != null) &&
                (world[y][x] != null) &&
                (world[y][x] <= maxWalkableTileNum));
        };

        
		// create Nodes from the Start and End x,y coordinates
		var	mypathStart = Node(null, {x:pathStart[0], y:pathStart[1]}, worldWidth);
		var mypathEnd = Node(null, {x:pathEnd[0], y:pathEnd[1]}, worldWidth);
		// create an array that will contain all world cells
		var AStar = new Array(worldSize);
		// list of currently open Nodes
		var Open = [mypathStart];
		// list of closed Nodes
		var Closed = [];
		// list of the final output array
		var result = [];
		// reference to a Node (that is nearby)
		var myNeighbours;
		// reference to a Node (that we are considering now)
		var myNode;
		// reference to a Node (that starts a path in question)
		var myPath;
		// temp integer variables used in the calculations
		var length, max, min, i, j;
		// iterate through the open list until none are left
		while(length = Open.length)
		{
			max = worldSize;
			min = -1;
			for(i = 0; i < length; i++)
			{
				if(Open[i].f < max)
				{
					max = Open[i].f;
					min = i;
				}
			}
			// grab the next node and remove it from Open array
			myNode = Open.splice(min, 1)[0];
			// is it the destination node?
            target_function = target_function || isTarget;
            var cond = target_function(myNode, mypathEnd);
            //cond = myNode.x == mypathEnd.x || myNode.y == mypathEnd.y;
			if(cond)
			{
				myPath = Closed[Closed.push(myNode) - 1];
				do
				{
					result.push([myPath.x, myPath.y]);
				}
				while (myPath = myPath.Parent);
				// clear the working arrays
				AStar = Closed = Open = [];
				// we want to return start to finish
				result.reverse();
			}
			else // not the destination
			{
				// find which nearby nodes are walkable
				myNeighbours = Neighbours(myNode.x, myNode.y, worldWidth, worldHeight);
				// test each one that hasn't been tried already
				for(i = 0, j = myNeighbours.length; i < j; i++)
				{
					myPath = Node(myNode, myNeighbours[i], worldWidth);
					if (!AStar[myPath.value])
					{
						// estimated cost of this particular route so far
						myPath.g = myNode.g + this.distanceFunction(myNeighbours[i], myNode);
						// estimated cost of entire guessed route to the destination
						myPath.f = myPath.g + this.distanceFunction(myNeighbours[i], mypathEnd);
						// remember this new path for testing above
						Open.push(myPath);
						// mark this node in the world graph as visited
						AStar[myPath.value] = true;
					}
				}
				// remember this route as having no more untested options
				Closed.push(myNode);
			}
		} // keep iterating until the Open list is empty
        
        var t1 = performance.now();
    
        echo("Find path from [", pathStart[0] , ", ", pathStart[1], "] to [", pathEnd[0], ", ", pathEnd[1], "] take " + (t1 - t0) + " s.\n");
		return result;
	};
    
    
    this.find1 = function(world, pathStart, pathEnd)
    {
        isTarget = isTargetFunction1;
        return this.findPath(world, pathStart, pathEnd);
    };
    
    this.find2 = function(world, pathStart, pathEnd)
    {
        isTarget = isTargetFunction2;
        return this.findPath(world, pathStart, pathEnd);
    };
    
    
    this.find = this.find1;
    
    
    this.setTargetFunction = function(f)
    {
        isTarget = f;
    };


} // end of findPath() function



var pathFinder = new PathFinding();


// ====================================================================================
//                        BEHIND THE SCENE. YOU CAN SAFELY SKIP THIS
//                  Note: Don't try to modify this. It can ruin your life.
// ====================================================================================

// =============================================
// Get the host and port from argurment
// =============================================

// Logger
var Logger;
try
{
    Logger = require("./NodeWS/Logger");
}
catch (e)
{
    Logger = require("./../NodeWS/Logger");
}
var logger = new Logger();

var host = "127.0.0.1";
var port = 3011;
var key = 0;

for (var i = 0; i < process.argv.length; i++)
{
    if (process.argv[i] == "-h")
    {
        host = process.argv[i + 1];
    }
    else if (process.argv[i] == "-p")
    {
        port = process.argv[i + 1];
    }
    else if (process.argv[i] == "-k")
    {
        key = process.argv[i + 1];
    }
    else if (process.argv[i] == "-l")
    {
        logger.startLogfile(process.argv[i + 1]);
    }
}
if (host === null) host = "127.0.0.1";
if (port === null) port = 3011;
if (key === null) key = 0;

// =============================================
// Some helping function
// =============================================
var EncodeInt8 = function(number)
{
    var arr = new Int8Array(1);
    arr[0] = number;
    return String.fromCharCode(arr[0]);
};
var EncodeInt16 = function(number)
{
    var arr = new Int16Array(1);
    var char = new Int8Array(arr.buffer);
    arr[0] = number;
    return String.fromCharCode(char[0], char[1]);
};
var EncodeUInt8 = function(number)
{
    var arr = new Uint8Array(1);
    arr[0] = number;
    return String.fromCharCode(arr[0]);
};
var EncodeUInt16 = function(number)
{
    var arr = new Uint16Array(1);
    var char = new Uint8Array(arr.buffer);
    arr[0] = number;
    return String.fromCharCode(char[0], char[1]);
};
var EncodeFloat32 = function(number)
{
    var arr = new Float32Array(1);
    var char = new Uint8Array(arr.buffer);

    arr[0] = number;
    return String.fromCharCode(char[0], char[1], char[2], char[3]);
};
var DecodeInt8 = function(string, offset)
{
    var arr = new Int8Array(1);
    var char = new Int8Array(arr.buffer);
    arr[0] = string.charCodeAt(offset);
    return char[0];
};
var DecodeInt16 = function(string, offset)
{
    var arr = new Int16Array(1);
    var char = new Int8Array(arr.buffer);

    for (var i = 0; i < 2; ++i)
    {
        char[i] = string.charCodeAt(offset + i);
    }
    return arr[0];
};
var DecodeUInt8 = function(string, offset)
{
    return string.charCodeAt(offset);
};
var DecodeUInt16 = function(string, offset)
{
    var arr = new Uint16Array(1);
    var char = new Uint8Array(arr.buffer);

    for (var i = 0; i < 2; ++i)
    {
        char[i] = string.charCodeAt(offset + i);
    }
    return arr[0];
};
var DecodeFloat32 = function(string, offset)
{
    var arr = new Float32Array(1);
    var char = new Uint8Array(arr.buffer);

    for (var i = 0; i < 4; ++i)
    {
        char[i] = string.charCodeAt(offset + i);
    }
    return arr[0];
};

// =============================================
// Game objects
// =============================================




function GetDistance(Point, Goal)
{
    // manhattan  distance
    return Math.abs(Point[0] - Goal[0]) + Math.abs(Point[1] - Goal[1]);
}

/**
 * Kiểm tra nếu như hai chiều là cùng nằm trên một đường thẳng ( cùng phương )
 * @param {int} dir1
 * @param {int} dir2
 * @returns {Boolean}
 */
function IsDirectionInSameWay(dir1, dir2)
{
    return dir1%4%2 === dir2%4%2;
}


/**
 * Tính toán lại hướng cần di chuyển đến
 * @param {float} x0
 * @param {float} y0
 * @param {float} x1
 * @param {float} y1
 * @returns {DIRECTION_DOWN|DIRECTION_LEFT|DIRECTION_RIGHT|DIRECTION_UP|-1}
 */
var calcLineDirectionTo = function(x0, y0, x1, y1)
{
    //calculate direction
    var dx = x1 - x0;
    var dy = y1 - y0;

    return dx > 0 && Math.abs(dy/dx) < 1 ? DIRECTION_RIGHT : dx < 0 && Math.abs(dy/dx) < 1 ? DIRECTION_LEFT : dy > 0 && Math.abs(dx/dy) < 1 ? DIRECTION_DOWN : dy < 0 && Math.abs(dx/dy) < 1 ? DIRECTION_UP : -1;
};


/**
 * Đứng từ [x, y] có nhìn thấy được [t_x, t_y]. Nhìn thấy kẻ địch
 * @param {int} x
 * @param {int} y
 * @param {int} t_x
 * @param {int} t_y
 * @param {function(BLOCK_TYPE)} visible_function Hàm đánh giá block
 * @returns {Boolean}
 */
var CanISee = function(x, y, t_x, t_y, visible_function)
{
    // point of view and target is not in a line
    if( ! ( t_x == x || t_y == y))
    {
        printf("Can I See: [%f, %f] -> [%f, %f]", x, y, t_x, t_y);
        //return false;
    }
    
    if(x == t_x && y == t_y)
    {
        return false;
    }

    var d = calcLineDirectionTo(x, y, t_x, t_y)%4; // [left, top, right, bottom][d]
    //echo("d = " + d);
    var vertical = d%2;

    var tile, i, x0 = x + 0.5 >> 0, y0 = y + 0.5 >> 0;
    var begin = vertical ? y0 : x0;
    var end   = vertical ? t_y + 0.5 >> 0 : t_x + 0.5 >> 0;
    var delta = [[-1, 0], [0, -1], [1, 0], [0, 1]][d][vertical];

    //echo("From : " + begin + " to " + end);

    //var trace = [];
    //printf("vertical = %s, For i = %s, delta = %s" , vertical, begin, delta);
    var visible = true;
    for(i = begin; delta > 0 ? i <= end : end <= i; i += delta)
    {
        //trace.push(!vertical ? [i, y0] : [x0, i]);
        tile = !vertical ? GetBrickAt(i, y0) : GetBrickAt(x0, i);
        //check for enemy tank

        //echo("tile[" + (vertical ? x0 : i) + "][" + (vertical ? i : y0) + "] = " + tile + ", " + BLOCKS[tile]);
        visible_function = visible_function || function(t){ return (t == BLOCK_GROUND || t == BLOCK_WATER); };
        if(visible_function(tile) == false)
        {
            visible = false;
            break;
        }
    }
    //echo("Can be see: ");
    //echo(trace);

    return visible;

};


// đếm số kẻ địch có thể nhìn thấy được vị trí [x, y]
function countEnemyAt(x, y)
{
    var count = 0;
    var enemies = GetEnemyList();
    for(var i in enemies)
    {
        var tank = enemies[i];
        if( Math.abs( x - tank.m_x) < 0.5 || Math.abs( y - tank.m_y) < 0.5)
        {
            if( tank.m_HP > 0)
            {
                //echo("CanISee x: ", x, ", y: ", y , ", t_x: " , tank.m_x, ", t_y: " , tank.m_y);
                if( CanISee(x, y, tank.m_x, tank.m_y))
                {
                    count++;
                }
            }
        }
    }
    //console.log("Count enemy = ", count);
    return count;
}

/**
 * 
 * @param {Number} x
 * @param {Number} y
 * @returns {Array of Bullet}
 */
function detectEnemyBullet(x, y)
{

        var bullets = [];
        for(var bullet of g_bullets[GetOpponentTeam()])
        {
            var dir1 = calcLineDirectionTo(x, y, bullet.m_x, bullet.m_y);
            var dir2 = bullet.m_direction;
            if ( bullet.m_live 
                    && ( Math.abs(x - bullet.m_x) <= 0.5 || Math.abs(y - bullet.m_y) <= 0.5)
                    // Đạn cùng phương và ngược hướng về phía tank
                    && (IsDirectionInSameWay( dir1, dir2) &&  dir1 != dir2)
                    // Có thể nhìn thấy đạn
                    && CanISee(x, y, bullet.m_x, bullet.m_y)
               )
            {
                bullets.push(bullet);
            }
        }

        return bullets;
}


function findPlaceDropBomb()
{
    /* Thứ tự chọn nơi thả bom:
     * 1. Chọn nơi có đông kẻ địch nhất, nhưng ít tank ở team mình nhất
     * 2. Chọn tank có ít HP nhất
     * 3. Chọn base
     * */

    var most;
    for( var tank of GetEnemyList())
    {
        var concentration = 0;
        for( var other of GetEnemyList())
        {
            if( tank != other)
            {
                //if( GetDistance)
            }
        }
    }
}




function Obstacle()
{
    this.m_id = 0;
    this.m_x = 0;
    this.m_y = 0;
    this.m_HP = 0;
    this.m_destructible = true;
}

function Base()
{
    this.m_id = 0;
    this.m_team = 0;
    this.m_type = 0;
    this.m_HP = 0;
    this.m_x = 0;
    this.m_y = 0;
}

function Block(x , y , block_type)
{
    this.x = x || 0;
    this.y = y || 0;
    this.type = block_type || BLOCK_GROUND;
}


function fixNumber(x)
{
        // Round up on a square, because, in javascript, sometimes:
        // 0.2 + 0.2 + 0.2 + 0.2 + 0.2 = 0.9999999...
        // Lol... ^^
        if (x % 1 < 0.05)
            x = (x >> 0);
        if (x % 1 > 0.95)
            x = (x >> 0) + 1;
        return x;
}



function Tank()
{
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
    

    this.path = [];
    this.state = [];
    this.busy = 0;
    this.inited = false;
    this.target = [];
    this.lastX = -1;
    this.lastY = -1;
    this.T = 0;
    
    var shooting = false;
    var moving = false;
    
    var that = this;
    
    //Getter
    this.getDirection = function(){ return this.m_direction; };
    this.setDirection = function(dir){ this.m_direction = dir; };
    
    // Target function to find path
    var targetFx = function(pointer, target)
    {
        //return pointer.x == target.x && pointer.y == target.y;
        // can not see if pointer and target is not in a line
        if( !(pointer.x == target.x || pointer.y == target.y))
        {
            return false;
        }
        return CanISee(pointer.x, pointer.y, target.x, target.y) && detectEnemyBullet(pointer.x, pointer.y).length  < 1;
    };
    
    /* Send request to server */
    this.sendCommand = function()
    {
        // Store state before move
        this.lastX = this.m_x;
        this.lastY = this.m_y;
        
        //Send command to server
        CommandTank(this.m_id, this.m_direction, moving, shooting);
        
        //Reset
        shooting = false;
        moving   = false;
    };
    
    
    //
    this.goForward = function()
    {
        moving = true;
    };
    
    this.goBackward = function()
    {
        var L = [DIRECTION_UP, DIRECTION_LEFT, DIRECTION_RIGHT, DIRECTION_DOWN];
        this.setDirection(L.reverse()[L.indexOf(this.m_direction)]);
        moving = true;
    };
    
    this.getTileLeft = function()
    {
        return GetTileAt(this.m_x - 1, this.m_y, this.m_id);
    };
    
    this.getTileUp = function()
    {
        return GetTileAt(this.m_x, this.m_y - 1, this.m_id);
    };
    
    this.getTileRight = function()
    {
        return GetTileAt(this.m_x + 1, this.m_y, this.m_id);
    };
    
    this.getTileDown = function()
    {
        return GetTileAt(this.m_x, this.m_y + 1, this.m_id);
    };
    
    this.getTileForward = function()
    {
        if(this.m_direction === DIRECTION_LEFT)
        {
            return this.getTileLeft();
        }
        if(this.m_direction === DIRECTION_UP)
        {
            return this.getTileUp();
        }
        if(this.m_direction === DIRECTION_RIGHT)
        {
            return this.getTileRight();
        }
        if(this.m_direction === DIRECTION_DOWN)
        {
            return this.getTileDown();
        }
        return -1;
    };
    
    /* Look at something forward */
    this.lookForward = function()
    {
        //echo("Direction: " + direction + ", " + DIRECTIONS[direction]);
        var d = this.m_direction % 4; // [left, top, right, bottom][d]
        //echo("d = " + d);
        var vertical = d%2;
        
        var tile, i, x0 = this.m_x + 0.5 | 0, y0 = this.m_y + 0.5 | 0;
        var begin = vertical ? y0 : x0;
        var end   = vertical ? MAP_H : MAP_W;
        echo("d = " + d);
        var delta = [[-1, 0], [0, -1], [1, 0], [0, 1]][d][vertical];
        
        echo("From : " + begin + " to " + end);

        //echo("vertical = " + vertical + ", For i = " + begin + ", delta =" + L[d][vertical]);

        for(i = begin; delta > 0 ? i <= end : end <= i; i += delta)
        {
            tile = !vertical ? GetTileAt(i, y0, this.m_id) : GetTileAt(x0, i, this.m_id);
            //check for enemy tank

            //echo("tile[" + (vertical ? x0 : i) + "][" + (vertical ? i : y0) + "] = " + tile + ", " + BLOCKS[tile]);
            if(tile != BLOCK_GROUND)
            {
                break;
            }
        }
        return !vertical ? new Block( i, y0, tile) : new Block( x0, i, tile);
    };
    
    
    // Chạy đến một trị trí cùng nằm trên một đường thẳng nằm ngang, hoặc thẳng đứng
    this.jumpTo = function(x, y)
    {
    	//Không làm gì nếu điểm đến là điểm đang đứng
        if((this.m_x == x && this.m_y == y))
        {
        	printf(">> Tank %d: [x0, y0] == [x, y]. Skip to next point.", this.m_id);
            return false;
        }
        
        // Chia làm 2 đường thẳng nếu đường đi là đường chéo
        if( (x - this.m_x)*(y - this.m_y) != 0)
        {
            //printf("\n");
            printf("View here: ");
            printf("path: ");
            var_dump(this.path);
            var p = this.path.pop();
            printf("Tank %d is at [%f, %f]  to [%f, %f] ", this.m_id, this.m_x, this.m_y, x, y);
            printf(">> Split path: Tank" + this.m_id + " , p = [" + p.toString() + "]");
            if( this.CheckForCollision(this.m_x, p[1]))
            {
                this.path.push([p[0], p[1]]);
                this.path.push([this.m_x, p[1]]);
                printf("Path X selected.");
                var_dump(this.path);
            }
            else
            if( this.CheckForCollision(p[0], this.m_y))
            {
                this.path.push([p[0], p[1]]);
                this.path.push([p[0], this.m_y]);
                printf("Path Y selected.");
                var_dump(this.path);

            }
            else
            {
                this.path.push(p);
                printf("No path can be selected.");
            }
            printf("End view.\n");
            return;
        }
        
        
         
        //echo(this.m_x + "," + this.m_y + "," + this.lastX + "," + this.lastY + "\n");
        //Update path if tank can not move with old path
        //echo(`GetTileAt(${x}, ${y}) = ` + BLOCKS[GetTileAt(x, y)]);

        //calculate direction
        var dir = this.calcLineDirectionTo(x, y);

        if(dir > -1)
        {
            //if( this.m_id == 3)
            //echo("inside Tank " + this.m_id + " is at [" + this.m_x + ", " + this.m_y + "], and will jump to [" + x + ", " + y + "] ");
            this.setDirection(dir);
            /*
	        if(this.m_x >= 19 && this.m_id == 0)
	        {
	        	echo(">> Tank " + this.m_id + " calculate dir = " + DIRECTIONS[this.getDirection()]);
	    	}
            */
            this.goForward();
        }
        else
        {
            printf(" >>> Tank %d stop.", this.m_id);
            this.stop();
        }
        
        //var tile = this.getTileForward();
        //if( this.m_id == 0)
        {
            //printf("Tank %d: [%f, %f] -> [%f, %f] ", this.m_id, this.m_x, this.m_y, x, y);
        }
        //echo(`Tank${this.m_id}.getTileForward = ` + BLOCKS[this.getTileForward()] + ", dir=" + DIRECTIONS[this.m_direction]);
        
        
        
        
        // Move the tank to an imaginary position first
        var newX = this.m_x;
        var newY = this.m_y;
        var newPositionOK = false;
        if (this.m_direction == DIRECTION_UP)
        {
            newY = this.m_y - this.m_speed;
        }
        else if (this.m_direction == DIRECTION_DOWN)
        {
            newY = this.m_y + this.m_speed;
        }
        else if (this.m_direction == DIRECTION_LEFT)
        {
            newX = this.m_x - this.m_speed;
        }
        else if (this.m_direction == DIRECTION_RIGHT)
        {
            newX = this.m_x + this.m_speed;
        }


        newX = fixNumber(newX);
        newY = fixNumber(newY);

        // Check to see if that position is valid (no collision)
        newPositionOK = this.CheckForCollision(newX, newY) ;


        if( !(this.m_x == x && this.m_y == y) && !newPositionOK)
        {
            printf("Tank[%d] updated path because collision.", this.m_id);
            this.updatePathToTarget();
            var_dump(this.path);
        }
        
    };
    
    // Tính toán hướng cần di chuyển đến
    this.calcLineDirectionTo = function(x, y)
    {
        return calcLineDirectionTo(this.m_x, this.m_y, x, y);
    };
    
    // Đi đến một vị trí bất kì.
    this.goTo = function(x, y)
    {
        x = Math.ceil(x);
        y = Math.ceil(y);
        
        //Đặt mục tiêu tại điểm [x, y]
        this.target = [x, y];
        
        // Tìm đường đi đến mục tiêu
        var path = pathFinder.find1(GetMap(this.m_id), [this.m_x >> 0, this.m_y >> 0], [x, y]);
        this.path = path.reverse();
        // remove start position
        this.path.pop();
        
        //echo(`>>> Tank ${this.m_id} Find path from  = [${this.m_x | 0}, ${this.m_y | 0}] to [${x}, ${y}]`);
        //echo(this.path);
        //echo(GetMap());
    };
    
    this.updatePathToTarget = function()
    {
    	echo("\n\n");
    	printf("Tank %d -> updatePath();", this.m_id);
        if( !this.target)
        {
            echo("Tank " + this.m_id + " :  Target is null. Not update");
            return false;
        }
        
        echo("Tank " + this.m_id + " :  ");
        //echo(this.path);
        
        var x = this.target[0], y = this.target[1];
        
        // Try to goto target
        this.goTo(x, y);
        

        if(this.path.length == 0)
        {
        	echo("Update fail.");
        }
        
        echo("Tank " + this.m_id + " -> updatePath() finish.\n\n");
        
        
        
    };
    
    this.stop = function()
    {
        moving = false;
    };
    
    this.shoot = function(b)
    {
        b = (b !== undefined) ? b : 1;
        shooting = true;
    };
    
    this.setPath = function(p)
    {
       this.path = p.reverse(); 
    };
    
    
    
    this.CheckForCollision = function (newX, newY)
    {


		// Check landscape
		var roundedX = newX >> 0;
		var roundedY = newY >> 0;
		var squareNeedToCheckX = new Array();
		var squareNeedToCheckY = new Array();
		
		// Find the square the tank occupy (even part of)
		if (newX == roundedX && newY == roundedY)
        {
			squareNeedToCheckX.push (roundedX); squareNeedToCheckY.push (roundedY);
		}
		else if (newX != roundedX && newY == roundedY)
        {
			squareNeedToCheckX.push (roundedX); squareNeedToCheckY.push (roundedY);
			squareNeedToCheckX.push (roundedX+1); squareNeedToCheckY.push (roundedY);
		}
		else if (newX == roundedX && newY != roundedY)
        {
			squareNeedToCheckX.push (roundedX); squareNeedToCheckY.push (roundedY);
			squareNeedToCheckX.push (roundedX); squareNeedToCheckY.push (roundedY+1);
		}
		else if (newX != roundedX && newY != roundedY)
        {
			squareNeedToCheckX.push (roundedX); squareNeedToCheckY.push (roundedY);
			squareNeedToCheckX.push (roundedX+1); squareNeedToCheckY.push (roundedY);
			squareNeedToCheckX.push (roundedX); squareNeedToCheckY.push (roundedY+1);
			squareNeedToCheckX.push (roundedX+1); squareNeedToCheckY.push (roundedY+1);
		}
		
		// Check if that square is invalid
		for (var i=0; i<squareNeedToCheckX.length; i++)
        {
			var x = squareNeedToCheckX[i];
			var y = squareNeedToCheckY[i];
            var tile = g_map[y * MAP_W + x];
			if (    tile == BLOCK_WATER
                ||  tile == BLOCK_HARD_OBSTACLE
                ||  tile == BLOCK_SOFT_OBSTACLE
                ||  tile == BLOCK_BASE
               )
            {
                //echo("... square is invalid... g["+y+"][ "+ x +" ] = " + BLOCKS[g_map[y * MAP_W + x]]);
                //echo("newX = " +  newX + ", newY = " + newY);
				return false;
			}
		}
		
        
     
        
        
		// If landscape is valid, time to check collision with other tanks.
        var TT = [TEAM_1, TEAM_2]; 
        for(var k in TT)
        {
            var e = TT[k];
            for (var i=0; i < g_tanks[e].length; i++)
            {
                if (this.m_team == e && this.m_id == i)
                {
                    continue;
                }
                var tempTank = g_tanks[e][i];
                if (Math.abs(newX - tempTank.m_x) < 0.99999 && Math.abs(newY - tempTank.m_y) < 0.99999)
                {
                    //if(g_team == e)
                    {
                        //echo("... tank " + this.m_id + " collision with tank "+ tempTank.m_id + ",  direction = " + DIRECTIONS[tempTank.m_direction] + ",  " + DIRECTIONS[this.m_direction]);
                        //echo("[X, Y] = [" + this.m_x + ", " + this.m_y + "]");
                        //echo("[NewX, NewY] = [" + newX + ", " + newY + "] , [tempTank.m_x, tempTank.m_y] = [" + tempTank.m_x + ", " + tempTank.m_y + "]");
                    }
                    return false;
                }
            }
        }
        
		
		return true;
	};
    
    this.getPathDirection = function()
    {
        if(this.path.length > 0)
        {
            return this.calcLineDirectionTo(this.path[this.path.length-1][0], this.path[this.path.length-1][1]);
        }
        return this.m_direction;
    };
    
    
    this.findAnEnemyToShoot = function()
    {
            // get enemy that they are alive
            var enemys = GetEnemyList().filter(e => e.m_HP > 0);

            //sort by distance to me
            enemys = enemys.sort( function(t1, t2)
            {
                var d1 = GetDistance([that.m_x, that.m_y], [t1.m_x, t1.m_y]);
                var d2 = GetDistance([that.m_x, that.m_y], [t2.m_x, t2.m_y]);
                //echo("Compare distance " + d1 + " .... " + d2);
                return  d1 - d2;
            });

            //echo("Enemy: ");
            //echo(enemys.map((e) => "Tank " + e.m_id + ": " + GetDistance([this.m_x, this.m_y], [e.m_x, e.m_y])));
            // smallest distance;
            //printf("Enemy.length: %s.", enemys.length);
            if(enemys.length == 0)
            {
                return;
            }
            
            for(var i = 0; i < enemys.length; i++)
            {
                var tank = enemys[i];
                if( tank.m_HP > 0)
                {
                    this.target = [tank.m_x, tank.m_y];
                    var path = pathFinder.findPath(GetMap(this.m_id), [this.m_x >> 0, this.m_y >> 0], [tank.m_x, tank.m_y], targetFx);
                    this.path = path.reverse();
                    this.path.pop();
                    printf(" Tank %d find path for find enemy of tank ", this.m_id);
                    var_dump(this.path);
                    // Tồn tại đường đi từ tank tới tank
                    if(this.path.length > 0)
                    {
                        return tank;
                    }
                }
            }
            //find enemy base
            if(this.path.length == 0)
            {
                var path = pathFinder.findPath(GetMap(this.m_id), [this.m_x >> 0, this.m_y >> 0], [ g_bases[GetOpponentTeam()][2].m_x, g_bases[GetOpponentTeam()][2].m_y], function(tile)
                {
                    return !( tile == BLOCK_GROUND  || tile == BLOCK_WATER || tile == BLOCK_SOFT_OBSTACLE );
                });
                this.path = path.reverse();
                this.path.pop();
                
                printf(" Tank %d find path for base. ", this.m_id);
                var_dump(this.path);
                return false;
            }
            
    };
    
    this.goToSafeZone = function()
    {
        // Don't need run away if no danger
        if(this.detectBullet() < 1)
        {
            return;
        }
        else
        {
            printf("Tank %d detect bullet.", this.m_id);
        }
        printf("Tank %d go to safezone.", this.m_id);
        
        var path = pathFinder.findPath(GetMap(this.m_id), [this.m_x >> 0, this.m_y >> 0], [this.target[0] >> 0, this.target[1] >> 0], function(pointer, target)
        {
            //printf("Number of bullet at mine [%d, %d] is %d", that.m_x, that.m_y, that.detectBullet());
            //printf("Number of bullet at [%d, %d] is %d." , pointer.x, pointer.y, detectEnemyBullet(pointer.x, pointer.y));
            return detectEnemyBullet(pointer.x, pointer.y).length < 1 && that.CheckForCollision(pointer.x, pointer.y);
        });
        
        this.path = path.reverse();
        this.path.pop();
        var_dump(this.path);
       
    };
    
    this.detectBullet = function()
    {
        return detectEnemyBullet(this.m_x, this.m_y);
    };
    
    /**
     * Tank use it to move
     * @returns {undefined}
     */
    this.updatePosition = function()
    {
        //console.log("target[0] = " + target[0] + ", target[1] = " + target[1] + ", t.m_x = " + t.m_x + ", t.m_y = " + t.m_y);

        while(this.path.length > 0)
        {
            // get next position
            var next = this.path[this.path.length-1];
            // Get next position is current is my position
            if(next[0] == this.m_x && next[1] == this.m_y)
            {
                /* Tạm thời: Cập nhật path sau mỗi bước di chuyển, vì kẻ địch cũng di chuyển*/
                //this.updatePath();
                /**/

                this.path.pop();
                //get next target
                next = this.path[this.path.length-1];
            }
            else
            {
                this.jumpTo(next[0], next[1]);
                break;
            }
        }
    };
    
    
    this.update = function()
    {
        
        //printf("\n\nTank %d -> update();", this.m_id);
        
        /*
        if( this.path.length == 0 && this.target.length &&  !( this.m_x == this.target[0] && this.m_y == this.target[1]) )
        {
        	//echo("path is empty. try go to target to get path.");
            //this.goTo( this.target[0], this.target[1]);
        }
        */
       
       /* ******************************************** 
        * ************* 1. EVALUATE ******************
        * ******************************************** 
        * */
        

        var shootEnemy = -1;
        var detectedBulletList = this.detectBullet();
        var detectedTankList = [];
        
        // Đánh giá kẻ địch xung quanh
        var enemys = GetEnemyList();
        for(var i in enemys)
        {
            var tank = enemys[i];
            // check if my tank can get bullet from another.
            if( Math.abs( this.m_x - tank.m_x) < 0.5 || Math.abs( this.m_y - tank.m_y) < 0.5)
            {
                if( tank.m_HP > 0)
                {
                    printf(">>> Tank %s at [%f, %f] in a line with tank Tank %s at [%f, %f].", this.m_id, this.m_x, this.m_y, tank.m_id, tank.m_x, tank.m_y);
                    if(this.canBeSee(tank.m_x, tank.m_y))
                    {
                        printf(">>> Tank %s saw tank Tank %s .", this.m_id, tank.m_id);
                        detectedTankList.push(tank);
                    }
                }
            }
        }
        


       /* ******************************************** 
        * ************* 2. DECISION ******************
        * ******************************************** 
        * */
       
       /* Process with enemy tank */

        if(detectedTankList.length > 0)
        {
            // shoot at first tank that I see
            this.setDirection( this.calcLineDirectionTo(tank.m_x, tank.m_y));
            //printf("Tank[%s][%s] saw tank Tank[%s][%s] .Set direction to %s .", this.m_team, this.m_id, tank.m_team, tank.m_id, DIRECTIONS[this.getDirection()]);
            //echo("From [" + this.m_x + ", " + this.m_y + "] to [" + tank.m_x + ", " + tank.m_y + "].");
            this.shoot(true);
            shootEnemy = tank.m_id;
            // keep moving if their direction in a line
            if( IsDirectionInSameWay( this.getPathDirection(), tank.getDirection()) == false)
            {
                //this.path = [];
            }
        }

       
       
        //shoot at base
        if(shootEnemy == -1 && this.path.length == 0)
        {
            var base = g_bases[GetOpponentTeam()][0];
            if( this.m_y > 9.5 && this.m_y < 11.5 || ( (GetOpponentTeam() == TEAM_1 && this.m_x < 1.5 ) || (GetOpponentTeam() == TEAM_2 && this.m_x > 18.5 ) ) )
            {
                this.setDirection( this.calcLineDirectionTo(base.m_x, base.m_y));
                this.shoot(true);
            }
        }

        if( this.path.length == 0)
        {
            /* Làm thế nào để tìm kẻ địch khi mà nó cứ liên tục di chuyển không ở một chỗ*/
            this.findAnEnemyToShoot();
            
        }




       /* ******************************************** 
        * ************* 3. PROCCESS  *****************
        * ******************************************** 
        * */

       this.updatePosition();
       
       
       
    };
    
    
    
    this.canBeSee = function(t_x, t_y)
    {
        return CanISee(this.m_x, this.m_y, t_x, t_y);  
    };
    
    
    this.coutObstaclesFrom = function(t_x, t_y)
    {

        var d = this.calcLineDirectionTo(t_x, t_y)%4; // [left, top, right, bottom][d]
        //echo("d = " + d);
        var vertical = d%2;
        
        var tile, i, x0 = this.m_x + 0.5 >> 0, y0 = this.m_y + 0.5 >> 0;
        var begin = vertical ? y0 : x0;
        var end   = vertical ? t_y + 0.5 >> 0 : t_x + 0.5 >> 0;
        echo("d = " + d);
        var delta = [[-1, 0], [0, -1], [1, 0], [0, 1]][d][vertical];
        
        echo("From : " + begin + " to " + end);

        //var trace = [];
        //echo("vertical = " + vertical + ", For i = " + begin + ", delta =" + L[d][vertical]);
        var price = 0;
        for(i = begin; delta > 0 ? i <= end : end <= i; i += delta)
        {
            //trace.push(!vertical ? [i, y0] : [x0, i]);
            tile = !vertical ? GetBrickAt(i, y0) : GetBrickAt(x0, i);
            //check for enemy tank

            //echo("tile[" + (vertical ? x0 : i) + "][" + (vertical ? i : y0) + "] = " + tile + ", " + BLOCKS[tile]);
            if(!(tile == BLOCK_GROUND || tile == BLOCK_WATER))
            {
                price += BLOCK_OBSTACLNESS[tile];
            }
        }
        
        return price;
        
    };
    
    
    
    
    
   
}


function GetMyTeamList()
{
    return g_tanks[GetMyTeam()];
}

function GetEnemyList()
{
    return g_tanks[GetOpponentTeam()];
}
function GetEnemyBasePlaces()
{
    return 0;
}


/* Get map for path finding, exclude tank that get map */
function GetMap(tank_id)
{
    // Chuyển map 1 chiều thành map 2 chiều
    var l = [];
    for(var i = 0; i < MAP_H; i++)
    {
        l[i] = [];
        for(var j = 0; j < MAP_W; j++)
        {
            l[i][j] = g_map[i*MAP_W + j];
        }
    }
    
    //Đặt những vị trí tank đang chiếm giữ
    var h = GetEnemyList();
    for(var k in h)
    {
        var e = h[k];
        // những con đã chết sẽ là vật cản
        //if(e.m_HP == 0)
        {
	        var t_x = e.m_x, t_y = e.m_y;
	        l[Math.floor(t_y)][Math.floor(t_x)] = BLOCK_TANK;
	        l[Math.ceil(t_y)][Math.ceil(t_x)] = BLOCK_TANK;
	        l[Math.floor(t_y)][Math.ceil(t_x)] = BLOCK_TANK;
	        l[Math.ceil(t_y)][Math.floor(t_x)] = BLOCK_TANK;
    	}
    }
    
    h = GetMyTeamList();
    for(var k in h)
    {
        var e = h[k];
        // Bỏ qua vị trí mà nó đang đứng &&  bỏ qua những con đã chết
        if( e.m_id != tank_id /*&& e.m_HP == 0*/)
        //if(e.m_HP == 0)
        {
	        var t_x = e.m_x, t_y = e.m_y;
	        l[Math.floor(t_y)][Math.floor(t_x)] = BLOCK_TANK;
	        l[Math.ceil(t_y)][Math.ceil(t_x)] = BLOCK_TANK;
	        l[Math.floor(t_y)][Math.ceil(t_x)] = BLOCK_TANK;
	        l[Math.ceil(t_y)][Math.floor(t_x)] = BLOCK_TANK;
    	}
    }
    
    //echo(l);
    
    return l;
}


function Bullet()
{
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

function Strike()
{
    this.m_id = 0;
    this.m_x = 0;
    this.m_y = 0;
    this.m_team = TEAM_1;
    this.m_type = POWERUP_AIRSTRIKE;
    this.m_countDown = 0;
    this.m_live = false;
}

function PowerUp()
{
    this.m_id = 0;
    this.m_active = 0;
    this.m_type = 0;
    this.m_x = 0;
    this.m_y = 0;
}
var g_team = -1;
var g_state = STATE_WAITING_FOR_PLAYERS;
var g_map = [];
var g_obstacles = [];
var g_hardObstacles = [];
var g_tanks = [];
g_tanks[TEAM_1] = [];
g_tanks[TEAM_2] = [];
var g_bullets = [];
g_bullets[TEAM_1] = [];
g_bullets[TEAM_2] = [];
var g_bases = [];
g_bases[TEAM_1] = [];
g_bases[TEAM_2] = [];
var g_powerUps = [];
var g_strikes = [];
g_strikes[TEAM_1] = [];
g_strikes[TEAM_2] = [];

var g_matchResult;
var g_inventory = [];
g_inventory[TEAM_1] = [];
g_inventory[TEAM_2] = [];

var g_timeLeft = 0;

// =============================================
// Protocol - Sending and updating
// =============================================
var WebSocket;
try
{
    WebSocket = require("./NodeWS");
}
catch (e)
{
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


socket = WebSocket.connect("ws://" + host + ":" + port, [], function()
{
    logger.print("Socket connected");
    socketStatus = SOCKET_CONNECTED;
    SendKey();
});
socket.on("error", function(code, reason)
{
    socketStatus = SOCKET_IDLE;
    logger.print("Socket error: " + code);
});
socket.on("text", function(data)
{
    OnMessage(data);
});
socketStatus = SOCKET_CONNECTING;


function Send(data)
{
    //console.log ("Socket send: " + PacketToString(data));
    socket.sendText(data);
}

function OnMessage(data)
{
    // console.log ("Data received: " + PacketToString(data));

    var readOffset = 0;

    while (true)
    {
        var command = DecodeUInt8(data, readOffset);
        readOffset++;

        if (command == COMMAND_SEND_TEAM)
        {
            g_team = DecodeUInt8(data, readOffset);
            readOffset++;
        }
        else if (command == COMMAND_UPDATE_STATE)
        {
            var state = DecodeUInt8(data, readOffset);
            readOffset++;

            if (g_state == STATE_WAITING_FOR_PLAYERS && state == STATE_TANK_PLACEMENT)
            {
                g_state = state;
                setTimeout(OnPlaceTankRequest, 100);
            }
        }
        else if (command == COMMAND_UPDATE_MAP)
        {
            g_hardObstacles = [];
            for (var i = 0; i < MAP_W; i++)
            {
                for (var j = 0; j < MAP_H; j++)
                {
                    g_map[j * MAP_W + i] = DecodeUInt8(data, readOffset);
                    readOffset += 1;
					if (g_map[j * MAP_W + i] == BLOCK_HARD_OBSTACLE)
					{
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
        else if (command == COMMAND_UPDATE_TIME)
        {
            g_timeLeft = DecodeInt16(data, readOffset);
            readOffset += 2;
        }
        else if (command == COMMAND_UPDATE_OBSTACLE)
        {
            readOffset += ProcessUpdateObstacleCommand(data, readOffset);
        }
        else if (command == COMMAND_UPDATE_TANK)
        {
            readOffset += ProcessUpdateTankCommand(data, readOffset);
        }
        else if (command == COMMAND_UPDATE_BULLET)
        {
            readOffset += ProcessUpdateBulletCommand(data, readOffset);
        }
        else if (command == COMMAND_UPDATE_BASE)
        {
            readOffset += ProcessUpdateBaseCommand(data, readOffset);
        }
        else if (command == COMMAND_MATCH_RESULT)
        {
            readOffset += ProcessMatchResultCommand(data, readOffset);
        }
        else if (command == COMMAND_UPDATE_POWERUP)
        {
            readOffset += ProcessUpdatePowerUpCommand(data, readOffset);
        }
        else if (command == COMMAND_UPDATE_STRIKE)
        {
            readOffset += ProcessUpdateStrikeCommand(data, readOffset);
        }
        else if (command == COMMAND_UPDATE_INVENTORY)
        {
            readOffset += ProcessUpdateInventoryCommand(data, readOffset);
        }
        else if (command == COMMAND_REQUEST_CONTROL)
        {
            Update();
        }
        else
        {
            readOffset++;
            logger.print("Invalid command id: " + command);
        }

        if (readOffset >= data.length)
        {
            break;
        }
    }
}

function SendKey()
{
    if (socketStatus == SOCKET_CONNECTED)
    {
        var packet = "";
        packet += EncodeUInt8(COMMAND_SEND_KEY);
        packet += EncodeInt8(key);
        Send(packet);
    }
}



function ProcessUpdateObstacleCommand(data, originalOffset)
{
    var offset = originalOffset;
    var id = DecodeUInt8(data, offset);
    offset++;
    var x = DecodeUInt8(data, offset);
    offset++;
    var y = DecodeUInt8(data, offset);
    offset++;
    var HP = DecodeUInt8(data, offset);
    offset++;

    if (g_obstacles[id] == null)
    {
        g_obstacles[id] = new Obstacle();
    }
    g_obstacles[id].m_id = id;
    g_obstacles[id].m_x = x;
    g_obstacles[id].m_y = y;
    g_obstacles[id].m_HP = HP;

    return offset - originalOffset;
}

function ProcessUpdateTankCommand(data, originalOffset)
{
    var offset = originalOffset;
    var id = DecodeUInt8(data, offset);
    offset++;
    var team = DecodeUInt8(data, offset);
    offset++;
    var type = DecodeUInt8(data, offset);
    offset++;
    var HP = DecodeUInt16(data, offset);
    offset += 2;
    var dir = DecodeUInt8(data, offset);
    offset++;
    var speed = DecodeFloat32(data, offset);
    offset += 4;
    var ROF = DecodeUInt8(data, offset);
    offset++;
    var cooldown = DecodeUInt8(data, offset);
    offset++;
    var damage = DecodeUInt8(data, offset);
    offset++;
    var disabled = DecodeUInt8(data, offset);
    offset++;
    var x = DecodeFloat32(data, offset);
    offset += 4;
    var y = DecodeFloat32(data, offset);
    offset += 4;

    if (g_tanks[team][id] == null)
    {
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

function ProcessUpdateBulletCommand(data, originalOffset)
{
    var offset = originalOffset;
    var id = DecodeUInt8(data, offset);
    offset++;
    var live = DecodeUInt8(data, offset);
    offset++;
    var team = DecodeUInt8(data, offset);
    offset++;
    var type = DecodeUInt8(data, offset);
    offset++;
    var dir = DecodeUInt8(data, offset);
    offset++;
    var speed = DecodeFloat32(data, offset);
    offset += 4;
    var damage = DecodeUInt8(data, offset);
    offset++;
    var hit = DecodeUInt8(data, offset);
    offset++; // not used 
    var x = DecodeFloat32(data, offset);
    offset += 4;
    var y = DecodeFloat32(data, offset);
    offset += 4;

    if (g_bullets[team][id] == null)
    {
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

function ProcessUpdatePowerUpCommand(data, originalOffset)
{
    var offset = originalOffset;
    var id = DecodeUInt8(data, offset);
    offset++;
    var active = DecodeUInt8(data, offset);
    offset++;
    var type = DecodeUInt8(data, offset);
    offset++;
    var x = DecodeFloat32(data, offset);
    offset += 4;
    var y = DecodeFloat32(data, offset);
    offset += 4;

    if (g_powerUps[id] == null)
    {
        g_powerUps[id] = new PowerUp();
    }
    g_powerUps[id].m_id = id;
    g_powerUps[id].m_active = active;
    g_powerUps[id].m_type = type;
    g_powerUps[id].m_x = x;
    g_powerUps[id].m_y = y;

    return offset - originalOffset;
}

function ProcessUpdateBaseCommand(data, originalOffset)
{
    var offset = originalOffset;
    var id = DecodeUInt8(data, offset);
    offset++;
    var team = DecodeUInt8(data, offset);
    offset++;
    var type = DecodeUInt8(data, offset);
    offset++;
    var HP = DecodeUInt16(data, offset);
    offset += 2;
    var x = DecodeFloat32(data, offset);
    offset += 4;
    var y = DecodeFloat32(data, offset);
    offset += 4;

    if (g_bases[team][id] == null)
    {
        g_bases[team][id] = new Base();
    }
    g_bases[team][id].m_id = id;
    g_bases[team][id].m_team = team;
    g_bases[team][id].m_type = type;
    g_bases[team][id].m_HP = HP;
    g_bases[team][id].m_x = x;
    g_bases[team][id].m_y = y;

    return offset - originalOffset;
}

function ProcessUpdateInventoryCommand(data, originalOffset)
{
    g_inventory[TEAM_1] = new Array();
    g_inventory[TEAM_2] = new Array();

    var offset = originalOffset;
    var number1 = DecodeUInt8(data, offset);
    offset++;
    for (var i = 0; i < number1; i++)
    {
        g_inventory[TEAM_1][i] = DecodeUInt8(data, offset);
        offset++;
    }
    var number2 = DecodeUInt8(data, offset);
    offset++;
    for (var i = 0; i < number2; i++)
    {
        g_inventory[TEAM_2][i] = DecodeUInt8(data, offset);
        offset++;
    }

    return offset - originalOffset;
}

function ProcessUpdateStrikeCommand(data, originalOffset)
{
    var offset = originalOffset;
    var id = DecodeUInt8(data, offset);
    offset++;
    var team = DecodeUInt8(data, offset);
    offset++;
    var type = DecodeUInt8(data, offset);
    offset++;
    var live = DecodeUInt8(data, offset);
    offset++;
    var countDown = DecodeUInt8(data, offset);
    offset++;
    var x = DecodeFloat32(data, offset);
    offset += 4;
    var y = DecodeFloat32(data, offset);
    offset += 4;

    if (g_strikes[team][id] == null)
    {
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

function ProcessMatchResultCommand(data, originalOffset)
{
    var offset = originalOffset;
    g_matchResult = DecodeUInt8(data, offset);
    offset++;
    g_state = STATE_FINISHED; //update state for safety, server should also send a msg update state

    return offset - originalOffset;
}

// An object to hold the command, waiting for process
function ClientCommand()
{
    this. g_direction = 0;
    this. g_path = "";
    this. g_move = false;
    this. g_shoot = false;
    this. g_dirty = false;
}
var clientCommands = new Array();
for (var i = 0; i < NUMBER_OF_TANK; i++)
{
    clientCommands.push(new ClientCommand());
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
// order to defend their bases and at the same time, try to destroy their enemy’s   //
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
//   + If both team have the same bases remaining, the game will change to “Sudden  //
//   Death” mode. In Sudden Death mode:                                             //
//     * 2 teams will play for extra 30 seconds.                                    //
//     * All destructible obstacles are removed.                                    //
//     * If 1 team can destroy any base, they are the winner.                       //
//     * After Sudden Death mode is over, the team has more tanks remaining is the  //
//     winner.                                                                      //
//   + The time is over. If it’s an active game (i.e. Some tanks and/or bases are   // 
//   destroyed), the result is a DRAW. If nothing is destroyed, it’s a BAD_DRAW.    //
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




// ====================================================================================
// COMMAND FUNCTIONS: THESE ARE FUNCTIONS THAT HELP YOU TO CONTROL YOUR LITTLE ARMY
// ====================================================================================

// You call this function inside OnPlaceTankRequest() 4 times, to pick and place your tank.
// First param is the tank you want to use: TANK_LIGHT, TANK_MEDIUM or TANK_HEAVY.
// Then the coordinate you want to place. Must be integer.
function PlaceTank(type, x, y)
{
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
function CommandTank(id, turn, move, shoot)
{
    // Save to a list of command, and send later
    // This is to prevent player to send duplicate command.
    // Duplicate command will overwrite the previous one.
    // We just send one.
    // Turn can be null, it won't change a tank direction.
    if (turn != null)
    {
        clientCommands[id].m_direction = turn;
    }
    else
    {
        clientCommands[id].m_direction = g_tanks[g_team][id].m_direction;
    }

    clientCommands[id].m_move = move;
    clientCommands[id].m_shoot = shoot;
    
    clientCommands[id].m_dirty = true;
    //clientCommands[id].m_path = JSON.stringify(g_tanks[g_team][id].path);
}


// You call this function to use the Airstrike powerup on a position
// Param is coordination. Can be float or integer.
// WARNING: ALL POWERUP ARE FRIENDLY-FIRE ENABLED.
// YOUR TANK OR YOUR BASE CAN BE HARM IF IT'S INSIDE THE AOE OF THE STRIKE
function UseAirstrike(x, y)
{
    if (HasAirstrike())
    {
        g_commandToBeSent += EncodeUInt8(COMMAND_CONTROL_USE_POWERUP);
        g_commandToBeSent += EncodeUInt8(POWERUP_AIRSTRIKE);
        g_commandToBeSent += EncodeFloat32(x);
        g_commandToBeSent += EncodeFloat32(y);
    }
}
// Same as above, but EMP instead of Airstrike.
function UseEMP(x, y)
{
    if (HasEMP())
    {
        g_commandToBeSent += EncodeUInt8(COMMAND_CONTROL_USE_POWERUP);
        g_commandToBeSent += EncodeUInt8(POWERUP_EMP);
        g_commandToBeSent += EncodeFloat32(x);
        g_commandToBeSent += EncodeFloat32(y);
    }
}

// This function is called at the end of the function Update or OnPlaceTankRequest.
// I've already called it for you, don't delete it.
function SendCommand()
{
    // Send all pending command
    for (var i = 0; i < NUMBER_OF_TANK; i++)
    {
        if (clientCommands[i].m_dirty == true)
        {
            g_commandToBeSent += EncodeUInt8(COMMAND_CONTROL_UPDATE);
            g_commandToBeSent += EncodeUInt8(i);
            g_commandToBeSent += EncodeUInt8(clientCommands[i].m_direction);
            g_commandToBeSent += EncodeUInt8(clientCommands[i].m_move);
            g_commandToBeSent += EncodeUInt8(clientCommands[i].m_shoot);
            //g_commandToBeSent += clientCommands[i].m_path;

            clientCommands.m_dirty = false;
        }
    }
    Send(g_commandToBeSent);
    g_commandToBeSent = "";
}

// ====================================================================================
// HELPING FUNCTIONS: THESE ARE FUNCTIONS THAT HELP YOU RETRIEVE GAME VARIABLES
// ====================================================================================
function GetTileAt(x, y)
{
    // This function return landscape type of the tile block on the map
    // It'll return the following value:
    // BLOCK_GROUND
    // BLOCK_WATER
    // BLOCK_HARD_OBSTACLE
    // BLOCK_SOFT_OBSTACLE
    // BLOCK_BASE
    
    //var l = g_map.concat();
    //return l[Math.ceil(y) * MAP_W + Math.ceil(x)];
    return GetMap()[y][x];
}

/*
 * Get Brick on map at [x, y]
 * @param {int} x
 * @param {int} y
 * @returns {int}
 */
function GetBrickAt(x, y)
{
    return g_map[y * MAP_W + x];
}



function GetMyTeam()
{
    // This function return your current team.
    // It can be either TEAM_1 or TEAM_2
    // Obviously, your opponent is the other team.
    return g_team;
}

function GetOpponentTeam()
{
    return g_team == TEAM_1 ? TEAM_2 : TEAM_1;
}

function GetMyTank(id)
{
    // Return your tank, just give the id.
    return g_tanks[g_team][id];
}

function GetEnemyTank(id)
{
    // Return enemy tank, just give the id.
    return g_tanks[GetOpponentTeam()][id];
}

function GetPowerUpList()
{
    // Return active powerup list
    var powerUp = [];
    for (var i = 0; i < g_powerUps.length; i++)
    {
        if (g_powerUps[i].m_active)
        {
            powerUp.push(g_powerUps[i]);
        }
    }

    return powerUp;
}

function HasAirstrike()
{
    // Call this function to see if you have airstrike powerup.
    for (var i = 0; i < g_inventory[g_team].length; i++)
    {
        if (g_inventory[g_team][i] == POWERUP_AIRSTRIKE)
        {
            return true;
        }
    }
    return false;
}

function HasEMP()
{
    // Call this function to see if you have EMP powerup.
    for (var i = 0; i < g_inventory[g_team].length; i++)
    {
        if (g_inventory[g_team][i] == POWERUP_EMP)
        {
            return true;
        }
    }
    return false;
}

function GetIncomingStrike()
{
    var incoming = [];

    for (var i = 0; i < g_strikes[TEAM_1].length; i++)
    {
        if (g_strikes[TEAM_1][i].m_live)
        {
            incoming.push(g_strikes[TEAM_1][i]);
        }
    }
    for (var i = 0; i < g_strikes[TEAM_2].length; i++)
    {
        if (g_strikes[TEAM_2][i].m_live)
        {
            incoming.push(g_strikes[TEAM_2][i]);
        }
    }

    return incoming;
}

// ====================================================================================
// YOUR FUNCTIONS. YOU IMPLEMENT YOUR STUFF HERE.
// ====================================================================================

function GetOpposite(L)
{
    var L1 = [];
    for(i in L)
    {
        L1[i] = [MAP_W - 1 - L[i][0], MAP_H - 1 - L[i][1]];
    }
    return L1;
}


var $place = {};
var $target = {};
var $base_main = {};
var $path = {};


function OnPlaceTankRequest()
{
    // This function is called at the start of the game. You place your tank according
    // to your strategy here.
    
    //var map1 = [[1, 1], [2, 1], [3, 1], [4, 1]].reverse();
    
    
    // hg
    echo("The team " + g_team);
    
    //Lite to heavy
    var W = [TANK_HEAVY, TANK_HEAVY, TANK_HEAVY, TANK_HEAVY];
    

    //$place[TEAM_1] = [[7, 1], [6, 1], [5, 1], [4, 1]];
    $place[TEAM_1] = [[7, 1], [5, 1], [7, 20], [5, 20]];
    $place[TEAM_2] = GetOpposite($place[TEAM_1]);
    var_dump($place[TEAM_2]);
    
    $target[TEAM_1] = [[20, 4], [20, 3], [20, 18], [20, 19]];
    $target[TEAM_2] = GetOpposite($target[TEAM_1]);
    
    
    $base_main[TEAM_1] = [0x01, 11];
    $base_main[TEAM_2] = [20, 11];
    
    $path[TEAM_1] = [];
    $path[TEAM_1][0] = [];//[[20,  1]];
    $path[TEAM_1][1] = [];//[[20,  1]];
    $path[TEAM_1][2] = [];//[[20, 20]];
    $path[TEAM_1][3] = [];//[[19, 20], [18, 20], [20, 20]];
    
    $path[TEAM_2] = [];
    for(var i = 0; i <  $path[TEAM_1].length; i++)
    {
         $path[TEAM_2][i] = GetOpposite( $path[TEAM_1][i]);
    }
    


   
    for(var i = 0; i < NUMBER_OF_TANK; i++)
    {
        //echo($place[g_team][i]);
        PlaceTank(W[i], $place[g_team][i][0], $place[g_team][i][1]);
    }

    

    // Leave this here, don't remove it.
    // This command will send all of your tank command to server
    SendCommand();
}

function Update()
{
    //var t0 = performance.now();
    //echo(">>> Update(): ");
    
    //echo(GetMap());
    
    //INIT
    if( !$INITED )
    {
        printf(" Base: [%s, %s].", g_bases[g_team][0].m_x, g_bases[g_team][0].m_y);
        $INITED = true;
        
        printf("Can I See: %s", CanISee(8, 1.600000023841858, 13, 1.399999976158142));
        
        for(var i = 0; i < NUMBER_OF_TANK; i++)
        {
            var t = GetMyTank(i);
            t.setPath($path[GetMyTeam()][i]);
            t.target = $target[GetMyTeam()][i];
        }
        //skip first update time
        SendCommand();
        return;

    }
    
    // =========================================================================================================
    // Do nothing if the match is ended
    // You should keep this. Removing it probably won't affect much, but just keep it.
    // =========================================================================================================
    if (g_state == STATE_FINISHED)
    {
        if (((g_matchResult == MATCH_RESULT_TEAM_1_WIN) && (GetMyTeam() == TEAM_1)) || ((g_matchResult == MATCH_RESULT_TEAM_2_WIN) && (GetMyTeam() == TEAM_2)))
        {
            console.log("I WON. I WON. I'M THE BEST!!!");
        }
        else if (((g_matchResult == MATCH_RESULT_TEAM_2_WIN) && (GetMyTeam() == TEAM_1)) || ((g_matchResult == MATCH_RESULT_TEAM_1_WIN) && (GetMyTeam() == TEAM_2)))
        {
            console.log("DAMN, I LOST. THAT GUY WAS JUST LUCKY!!!");
        }
        else
        {
            console.log("DRAW.. BORING!");
        }
        return;
    }




    // =========================================================================================================
    // Check if there will be any airstrike or EMP
    // The GetIncomingStrike() function will return an array of strike object. Both called by your team
    // or enemy team.
    // =========================================================================================================
    var strike = GetIncomingStrike();
    for (var i = 0; i < strike.length; i++)
    {
        var x = strike[i].m_x;
        var y = strike[i].m_y;
        var count = strike[i].m_countDown; // Delay (in server loop) before the strike reach the battlefield.
        var type = strike[i].m_type;

        if (type == POWERUP_AIRSTRIKE)
        {
            // You may want to do something here, like moving your tank away if the strike is on top of your tank.
            
        }
        else if (type == POWERUP_EMP)
        {
            // Run... RUN!!!!
        }
        //console.log(">>> GetIncomingStrike Event.");
        //GetMyTank(i).goTo(x, y);
    }




    // =========================================================================================================
    // Get power up list on the map. You may want to move your tank there and secure it before your enemy
    // does it. You can get coordination, and type from this object
    // =========================================================================================================
    var powerUp = GetPowerUpList();
    for (var i = 0; i < powerUp.length; i++)
    {
        var x = powerUp[i].m_x;
        var y = powerUp[i].m_y;
        var type = powerUp[i].m_type;
        if (type == POWERUP_AIRSTRIKE)
        {
           
            // You may want to move your tank to this position to secure this power up.
        }
        else if (type == POWERUP_EMP)
        {

        }
       // console.log(">>> GetPowerUpList Event.");
        /*
        var myTank = GetMyTank(i);
        if( !myTank.busy)
        {
            console.log("Tank[" + i + "] going to Power up Item at ( " + x + ", " + y + ").");
            myTank.goTo(x, y);
            myTank.busy = 1;
        }
        */
        
    }



    // =========================================================================================================
    // This is an example on how you command your tanks.
    // In this example, I go through all of my "still intact" tanks, and give them random commands.
    // =========================================================================================================
    // Loop through all tank (if not dead yet)

    for (var i = 0; i < NUMBER_OF_TANK; i++)
    {
        var t = GetMyTank(i);

        // Don't waste effort if tank was dead
        if (t && t.m_HP > 0)
        {
            // update
            t.update();
  
            // send request
            t.sendCommand();
        }


    }
    


    // =========================================================================================================
    // This is an example on how you use your power up if you acquire one.
    // If you have airstrike or EMP, you may use them anytime.
    // I just give a primitive example here: I strike on the first enemy tank, as soon as I acquire power up
    // =========================================================================================================
    //bomb
    if (HasAirstrike())
    {
        //drop into your main base
        var your_team = GetOpponentTeam();
        UseAirstrike( $base_main[your_team][0], $base_main[your_team][1]);
        
    }
    // đóng băng
    if (HasEMP())
    {

        // get your team list and sort by HP
        var L = GetEnemyList().filter(function(e){ return e.m_HP > 0; }).sort(function(e1, e2){ e2.m_HP - e1.m_HP;});
        // drop into tank have the most HP 
        UseEMP( L[0].m_x, L[0].m_y);

    }
    
    //var t1 = performance.now();
    
    //echo("\nUpdate took ", t1 - t0, " s.");

    // Leave this here, don't remove it.
    // This command will send all of your tank command to server
    SendCommand();
}