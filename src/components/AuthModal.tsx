import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Gamepad2 } from 'lucide-react';
import { useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export function AuthModal({ isOpen, onClose, onLogin }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[70] p-4"
          >
            <div className="glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl"></div>

              <button
                onClick={onClose}
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-8">
                <Gamepad2 className="w-6 h-6 text-purple-500" />
                <span className="font-display font-bold text-xl tracking-tight">
                  CLASSICVERSE <span className="text-gradient">AI</span>
                </span>
              </div>

              <h2 className="font-display text-3xl font-bold mb-2">
                {isLogin ? 'Bem-vindo de volta' : 'Criar nova conta'}
              </h2>
              <p className="text-gray-400 text-sm mb-8">
                {isLogin
                  ? 'Entre para continuar sua jornada clássica.'
                  : 'Junte-se à revolução dos jogos com IA.'}
              </p>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Nome de Usuário</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="PlayerOne"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      type="email"
                      className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Senha</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      type="password"
                      className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {isLogin && (
                  <div className="flex justify-end">
                    <a href="#" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                      Esqueceu a senha?
                    </a>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] mt-6 cursor-pointer"
                >
                  {isLogin ? 'Entrar' : 'Criar Conta'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm">
                  {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}{' '}
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-purple-400 hover:text-purple-300 font-medium transition-colors cursor-pointer"
                  >
                    {isLogin ? 'Registre-se' : 'Faça login'}
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
