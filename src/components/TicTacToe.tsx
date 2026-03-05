import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy, RotateCcw, BrainCircuit } from 'lucide-react';

interface TicTacToeProps {
  onBack: () => void;
}

type Player = 'X' | 'O' | null;
type BoardState = Player[];

export function TicTacToe({ onBack }: TicTacToeProps) {
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [winner, setWinner] = useState<Player | 'Draw'>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [score, setScore] = useState({ player: 0, ai: 0 });

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
        return squares[a];
      }
    }
    if (!squares.includes(null)) return 'Draw';
    return null;
  }, []);

  // Simple AI logic (Minimax could be used for unbeatable AI, but let's make it slightly beatable for fun)
  const makeAIMove = useCallback((currentBoard: BoardState) => {
    setAiThinking(true);
    
    setTimeout(() => {
      let moveIndex = -1;
      
      // 1. Try to win
      for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (currentBoard[a] === 'O' && currentBoard[b] === 'O' && !currentBoard[c]) moveIndex = c;
        if (currentBoard[a] === 'O' && !currentBoard[b] && currentBoard[c] === 'O') moveIndex = b;
        if (!currentBoard[a] && currentBoard[b] === 'O' && currentBoard[c] === 'O') moveIndex = a;
      }

      // 2. Try to block
      if (moveIndex === -1) {
        for (let i = 0; i < lines.length; i++) {
          const [a, b, c] = lines[i];
          if (currentBoard[a] === 'X' && currentBoard[b] === 'X' && !currentBoard[c]) moveIndex = c;
          if (currentBoard[a] === 'X' && !currentBoard[b] && currentBoard[c] === 'X') moveIndex = b;
          if (!currentBoard[a] && currentBoard[b] === 'X' && currentBoard[c] === 'X') moveIndex = a;
        }
      }

      // 3. Take center
      if (moveIndex === -1 && !currentBoard[4]) {
        moveIndex = 4;
      }

      // 4. Take random available
      if (moveIndex === -1) {
        const available = currentBoard.map((val, idx) => val === null ? idx : null).filter(val => val !== null) as number[];
        if (available.length > 0) {
          moveIndex = available[Math.floor(Math.random() * available.length)];
        }
      }

      if (moveIndex !== -1) {
        const newBoard = [...currentBoard];
        newBoard[moveIndex] = 'O';
        setBoard(newBoard);
        setIsXNext(true);
        
        const result = checkWinner(newBoard);
        if (result) {
          setWinner(result);
          if (result === 'O') setScore(s => ({ ...s, ai: s.ai + 1 }));
        }
      }
      setAiThinking(false);
    }, 600); // Fake thinking delay
  }, [checkWinner]);

  const handleClick = (index: number) => {
    if (board[index] || winner || !isXNext || aiThinking) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    setIsXNext(false);

    const result = checkWinner(newBoard);
    if (result) {
      setWinner(result);
      if (result === 'X') setScore(s => ({ ...s, player: s.player + 1 }));
    } else {
      makeAIMove(newBoard);
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
  };

  return (
    <div className="absolute inset-0 z-[60] bg-[#050505] flex flex-col items-center justify-center">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center glass-panel border-b border-white/10">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar ao Dashboard</span>
        </button>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold">Você (X)</span>
            <span className="font-display text-2xl font-bold">{score.player}</span>
          </div>
          <span className="text-gray-600">-</span>
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl font-bold">{score.ai}</span>
            <span className="text-purple-400 font-bold">IA (O)</span>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex flex-col items-center mt-16">
        <div className="mb-8 text-center h-12">
          {winner ? (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-2xl font-bold font-display flex items-center gap-2 ${
                winner === 'X' ? 'text-cyan-400' : winner === 'O' ? 'text-purple-400' : 'text-gray-400'
              }`}
            >
              {winner === 'X' ? <Trophy className="w-6 h-6" /> : winner === 'O' ? <BrainCircuit className="w-6 h-6" /> : null}
              {winner === 'Draw' ? 'Empate!' : winner === 'X' ? 'Você Venceu!' : 'A IA Venceu!'}
            </motion.div>
          ) : (
            <div className="text-xl text-gray-400 flex items-center gap-2">
              {aiThinking ? (
                <>
                  <BrainCircuit className="w-5 h-5 text-purple-400 animate-pulse" />
                  <span className="text-purple-400">A IA está pensando...</span>
                </>
              ) : (
                <span>Sua vez de jogar</span>
              )}
            </div>
          )}
        </div>

        {/* Board */}
        <div className="grid grid-cols-3 gap-3 p-4 glass-panel rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(168,85,247,0.1)]">
          {board.map((cell, index) => (
            <button
              key={index}
              onClick={() => handleClick(index)}
              disabled={!!cell || !!winner || aiThinking}
              className={`w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-5xl sm:text-7xl font-display transition-all
                ${!cell && !winner && !aiThinking ? 'hover:bg-white/10 cursor-pointer' : 'cursor-default'}
                ${cell === 'X' ? 'text-cyan-400 shadow-[inset_0_0_20px_rgba(6,182,212,0.2)]' : ''}
                ${cell === 'O' ? 'text-purple-400 shadow-[inset_0_0_20px_rgba(168,85,247,0.2)]' : ''}
              `}
            >
              <motion.span
                initial={cell ? { scale: 0, rotate: -45 } : false}
                animate={cell ? { scale: 1, rotate: 0 } : false}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {cell}
              </motion.span>
            </button>
          ))}
        </div>

        {/* Controls */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: winner ? 1 : 0, y: winner ? 0 : 20 }}
          onClick={resetGame}
          className={`mt-10 px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all cursor-pointer ${
            winner ? 'bg-white text-black hover:bg-gray-200' : 'pointer-events-none'
          }`}
        >
          <RotateCcw className="w-5 h-5" />
          Jogar Novamente
        </motion.button>
      </div>
    </div>
  );
}
