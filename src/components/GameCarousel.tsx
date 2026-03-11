import { motion } from 'motion/react';
import { Play, BrainCircuit, Users, Puzzle, Ghost, Flame, Bomb, Swords, Rocket, Gamepad2, GraduationCap, BookOpen } from 'lucide-react';
import { useState } from 'react';

const filters = [
  { id: 'all', label: 'Todos', icon: Flame },
  { id: 'education', label: 'Educação', icon: GraduationCap },
  { id: 'multiplayer', label: 'Multiplayer', icon: Users },
  { id: 'puzzle', label: 'Puzzle', icon: Puzzle },
  { id: 'arcade', label: 'Arcade', icon: Ghost },
];

const games = [
  {
    id: 'english',
    title: 'Aprender Inglês',
    category: 'education',
    image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=800',
    difficulty: 'Educativo',
    aiLevel: 100,
    players: '15k online',
    color: 'from-amber-500 to-orange-500',
    icon: BookOpen,
    featured: true
  },
  {
    id: 'spaceshooter',
    title: 'Space Shooter 3D',
    category: 'arcade',
    image: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&q=80&w=800',
    difficulty: 'Adaptativa',
    aiLevel: 85,
    players: '4.1k online',
    color: 'from-cyan-500 to-blue-500'
  },
  {
    id: 'arcademaze',
    title: 'Arcade Maze 3D',
    category: 'arcade',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800',
    difficulty: 'Adaptativa',
    aiLevel: 80,
    players: '1.2k online',
    color: 'from-purple-500 to-indigo-500'
  },
  {
    id: 'blockpuzzle',
    title: 'Block Puzzle 3D',
    category: 'puzzle',
    image: 'https://images.unsplash.com/photo-1614624532983-4ce03382d63d?auto=format&fit=crop&q=80&w=800',
    difficulty: 'Crescente',
    aiLevel: 60,
    players: '8.4k online',
    color: 'from-blue-500 to-indigo-500'
  },
  {
    id: 'minesweeper',
    title: 'Campo Minado 3D',
    category: 'puzzle',
    image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&q=80&w=800',
    difficulty: 'Médio',
    aiLevel: 75,
    players: '3.2k online',
    color: 'from-emerald-500 to-teal-500'
  },
  {
    id: 'tictactoe',
    title: 'Tic Tac Toe 3D',
    category: 'arcade',
    image: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?auto=format&fit=crop&q=80&w=800',
    difficulty: 'Fácil',
    aiLevel: 90,
    players: '5.6k online',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'chess',
    title: 'Chess 3D',
    category: 'puzzle',
    image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&q=80&w=800',
    difficulty: 'Adaptativa',
    aiLevel: 99,
    players: '12k online',
    color: 'from-emerald-500 to-teal-500'
  },
  {
    id: 'truco',
    title: 'Truco 3D',
    category: 'multiplayer',
    image: 'https://images.unsplash.com/photo-1605870445919-838d190e8e1b?auto=format&fit=crop&q=80&w=800',
    difficulty: 'Multiplayer',
    aiLevel: 0,
    players: '25k online',
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 'blackjack',
    title: 'Blackjack 3D',
    category: 'arcade',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800',
    difficulty: 'Médio',
    aiLevel: 80,
    players: '18k online',
    color: 'from-yellow-500 to-amber-600'
  }
];

interface GameCarouselProps {
  onSelectGame: (id: string) => void;
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {filteredGames.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelectGame(game.id)}
            className={`group relative rounded-3xl overflow-hidden glass-panel border transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(168,85,247,0.2)] cursor-pointer ${game.featured ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'border-white/10 hover:border-purple-500/50'}`}
            style={{ perspective: '1000px' }}
          >
            {game.featured && (
              <div className="absolute top-3 right-3 z-20 bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                <GraduationCap className="w-3 h-3" />
                DESTAQUE
              </div>
            )}
            
            {/* Image Container with 3D rotation effect on hover */}
            <div className="relative h-48 w-full overflow-hidden transition-transform duration-500 group-hover:rotate-x-12 group-hover:scale-105 origin-bottom">
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
            <div className="p-5 relative z-10 bg-gradient-to-t from-[#050505] to-transparent -mt-16">
              <h3 className={`font-display text-lg font-bold mb-1 transition-colors truncate ${game.featured ? 'group-hover:text-amber-400' : 'group-hover:text-purple-400'}`}>{game.title}</h3>
              <p className="text-xs text-gray-400 mb-3">{game.players}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {game.id === 'truco' ? (
                    <Users className="w-4 h-4 text-orange-400" />
                  ) : game.id === 'english' ? (
                    <BookOpen className="w-4 h-4 text-amber-400" />
                  ) : (
                    <BrainCircuit className="w-4 h-4 text-cyan-400" />
                  )}
                  <span className={`text-[10px] font-mono ${game.id === 'truco' ? 'text-orange-200' : game.id === 'english' ? 'text-amber-200' : 'text-cyan-200'}`}>
                    {game.id === 'truco' ? 'PvP Online' : game.id === 'english' ? 'IA Tutor' : `IA Lvl ${game.aiLevel}`}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md bg-white/10 ${
                  game.difficulty === 'Adaptativa' ? 'text-purple-400' :
                  game.difficulty === 'Crescente' ? 'text-yellow-400' :
                  game.difficulty === 'Multiplayer' ? 'text-orange-400' :
                  game.difficulty === 'Educativo' ? 'text-amber-400' :
                  'text-emerald-400'
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
