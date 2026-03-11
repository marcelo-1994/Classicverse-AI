import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Float, Text } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowLeft, Bomb, Flag, Clock, RotateCcw, Trophy, Volume2, VolumeX, Maximize } from 'lucide-react';
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

// --- 3D Components ---

function Cell3D({ 
  cell, 
  onClick, 
  onContextMenu, 
  gameState 
}: { 
  cell: Cell, 
  onClick: () => void, 
  onContextMenu: (e: any) => void,
  gameState: string
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const getCellColor = () => {
    if (cell.isRevealed) {
      if (cell.isMine) return "#ef4444";
      return "#1a1a1a";
    }
    if (cell.isFlagged) return "#facc15";
    return hovered ? "#333333" : "#0a0a0a";
  };

  const getNumberColor = (count: number) => {
    const colors = [
      '', // 0
      '#22d3ee', // 1
      '#34d399', // 2
      '#f87171', // 3
      '#c084fc', // 4
      '#fbbf24', // 5
      '#f472b6', // 6
      '#fb923c', // 7
      '#9ca3af' // 8
    ];
    return colors[count] || '#ffffff';
  };

  useFrame(() => {
    if (meshRef.current) {
      const targetScale = hovered && !cell.isRevealed ? 1.05 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      
      const targetY = cell.isRevealed ? -0.1 : 0;
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.1);
    }
  });

  return (
    <group position={[cell.col - COLS / 2 + 0.5, 0, cell.row - ROWS / 2 + 0.5]}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onContextMenu={(e) => {
          e.nativeEvent.preventDefault();
          e.stopPropagation();
          onContextMenu(e);
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.9, 0.4, 0.9]} />
        <meshStandardMaterial 
          color={getCellColor()} 
          roughness={0.2}
          metalness={0.8}
          emissive={cell.isRevealed && cell.isMine ? "#ef4444" : "#000000"}
          emissiveIntensity={cell.isRevealed && cell.isMine ? 0.5 : 0}
        />
      </mesh>

      {cell.isRevealed && !cell.isMine && cell.neighborMines > 0 && (
        <Text
          position={[0, 0.21, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.5}
          color={getNumberColor(cell.neighborMines)}
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
        >
          {cell.neighborMines}
        </Text>
      )}

      {cell.isRevealed && cell.isMine && (
        <Float speed={5} rotationIntensity={2} floatIntensity={0.5}>
          <mesh position={[0, 0.3, 0]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color="#000000" roughness={0} metalness={1} />
          </mesh>
        </Float>
      )}

      {cell.isFlagged && !cell.isRevealed && (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <mesh position={[0, 0.4, 0]}>
            <coneGeometry args={[0.15, 0.4, 8]} />
            <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.5} />
          </mesh>
        </Float>
      )}
    </group>
  );
}

function Scene({ 
  grid, 
  onCellClick, 
  onCellContextMenu, 
  gameState 
}: { 
  grid: Cell[][], 
  onCellClick: (r: number, c: number) => void, 
  onCellContextMenu: (r: number, c: number) => void,
  gameState: string
}) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 10, 8]} fov={45} />
      <OrbitControls 
        enablePan={false} 
        minPolarAngle={0} 
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={15}
      />
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} castShadow />
      <Environment preset="night" />
      
      <group position={[0, 0, 0]}>
        {grid.map((row, r) => 
          row.map((cell, c) => (
            <Cell3D 
              key={`${r}-${c}`} 
              cell={cell} 
              onClick={() => onCellClick(r, c)} 
              onContextMenu={() => onCellContextMenu(r, c)}
              gameState={gameState}
            />
          ))
        )}
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]} receiveShadow>
        <planeGeometry args={[COLS + 1, ROWS + 1]} />
        <meshStandardMaterial color="#050505" roughness={0.5} metalness={0.5} />
      </mesh>
      
      <ContactShadows position={[0, -0.24, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
    </>
  );
}

