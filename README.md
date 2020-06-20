# Honeycomb
#### A\* Pathfinding in a hexagonal grid

Use interactive tools to place obstacles or build mazes on a hexagonal grid, then press play and watch the algorithm explore.
Slow down time to get a closer look at what's happening, or even step through the process frame by frame.

[Live demo](https://honeycomb.glitch.me/)
[Source code](https://github.com/AlurienFlame/honeycomb)

#### What do the numbers mean?
The bottom three numbers are cubic co-ordinates representing the hex's position in two dimensional space.

Bottom left: X
Bottom middle: Y
Bottom right: Z

The top three numbers are the values assigned to the hex by the algorithm.

Top left: g-cost - Distance to start
Top right: h-cost - Distance to end
Top middle: f-cost -  Sum of both distances

#### What do the buttons do?

From left to right:

* Play / Pause - Determines whether to run through the algorithm automatically or let you step through it manually

* Step - Runs a single step of the algorithm. Useful for taking a more focused look at what's happening.

* Restart - Resets all open and closed hexes to empty, making the algorithm forget what route it took.

* Speed down - Decrements simulation speed.

* Speed up - Increments simulation speed.

Interactions controls: only one of these can be selected at once.

* Build Walls - With this control selected, click a hex to turn it into an impassable wall, forcing the algorithm to find another way around. Click a the wall again to return it to being an empty hex.

* Move Start - Clicking a hex with this control will relocate the algorithm's start point to that hex.

* Move End - Same as move start, but it moves the end point instead.