import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stars, Float, Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowLeft, Play, Pause, RotateCcw, Ghost, Trophy, BrainCircuit, Volume2, VolumeX, Maximize } from 'lucide-react';
import { AIEngine } from '../services/aiEngine';
import { audio } from '../services/audioService';

interface ArcadeMazeProps {
  onBack: () => void;
}

// --- CONSTANTS ---
const ROWS = 21;
const COLS = 21;

const INITIAL_MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
  [1,3,1,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,1,3,1],
  [1,2,1,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,1,2,1],
  [1,2,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,2,1],
  [1,1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1,1],
  [0,0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0,0],
  [1,1,1,1,1,2,1,0,1,1,0,1,1,0,1,2,1,1,1,1,1],
  [0,0,0,0,0,2,0,0,1,0,0,0,1,0,0,2,0,0,0,0,0],
  [1,1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1,1],
  [0,0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0,0],
  [1,1,1,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,1,2,1],
  [1,3,2,2,1,2,2,2,2,2,0,2,2,2,2,2,1,2,2,3,1],
  [1,1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1,1],
  [1,2,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,1,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

type Position = { r: number; c: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE';

interface Entity {
  pos: Position;
  dir: Direction;
  nextDir: Direction;
}

// --- 3D COMPONENTS ---

function Player3D({ pos, dir }: { pos: Position, dir: Direction }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      const targetX = pos.c - COLS / 2 + 0.5;
      const targetZ = pos.r - ROWS / 2 + 0.5;
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.2);
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.2);
      
      let targetRot = 0;
      if (dir === 'RIGHT') targetRot = Math.PI / 2;
      if (dir === 'LEFT') targetRot = -Math.PI / 2;
      if (dir === 'DOWN') targetRot = Math.PI;
      if (dir === 'UP') targetRot = 0;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRot, 0.2);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh castShadow>
        <sphereGeometry args={[0.4, 32, 32, 0, Math.PI * 1.7]} />
        <meshStandardMaterial color="#facc15" metalness={0.5} roughness={0.2} />
      </mesh>
      <mesh position={[0.2, 0.2, 0.2]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="black" />
      </mesh>
    </group>
  );
}

function Ghost3D({ pos, color }: { pos: Position, color: string }) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const targetX = pos.c - COLS / 2 + 0.5;
      const targetZ = pos.r - ROWS / 2 + 0.5;
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 0.1);
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, 0.1);
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 5) * 0.1 + 0.1;
    }
  });

  return (
    <group ref={meshRef}>
      <mesh castShadow>
        <capsuleGeometry args={[0.35, 0.4, 4, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.15, 0.2, 0.3]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="white" />
      </mesh>
      <mesh position={[-0.15, 0.2, 0.3]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="white" />
      </mesh>
    </group>
  );
}

function MazeScene({ 
  maze, 
  player, 
  ghosts, 
  powerMode 
}: { 
  maze: number[][], 
  player: Entity, 
  ghosts: Entity[], 
  powerMode: boolean 
}) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 15, 10]} fov={50} />
      <OrbitControls enableZoom={true} enablePan={false} maxPolarAngle={Math.PI / 2.5} minDistance={10} maxDistance={25} />
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#3b82f6" />
      <pointLight position={[-10, 10, -10]} intensity={1.5} color="#a855f7" />
      <Environment preset="night" />
      
      <group>
        {maze.map((row, r) => 
          row.map((cell, c) => {
            const x = c - COLS / 2 + 0.5;
            const z = r - ROWS / 2 + 0.5;
            
            if (cell === 1) {
              return (
                <RoundedBox key={`wall-${r}-${c}`} args={[0.9, 1, 0.9]} radius={0.1} position={[x, 0.5, z]} castShadow receiveShadow>
                  <meshStandardMaterial color="#1e3a8a" metalness={0.8} roughness={0.2} />
                </RoundedBox>
              );
            }
            if (cell === 2) {
              return (
                <mesh key={`dot-${r}-${c}`} position={[x, 0.2, z]}>
                  <sphereGeometry args={[0.1, 8, 8]} />
                  <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.5} />
                </mesh>
              );
            }
            if (cell === 3) {
              return (
                <Float key={`power-${r}-${c}`} speed={5} rotationIntensity={2} floatIntensity={1} position={[x, 0.4, z]}>
                  <mesh>
                    <sphereGeometry args={[0.25, 16, 16]} />
                    <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={2} />
                  </mesh>
                </Float>
              );
            }
            return null;
          })
        )}
      </group>

      <Player3D pos={player.pos} dir={player.dir} />
      
      {ghosts.map((ghost, i) => (
        <Ghost3D 
          key={i} 
          pos={ghost.pos} 
          color={powerMode ? "#2563eb" : ["#ef4444", "#f472b6", "#22d3ee"][i]} 
        />
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[COLS + 2, ROWS + 2]} />
        <meshStandardMaterial color="#050505" roughness={0.5} metalness={0.5} />
      </mesh>
    </>
  );
}

