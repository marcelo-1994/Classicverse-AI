import { motion } from 'motion/react';
import { BrainCircuit, Trophy, Users, Coins } from 'lucide-react';

const features = [
  {
    icon: BrainCircuit,
    title: 'Inteligência Artificial',
    description: 'A IA ajusta a dificuldade em tempo real, cria desafios personalizados e detecta padrões de jogo para uma experiência única.',
    color: 'text-purple-400'
  },
  {
    icon: Users,
    title: 'Multiplayer Global',
    description: 'Jogue contra amigos ou desafie jogadores do mundo todo com nosso sistema de matchmaking inteligente e sem lag.',
    color: 'text-cyan-400'
  },
  {
    icon: Trophy,
    title: 'Ranking & Torneios',
    description: 'Suba nas ligas, participe de torneios semanais gerados por IA e ganhe recompensas exclusivas para seu avatar 3D.',
    color: 'text-pink-400'
  },
  {
    icon: Coins,
    title: 'Ecossistema Ajuda Aí',
    description: 'Converta suas conquistas e moedas do jogo em benefícios reais no aplicativo Ajuda Aí. Jogue e ganhe recompensas sociais.',
    color: 'text-emerald-400'
  }
];

export function Features() {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            O Diferencial <span className="text-gradient">IA</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Tecnologia de ponta para elevar jogos clássicos a um novo patamar de diversão e desafio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-panel p-8 rounded-3xl border border-white/5 hover:border-white/20 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="font-display text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
