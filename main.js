const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
canvas.width = 800;
canvas.height = 600;

const CONFIG = {
  tileSize: 32,
  playerSpeed: 3,
  backgroundColor: '#222',
  debug: false
};

const TILES = {
  '.': { color: '#228B22', solid: false, name: 'grass' },
  '#': { color: '#8B4513', solid: true, name: 'wall' },
  '~': { color: '#1E90FF', solid: true, name: 'water' },
  '^': { color: '#A9A9A9', solid: true, name: 'mountain' },
  ' ': { color: '#228B22', solid: false, name: 'empty' },
  'T': { color: '#006400', solid: true, name: 'tree' },
  'H': { color: '#CD853F', solid: false, name: 'house' }
};

const MAP = `
############################################################
#..........................................................#
#..............................H...........................#
#.......................T..................................#
#...............T.........................................T#
#....T.......T............................................T#
#..........................................................#
#........................................T.................#
#................................................T.........#
#..........................................................#
#...................^^^^^................................T.#
#...................^^^^^.................................T#
#...................^^^^^.................................T#
#.....................^^^..................................#
#..........................................................#
#.............................~~~~..........T..............#
#.............................~~~~.........................#
#.............................~~~~.........................#
#..........................................................#
#....................................H.....................#
#.....................................T....................#
#............T..............................................#
#..........................................................#
#........T.........T.......T..............................#
#...........................................T..............#
#....................................T.....................#
#.............................H............................#
#..........................................................#
#..........................................................#
#....T.......T............T................................#
#..........................................................#
#.......................^^^..............................T.#
#.......................^^^...............................T#
#.......................^^^...............................T#
#..........................................................#
#.............................~~~~..........T..............#
#.............................~~~~.........................#
#.............................~~~~.........................#
#......H.................................................H.#
#...T......................................................#
#..........................................................#
############################################################
`;

const player = {
  x: 5 * CONFIG.tileSize,
  y: 5 * CONFIG.tileSize,
  width: CONFIG.tileSize - 4,
  height: CONFIG.tileSize - 4,
  color: '#FF0000',
  speed: CONFIG.playerSpeed,
  moving: {
    up: false,
    down: false,
    left: false,
    right: false
  }
};

const camera = {
  x: 0,
  y: 0,
  width: canvas.width,
  height: canvas.height,
  update: function() {
    // Center the camera on the player
    this.x = player.x - this.width / 2 + player.width / 2;
    this.y = player.y - this.height / 2 + player.height / 2;
    
    // Prevent the camera from showing areas outside the map
    const mapWidth = mapArray[0].length * CONFIG.tileSize;
    const mapHeight = mapArray.length * CONFIG.tileSize;
    
    this.x = Math.max(0, Math.min(this.x, mapWidth - this.width));
    this.y = Math.max(0, Math.min(this.y, mapHeight - this.height));
  }
};

const mapArray = MAP.trim().split('\n').map(row => row.split(''));

function init() {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  
  gameLoop();
}

function handleKeyDown(e) {
  updatePlayerMovement(e.key, true);
}

function handleKeyUp(e) {
  updatePlayerMovement(e.key, false);
}

function updatePlayerMovement(key, isMoving) {
  switch(key) {
    case 'ArrowUp':
    case 'w':
      player.moving.up = isMoving;
      break;
    case 'ArrowDown':
    case 's':
      player.moving.down = isMoving;
      break;
    case 'ArrowLeft':
    case 'a':
      player.moving.left = isMoving;
      break;
    case 'ArrowRight':
    case 'd':
      player.moving.right = isMoving;
      break;
  }
}

function checkCollision(x, y) {
  const tileX = Math.floor(x / CONFIG.tileSize);
  const tileY = Math.floor(y / CONFIG.tileSize);
  
  if (tileY >= 0 && tileY < mapArray.length && 
      tileX >= 0 && tileX < mapArray[tileY].length) {
    const tileType = mapArray[tileY][tileX];
    return TILES[tileType] && TILES[tileType].solid;
  }
  
  return true;
}

function update() {
  let newX = player.x;
  let newY = player.y;
  
  if (player.moving.up) newY -= player.speed;
  if (player.moving.down) newY += player.speed;
  if (player.moving.left) newX -= player.speed;
  if (player.moving.right) newX += player.speed;
  
  if (!checkCollision(newX, player.y) && 
      !checkCollision(newX + player.width, player.y) &&
      !checkCollision(newX, player.y + player.height) &&
      !checkCollision(newX + player.width, player.y + player.height)) {
    player.x = newX;
  }
  
  // Reset newX if we couldn't move horizontally
  newX = player.x;
  
  // Check collision for vertical movement
  if (!checkCollision(newX, newY) && 
      !checkCollision(newX + player.width, newY) &&
      !checkCollision(newX, newY + player.height) &&
      !checkCollision(newX + player.width, newY + player.height)) {
    player.y = newY;
  }
  
  // Update camera position
  camera.update();
}

function render() {
  // Clear the canvas
  ctx.fillStyle = CONFIG.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Calculate which tiles are visible
  const startCol = Math.floor(camera.x / CONFIG.tileSize);
  const endCol = Math.min(mapArray[0].length - 1, startCol + Math.ceil(canvas.width / CONFIG.tileSize));
  
  const startRow = Math.floor(camera.y / CONFIG.tileSize);
  const endRow = Math.min(mapArray.length - 1, startRow + Math.ceil(canvas.height / CONFIG.tileSize));
  
  // Draw visible tiles
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const tileType = mapArray[row][col];
      const tile = TILES[tileType] || TILES[' ']; // Default to empty if unknown tile
      
      ctx.fillStyle = tile.color;
      ctx.fillRect(
        col * CONFIG.tileSize - camera.x,
        row * CONFIG.tileSize - camera.y,
        CONFIG.tileSize,
        CONFIG.tileSize
      );
      
      // Draw tile borders in debug mode
      if (CONFIG.debug) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.strokeRect(
          col * CONFIG.tileSize - camera.x,
          row * CONFIG.tileSize - camera.y,
          CONFIG.tileSize,
          CONFIG.tileSize
        );
      }
    }
  }
  
  // Draw player
  ctx.fillStyle = player.color;
  ctx.fillRect(
    player.x - camera.x,
    player.y - camera.y,
    player.width,
    player.height
  );
  
  // Draw debug info
  if (CONFIG.debug) {
    ctx.font = '14px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(`Player: (${Math.floor(player.x)}, ${Math.floor(player.y)})`, 10, 20);
    ctx.fillText(`Camera: (${Math.floor(camera.x)}, ${Math.floor(camera.y)})`, 10, 40);
  }
}

// Main game loop
function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

window.onload = init;