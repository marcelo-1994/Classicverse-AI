import { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { ChevronLeft, Trophy, RotateCcw, Volume2, VolumeX, Maximize, Coins, Play } from 'lucide-react';
import { audio } from '../services/audioService';

type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number;
  isHidden?: boolean;
}

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const getCardValue = (rank: Rank): number => {
  if (['J', 'Q', 'K'].includes(rank)) return 10;
  if (rank === 'A') return 11;
  return parseInt(rank);
};

const SUIT_SYMBOLS: Record<Suit, string> = {
  'hearts': '♥', 'diamonds': '♦', 'clubs': '♣', 'spades': '♠'
};

const SUIT_COLORS: Record<Suit, string> = {
  'hearts': '#ef4444', 'diamonds': '#ef4444', 'clubs': '#111827', 'spades': '#111827'
};

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${rank}-${suit}-${Math.random()}`,
        suit,
        rank,
        value: getCardValue(rank)
      });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const calculateScore = (hand: Card[]): number => {
  let score = 0;
  let aces = 0;
  for (const card of hand) {
    if (card.isHidden) continue;
    score += card.value;
    if (card.rank === 'A') aces += 1;
  }
  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }
  return score;
};

// --- 3D Components ---

function Card3D({ 
  card, 
  position, 
  rotation, 
}: { 
  card: Card, 
  position: [number, number, number], 
  rotation?: [number, number, number],
}) {
  return (
    <group position={new THREE.Vector3(...position)} rotation={rotation ? new THREE.Euler(...rotation) : new THREE.Euler(0, 0, 0)}>
      <RoundedBox args={[1.5, 2.2, 0.05]} radius={0.05} smoothness={4} castShadow>
        <meshStandardMaterial color={card.isHidden ? "#1e3a8a" : "white"} roughness={0.2} metalness={0.1} />
      </RoundedBox>

      {!card.isHidden && (
        <>
          <Text
            position={[-0.5, 0.8, 0.03]}
            fontSize={0.3}
            color={SUIT_COLORS[card.suit]}
            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
          >
            {card.rank}
          </Text>
          <Text
            position={[0.5, -0.8, 0.03]}
            fontSize={0.3}
            color={SUIT_COLORS[card.suit]}
            rotation={[0, 0, Math.PI]}
            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
          >
            {card.rank}
          </Text>
          <Text
            position={[0, 0, 0.03]}
            fontSize={0.8}
            color={SUIT_COLORS[card.suit]}
          >
            {SUIT_SYMBOLS[card.suit]}
          </Text>
        </>
      )}

      {card.isHidden && (
        <Text
          position={[0, 0, 0.03]}
          fontSize={0.5}
          color="white"
        >
          ?
        </Text>
      )}
    </group>
  );
}

function Table3D() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]} receiveShadow>
        <cylinderGeometry args={[10, 10, 0.2, 64]} />
        <meshStandardMaterial color="#065f46" roughness={0.8} metalness={0.2} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.3, 0]}>
        <cylinderGeometry args={[10.2, 10.2, 0.4, 64]} />
        <meshStandardMaterial color="#022c22" roughness={0.5} metalness={0.5} />
      </mesh>
      
      {/* Table markings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.09, 2]}>
        <ringGeometry args={[3, 3.1, 32]} />
        <meshBasicMaterial color="#34d399" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

interface BlackjackProps {
  onBack: () => void;
}

export function Blackjack({ onBack }: BlackjackProps) {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'dealerTurn' | 'gameOver'>('betting');
  const [message, setMessage] = useState('Faça sua aposta!');
  const [chips, setChips] = useState(1000);
  const [currentBet, setCurrentBet] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(audio.isSoundEnabled());

  const toggleSound = () => setSoundEnabled(audio.toggleSound());

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const placeBet = (amount: number) => {
    if (chips >= amount) {
      setChips(prev => prev - amount);
      setCurrentBet(prev => prev + amount);
      audio.playClick();
    }
  };

  const clearBet = () => {
    setChips(prev => prev + currentBet);
    setCurrentBet(0);
    audio.playClick();
  };

  const dealCards = useCallback(() => {
    if (currentBet === 0) {
      setMessage('Aposte algo primeiro!');
      return;
    }
    
    let currentDeck = deck.length < 15 ? createDeck() : [...deck];
    
    const pHand = [currentDeck.pop()!, currentDeck.pop()!];
    const dHand = [currentDeck.pop()!, { ...currentDeck.pop()!, isHidden: true }];
    
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setDeck(currentDeck);
    setGameState('playing');
    setMessage('Sua vez!');
    audio.playMove();

    if (calculateScore(pHand) === 21) {
      handleGameOver(pHand, dHand, 'blackjack');
    }
  }, [currentBet, deck]);

  const hit = () => {
    if (gameState !== 'playing') return;
    const currentDeck = [...deck];
    const newCard = currentDeck.pop()!;
    const newHand = [...playerHand, newCard];
    
    setPlayerHand(newHand);
    setDeck(currentDeck);
    audio.playMove();

    if (calculateScore(newHand) > 21) {
      handleGameOver(newHand, dealerHand, 'bust');
    }
  };

  const stand = () => {
    if (gameState !== 'playing') return;
    setGameState('dealerTurn');
    audio.playClick();
  };

  useEffect(() => {
    if (gameState === 'dealerTurn') {
      const playDealer = async () => {
        let currentDeck = [...deck];
        let dHand = [...dealerHand];
        
        // Reveal hidden card
        dHand[1].isHidden = false;
        setDealerHand([...dHand]);
        audio.playMove();
        
        await new Promise(r => setTimeout(r, 1000));

        while (calculateScore(dHand) < 17) {
          const newCard = currentDeck.pop()!;
          dHand = [...dHand, newCard];
          setDealerHand([...dHand]);
          audio.playMove();
          await new Promise(r => setTimeout(r, 1000));
        }

        setDeck(currentDeck);
        handleGameOver(playerHand, dHand, 'compare');
      };
      playDealer();
    }
  }, [gameState]);

  const handleGameOver = (pHand: Card[], dHand: Card[], reason: string) => {
    setGameState('gameOver');
    const pScore = calculateScore(pHand);
    const dScore = calculateScore(dHand);

    if (reason === 'bust') {
      setMessage('Estourou! Você perdeu.');
      audio.playLose();
    } else if (reason === 'blackjack') {
      setMessage('BLACKJACK! Você ganhou 2.5x!');
      setChips(prev => prev + currentBet * 2.5);
      audio.playWin();
    } else {
      if (dScore > 21) {
        setMessage('Dealer estourou! Você venceu!');
        setChips(prev => prev + currentBet * 2);
        audio.playWin();
      } else if (pScore > dScore) {
        setMessage('Você venceu!');
        setChips(prev => prev + currentBet * 2);
        audio.playWin();
      } else if (dScore > pScore) {
        setMessage('Dealer venceu!');
        audio.playLose();
      } else {
        setMessage('Empate! Aposta devolvida.');
        setChips(prev => prev + currentBet);
      }
    }
  };

  const resetGame = () => {
    setPlayerHand([]);
    setDealerHand([]);
    setCurrentBet(0);
    setGameState('betting');
    setMessage('Faça sua aposta!');
  };

  return (
    <div className="absolute inset-0 z-[60] bg-[#050505] flex flex-col items-center justify-center overflow-hidden">
      {/* Topbar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md z-20">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 rounded-full glass-panel hover:bg-white/10 transition-colors cursor-pointer">
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium hidden sm:block">Sair</span>
        </button>
        <div className="flex items-center gap-3">
          <Coins className="w-6 h-6 text-yellow-400" />
          <h1 className="font-display text-xl font-bold tracking-wider">BLACKJACK 3D</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleFullscreen} className="p-2 rounded-full glass-panel hover:bg-white/10 transition-colors cursor-pointer">
            <Maximize className="w-5 h-5" />
          </button>
          <button onClick={toggleSound} className="p-2 rounded-full glass-panel hover:bg-white/10 transition-colors cursor-pointer">
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <span className="font-bold text-yellow-400">${chips}</span>
          </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="w-full flex-1 flex items-center justify-center p-2 relative z-10">
        <div className="w-full h-full max-h-[80vh] bg-[#2d1b0e] rounded-lg shadow-2xl border-4 border-[#3d2b1e] overflow-hidden">
          <Canvas shadows dpr={[1, 2]}>
            <Suspense fallback={null}>
              <PerspectiveCamera makeDefault position={[0, 8, 10]} fov={45} />
              <OrbitControls enablePan={false} minPolarAngle={0} maxPolarAngle={Math.PI / 2.5} minDistance={8} maxDistance={15} />
              <ambientLight intensity={0.4} />
              <pointLight position={[10, 10, 10]} intensity={1} castShadow />
              <Environment preset="night" />
              
              <Table3D />
              
              {/* Dealer Hand */}
              {dealerHand.map((c, i) => (
                <Card3D 
                  key={c.id} 
                  card={c} 
                  position={[(i - (dealerHand.length - 1) / 2) * 1.6, 0.1, -2]} 
                  rotation={[-Math.PI / 2, 0, 0]} 
                />
              ))}

              {/* Player Hand */}
              {playerHand.map((c, i) => (
                <Card3D 
                  key={c.id} 
                  card={c} 
                  position={[(i - (playerHand.length - 1) / 2) * 1.6, 0.1, 2]} 
                  rotation={[-Math.PI / 2, 0, 0]} 
                />
              ))}

              <ContactShadows position={[0, -1.1, 0]} opacity={0.4} scale={20} blur={2} far={10} />
            </Suspense>
          </Canvas>
        </div>
      </div>

      {/* Message Box */}
      <div className="absolute top-24 bg-black/60 backdrop-blur-md px-8 py-4 rounded-full border border-white/10 text-center max-w-md w-full z-20">
        <p className="font-medium text-xl text-white">{message}</p>
      </div>

      {/* HUD & Controls */}
      <div className="absolute bottom-6 w-full max-w-2xl px-6 z-20 flex flex-col items-center gap-4">
        
        {gameState === 'betting' && (
          <div className="glass-panel p-6 rounded-3xl border border-white/10 w-full flex flex-col items-center gap-4">
            <div className="text-2xl font-bold text-yellow-400 mb-2">Aposta Atual: ${currentBet}</div>
            <div className="flex gap-4">
              {[10, 50, 100, 500].map(amount => (
                <button 
                  key={amount}
                  onClick={() => placeBet(amount)}
                  disabled={chips < amount}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-black font-bold text-lg shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 cursor-pointer border-4 border-yellow-200"
                >
                  ${amount}
                </button>
              ))}
            </div>
            <div className="flex gap-4 w-full mt-4">
              <button 
                onClick={clearBet}
                disabled={currentBet === 0}
                className="flex-1 py-3 rounded-xl glass-panel hover:bg-white/10 transition-colors font-bold disabled:opacity-50 cursor-pointer"
              >
                Limpar
              </button>
              <button 
                onClick={dealCards}
                disabled={currentBet === 0}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors font-bold disabled:opacity-50 shadow-[0_0_20px_rgba(5,150,105,0.4)] cursor-pointer"
              >
                Distribuir Cartas
              </button>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="flex gap-4 w-full">
            <button 
              onClick={hit}
              className="flex-1 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xl shadow-[0_0_20px_rgba(5,150,105,0.4)] transition-all transform active:scale-95 cursor-pointer"
            >
              Comprar (Hit)
            </button>
            <button 
              onClick={stand}
              className="flex-1 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all transform active:scale-95 cursor-pointer"
            >
              Parar (Stand)
            </button>
          </div>
        )}

        {gameState === 'gameOver' && (
          <button 
            onClick={resetGame}
            className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xl shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-6 h-6" /> Nova Rodada
          </button>
        )}
      </div>
    </div>
  );
}
