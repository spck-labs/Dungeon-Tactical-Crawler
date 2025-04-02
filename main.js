// Constants
const TILE_SIZE = 32;
const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;
const PLAYER_MOVE_SPEED = 3;
const PLAYER_VISIBLE_RADIUS = 5;

// Game State
let player = {
    x: 0,
    y: 0,
    targetX: null,
    targetY: null,
    path: [],
    reachableTiles: []
};

let camera = {
    x: 0,
    y: 0
};

let gameMap = [];
let tileset = {
    '.': { type: 'floor', walkable: true, color: '#E8E8E8' },
    '#': { type: 'wall', walkable: false, color: '#6A6A6A' },
    'T': { type: 'tree', walkable: false, color: '#228B22' },
    '~': { type: 'water', walkable: false, color: '#4169E1' },
    ',': { type: 'grass', walkable: true, color: '#90EE90' },
    '+': { type: 'door', walkable: true, color: '#8B4513' }
};

// Initialize the game
function init() {
    const mapString = `
########################################
#..............#,,,,,,,,,#............#
#..............#,,,,,,,,,#............#
#..............#,,,T,,,,,#............#
#..............#,,,,,,,,,#............#
#..............+,,,,,,,,,#............#
#..............#,,,,,,,,,#............#
#..............####+######............#
#.......................................#
#.......................................#
#.......................................#
#......~~~~~~...........................#
#......~~~~~.............................#
#......~~~~~~............................#
#...................TTT...................#
#..................TTTTT..................#
#..................TTTTT..................#
#...................TTT...................#
#.......................................#
#.......................................#
########################################
    `.trim();

    const rows = mapString.split('\n');
    for (let y = 0; y < rows.length; y++) {
        gameMap[y] = [];
        for (let x = 0; x < rows[y].length; x++) {
            gameMap[y][x] = rows[y][x];
            
            // Set player's initial position to the first floor tile
            if (rows[y][x] === '.' && player.x === 0 && player.y === 0) {
                player.x = x * TILE_SIZE + TILE_SIZE / 2;
                player.y = y * TILE_SIZE + TILE_SIZE / 2;
            }
        }
    }

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = MAP_WIDTH;
    canvas.height = MAP_HEIGHT;
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    
    // Add event listener for mouse clicks
    canvas.addEventListener('click', handleClick);

    // Update reachable tiles initially
    updateReachableTiles();
    
    // Start game loop
    gameLoop(ctx);
}

function gameLoop(ctx) {
    update();
    render(ctx);
    requestAnimationFrame(() => gameLoop(ctx));
}

function update() {
    // Move player along path if there is one
    if (player.path.length > 0) {
        const nextPoint = player.path[0];
        const targetX = nextPoint.x * TILE_SIZE + TILE_SIZE / 2;
        const targetY = nextPoint.y * TILE_SIZE + TILE_SIZE / 2;
        
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < PLAYER_MOVE_SPEED) {
            // Player reached the next tile in path
            player.x = targetX;
            player.y = targetY;
            player.path.shift();
            
            // Update reachable tiles when player moves to a new tile
            if (player.path.length === 0) {
                updateReachableTiles();
            }
        } else {
            // Move player towards the next point
            player.x += (dx / distance) * PLAYER_MOVE_SPEED;
            player.y += (dy / distance) * PLAYER_MOVE_SPEED;
        }
    }
    
    // Update camera to follow player
    camera.x = player.x - MAP_WIDTH / 2;
    camera.y = player.y - MAP_HEIGHT / 2;
    
    // Clamp camera to map bounds
    const mapPixelWidth = gameMap[0].length * TILE_SIZE;
    const mapPixelHeight = gameMap.length * TILE_SIZE;
    
    camera.x = Math.max(0, Math.min(camera.x, mapPixelWidth - MAP_WIDTH));
    camera.y = Math.max(0, Math.min(camera.y, mapPixelHeight - MAP_HEIGHT));
}

