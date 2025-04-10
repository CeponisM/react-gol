# React Game of Life

A interactive implementation of Conway's Game of Life built with React. Features a draggable grid, zoom controls, and dynamic grid sizing.

## Features

- **Interactive Grid**: Click individual cells to toggle them alive/dead
- **Selection Tool**: Right-click and drag to select and toggle multiple cells at once
- **Draggable Interface**: Pan around the grid by dragging
- **Zoom Control**: Adjust cell size with the zoom slider (0.6x to 3x)
- **Dynamic Grid Size**: Configure grid dimensions up to 100x100 cells
- **Play/Pause**: Start and stop the simulation
- **Reset**: Clear the entire grid

## Game Rules

Conway's Game of Life follows these simple rules:

1. **Underpopulation**: Live cells with fewer than 2 neighbors die
2. **Survival**: Live cells with 2 or 3 neighbors survive
3. **Overpopulation**: Live cells with more than 3 neighbors die
4. **Reproduction**: Dead cells with exactly 3 neighbors become alive

## Controls

- **Left Click**: Toggle individual cell state
- **Right Click + Drag**: Select and toggle multiple cells
- **Start/Stop Button**: Control simulation playback
- **Reset Button**: Clear all cells
- **W/H Inputs**: Adjust grid width and height (max 100)
- **Zoom Slider**: Scale cell size for better visibility

## Installation

```bash
npm install
```

## Available Scripts

- `npm start` - Run development server
- `npm build` - Build for production
- `npm test` - Run test suite
- `npm eject` - Eject from Create React App

## Dependencies

- **React** (^18.2.0) - Core framework
- **react-draggable** (^4.4.6) - Draggable grid functionality
- **react-scripts** (5.0.1) - Build tooling

## Browser Support

- Chrome (latest)
- Firefox (latest) 
- Safari (latest)
- Modern browsers with ES6+ support

## Development

This project was bootstrapped with Create React App. The simulation runs at 100ms intervals when active, and the grid state is managed through React hooks for optimal performance.
