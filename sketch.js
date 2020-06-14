const grid = [];
const zoom = 0.25;
let explored = 0;
let closedHexes = [];
let openHexes = [];
let start;
let end;
let isPaused = true;
// TODO: Use mouse to draw walls when paused

function setup() {
    createCanvas(800, 600);

    restart();

    // Buttons

    // Play/Pause ▶️ ⏸️
    buttonPlayPause = createButton("▶️");
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
    buttonStep.mousePressed(pathfindStep);

    // Restart 🔄️
    buttonRestart = createButton("🔄️");
    buttonRestart.mousePressed(restart);

    // Slow Down ⏪️
    buttonSpeedDown = createButton("⏪️");
    buttonSpeedDown.mousePressed(() => {
        console.log(`Frame rate reduced to ${frameRate()}`);
        frameRate(frameRate() - 5);
    });

    // Speed Up ⏩️
    buttonSpeedUp = createButton("⏩️");
    buttonSpeedUp.mousePressed(() => {
        console.log(`Frame rate increased to ${frameRate()}`);
        frameRate(frameRate() + 5);
    });

    // TODO: Placing start and stop
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
            let xOff = 70; // Horizontal distance between hexes
            let yOff = 60; // Vertical distance between hexes
            let x = i * xOff + j * xOff - 5 * xOff;
            // That 5 is how many hexes to the left the board is adjusted
            let y = j * yOff;
            // Offset for every other hex
            x -= xOff * 0.5 * j;

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
