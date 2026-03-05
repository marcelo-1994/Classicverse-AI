import { useState } from 'react';
import { motion } from 'motion/react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, ContactShadows, Environment } from '@react-three/drei';
import { ArrowLeft, ShoppingBag, Sparkles, Check, Lock, Coins, Shield } from 'lucide-react';

interface AvatarStoreProps {
  onBack: () => void;
}

// Tipos de itens da loja
type ItemRarity = 'Comum' | 'Raro' | 'Épico' | 'Lendário';

interface StoreItem {
  id: string;
  name: string;
  price: number;
  rarity: ItemRarity;
  color: string;
  wireframe?: boolean;
  owned: boolean;
}

const INITIAL_ITEMS: StoreItem[] = [
  { id: 'skin_1', name: 'Cyber Neon', price: 0, rarity: 'Comum', color: '#06b6d4', owned: true }, // Default
  { id: 'skin_2', name: 'Magma Core', price: 500, rarity: 'Raro', color: '#ef4444', owned: false },
  { id: 'skin_3', name: 'Toxic Glitch', price: 800, rarity: 'Épico', color: '#10b981', wireframe: true, owned: false },
  { id: 'skin_4', name: 'Dark Matter', price: 1500, rarity: 'Lendário', color: '#a855f7', owned: false },
  { id: 'skin_5', name: 'Golden Era', price: 2500, rarity: 'Lendário', color: '#eab308', owned: false },
];

// Componente 3D do Avatar (Simulado com formas geométricas para o preview)
function AvatarPreview({ color, wireframe }: { color: string; wireframe?: boolean }) {
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <octahedronGeometry args={[1.5, 0]} />
        <meshStandardMaterial 
          color={color} 
          wireframe={wireframe} 
          emissive={color}
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      {/* Core interno brilhante */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </Float>
  );
}

