import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { Chess, Move } from 'chess.js';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Float, Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowLeft, RotateCcw, Users, BrainCircuit, Trophy, Maximize, Minimize, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AIEngine } from '../services/aiEngine';
import { audio } from '../services/audioService';

interface ChessGameProps {
  onBack: () => void;
}

type GameMode = 'pve' | 'pvp';

// --- 3D Components ---

function Piece3D({ type, color, position, isSelected, onClick }: { 
  type: string, 
  color: 'w' | 'b', 
  position: [number, number, number],
  isSelected: boolean,
  onClick: () => void
}) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.lerp(new THREE.Vector3(...position), 0.1);
      if (isSelected) {
        meshRef.current.position.y = 0.5 + Math.sin(state.clock.getElapsedTime() * 5) * 0.2;
      }
    }
  });

  const pieceColor = color === 'w' ? '#ffffff' : '#1a1a1a';
  const emissiveColor = color === 'w' ? '#ffffff' : '#444444';

  const renderPieceShape = () => {
    switch (type.toLowerCase()) {
      case 'p': // Pawn
        return <cylinderGeometry args={[0.2, 0.3, 0.6, 16]} />;
      case 'r': // Rook
        return <boxGeometry args={[0.5, 0.8, 0.5]} />;
      case 'n': // Knight
        return <boxGeometry args={[0.4, 0.7, 0.6]} />;
      case 'b': // Bishop
        return <coneGeometry args={[0.3, 0.9, 16]} />;
      case 'q': // Queen
        return <cylinderGeometry args={[0.3, 0.4, 1.1, 16]} />;
      case 'k': // King
        return <boxGeometry args={[0.4, 1.3, 0.4]} />;
      default:
        return <sphereGeometry args={[0.3]} />;
    }
  };

  return (
    <group 
      ref={meshRef} 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh castShadow>
        {renderPieceShape()}
        <meshStandardMaterial 
          color={isSelected ? "#10b981" : pieceColor} 
          roughness={0.2} 
          metalness={0.8}
          emissive={isSelected ? "#10b981" : emissiveColor}
          emissiveIntensity={isSelected ? 0.5 : 0.1}
        />
      </mesh>
      {hovered && !isSelected && (
        <mesh castShadow position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.4, 0.5, 32]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}

function Board3D({ 
  game, 
  onSquareClick, 
  selectedSquare 
}: { 
  game: Chess, 
  onSquareClick: (square: string) => void,
  selectedSquare: string | null
}) {
  const board = game.board();
  const squares = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const squareName = String.fromCharCode(97 + c) + (8 - r);
      const isDark = (r + c) % 2 === 1;
      const x = c - 3.5;
      const z = r - 3.5;
      const isSelected = selectedSquare === squareName;

      squares.push(
        <mesh 
          key={squareName} 
          position={[x, -0.05, z]} 
          receiveShadow 
          onClick={(e) => { e.stopPropagation(); onSquareClick(squareName); }}
        >
          <boxGeometry args={[1, 0.1, 1]} />
          <meshStandardMaterial 
            color={isSelected ? "#065f46" : isDark ? "#111827" : "#374151"} 
            roughness={0.5}
          />
        </mesh>
      );

      const piece = board[r][c];
      if (piece) {
        squares.push(
          <Piece3D 
            key={`piece-${squareName}`}
            type={piece.type}
            color={piece.color}
            position={[x, 0.4, z]}
            isSelected={isSelected}
            onClick={() => onSquareClick(squareName)}
          />
        );
      }
    }
  }

  return <group>{squares}</group>;
}

function Scene({ game, onSquareClick, selectedSquare }: { game: Chess, onSquareClick: (square: string) => void, selectedSquare: string | null }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 10, 8]} fov={45} />
      <OrbitControls enablePan={false} minPolarAngle={0} maxPolarAngle={Math.PI / 2.5} minDistance={5} maxDistance={15} />
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} castShadow />
      <Environment preset="night" />
      
      <Board3D game={game} onSquareClick={onSquareClick} selectedSquare={selectedSquare} />
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#050505" roughness={0.5} metalness={0.5} />
      </mesh>
      
      <ContactShadows position={[0, -0.05, 0]} opacity={0.4} scale={15} blur={2} far={10} />
    </>
  );
}

// --- Main Component ---

