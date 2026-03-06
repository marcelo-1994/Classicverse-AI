import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stars, Float, Text, RoundedBox, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Rocket, Target, Shield, Zap, RotateCcw, Trophy, Volume2, VolumeX, Pause, Play, Maximize } from 'lucide-react';
import { audio } from '../services/audioService';
import { AIEngine } from '../services/aiEngine';

interface SpaceShooterProps {
  onBack: () => void;
}

// --- TYPES ---
type Entity = {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  type: 'player' | 'enemy' | 'bullet' | 'powerup' | 'boss';
  health: number;
  size: number;
  powerupType?: 'shield' | 'rapid' | 'multi';
};

// --- 3D COMPONENTS ---

function PowerUp({ entity }: { entity: Entity }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = entity.powerupType === 'shield' ? '#3b82f6' : entity.powerupType === 'rapid' ? '#f59e0b' : '#10b981';

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.05;
    }
  });

  return (
    <mesh position={entity.position} ref={meshRef}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  );
}

function Boss({ entity }: { entity: Entity }) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.position.x = Math.sin(state.clock.elapsedTime) * 4;
    }
  });

  return (
    <group position={entity.position} ref={meshRef}>
      <mesh castShadow>
        <dodecahedronGeometry args={[entity.size]} />
        <meshStandardMaterial color="#7c3aed" emissive="#7c3aed" emissiveIntensity={0.5} />
      </mesh>
      <pointLight intensity={2} color="#7c3aed" />
    </group>
  );
}

function PlayerShip({ position }: { position: THREE.Vector3 }) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.lerp(position, 0.1);
      meshRef.current.rotation.z = (position.x - meshRef.current.position.x) * 2;
      meshRef.current.rotation.x = (meshRef.current.position.y - position.y) * 2;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Ship Body */}
      <mesh castShadow>
        <coneGeometry args={[0.5, 1.5, 4]} />
        <meshStandardMaterial color="#06b6d4" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Wings */}
      <mesh position={[0, -0.2, 0]} castShadow>
        <boxGeometry args={[1.5, 0.1, 0.5]} />
        <meshStandardMaterial color="#0891b2" />
      </mesh>
      {/* Engine Glow */}
      <pointLight position={[0, -0.8, 0]} intensity={2} color="#06b6d4" />
      <mesh position={[0, -0.7, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>
    </group>
  );
}

function Enemy({ entity }: { entity: Entity }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.02;
      meshRef.current.rotation.y += 0.03;
    }
  });

  return (
    <mesh position={entity.position} ref={meshRef} castShadow>
      <octahedronGeometry args={[entity.size]} />
      <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
    </mesh>
  );
}

function Bullet({ entity }: { entity: Entity }) {
  return (
    <mesh position={entity.position}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshBasicMaterial color="#22d3ee" />
      <pointLight intensity={0.5} color="#22d3ee" />
    </mesh>
  );
}

function Scene({ 
  playerPos, 
  enemies, 
  bullets, 
  powerups = [],
  gameState,
  hasShield = false
}: { 
  playerPos: THREE.Vector3, 
  enemies: Entity[], 
  bullets: Entity[], 
  powerups?: Entity[],
  gameState: string,
  hasShield?: boolean
}) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={60} />
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#a855f7" />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <PlayerShip position={playerPos} />
      {hasShield && (
        <mesh position={playerPos}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#3b82f6" transparent opacity={0.3} />
        </mesh>
      )}
      
      {enemies.map(enemy => (
        enemy.type === 'boss' ? <Boss key={enemy.id} entity={enemy} /> : <Enemy key={enemy.id} entity={enemy} />
      ))}
      
      {bullets.map(bullet => (
        <Bullet key={bullet.id} entity={bullet} />
      ))}

      {powerups.map(pu => (
        <PowerUp key={pu.id} entity={pu} />
      ))}

      <Environment preset="night" />
    </>
  );
}

// --- MAIN COMPONENT ---

