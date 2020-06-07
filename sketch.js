const grid = [];
const zoom = 0.25;
let closedHexes = [];
let openHexes = [];
let start;
let end;

function setup() {
    // frameRate(1);
    createCanvas(800, 600);
    for (let i = 0; i < 20; i++) {
        grid.push([]);
        for (let j = 0; j < 11; j++) {
            // TODO: Less rhombus shaped grid
            let xOff = 70; // Horizontal distance between hexes
            let yOff = 60; // Vertical distance between hexes
            let x = i * xOff + j * xOff - 4 * xOff;
            let y = j * yOff;
            // Offset for every other hex
            x -= xOff * 0.5 * j;

            grid[i].push(new Hex(x, y, i, j));
        }
    }

    // TODO: Move setup into it's own function
    // Build barriers
    grid[6][7].state = WALL;
    grid[6][6].state = WALL;
    grid[6][5].state = WALL;
    grid[6][4].state = WALL;
    grid[6][3].state = WALL;
    grid[6][2].state = WALL;

    grid[7][9].state = WALL;
    grid[8][8].state = WALL;
    grid[9][7].state = WALL;
    grid[10][6].state = WALL;

    grid[10][5].state = WALL;
    grid[10][4].state = WALL;
    grid[10][3].state = WALL;
    grid[10][2].state = WALL;

    // Establish locations
    start = grid[4][5];
    start.state = START;
    end = grid[12][5];
    end.state = END;
    start.update(start, end);
    start.open();
}

function draw() {
    if (pathfind()) {
        noLoop();
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

function pathfind() {
    // TODO: Optimize this
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
        console.log("Found target!");
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
        if (!openHexes.includes(neighbor)) {
            // TODO: Increment a count that tracks distance from start
            neighbor.parent = current;
            neighbor.open();
            // console.log(`${current.q}, ${current.r} just opened ${neighbor.q}, ${neighbor.r}`)
        }
    }
}