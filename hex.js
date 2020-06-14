const EMPTY = 0;
const START = 1;
const END = 2;
const OPEN = 3;
const CLOSED = 4;
const PATH = 5;
const WALL = 6;

class Hex {
    constructor(x, y, q, r) {
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
                console.log(`Toggled wall at ${this.q}, ${this.r}, ${this.s}`);
                break;
            case 1: // Start
                this.state = START;
                start.state = EMPTY;
                openHexes = openHexes.filter((hex) => {
                    return hex !== start;
                });
                start = this;
                this.update(start, end);
                this.open();
                console.log(`Moved Start to ${this.q}, ${this.r}, ${this.s}`);
                break;
            case 2: // End
                this.state = END;
                end.state = EMPTY;
                end = this;
                console.log(`Moved End to ${this.q}, ${this.r}, ${this.s}`);
                break;
        }
    }

    show() {
        push();
        translate(this.x, this.y);
        scale(zoom);

        if (this.state == EMPTY) {
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

        // Text
        fill("black");
        strokeWeight(1);

        // Co-ordinates
        textSize(40);
        textCentered(`${this.q}, ${this.r}, ${this.s}`, 0, 80); // Whitespace is using custom character

        // Label
        textSize(50);
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

        // Center
        // fill("red");
        // ellipse(0, 0, 10);

        pop();
    }

    getNeighbors() {
        return [
            // Horizontal
            grid[this.q + 1][this.r + 0],
            grid[this.q - 1][this.r + 0],

            // Left diag
            grid[this.q + 0][this.r + 1],
            grid[this.q + 0][this.r - 1],

            // Right diag
            grid[this.q - 1][this.r + 1],
            grid[this.q + 1][this.r - 1],
        ];
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