export function AvatarStore({ onBack }: AvatarStoreProps) {
  const [items, setItems] = useState<StoreItem[]>(INITIAL_ITEMS);
  const [equippedId, setEquippedId] = useState<string>('skin_1');
  const [selectedId, setSelectedId] = useState<string>('skin_1');
  const [coins, setCoins] = useState(1500); // Saldo simulado do AjudaAí
  const [isPurchasing, setIsPurchasing] = useState(false);

  const selectedItem = items.find(i => i.id === selectedId)!;

  const handlePurchase = () => {
    if (selectedItem.owned) {
      setEquippedId(selectedItem.id);
      return;
    }

    if (coins >= selectedItem.price) {
      setIsPurchasing(true);
      // Simula o delay da API do AjudaAí
      setTimeout(() => {
        setCoins(prev => prev - selectedItem.price);
        setItems(prev => prev.map(item => 
          item.id === selectedItem.id ? { ...item, owned: true } : item
        ));
        setEquippedId(selectedItem.id);
        setIsPurchasing(false);
      }, 800);
    }
  };

  const getRarityColor = (rarity: ItemRarity) => {
    switch (rarity) {
      case 'Comum': return 'text-gray-400 border-gray-400/30 bg-gray-400/10';
      case 'Raro': return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
      case 'Épico': return 'text-purple-400 border-purple-400/30 bg-purple-400/10';
      case 'Lendário': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
    }
  };

  return (
    <div className="absolute inset-0 z-[60] bg-[#050505] flex flex-col lg:flex-row overflow-hidden">
      
      {/* Left Side: 3D Preview */}
      <div className="w-full lg:w-1/2 h-[40vh] lg:h-full relative bg-gradient-to-br from-purple-900/20 to-cyan-900/20">
        <div className="absolute top-6 left-6 z-10">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar</span>
          </button>
        </div>

        <div className="absolute top-6 right-6 z-10 lg:hidden">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-orange-500/30 bg-orange-500/10 text-orange-400 font-bold">
            <Coins className="w-5 h-5" />
            {coins}
          </div>
        </div>

        <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
          <Environment preset="city" />
          <AvatarPreview color={selectedItem.color} wireframe={selectedItem.wireframe} />
          <ContactShadows position={[0, -2, 0]} opacity={0.5} scale={10} blur={2} far={4} />
          <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1} />
        </Canvas>

        {/* Info Overlay */}
        <div className="absolute bottom-6 left-6 right-6 z-10 text-center pointer-events-none">
          <motion.div
            key={selectedItem.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block glass-panel px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-md"
          >
            <h2 className="text-2xl font-display font-bold text-white mb-1">{selectedItem.name}</h2>
            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${getRarityColor(selectedItem.rarity)}`}>
              {selectedItem.rarity}
            </span>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Store UI */}
      <div className="w-full lg:w-1/2 h-[60vh] lg:h-full flex flex-col bg-[#0a0a0a] border-l border-white/5">
        
        {/* Store Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-white">Loja AjudaAí</h1>
              <p className="text-xs text-gray-400">Skins & Cosméticos</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-orange-500/30 bg-orange-500/10 text-orange-400 font-bold shadow-[0_0_15px_rgba(249,115,22,0.15)]">
            <Coins className="w-5 h-5" />
            {coins} Moedas
          </div>
        </div>

        {/* Item Grid */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="grid grid-cols-2 gap-4">
            {items.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedId(item.id)}
                className={`relative p-4 rounded-2xl border text-left transition-all cursor-pointer overflow-hidden ${
                  selectedId === item.id 
                    ? 'border-white/50 bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
                    : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                {/* Rarity Glow */}
                <div className={`absolute -right-10 -top-10 w-24 h-24 rounded-full blur-2xl opacity-20 ${getRarityColor(item.rarity).split(' ')[2]}`}></div>
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div 
                    className="w-12 h-12 rounded-xl border border-white/20 shadow-inner flex items-center justify-center"
                    style={{ backgroundColor: item.color + '40' }} // 40 is hex for 25% opacity
                  >
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}` }}></div>
                  </div>
                  {item.owned ? (
                    <div className="bg-emerald-500/20 text-emerald-400 p-1.5 rounded-lg">
                      <Check className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-bold">
                      <Coins className="w-3 h-3" />
                      {item.price}
                    </div>
                  )}
                </div>

                <div className="relative z-10">
                  <h3 className="font-bold text-white text-sm mb-1">{item.name}</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${getRarityColor(item.rarity).split(' ')[0]}`}>
                    {item.rarity}
                  </span>
                </div>

                {equippedId === item.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500"></div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Purchase Action Area */}
        <div className="p-6 border-t border-white/5 bg-[#0a0a0a]/90 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-400">Item Selecionado</p>
              <p className="font-bold text-lg">{selectedItem.name}</p>
            </div>
            <div className="text-right">
              {selectedItem.owned ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" /> Adquirido
                </span>
              ) : (
                <div className="flex items-center gap-2 text-orange-400 font-bold text-xl">
                  <Coins className="w-5 h-5" />
                  {selectedItem.price}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handlePurchase}
            disabled={isPurchasing || (!selectedItem.owned && coins < selectedItem.price)}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              selectedItem.owned
                ? equippedId === selectedItem.id
                  ? 'bg-white/10 text-gray-400 cursor-default'
                  : 'bg-white text-black hover:bg-gray-200'
                : coins >= selectedItem.price
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30 cursor-not-allowed'
            }`}
          >
            {isPurchasing ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <Sparkles className="w-5 h-5" />
              </motion.div>
            ) : selectedItem.owned ? (
              equippedId === selectedItem.id ? 'Equipado' : 'Equipar Skin'
            ) : coins >= selectedItem.price ? (
              <>Comprar com AjudaAí <Coins className="w-4 h-4" /></>
            ) : (
              <>Moedas Insuficientes <Lock className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
