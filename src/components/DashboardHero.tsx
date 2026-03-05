import { motion } from 'motion/react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, Sphere, MeshDistortMaterial } from '@react-three/drei';
import { Play, Trophy, Star, Zap } from 'lucide-react';

function Avatar3D() {
  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
      <Sphere args={[1.5, 64, 64]}>
        <MeshDistortMaterial
          color="#a855f7"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
      <mesh position={[0, 0, 1.5]}>
        <boxGeometry args={[0.5, 0.2, 0.2]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={2} />
      </mesh>
    </Float>
  );
}

interface DashboardHeroProps {
  onPlay: () => void;
}

export function DashboardHero({ onPlay }: DashboardHeroProps) {
  return (
    <section className="relative min-h-[60vh] flex flex-col items-center justify-center pt-20">
      {/* 3D Avatar Container */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="w-[400px] h-[400px] md:w-[600px] md:h-[600px] opacity-80">
          <Canvas camera={{ position: [0, 0, 5] }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} color="#06b6d4" />
            <directionalLight position={[-10, -10, -5]} intensity={1} color="#ec4899" />
            <Avatar3D />
            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1} />
          </Canvas>
        </div>
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 w-full flex flex-col items-center text-center mt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel mb-6 border border-cyan-500/30">
            <Trophy className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-200">Ranking Global: #1.402</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-4 drop-shadow-2xl">
            Bem-vindo, <span className="text-gradient">PlayerOne</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 drop-shadow-md">
            Sua IA detectou que você está pronto para o próximo nível. 
            O desafio diário te aguarda.
          </p>

          <button 
            onClick={onPlay}
            className="group relative px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-bold text-xl transition-all shadow-[0_0_40px_rgba(168,85,247,0.6)] flex items-center justify-center gap-3 cursor-pointer overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-cyan-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[length:200%_auto] animate-gradient"></div>
            <Play className="w-6 h-6 fill-current relative z-10" />
            <span className="relative z-10">Jogar Partida Ranqueada</span>
          </button>
        </motion.div>
      </div>

      {/* Quick Stats / Footer of Hero */}
      <div className="relative z-10 w-full max-w-4xl mx-auto mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Star, label: 'XP Atual', value: '14.500', color: 'text-yellow-400' },
          { icon: Zap, label: 'Sequência', value: '7 Dias', color: 'text-cyan-400' },
          { icon: Trophy, label: 'Vitórias', value: '342', color: 'text-pink-400' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + idx * 0.1 }}
            className="glass-panel p-4 rounded-2xl flex items-center gap-4 border border-white/5 hover:border-white/20 transition-colors"
          >
            <div className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-400">{stat.label}</p>
              <p className="text-xl font-bold font-display">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
