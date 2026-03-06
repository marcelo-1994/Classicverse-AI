import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float, MeshDistortMaterial, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowLeft, Trophy, RotateCcw, BrainCircuit, Settings2, Volume2, VolumeX, Maximize, Users } from 'lucide-react';
import { audio } from '../services/audioService';

interface TicTacToeProps {
  onBack: () => void;
}

type Player = 'X' | 'O' | null;
type BoardState = Player[];
type Difficulty = 'easy' | 'medium' | 'hard';

// --- 3D Components ---

function Box({ position, onClick, value, isWinner }: { position: [number, number, number], onClick: () => void, value: Player, isWinner: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.lerp(new THREE.Vector3(hovered ? 1.1 : 1, hovered ? 1.1 : 1, hovered ? 1.1 : 1), 0.1);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.9, 0.9, 0.2]} />
        <meshStandardMaterial 
          color={isWinner ? "#06b6d4" : hovered ? "#1a1a1a" : "#0a0a0a"} 
          roughness={0.3}
          metalness={0.8}
          emissive={isWinner ? "#06b6d4" : "#000000"}
          emissiveIntensity={isWinner ? 0.5 : 0}
        />
      </mesh>
      
      {value === 'X' && (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <Text
            position={[0, 0, 0.2]}
            fontSize={0.6}
            color="#06b6d4"
            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
            anchorX="center"
            anchorY="middle"
          >
            X
          </Text>
        </Float>
      )}
      
      {value === 'O' && (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <Text
            position={[0, 0, 0.2]}
            fontSize={0.6}
            color="#a855f7"
            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
            anchorX="center"
            anchorY="middle"
          >
            O
          </Text>
        </Float>
      )}
    </group>
  );
}

function Scene({ board, onCellClick, winningLine }: { board: BoardState, onCellClick: (i: number) => void, winningLine: number[] | null }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
      <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 1.5} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#06b6d4" />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#a855f7" />
      <Environment preset="city" />
      
      <group position={[0, 0, 0]}>
        {board.map((cell, i) => {
          const x = (i % 3) - 1;
          const y = 1 - Math.floor(i / 3);
          return (
            <Box 
              key={i} 
              position={[x * 1.1, y * 1.1, 0]} 
              value={cell} 
              onClick={() => onCellClick(i)}
              isWinner={winningLine?.includes(i) || false}
            />
          );
        })}
      </group>
      
      <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2} far={4.5} />
    </>
  );
}

// --- Main Component ---

