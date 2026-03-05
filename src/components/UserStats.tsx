import { motion } from 'motion/react';
import { Target, Medal, Coins, Activity, Zap, Shield, Sword, Sparkles } from 'lucide-react';

const stats = [
  { label: 'Moedas Acumuladas', value: '2.450', icon: Coins, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { label: 'Taxa de Vitória', value: '68%', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { label: 'Desafios IA Vencidos', value: '142', icon: Zap, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { label: 'Horas Jogadas', value: '124h', icon: Shield, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
];

const achievements = [
  { title: 'Primeiro Sangue', desc: 'Venceu a IA no nível Difícil', icon: Sword, rarity: 'Épico', color: 'from-purple-500 to-pink-500' },
  { title: 'Mestre do Xadrez', desc: '10 vitórias seguidas', icon: Medal, rarity: 'Lendário', color: 'from-yellow-500 to-orange-500' },
  { title: 'Sobrevivente', desc: 'Chegou ao nível 50 no Arcade', icon: Shield, rarity: 'Raro', color: 'from-cyan-500 to-blue-500' },
];

export function UserStats() {
  return (
    <section className="py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Stats */}
      <div className="lg:col-span-2 space-y-8">
        <div>
          <h2 className="font-display text-3xl font-bold mb-6">
            Suas <span className="text-gradient">Estatísticas</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-panel p-6 rounded-3xl border border-white/10 hover:border-white/30 transition-all group cursor-pointer relative overflow-hidden"
              >
                <div className={`absolute -right-10 -bottom-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity ${stat.bg}`}></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">{stat.label}</p>
                    <p className="text-2xl font-bold font-display">{stat.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Active Challenges & AjudaAí Integration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
              <Target className="w-6 h-6 text-pink-500" />
              Desafios <span className="text-gradient-pink">Ativos</span>
            </h2>
            <div className="space-y-4">
              {[
                { title: 'Derrote a IA no Xadrez', progress: 0, total: 1, reward: '500 Moedas' },
                { title: 'Jogue 5 partidas', progress: 3, total: 5, reward: 'Badge' },
              ].map((challenge, idx) => (
                <div key={idx} className="glass-panel p-4 rounded-2xl border border-white/10">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-sm">{challenge.title}</h3>
                    <span className="text-xs font-medium text-pink-400 bg-pink-400/10 px-2 py-1 rounded-full">
                      {challenge.reward}
                    </span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 mb-1">
                    <div 
                      className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${(challenge.progress / challenge.total) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-right text-[10px] text-gray-400 font-mono">
                    {challenge.progress} / {challenge.total}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* AjudaAí Integration Card */}
          <div>
            <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-orange-400" />
              Benefícios <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">AjudaAí</span>
            </h2>
            <div className="glass-panel p-6 rounded-3xl border border-orange-500/30 relative overflow-hidden h-[calc(100%-3.5rem)] flex flex-col justify-between">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-bold mb-4">
                  <Sparkles className="w-3 h-3" /> Conta Vinculada
                </div>
                <h3 className="text-xl font-bold mb-2">Bônus de Ecossistema Ativo</h3>
                <ul className="space-y-2 text-sm text-gray-300 mb-6">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                    +20% de XP em todas as partidas
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                    Dicas avançadas da IA liberadas
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                    Moedas sincronizadas com o app
                  </li>
                </ul>
              </div>
              
              <button className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] relative z-10 cursor-pointer">
                Gerenciar Conexão
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Achievements */}
      <div className="lg:col-span-1">
        <h2 className="font-display text-3xl font-bold mb-6">
          Conquistas <span className="text-gradient">Raras</span>
        </h2>
        <div className="space-y-4">
          {achievements.map((ach, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-purple-500/50 transition-all group relative overflow-hidden cursor-pointer"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${ach.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
              
              <div className="flex items-start gap-4 relative z-10">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${ach.color} p-0.5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <div className="w-full h-full bg-[#050505] rounded-[10px] flex items-center justify-center">
                    <ach.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-lg leading-tight">{ach.title}</h3>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm ${
                      ach.rarity === 'Lendário' ? 'bg-yellow-500/20 text-yellow-400' :
                      ach.rarity === 'Épico' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-cyan-500/20 text-cyan-400'
                    }`}>
                      {ach.rarity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{ach.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <button className="w-full mt-6 py-4 glass-panel hover:bg-white/10 text-white rounded-xl font-bold transition-all cursor-pointer border border-white/10 hover:border-white/30">
          Ver Todas as Conquistas
        </button>
      </div>
    </section>
  );
}
