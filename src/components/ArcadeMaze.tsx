import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Play, Pause, RotateCcw, Ghost, Trophy, BrainCircuit } from 'lucide-react';
import { AIEngine } from '../services/aiEngine';

interface ArcadeMazeProps {
  onBack: () => void;
}

// --- CONSTANTES E TIPOS ---
const CELL_SIZE = 24; // Tamanho de cada célula em pixels
const ROWS = 21;
const COLS = 21;

// 0: Caminho Vazio, 1: Parede, 2: Ponto (Dot), 3: Power-up
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

export function ArcadeMaze({ onBack }: ArcadeMazeProps) {
  // --- ESTADOS DO JOGO ---
  const [maze, setMaze] = useState<number[][]>(INITIAL_MAZE.map(row => [...row]));
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [isPaused, setIsPaused] = useState(false);
  const [powerMode, setPowerMode] = useState(false);
  
  // IA Params
  const [aiDifficulty, setAiDifficulty] = useState(50);
  const [ghostSpeed, setGhostSpeed] = useState(300); // ms por movimento
  const playerSpeed = 200; // ms por movimento

  // Entidades
  const [player, setPlayer] = useState<Entity>({ pos: { r: 16, c: 10 }, dir: 'NONE', nextDir: 'NONE' });
  const [ghosts, setGhosts] = useState<Entity[]>([
    { pos: { r: 10, c: 9 }, dir: 'UP', nextDir: 'UP' },
    { pos: { r: 10, c: 10 }, dir: 'UP', nextDir: 'UP' },
    { pos: { r: 10, c: 11 }, dir: 'UP', nextDir: 'UP' },
  ]);

  // Refs para o Game Loop
  const mazeRef = useRef(maze);
  const playerRef = useRef(player);
  const ghostsRef = useRef(ghosts);
  const powerModeRef = useRef(powerMode);
  const gameStateRef = useRef(gameState);
  const isPausedRef = useRef(isPaused);

  // Sincroniza refs
  useEffect(() => { mazeRef.current = maze; }, [maze]);
  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { ghostsRef.current = ghosts; }, [ghosts]);
  useEffect(() => { powerModeRef.current = powerMode; }, [powerMode]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  // --- INICIALIZAÇÃO DA IA ---
  useEffect(() => {
    const initAI = async () => {
      const performance = await AIEngine.analisarDesempenho('user_123', 'arcademaze');
      const newDiff = AIEngine.calcularNivelDificuldade(performance);
      const params = AIEngine.ajustarParametrosJogo('arcademaze', newDiff);
      
      setAiDifficulty(newDiff);
      // Ajusta a velocidade dos fantasmas com base na IA (menor = mais rápido)
      setGhostSpeed(Math.max(150, 400 - (params.ghostSpeed * 50)));
    };
    initAI();
  }, []);

  // --- FUNÇÕES AUXILIARES ---
  const isValidMove = (r: number, c: number) => {
    // Túnel (Wrap around)
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

    // Wrap around (Túnel)
    if (c < 0) c = COLS - 1;
    if (c >= COLS) c = 0;

    return { r, c };
  };

  // --- LÓGICA DO JOGADOR ---
  const movePlayer = useCallback(() => {
    if (gameStateRef.current !== 'playing' || isPausedRef.current) return;

    const current = playerRef.current;
    let nextDir = current.nextDir;
    let nextPos = getNextPos(current.pos, nextDir);

    // Se não puder virar para a próxima direção, tenta continuar na atual
    if (!isValidMove(nextPos.r, nextPos.c)) {
      nextDir = current.dir;
      nextPos = getNextPos(current.pos, nextDir);
      
      // Se também não puder continuar, para
      if (!isValidMove(nextPos.r, nextPos.c)) {
        return;
      }
    }

    // Atualiza posição do jogador
    const newPlayer = { ...current, pos: nextPos, dir: nextDir };
    setPlayer(newPlayer);

    // Coleta itens
    const cellValue = mazeRef.current[nextPos.r][nextPos.c];
    if (cellValue === 2 || cellValue === 3) {
      const newMaze = mazeRef.current.map(row => [...row]);
      newMaze[nextPos.r][nextPos.c] = 0;
      setMaze(newMaze);

      if (cellValue === 2) {
        setScore(s => s + 10);
      } else if (cellValue === 3) {
        setScore(s => s + 50);
        setPowerMode(true);
        // Desativa o power mode após 5 segundos
        setTimeout(() => {
          setPowerMode(false);
        }, 5000);
      }

      // Verifica Vitória (se não houver mais 2 ou 3 no labirinto)
      const hasDots = newMaze.some(row => row.some(cell => cell === 2 || cell === 3));
      if (!hasDots) {
        setGameState('won');
      }
    }
  }, []);

  // --- LÓGICA DOS FANTASMAS (IA) ---
  const moveGhosts = useCallback(() => {
    if (gameStateRef.current !== 'playing' || isPausedRef.current) return;

    const newGhosts = ghostsRef.current.map(ghost => {
      // IA Simples: Escolhe uma direção válida aleatória, preferindo não voltar
      const possibleDirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
      const validDirs = possibleDirs.filter(d => {
        // Evita voltar para trás imediatamente (a menos que seja um beco sem saída)
        if (d === 'UP' && ghost.dir === 'DOWN') return false;
        if (d === 'DOWN' && ghost.dir === 'UP') return false;
        if (d === 'LEFT' && ghost.dir === 'RIGHT') return false;
        if (d === 'RIGHT' && ghost.dir === 'LEFT') return false;

        const next = getNextPos(ghost.pos, d);
        return isValidMove(next.r, next.c);
      });

      let chosenDir = ghost.dir;
      
      // Se a direção atual não é mais válida ou há uma bifurcação, escolhe nova direção
      const nextCurrentPos = getNextPos(ghost.pos, ghost.dir);
      if (!isValidMove(nextCurrentPos.r, nextCurrentPos.c) || validDirs.length > 1) {
        // Se powerMode estiver ativo, fantasmas fogem (movimento aleatório)
        // Se não, eles poderiam perseguir o jogador (A*), mas aqui usaremos um aleatório inteligente para o MVP
        if (validDirs.length > 0) {
           chosenDir = validDirs[Math.floor(Math.random() * validDirs.length)];
        } else {
           // Beco sem saída, vira para trás
           if (ghost.dir === 'UP') chosenDir = 'DOWN';
           else if (ghost.dir === 'DOWN') chosenDir = 'UP';
           else if (ghost.dir === 'LEFT') chosenDir = 'RIGHT';
           else if (ghost.dir === 'RIGHT') chosenDir = 'LEFT';
        }
      }

      const nextPos = getNextPos(ghost.pos, chosenDir);
      
      // Verifica colisão com o jogador
      if (nextPos.r === playerRef.current.pos.r && nextPos.c === playerRef.current.pos.c) {
        if (powerModeRef.current) {
          // Comeu o fantasma
          setScore(s => s + 200);
          // Volta o fantasma para o centro
          return { pos: { r: 10, c: 10 }, dir: 'UP', nextDir: 'UP' };
        } else {
          // Morreu
          setGameState('lost');
        }
      }

      return { ...ghost, pos: nextPos, dir: chosenDir };
    });

    setGhosts(newGhosts);
  }, []);

  // --- GAME LOOPS ---
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


  // --- CONTROLES DE TECLADO ---
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

  // --- AÇÕES DA UI ---
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
  };

  const handleMobileControl = (dir: Direction) => {
    if (gameState === 'idle') startGame();
    setPlayer(prev => ({ ...prev, nextDir: dir }));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Topbar */}
      <div className="relative z-10 p-4 sm:p-6 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-full glass-panel hover:bg-white/10 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium hidden sm:block">Sair</span>
        </button>
        <div className="flex items-center gap-3">
          <Ghost className="w-6 h-6 text-yellow-400" />
          <h1 className="font-display text-xl font-bold tracking-wider">ARCADE MAZE</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsPaused(!isPaused)}
            disabled={gameState !== 'playing'}
            className="p-2 rounded-full glass-panel hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          <button 
            onClick={startGame}
            className="p-2 rounded-full glass-panel hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Game Area */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center p-4 gap-8">
        
        {/* Left Stats (Desktop) */}
        <div className="hidden lg:flex flex-col gap-4 w-48">
          <div className="glass-panel p-4 rounded-2xl border border-white/10 text-center">
            <p className="text-gray-400 text-sm mb-1">Pontuação</p>
            <p className="font-mono text-3xl font-bold text-yellow-400">{score}</p>
          </div>
          
          {/* AI Status */}
          <div className="mt-4 glass-panel p-4 rounded-2xl border border-purple-500/30 bg-purple-500/5">
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit className="w-4 h-4 text-purple-400" />
              <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">IA Adaptativa</p>
            </div>
            <p className="text-xs text-gray-400">Fantasmas ajustados para o seu nível.</p>
            <div className="mt-2 h-1.5 w-full bg-black rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-400 to-purple-500" style={{ width: `${aiDifficulty}%` }}></div>
            </div>
          </div>
        </div>

        {/* Mobile Stats (Top) */}
        <div className="flex lg:hidden w-full max-w-sm justify-center mb-2">
          <div className="glass-panel px-6 py-2 rounded-xl border border-white/10 text-center flex items-center gap-4">
            <p className="text-xs text-gray-400 uppercase">Score</p>
            <p className="font-mono text-xl font-bold text-yellow-400">{score}</p>
          </div>
        </div>

        {/* Board Container */}
        <div className="relative p-2 glass-panel rounded-xl border border-white/20 shadow-[0_0_50px_rgba(250,204,21,0.1)] bg-black/80">
          
          {/* Renderização do Labirinto */}
          <div 
            className="relative"
            style={{ 
              width: COLS * CELL_SIZE, 
              height: ROWS * CELL_SIZE,
              // Escala para caber em telas menores
              transform: `scale(min(1, ${(typeof window !== 'undefined' ? window.innerWidth - 32 : 400) / (COLS * CELL_SIZE)}))`,
              transformOrigin: 'top center'
            }}
          >
            {/* Paredes e Pontos */}
            {maze.map((row, r) => 
              row.map((cell, c) => {
                if (cell === 1) {
                  return (
                    <div 
                      key={`wall-${r}-${c}`}
                      className="absolute bg-blue-900/40 border border-blue-500/30 rounded-sm"
                      style={{ left: c * CELL_SIZE, top: r * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }}
                    />
                  );
                }
                if (cell === 2) {
                  return (
                    <div 
                      key={`dot-${r}-${c}`}
                      className="absolute flex items-center justify-center"
                      style={{ left: c * CELL_SIZE, top: r * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }}
                    >
                      <div className="w-1.5 h-1.5 bg-yellow-200/60 rounded-full"></div>
                    </div>
                  );
                }
                if (cell === 3) {
                  return (
                    <div 
                      key={`power-${r}-${c}`}
                      className="absolute flex items-center justify-center"
                      style={{ left: c * CELL_SIZE, top: r * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }}
                    >
                      <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(250,204,21,0.8)]"></div>
                    </div>
                  );
                }
                return null;
              })
            )}

            {/* Jogador (Pac-Man) */}
            <motion.div
              className="absolute flex items-center justify-center z-10"
              animate={{ 
                left: player.pos.c * CELL_SIZE, 
                top: player.pos.r * CELL_SIZE,
                rotate: player.dir === 'RIGHT' ? 0 : player.dir === 'DOWN' ? 90 : player.dir === 'LEFT' ? 180 : player.dir === 'UP' ? -90 : 0
              }}
              transition={{ type: 'tween', duration: playerSpeed / 1000, ease: 'linear' }}
              style={{ width: CELL_SIZE, height: CELL_SIZE }}
            >
              <div className="w-3/4 h-3/4 bg-yellow-400 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.6)] relative">
                {/* Olho */}
                <div className="absolute top-1 right-2 w-1 h-1 bg-black rounded-full"></div>
                {/* Boca (Simulada com um corte) */}
                <div className="absolute top-1/2 right-0 w-1/2 h-1/2 bg-black/80 origin-top-left -rotate-45"></div>
              </div>
            </motion.div>

            {/* Fantasmas */}
            {ghosts.map((ghost, index) => {
              const colors = ['bg-red-500', 'bg-pink-400', 'bg-cyan-400'];
              const shadows = ['shadow-[0_0_15px_rgba(239,68,68,0.6)]', 'shadow-[0_0_15px_rgba(244,114,182,0.6)]', 'shadow-[0_0_15px_rgba(34,211,238,0.6)]'];
              
              return (
                <motion.div
                  key={`ghost-${index}`}
                  className="absolute flex items-center justify-center z-10"
                  animate={{ 
                    left: ghost.pos.c * CELL_SIZE, 
                    top: ghost.pos.r * CELL_SIZE 
                  }}
                  transition={{ type: 'tween', duration: ghostSpeed / 1000, ease: 'linear' }}
                  style={{ width: CELL_SIZE, height: CELL_SIZE }}
                >
                  <div className={`w-3/4 h-3/4 rounded-t-full relative ${powerMode ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.6)]' : `${colors[index]} ${shadows[index]}`}`}>
                    {/* Olhos */}
                    <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-white rounded-full flex items-center justify-center">
                      <div className="w-0.5 h-0.5 bg-blue-900 rounded-full"></div>
                    </div>
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full flex items-center justify-center">
                      <div className="w-0.5 h-0.5 bg-blue-900 rounded-full"></div>
                    </div>
                    {/* Base ondulada (simulada) */}
                    <div className="absolute -bottom-1 left-0 w-full flex justify-between">
                      <div className={`w-1.5 h-1.5 rounded-full ${powerMode ? 'bg-blue-600' : colors[index]}`}></div>
                      <div className={`w-1.5 h-1.5 rounded-full ${powerMode ? 'bg-blue-600' : colors[index]}`}></div>
                      <div className={`w-1.5 h-1.5 rounded-full ${powerMode ? 'bg-blue-600' : colors[index]}`}></div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Overlays */}
          {gameState === 'idle' && (
            <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
              <button 
                onClick={startGame}
                className="px-8 py-4 rounded-full bg-yellow-400 text-black font-bold text-xl hover:bg-yellow-300 transition-all shadow-[0_0_30px_rgba(250,204,21,0.4)] hover:scale-105 cursor-pointer flex items-center gap-3"
              >
                <Play className="w-6 h-6 fill-current" /> INICIAR
              </button>
            </div>
          )}

          {isPaused && gameState === 'playing' && (
            <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
              <div className="text-center">
                <Pause className="w-12 h-12 text-white mx-auto mb-2" />
                <h2 className="font-display text-2xl font-bold text-white">PAUSADO</h2>
              </div>
            </div>
          )}

          {gameState === 'lost' && (
            <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex items-center justify-center rounded-xl">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center p-6 glass-panel border border-red-500/30 rounded-2xl"
              >
                <Ghost className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="font-display text-3xl font-bold text-white mb-2">GAME OVER</h2>
                <p className="text-gray-300 mb-6">Pontuação Final: <span className="text-yellow-400 font-mono font-bold">{score}</span></p>
                <button 
                  onClick={startGame}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold hover:from-yellow-300 hover:to-orange-400 transition-all shadow-[0_0_20px_rgba(250,204,21,0.4)] cursor-pointer"
                >
                  Tentar Novamente
                </button>
              </motion.div>
            </div>
          )}

          {gameState === 'won' && (
            <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex items-center justify-center rounded-xl">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center p-6 glass-panel border border-emerald-500/30 rounded-2xl"
              >
                <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <h2 className="font-display text-3xl font-bold text-white mb-2">VITÓRIA!</h2>
                <p className="text-gray-300 mb-6">Você limpou o labirinto!</p>
                <button 
                  onClick={startGame}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold hover:from-emerald-300 hover:to-teal-400 transition-all shadow-[0_0_20px_rgba(52,211,153,0.4)] cursor-pointer"
                >
                  Próximo Nível
                </button>
              </motion.div>
            </div>
          )}
        </div>

        {/* Mobile Controls (Bottom) */}
        <div className="lg:hidden w-full max-w-[280px] mt-4">
          {/* D-Pad Style */}
          <div className="grid grid-cols-3 gap-2">
            <div></div>
            <button onClick={() => handleMobileControl('UP')} className="glass-panel p-4 rounded-xl flex items-center justify-center active:bg-white/20 border border-white/10">
              <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[15px] border-b-white/50"></div>
            </button>
            <div></div>
            
            <button onClick={() => handleMobileControl('LEFT')} className="glass-panel p-4 rounded-xl flex items-center justify-center active:bg-white/20 border border-white/10">
              <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[15px] border-r-white/50"></div>
            </button>
            <div className="glass-panel p-4 rounded-xl flex items-center justify-center border border-white/5 bg-white/5">
              <div className="w-4 h-4 rounded-full bg-white/20"></div>
            </div>
            <button onClick={() => handleMobileControl('RIGHT')} className="glass-panel p-4 rounded-xl flex items-center justify-center active:bg-white/20 border border-white/10">
              <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[15px] border-l-white/50"></div>
            </button>
            
            <div></div>
            <button onClick={() => handleMobileControl('DOWN')} className="glass-panel p-4 rounded-xl flex items-center justify-center active:bg-white/20 border border-white/10">
              <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[15px] border-t-white/50"></div>
            </button>
            <div></div>
          </div>
        </div>

      </div>
    </div>
  );
}
