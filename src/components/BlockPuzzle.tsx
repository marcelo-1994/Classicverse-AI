import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Float, Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowLeft, RotateCcw, Play, Pause, Trophy, BrainCircuit, ChevronLeft, ChevronRight, ChevronDown, RotateCw, Volume2, VolumeX, Maximize } from 'lucide-react';
import { AIEngine } from '../services/aiEngine';
import { audio } from '../services/audioService';

interface BlockPuzzleProps {
  onBack: () => void;
}

// --- CONSTANTES E TIPOS ---
const ROWS = 20;
const COLS = 10;

type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

interface Tetromino {
  shape: number[][];
  color: string;
  hex: string;
}

const TETROMINOES: Record<TetrominoType, Tetromino> = {
  I: { shape: [[1, 1, 1, 1]], color: 'bg-cyan-400', hex: '#22d3ee' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'bg-blue-500', hex: '#3b82f6' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'bg-orange-500', hex: '#f97316' },
  O: { shape: [[1, 1], [1, 1]], color: 'bg-yellow-400', hex: '#facc15' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-emerald-400', hex: '#34d399' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'bg-purple-500', hex: '#a855f7' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-red-500', hex: '#ef4444' },
};

const SHAPES = Object.keys(TETROMINOES) as TetrominoType[];

// --- 3D COMPONENTS ---

function Block({ position, color }: { position: [number, number, number], color: string }) {
  const meshRef = useRef<THREE.Group>(null);
  const targetPos = useRef(new THREE.Vector3(...position));

  useEffect(() => {
    targetPos.current.set(...position);
  }, [position]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.lerp(targetPos.current, 0.2);
    }
  });

  return (
    <group ref={meshRef} position={position}>
      <RoundedBox args={[0.95, 0.95, 0.95]} radius={0.1} smoothness={4}>
        <meshStandardMaterial 
          color={color} 
          roughness={0.1} 
          metalness={0.8} 
          emissive={color}
          emissiveIntensity={0.2}
        />
      </RoundedBox>
    </group>
  );
}

function GameBoard3D({ board, currentPiece }: { board: string[][], currentPiece: any }) {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef} position={[-COLS / 2 + 0.5, ROWS / 2 - 0.5, 0]}>
      {/* Fixed Blocks */}
      {board.map((row, r) => 
        row.map((cell, c) => {
          if (cell !== '') {
            return (
              <Block 
                key={`fixed-${r}-${c}`} 
                position={[c, -r, 0]} 
                color={TETROMINOES[cell as TetrominoType].hex} 
              />
            );
          }
          return null;
        })
      )}

      {/* Current Piece */}
      {currentPiece && currentPiece.shape.map((row: number[], r: number) => 
        row.map((val: number, c: number) => {
          if (val) {
            return (
              <Block 
                key={`current-${r}-${c}`} 
                position={[currentPiece.x + c, -(currentPiece.y + r), 0]} 
                color={TETROMINOES[currentPiece.type as TetrominoType].hex} 
              />
            );
          }
          return null;
        })
      )}

      {/* Grid Helper Background */}
      <mesh position={[COLS / 2 - 0.5, -ROWS / 2 + 0.5, -0.6]}>
        <planeGeometry args={[COLS, ROWS]} />
        <meshStandardMaterial color="#0a0a0a" transparent opacity={0.5} />
      </mesh>
      
      {/* Frame */}
      <mesh position={[COLS / 2 - 0.5, -ROWS / 2 + 0.5, -0.65]}>
        <boxGeometry args={[COLS + 0.2, ROWS + 0.2, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" metalness={1} roughness={0.2} />
      </mesh>
    </group>
  );
}

function Scene({ board, currentPiece }: { board: string[][], currentPiece: any }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 25]} fov={50} />
      <OrbitControls enableZoom={true} enablePan={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 1.5} />
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#06b6d4" />
      <pointLight position={[-10, -10, 10]} intensity={1.5} color="#a855f7" />
      <Environment preset="night" />
      
      <GameBoard3D board={board} currentPiece={currentPiece} />
      
      <ContactShadows position={[0, -ROWS / 2 - 1, 0]} opacity={0.4} scale={30} blur={2} far={10} />
    </>
  );
}

