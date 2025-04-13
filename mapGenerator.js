class WFCDungeonGenerator {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    
    // Define tile types
    this.WALL = '#';
    this.FLOOR = '.';
    this.HALL = '+';
    this.EMPTY = ' ';
    
    // Initialize map with border
    this.map = Array(height).fill().map(() => Array(width).fill(this.EMPTY));
    for (let x = 0; x < width; x++) {
      this.map[0][x] = this.WALL;
      this.map[height - 1][x] = this.WALL;
    }
    for (let y = 0; y < height; y++) {
      this.map[y][0] = this.WALL;
      this.map[y][width - 1] = this.WALL;
    }
    
    // Define patterns
    this.setupPatterns();
    
    // Initialize WFC grid with all possibilities
    this.possibilities = Array(height).fill().map(() =>
      Array(width).fill().map(() => new Set(Object.keys(this.patterns).map(Number)))
    );
    
    // Set border cells to have only wall patterns
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
          this.possibilities[y][x] = new Set([0]); // 0 will be our wall pattern
        }
      }
    }
  }
  
  setupPatterns() {
    // For simplicity, we'll use simple patterns
    this.patterns = {
      0: this.WALL, // Wall
      1: this.FLOOR, // Floor
      2: this.HALL, // Hallway
    };
    
    // Define valid neighbors for each pattern (simplified rules)
    this.validNeighbors = {
      0: new Set([0, 2]), // Wall can be next to wall or hall
      1: new Set([1]), // Floor can be next to floor or hall
      2: new Set([0, 1, 2]), // Hall can be next to any tile
    };
  }
  
  isValidPosition(y, x) {
    return y >= 0 && y < this.height && x >= 0 && x < this.width;
  }
  
  getMinEntropyPosition() {
    let minEntropy = Infinity;
    let minPos = null;
    
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        const entropy = this.possibilities[y][x].size;
        if (1 < entropy && entropy < minEntropy) {
          minEntropy = entropy;
          minPos = [y, x];
        }
      }
    }
    
    return minPos;
  }
  
  propagate(y, x) {
    const queue = [
      [y, x]
    ];
    
    while (queue.length > 0) {
      const [currentY, currentX] = queue.shift();
      
      const directions = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1]
      ];
      for (const [dy, dx] of directions) {
        const ny = currentY + dy;
        const nx = currentX + dx;
        
        if (!this.isValidPosition(ny, nx)) {
          continue;
        }
        
        // Determine allowed patterns based on neighbor constraints
        const allowed = new Set();
        for (const pattern of this.possibilities[ny][nx]) {
          let valid = true;
          for (const neighborPattern of this.possibilities[currentY][currentX]) {
            if (!this.validNeighbors[neighborPattern]?.has(pattern)) {
              valid = false;
              break;
            }
          }
          if (valid) {
            allowed.add(pattern);
          }
        }
        
        // If we've reduced the possibilities, propagate further
        const oldCount = this.possibilities[ny][nx].size;
        if (allowed.size !== oldCount) {
          this.possibilities[ny][nx] = allowed;
          if (allowed.size < oldCount) {
            queue.push([ny, nx]);
          }
        }
      }
    }
  }
  
  collapse(y, x) {
    // Choose a random pattern from the possibilities
    const possArray = Array.from(this.possibilities[y][x]);
    const pattern = possArray[Math.floor(Math.random() * possArray.length)];
    this.possibilities[y][x] = new Set([pattern]);
    this.map[y][x] = this.patterns[pattern];
    
    // Propagate the constraints
    this.propagate(y, x);
  }
  
  generate() {
    // Seed with some initial rooms
    for (let i = 0; i < 10; i++) {
      const y = Math.floor(Math.random() * (this.height - 12)) + 5;
      const x = Math.floor(Math.random() * (this.width - 12)) + 5;
      const roomH = Math.floor(Math.random() * 4) + 3; // 3-6
      const roomW = Math.floor(Math.random() * 4) + 3; // 3-6
      
      // Place a room
      for (let ry = y; ry < Math.min(y + roomH, this.height - 1); ry++) {
        for (let rx = x; rx < Math.min(x + roomW, this.width - 1); rx++) {
          this.map[ry][rx] = this.FLOOR;
          this.possibilities[ry][rx] = new Set([1]); // Floor pattern
        }
      }
      
      // Add walls around the room
      for (let ry = y - 1; ry < y + roomH + 1; ry++) {
        for (let rx = x - 1; rx < x + roomW + 1; rx++) {
          if (this.isValidPosition(ry, rx) && this.map[ry][rx] === this.EMPTY) {
            this.map[ry][rx] = this.WALL;
            this.possibilities[ry][rx] = new Set([0]); // Wall pattern
          }
        }
      }
    }
    
    // Perform WFC algorithm
    while (true) {
      const pos = this.getMinEntropyPosition();
      if (pos === null) {
        break;
      }
      
      const [y, x] = pos;
      this.collapse(y, x);
    }
    
    // Fill in any remaining empty cells
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.map[y][x] === this.EMPTY) {
          this.map[y][x] = this.WALL;
        }
      }
    }
    
    // Connect all regions to ensure the map is fully connected
    this.connectRegions();
    
    // Remove dead ends
    this.removeDeadEnds();
    
    return this.map.map(row => row.join('')).join('\n');
  }
  
  floodFill(y, x, regionId, regions) {
    const queue = [
      [y, x]
    ];
    
    while (queue.length > 0) {
      const [currentY, currentX] = queue.shift();
      
      if (!this.isValidPosition(currentY, currentX) ||
        regions[currentY][currentX] !== -1 ||
        this.map[currentY][currentX] === this.WALL) {
        continue;
      }
      
      regions[currentY][currentX] = regionId;
      
      const directions = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1]
      ];
      for (const [dy, dx] of directions) {
        const ny = currentY + dy;
        const nx = currentX + dx;
        if (this.isValidPosition(ny, nx) &&
          regions[ny][nx] === -1 &&
          this.map[ny][nx] !== this.WALL) {
          queue.push([ny, nx]);
        }
      }
    }
  }
  
  pickRandomItems(array, n) {
    const shuffled = array
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
    
    return shuffled.slice(0, n);
  }
  
  connectRegions() {
    // Identify separate regions
    let regions = Array(this.height).fill().map(() => Array(this.width).fill(-1));
    let regionId = 0;
    
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this.map[y][x] !== this.WALL && regions[y][x] === -1) {
          this.floodFill(y, x, regionId, regions);
          regionId++;
        }
      }
    }
    
    // If only one region, we're already connected
    if (regionId <= 1) {
      return;
    }
    
    // Keep connecting regions until there's only one
    while (true) {
      // Find potential connection points between regions
      let connections = [];
      let secondaryConnections = []
      for (let y = 1; y < this.height - 1; y++) {
        for (let x = 1; x < this.width - 1; x++) {
          if (this.map[y][x] === this.WALL) {
            const adjacentRegions = new Set();
            let adjacentHalls = 0
            const directions = [
              [-1, 0],
              [1, 0],
              [0, -1],
              [0, 1]
            ];
            
            for (const [dy, dx] of directions) {
              const ny = y + dy;
              const nx = x + dx;
              if (this.isValidPosition(ny, nx) && regions[ny][nx] !== -1) {
                adjacentRegions.add(regions[ny][nx]);
                if (this.map[ny][nx] === this.HALL) {
                  adjacentHalls++;
                }
              }
            }
            
            if (adjacentRegions.size > 1) {
              connections.push([y, x]);
            } else if (adjacentHalls < 3) {
              secondaryConnections.push([y, x])
            }
          }
        }
      }
      
      if (connections.length === 0) {
        if (secondaryConnections.length) {
          connections = this.pickRandomItems(secondaryConnections, 9);
        } else {
          break
        }
      }
      
      // Connect one region
      const [y, x] = connections[Math.floor(Math.random() * connections.length)];
      this.map[y][x] = this.HALL;
      
      // Update regions
      regions = Array(this.height).fill().map(() => Array(this.width).fill(-1));
      regionId = 0;
      
      for (let y = 1; y < this.height - 1; y++) {
        for (let x = 1; x < this.width - 1; x++) {
          if ((this.map[y][x] === this.FLOOR || this.map[y][x] === this.HALL) && regions[y][x] === -1) {
            this.floodFill(y, x, regionId, regions);
            regionId++;
          }
        }
      }
      
      // If we're down to one region, we're done
      if (regionId <= 1) {
        break;
      }
    }
  }
  
  removeDeadEnds() {
    // Keep removing dead ends until there are none left
    let deadEndRemoved;
    do {
      deadEndRemoved = false;
      
      for (let y = 1; y < this.height - 1; y++) {
        for (let x = 1; x < this.width - 1; x++) {
          if (this.map[y][x] === this.FLOOR || this.map[y][x] === this.HALL) {
            // Count walls around this cell
            let wallCount = 0;
            const directions = [
              [-1, 0],
              [1, 0],
              [0, -1],
              [0, 1]
            ];
            
            for (const [dy, dx] of directions) {
              const ny = y + dy;
              const nx = x + dx;
              if (!this.isValidPosition(ny, nx) || this.map[ny][nx] === this.WALL) {
                wallCount++;
              }
            }
            
            // If surrounded by 3 or more walls, it's a dead end
            if (wallCount >= 3) {
              this.map[y][x] = this.WALL;
              deadEndRemoved = true;
            }
          }
        }
      }
    } while (deadEndRemoved);
  }
}