export function TicTacToe({ onBack }: TicTacToeProps) {
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [winner, setWinner] = useState<Player | 'Draw'>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [gameMode, setGameMode] = useState<'pve' | 'pvp'>('pve');
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');
  const [soundEnabled, setSoundEnabled] = useState(audio.isSoundEnabled());

  const toggleMode = () => {
    setGameMode(prev => prev === 'pve' ? 'pvp' : 'pve');
    resetGame();
    setScore({ player: 0, ai: 0 });
  };

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

  // Winning combinations
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];

  const checkWinner = useCallback((squares: BoardState) => {
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: [a, b, c] };
      }
    }
    if (!squares.includes(null)) return { winner: 'Draw' as const, line: null };
    return null;
  }, []);

  // Minimax Algorithm for unbeatable AI
  const minimax = useCallback((currentBoard: BoardState, depth: number, isMaximizing: boolean): number => {
    const result = checkWinner(currentBoard);
    if (result?.winner === 'O') return 10 - depth;
    if (result?.winner === 'X') return depth - 10;
    if (result?.winner === 'Draw') return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!currentBoard[i]) {
          currentBoard[i] = 'O';
          const score = minimax(currentBoard, depth + 1, false);
          currentBoard[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!currentBoard[i]) {
          currentBoard[i] = 'X';
          const score = minimax(currentBoard, depth + 1, true);
          currentBoard[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  }, [checkWinner]);

  const makeAIMove = useCallback((currentBoard: BoardState) => {
    setAiThinking(true);
    
    setTimeout(() => {
      let moveIndex = -1;
      
      if (difficulty === 'easy') {
        const available = currentBoard.map((val, idx) => val === null ? idx : null).filter(val => val !== null) as number[];
        if (available.length > 0) {
          moveIndex = available[Math.floor(Math.random() * available.length)];
        }
      } else if (difficulty === 'medium') {
        for (let i = 0; i < lines.length; i++) {
          const [a, b, c] = lines[i];
          if (currentBoard[a] === 'O' && currentBoard[b] === 'O' && !currentBoard[c]) moveIndex = c;
          if (currentBoard[a] === 'O' && !currentBoard[b] && currentBoard[c] === 'O') moveIndex = b;
          if (!currentBoard[a] && currentBoard[b] === 'O' && currentBoard[c] === 'O') moveIndex = a;
        }
        if (moveIndex === -1) {
          for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (currentBoard[a] === 'X' && currentBoard[b] === 'X' && !currentBoard[c]) moveIndex = c;
            if (currentBoard[a] === 'X' && !currentBoard[b] && currentBoard[c] === 'X') moveIndex = b;
            if (!currentBoard[a] && currentBoard[b] === 'X' && currentBoard[c] === 'X') moveIndex = a;
          }
        }
        if (moveIndex === -1 && !currentBoard[4]) moveIndex = 4;
        if (moveIndex === -1) {
          const available = currentBoard.map((val, idx) => val === null ? idx : null).filter(val => val !== null) as number[];
          if (available.length > 0) moveIndex = available[Math.floor(Math.random() * available.length)];
        }
      } else {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
          if (!currentBoard[i]) {
            currentBoard[i] = 'O';
            const score = minimax(currentBoard, 0, false);
            currentBoard[i] = null;
            if (score > bestScore) {
              bestScore = score;
              moveIndex = i;
            }
          }
        }
      }

      if (moveIndex !== -1) {
        const newBoard = [...currentBoard];
        newBoard[moveIndex] = 'O';
        setBoard(newBoard);
        setIsXNext(true);
        audio.playMove();
        
        const result = checkWinner(newBoard);
        if (result) {
          setWinner(result.winner);
          setWinningLine(result.line);
          if (result.winner === 'O') {
            setScore(s => ({ ...s, ai: s.ai + 1 }));
            audio.playLose();
          } else if (result.winner === 'Draw') {
            audio.playLose();
          }
        }
      }
      setAiThinking(false);
    }, 600);
  }, [checkWinner, difficulty, minimax]);

  const handleClick = (index: number) => {
    if (board[index] || winner || !isXNext || aiThinking) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    setIsXNext(false);
    audio.playMove();

    const result = checkWinner(newBoard);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
      if (result.winner === 'X') {
        setScore(s => ({ ...s, player: s.player + 1 }));
        audio.playWin();
      } else if (result.winner === 'O') {
        setScore(s => ({ ...s, ai: s.ai + 1 }));
        audio.playWin();
      } else if (result.winner === 'Draw') {
        audio.playLose();
      }
    } else {
      if (gameMode === 'pve') {
        makeAIMove(newBoard);
      } else {
        setIsXNext(!isXNext);
      }
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
  };

  const handleDifficultyChange = (newDiff: Difficulty) => {
    setDifficulty(newDiff);
    resetGame();
    setScore({ player: 0, ai: 0 });
  };

  return (
    <div className="absolute inset-0 z-[60] bg-[#050505] flex flex-col items-center justify-center overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex flex-col sm:flex-row justify-between items-center gap-4 glass-panel border-b border-white/10 z-20">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Voltar ao Dashboard</span>
        </button>
        
        <div className="flex items-center gap-2">
          <button onClick={toggleMode} className="flex items-center gap-2 px-4 py-2 rounded-full glass-panel hover:bg-white/10 transition-colors cursor-pointer">
            <Users className="w-5 h-5" />
            <span className="font-medium hidden sm:block">{gameMode === 'pve' ? 'vs IA' : 'vs Player'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/10">
          <Settings2 className="w-4 h-4 text-gray-400 ml-2" />
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
            <button
              key={diff}
              onClick={() => handleDifficultyChange(diff)}
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-all cursor-pointer ${
                difficulty === diff 
                  ? diff === 'hard' ? 'bg-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {diff === 'easy' ? 'Fácil' : diff === 'medium' ? 'Médio' : 'Impossível'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-6">
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
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold hidden sm:inline">Você (X)</span>
            <span className="font-display text-2xl font-bold">{score.player}</span>
          </div>
          <span className="text-gray-600">-</span>
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl font-bold">{score.ai}</span>
            <span className="text-purple-400 font-bold hidden sm:inline">IA (O)</span>
          </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="w-full flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="aspect-square w-full max-w-2xl bg-[#2d1b0e] rounded-lg shadow-2xl border-4 border-[#3d2b1e] overflow-hidden">
          <Canvas shadows dpr={[1, 2]}>
            <Suspense fallback={null}>
              <Scene board={board} onCellClick={handleClick} winningLine={winningLine} />
            </Suspense>
          </Canvas>
        </div>
      </div>

      {/* Overlay UI */}
      <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center z-20 pointer-events-none">
        <div className="mb-8 text-center h-12">
          {winner ? (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-3xl font-bold font-display flex items-center gap-2 drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] ${
                winner === 'X' ? 'text-cyan-400' : winner === 'O' ? 'text-purple-400' : 'text-gray-400'
              }`}
            >
              {winner === 'X' ? <Trophy className="w-8 h-8" /> : winner === 'O' ? <BrainCircuit className="w-8 h-8" /> : null}
              {winner === 'Draw' ? 'Empate!' : winner === 'X' ? 'Você Venceu!' : 'A IA Venceu!'}
            </motion.div>
          ) : (
            <div className="text-xl text-gray-300 flex items-center gap-2 drop-shadow-[0_0_5px_rgba(0,0,0,0.5)]">
              {aiThinking ? (
                <>
                  <BrainCircuit className="w-6 h-6 text-purple-400 animate-pulse" />
                  <span className="text-purple-400 font-bold">A IA está calculando...</span>
                </>
              ) : (
                <span className="font-medium">Sua vez de jogar</span>
              )}
            </div>
          )}
        </div>

        <AnimatePresence>
          {winner && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={resetGame}
              className="px-10 py-4 rounded-full font-bold flex items-center gap-2 transition-all cursor-pointer bg-white text-black hover:bg-gray-200 shadow-[0_0_30px_rgba(255,255,255,0.4)] pointer-events-auto"
            >
              <RotateCcw className="w-6 h-6" />
              Jogar Novamente
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      
      {/* Background Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]"></div>
      </div>
    </div>
  );
}
