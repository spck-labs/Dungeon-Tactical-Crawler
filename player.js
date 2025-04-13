class Player {
  constructor(tileX, tileY) {
    // Position in pixels
    this.x = (tileX + 0.5) * TILE_SIZE;
    this.y = (tileY + 0.5) * TILE_SIZE;
    
    // Movement properties
    this.path = [];
    this.moveSpeed = PLAYER_MOVE_SPEED;
    this.visibleRadius = PLAYER_VISIBLE_RADIUS;
    
    // Visibility and pathfinding
    this.reachableTiles = [];
    
    // Initialize reachable tiles
    this.updateReachableTiles();
  }
  
  // Get current tile coordinates
  getTilePosition() {
    return {
      x: Math.floor(this.x / TILE_SIZE),
      y: Math.floor(this.y / TILE_SIZE)
    };
  }
  
  // Update player position based on path
  update() {
    if (this.path.length > 0) {
      const nextPoint = this.path[0];
      const targetX = nextPoint.x * TILE_SIZE + TILE_SIZE / 2;
      const targetY = nextPoint.y * TILE_SIZE + TILE_SIZE / 2;
      
      const dx = targetX - this.x;
      const dy = targetY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.moveSpeed) {
        // Player reached the next tile in path
        this.x = targetX;
        this.y = targetY;
        this.path.shift();
        
        // Update reachable tiles when player moves to a new tile
        if (this.path.length === 0) {
          this.updateReachableTiles();
        }
      } else {
        // Move player towards the next point
        this.x += (dx / distance) * this.moveSpeed;
        this.y += (dy / distance) * this.moveSpeed;
      }
    }
  }
  
  // Draw the player on the canvas
  render(ctx, camera) {
    // Draw player's path
    if (this.path.length > 0) {
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const pos = this.getTilePosition();
      
      ctx.moveTo(
        pos.x * TILE_SIZE + TILE_SIZE / 2 - camera.x,
        pos.y * TILE_SIZE + TILE_SIZE / 2 - camera.y
      );
      
      for (const point of this.path) {
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
      this.x - camera.x,
      this.y - camera.y,
      TILE_SIZE / 3,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  
  // Draw reachable tiles
  renderReachableTiles(ctx, camera) {
    ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
    for (const tile of this.reachableTiles) {
      ctx.fillRect(
        tile.x * TILE_SIZE - camera.x,
        tile.y * TILE_SIZE - camera.y,
        TILE_SIZE,
        TILE_SIZE
      );
    }
  }
  
  // Move to specified tile coordinates
  moveTo(tileX, tileY) {
    if (!this.isTileReachable(tileX, tileY)) {
      return false;
    }
    
    const pos = this.getTilePosition();
    const path = this.findPath(pos.x, pos.y, tileX, tileY);
    
    if (path.length > 0) {
      this.path = path;
      return true;
    }
    
    return false;
  }
  
  // Check if a tile is reachable
  isTileReachable(x, y) {
    return !!this.reachableTiles.find(t => t.x === x && t.y === y);
  }
  
  // A* Pathfinding algorithm
  findPath(startX, startY, endX, endY) {
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
    fScore[`${startX},${startY}`] = this.heuristic(startX, startY, endX, endY);
    
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
        return this.reconstructPath(cameFrom, current);
      }
      
      const currentKey = `${current.x},${current.y}`;
      closedSet.add(currentKey);
      
      // Check all neighbors
      const directions = [
        { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }
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
          fScore[neighborKey] = gScore[neighborKey] + this.heuristic(neighbor.x, neighbor.y, endX, endY);
          
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
  
  // Reconstruct path from A* results
  reconstructPath(cameFrom, current) {
    const path = [];
    let curr = current;
    
    while (cameFrom[`${curr.x},${curr.y}`]) {
      path.unshift(curr);
      curr = cameFrom[`${curr.x},${curr.y}`];
    }
    
    return path;
  }
  
  // Heuristic function for A*
  heuristic(x1, y1, x2, y2) {
    // Manhattan distance
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }
  
  // Flood fill algorithm to find reachable tiles within radius
  updateReachableTiles() {
    const pos = this.getTilePosition();
    
    this.reachableTiles = [];
    
    // Queue for BFS
    const queue = [{ x: pos.x, y: pos.y, distance: 0 }];
    const visited = new Set([`${pos.x},${pos.y}`]);
    
    while (queue.length > 0) {
      const current = queue.shift();
      
      // Add to reachable tiles
      this.reachableTiles.push({ x: current.x, y: current.y });
      
      // If we've reached max distance, don't explore further
      if (current.distance >= this.visibleRadius) {
        continue;
      }
      
      // Check all neighbors
      const directions = [
        { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }
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
}