export function ChessGame({ onBack }: ChessGameProps) {
  const [game, setGame] = useState(new Chess());
  const [gameMode, setGameMode] = useState<GameMode>('pve');
  const [aiDifficulty, setAiDifficulty] = useState(50);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(audio.isSoundEnabled());
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleSound = () => {
    setSoundEnabled(audio.toggleSound());
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const initAI = async () => {
      const performance = await AIEngine.analisarDesempenho('user_123', 'chess');
      const newDiff = AIEngine.calcularNivelDificuldade(performance);
      setAiDifficulty(newDiff);
    };
    initAI();
  }, []);

  const checkGameOver = useCallback((cg: Chess) => {
    if (cg.isGameOver()) {
      setGameOver(true);
      if (cg.isCheckmate()) {
        const win = cg.turn() === 'w' ? 'Pretas' : 'Brancas';
        setWinner(win);
        if (gameMode === 'pve') {
          if (win === 'Brancas') audio.playWin();
          else audio.playLose();
        } else {
          audio.playWin();
        }
      } else {
        setWinner('Empate');
        audio.playLose();
      }
      return true;
    }
    return false;
  }, [gameMode]);

  const evaluateBoard = (cg: Chess) => {
    let totalEvaluation = 0;
    const pieceValues: Record<string, number> = { p: 10, r: 50, n: 30, b: 30, q: 90, k: 900 };
    const board = cg.board();
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece) {
          const val = pieceValues[piece.type] || 0;
          totalEvaluation += piece.color === 'w' ? val : -val;
        }
      }
    }
    return totalEvaluation;
  };

  const makeAIMove = useCallback(() => {
    const possibleMoves = game.moves({ verbose: true }) as Move[];
    if (possibleMoves.length === 0) return;

    let bestMove = possibleMoves[0];
    let bestValue = 9999;

    const blunderChance = Math.random() * 100;
    if (blunderChance > aiDifficulty) {
      bestMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    } else {
      for (const move of possibleMoves) {
        game.move(move);
        const boardValue = evaluateBoard(game);
        game.undo();
        if (boardValue < bestValue) {
          bestValue = boardValue;
          bestMove = move;
        }
      }
    }

    const gameCopy = new Chess(game.fen());
    gameCopy.move(bestMove);
    setGame(gameCopy);
    audio.playMove();
    checkGameOver(gameCopy);
  }, [game, aiDifficulty, checkGameOver]);

  const onSquareClick = (square: string) => {
    if (gameOver) return;

    if (!selectedSquare) {
      const piece = game.get(square as any);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        audio.playClick();
      }
      return;
    }

    try {
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move({
        from: selectedSquare,
        to: square,
        promotion: 'q',
      });

      setGame(gameCopy);
      setSelectedSquare(null);
      audio.playMove();
      
      if (!checkGameOver(gameCopy) && gameMode === 'pve') {
        setTimeout(makeAIMove, 500);
      }
    } catch (e) {
      const piece = game.get(square as any);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        audio.playClick();
      } else {
        setSelectedSquare(null);
      }
    }
  };

  const resetGame = () => {
    setGame(new Chess());
    setGameOver(false);
    setWinner(null);
    setSelectedSquare(null);
  };

  const toggleMode = () => {
    setGameMode(prev => prev === 'pve' ? 'pvp' : 'pve');
    resetGame();
  };

  return (
    <div ref={containerRef} className="absolute inset-0 z-[60] bg-[#050505] flex flex-col items-center justify-center overflow-hidden">
      {/* Topbar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md z-20">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 rounded-full glass-panel hover:bg-white/10 transition-colors cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium hidden sm:block">Sair</span>
        </button>
        <div className="flex items-center gap-3">
          <BrainCircuit className="w-6 h-6 text-emerald-400" />
          <h1 className="font-display text-xl font-bold tracking-wider">CHESS 3D</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleSound} className="p-2 rounded-full glass-panel hover:bg-white/10 transition-colors cursor-pointer">
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button onClick={toggleFullscreen} className="p-2 rounded-full glass-panel hover:bg-white/10 transition-colors cursor-pointer">
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
          <button onClick={resetGame} className="p-2 rounded-full glass-panel hover:bg-white/10 transition-colors cursor-pointer">
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="w-full flex-1 relative z-10">
        <Canvas shadows dpr={[1, 2]}>
          <Suspense fallback={null}>
            <Scene game={game} onSquareClick={onSquareClick} selectedSquare={selectedSquare} />
          </Suspense>
        </Canvas>
      </div>

      {/* HUD Overlay */}
      <div className="absolute top-24 left-4 right-4 flex justify-between items-start pointer-events-none z-20">
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col items-center min-w-[120px]">
          <span className="text-xs text-gray-400 uppercase tracking-widest mb-1">Turno</span>
          <span className={`font-display text-xl font-bold ${game.turn() === 'w' ? 'text-white' : 'text-gray-500'}`}>
            {game.turn() === 'w' ? 'BRANCAS' : 'PRETAS'}
          </span>
          {game.inCheck() && !gameOver && (
            <span className="text-red-400 font-bold text-xs mt-1 animate-pulse">XEQUE!</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="glass-panel p-2 rounded-2xl border border-white/10 flex gap-2 pointer-events-auto">
            <button
              onClick={() => gameMode !== 'pve' && toggleMode()}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                gameMode === 'pve' ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BrainCircuit className="w-4 h-4" />
              <span className="text-xs">Vs IA</span>
            </button>
            <button
              onClick={() => gameMode !== 'pvp' && toggleMode()}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                gameMode === 'pvp' ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="text-xs">PvP</span>
            </button>
          </div>
        </div>
      </div>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameOver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center p-10 glass-panel border border-emerald-500/30 rounded-3xl max-sm w-full shadow-2xl">
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_20px_rgba(250,204,21,0.4)]" />
              <h2 className="font-display text-4xl font-bold text-white mb-2">FIM DE JOGO</h2>
              <p className="text-gray-300 mb-8 text-lg">
                {winner === 'Empate' ? 'A partida terminou em empate.' : `Vitória das ${winner}!`}
              </p>
              <button 
                onClick={resetGame}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 text-black font-bold text-lg hover:from-emerald-300 hover:to-teal-400 transition-all shadow-[0_0_30px_rgba(168,85,247,0.4)] cursor-pointer"
              >
                Jogar Novamente
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
