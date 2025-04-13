let tileset = {
  '.': { type: 'floor', walkable: true, color: '#E8E8E8' },
  '#': { type: 'wall', walkable: false, color: '#6A6A6A' },
  'T': { type: 'tree', walkable: false, color: '#228B22' },
  '~': { type: 'water', walkable: false, color: '#4169E1' },
  ',': { type: 'grass', walkable: true, color: '#90EE90' },
  '+': { type: 'door', walkable: true, color: '#E8E8E8' }
};

// Initialize the game
function init() {
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = MAP_WIDTH;
  canvas.height = MAP_HEIGHT;
  document.body.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  
  // Add event listener for mouse clicks
  canvas.addEventListener('click', handleClick);
  
  initLevel()
  // Start game loop
  gameLoop(ctx);
}

let player
let camera = {
  x: 0,
  y: 0
};
let gameMap = [];

function initLevel() {
  const generator = new WFCDungeonGenerator(48, 48);
  const mapString = scaleMap(generator.generate(), 2)
  
  const rows = mapString.split('\n');
  for (let y = 0; y < rows.length; y++) {
    gameMap[y] = [];
    for (let x = 0; x < rows[y].length; x++) {
      gameMap[y][x] = rows[y][x];
    }
  }
  const positions = generateStartingPositions(mapString, 5)
  player = new Player(positions.player.x, positions.player.y)
}

// Resize canvas to fit the window
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  renderGame();
}

function gameLoop(ctx) {
  update();
  render(ctx);
  requestAnimationFrame(() => gameLoop(ctx));
}

function update() {
  // Update player's position
  player.update();
  
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
  player.renderReachableTiles(ctx, camera);
  
  // Draw player and path
  player.render(ctx, camera);
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
  
  // Try to move the player to the clicked tile
  player.moveTo(tileX, tileY);
}

// Initialize the game when the window loads
window.onload = init;