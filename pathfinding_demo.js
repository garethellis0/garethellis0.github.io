// TODO: Deal with window resizing
// TODO: Split classes into separate files

/** ------- CLASS DECLARATIONS ------- **/

/** ------- GENERAL ANIMATION SETTINGS ------- **/
var draw_time = 50;

var move_speed = 0.1;

function reDraw(){
    window.requestAnimationFrame(draw);
    function _reDraw() {
        window.requestAnimationFrame(draw);
    }
    setTimeout(_reDraw, draw_time);
}
var canvas_name = "some_canvas";


// TODO: Function to place obstacles randomly, but within the canvas bounds

// TODO: Function to check if a given coordinate is occupied

// TODO: (Probably) A smoothing function for the path

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
            break;
        }
    }
}

class Node {
    constructor(x,y){
        this.pos = {x:x, y:y};
        this.f = -1;
        this.g = -1;
        this.h = -1;
        this.parent = null;
        this.path = false;
        this.closed = false;
        this.obstacle = false;
        this.inflated = true; // Whether or not this was an inflated obstacle
    }
}

class Environment {
    constructor (width, height) {
        // Sets up a 2D array with 0 f,g,h score
        this.grid = [];
        this.width = width;
        this.height = height;
        for (var x = 0; x < height; x++){
            this.grid[x] = new Array(width);
            for (var y = 0; y < width; y++){
                // console.log("Created a Node!")
                this.grid[x][y] = new Node(x,y);
            }
        }

        // Sets nodes to be obstacles
        this.obstacles = [
            {x:11, y:9},
            {x:0, y:0},
            {x:20, y:18},
            {x:12,y:10},
            {x:13,y:11},
            {x:14,y:12},
            {x:14,y:13},
            {x:15,y:13},
            {x:16,y:14},
            {x:16,y:15},
            {x:16,y:16},
            {x:16,y:17},
            {x:18,y:17},
            {x:9,y:9}
        ];

        this.inflated_obstacles = this.inflate_obstacles(this.obstacles);
        // console.log(this.inflated_obstacles);
        for (var node = 0; node < this.inflated_obstacles.length; node++){
            this.grid[this.inflated_obstacles[node].x][this.inflated_obstacles[node].y].obstacle = true;
            // Check if the inflated obstacle is an original obstacle
            for (var i = 0; i < this.obstacles.length; i++){
                if (this.inflated_obstacles[node].x == this.obstacles[i].x &&
                    this.inflated_obstacles[node].y == this.obstacles[i].y){
                    this.grid[this.inflated_obstacles[node].x][this.inflated_obstacles[node].y].inflated = false;
                    continue;
                }
            }
            // console.log("got her");
        }

        // this.robot = {width:50, height:50, x:50, y:225};
        // this.start = {x:10, y:5};
        // this.goal = {x:18, y:5};
    }

    // Inflates the obstacles
    inflate_obstacles(obstacles){
        var inflated_obstacles = [];
        for (var i = 0; i < obstacles.length; i++){
            for (var x = -1; x <= 1; x++){
                for (var y = -1; y <= 1; y++){
                    var coor = {x: obstacles[i].x + x, y: obstacles[i].y + y};
                    if (coor.y < this.height && coor.y >= 0 &&
                        coor.x < this.width && coor.x >= 0 &&
                        !(coor.x == 0 && coor.y == 0)) {
                        inflated_obstacles.push(coor);
                    }
                }
            }
        }
        return inflated_obstacles;
    }
    // Renders the Environment, including grid points, obstacles and robot
    // in a way that makes it easier to debug
    render_debug(canvas_name){
        var canvas = document.getElementById(canvas_name);

        // Check to make sure the browser supports '<canvas>'
        if (canvas.getContext){
            var ctx = canvas.getContext('2d');

            // Clear the canvas
            ctx.clearRect(0,0, canvas.width, canvas.height);

            // Resize the canvas to the window size
            //canvas.width  = window.innerWidth;
            //canvas.height = window.innerHeight;

            // Draw some Stuff
            ctx.fillStyle = "rgb(200, 0, 0)";
            ctx.fillRect (10, 10, 50, 50);

            ctx.fillStyle = "rgba(0, 0, 200, 0.5)";
            ctx.fillRect (30, 30, 50, 50);

            // Draw the robot
            //ctx.fillStyle = "rgb(200, 200, 200)";
            //ctx.fillRect(this.robot.x, this.robot.y, this.robot.width, this.robot.height);

            function draw_obstacle(obstacle){
                ctx.fillStyle = "rgb(400, 200, 100)";
                ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            }
            // Draw the Obstacles
            //this.obstacles.forEach(draw_obstacle);

            // Draw the grid points
            for (var y = 0; y < this.height; y++){
                for (var x = 0; x < this.width; x++){
                    if (this.grid[x][y].path){
                        ctx.fillStyle = "rgb(69, 69, 244)";
                    } else if (this.grid[x][y].closed){
                        ctx.fillStyle = "rgb(244, 69, 69)";
                    } else if (this.grid[x][y].obstacle){
                        ctx.fillStyle = "rgb(0, 0, 0)";
                    } else {
                        ctx.fillStyle = "rgb(69, 244, 69)";
                    }
                    ctx.fillRect(x * (canvas.width/this.width), y * (canvas.height/this.height), 15, 15);
                }
            }
        }
        console.log("Finished rendering!");
    }
}


