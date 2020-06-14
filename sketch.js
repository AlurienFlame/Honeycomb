const grid = [];
const zoom = 0.25; // Default 0.25
const globalXOff = -5; // Move board 5 hexes left
// Distances between hexes in pixels
const xOff = 280 * zoom;
const yOff = 240 * zoom;
let explored = 0;
let closedHexes = [];
let openHexes = [];
let start;
let end;
let isPaused = true;
let isFinished = false;
let currentTool = 0; // 0: Wall, 1: Start, 2: End

function setup() {
    createCanvas(800, 600);

    generateMap();
    populateMap();

    // Buttons

    // Play/Pause ▶️ ⏸️
    buttonPlayPause = createButton("▶️");
    buttonPlayPause.addClass("emoji-button");
    buttonPlayPause.mousePressed(() => {
        if (isPaused) {
            buttonPlayPause.elt.innerText = "⏸️";
        } else {
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
    buttonWall.addClass("selected-tool-button");
    buttonWall.mousePressed(() => {
        currentTool = 0; // Wall
        buttonWall.addClass("selected-tool-button");
        buttonStart.removeClass("selected-tool-button");
        buttonEnd.removeClass("selected-tool-button");
    });

    buttonStart = createButton("Move Start");
    buttonStart.addClass("tool-button");
    buttonStart.mousePressed(() => {
        currentTool = 1; // Start
        buttonWall.removeClass("selected-tool-button");
        buttonStart.addClass("selected-tool-button");
        buttonEnd.removeClass("selected-tool-button");
    });

    buttonEnd = createButton("Move End");
    buttonEnd.addClass("tool-button");
    buttonEnd.mousePressed(() => {
        currentTool = 2; // End
        buttonWall.removeClass("selected-tool-button");
        buttonStart.removeClass("selected-tool-button");
        buttonEnd.addClass("selected-tool-button");
    });
}

function draw() {
    if (!isPaused && !isFinished) {
        // Function returns true when goal is reached
        pathfindStep();
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
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;
    let [x, y] = pixelToGridCoords(mouseX, mouseY);
    grid[x][y].onClick();
}

function gridToPixelCoords(gX, gY) {
    let pX = gX;
    pX += 0.5 * gY; // Offset for every other hex - this is causing the rhombus shape
    pX += globalXOff; // move board 5 hexes left to counteract the rhombus
    pX *= xOff; // Adjust scale

    let pY = gY;
    pY *= yOff; // Adjust scale
    return [pX, pY];
}

function pixelToGridCoords(pX, pY) {
    let gY = pY;
    gY /= yOff; // Adjust scale
    gY = Math.round(gY);

    let gX = pX;
    gX /= xOff; // Adjust scale
    gX -= globalXOff; // Adjust for global offset
    gX -= 0.5 * gY; // Reverse rhombification
    gX = Math.round(gX);

    return [gX, gY];
}

function textCentered(msg, x, y) {
    text(msg, -(textWidth(msg) / 2) + x, -(textSize() / 2) + y, textWidth(msg), textSize());
}

function restart() {
    // Reset data
    isFinished = false;
    closedHexes.length = 0;
    openHexes.length = 0;
    explored = 0;

    // Clear grid
    let statesToClear = [OPEN, CLOSED, PATH];
    for (row of grid) {
        for (hex of row) {
            if (statesToClear.includes(hex.state)) {
                hex.state = EMPTY;
                hex.g_cost = undefined;
                hex.h_cost = undefined;
                hex.f_cost = undefined;
            }
        }
    }

    // Start over
    start.open();
}

function generateMap() {
    for (let i = 0; i < 17; i++) {
        grid.push([]);
        for (let j = 0; j < 11; j++) {
            [x, y] = gridToPixelCoords(i, j);
            grid[i].push(new Hex(x, y, i, j));
        }
    }
}

function populateMap() {
    start = grid[5][2];
    start.state = START;
    end = grid[11][8];
    end.state = END;

    start.update(start, end);
    start.open();
}

function pathfindStep() {
    // TODO: Optimize lowest cost determination
    if (openHexes.length < 1) {
        console.log(`Ran out of hexes to explore after exploring ${explored} hexes.`);
        isFinished = true;
        return;
    }
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
        // Note that this includes tiles that have been updated multiple times,
        // as well as start and end
        alert(`Found target after exploring ${explored} hexes.`);
        isFinished = true;
        return;
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