/**
 * Scales up a 2D ASCII tilemap by a factor of n.
 * 
 * @param {string} asciiMap - A multi-line string representing a 2D tilemap
 * @param {number} n - Scale factor (positive integer)
 * @returns {string} - The scaled-up ASCII tilemap
 */
function scaleMap(asciiMap, n) {
    // Validate inputs
    if (typeof asciiMap !== 'string' || asciiMap.trim() === '') {
        throw new Error('Input map must be a non-empty string');
    }
    
    if (!Number.isInteger(n) || n <= 0) {
        throw new Error('Scale factor must be a positive integer');
    }
    
    // If scale factor is 1, return the original map
    if (n === 1) return asciiMap;
    
    // Split the input map into lines
    const lines = asciiMap.split('\n');
    const scaledLines = [];
    
    // Process each line
    for (const line of lines) {
        // Horizontally scale each character in the line
        const scaledCharsInLine = [...line].map(char => char.repeat(n)).join('');
        
        // Vertically repeat the scaled line n times
        for (let i = 0; i < n; i++) {
            scaledLines.push(scaledCharsInLine);
        }
    }
    
    // Join the scaled lines back into a single string
    return scaledLines.join('\n');
}

/**
 * Generates starting positions for the player and enemies in a dungeon.
 * 
 * @param {string} dungeonMap - The ASCII dungeon map
 * @param {number} numEnemies - Number of enemies to place
 * @param {number} minEnemyDistance - Minimum distance from player to enemy (default: 5)
 * @returns {Object} Object containing player position and array of enemy positions
 */