// --- Main Component ---

export function Minesweeper({ onBack }: MinesweeperProps) {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [minesLeft, setMinesLeft] = useState(TOTAL_MINES);
  const [time, setTime] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(audio.isSoundEnabled());

  const toggleSound = () => {
    setSoundEnabled(audio.toggleSound());
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
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
      // Reveal all mines
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (newGrid[row][col].isMine) newGrid[row][col].isRevealed = true;
        }
      }
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

  const toggleFlag = (r: number, c: number) => {
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

  return (
    <div className="absolute inset-0 z-[60] bg-[#050505] flex flex-col items-center justify-center overflow-hidden">
      {/* Topbar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md z-20">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-full glass-panel hover:bg-white/10 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium hidden sm:block">Voltar ao Dashboard</span>
        </button>
        <div className="flex items-center gap-3">
          <Bomb className="w-6 h-6 text-cyan-400" />
          <h1 className="font-display text-xl font-bold tracking-wider">CYBER BREACH 3D</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleFullscreen}
            className="p-2 rounded-full glass-panel hover:bg-white/10 transition-colors cursor-pointer"
            title="Tela Cheia"
          >
            <Maximize className="w-5 h-5" />
          </button>
          <button 
            onClick={toggleSound}
            className="p-2 rounded-full glass-panel hover:bg-white/10 transition-colors cursor-pointer"
            title={soundEnabled ? "Desativar Som" : "Ativar Som"}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="absolute inset-0 z-10">
        <Canvas shadows dpr={[1, 2]}>
          <Suspense fallback={null}>
            <Scene 
              grid={grid} 
              onCellClick={revealCell} 
              onCellContextMenu={toggleFlag}
              gameState={gameState}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Game Stats Overlay */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 flex items-center gap-6 z-20 pointer-events-none">
        <div className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-3 border border-white/10 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
          <Flag className="w-5 h-5 text-yellow-400" />
          <span className="font-mono text-2xl font-bold text-yellow-400">{minesLeft.toString().padStart(2, '0')}</span>
        </div>
        <div className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-3 border border-white/10 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
          <Clock className="w-5 h-5 text-purple-400" />
          <span className="font-mono text-2xl font-bold text-purple-400">{time.toString().padStart(3, '0')}</span>
        </div>
      </div>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {gameState !== 'playing' && (
          <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-md w-full glass-panel p-8 rounded-3xl border border-white/10 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              {gameState === 'won' ? (
                <>
                  <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_20px_rgba(250,204,21,0.4)]" />
                  <h2 className="font-display text-4xl font-bold text-white mb-2 tracking-tight">SISTEMA LIMPO</h2>
                  <p className="text-gray-400 mb-8">Você neutralizou todas as ameaças em {time} segundos.</p>
                </>
              ) : (
                <>
                  <Bomb className="w-20 h-20 text-red-500 mx-auto mb-6 drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]" />
                  <h2 className="font-display text-4xl font-bold text-white mb-2 tracking-tight">BRECHA DETECTADA</h2>
                  <p className="text-gray-400 mb-8">O sistema foi comprometido por um artefato explosivo.</p>
                </>
              )}
              
              <button 
                onClick={initializeGrid}
                className="w-full py-4 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] cursor-pointer"
              >
                <RotateCcw className="w-5 h-5" />
                Reiniciar Protocolo
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Controls Hint */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gray-400 text-sm flex items-center gap-6 z-20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-8 border-2 border-gray-400 rounded-md relative">
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-2 bg-cyan-400 rounded-full"></div>
          </div>
          <span>Clique: Revelar</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-8 border-2 border-gray-400 rounded-md relative">
            <div className="absolute top-1 right-1 w-1 h-2 bg-yellow-400 rounded-full"></div>
          </div>
          <span>Botão Direito: Bandeira</span>
        </div>
      </div>
    </div>
  );
}
