import { motion } from 'motion/react';
import { Play, BrainCircuit, Users, Puzzle, Ghost, Flame } from 'lucide-react';
import { useState } from 'react';

const filters = [
  { id: 'all', label: 'Todos', icon: Flame },
  { id: 'multiplayer', label: 'Multiplayer', icon: Users },
  { id: 'puzzle', label: 'Puzzle', icon: Puzzle },
  { id: 'arcade', label: 'Arcade', icon: Ghost },
];

const games = [
  {
    id: 1,
    title: 'Neon Pac-Man',
    category: 'arcade',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800',
    difficulty: 'Médio',
    aiLevel: 65,
    players: '1.2k online',
    color: 'from-purple-500 to-indigo-500'
  },
  {
    id: 2,
    title: 'Cyber Chess',
    category: 'puzzle',
    image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&q=80&w=800',
    difficulty: 'Difícil',
    aiLevel: 92,
    players: '8.4k online',
    color: 'from-cyan-500 to-blue-500'
  },
  {
    id: 3,
    title: 'Retro Kart',
    category: 'multiplayer',
    image: 'https://images.unsplash.com/photo-1611996575749-79a3a250f563?auto=format&fit=crop&q=80&w=800',
    difficulty: 'Fácil',
    aiLevel: 30,
    players: '12k online',
    color: 'from-pink-500 to-rose-500'
  },
  {
    id: 4,
    title: 'Space Invaders 3D',
    category: 'arcade',
    image: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&q=80&w=800',
    difficulty: 'Insano',
    aiLevel: 99,
    players: '4.1k online',
    color: 'from-emerald-500 to-teal-500'
  }
];

interface GameCarouselProps {
  onSelectGame: (id: number) => void;
}

export function GameCarousel({ onSelectGame }: GameCarouselProps) {
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredGames = activeFilter === 'all' 
    ? games 
    : games.filter(g => g.category === activeFilter);

  return (
    <section className="py-12">
      <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
        <div>
          <h2 className="font-display text-3xl font-bold mb-2">
            Biblioteca de <span className="text-gradient">Jogos</span>
          </h2>
          <p className="text-gray-400">Escolha seu próximo desafio.</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide w-full md:w-auto">
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === filter.id
                  ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'glass-panel text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <filter.icon className="w-4 h-4" />
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3D-like Carousel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredGames.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelectGame(game.id)}
            className="group relative rounded-3xl overflow-hidden glass-panel border border-white/10 hover:border-purple-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(168,85,247,0.2)] cursor-pointer"
            style={{ perspective: '1000px' }}
          >
            {/* Image Container with 3D rotation effect on hover */}
            <div className="relative h-64 w-full overflow-hidden transition-transform duration-500 group-hover:rotate-x-12 group-hover:scale-105 origin-bottom">
              <img 
                src={game.image} 
                alt={game.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className={`absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-80`}></div>
              <div className={`absolute inset-0 bg-gradient-to-br ${game.color} mix-blend-overlay opacity-40 group-hover:opacity-60 transition-opacity`}></div>
              
              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <Play className="w-8 h-8 text-white fill-current ml-1" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 relative z-10 bg-gradient-to-t from-[#050505] to-transparent -mt-20">
              <h3 className="font-display text-xl font-bold mb-1 group-hover:text-purple-400 transition-colors">{game.title}</h3>
              <p className="text-sm text-gray-400 mb-4">{game.players}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono text-cyan-200">IA Nível {game.aiLevel}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-md bg-white/10 ${
                  game.difficulty === 'Fácil' ? 'text-emerald-400' :
                  game.difficulty === 'Médio' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {game.difficulty}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
