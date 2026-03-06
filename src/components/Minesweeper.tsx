import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Bomb, Flag, Clock, RotateCcw, Trophy, Volume2, VolumeX } from 'lucide-react';
import { audio } from '../services/audioService';

interface MinesweeperProps {
  onBack: () => void;
}

type Cell = {
  row: number;
  col: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
};

const ROWS = 10;
const COLS = 10;
const TOTAL_MINES = 15;

export function Minesweeper({ onBack }: MinesweeperProps) {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [minesLeft, setMinesLeft] = useState(TOTAL_MINES);
  const [time, setTime] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(audio.isSoundEnabled());

  const toggleSound = () => {
    setSoundEnabled(audio.toggleSound());
  };

  // Initialize Grid
  const initializeGrid = useCallback(() => {
    let newGrid: Cell[][] = [];
    for (let r = 0; r < ROWS; r++) {
      let row: Cell[] = [];
      for (let c = 0; c < COLS; c++) {
        row.push({
          row: r,
          col: c,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
        });
      }
      newGrid.push(row);
    }

    // Place Mines
    let minesPlaced = 0;
    while (minesPlaced < TOTAL_MINES) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      if (!newGrid[r][c].isMine) {
        newGrid[r][c].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate Neighbors
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!newGrid[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && newGrid[nr][nc].isMine) {
                count++;
              }
            }
          }
          newGrid[r][c].neighborMines = count;
        }
      }
    }

    setGrid(newGrid);
    setGameState('playing');
    setMinesLeft(TOTAL_MINES);
    setTime(0);
  }, []);

  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  // Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'playing') {
      timer = setInterval(() => setTime(t => t + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [gameState]);

  const revealCell = (r: number, c: number) => {
    if (gameState !== 'playing' || grid[r][c].isRevealed || grid[r][c].isFlagged) return;

    const newGrid = [...grid.map(row => [...row])];
    
    if (newGrid[r][c].isMine) {
      // Game Over
      newGrid[r][c].isRevealed = true;
      setGrid(newGrid);
      setGameState('lost');
      audio.playLose();
      return;
    }

    // Flood fill for empty cells
    const stack = [[r, c]];
    while (stack.length > 0) {
      const [currR, currC] = stack.pop()!;
      if (!newGrid[currR][currC].isRevealed) {
        newGrid[currR][currC].isRevealed = true;
        if (newGrid[currR][currC].neighborMines === 0) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = currR + dr;
              const nc = currC + dc;
              if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !newGrid[nr][nc].isRevealed && !newGrid[nr][nc].isFlagged) {
                stack.push([nr, nc]);
              }
            }
          }
        }
      }
    }

    setGrid(newGrid);
    audio.playClick();
    checkWinCondition(newGrid);
  };

  const toggleFlag = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameState !== 'playing' || grid[r][c].isRevealed) return;

    const newGrid = [...grid.map(row => [...row])];
    const cell = newGrid[r][c];
    
    if (!cell.isFlagged && minesLeft > 0) {
      cell.isFlagged = true;
      setMinesLeft(prev => prev - 1);
      audio.playClick();
    } else if (cell.isFlagged) {
      cell.isFlagged = false;
      setMinesLeft(prev => prev + 1);
      audio.playClick();
    }
    
    setGrid(newGrid);
  };

  const checkWinCondition = (currentGrid: Cell[][]) => {
    let unrevealedSafeCells = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!currentGrid[r][c].isMine && !currentGrid[r][c].isRevealed) {
          unrevealedSafeCells++;
        }
      }
    }
    if (unrevealedSafeCells === 0) {
      setGameState('won');
      audio.playWin();
    }
  };

  const getNumberColor = (count: number) => {
    const colors = [
      '', // 0
      'text-cyan-400', // 1
      'text-emerald-400', // 2
      'text-red-400', // 3
      'text-purple-400', // 4
      'text-yellow-400', // 5
      'text-pink-400', // 6
      'text-orange-400', // 7
      'text-gray-400' // 8
    ];
    return colors[count] || 'text-white';
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Topbar */}
      <div className="relative z-10 p-6 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-full glass-panel hover:bg-white/10 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium hidden sm:block">Voltar ao Dashboard</span>
        </button>
        <div className="flex items-center gap-3">
          <Bomb className="w-6 h-6 text-cyan-400" />
          <h1 className="font-display text-xl font-bold tracking-wider">CYBER BREACH</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleSound}
            className="p-2 rounded-full glass-panel hover:bg-white/10 transition-colors cursor-pointer"
            title={soundEnabled ? "Desativar Som" : "Ativar Som"}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Game Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
        
        {/* HUD */}
        <div className="w-full max-w-md flex items-center justify-between mb-8 glass-panel p-4 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 bg-black/50 px-4 py-2 rounded-xl border border-cyan-500/30">
            <Flag className="w-5 h-5 text-cyan-400" />
            <span className="font-mono text-xl text-cyan-400 font-bold">{minesLeft.toString().padStart(2, '0')}</span>
          </div>

          <button 
            onClick={initializeGrid}
            className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all cursor-pointer hover:rotate-180 duration-500"
          >
            <RotateCcw className="w-6 h-6 text-gray-300" />
          </button>

          <div className="flex items-center gap-2 bg-black/50 px-4 py-2 rounded-xl border border-purple-500/30">
            <Clock className="w-5 h-5 text-purple-400" />
            <span className="font-mono text-xl text-purple-400 font-bold">{time.toString().padStart(3, '0')}</span>
          </div>
        </div>

        {/* Board */}
        <div className="glass-panel p-4 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(6,182,212,0.1)]">
          <div 
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
          >
            {grid.map((row, r) => 
              row.map((cell, c) => (
                <motion.button
                  key={`${r}-${c}`}
                  whileHover={!cell.isRevealed && gameState === 'playing' ? { scale: 1.1, zIndex: 10 } : {}}
                  whileTap={!cell.isRevealed && gameState === 'playing' ? { scale: 0.9 } : {}}
                  onClick={() => revealCell(r, c)}
                  onContextMenu={(e) => toggleFlag(e, r, c)}
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-md flex items-center justify-center font-mono font-bold text-lg transition-colors cursor-pointer ${
                    cell.isRevealed 
                      ? cell.isMine 
                        ? 'bg-red-500/20 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                        : 'bg-black/40 border border-white/5'
                      : 'bg-white/10 border border-white/20 hover:bg-white/20 hover:border-cyan-400/50'
                  }`}
                >
                  {cell.isRevealed ? (
                    cell.isMine ? (
                      <Bomb className="w-5 h-5 text-red-400 animate-pulse" />
                    ) : (
                      cell.neighborMines > 0 && (
                        <span className={getNumberColor(cell.neighborMines)}>
                          {cell.neighborMines}
                        </span>
                      )
                    )
                  ) : cell.isFlagged ? (
                    <Flag className="w-5 h-5 text-cyan-400" />
                  ) : null}
                </motion.button>
              ))
            )}
          </div>
        </div>

        {/* Game Over / Win Overlay */}
        {(gameState === 'won' || gameState === 'lost') && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center"
          >
            <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl border backdrop-blur-md ${
              gameState === 'won' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {gameState === 'won' ? (
                <>
                  <Trophy className="w-6 h-6" />
                  <span className="font-bold text-lg">Sistema Hackeado com Sucesso!</span>
                </>
              ) : (
                <>
                  <Bomb className="w-6 h-6" />
                  <span className="font-bold text-lg">Brecha Detectada. Conexão Perdida.</span>
                </>
              )}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
