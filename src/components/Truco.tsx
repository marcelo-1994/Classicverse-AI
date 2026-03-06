import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Trophy, AlertCircle, Swords, RotateCcw, User, Bot } from 'lucide-react';

type Suit = 'ouros' | 'espadas' | 'copas' | 'paus';
type Rank = '4' | '5' | '6' | '7' | 'Q' | 'J' | 'K' | 'A' | '2' | '3';

interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  baseValue: number;
  isManilha: boolean;
  manilhaValue: number;
}

const SUITS: Suit[] = ['ouros', 'espadas', 'copas', 'paus'];
const RANKS: Rank[] = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];

const RANK_VALUES: Record<Rank, number> = {
  '4': 1, '5': 2, '6': 3, '7': 4, 'Q': 5, 'J': 6, 'K': 7, 'A': 8, '2': 9, '3': 10
};

const SUIT_VALUES: Record<Suit, number> = {
  'ouros': 1, 'espadas': 2, 'copas': 3, 'paus': 4
};

const SUIT_SYMBOLS: Record<Suit, string> = {
  'ouros': '♦', 'espadas': '♠', 'copas': '♥', 'paus': '♣'
};

const SUIT_COLORS: Record<Suit, string> = {
  'ouros': 'text-red-500', 'espadas': 'text-gray-900', 'copas': 'text-red-500', 'paus': 'text-gray-900'
};

