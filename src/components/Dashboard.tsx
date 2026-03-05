import { useState } from 'react';
import { motion } from 'motion/react';
import { Canvas } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import { DashboardTopbar } from './DashboardTopbar';
import { DashboardHero } from './DashboardHero';
import { GameCarousel } from './GameCarousel';
import { UserStats } from './UserStats';
import { TicTacToe } from './TicTacToe';

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  if (activeGame === 'tictactoe') {
    return <TicTacToe onBack={() => setActiveGame(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden relative font-sans">
      {/* 3D Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#06b6d4" />
          <pointLight position={[-10, -10, -10]} intensity={1} color="#a855f7" />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            autoRotate 
            autoRotateSpeed={0.2} 
            maxPolarAngle={Math.PI / 2} 
            minPolarAngle={Math.PI / 2} 
          />
        </Canvas>
      </div>

      {/* Content */}
      <div className="relative z-10 h-screen overflow-y-auto scrollbar-hide">
        <DashboardTopbar onLogout={onLogout} />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 space-y-24">
          <DashboardHero onPlay={() => setActiveGame('tictactoe')} />
          <GameCarousel onSelectGame={(id) => setActiveGame('tictactoe')} />
          <UserStats />
        </main>
      </div>
    </div>
  );
}