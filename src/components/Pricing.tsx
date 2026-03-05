import { motion } from 'motion/react';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'FREE',
    price: '0',
    description: 'Para jogadores casuais',
    features: [
      'Acesso limitado a alguns jogos',
      'Com anúncios',
      'Ranking limitado',
      'Sem multiplayer competitivo'
    ],
    buttonText: 'Jogar Grátis',
    popular: false,
    color: 'border-white/10'
  },
  {
    name: 'PRO',
    price: '19,90',
    period: '/mês',
    description: 'A experiência completa',
    features: [
      'Acesso total a todos os jogos',
      'Multiplayer online liberado',
      'Zero anúncios',
      'Ranking global',
      'Avatar 3D personalizado',
      'Desafios IA exclusivos'
    ],
    buttonText: 'Assinar PRO',
    popular: true,
    color: 'border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.2)]'
  },
  {
    name: 'ULTRA',
    price: '34,90',
    period: '/mês',
    description: 'Para competidores natos',
    features: [
      'Tudo do plano PRO',
      'Torneios mensais exclusivos',
      'Moeda virtual premium mensal',
      'Integração Ajuda Aí (Recompensas)',
      'Badge exclusivo no perfil',
      'Acesso antecipado a novos jogos'
    ],
    buttonText: 'Assinar ULTRA',
    popular: false,
    color: 'border-cyan-500/50'
  }
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Escolha seu <span className="text-gradient">Plano</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Desbloqueie todo o potencial da plataforma com nossos planos premium.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative glass-panel rounded-3xl p-8 border ${plan.color} flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide">
                  MAIS POPULAR
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="font-display text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm">{plan.description}</p>
              </div>
              
              <div className="mb-8 flex items-baseline">
                <span className="text-5xl font-display font-bold">R${plan.price}</span>
                {plan.period && <span className="text-gray-400 ml-2">{plan.period}</span>}
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <Check className="w-5 h-5 text-purple-400 mr-3 shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button className={`w-full py-4 rounded-xl font-bold transition-all cursor-pointer ${
                plan.popular 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg' 
                  : 'glass-panel hover:bg-white/10 text-white'
              }`}>
                {plan.buttonText}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
