import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, RotateCcw, Play, Pause, Trophy, BrainCircuit, ChevronLeft, ChevronRight, ChevronDown, RotateCw } from 'lucide-react';
import { AIEngine } from '../services/aiEngine';

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
  shadow: string;
}

const TETROMINOES: Record<TetrominoType, Tetromino> = {
  I: { shape: [[1, 1, 1, 1]], color: 'bg-cyan-400', shadow: 'shadow-[0_0_15px_rgba(34,211,238,0.6)]' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'bg-blue-500', shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.6)]' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'bg-orange-500', shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.6)]' },
  O: { shape: [[1, 1], [1, 1]], color: 'bg-yellow-400', shadow: 'shadow-[0_0_15px_rgba(250,204,21,0.6)]' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-emerald-400', shadow: 'shadow-[0_0_15px_rgba(52,211,153,0.6)]' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'bg-purple-500', shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.6)]' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-red-500', shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.6)]' },
};

const SHAPES = Object.keys(TETROMINOES) as TetrominoType[];

// --- COMPONENTE PRINCIPAL ---
export function BlockPuzzle({ onBack }: BlockPuzzleProps) {
  // Estados do Jogo
  const [board, setBoard] = useState<string[][]>(Array(ROWS).fill(Array(COLS).fill('')));
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Estados da IA
  const [aiDifficulty, setAiDifficulty] = useState(50);
  const [dropSpeed, setDropSpeed] = useState(1000);

  // Refs para o loop do jogo (evita problemas de closure no setInterval)
  const boardRef = useRef(board);
  const currentPieceRef = useRef<{ type: TetrominoType; x: number; y: number; shape: number[][] } | null>(null);
  const dropSpeedRef = useRef(dropSpeed);
  const isPausedRef = useRef(isPaused);
  const gameOverRef = useRef(gameOver);

  // Sincroniza refs
  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { dropSpeedRef.current = dropSpeed; }, [dropSpeed]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);

  // --- IA ADAPTATIVA ---
  useEffect(() => {
    const initAI = async () => {
      // Simula a busca do desempenho do jogador
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

    // Verifica Game Over imediato
    if (checkCollision(newPiece.x, newPiece.y, newPiece.shape, boardRef.current)) {
      setGameOver(true);
      return;
    }

    currentPieceRef.current = newPiece;
    updateBoardDisplay();
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

    // Limpar linhas
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
      
      // Aumenta o nível a cada 10 linhas
      if (Math.floor(newLines / 10) + 1 > level) {
        const nextLevel = Math.floor(newLines / 10) + 1;
        setLevel(nextLevel);
        // IA: Aumenta a velocidade conforme o nível sobe
        setDropSpeed(prev => Math.max(100, prev * 0.85)); 
      }
    }

    setBoard(finalBoard);
    spawnPiece();
  }, [level, lines, spawnPiece]);

  const moveDown = useCallback(() => {
    if (!currentPieceRef.current || isPausedRef.current || gameOverRef.current) return;

    const { x, y, shape } = currentPieceRef.current;
    if (!checkCollision(x, y + 1, shape, boardRef.current)) {
      currentPieceRef.current.y += 1;
      updateBoardDisplay();
    } else {
      mergePiece();
    }
  }, [mergePiece]);

  const moveHorizontal = useCallback((dir: 1 | -1) => {
    if (!currentPieceRef.current || isPausedRef.current || gameOverRef.current) return;
    const { x, y, shape } = currentPieceRef.current;
    if (!checkCollision(x + dir, y, shape, boardRef.current)) {
      currentPieceRef.current.x += dir;
      updateBoardDisplay();
    }
  }, []);

  const rotate = useCallback(() => {
    if (!currentPieceRef.current || isPausedRef.current || gameOverRef.current) return;
    const { x, y, shape } = currentPieceRef.current;
    
    // Transposição + Reverse = Rotação 90 graus
    const rotatedShape = shape[0].map((_, index) => shape.map(row => row[index]).reverse());
    
    if (!checkCollision(x, y, rotatedShape, boardRef.current)) {
      currentPieceRef.current.shape = rotatedShape;
      updateBoardDisplay();
    }
  }, []);

  const hardDrop = useCallback(() => {
    if (!currentPieceRef.current || isPausedRef.current || gameOverRef.current) return;
    let { x, y, shape } = currentPieceRef.current;
    while (!checkCollision(x, y + 1, shape, boardRef.current)) {
      y++;
    }
    currentPieceRef.current.y = y;
    mergePiece();
  }, [mergePiece]);

  // Atualiza a visualização combinando o board fixo com a peça atual
  const [displayBoard, setDisplayBoard] = useState<string[][]>(Array(ROWS).fill(Array(COLS).fill('')));
  
  const updateBoardDisplay = useCallback(() => {
    const newDisplay = boardRef.current.map(row => [...row]);
    if (currentPieceRef.current) {
      const { type, x, y, shape } = currentPieceRef.current;
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c] && y + r >= 0 && y + r < ROWS) {
            newDisplay[y + r][x + c] = type;
          }
        }
      }
    }
    setDisplayBoard(newDisplay);
  }, []);

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
    currentPieceRef.current = null;
    
    // Recalcula IA no reset
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
      <div className="relative z-10 p-4 sm:p-6 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md">
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
          <h1 className="font-display text-xl font-bold tracking-wider">BLOCK PUZZLE</h1>
        </div>
        <div className="flex items-center gap-2">
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
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center p-4 gap-8">
        
        {/* Left Stats (Desktop) */}
        <div className="hidden lg:flex flex-col gap-4 w-48">
          <div className="glass-panel p-4 rounded-2xl border border-white/10 text-center">
            <p className="text-gray-400 text-sm mb-1">Pontuação</p>
            <p className="font-mono text-3xl font-bold text-cyan-400">{score}</p>
          </div>
          <div className="glass-panel p-4 rounded-2xl border border-white/10 text-center">
            <p className="text-gray-400 text-sm mb-1">Nível</p>
            <p className="font-mono text-3xl font-bold text-purple-400">{level}</p>
          </div>
          <div className="glass-panel p-4 rounded-2xl border border-white/10 text-center">
            <p className="text-gray-400 text-sm mb-1">Linhas</p>
            <p className="font-mono text-2xl font-bold text-white">{lines}</p>
          </div>
          
          {/* AI Status */}
          <div className="mt-4 glass-panel p-4 rounded-2xl border border-purple-500/30 bg-purple-500/5">
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit className="w-4 h-4 text-purple-400" />
              <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">IA Adaptativa</p>
            </div>
            <p className="text-xs text-gray-400">Dificuldade ajustada para o seu nível de habilidade.</p>
            <div className="mt-2 h-1.5 w-full bg-black rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-500" style={{ width: `${aiDifficulty}%` }}></div>
            </div>
          </div>
        </div>

        {/* Mobile Stats (Top) */}
        <div className="flex lg:hidden w-full max-w-sm justify-between gap-2">
          <div className="flex-1 glass-panel p-2 rounded-xl border border-white/10 text-center">
            <p className="text-[10px] text-gray-400 uppercase">Score</p>
            <p className="font-mono text-lg font-bold text-cyan-400">{score}</p>
          </div>
          <div className="flex-1 glass-panel p-2 rounded-xl border border-white/10 text-center">
            <p className="text-[10px] text-gray-400 uppercase">Nível</p>
            <p className="font-mono text-lg font-bold text-purple-400">{level}</p>
          </div>
        </div>

        {/* Board */}
        <div className="relative p-2 glass-panel rounded-xl border border-white/20 shadow-[0_0_50px_rgba(6,182,212,0.15)] bg-black/40">
          <div 
            className="grid gap-[1px] bg-white/10 border border-white/10"
            style={{ 
              gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
              width: 'min(80vw, 300px)',
              height: 'min(160vw, 600px)'
            }}
          >
            {displayBoard.map((row, r) => 
              row.map((cell, c) => {
                const isFilled = cell !== '';
                const blockStyle = isFilled ? TETROMINOES[cell as TetrominoType] : null;
                
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`w-full h-full rounded-sm transition-all duration-75 ${
                      isFilled 
                        ? `${blockStyle?.color} ${blockStyle?.shadow} border border-white/20` 
                        : 'bg-black/40'
                    }`}
                  />
                );
              })
            )}
          </div>

          {/* Overlays */}
          {isPaused && !gameOver && (
            <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
              <div className="text-center">
                <Pause className="w-12 h-12 text-white mx-auto mb-2" />
                <h2 className="font-display text-2xl font-bold text-white">PAUSADO</h2>
              </div>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex items-center justify-center rounded-xl">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center p-6 glass-panel border border-red-500/30 rounded-2xl"
              >
                <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <h2 className="font-display text-3xl font-bold text-white mb-2">GAME OVER</h2>
                <p className="text-gray-300 mb-6">Pontuação Final: <span className="text-cyan-400 font-mono font-bold">{score}</span></p>
                <button 
                  onClick={resetGame}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold hover:from-cyan-400 hover:to-blue-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer"
                >
                  Jogar Novamente
                </button>
              </motion.div>
            </div>
          )}
        </div>

        {/* Mobile Controls (Bottom) */}
        <div className="lg:hidden w-full max-w-sm grid grid-cols-4 gap-2 mt-4">
          <button onClick={() => moveHorizontal(-1)} className="glass-panel p-4 rounded-xl flex items-center justify-center active:bg-white/20">
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button onClick={rotate} className="glass-panel p-4 rounded-xl flex items-center justify-center active:bg-white/20">
            <RotateCw className="w-8 h-8" />
          </button>
          <button onClick={() => moveHorizontal(1)} className="glass-panel p-4 rounded-xl flex items-center justify-center active:bg-white/20">
            <ChevronRight className="w-8 h-8" />
          </button>
          <button onClick={hardDrop} className="glass-panel p-4 rounded-xl flex items-center justify-center active:bg-white/20 bg-cyan-500/20 border-cyan-500/30">
            <ChevronDown className="w-8 h-8 text-cyan-400" />
          </button>
        </div>

      </div>
    </div>
  );
}