function generateStartingPositions(dungeonMap, numEnemies, minEnemyDistance = 5) {
  // Validate inputs
  if (typeof dungeonMap !== 'string' || dungeonMap.trim() === '') {
    throw new Error('Input map must be a non-empty string');
  }
  
  if (!Number.isInteger(numEnemies) || numEnemies < 0) {
    throw new Error('Number of enemies must be a non-negative integer');
  }
  
  // Parse the map
  const lines = dungeonMap.split('\n');
  const height = lines.length;
  const width = lines[0].length;
  
  // Find all valid floor positions
  const floorPositions = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (lines[y][x] === '.' || lines[y][x] === '+') {
        floorPositions.push({ y, x });
      }
    }
  }
  
  if (floorPositions.length === 0) {
    throw new Error('No valid floor positions found in the map');
  }
  
  // Choose a random position for the player
  const playerIndex = Math.floor(Math.random() * floorPositions.length);
  const playerPos = floorPositions[playerIndex];
  
  // Remove the player position from available positions
  floorPositions.splice(playerIndex, 1);
  
  // Calculate Manhattan distance between positions
  const distance = (pos1, pos2) => {
    return Math.abs(pos1.y - pos2.y) + Math.abs(pos1.x - pos2.x);
  };
  
  // Find positions for enemies
  const enemyPositions = [];
  const actualEnemyCount = Math.min(numEnemies, floorPositions.length);
  
  // Filter positions that are far enough from the player
  let validEnemyPositions = floorPositions.filter(pos => 
    distance(pos, playerPos) >= minEnemyDistance
  );
  
  // If not enough valid positions, fall back to all available positions
  if (validEnemyPositions.length < actualEnemyCount) {
    validEnemyPositions = floorPositions;
  }
  
  // Choose random positions for enemies
  for (let i = 0; i < actualEnemyCount; i++) {
    if (validEnemyPositions.length === 0) break;
    
    const enemyIndex = Math.floor(Math.random() * validEnemyPositions.length);
    enemyPositions.push(validEnemyPositions[enemyIndex]);
    validEnemyPositions.splice(enemyIndex, 1);
  }
  
  return {
    player: playerPos,
    enemies: enemyPositions
  };
}

function isTileWalkable(x, y) {
  // Check map boundaries
  if (x < 0 || y < 0 || y >= gameMap.length || x >= gameMap[y].length) {
    return false;
  }
  
  const tileType = gameMap[y][x];
  return tileset[tileType] && tileset[tileType].walkable;
}