export function SpaceShooter({ onBack }: SpaceShooterProps) {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'lost'>('idle');
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(audio.isSoundEnabled());
  const [aiDifficulty, setAiDifficulty] = useState(50);

  const [playerPos, setPlayerPos] = useState(new THREE.Vector3(0, -3, 0));
  const [enemies, setEnemies] = useState<Entity[]>([]);
  const [bullets, setBullets] = useState<Entity[]>([]);
  const [powerups, setPowerups] = useState<Entity[]>([]);
  
  const [activePowerups, setActivePowerups] = useState<{ shield: number, rapid: number, multi: number }>({ shield: 0, rapid: 0, multi: 0 });

  const requestRef = useRef<number>(null);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const powerupTimerRef = useRef<number>(0);

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

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setHealth(100);
    setEnemies([]);
    setBullets([]);
    setPowerups([]);
    setPlayerPos(new THREE.Vector3(0, -3, 0));
    setIsPaused(false);
    setActivePowerups({ shield: 0, rapid: 0, multi: 0 });
    audio.playClick();
  };

  // IA Adaptativa
  useEffect(() => {
    const initAI = async () => {
      const performance = await AIEngine.analisarDesempenho('user_123', 'spaceshooter');
      const newDiff = AIEngine.calcularNivelDificuldade(performance);
      setAiDifficulty(newDiff);
    };
    initAI();
  }, []);

  const shoot = useCallback(() => {
    if (gameState !== 'playing' || isPaused) return;
    
    const createBullet = (offset: THREE.Vector3 = new THREE.Vector3(0, 0, 0)) => ({
      id: Math.random().toString(),
      position: playerPos.clone().add(new THREE.Vector3(0, 0.8, 0)).add(offset),
      velocity: new THREE.Vector3(0, 0.2, 0),
      type: 'bullet' as const,
      health: 1,
      size: 0.1
    });

    const newBullets = [createBullet()];
    if (activePowerups.multi > 0) {
      newBullets.push(createBullet(new THREE.Vector3(-0.5, -0.2, 0)));
      newBullets.push(createBullet(new THREE.Vector3(0.5, -0.2, 0)));
    }

    setBullets(prev => [...prev, ...newBullets]);
    audio.playShoot();
  }, [gameState, isPaused, playerPos, activePowerups.multi]);

  // Game Loop
  const animate = useCallback((time: number) => {
    if (gameState === 'playing' && !isPaused) {
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      // Update Powerup Timers
      setActivePowerups(prev => ({
        shield: Math.max(0, prev.shield - deltaTime),
        rapid: Math.max(0, prev.rapid - deltaTime),
        multi: Math.max(0, prev.multi - deltaTime)
      }));

      // Move Bullets
      setBullets(prev => prev.map(b => ({
        ...b,
        position: b.position.clone().add(b.velocity)
      })).filter(b => b.position.y < 10));

      // Move Enemies
      setEnemies(prev => prev.map(e => ({
        ...e,
        position: e.position.clone().add(e.velocity)
      })).filter(e => e.position.y > -10));

      // Move Powerups
      setPowerups(prev => prev.map(p => ({
        ...p,
        position: p.position.clone().add(p.velocity)
      })).filter(p => p.position.y > -10));

      // Spawn Enemies
      spawnTimerRef.current += deltaTime;
      const spawnRate = Math.max(400, 1500 - (aiDifficulty * 10) - (score / 100));
      if (spawnTimerRef.current > spawnRate) {
        spawnTimerRef.current = 0;
        const isBoss = score > 0 && score % 5000 === 0 && !enemies.some(e => e.type === 'boss');
        const newEnemy: Entity = {
          id: Math.random().toString(),
          position: new THREE.Vector3((Math.random() - 0.5) * 10, 8, 0),
          velocity: new THREE.Vector3(0, isBoss ? -0.02 : -0.05 - (aiDifficulty / 1000) - (score / 50000), 0),
          type: isBoss ? 'boss' : 'enemy',
          health: isBoss ? 10 : 1,
          size: isBoss ? 1.5 : 0.4 + Math.random() * 0.4
        };
        setEnemies(prev => [...prev, newEnemy]);
      }

      // Spawn Powerups
      powerupTimerRef.current += deltaTime;
      if (powerupTimerRef.current > 10000) {
        powerupTimerRef.current = 0;
        const types: ('shield' | 'rapid' | 'multi')[] = ['shield', 'rapid', 'multi'];
        const newPowerup: Entity = {
          id: Math.random().toString(),
          position: new THREE.Vector3((Math.random() - 0.5) * 8, 8, 0),
          velocity: new THREE.Vector3(0, -0.03, 0),
          type: 'powerup',
          health: 1,
          size: 0.5,
          powerupType: types[Math.floor(Math.random() * types.length)]
        };
        setPowerups(prev => [...prev, newPowerup]);
      }

      // Collision Detection: Bullets vs Enemies
      setBullets(prevBullets => {
        const remainingBullets = [...prevBullets];
        setEnemies(prevEnemies => {
          const nextEnemies = [...prevEnemies];
          for (let i = remainingBullets.length - 1; i >= 0; i--) {
            for (let j = nextEnemies.length - 1; j >= 0; j--) {
              const b = remainingBullets[i];
              const e = nextEnemies[j];
              if (b.position.distanceTo(e.position) < e.size + 0.2) {
                remainingBullets.splice(i, 1);
                e.health -= 1;
                if (e.health <= 0) {
                  nextEnemies.splice(j, 1);
                  setScore(s => s + (e.type === 'boss' ? 1000 : 100));
                  audio.playExplosion();
                }
                break;
              }
            }
          }
          return nextEnemies;
        });
        return remainingBullets;
      });

      // Collision Detection: Player vs Powerups
      setPowerups(prev => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].position.distanceTo(playerPos) < 1) {
            const type = next[i].powerupType!;
            setActivePowerups(p => ({ ...p, [type]: 10000 }));
            next.splice(i, 1);
            audio.playPowerUp();
          }
        }
        return next;
      });

      // Player Collision with Enemies
      setEnemies(prev => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].position.distanceTo(playerPos) < 0.8) {
            const enemy = next[i];
            next.splice(i, 1);
            if (activePowerups.shield <= 0) {
              setHealth(h => {
                const damage = enemy.type === 'boss' ? 50 : 20;
                const newH = h - damage;
                if (newH <= 0) {
                  setGameState('lost');
                  audio.playLose();
                  return 0;
                }
                audio.playExplosion();
                return newH;
              });
            } else {
              audio.playExplosion();
            }
          }
        }
        return next;
      });
    }
    requestRef.current = requestAnimationFrame(animate);
  }, [gameState, isPaused, aiDifficulty, playerPos, score, activePowerups, enemies]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  // Rapid Fire Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'playing' && !isPaused && activePowerups.rapid > 0) {
      interval = setInterval(shoot, 150);
    }
    return () => clearInterval(interval);
  }, [gameState, isPaused, activePowerups.rapid, shoot]);

  // Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing' || isPaused) return;
      const step = 0.5;
      if (e.key === 'ArrowLeft') setPlayerPos(p => new THREE.Vector3(Math.max(-5, p.x - step), p.y, p.z));
      if (e.key === 'ArrowRight') setPlayerPos(p => new THREE.Vector3(Math.min(5, p.x + step), p.y, p.z));
      if (e.key === 'ArrowUp') setPlayerPos(p => new THREE.Vector3(p.x, Math.min(5, p.y + step), p.z));
      if (e.key === 'ArrowDown') setPlayerPos(p => new THREE.Vector3(p.x, Math.max(-5, p.y - step), p.z));
      if ((e.key === ' ' || e.key === 'Control') && activePowerups.rapid <= 0) shoot();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isPaused, shoot, activePowerups.rapid]);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans relative overflow-hidden">
      {/* Topbar */}
      <div className="relative z-20 p-6 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 rounded-full glass-panel hover:bg-white/10 transition-colors cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium hidden sm:block">Sair</span>
        </button>
        <div className="flex items-center gap-3">
          <Rocket className="w-6 h-6 text-cyan-400" />
          <h1 className="font-display text-xl font-bold tracking-wider uppercase">Space Shooter 3D</h1>
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
        </div>
      </div>

      {/* Game Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center overflow-hidden">
        
        {/* HUD */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-2xl flex items-center justify-between z-20 px-6 pointer-events-none">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Pontuação</p>
            <p className="font-mono text-3xl font-bold text-cyan-400">{score.toString().padStart(6, '0')}</p>
          </div>

          <div className="flex flex-col items-end gap-1">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Integridade</p>
            <div className="w-48 h-3 bg-black/50 rounded-full border border-white/10 overflow-hidden">
              <motion.div 
                className={`h-full bg-gradient-to-r ${health > 30 ? 'from-cyan-500 to-blue-500' : 'from-red-500 to-orange-500'}`}
                animate={{ width: `${health}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3D View */}
        <div className="w-full flex-1 relative">
          <Canvas shadows dpr={[1, 2]}>
            <Suspense fallback={null}>
              <Scene 
                playerPos={playerPos} 
                enemies={enemies} 
                bullets={bullets} 
                gameState={gameState} 
              />
            </Suspense>
          </Canvas>
        </div>

        {/* Overlays */}
        <AnimatePresence>
          {gameState === 'idle' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <Rocket className="w-20 h-20 text-cyan-400 mx-auto mb-6 animate-bounce" />
                <h2 className="font-display text-5xl font-bold text-white mb-8 tracking-tighter">SPACE SHOOTER</h2>
                <button onClick={startGame} className="px-12 py-4 rounded-full bg-cyan-500 text-black font-bold text-xl hover:bg-cyan-400 transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)] cursor-pointer">
                  INICIAR MISSÃO
                </button>
                <p className="mt-8 text-gray-400 text-sm">Use as setas para mover e Espaço para atirar</p>
              </div>
            </motion.div>
          )}

          {gameState === 'lost' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex items-center justify-center">
              <div className="text-center p-10 glass-panel border border-red-500/30 rounded-3xl max-w-sm w-full">
                <Target className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h2 className="font-display text-4xl font-bold text-white mb-2">MISSÃO FALHOU</h2>
                <p className="text-gray-400 mb-8">Sua nave foi destruída.</p>
                <div className="mb-8">
                  <p className="text-xs text-gray-500 uppercase mb-1">Pontuação Final</p>
                  <p className="text-4xl font-mono font-bold text-cyan-400">{score}</p>
                </div>
                <button onClick={startGame} className="w-full py-4 rounded-2xl bg-white text-black font-bold text-lg hover:bg-gray-200 transition-all cursor-pointer">
                  Tentar Novamente
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Controls */}
        <div className="absolute bottom-10 left-0 right-0 z-20 flex justify-between px-10 lg:hidden">
          <div className="grid grid-cols-3 gap-2">
            <div></div>
            <button onTouchStart={() => setPlayerPos(p => new THREE.Vector3(p.x, Math.min(5, p.y + 0.5), p.z))} className="w-14 h-14 glass-panel rounded-xl flex items-center justify-center"><ArrowLeft className="rotate-90" /></button>
            <div></div>
            <button onTouchStart={() => setPlayerPos(p => new THREE.Vector3(Math.max(-5, p.x - 0.5), p.y, p.z))} className="w-14 h-14 glass-panel rounded-xl flex items-center justify-center"><ArrowLeft /></button>
            <button onTouchStart={() => setPlayerPos(p => new THREE.Vector3(p.x, Math.max(-5, p.y - 0.5), p.z))} className="w-14 h-14 glass-panel rounded-xl flex items-center justify-center"><ArrowLeft className="-rotate-90" /></button>
            <button onTouchStart={() => setPlayerPos(p => new THREE.Vector3(Math.min(5, p.x + 0.5), p.y, p.z))} className="w-14 h-14 glass-panel rounded-xl flex items-center justify-center"><ArrowLeft className="rotate-180" /></button>
          </div>
          <button onTouchStart={shoot} className="w-24 h-24 rounded-full bg-cyan-500/20 border-2 border-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <Zap className="w-10 h-10 text-cyan-400 fill-current" />
          </button>
        </div>

      </div>
    </div>
  );
}
