const grid = [];
const zoom = 0.25;
let explored = 0;
let closedHexes = [];
let openHexes = [];
let start;
let end;
let isPaused = true;
let currentTool = 0; // 0: Wall, 1: Start, 2: End
// TODO: Use mouse to draw walls when paused

function setup() {
    createCanvas(800, 600);

    restart();

    // Buttons

    // Play/Pause ▶️ ⏸️
    buttonPlayPause = createButton("▶️");
    buttonPlayPause.addClass("emoji-button");
    buttonPlayPause.mousePressed(() => {
        if (isPaused) {
            console.log("Unpaused.");
            buttonPlayPause.elt.innerText = "⏸️";
        } else {
            console.log("Paused.");
            buttonPlayPause.elt.innerText = "▶️";
        }
        isPaused = !isPaused;
    });

    // Step ⏭️
    buttonStep = createButton("⏭️");
    buttonStep.addClass("emoji-button");
    buttonStep.mousePressed(pathfindStep);

    // Restart 🔄️
    buttonRestart = createButton("🔄️");
    buttonRestart.addClass("emoji-button");
    buttonRestart.mousePressed(restart);

    // Slow Down ⏪️
    buttonSpeedDown = createButton("⏪️");
    buttonSpeedDown.addClass("emoji-button");
    buttonSpeedDown.mousePressed(() => {
        console.log(`Frame rate reduced to ${frameRate()}`);
        frameRate(frameRate() - 5);
    });

    // Speed Up ⏩️
    buttonSpeedUp = createButton("⏩️");
    buttonSpeedUp.addClass("emoji-button");
    buttonSpeedUp.mousePressed(() => {
        console.log(`Frame rate increased to ${frameRate()}`);
        frameRate(frameRate() + 5);
    });

    // Tile Editing
    buttonWall = createButton("Build Walls");
    buttonWall.addClass("tool-button");
    buttonWall.elt.focus();
    buttonWall.mousePressed(() => {
        currentTool = 0; // Wall
    });

    buttonStart = createButton("Move Start");
    buttonStart.addClass("tool-button");
    buttonStart.mousePressed(() => {
        currentTool = 1; // Start
    });

    buttonEnd = createButton("Move End");
    buttonEnd.addClass("tool-button");
    buttonEnd.mousePressed(() => {
        currentTool = 2; // End
    });
}

function draw() {
    if (!isPaused) {
        // Function returns true when goal is reached
        if (pathfindStep()) {
            noLoop();
        }
    }

    background("orange");
    stroke("black");
    strokeWeight(5);

    for (col of grid) {
        for (hex of col) {
            hex.show();
        }
    }
}

function mouseReleased() {
    let [x, y] = pixelToGridCoords(mouseX, mouseY);
    console.log(`Clicked on tile at ${x}, ${y}`);
    // TODO: on click event for hex object
}

function gridToPixelCoords(gX, gY) {
    // Distances between hexes in pixels
    let xOff = 70;
    let yOff = 60;
    let globalXOff = -5; // move board 5 hexes left

    let pX = gX;
    pX += 0.5 * gY; // Offset for every other hex - this is causing the rhombus shape
    pX += globalXOff; // move board 5 hexes left to counteract the rhombus
    pX *= xOff; // Adjust scale

    let pY = gY;
    pY *= yOff; // Adjust scale
    return [pX, pY];
}

function pixelToGridCoords(pX, pY) {
    // Distances between hexes in pixels
    let xOff = 70;
    let yOff = 60;
    let globalXOff = -5; // move board 5 hexes left

    let gY = pY;
    gY /= yOff; // Adjust scale
    gY = Math.round(gY)

    let gX = pX;
    gX /= xOff;  // Adjust scale
    gX -= globalXOff; // Adjust for global offset
    gX -= 0.5 * gY; // Reverse rhombification
    gX = Math.round(gX)

    return [gX, gY];
}

function textCentered(msg, x, y) {
    text(msg, -(textWidth(msg) / 2) + x, -(textSize() / 2) + y, textWidth(msg), textSize());
}

function restart() {
    grid.length = 0;
    closedHexes.length = 0;
    openHexes.length = 0;
    explored = 0;
    generateMap();
    populateMap();
    loop();
}

function generateMap() {
    for (let i = 0; i < 20; i++) {
        grid.push([]);
        for (let j = 0; j < 11; j++) {
            // TODO: Less rhombus shaped grid
            [x, y] = gridToPixelCoords(i, j);

            grid[i].push(new Hex(x, y, i, j));
        }
    }
}

function populateMap() {
    // Place start and end points
    // grid[6][7].state = WALL;
    // grid[6][6].state = WALL;
    // grid[6][5].state = WALL;
    // grid[6][4].state = WALL;
    // grid[6][3].state = WALL;
    // grid[6][2].state = WALL;

    // grid[7][9].state = WALL;
    // grid[8][8].state = WALL;
    // grid[9][7].state = WALL;
    // grid[10][6].state = WALL;

    // grid[10][5].state = WALL;
    // grid[10][4].state = WALL;
    // grid[10][3].state = WALL;
    // grid[10][2].state = WALL;

    start = grid[4][5];
    start.state = START;
    end = grid[12][5];
    end.state = END;

    start.update(start, end);
    start.open();
}

function pathfindStep() {
    // TODO: Optimize lowest cost determination
    // Find lowest f_cost
    let cheapestFCost = Infinity;
    let cheapestHexes = [];
    for (hex of openHexes) {
        if (hex.f_cost < cheapestFCost) {
            cheapestFCost = hex.f_cost;
            cheapestHexes = [];
            cheapestHexes.push(hex);
        } else if (hex.f_cost == cheapestFCost) {
            cheapestHexes.push(hex);
        }
    }

    // Find lowest h_cost, if necessary
    if (cheapestHexes.length > 1) {
        let cheapestHCost = Infinity;
        let realCheapestHexes = [];
        for (hex of cheapestHexes) {
            if (hex.h_cost < cheapestHCost) {
                cheapestHCost = hex.h_cost;
                realCheapestHexes = [];
                realCheapestHexes.push(hex);
            } else if (hex.h_cost == cheapestHCost) {
                realCheapestHexes.push(hex);
            }
        }

        current = realCheapestHexes[0];
    } else {
        current = cheapestHexes[0];
    }

    // Check if finished
    if (current.state == END) {
        current.tracePath();
        // Note that this includes tiles that have been updated multiple times.
        console.log(`Found target after exploring ${explored} hexes.`);
        return true;
    }

    current.close();
    // console.log(`Closed ${current.q}, ${current.r} with stats ${current.f_cost}`);

    // Open more hexes
    for (neighbor of current.getNeighbors()) {
        if (neighbor.state == WALL || neighbor.state == CLOSED) {
            continue;
        }

        neighbor.update(start, end);
        // TODO: something about updating hex distances, check reference code
        if (!openHexes.includes(neighbor)) {
            neighbor.parent = current;
            explored++;
            neighbor.open();
            // console.log(`${current.q}, ${current.r} just opened ${neighbor.q}, ${neighbor.r}`)
        }
    }
}
