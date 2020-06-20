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
// Popup
const defaultPopupAlpha = 220;
const popupDuration = 2000;
let popupLifetime = 0;
let message = "";
let popupY;
let popupAlpha;

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

    // TODO: Button hover text / tooltip
    // Step ⏭️
    buttonStep = createButton("⏭️");
    buttonStep.addClass("emoji-button");
    buttonStep.mousePressed(pathfindStep);

    // Restart 🔄️
    buttonRestart = createButton("🔄️");
    buttonRestart.addClass("emoji-button");
    buttonRestart.mousePressed(restart);

    // TODO: Rework speed changing to be more sane
    // Slow Down ⏪️
    buttonSpeedDown = createButton("⏪️");
    buttonSpeedDown.addClass("emoji-button");
    buttonSpeedDown.mousePressed(() => {
        popup(`Frame rate reduced to ${frameRate()}`);
        frameRate(frameRate() - 5);
    });

    // Speed Up ⏩️
    buttonSpeedUp = createButton("⏩️");
    buttonSpeedUp.addClass("emoji-button");
    buttonSpeedUp.mousePressed(() => {
        popup(`Frame rate increased to ${frameRate()}`);
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
        pathfindStep();
    }

    background("orange");

    // Hexes
    stroke("black");
    strokeWeight(5);
    for (col of grid) {
        for (hex of col) {
            hex.show();
        }
    }

    // Numbers
    fill("black");
    strokeWeight(1);
    textSize(40);
    for (col of grid) {
        for (hex of col) {
            hex.showStats();
        }
    }

    // Popup
    if (popupLifetime) {
        // Timing out
        if (popupLifetime > 0) {
            popupLifetime -= deltaTime;
        } else {
            popupLifetime = 0;
        }

        // Fade out
        if (popupLifetime < popupDuration * 0.25) {
            popupAlpha -= 5;
        }

        // Coords
        let popupHeight = height * 0.1;
        let popupWidth = textWidth(message) * 0.75;
        let popupX = width * 0.5 - popupWidth * 0.5;
        let popupYFinal = height * 0.86;

        // Slide up onto the screen
        if (popupY > popupYFinal) popupY -= 10;

        // Background
        fill(color(255, 255, 255, popupAlpha));
        stroke(color(0, 0, 0, popupAlpha));
        rect(popupX, popupY, popupWidth, popupHeight, 20);

        // Text
        fill(color(0, 0, 0, popupAlpha));
        textSize(20);
        noStroke();
        text(message, width * 0.5 - textWidth(message) * 0.5, popupY + textSize() * 1.25);
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
    text(msg, -(textWidth(msg) / 2) + x, -(textSize() / 2) + y, textWidth(msg));
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
    // Benchmarked at 0.165 to 0.035

    if (openHexes.length < 1) {
        popup(`Ran out of hexes to explore after exploring ${explored} hexes.`);
        isFinished = true;
        return;
    }

    // Sort array by f_cost, and by h_cost for hexes with equal f_cost
    let current = openHexes.sort((a, b) => (a.f_cost == b.f_cost ? a.h_cost - b.h_cost : a.f_cost - b.f_cost))[0];

    // Check if finished
    if (current.state == END) {
        current.tracePath();
        // Note that this includes tiles that have been updated multiple times,
        // as well as start and end
        popup(`Found target after exploring ${explored} hexes.`);
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

function popup(txt) {
    message = txt;
    popupY = height * 1.1; // The 0.1 comes from the popup's height
    popupLifetime = popupDuration;
    popupAlpha = defaultPopupAlpha;
}
