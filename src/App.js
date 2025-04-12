import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// Simple draggable component to avoid external dependency
const Draggable = ({ children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return; // Only left mouse button
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault();
  }, [position]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={dragRef}
      onMouseDown={handleMouseDown}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none'
      }}
    >
      {children}
    </div>
  );
};

function App() {
  // Memoized grid creation function
  const createEmptyGrid = useCallback((rows, cols) => {
    return Array.from({ length: rows }, () => Array(cols).fill(0));
  }, []);

  const [numRows, setNumRows] = useState(60);
  const [numCols, setNumCols] = useState(60);
  const [grid, setGrid] = useState(() => createEmptyGrid(60, 60));
  const [running, setRunning] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [speed, setSpeed] = useState(100); // Configurable speed
  const [generation, setGeneration] = useState(0);
  const [darkMode, setDarkMode] = useState(true); // Default dark mode
  
  const runningRef = useRef(running);
  const speedRef = useRef(speed);
  const intervalRef = useRef(null);
  
  runningRef.current = running;
  speedRef.current = speed;

  // Optimized neighbor calculation with bounds checking
  const calculateNeighbors = useCallback((grid, x, y, rows, cols) => {
    let neighbors = 0;
    const startX = Math.max(0, x - 1);
    const endX = Math.min(rows - 1, x + 1);
    const startY = Math.max(0, y - 1);
    const endY = Math.min(cols - 1, y + 1);
    
    for (let i = startX; i <= endX; i++) {
      for (let j = startY; j <= endY; j++) {
        if (i === x && j === y) continue;
        neighbors += grid[i][j];
      }
    }
    return neighbors;
  }, []);

  // Update grid dimensions with proper cleanup
  const updateGridSize = useCallback((rows, cols) => {
    const newRows = Math.max(1, Math.min(rows, 100));
    const newCols = Math.max(1, Math.min(cols, 100));
    setNumRows(newRows);
    setNumCols(newCols);
    setGrid(createEmptyGrid(newRows, newCols));
    setGeneration(0);
  }, [createEmptyGrid]);

  // Optimized simulation with proper cleanup
  const runSimulation = useCallback(() => {
    setGrid((currentGrid) => {
      const newGrid = currentGrid.map((row, x) =>
        row.map((cell, y) => {
          const neighbors = calculateNeighbors(currentGrid, x, y, numRows, numCols);
          // Conway's Game of Life rules
          if (cell === 1) {
            return neighbors === 2 || neighbors === 3 ? 1 : 0;
          } else {
            return neighbors === 3 ? 1 : 0;
          }
        })
      );
      return newGrid;
    });
    
    setGeneration(gen => gen + 1);
  }, [calculateNeighbors, numRows, numCols]);

  // Improved simulation loop with proper interval management
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(runSimulation, speedRef.current);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running, runSimulation]);

  // Reset grid function
  const resetGrid = useCallback(() => {
    setGrid(createEmptyGrid(numRows, numCols));
    setGeneration(0);
  }, [createEmptyGrid, numRows, numCols]);

  // Memoized cell size calculation
  const cellSize = useMemo(() => Math.max(8, 20 * zoomLevel), [zoomLevel]);

  // Selection state
  const [selecting, setSelecting] = useState(false);
  const [selection, setSelection] = useState({ startX: null, startY: null, endX: null, endY: null });
  const [selectionOverlay, setSelectionOverlay] = useState(null);

  const updateSelection = useCallback((x, y) => {
    setSelection(prev => ({ ...prev, endX: x, endY: y }));
  }, []);

  const handleMouseDown = useCallback((e, x, y) => {
    if (e.button === 2) { // Right click
      e.preventDefault();
      e.stopPropagation(); // Prevent dragging
      setSelecting(true);
      setSelection({ startX: x, startY: y, endX: x, endY: y });
    }
  }, []);

  const handleMouseEnter = useCallback((x, y) => {
    if (selecting) {
      updateSelection(x, y);
    }
  }, [selecting, updateSelection]);

  const handleMouseUp = useCallback((e) => {
    if (selecting) {
      e.stopPropagation(); // Prevent dragging
      setSelecting(false);
      const { startX, startY, endX, endY } = selection;
      
      setGrid(currentGrid => {
        const newGrid = currentGrid.map(row => [...row]);
        const minX = Math.min(startX, endX);
        const maxX = Math.max(startX, endX);
        const minY = Math.min(startY, endY);
        const maxY = Math.max(startY, endY);
        
        for (let i = minX; i <= maxX; i++) {
          for (let j = minY; j <= maxY; j++) {
            newGrid[i][j] = newGrid[i][j] ? 0 : 1;
          }
        }
        return newGrid;
      });
      
      setSelection({ startX: null, startY: null, endX: null, endY: null });
    }
  }, [selecting, selection]);

  // Single cell toggle
  const toggleCell = useCallback((x, y) => {
    setGrid(currentGrid => {
      const newGrid = currentGrid.map(row => [...row]);
      newGrid[x][y] = newGrid[x][y] ? 0 : 1;
      return newGrid;
    });
  }, []);

  // Count live cells
  const liveCells = useMemo(() => {
    return grid.reduce((count, row) => 
      count + row.reduce((rowCount, cell) => rowCount + cell, 0), 0
    );
  }, [grid]);

  // Add some preset patterns
  const addPattern = useCallback((pattern, startX = 0, startY = 0) => {
    setGrid(currentGrid => {
      const newGrid = currentGrid.map(row => [...row]);
      pattern.forEach((row, i) => {
        row.forEach((cell, j) => {
          const x = startX + i;
          const y = startY + j;
          if (x >= 0 && x < numRows && y >= 0 && y < numCols) {
            newGrid[x][y] = cell;
          }
        });
      });
      return newGrid;
    });
  }, [numRows, numCols]);

  // Preset patterns
  const patterns = {
    glider: [
      [0, 1, 0],
      [0, 0, 1],
      [1, 1, 1]
    ],
    block: [
      [1, 1],
      [1, 1]
    ],
    blinker: [
      [1, 1, 1]
    ]
  };

  // Visual selection overlay calculation
  const getSelectionOverlay = useMemo(() => {
    if (!selecting || selection.startX === null) return null;
    
    const { startX, startY, endX, endY } = selection;
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);
    
    return {
      left: minY * cellSize,
      top: minX * cellSize,
      width: (maxY - minY + 1) * cellSize,
      height: (maxX - minX + 1) * cellSize
    };
  }, [selecting, selection, cellSize]);

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: darkMode ? '#1a1a1a' : 'white',
      color: darkMode ? 'white' : 'black'
    }} onContextMenu={(e) => e.preventDefault()}>
      
      {/* Control Panel */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '15px',
        alignItems: 'center',
        padding: '15px',
        backgroundColor: darkMode ? '#2d2d2d' : 'white',
        borderBottom: `1px solid ${darkMode ? '#444' : '#ddd'}`,
        position: 'relative',
        zIndex: 100 // Ensure controls stay above canvas
      }}>
        
        {/* Dark Mode Toggle */}
        <button 
          onClick={() => setDarkMode(!darkMode)}
          style={{
            padding: '8px 12px',
            backgroundColor: darkMode ? '#444' : '#f0f0f0',
            color: darkMode ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>

        {/* Grid Size Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label>W:</label>
          <input 
            type="number"
            min="1"
            max="100"
            value={numCols}
            onChange={(e) => updateGridSize(numRows, Number(e.target.value))}
            style={{ 
              width: '60px', 
              padding: '4px',
              backgroundColor: darkMode ? '#444' : 'white',
              color: darkMode ? 'white' : 'black',
              border: `1px solid ${darkMode ? '#666' : '#ccc'}`
            }}
          />
          <label>H:</label>
          <input 
            type="number"
            min="1"
            max="100"
            value={numRows}
            onChange={(e) => updateGridSize(Number(e.target.value), numCols)}
            style={{ 
              width: '60px', 
              padding: '4px',
              backgroundColor: darkMode ? '#444' : 'white',
              color: darkMode ? 'white' : 'black',
              border: `1px solid ${darkMode ? '#666' : '#ccc'}`
            }}
          />
        </div>

        {/* Simulation Controls */}
        <button 
          onClick={() => setRunning(!running)}
          style={{
            padding: '8px 16px',
            backgroundColor: running ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {running ? 'Stop' : 'Start'}
        </button>

        <button 
          onClick={resetGrid}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reset
        </button>

        {/* Speed Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label>Speed:</label>
          <input
            type="range"
            min="50"
            max="500"
            step="50"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            style={{ width: '100px' }}
          />
          <span>{speed}ms</span>
        </div>

        {/* Zoom Control */}
        <input
          type="range"
          min="0.3"
          max="3"
          step="0.1"
          value={zoomLevel}
          onChange={(e) => setZoomLevel(Number(e.target.value))}
        />

        {/* Pattern Buttons */}
        <div style={{ display: 'flex', gap: '5px' }}>
          {Object.entries(patterns).map(([name, pattern]) => (
            <button
              key={name}
              onClick={() => addPattern(pattern, Math.floor(numRows/2), Math.floor(numCols/2))}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                backgroundColor: darkMode ? '#555' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div style={{ 
          marginLeft: 'auto',
          display: 'flex',
          gap: '15px',
          fontSize: '14px'
        }}>
          <span>Generation: {generation}</span>
          <span>Live Cells: {liveCells}</span>
        </div>
      </div>

      {/* Game Grid Container - Full Width/Height with proper z-index */}
      <div style={{
        flex: 1,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: darkMode ? '#1a1a1a' : 'white',
        position: 'relative',
        zIndex: 1 // Below controls
      }}>
        <Draggable>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '100%',
            minHeight: '100%',
            position: 'relative'
          }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${numCols}, ${cellSize}px)`,
                backgroundColor: darkMode ? '#1a1a1a' : 'white',
                position: 'relative'
              }}
            >
              {/* Selection Overlay */}
              {getSelectionOverlay && (
                <div
                  style={{
                    position: 'absolute',
                    left: getSelectionOverlay.left,
                    top: getSelectionOverlay.top,
                    width: getSelectionOverlay.width,
                    height: getSelectionOverlay.height,
                    backgroundColor: 'rgba(0, 123, 255, 0.3)',
                    border: '2px solid #007bff',
                    pointerEvents: 'none',
                    zIndex: 10
                  }}
                />
              )}
              
              {grid.map((row, i) =>
                row.map((cell, j) => (
                  <div
                    key={`${i}-${j}`}
                    onMouseDown={(e) => handleMouseDown(e, i, j)}
                    onMouseEnter={() => handleMouseEnter(i, j)}
                    onMouseUp={handleMouseUp}
                    onClick={() => toggleCell(i, j)}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: cell ? (darkMode ? '#f0f0f0' : '#f0f0f0') : undefined,
                      border: `solid 1px ${darkMode ? '#444' : 'gray'}`,
                      cursor: 'pointer'
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </Draggable>
      </div>
    </div>
  );
}

export default App;