// --- COMPONENTE PRINCIPAL ---
export function BlockPuzzle({ onBack }: BlockPuzzleProps) {
  // Estados do Jogo
  const [board, setBoard] = useState<string[][]>(Array(ROWS).fill(Array(COLS).fill('')));
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(audio.isSoundEnabled());
  
  // Estados da IA
  const [aiDifficulty, setAiDifficulty] = useState(50);
  const [dropSpeed, setDropSpeed] = useState(1000);

  // Refs para o loop do jogo
  const boardRef = useRef(board);
  const [currentPiece, setCurrentPiece] = useState<{ type: TetrominoType; x: number; y: number; shape: number[][] } | null>(null);
  const currentPieceRef = useRef(currentPiece);
  const dropSpeedRef = useRef(dropSpeed);
  const isPausedRef = useRef(isPaused);
  const gameOverRef = useRef(gameOver);

  // Sincroniza refs
  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { currentPieceRef.current = currentPiece; }, [currentPiece]);
  useEffect(() => { dropSpeedRef.current = dropSpeed; }, [dropSpeed]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);

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

  // --- IA ADAPTATIVA ---
  useEffect(() => {
    const initAI = async () => {
      const performance = await AIEngine.analisarDesempenho('user_123', 'blockpuzzle');
      const newDiff = AIEngine.calcularNivelDificuldade(performance);
      const params = AIEngine.ajustarParametrosJogo('blockpuzzle', newDiff);
      
      setAiDifficulty(newDiff);
      setDropSpeed(params.dropSpeed);
    };
    initAI();
  }, []);

  // --- LÓGICA DO JOGO ---
  const spawnPiece = useCallback(() => {
    const randomType = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const newPiece = {
      type: randomType,
      shape: TETROMINOES[randomType].shape,
      x: Math.floor(COLS / 2) - Math.floor(TETROMINOES[randomType].shape[0].length / 2),
      y: 0
    };

    if (checkCollision(newPiece.x, newPiece.y, newPiece.shape, boardRef.current)) {
      setGameOver(true);
      audio.playLose();
      return;
    }

    setCurrentPiece(newPiece);
  }, []);

  const checkCollision = (x: number, y: number, shape: number[][], currentBoard: string[][]) => {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const newX = x + c;
          const newY = y + r;
          if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && currentBoard[newY][newX] !== '')) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const mergePiece = useCallback(() => {
    if (!currentPieceRef.current) return;
    const { type, x, y, shape } = currentPieceRef.current;
    const newBoard = boardRef.current.map(row => [...row]);

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] && y + r >= 0) {
          newBoard[y + r][x + c] = type;
        }
      }
    }

    let linesCleared = 0;
    const finalBoard = newBoard.filter(row => {
      if (row.every(cell => cell !== '')) {
        linesCleared++;
        return false;
      }
      return true;
    });

    while (finalBoard.length < ROWS) {
      finalBoard.unshift(Array(COLS).fill(''));
    }

    if (linesCleared > 0) {
      const newLines = lines + linesCleared;
      setLines(newLines);
      setScore(s => s + (linesCleared * 100 * level));
      audio.playClear();
      
      if (Math.floor(newLines / 10) + 1 > level) {
        const nextLevel = Math.floor(newLines / 10) + 1;
        setLevel(nextLevel);
        setDropSpeed(prev => Math.max(100, prev * 0.85)); 
        audio.playWin();
      }
    } else {
      audio.playMove();
    }

    setBoard(finalBoard);
    setCurrentPiece(null);
    spawnPiece();
  }, [level, lines, spawnPiece]);

  const moveDown = useCallback(() => {
    if (!currentPieceRef.current || isPausedRef.current || gameOverRef.current) return;

    const { x, y, shape } = currentPieceRef.current;
    if (!checkCollision(x, y + 1, shape, boardRef.current)) {
      setCurrentPiece(prev => prev ? { ...prev, y: prev.y + 1 } : null);
    } else {
      mergePiece();
    }
  }, [mergePiece]);

  const moveHorizontal = useCallback((dir: 1 | -1) => {
    if (!currentPieceRef.current || isPausedRef.current || gameOverRef.current) return;
    const { x, y, shape } = currentPieceRef.current;
    if (!checkCollision(x + dir, y, shape, boardRef.current)) {
      setCurrentPiece(prev => prev ? { ...prev, x: prev.x + dir } : null);
      audio.playClick();
    }
  }, []);

  const rotate = useCallback(() => {
    if (!currentPieceRef.current || isPausedRef.current || gameOverRef.current) return;
    const { x, y, shape } = currentPieceRef.current;
    const rotatedShape = shape[0].map((_, index) => shape.map(row => row[index]).reverse());
    
    if (!checkCollision(x, y, rotatedShape, boardRef.current)) {
      setCurrentPiece(prev => prev ? { ...prev, shape: rotatedShape } : null);
      audio.playClick();
    }
  }, []);

  const hardDrop = useCallback(() => {
    if (!currentPieceRef.current || isPausedRef.current || gameOverRef.current) return;
    let { x, y, shape } = currentPieceRef.current;
    while (!checkCollision(x, y + 1, shape, boardRef.current)) {
      y++;
    }
    setCurrentPiece(prev => prev ? { ...prev, y } : null);
    // Use a small timeout to let the state update before merging
    setTimeout(() => mergePiece(), 50);
  }, [mergePiece]);

  // --- CONTROLES DE TECLADO ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver || isPaused) return;
      switch (e.key) {
        case 'ArrowLeft': moveHorizontal(-1); break;
        case 'ArrowRight': moveHorizontal(1); break;
        case 'ArrowDown': moveDown(); break;
        case 'ArrowUp': rotate(); break;
        case ' ': hardDrop(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveHorizontal, moveDown, rotate, hardDrop, gameOver, isPaused]);

  // --- GAME LOOP ---
  useEffect(() => {
    if (!currentPieceRef.current && !gameOver) {
      spawnPiece();
    }
    
    const interval = setInterval(() => {
      moveDown();
    }, dropSpeed);

    return () => clearInterval(interval);
  }, [dropSpeed, moveDown, spawnPiece, gameOver]);

  const resetGame = () => {
    setBoard(Array(ROWS).fill(Array(COLS).fill('')));
    setScore(0);
    setLevel(1);
    setLines(0);
    setGameOver(false);
    setIsPaused(false);
    setCurrentPiece(null);
    
    const params = AIEngine.ajustarParametrosJogo('blockpuzzle', aiDifficulty);
    setDropSpeed(params.dropSpeed);
    spawnPiece();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Topbar */}
      <div className="relative z-20 p-4 sm:p-6 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-full glass-panel hover:bg-white/10 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium hidden sm:block">Sair</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm"></div>
          </div>
          <h1 className="font-display text-xl font-bold tracking-wider">BLOCK PUZZLE 3D</h1>
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
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 rounded-full glass-panel hover:bg-white/10 transition-colors cursor-pointer"
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          <button 
            onClick={resetGame}
            className="p-2 rounded-full glass-panel hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Game Area */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center p-4 gap-8 overflow-hidden">
        
        {/* Left Stats (Desktop) */}
        <div className="hidden lg:flex flex-col gap-4 w-48 z-20">
          <div className="glass-panel p-4 rounded-2xl border border-white/10 text-center">
            <p className="text-gray-400 text-sm mb-1">Pontuação</p>
            <p className="font-mono text-3xl font-bold text-cyan-400">{score}</p>
          </div>
          <div className="glass-panel p-4 rounded-2xl border border-white/10 text-center">
            <p className="text-gray-400 text-sm mb-1">Nível</p>
            <p className="font-mono text-3xl font-bold text-purple-400">{level}</p>
          </div>
          
          {/* AI Status */}
          <div className="mt-4 glass-panel p-4 rounded-2xl border border-purple-500/30 bg-purple-500/5">
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit className="w-4 h-4 text-purple-400" />
              <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">IA Adaptativa</p>
            </div>
            <div className="mt-2 h-1.5 w-full bg-black rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-500" style={{ width: `${aiDifficulty}%` }}></div>
            </div>
          </div>
        </div>

        {/* 3D View */}
        <div className="flex-1 w-full flex items-center justify-center p-2 relative">
          <div className="w-full h-full max-h-[80vh] bg-[#2d1b0e] rounded-lg shadow-2xl border-4 border-[#3d2b1e] overflow-hidden relative">
            <Canvas shadows dpr={[1, 2]}>
              <Suspense fallback={null}>
                <Scene board={board} currentPiece={currentPiece} />
              </Suspense>
            </Canvas>

            {/* Overlays */}
            <AnimatePresence>
              {isPaused && !gameOver && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-xl"
                >
                  <div className="text-center">
                    <Pause className="w-16 h-16 text-white mx-auto mb-4" />
                    <h2 className="font-display text-4xl font-bold text-white tracking-widest">PAUSADO</h2>
                  </div>
                </motion.div>
              )}

              {gameOver && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex items-center justify-center rounded-xl"
                >
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center p-10 glass-panel border border-red-500/30 rounded-3xl max-w-sm w-full"
                  >
                    <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
                    <h2 className="font-display text-4xl font-bold text-white mb-4">FIM DE JOGO</h2>
                    <p className="text-gray-300 text-lg mb-8">Sua pontuação final:<br/><span className="text-cyan-400 font-mono text-4xl font-bold">{score}</span></p>
                    <button 
                      onClick={resetGame}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-lg hover:from-cyan-400 hover:to-blue-400 transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)] cursor-pointer"
                    >
                      Jogar Novamente
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Controls */}
        <div className="w-full lg:w-48 flex flex-col gap-4 z-20">
          <div className="grid grid-cols-4 lg:grid-cols-2 gap-2">
            <button onClick={() => moveHorizontal(-1)} className="glass-panel p-4 rounded-xl flex items-center justify-center active:bg-white/20 transition-colors">
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button onClick={rotate} className="glass-panel p-4 rounded-xl flex items-center justify-center active:bg-white/20 transition-colors">
              <RotateCw className="w-8 h-8" />
            </button>
            <button onClick={() => moveHorizontal(1)} className="glass-panel p-4 rounded-xl flex items-center justify-center active:bg-white/20 transition-colors">
              <ChevronRight className="w-8 h-8" />
            </button>
            <button onClick={hardDrop} className="glass-panel p-4 rounded-xl flex items-center justify-center active:bg-white/20 bg-cyan-500/20 border-cyan-500/30 transition-colors">
              <ChevronDown className="w-8 h-8 text-cyan-400" />
            </button>
          </div>
          
          <div className="hidden lg:block glass-panel p-4 rounded-2xl border border-white/10 text-center">
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Linhas</p>
            <p className="font-mono text-2xl font-bold text-white">{lines}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
