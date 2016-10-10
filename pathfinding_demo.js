// TODO: Deal with window resizing


/** ------- CLASS DECLARATIONS ------- **/

/** ------- GENERAL ANIMATION SETTINGS ------- **/
var draw_time = 1;

var move_speed = 1;

var robot = {width:50, height:50, x:50, y:225};
// Obstacles are blocks
var obstacles = [{width:100, height:100, x:250, y:200}];

var goal = {x:450, y:200};

function draw() {
    var canvas = document.getElementById('some_canvas');

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
        ctx.fillStyle = "rgb(200, 200, 200)";
        ctx.fillRect(robot.x, robot.y, robot.width, robot.height);

        function draw_obstacle(obstacle){
            ctx.fillStyle = "rgb (400, 200, 100)";
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
        // Draw the Obstacles
        obstacles.forEach(draw_obstacle);
    }
}

function reDraw(){
    window.requestAnimationFrame(draw);
    function _reDraw() {
        window.requestAnimationFrame(draw);
    }
    setTimeout(_reDraw, draw_time);
}


// TODO: Function to place obstacles randomly, but within the canvas bounds

// TODO: Function to check if a given coordinate is occupied

// TODO: inflation function to generate inflated obstacles for navigation

// TODO: (Probably) A smoothing function for the path

// TODO: A*

/*
function a_star(start, goal){
    closed_set = [];
    open_set = [];

    while (open_set != []){
        // Current node is the node in the open set with the lowest f_score
        current_node = open_set[0];
        for (i = 0; i < open_set.length; i++){
            if (open_set[i].f < current_node.f){
                current_node = open_set[i];
            }
        }

        // If you're at goal, return the path

        //open
    }
}
*/

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
                console.log("Created a Node!")
                this.grid[x][y] = new Node(x,y);
            }
        }

        // Sets nodes to be obstacles
        this.obstacles = [{x:10, y:10}, {x:0, y:0}, {x:19, y:19}];
        for (var node = 0; node < this.obstacles.length; node++){
            this.grid[this.obstacles[node].x][this.obstacles[node].y].obstacle = true;
        }

        this.robot = {width:50, height:50, x:50, y:225};
        this.start = {x:0, y:5};
        this.goal = {x:18, y:5};
    }
    
    // Renders the Environment, including grid points, obstacles and robot 
    render(canvas_name){
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
    search (grid, start, goal){
        var openSet = [];
        var closedSet = [];
        openSet.push(start);
        start.g = 0;
        start.h = this.heuristic(start.pos.x, start.pos.y, goal.pos.x, goal.pos.y);
        start.f = start.h;

        var ticker = 0;
        while (openSet != []){
            ticker += 1;
            // console.log("OpenSet: ", openSet);
            // console.log("ClosedSet", closedSet);
            // Current node is the node in openSet with least fScore
            // TODO: Re-emplement with binary heap for improved speed here
            var current = openSet[0];
            for (let i = 0; i < openSet.length; i++){
                if (openSet[i].f < current.f){
                    current = openSet[i];
                }
            }
            // console.log("Current: ", current.pos);

            if (current == goal){
                closedSet.push(current);
                current.closed = true;
                console.log("Reached the goal!");
                var path = [];
                while (current != start){
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
            if (i !== -1){
                openSet.splice(i, 1);
            }

            closedSet.push(current);
            current.closed = true;
            var neighbours = this.neighbours(current, grid);
            for (let i = 0; i < neighbours.length; i++){
                var neighbour = neighbours[i];
                if (!neighbour.closed){
                    var tentative_g_score = current.g + 1;
                    let i = openSet.indexOf(neighbour);
                    if (i === -1){ // if neighbour not in openSet
                        neighbour.parent = current;
                        neighbour.g = tentative_g_score;
                        neighbour.h = this.heuristic(neighbour.pos.x, neighbour.pos.y, goal.pos.x, goal.pos.y);
                        neighbour.f = neighbour.g + neighbour.h;
                        openSet.push(neighbour);
                    } else if (tentative_g_score < neighbour.g || neighbour.g < 0){
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

    heuristic (x1, y1, x2, y2){
        // Manhatten Heuristic
        // TODO: Add more heuristic options
        // var d1 = Math.abs (x1 - x2);
        // var d2 = Math.abs (y1 - y2);
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2-y1, 2));
    }

    // Returns the neighbours of a given node
    neighbours (node, grid){
        var neighbours = [];
        
        // Check each of the 4 neighbours
        // Check because javascript 2D arrays are a hack
        if (grid[node.pos.x - 1] != null){
            if (grid[node.pos.x - 1][node.pos.y] != null 
                && !grid[node.pos.x - 1][node.pos.y].obstacle){
                neighbours.push(grid[node.pos.x - 1][node.pos.y]);
            }
            if (grid[node.pos.x][node.pos.y - 1] != null 
                && !grid[node.pos.x][node.pos.y - 1].obstacle){
                neighbours.push(grid[node.pos.x][node.pos.y - 1]);
            }
        }
        // Check because javascript 2D arrays are a hack
        if (grid[node.pos.x + 1] != null){
            if (grid[node.pos.x][node.pos.y + 1] != null 
                && !grid[node.pos.x][node.pos.y + 1].obstacle){
                neighbours.push(grid[node.pos.x][node.pos.y + 1]);
            }
            if (grid[node.pos.x + 1][node.pos.y] != null 
                && !grid[node.pos.x + 1][node.pos.y].obstacle){
                neighbours.push(grid[node.pos.x + 1][node.pos.y]);
            }
        }
        return neighbours;
    }
}

// Allows you to move to any part of the screen
function move(dest_x_ratio, dest_y_ratio){
    var canvas = document.getElementById('some_canvas');
    var dest = {
        x: dest_x_ratio * canvas.width,
        y: dest_y_ratio * canvas.height
    };

    function move_(){
        var distance_to_dest = Math.sqrt(Math.pow(robot.x + (robot.width/2) - dest.x, 2)
                                + Math.pow(robot.y + (robot.height/2) - dest.y, 2));
        var angle_to_dest = Math.atan2(robot.y - dest.y, robot.x - dest.x);

        var delta_x = Math.cos(angle_to_dest) * move_speed;
        var delta_y = Math.sin(angle_to_dest) * move_speed;

        if (distance_to_dest > 10){
            robot.x -= delta_x;
            robot.y -= delta_y;
        } else {
            return;
        }
        window.requestAnimationFrame(draw);
        setTimeout(move_, draw_time);
    }
    move_();
}

//reDraw();
environment = new Environment(20, 20);
environment.render("some_canvas");


grid = environment.grid;
node = grid[10][11];
astar = new AStar(environment);
//console.log(astar.neighbours(node, grid));
console.log(path = astar.search(grid, grid[1][10], grid[17][17]));
environment.render("some_canvas");
//a_star(goal);
