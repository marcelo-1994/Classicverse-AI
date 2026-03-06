import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess, Move } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { ArrowLeft, RotateCcw, Users, BrainCircuit, Trophy, Maximize, Minimize } from 'lucide-react';
import { motion } from 'motion/react';
import { AIEngine } from '../services/aiEngine';

interface ChessGameProps {
  onBack: () => void;
}

type GameMode = 'pve' | 'pvp';

export function ChessGame({ onBack }: ChessGameProps) {
  const [game, setGame] = useState(new Chess());
  const [gameMode, setGameMode] = useState<GameMode>('pve');
  const [aiDifficulty, setAiDifficulty] = useState(50);
  const [searchDepth, setSearchDepth] = useState(2);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // --- IA ADAPTATIVA ---
  useEffect(() => {
    const initAI = async () => {
      const performance = await AIEngine.analisarDesempenho('user_123', 'chess');
      const newDiff = AIEngine.calcularNivelDificuldade(performance);
      const params = AIEngine.ajustarParametrosJogo('chess', newDiff);
      
      setAiDifficulty(newDiff);
      setSearchDepth(params.searchDepth || 2);
    };
    initAI();
  }, []);

  // --- LÓGICA DO JOGO ---
  const checkGameOver = useCallback((cg: Chess) => {
    if (cg.isGameOver()) {
      setGameOver(true);
      if (cg.isCheckmate()) {
        setWinner(cg.turn() === 'w' ? 'Pretas' : 'Brancas');
      } else if (cg.isDraw() || cg.isStalemate() || cg.isThreefoldRepetition()) {
        setWinner('Empate');
      }
      return true;
    }
    return false;
  }, []);

  // Função de avaliação simples para a IA
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

    // IA Simples: Escolhe o movimento que resulta na melhor avaliação imediata (Depth 1)
    // Para níveis mais altos, poderíamos implementar Minimax, mas para o MVP isso basta.
    let bestMove = possibleMoves[0];
    let bestValue = 9999; // IA joga com as pretas, quer minimizar o valor

    // Se a dificuldade for muito baixa, faz um movimento aleatório de vez em quando
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
    checkGameOver(gameCopy);
  }, [game, aiDifficulty, checkGameOver]);

  const onDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
    if (gameOver) return false;

    try {
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: piece[1].toLowerCase() ?? 'q',
      });

      setGame(gameCopy);
      setMoveFrom(null);
      
      if (!checkGameOver(gameCopy) && gameMode === 'pve') {
        // Delay para a IA "pensar"
        setTimeout(makeAIMove, 500);
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  const onSquareClick = (square: string) => {
    if (gameOver) return;

    if (!moveFrom) {
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setMoveFrom(square);
      }
      return;
    }

    try {
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move({
        from: moveFrom,
        to: square,
        promotion: 'q',
      });

      setGame(gameCopy);
      setMoveFrom(null);
      
      if (!checkGameOver(gameCopy) && gameMode === 'pve') {
        setTimeout(makeAIMove, 500);
      }
    } catch (e) {
      // Invalid move, maybe clicked another piece
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setMoveFrom(square);
      } else {
        setMoveFrom(null);
      }
    }
  };

  const resetGame = () => {
    setGame(new Chess());
    setGameOver(false);
    setWinner(null);
    setMoveFrom(null);
  };

  const toggleMode = () => {
    setGameMode(prev => prev === 'pve' ? 'pvp' : 'pve');
    resetGame();
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#050505] text-white flex flex-col font-sans relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px]"></div>
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
          <BrainCircuit className="w-6 h-6 text-emerald-400" />
          <h1 className="font-display text-xl font-bold tracking-wider">XADREZ INTELIGENTE</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleFullscreen}
            className="p-2 rounded-full glass-panel hover:bg-white/10 transition-colors cursor-pointer"
            title="Tela Cheia"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
          <button 
            onClick={resetGame}
            className="p-2 rounded-full glass-panel hover:bg-white/10 transition-colors cursor-pointer"
            title="Reiniciar Partida"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Game Area */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center p-4 gap-8">
        
        {/* Left Stats */}
        <div className="flex flex-col gap-4 w-full max-w-sm lg:w-64">
          
          {/* Mode Selector */}
          <div className="glass-panel p-2 rounded-2xl border border-white/10 flex gap-2">
            <button
              onClick={() => gameMode !== 'pve' && toggleMode()}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all cursor-pointer ${
                gameMode === 'pve' ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BrainCircuit className="w-5 h-5" />
              <span>Vs IA</span>
            </button>
            <button
              onClick={() => gameMode !== 'pvp' && toggleMode()}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all cursor-pointer ${
                gameMode === 'pvp' ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>PvP Local</span>
            </button>
          </div>

          {/* Status */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 text-center">
            <p className="text-gray-400 text-sm mb-2">Turno Atual</p>
            <p className={`font-display text-2xl font-bold ${game.turn() === 'w' ? 'text-white' : 'text-gray-400'}`}>
              {game.turn() === 'w' ? 'BRANCAS' : 'PRETAS'}
            </p>
            {game.inCheck() && !gameOver && (
              <p className="text-red-400 font-bold mt-2 animate-pulse">XEQUE!</p>
            )}
          </div>
          
          {/* AI Status (Only in PvE) */}
          {gameMode === 'pve' && (
            <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center gap-2 mb-2">
                <BrainCircuit className="w-4 h-4 text-emerald-400" />
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">IA Adaptativa</p>
              </div>
              <p className="text-xs text-gray-400">Dificuldade: {aiDifficulty.toFixed(0)}/100</p>
              <div className="mt-2 h-1.5 w-full bg-black rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: `${aiDifficulty}%` }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Board Container */}
        <div className="relative p-4 glass-panel rounded-3xl border border-white/20 shadow-[0_0_50px_rgba(16,185,129,0.1)] bg-black/80 w-full max-w-[500px] touch-none">
          <Chessboard 
            position={game.fen()} 
            onPieceDrop={onDrop}
            onSquareClick={onSquareClick}
            customDarkSquareStyle={{ backgroundColor: '#111827' }}
            customLightSquareStyle={{ backgroundColor: '#374151' }}
            customSquareStyles={{
              ...(moveFrom ? { [moveFrom]: { backgroundColor: 'rgba(16, 185, 129, 0.4)' } } : {})
            }}
            customBoardStyle={{
              borderRadius: '8px',
              boxShadow: '0 0 20px rgba(0,0,0,0.5)'
            }}
          />

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex items-center justify-center rounded-3xl">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center p-8 glass-panel border border-emerald-500/30 rounded-2xl"
              >
                <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h2 className="font-display text-4xl font-bold text-white mb-2">FIM DE JOGO</h2>
                <p className="text-gray-300 mb-8 text-lg">
                  {winner === 'Empate' ? 'A partida terminou em empate.' : `Vitória das ${winner}!`}
                </p>
                <button 
                  onClick={resetGame}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-black font-bold text-lg hover:from-emerald-300 hover:to-teal-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer"
                >
                  Jogar Novamente
                </button>
              </motion.div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