// --- MAIN COMPONENT ---

export function ArcadeMaze({ onBack }: ArcadeMazeProps) {
  const [maze, setMaze] = useState<number[][]>(INITIAL_MAZE.map(row => [...row]));
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [isPaused, setIsPaused] = useState(false);
  const [powerMode, setPowerMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(audio.isSoundEnabled());
  
  const [aiDifficulty, setAiDifficulty] = useState(50);
  const [ghostSpeed, setGhostSpeed] = useState(300);
  const playerSpeed = 200;

  const [player, setPlayer] = useState<Entity>({ pos: { r: 16, c: 10 }, dir: 'NONE', nextDir: 'NONE' });
  const [ghosts, setGhosts] = useState<Entity[]>([
    { pos: { r: 10, c: 9 }, dir: 'UP', nextDir: 'UP' },
    { pos: { r: 10, c: 10 }, dir: 'UP', nextDir: 'UP' },
    { pos: { r: 10, c: 11 }, dir: 'UP', nextDir: 'UP' },
  ]);

  const mazeRef = useRef(maze);
  const playerRef = useRef(player);
  const ghostsRef = useRef(ghosts);
  const powerModeRef = useRef(powerMode);
  const gameStateRef = useRef(gameState);
  const isPausedRef = useRef(isPaused);

  useEffect(() => { mazeRef.current = maze; }, [maze]);
  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { ghostsRef.current = ghosts; }, [ghosts]);
  useEffect(() => { powerModeRef.current = powerMode; }, [powerMode]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  const toggleSound = () => setSoundEnabled(audio.toggleSound());

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const initAI = async () => {
      const performance = await AIEngine.analisarDesempenho('user_123', 'arcademaze');
      const newDiff = AIEngine.calcularNivelDificuldade(performance);
      const params = AIEngine.ajustarParametrosJogo('arcademaze', newDiff);
      setAiDifficulty(newDiff);
      setGhostSpeed(Math.max(150, 400 - (params.ghostSpeed * 50)));
    };
    initAI();
  }, []);

  const isValidMove = (r: number, c: number) => {
    if (c < 0 || c >= COLS) return true;
    if (r < 0 || r >= ROWS) return false;
    return mazeRef.current[r][c] !== 1;
  };

  const getNextPos = (pos: Position, dir: Direction): Position => {
    let { r, c } = pos;
    if (dir === 'UP') r--;
    else if (dir === 'DOWN') r++;
    else if (dir === 'LEFT') c--;
    else if (dir === 'RIGHT') c++;
    if (c < 0) c = COLS - 1;
    if (c >= COLS) c = 0;
    return { r, c };
  };

  const movePlayer = useCallback(() => {
    if (gameStateRef.current !== 'playing' || isPausedRef.current) return;
    const current = playerRef.current;
    let nextDir = current.nextDir;
    let nextPos = getNextPos(current.pos, nextDir);

    if (!isValidMove(nextPos.r, nextPos.c)) {
      nextDir = current.dir;
      nextPos = getNextPos(current.pos, nextDir);
      if (!isValidMove(nextPos.r, nextPos.c)) return;
    }

    const newPlayer = { ...current, pos: nextPos, dir: nextDir };
    setPlayer(newPlayer);

    const cellValue = mazeRef.current[nextPos.r][nextPos.c];
    if (cellValue === 2 || cellValue === 3) {
      const newMaze = mazeRef.current.map(row => [...row]);
      newMaze[nextPos.r][nextPos.c] = 0;
      setMaze(newMaze);
      audio.playEat();

      if (cellValue === 2) setScore(s => s + 10);
      else if (cellValue === 3) {
        setScore(s => s + 50);
        setPowerMode(true);
        audio.playPowerUp();
        setTimeout(() => setPowerMode(false), 5000);
      }

      const hasDots = newMaze.some(row => row.some(cell => cell === 2 || cell === 3));
      if (!hasDots) {
        setGameState('won');
        audio.playWin();
      }
    }
  }, []);

  const moveGhosts = useCallback(() => {
    if (gameStateRef.current !== 'playing' || isPausedRef.current) return;
    const newGhosts = ghostsRef.current.map(ghost => {
      const possibleDirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
      const validDirs = possibleDirs.filter(d => {
        if (d === 'UP' && ghost.dir === 'DOWN') return false;
        if (d === 'DOWN' && ghost.dir === 'UP') return false;
        if (d === 'LEFT' && ghost.dir === 'RIGHT') return false;
        if (d === 'RIGHT' && ghost.dir === 'LEFT') return false;
        const next = getNextPos(ghost.pos, d);
        return isValidMove(next.r, next.c);
      });

      let chosenDir = ghost.dir;
      const nextCurrentPos = getNextPos(ghost.pos, ghost.dir);
      if (!isValidMove(nextCurrentPos.r, nextCurrentPos.c) || validDirs.length > 1) {
        if (validDirs.length > 0) {
          const dist = Math.abs(ghost.pos.r - playerRef.current.pos.r) + Math.abs(ghost.pos.c - playerRef.current.pos.c);
          if (dist < 10 && Math.random() < 0.6) {
            validDirs.sort((a, b) => {
              const posA = getNextPos(ghost.pos, a);
              const posB = getNextPos(ghost.pos, b);
              const distA = Math.abs(posA.r - playerRef.current.pos.r) + Math.abs(posA.c - playerRef.current.pos.c);
              const distB = Math.abs(posB.r - playerRef.current.pos.r) + Math.abs(posB.c - playerRef.current.pos.c);
              return distA - distB;
            });
            chosenDir = validDirs[0];
          } else {
            chosenDir = validDirs[Math.floor(Math.random() * validDirs.length)];
          }
        } else {
          if (ghost.dir === 'UP') chosenDir = 'DOWN';
          else if (ghost.dir === 'DOWN') chosenDir = 'UP';
          else if (ghost.dir === 'LEFT') chosenDir = 'RIGHT';
          else if (ghost.dir === 'RIGHT') chosenDir = 'LEFT';
        }
      }

      const nextPos = getNextPos(ghost.pos, chosenDir);
      if (nextPos.r === playerRef.current.pos.r && nextPos.c === playerRef.current.pos.c) {
        if (powerModeRef.current) {
          setScore(s => s + 200);
          audio.playClear();
          return { pos: { r: 10, c: 10 }, dir: 'UP' as Direction, nextDir: 'UP' as Direction };
        } else {
          setGameState('lost');
          audio.playLose();
        }
      }
      return { ...ghost, pos: nextPos, dir: chosenDir as Direction };
    });
    setGhosts(newGhosts as Entity[]);
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(movePlayer, playerSpeed);
    return () => clearInterval(interval);
  }, [gameState, movePlayer]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(moveGhosts, ghostSpeed);
    return () => clearInterval(interval);
  }, [gameState, moveGhosts, ghostSpeed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing' || isPaused) return;
      let newDir: Direction = 'NONE';
      switch (e.key) {
        case 'ArrowUp': newDir = 'UP'; break;
        case 'ArrowDown': newDir = 'DOWN'; break;
        case 'ArrowLeft': newDir = 'LEFT'; break;
        case 'ArrowRight': newDir = 'RIGHT'; break;
      }
      if (newDir !== 'NONE') {
        e.preventDefault();
        setPlayer(prev => ({ ...prev, nextDir: newDir }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isPaused]);

  const startGame = () => {
    setMaze(INITIAL_MAZE.map(row => [...row]));
    setPlayer({ pos: { r: 16, c: 10 }, dir: 'NONE', nextDir: 'NONE' });
    setGhosts([
      { pos: { r: 10, c: 9 }, dir: 'UP', nextDir: 'UP' },
      { pos: { r: 10, c: 10 }, dir: 'UP', nextDir: 'UP' },
      { pos: { r: 10, c: 11 }, dir: 'UP', nextDir: 'UP' },
    ]);
    setScore(0);
    setPowerMode(false);
    setGameState('playing');
    setIsPaused(false);
    audio.playClick();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans relative overflow-hidden">
      {/* Topbar */}
      <div className="relative z-20 p-6 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 rounded-full glass-panel hover:bg-white/10 transition-colors cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium hidden sm:block">Sair</span>
        </button>
        <div className="flex items-center gap-3">
          <Ghost className="w-6 h-6 text-yellow-400" />
          <h1 className="font-display text-xl font-bold tracking-wider uppercase">Arcade Maze 3D</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleFullscreen}
            className="p-2 rounded-full glass-panel hover:bg-white/10 transition-colors cursor-pointer"
            title="Tela Cheia"
          >
            <Maximize className="w-5 h-5" />
          </button>
          <button onClick={toggleSound} className="p-2 rounded-full glass-panel hover:bg-white/10 transition-colors cursor-pointer">
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button onClick={() => setIsPaused(!isPaused)} disabled={gameState !== 'playing'} className="p-2 rounded-full glass-panel hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50">
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          <button onClick={startGame} className="p-2 rounded-full glass-panel hover:bg-white/10 transition-colors cursor-pointer">
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Game Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center overflow-hidden">
        
        {/* HUD */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-2xl flex items-center justify-between z-20 px-6 pointer-events-none">
          <div className="glass-panel px-6 py-3 rounded-2xl border border-white/10 shadow-lg">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Pontuação</p>
            <p className="font-mono text-3xl font-bold text-yellow-400">{score}</p>
          </div>

          <div className="glass-panel px-6 py-3 rounded-2xl border border-purple-500/30 bg-purple-500/5">
            <div className="flex items-center gap-2 mb-1">
              <BrainCircuit className="w-4 h-4 text-purple-400" />
              <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">IA Adaptativa</p>
            </div>
            <div className="h-1.5 w-32 bg-black rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-400 to-purple-500" style={{ width: `${aiDifficulty}%` }}></div>
            </div>
          </div>
        </div>

        {/* 3D View */}
        <div className="w-full h-full relative">
          <Canvas shadows dpr={[1, 2]}>
            <Suspense fallback={null}>
              <MazeScene 
                maze={maze} 
                player={player} 
                ghosts={ghosts} 
                powerMode={powerMode} 
              />
            </Suspense>
          </Canvas>
        </div>

        {/* Overlays */}
        <AnimatePresence>
          {gameState === 'idle' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <button onClick={startGame} className="px-12 py-4 rounded-full bg-yellow-400 text-black font-bold text-xl hover:bg-yellow-300 transition-all shadow-[0_0_30px_rgba(250,204,21,0.4)] cursor-pointer flex items-center gap-3">
                <Play className="w-6 h-6 fill-current" /> INICIAR LABIRINTO
              </button>
            </motion.div>
          )}

          {gameState === 'lost' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex items-center justify-center">
              <div className="text-center p-10 glass-panel border border-red-500/30 rounded-3xl max-w-sm w-full">
                <Ghost className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h2 className="font-display text-4xl font-bold text-white mb-2">GAME OVER</h2>
                <p className="text-gray-400 mb-8">Você foi capturado pelos fantasmas.</p>
                <button onClick={startGame} className="w-full py-4 rounded-2xl bg-yellow-400 text-black font-bold text-lg hover:bg-yellow-300 transition-all cursor-pointer">
                  Tentar Novamente
                </button>
              </div>
            </motion.div>
          )}

          {gameState === 'won' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex items-center justify-center">
              <div className="text-center p-10 glass-panel border border-emerald-500/30 rounded-3xl max-w-sm w-full">
                <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
                <h2 className="font-display text-4xl font-bold text-white mb-2">VITÓRIA!</h2>
                <p className="text-gray-400 mb-8">Você limpou todo o labirinto!</p>
                <button onClick={startGame} className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold text-lg hover:bg-emerald-400 transition-all cursor-pointer">
                  Próximo Nível
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Controls */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 grid grid-cols-3 gap-2 lg:hidden">
          <div></div>
          <button onTouchStart={() => setPlayer(p => ({ ...p, nextDir: 'UP' }))} className="w-16 h-16 glass-panel rounded-xl flex items-center justify-center"><ArrowLeft className="rotate-90" /></button>
          <div></div>
          <button onTouchStart={() => setPlayer(p => ({ ...p, nextDir: 'LEFT' }))} className="w-16 h-16 glass-panel rounded-xl flex items-center justify-center"><ArrowLeft /></button>
          <button onTouchStart={() => setPlayer(p => ({ ...p, nextDir: 'DOWN' }))} className="w-16 h-16 glass-panel rounded-xl flex items-center justify-center"><ArrowLeft className="-rotate-90" /></button>
          <button onTouchStart={() => setPlayer(p => ({ ...p, nextDir: 'RIGHT' }))} className="w-16 h-16 glass-panel rounded-xl flex items-center justify-center"><ArrowLeft className="rotate-180" /></button>
        </div>

      </div>
    </div>
  );
}