function render(ctx) {
    ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    
    // Calculate visible tile range
    const startX = Math.floor(camera.x / TILE_SIZE);
    const startY = Math.floor(camera.y / TILE_SIZE);
    const endX = Math.ceil((camera.x + MAP_WIDTH) / TILE_SIZE);
    const endY = Math.ceil((camera.y + MAP_HEIGHT) / TILE_SIZE);
    
    // Draw map tiles
    for (let y = startY; y < endY; y++) {
        if (y < 0 || y >= gameMap.length) continue;
        
        for (let x = startX; x < endX; x++) {
            if (x < 0 || x >= gameMap[y].length) continue;
            
            const tileType = gameMap[y][x];
            const tileInfo = tileset[tileType] || tileset['.'];
            
            // Draw tile
            ctx.fillStyle = tileInfo.color;
            ctx.fillRect(
                x * TILE_SIZE - camera.x,
                y * TILE_SIZE - camera.y,
                TILE_SIZE,
                TILE_SIZE
            );
            
            // Draw grid lines
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.strokeRect(
                x * TILE_SIZE - camera.x,
                y * TILE_SIZE - camera.y,
                TILE_SIZE,
                TILE_SIZE
            );
        }
    }
    
    // Draw reachable tiles overlay
    ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
    for (const tile of player.reachableTiles) {
        ctx.fillRect(
            tile.x * TILE_SIZE - camera.x,
            tile.y * TILE_SIZE - camera.y,
            TILE_SIZE,
            TILE_SIZE
        );
    }
    
    // Draw player's path
    if (player.path.length > 0) {
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const playerTileX = Math.floor(player.x / TILE_SIZE);
        const playerTileY = Math.floor(player.y / TILE_SIZE);
        
        ctx.moveTo(
            playerTileX * TILE_SIZE + TILE_SIZE / 2 - camera.x,
            playerTileY * TILE_SIZE + TILE_SIZE / 2 - camera.y
        );
        
        for (const point of player.path) {
            ctx.lineTo(
                point.x * TILE_SIZE + TILE_SIZE / 2 - camera.x,
                point.y * TILE_SIZE + TILE_SIZE / 2 - camera.y
            );
        }
        
        ctx.stroke();
    }
    
    // Draw player
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(
        player.x - camera.x,
        player.y - camera.y,
        TILE_SIZE / 3,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

function handleClick(event) {
    // Convert click position to map coordinates
    const rect = event.target.getBoundingClientRect();
    const clickX = event.clientX - rect.left + camera.x;
    const clickY = event.clientY - rect.top + camera.y;
    
    const tileX = Math.floor(clickX / TILE_SIZE);
    const tileY = Math.floor(clickY / TILE_SIZE);
    
    // Check if the tile is within map bounds
    if (tileX < 0 || tileY < 0 || tileX >= gameMap[0].length || tileY >= gameMap.length) {
        return;
    }
    
    // Get player's current tile position
    const playerTileX = Math.floor(player.x / TILE_SIZE);
    const playerTileY = Math.floor(player.y / TILE_SIZE);
    
    // Find path to clicked tile
    const path = findPath(playerTileX, playerTileY, tileX, tileY);
    
    if (path.length > 0) {
        player.path = path;
    }
}

// A* Pathfinding algorithm
function findPath(startX, startY, endX, endY) {
    // Check if the destination is walkable
    if (!isTileWalkable(endX, endY)) {
        return [];
    }
    
    const openSet = [];
    const closedSet = new Set();
    const cameFrom = {};
    
    // Cost from start to current
    const gScore = {};
    gScore[`${startX},${startY}`] = 0;
    
    // Estimated total cost
    const fScore = {};
    fScore[`${startX},${startY}`] = heuristic(startX, startY, endX, endY);
    
    openSet.push({
        x: startX,
        y: startY,
        f: fScore[`${startX},${startY}`]
    });
    
    while (openSet.length > 0) {
        // Sort by f-score and take the lowest
        openSet.sort((a, b) => a.f - b.f);
        const current = openSet.shift();
        
        // Check if we reached the goal
        if (current.x === endX && current.y === endY) {
            return reconstructPath(cameFrom, current);
        }
        
        const currentKey = `${current.x},${current.y}`;
        closedSet.add(currentKey);
        
        // Check all neighbors
        const directions = [
            {x: -1, y: 0}, {x: 1, y: 0}, {x: 0, y: -1}, {x: 0, y: 1}
        ];
        
        for (const dir of directions) {
            const neighbor = {
                x: current.x + dir.x,
                y: current.y + dir.y
            };
            
            const neighborKey = `${neighbor.x},${neighbor.y}`;
            
            // Skip if in closed set or not walkable
            if (
                closedSet.has(neighborKey) ||
                !isTileWalkable(neighbor.x, neighbor.y)
            ) {
                continue;
            }
            
            // Calculate tentative g-score
            const tentativeGScore = gScore[currentKey] + 1;
            
            // Check if this is a better path to the neighbor
            if (!gScore[neighborKey] || tentativeGScore < gScore[neighborKey]) {
                // Record this path
                cameFrom[neighborKey] = current;
                gScore[neighborKey] = tentativeGScore;
                fScore[neighborKey] = gScore[neighborKey] + heuristic(neighbor.x, neighbor.y, endX, endY);
                
                // Add to open set if not already there
                const existingIndex = openSet.findIndex(n => n.x === neighbor.x && n.y === neighbor.y);
                if (existingIndex === -1) {
                    openSet.push({
                        x: neighbor.x,
                        y: neighbor.y,
                        f: fScore[neighborKey]
                    });
                } else {
                    openSet[existingIndex].f = fScore[neighborKey];
                }
            }
        }
    }
    
    // No path found
    return [];
}

function reconstructPath(cameFrom, current) {
    const path = [];
    let curr = current;
    
    while (cameFrom[`${curr.x},${curr.y}`]) {
        path.unshift(curr);
        curr = cameFrom[`${curr.x},${curr.y}`];
    }
    
    return path;
}

function heuristic(x1, y1, x2, y2) {
    // Manhattan distance
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function isTileWalkable(x, y) {
    // Check map boundaries
    if (x < 0 || y < 0 || y >= gameMap.length || x >= gameMap[y].length) {
        return false;
    }
    
    const tileType = gameMap[y][x];
    return tileset[tileType] && tileset[tileType].walkable;
}

// Flood fill algorithm to find reachable tiles within radius
function updateReachableTiles() {
    const playerTileX = Math.floor(player.x / TILE_SIZE);
    const playerTileY = Math.floor(player.y / TILE_SIZE);
    
    player.reachableTiles = [];
    
    // Queue for BFS
    const queue = [{x: playerTileX, y: playerTileY, distance: 0}];
    const visited = new Set([`${playerTileX},${playerTileY}`]);
    
    while (queue.length > 0) {
        const current = queue.shift();
        
        // Add to reachable tiles
        player.reachableTiles.push({x: current.x, y: current.y});
        
        // If we've reached max distance, don't explore further
        if (current.distance >= PLAYER_VISIBLE_RADIUS) {
            continue;
        }
        
        // Check all neighbors
        const directions = [
            {x: -1, y: 0}, {x: 1, y: 0}, {x: 0, y: -1}, {x: 0, y: 1}
        ];
        
        for (const dir of directions) {
            const newX = current.x + dir.x;
            const newY = current.y + dir.y;
            const key = `${newX},${newY}`;
            
            if (!visited.has(key) && isTileWalkable(newX, newY)) {
                visited.add(key);
                queue.push({
                    x: newX,
                    y: newY,
                    distance: current.distance + 1
                });
            }
        }
    }
}

// Initialize the game when the window loads
window.onload = init;