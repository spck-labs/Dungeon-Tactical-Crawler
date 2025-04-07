A tile-based adventure game created using [Claude AI](https://anthropic.com) and [Spck Editor](https://spck.io).

## Features

- Tile-based movement system
- A* algorithm for path finding
- Flood-fill algorithm showing range of walkable tiles

# Demo

[1 Basic Tilebase Game with Pathfinding](https://spck.io/labs/OPkBxQEOo)

## Development

This project is a WIP. Star the [github repo](https://github.com/spck-labs/Dungeon-Tactical-Crawler) if you want to see more.

The following prompt was used to generate the initial code for this game.

```
Create a tilebased game using multiline string for tilemap.
- The tiles should be configurable and default to 32 by 32, top down perspective.
- The main character should be able to move around on the map and the map should scroll keeping the main character in the center of the screen.
- The player can move to a tile by clicking on it. the tile should be reachable, use a-star algorithm to determine if the tile is reachable by the player.
- The game should also show all tiles reachable by the player within a 8 tile radius which should be achieved using flood fill algorithm.
- The player should not be able to move beyond the 8 tile radius, additionally the game should only render the tiles within the 8 tile radius.
- The output code should be in vanilla Javascript and not use any libraries or frameworks.
```

## Controls

- **Desktop:**
  - Arrow keys for movement
  - Click for movement
  
- **Mobile:**
  - Click for movement

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Special thanks to Anthropic for creating Claude AI