class AStar {
    search(grid, start, goal) {
        var openSet = [];
        var closedSet = [];
        openSet.push(start);
        start.g = 0;
        start.h = this.heuristic(start.pos.x, start.pos.y, goal.pos.x, goal.pos.y);
        start.f = start.h;

        var ticker = 0;
        while (openSet.length != 0) {
            ticker += 1;
            // console.log("OpenSet: ", openSet);
            // console.log("ClosedSet", closedSet);
            // Current node is the node in openSet with least fScore
            // TODO: Re-emplement with binary heap for improved speed here
            var current = openSet[0];
            for (let i = 0; i < openSet.length; i++) {
                if (openSet[i].f < current.f) {
                    current = openSet[i];
                }
            }

             if (current == goal) {
                closedSet.push(current);
                current.closed = true;
                console.log("Reached the goal!");
                console.log("Explored ", closedSet.length, " nodes");
                var path = [];
                while (current != start) {
                    path.push(current);
                    current.path = true;
                    current = current.parent;
                }
                path.push(current);
                current.path = true;
                return path;
                return;
            }

            // Remove current node from openSet
            let i = openSet.indexOf(current);
            if (i !== -1) {
                openSet.splice(i, 1);
            }

            closedSet.push(current);
            current.closed = true;
            var neighbours = this.neighbours(current, grid);
            for (let i = 0; i < neighbours.length; i++) {
                var neighbour = neighbours[i];
                if (!neighbour.closed) {
                    // var tentative_g_score = this.heuristic(current.x, current.y, neighbour.x, neighbour.y);
                    var tentative_g_score = current.g + 1;
                    if (Math.abs(current.pos.x - neighbour.pos.x) != 0 &&
                        Math.abs(current.pos.y - neighbour.pos.y) != 0){
                        tentative_g_score = current.g + 1.2;
                    }
                    let i = openSet.indexOf(neighbour);
                    if (i === -1) { // if neighbour not in openSet
                        neighbour.parent = current;
                        neighbour.g = tentative_g_score;
                        neighbour.h = this.heuristic(neighbour.pos.x, neighbour.pos.y, goal.pos.x, goal.pos.y);
                        neighbour.f = neighbour.g + neighbour.h;
                        openSet.push(neighbour);
                    } else if (tentative_g_score < neighbour.g || neighbour.g < 0) {
                        neighbour.parent = current;
                        neighbour.g = tentative_g_score;
                        neighbour.h = this.heuristic(neighbour.pos.x, neighbour.pos.y, goal.pos.x, goal.pos.y);
                        neighbour.f = neighbour.g + neighbour.h;
                    }
                }
            }
        }
        return -1;
    }

    heuristic(x1, y1, x2, y2) {
        // TODO: Add more heuristic options
        // Manhatten Heuristic
        // var d1 = Math.abs (x1 - x2);
        // var d2 = Math.abs (y1 - y2);
        // return d1 + d2;
        var D = 1; // Cost of straight movement
        var D2 = 1.2; // Cost of Diagonal Movement
        var dx = Math.abs(x2 - x1);
        var dy = Math.abs(y2 - y1);
        return D * (dx + dy) + (D2 - 2 * D) * Math.min(dx, dy);
    }

    // Returns the neighbours of a given node
    neighbours(node, grid) {
        //TODO: please refactor this. So much repitition
        var neighbours = [];

        // Check each of the 8 neighbours
        // Check because javascript 2D arrays are a hack
        if (grid[node.pos.x - 1] != null) {
            if (grid[node.pos.x - 1][node.pos.y] != null
                && !grid[node.pos.x - 1][node.pos.y].obstacle) {
                neighbours.push(grid[node.pos.x - 1][node.pos.y]);
            }
            if (grid[node.pos.x][node.pos.y - 1] != null
                && !grid[node.pos.x][node.pos.y - 1].obstacle) {
                neighbours.push(grid[node.pos.x][node.pos.y - 1]);
            }
            if (grid[node.pos.x - 1][node.pos.y - 1] != null
                && !grid[node.pos.x - 1][node.pos.y - 1].obstacle) {
                neighbours.push(grid[node.pos.x - 1][node.pos.y - 1]);

                if (grid[node.pos.x - 1][node.pos.y + 1] != null
                    && !grid[node.pos.x - 1][node.pos.y + 1].obstacle) {
                    neighbours.push(grid[node.pos.x - 1][node.pos.y + 1]);
                }
            }
            // Check because javascript 2D arrays are a hack
            if (grid[node.pos.x + 1] != null) {
                if (grid[node.pos.x][node.pos.y + 1] != null
                    && !grid[node.pos.x][node.pos.y + 1].obstacle) {
                    neighbours.push(grid[node.pos.x][node.pos.y + 1]);
                }
                if (grid[node.pos.x + 1][node.pos.y] != null
                    && !grid[node.pos.x + 1][node.pos.y].obstacle) {
                    neighbours.push(grid[node.pos.x + 1][node.pos.y]);
                }
                if (grid[node.pos.x + 1][node.pos.y - 1] != null
                    && !grid[node.pos.x + 1][node.pos.y - 1].obstacle) {
                    neighbours.push(grid[node.pos.x + 1][node.pos.y - 1]);
                }
                if (grid[node.pos.x + 1][node.pos.y + 1] != null
                    && !grid[node.pos.x + 1][node.pos.y + 1].obstacle) {
                    neighbours.push(grid[node.pos.x + 1][node.pos.y + 1]);
                }
            }
        }
        return neighbours;
    }
}

