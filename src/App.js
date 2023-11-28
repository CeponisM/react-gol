import React, { useState, useCallback, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import './App.css';

function App() {
  // Updated createEmptyGrid function to accept dynamic rows and columns
  const createEmptyGrid = (rows, cols) => {
    return Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
  };
  const [numRows, setNumRows] = useState(60);
  const [numCols, setNumCols] = useState(60);
  const [grid, setGrid] = useState(createEmptyGrid(numRows, numCols));
  const [running, setRunning] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // Zoom level state
  const runningRef = useRef(running);
  runningRef.current = running;

  // Update grid dimensions
  const updateGridSize = (rows, cols) => {
    const newRows = Math.min(rows, 100); // Limit rows to 100
    const newCols = Math.min(cols, 100); // Limit cols to 100
    setNumRows(newRows);
    setNumCols(newCols);
    setGrid(createEmptyGrid(newRows, newCols));
  };  

  const calculateNeighbors = (grid, x, y) => {
    let neighbors = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) {
          continue; // Skip the cell itself
        }
        const x_neighbor = x + i;
        const y_neighbor = y + j;
        // Check boundaries and increment neighbors if alive
        if (x_neighbor >= 0 && x_neighbor < numRows && y_neighbor >= 0 && y_neighbor < numCols) {
          neighbors += grid[x_neighbor][y_neighbor];
        }
      }
    }
    return neighbors;
  };

  // Run simulation
  const runSimulation = useCallback(() => {
    if (!runningRef.current) {
      return;
    }

    setGrid((currentGrid) => {
      return currentGrid.map((row, x) =>
        row.map((cell, y) => {
          const neighbors = calculateNeighbors(currentGrid, x, y);
          if (cell === 1 && (neighbors < 2 || neighbors > 3)) {
            return 0; // Cell dies
          } else if (cell === 0 && neighbors === 3) {
            return 1; // Cell becomes alive
          }
          return cell;
        })
      );
    });

    // Recursively run simulation
    setTimeout(runSimulation, 100);
  }, []);

  const resetGrid = () => {
    setGrid(createEmptyGrid());
  };

  const cellSize = 20 * zoomLevel; // Adjust cell size based on zoom level

  useEffect(() => {
    runningRef.current = running; // Update ref when running changes
    if (running) {
      runSimulation();
    }
  }, [running, runSimulation]); // Depend on running

  const [selecting, setSelecting] = useState(false);
  const [selection, setSelection] = useState({ startX: null, startY: null, endX: null, endY: null });

  const updateSelection = (x, y) => {
    setSelection(prev => ({
      ...prev,
      endX: x,
      endY: y
    }));
  };

  const handleMouseDown = (e, x, y) => {
    if (e.button === 2) { // Right click
      e.preventDefault();
      setSelecting(true);
      setSelection({ startX: x, startY: y, endX: x, endY: y });
    }
  };

  const handleMouseEnter = (x, y) => {
    if (selecting) {
      updateSelection(x, y);
    }
  };

  const handleMouseUp = () => {
    if (selecting) {
      setSelecting(false);
      const newGrid = [...grid];
      const { startX, startY, endX, endY } = selection;
      for (let i = Math.min(startX, endX); i <= Math.max(startX, endX); i++) {
        for (let j = Math.min(startY, endY); j <= Math.max(startY, endY); j++) {
          newGrid[i][j] = grid[i][j] ? 0 : 1; // Toggle cell state
        }
      }
      setGrid(newGrid);
      setSelection({ startX: null, startY: null, endX: null, endY: null });
    }
  };

  return (
    <div className="App" onContextMenu={(e) => e.preventDefault()}>
      <div className='button-layer'>
        <div className='input-title'>
          W:
          <input 
            type="number"
            max="100"
            value={numCols}
            onChange={(e) => updateGridSize(numRows, Number(e.target.value))}
            className='input-size'
          />
          H:
          <input 
            type="number"
            max="100"
            value={numRows}
            onChange={(e) => updateGridSize(Number(e.target.value), numCols)}
            className='input-size'
          />
        </div>


        <button onClick={() => setRunning(!running)}>
          {running ? 'Stop' : 'Start'}
        </button>
        <button onClick={resetGrid} className="reset-button">Reset</button>

        <input
          type="range"
          min="0.6"
          max="3"
          step="0.1"
          value={zoomLevel}
          onChange={(e) => setZoomLevel(Number(e.target.value))}
        />
      </div>
      <div className='container'>
        <Draggable>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${numCols}, ${cellSize}px)`,
            }}
          >
            {grid.map((rows, i) =>
              rows.map((col, k) => (
                <div
                  key={`${i}-${k}`}
                  onMouseDown={(e) => handleMouseDown(e, i, k)}
                  onMouseEnter={() => handleMouseEnter(i, k)}
                  onMouseUp={handleMouseUp}
                  onClick={() => {
                      const newGrid = [...grid];
                      newGrid[i][k] = grid[i][k] ? 0 : 1;
                      setGrid(newGrid);
                  }}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: grid[i][k] ? '#f0f0f0' : undefined,
                    border: 'solid 1px gray'
                  }}
                />
              ))
            )}
          </div>
        </Draggable>
      </div>
    </div>
  );
}

export default App;