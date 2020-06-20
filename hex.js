const EMPTY = 0;
const START = 1;
const END = 2;
const OPEN = 3;
const CLOSED = 4;
const PATH = 5;
const WALL = 6;

class Hex {
    constructor(x, y, q, r) {
        // Defining costs here so they show up first
        // when I debug.log the object
        this.f_cost = undefined;
        this.h_cost = undefined;
        this.g_cost = undefined;
        this.x = x; // Pixel x
        this.y = y; // Pixel y
        this.q = q; // Grid column
        this.r = r; // Grid row
        this.s = -q - r; // Cubic third dimension

        this.state = EMPTY;
    }

    onClick() {
        switch (currentTool) {
            case 0: // Walls
                if (this.state == WALL) {
                    this.state = EMPTY;
                } else {
                    this.state = WALL;
                }
                break;
            case 1: // Start
                this.state = START;
                start.state = EMPTY;
                start.f_cost = undefined;
                start.h_cost = undefined;
                start.g_cost = undefined;
                openHexes = openHexes.filter((hex) => {
                    return hex !== start;
                });
                start = this;
                this.update(start, end);
                this.open();
                break;
            case 2: // End
                this.state = END;
                end.state = EMPTY;
                end.f_cost = undefined;
                end.h_cost = undefined;
                end.g_cost = undefined;
                end = this;
                break;
        }
    }

    show() {
        push();
        translate(this.x, this.y);
        scale(zoom);

        if (this.state == EMPTY) {
            // TODO: Figure out why this is more
            // saturated on firefox than chrome
            fill("yellow");
        } else if (this.state == START) {
            fill("white");
        } else if (this.state == END) {
            fill("#FF7A60");
        } else if (this.state == OPEN) {
            fill("#61B8FF");
        } else if (this.state == CLOSED) {
            fill("#7AD9FF");
        } else if (this.state == PATH) {
            fill("green");
        } else if (this.state == WALL) {
            fill("grey");
        }

        // Hexagon
        beginShape();
        vertex(-130, -75);
        vertex(-130, 75);
        vertex(0, 150);
        vertex(130, 75);
        vertex(130, -75);
        vertex(0, -150);
        endShape(CLOSE);

        pop();
    }

    showStats() {
        push();
        translate(this.x, this.y);
        scale(zoom);

        // Co-ordinates
        textCentered(`${this.q}, ${this.r}, ${this.s}`, 0, 80); // Whitespace is using custom character

        // Label
        if (this.state == START) {
            textCentered("Start", 0, 0);
        } else if (this.state == END) {
            textCentered("End", 0, 0);
        }

        // Costs
        if (this.g_cost != "undefined") {
            textCentered(this.g_cost, -60, -60);
        }
        if (this.h_cost != "undefined") {
            textCentered(this.h_cost, 60, -60);
        }
        if (this.f_cost != "undefined") {
            textCentered(this.f_cost, 0, -80);
        }

        pop();
    }

    getNeighbors() {
        let neighbors = [];

        // Check that column to the left exists
        if (grid[this.q + 1] != null) {
            neighbors.push(
                ...[
                    grid[this.q + 1][this.r + 0], // Right
                    grid[this.q + 1][this.r - 1], // Top Right
                ]
            );
        }

        // We already know this column exists
        neighbors.push(
            ...[
                grid[this.q + 0][this.r + 1], // Bot Right
                grid[this.q + 0][this.r - 1], // Top Left
            ]
        );

        // Check that column to the right exists
        if (grid[this.q - 1] != null) {
            neighbors.push(
                ...[
                    grid[this.q - 1][this.r + 0], // Left
                    grid[this.q - 1][this.r + 1], // Bot Left
                ]
            );
        }

        // Remove undefineds
        neighbors = neighbors.filter(Boolean);
        return neighbors;
    }

    tracePath() {
        if (this.state == END) return;
        if (this.parent) {
            this.parent.state = PATH;
            if (this.parent.parent.state != START) this.parent.tracePath();
        }
    }

    update(start, end) {
        this.g_cost = this.distance(start);
        this.h_cost = this.distance(end);
        this.f_cost = this.g_cost + this.h_cost;
    }

    open() {
        if (this.state != START && this.state != END) this.state = OPEN;
        openHexes.push(this);
    }

    close() {
        if (this.state != START && this.state != END) this.state = CLOSED;
        openHexes = openHexes.filter((hex) => {
            return hex !== this;
        });
        closedHexes.push(this);
    }

    distance(target) {
        return (abs(this.q - target.q) + abs(this.r - target.r) + abs(this.s - target.s)) / 2;
    }
}