environment = new Environment(40, 40);
var canvas = document.getElementById(canvas_name);
var robot = {width: 2*(canvas.width/environment.width), height: 2*(canvas.height/environment.height),
            x:3, y:10, rotation: 0};

grid = environment.grid;
// node = grid[10][11];
astar = new AStar(environment);
//console.log(astar.neighbours(node, grid));
// console.log("Path: ", path = astar.search(grid, grid[3][14], grid[17][12]));
// environment.render_debug("some_canvas");


function render(){
    var canvas = document.getElementById(canvas_name);

    // Check to make sure the browser supports '<canvas>'
    if (canvas.getContext){
        // Determine the ratio to multiply stuff by
        var ratio = {x: canvas.width/environment.width, y: canvas.height/environment.height};
        var ctx = canvas.getContext('2d');

        // Clear the canvas
        ctx.clearRect(0,0, canvas.width, canvas.height);

        var block_size = {
            x: canvas.width/environment.width,
            y: canvas.height/environment.height
        };
        ctx.save();
        ctx.translate(block_size.x/2, block_size.y/2);
        for (var y = 0; y < environment.height; y++){
            for (var x = 0; x < environment.width; x++){
                if (environment.grid[x][y].path){
                    ctx.fillStyle = "rgb(69, 69, 244)";
                    ctx.fillRect(
                        x * (canvas.width/environment.width),
                        y * (canvas.height/environment.height),
                        block_size.x, block_size.y);
                } else if (environment.grid[x][y].obstacle && !environment.grid[x][y].inflated){
                    ctx.fillStyle = "rgb(0, 0, 0)";
                    ctx.fillRect(x * (canvas.width/environment.width),
                                y * (canvas.height/environment.height),
                                block_size.x, block_size.y);
                }
            }
        }
        ctx.restore();

        // Draw the robot
        // ctx.fillStyle = "rgb(244, 66, 66)";
        // ctx.fillRect(this.robot.x * ratio.x, this.robot.y * ratio.y, this.robot.width, this.robot.height);
        ctx.save();
        ctx.translate(this.robot.x * ratio.x + (this.robot.width/2),
                    this.robot.y * ratio.y + (this.robot.height/2));
        ctx.rotate(robot.rotation + Math.PI/2);
        ctx.translate(-this.robot.width/2, -this.robot.height/2);
        var drawing = new Image();
        drawing.src = 'images/rover1.png';
        ctx.drawImage(drawing, 0,0, this.robot.width, this.robot.height);
        ctx.restore();
    }
    console.log("Finished rendering!");
}

// Makes the robot follow a given path
function followPath(path){
    var canvas = document.getElementById('some_canvas');

    function move_() {
        if (path.length <= 0) {
            return;
        }
        var dest = {
            x: path[path.length - 1].pos.x,
            y: path[path.length - 1].pos.y
        };
        var distance_to_dest = Math.sqrt(Math.pow(robot.x - dest.x, 2)
            + Math.pow(robot.y - dest.y, 2));
        var angle_to_dest = Math.atan2(robot.y - dest.y, robot.x - dest.x);

        var delta_x = Math.cos(angle_to_dest) * move_speed;
        var delta_y = Math.sin(angle_to_dest) * move_speed;

        console.log(Math.abs((angle_to_dest - robot.rotation) % Math.PI));
        if (Math.abs((angle_to_dest - robot.rotation) % (2 * Math.PI)) > (0.314/2)){
            if ((angle_to_dest - robot.rotation) % (2 * Math.PI) < 0 ||
                (angle_to_dest - robot.rotation) % (2 * Math.PI) > Math.PI){
                robot.rotation = (robot.rotation % Math.PI) - 0.314
            } else {
                robot.rotation = (robot.rotation % Math.PI) + 0.314
            }
        } else if (distance_to_dest > 0.1){
        // console.log(distance_to_dest);
        robot.x -= delta_x;
        robot.y -= delta_y;
        } else {
            path = path.slice(0,-1);
        }
        window.requestAnimationFrame(render);
        setTimeout(move_, draw_time);
    }
    move_();
}

console.log("Path: ", path = astar.search(grid, grid[3][14], grid[27][15]));

// environment.render_debug("some_canvas");
followPath(path);

// render();

// environment.render("some_canvas");