// Helper to get the next rank for manilha
const getNextRank = (rank: Rank): Rank => {
  const index = RANKS.indexOf(rank);
  return RANKS[(index + 1) % RANKS.length];
};

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${rank}-${suit}`,
        suit,
        rank,
        baseValue: RANK_VALUES[rank],
        isManilha: false,
        manilhaValue: 0
      });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

interface TrucoProps {
  onBack: () => void;
}

export function Truco({ onBack }: TrucoProps) {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [aiHand, setAiHand] = useState<Card[]>([]);
  const [vira, setVira] = useState<Card | null>(null);
  
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  
  const [roundWins, setRoundWins] = useState<(1 | 2 | 0)[]>([]); // 1: player, 2: ai, 0: draw
  const [currentHandValue, setCurrentHandValue] = useState(1);
  const [turn, setTurn] = useState<1 | 2>(1); // 1: player, 2: ai
  
  const [tableCards, setTableCards] = useState<{player: Card | null, ai: Card | null}>({ player: null, ai: null });
  const [message, setMessage] = useState('Sua vez de jogar!');
  const [gameOver, setGameOver] = useState(false);
  const [trucoState, setTrucoState] = useState<{ active: boolean, askedBy: 1 | 2 | null, level: number }>({ active: false, askedBy: null, level: 1 });

  const startHand = useCallback(() => {
    let newDeck = createDeck();
    
    // Deal cards
    const pHand = newDeck.splice(0, 3);
    const aHand = newDeck.splice(0, 3);
    const vCard = newDeck.splice(0, 1)[0];
    
    // Determine manilha rank
    const manilhaRank = getNextRank(vCard.rank);
    
    // Update cards with manilha info
    const updateCard = (c: Card) => {
      if (c.rank === manilhaRank) {
        c.isManilha = true;
        c.manilhaValue = 20 + SUIT_VALUES[c.suit];
      }
      return c;
    };
    
    setPlayerHand(pHand.map(updateCard));
    setAiHand(aHand.map(updateCard));
    setVira(vCard);
    setDeck(newDeck);
    
    setRoundWins([]);
    setCurrentHandValue(1);
    setTableCards({ player: null, ai: null });
    setTrucoState({ active: false, askedBy: null, level: 1 });
    setMessage('Nova mão começou. Sua vez!');
    setTurn(1);
  }, []);

  useEffect(() => {
    startHand();
  }, [startHand]);

  const evaluateRound = useCallback(() => {
    if (!tableCards.player || !tableCards.ai) return;

    const pCard = tableCards.player;
    const aCard = tableCards.ai;

    const pValue = pCard.isManilha ? pCard.manilhaValue : pCard.baseValue;
    const aValue = aCard.isManilha ? aCard.manilhaValue : aCard.baseValue;

    let winner: 1 | 2 | 0 = 0;
    if (pValue > aValue) winner = 1;
    else if (aValue > pValue) winner = 2;

    const newRoundWins = [...roundWins, winner];
    setRoundWins(newRoundWins);

    // Check hand winner
    let handWinner: 1 | 2 | null = null;
    
    const pWins = newRoundWins.filter(w => w === 1).length;
    const aWins = newRoundWins.filter(w => w === 2).length;
    const draws = newRoundWins.filter(w => w === 0).length;

    if (pWins === 2) handWinner = 1;
    else if (aWins === 2) handWinner = 2;
    else if (newRoundWins.length === 3) {
      if (pWins > aWins) handWinner = 1;
      else if (aWins > pWins) handWinner = 2;
      else handWinner = newRoundWins[0] === 0 ? 0 : newRoundWins[0]; // Tiebreaker is first round winner
    } else if (draws === 1 && newRoundWins.length === 2) {
      if (pWins === 1) handWinner = 1;
      else if (aWins === 1) handWinner = 2;
    } else if (draws === 2 && newRoundWins.length === 2) {
      // Two draws, whoever wins 3rd wins, if draw again, nobody wins or first player wins? Usually tie goes to whoever didn't tie first or nobody.
      // Let's simplify: 3 draws = nobody wins.
    } else if (draws === 3) {
       handWinner = 0; // Nobody gets points
    }

    setTimeout(() => {
      setTableCards({ player: null, ai: null });
      
      if (handWinner !== null) {
        if (handWinner === 1) {
          setPlayerScore(s => {
            const newScore = s + currentHandValue;
            if (newScore >= 12) setGameOver(true);
            return newScore;
          });
          setMessage(`Você venceu a mão e ganhou ${currentHandValue} ponto(s)!`);
        } else if (handWinner === 2) {
          setAiScore(s => {
            const newScore = s + currentHandValue;
            if (newScore >= 12) setGameOver(true);
            return newScore;
          });
          setMessage(`IA venceu a mão e ganhou ${currentHandValue} ponto(s)!`);
        } else {
          setMessage('Mão empatada! Ninguém pontua.');
        }
        
        setTimeout(() => {
          if (!gameOver) startHand();
        }, 3000);
      } else {
        // Next round
        const nextTurn = winner === 0 ? turn : winner; // If draw, whoever played first plays first. Wait, simplified: winner plays first.
        setTurn(nextTurn);
        setMessage(nextTurn === 1 ? 'Sua vez!' : 'Vez da IA...');
      }
    }, 2000);

  }, [tableCards, roundWins, currentHandValue, turn, gameOver, startHand]);

  // AI Logic
  useEffect(() => {
    if (turn === 2 && !gameOver && !trucoState.active) {
      const playAi = () => {
        if (aiHand.length === 0) return;
        
        // Simple AI: play lowest card that beats player's card, or lowest card if playing first
        let cardToPlay = aiHand[0];
        
        if (tableCards.player) {
          const pValue = tableCards.player.isManilha ? tableCards.player.manilhaValue : tableCards.player.baseValue;
          const winningCards = aiHand.filter(c => (c.isManilha ? c.manilhaValue : c.baseValue) > pValue);
          if (winningCards.length > 0) {
            // Play lowest winning card
            winningCards.sort((a, b) => (a.isManilha ? a.manilhaValue : a.baseValue) - (b.isManilha ? b.manilhaValue : b.baseValue));
            cardToPlay = winningCards[0];
          } else {
            // Play lowest card
            const sortedHand = [...aiHand].sort((a, b) => (a.isManilha ? a.manilhaValue : a.baseValue) - (b.isManilha ? b.manilhaValue : b.baseValue));
            cardToPlay = sortedHand[0];
          }
        } else {
          // Playing first: play highest card to secure first round, or random
          const sortedHand = [...aiHand].sort((a, b) => (b.isManilha ? b.manilhaValue : b.baseValue) - (a.isManilha ? a.manilhaValue : a.baseValue));
          cardToPlay = sortedHand[0];
        }

        setAiHand(prev => prev.filter(c => c.id !== cardToPlay.id));
        setTableCards(prev => ({ ...prev, ai: cardToPlay }));
        
        if (tableCards.player) {
          // Round over
          setTurn(1); // Temporary, evaluateRound will set correct turn
        } else {
          setTurn(1);
          setMessage('Sua vez!');
        }
      };

      const timer = setTimeout(playAi, 1500);
      return () => clearTimeout(timer);
    }
  }, [turn, aiHand, tableCards.player, gameOver, trucoState.active]);

  // Trigger evaluation when both cards are on table
  useEffect(() => {
    if (tableCards.player && tableCards.ai) {
      evaluateRound();
    }
  }, [tableCards, evaluateRound]);

  const playCard = (card: Card) => {
    if (turn !== 1 || tableCards.player || gameOver || trucoState.active) return;

    setPlayerHand(prev => prev.filter(c => c.id !== card.id));
    setTableCards(prev => ({ ...prev, player: card }));
    
    if (tableCards.ai) {
      // Round over
      setTurn(2); // Temporary
    } else {
      setTurn(2);
      setMessage('Vez da IA...');
    }
  };

  const askTruco = () => {
    if (turn !== 1 || gameOver || trucoState.active) return;
    
    const nextLevel = currentHandValue === 1 ? 3 : currentHandValue + 3;
    if (nextLevel > 12) return;

    setTrucoState({ active: true, askedBy: 1, level: nextLevel });
    setMessage(`Você pediu TRUCO (${nextLevel})! Aguardando IA...`);

    // AI decides to accept, reject or raise
    setTimeout(() => {
      // Simple AI logic for Truco: random chance based on hand strength
      const handStrength = aiHand.reduce((acc, c) => acc + (c.isManilha ? c.manilhaValue : c.baseValue), 0);
      const threshold = nextLevel === 3 ? 15 : nextLevel === 6 ? 20 : 25;
      
      const accept = handStrength > threshold || Math.random() > 0.5;
      
      if (accept) {
        setCurrentHandValue(nextLevel);
        setTrucoState({ active: false, askedBy: null, level: nextLevel });
        setMessage(`IA ACEITOU! Valendo ${nextLevel} pontos.`);
      } else {
        // AI rejects, player wins hand
        setPlayerScore(s => {
          const newScore = s + currentHandValue;
          if (newScore >= 12) setGameOver(true);
          return newScore;
        });
        setMessage(`IA FUGIU! Você ganhou ${currentHandValue} ponto(s).`);
        setTimeout(() => {
          if (!gameOver) startHand();
        }, 3000);
      }
    }, 2000);
  };

  const renderCard = (card: Card, hidden = false, onClick?: () => void) => {
    if (hidden) {
      return (
        <div className="w-20 h-28 sm:w-24 sm:h-36 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-800 border-2 border-white/20 shadow-lg flex items-center justify-center backface-hidden">
          <div className="w-16 h-24 sm:w-20 sm:h-32 border border-white/10 rounded-lg flex items-center justify-center opacity-50">
            <Swords className="w-8 h-8 text-white/50" />
          </div>
        </div>
      );
    }

    return (
      <motion.div 
        whileHover={onClick ? { y: -10, scale: 1.05 } : {}}
        onClick={onClick}
        className={`w-20 h-28 sm:w-24 sm:h-36 rounded-xl bg-white shadow-xl flex flex-col justify-between p-2 ${onClick ? 'cursor-pointer' : ''} ${card.isManilha ? 'ring-4 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 'border border-gray-200'}`}
      >
        <div className={`text-lg sm:text-xl font-bold ${SUIT_COLORS[card.suit]}`}>
          {card.rank}
        </div>
        <div className={`text-3xl sm:text-4xl self-center ${SUIT_COLORS[card.suit]}`}>
          {SUIT_SYMBOLS[card.suit]}
        </div>
        <div className={`text-lg sm:text-xl font-bold self-end rotate-180 ${SUIT_COLORS[card.suit]}`}>
          {card.rank}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
      {/* Header */}
      <header className="p-4 sm:p-6 flex items-center justify-between glass-panel border-b border-white/10 z-10">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="font-bold">Valendo: {currentHandValue}</span>
          </div>
        </div>
      </header>

      {/* Game Area */}
      <main className="flex-1 relative flex flex-col items-center justify-between p-4 sm:p-8 overflow-hidden">
        
        {/* Scoreboard */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-10">
          <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col items-center min-w-[100px]">
            <User className="w-6 h-6 text-purple-400 mb-2" />
            <span className="text-sm text-gray-400">Você</span>
            <span className="text-3xl font-display font-bold">{playerScore}</span>
          </div>
          
          <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col items-center min-w-[100px]">
            <Bot className="w-6 h-6 text-cyan-400 mb-2" />
            <span className="text-sm text-gray-400">IA</span>
            <span className="text-3xl font-display font-bold">{aiScore}</span>
          </div>
        </div>

        {/* AI Hand */}
        <div className="flex gap-2 sm:gap-4 mt-16">
          {aiHand.map((c, i) => (
            <motion.div key={c.id} initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}>
              {renderCard(c, true)}
            </motion.div>
          ))}
        </div>

        {/* Table Area */}
        <div className="flex-1 w-full max-w-2xl flex flex-col items-center justify-center relative my-8">
          
          {/* Round indicators */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className={`w-4 h-4 rounded-full border border-white/30 ${
                roundWins[i] === 1 ? 'bg-purple-500' : 
                roundWins[i] === 2 ? 'bg-cyan-500' : 
                roundWins[i] === 0 ? 'bg-gray-500' : 'bg-transparent'
              }`} />
            ))}
          </div>

          {/* Vira Card */}
          {vira && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
              <span className="text-xs text-gray-400 mb-2 font-bold uppercase tracking-widest">Vira</span>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                {renderCard(vira)}
              </motion.div>
            </div>
          )}

          {/* Played Cards */}
          <div className="flex gap-8 sm:gap-16 items-center justify-center h-40">
            <AnimatePresence>
              {tableCards.ai && (
                <motion.div 
                  initial={{ y: -50, opacity: 0, rotate: -10 }} 
                  animate={{ y: 0, opacity: 1, rotate: -5 }} 
                  exit={{ scale: 0, opacity: 0 }}
                  className="z-10"
                >
                  {renderCard(tableCards.ai)}
                </motion.div>
              )}
              {tableCards.player && (
                <motion.div 
                  initial={{ y: 50, opacity: 0, rotate: 10 }} 
                  animate={{ y: 0, opacity: 1, rotate: 5 }} 
                  exit={{ scale: 0, opacity: 0 }}
                  className="z-20"
                >
                  {renderCard(tableCards.player)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Message Box */}
          <div className="absolute bottom-0 bg-black/50 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 text-center max-w-md w-full">
            <p className="font-medium text-lg">{message}</p>
          </div>
        </div>

        {/* Player Controls & Hand */}
        <div className="flex flex-col items-center gap-6 w-full max-w-md">
          
          {/* Action Buttons */}
          <div className="flex gap-4 w-full justify-center">
            <button 
              onClick={askTruco}
              disabled={turn !== 1 || gameOver || trucoState.active || currentHandValue >= 12}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold rounded-xl transition-colors shadow-lg flex-1 cursor-pointer"
            >
              {currentHandValue === 1 ? 'TRUCO!' : currentHandValue === 3 ? 'SEIS!' : currentHandValue === 6 ? 'NOVE!' : 'DOZE!'}
            </button>
          </div>

          {/* Player Hand */}
          <div className="flex gap-2 sm:gap-4">
            {playerHand.map((c, i) => (
              <motion.div key={c.id} initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}>
                {renderCard(c, false, () => playCard(c))}
              </motion.div>
            ))}
          </div>
        </div>

      </main>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#111] border border-white/10 p-8 rounded-3xl max-w-md w-full text-center relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 right-0 h-2 ${playerScore >= 12 ? 'bg-purple-500' : 'bg-red-500'}`}></div>
              
              <Trophy className={`w-20 h-20 mx-auto mb-6 ${playerScore >= 12 ? 'text-yellow-400' : 'text-gray-600'}`} />
              
              <h2 className="text-4xl font-display font-bold mb-2">
                {playerScore >= 12 ? 'VITÓRIA!' : 'DERROTA'}
              </h2>
              
              <p className="text-gray-400 mb-8 text-lg">
                {playerScore >= 12 ? 'Você venceu a partida de Truco!' : 'A IA levou a melhor desta vez.'}
              </p>
              
              <div className="flex justify-center gap-8 mb-8">
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-1">Você</div>
                  <div className="text-4xl font-bold text-purple-400">{playerScore}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-1">IA</div>
                  <div className="text-4xl font-bold text-cyan-400">{aiScore}</div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={onBack}
                  className="flex-1 py-4 glass-panel hover:bg-white/10 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Sair
                </button>
                <button 
                  onClick={() => {
                    setPlayerScore(0);
                    setAiScore(0);
                    setGameOver(false);
                    startHand();
                  }}
                  className="flex-1 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-colors shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5" />
                  Jogar Novamente
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
