import { motion } from 'motion/react';
import { Ghost, Crown, Spade, Puzzle } from 'lucide-react';

const categories = [
  {
    id: 'arcade',
    title: 'Arcade Clássico',
    icon: Ghost,
    color: 'from-purple-500 to-indigo-500',
    games: ['Pac-Man Style', 'Space Shooter', 'Plataforma 2D'],
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'strategy',
    title: 'Estratégia & Tabuleiro',
    icon: Crown,
    color: 'from-cyan-500 to-blue-500',
    games: ['Xadrez com IA', 'Damas', 'Jogo da Velha Competitivo'],
    image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'cards',
    title: 'Cartas',
    icon: Spade,
    color: 'from-pink-500 to-rose-500',
    games: ['Paciência', 'Uno-Style', 'Truco Online'],
    image: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'puzzle',
    title: 'Puzzle',
    icon: Puzzle,
    color: 'from-emerald-500 to-teal-500',
    games: ['Tetris-Like', 'Sudoku', 'Quebra-Cabeça 3D'],
    image: 'https://images.unsplash.com/photo-1611996575749-79a3a250f563?auto=format&fit=crop&q=80&w=800'
  }
];

export function GameCategories() {
  return (
    <section id="games" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Catálogo <span className="text-gradient">Premium</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Redescubra os clássicos com gráficos modernizados e multiplayer online.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative rounded-3xl overflow-hidden glass-panel border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                <img src={category.image} alt={category.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} mix-blend-overlay`}></div>
              </div>
              
              <div className="relative p-8 h-full flex flex-col">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-6 shadow-lg`}>
                  <category.icon className="w-7 h-7 text-white" />
                </div>
                
                <h3 className="font-display text-2xl font-bold mb-4">{category.title}</h3>
                
                <ul className="space-y-3 mt-auto">
                  {category.games.map((game, i) => (
                    <li key={i} className="flex items-center text-gray-300 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/50 mr-3"></div>
                      {game}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
