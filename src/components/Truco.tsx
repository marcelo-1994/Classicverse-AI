import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Float, Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { ChevronLeft, Trophy, Swords, RotateCcw, User, Bot, Volume2, VolumeX, Maximize } from 'lucide-react';
import { audio } from '../services/audioService';

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
  'ouros': '#ef4444', 'espadas': '#111827', 'copas': '#ef4444', 'paus': '#111827'
};

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

// --- 3D Components ---

function Card3D({ 
  card, 
  position, 
  rotation, 
  hidden = false, 
  onClick,
  isManilha = false
}: { 
  card: Card, 
  position: [number, number, number], 
  rotation?: [number, number, number],
  hidden?: boolean,
  onClick?: () => void,
  isManilha?: boolean
}) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.lerp(new THREE.Vector3(...position), 0.1);
      if (rotation) {
        meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, rotation[0], 0.1);
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, rotation[1], 0.1);
        meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, rotation[2], 0.1);
      }
      meshRef.current.scale.lerp(new THREE.Vector3(hovered ? 1.05 : 1, hovered ? 1.05 : 1, 1), 0.1);
    }
  });

  return (
    <group 
      ref={meshRef} 
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onPointerOver={() => onClick && setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <RoundedBox args={[1.5, 2.2, 0.05]} radius={0.05} smoothness={4} castShadow>
        <meshStandardMaterial color={hidden ? "#4c1d95" : "white"} roughness={0.2} metalness={0.1} />
      </RoundedBox>

      {!hidden && (
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

      {hidden && (
        <Text
          position={[0, 0, 0.03]}
          fontSize={0.5}
          color="white"
        >
          ?
        </Text>
      )}

      {isManilha && (
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[1.7, 2.4]} />
          <meshBasicMaterial color="#facc15" transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}

function Table3D() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]} receiveShadow>
        <cylinderGeometry args={[8, 8, 0.2, 32]} />
        <meshStandardMaterial color="#064e3b" roughness={0.8} metalness={0.2} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.3, 0]}>
        <cylinderGeometry args={[8.2, 8.2, 0.4, 32]} />
        <meshStandardMaterial color="#1a2e05" roughness={0.5} metalness={0.5} />
      </mesh>
    </group>
  );
}

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
  
  const [roundWins, setRoundWins] = useState<(1 | 2 | 0)[]>([]);
  const [currentHandValue, setCurrentHandValue] = useState(1);
  const [turn, setTurn] = useState<1 | 2>(1);
  
  const [tableCards, setTableCards] = useState<{player: Card | null, ai: Card | null}>({ player: null, ai: null });
  const [message, setMessage] = useState('Sua vez de jogar!');
  const [gameOver, setGameOver] = useState(false);
  const [trucoState, setTrucoState] = useState<{ active: boolean, askedBy: 1 | 2 | null, level: number }>({ active: false, askedBy: null, level: 1 });
  const [soundEnabled, setSoundEnabled] = useState(audio.isSoundEnabled());

  const startHand = useCallback(() => {
    let newDeck = createDeck();
    const pHand = newDeck.splice(0, 3);
    const aHand = newDeck.splice(0, 3);
    const vCard = newDeck.splice(0, 1)[0];
    const manilhaRank = getNextRank(vCard.rank);
    
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

    const newRoundWins = [...roundWins, winner as 1 | 2 | 0];
    setRoundWins(newRoundWins);

    let handWinner: 1 | 2 | 0 | null = null;
    const pWins = newRoundWins.filter(w => w === 1).length;
    const aWins = newRoundWins.filter(w => w === 2).length;
    const draws = newRoundWins.filter(w => w === 0).length;

    if (pWins === 2) handWinner = 1;
    else if (aWins === 2) handWinner = 2;
    else if (newRoundWins.length === 3) {
      if (pWins > aWins) handWinner = 1;
      else if (aWins > pWins) handWinner = 2;
      else handWinner = newRoundWins[0] === 0 ? 0 : newRoundWins[0] as 1 | 2 | 0;
    } else if (draws === 1 && newRoundWins.length === 2) {
      if (pWins === 1) handWinner = 1;
      else if (aWins === 1) handWinner = 2;
    } else if (draws === 3) {
       handWinner = 0;
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
          setMessage(`Você venceu a mão! +${currentHandValue}`);
          audio.playWin();
        } else if (handWinner === 2) {
          setAiScore(s => {
            const newScore = s + currentHandValue;
            if (newScore >= 12) setGameOver(true);
            return newScore;
          });
          setMessage(`IA venceu a mão! +${currentHandValue}`);
          audio.playLose();
        } else {
          setMessage('Mão empatada!');
        }
        setTimeout(() => { if (!gameOver) startHand(); }, 3000);
      } else {
        const nextTurn = winner === 0 ? turn : winner;
        setTurn(nextTurn);
        setMessage(nextTurn === 1 ? 'Sua vez!' : 'Vez da IA...');
      }
    }, 2000);
  }, [tableCards, roundWins, currentHandValue, turn, gameOver, startHand]);

  useEffect(() => {
    if (turn === 2 && !gameOver && !trucoState.active) {
      const timer = setTimeout(() => {
        if (aiHand.length === 0) return;
        let cardToPlay = aiHand[0];
        if (tableCards.player) {
          const pValue = tableCards.player.isManilha ? tableCards.player.manilhaValue : tableCards.player.baseValue;
          const winningCards = aiHand.filter(c => (c.isManilha ? c.manilhaValue : c.baseValue) > pValue);
          if (winningCards.length > 0) {
            winningCards.sort((a, b) => (a.isManilha ? a.manilhaValue : a.baseValue) - (b.isManilha ? b.manilhaValue : b.baseValue));
            cardToPlay = winningCards[0];
          } else {
            const sortedHand = [...aiHand].sort((a, b) => (a.isManilha ? a.manilhaValue : a.baseValue) - (b.isManilha ? b.manilhaValue : b.baseValue));
            cardToPlay = sortedHand[0];
          }
        } else {
          const sortedHand = [...aiHand].sort((a, b) => (b.isManilha ? b.manilhaValue : b.baseValue) - (a.isManilha ? a.manilhaValue : a.baseValue));
          cardToPlay = sortedHand[0];
        }
        setAiHand(prev => prev.filter(c => c.id !== cardToPlay.id));
        setTableCards(prev => ({ ...prev, ai: cardToPlay }));
        setTurn(1);
        audio.playMove();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [turn, aiHand, tableCards.player, gameOver, trucoState.active]);

  useEffect(() => {
    if (tableCards.player && tableCards.ai) {
      evaluateRound();
    }
  }, [tableCards, evaluateRound]);

  const playCard = (card: Card) => {
    if (turn !== 1 || tableCards.player || gameOver || trucoState.active) return;
    setPlayerHand(prev => prev.filter(c => c.id !== card.id));
    setTableCards(prev => ({ ...prev, player: card }));
    setTurn(2);
    audio.playMove();
  };

  const askTruco = () => {
    if (turn !== 1 || gameOver || trucoState.active) return;
    const nextLevel = currentHandValue === 1 ? 3 : currentHandValue + 3;
    if (nextLevel > 12) return;
    setTrucoState({ active: true, askedBy: 1, level: nextLevel });
    setMessage(`TRUCO (${nextLevel})!`);
    audio.playPowerUp();
    setTimeout(() => {
      const handStrength = aiHand.reduce((acc, c) => acc + (c.isManilha ? c.manilhaValue : c.baseValue), 0);
      const threshold = nextLevel === 3 ? 15 : nextLevel === 6 ? 20 : 25;
      const accept = handStrength > threshold || Math.random() > 0.5;
      if (accept) {
        setCurrentHandValue(nextLevel);
        setTrucoState({ active: false, askedBy: null, level: nextLevel });
        setMessage(`IA ACEITOU! Valendo ${nextLevel}.`);
      } else {
        setPlayerScore(s => {
          const newScore = s + currentHandValue;
          if (newScore >= 12) setGameOver(true);
          return newScore;
        });
        setMessage(`IA FUGIU! +${currentHandValue}`);
        setTimeout(() => { if (!gameOver) startHand(); }, 3000);
      }
    }, 2000);
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

  return (
    <div className="absolute inset-0 z-[60] bg-[#050505] flex flex-col items-center justify-center overflow-hidden">
      {/* Topbar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md z-20">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 rounded-full glass-panel hover:bg-white/10 transition-colors cursor-pointer">
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium hidden sm:block">Sair</span>
        </button>
        <div className="flex items-center gap-3">
          <Swords className="w-6 h-6 text-purple-400" />
          <h1 className="font-display text-xl font-bold tracking-wider">TRUCO 3D</h1>
        </div>
        <div className="flex items-center gap-4">
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
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="font-bold">Valendo: {currentHandValue}</span>
          </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="w-full flex-1 relative z-10">
        <Canvas shadows dpr={[1, 2]}>
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[0, 8, 10]} fov={45} />
            <OrbitControls enablePan={false} minPolarAngle={0} maxPolarAngle={Math.PI / 2.5} minDistance={8} maxDistance={15} />
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={1} castShadow />
            <Environment preset="night" />
            
            <Table3D />
            
            {/* Vira */}
            {vira && (
              <Card3D card={vira} position={[3, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} isManilha />
            )}

            {/* AI Hand */}
            {aiHand.map((c, i) => (
              <Card3D key={c.id} card={c} position={[(i - 1) * 2, 4, -4]} rotation={[Math.PI / 4, 0, 0]} hidden />
            ))}

            {/* Player Hand */}
            {playerHand.map((c, i) => (
              <Card3D 
                key={c.id} 
                card={c} 
                position={[(i - 1) * 2, 1, 4]} 
                rotation={[-Math.PI / 6, 0, 0]} 
                onClick={() => playCard(c)}
                isManilha={c.isManilha}
              />
            ))}

            {/* Table Played Cards */}
            {tableCards.ai && (
              <Card3D card={tableCards.ai} position={[0, 0.1, -1]} rotation={[-Math.PI / 2, 0, Math.random() * 0.2]} />
            )}
            {tableCards.player && (
              <Card3D card={tableCards.player} position={[0, 0.1, 1]} rotation={[-Math.PI / 2, 0, -Math.random() * 0.2]} />
            )}

            <ContactShadows position={[0, -1.1, 0]} opacity={0.4} scale={20} blur={2} far={10} />
          </Suspense>
        </Canvas>
      </div>

      {/* HUD Overlay */}
      <div className="absolute top-24 left-4 right-4 flex justify-between items-start pointer-events-none z-20">
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

      {/* Round Wins Indicators */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20">
        {[0, 1, 2].map(i => (
          <div key={i} className={`w-5 h-5 rounded-full border-2 border-white/20 shadow-lg ${
            roundWins[i] === 1 ? 'bg-purple-500 shadow-purple-500/50' : 
            roundWins[i] === 2 ? 'bg-cyan-500 shadow-cyan-500/50' : 
            roundWins[i] === 0 ? 'bg-gray-500' : 'bg-transparent'
          }`} />
        ))}
      </div>

      {/* Message Box */}
      <div className="absolute bottom-32 bg-black/60 backdrop-blur-md px-8 py-4 rounded-full border border-white/10 text-center max-w-md w-full z-20">
        <p className="font-medium text-xl text-white">{message}</p>
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-10 flex gap-4 w-full max-w-md px-6 z-20">
        <button 
          onClick={askTruco}
          disabled={turn !== 1 || gameOver || trucoState.active || currentHandValue >= 12}
          className="flex-1 py-4 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold rounded-2xl transition-all shadow-lg cursor-pointer transform active:scale-95"
        >
          {currentHandValue === 1 ? 'TRUCO!' : currentHandValue === 3 ? 'SEIS!' : currentHandValue === 6 ? 'NOVE!' : 'DOZE!'}
        </button>
      </div>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameOver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#111] border border-white/10 p-10 rounded-[2rem] max-w-md w-full text-center relative overflow-hidden shadow-2xl">
              <div className={`absolute top-0 left-0 right-0 h-2 ${playerScore >= 12 ? 'bg-purple-500' : 'bg-red-500'}`}></div>
              <Trophy className={`w-24 h-24 mx-auto mb-6 ${playerScore >= 12 ? 'text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]' : 'text-gray-600'}`} />
              <h2 className="text-5xl font-display font-bold mb-2 tracking-tighter">{playerScore >= 12 ? 'VITÓRIA!' : 'DERROTA'}</h2>
              <p className="text-gray-400 mb-8 text-lg">{playerScore >= 12 ? 'Você dominou a mesa!' : 'A IA foi mais astuta desta vez.'}</p>
              <div className="flex justify-center gap-12 mb-10">
                <div className="text-center">
                  <div className="text-sm text-gray-500 uppercase tracking-widest mb-1">Você</div>
                  <div className="text-5xl font-bold text-purple-400">{playerScore}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500 uppercase tracking-widest mb-1">IA</div>
                  <div className="text-5xl font-bold text-cyan-400">{aiScore}</div>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={onBack} className="flex-1 py-4 glass-panel hover:bg-white/10 rounded-2xl font-bold transition-all cursor-pointer">Sair</button>
                <button onClick={() => { setPlayerScore(0); setAiScore(0); setGameOver(false); startHand(); }} className="flex-1 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold transition-all shadow-[0_0_30px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2 cursor-pointer">
                  <RotateCcw className="w-5 h-5" /> Reiniciar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
