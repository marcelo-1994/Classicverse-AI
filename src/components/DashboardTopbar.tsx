import { motion } from 'motion/react';
import { Gamepad2, Bell, Search, LogOut, Sparkles, ShoppingBag } from 'lucide-react';

interface DashboardTopbarProps {
  onLogout: () => void;
  onOpenStore: () => void;
}

export function DashboardTopbar({ onLogout, onOpenStore }: DashboardTopbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/10 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <Gamepad2 className="w-8 h-8 text-purple-500" />
            <span className="font-display font-bold text-2xl tracking-tight hidden sm:block">
              CLASSICVERSE <span className="text-gradient">AI</span>
            </span>
          </motion.div>
          
          {/* Minimal Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-white font-medium hover:text-purple-400 transition-colors">Início</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Biblioteca</a>
            <button onClick={onOpenStore} className="text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-2 cursor-pointer">
              <ShoppingBag className="w-4 h-4" /> Loja
            </button>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Torneios</a>
          </div>
          
          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* AjudaAí Integration Button */}
            <button className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/30 hover:border-orange-500/60 transition-all group cursor-pointer">
              <Sparkles className="w-4 h-4 text-orange-400 group-hover:animate-pulse" />
              <span className="text-sm font-bold text-orange-100 group-hover:text-white">AjudaAí Plus</span>
            </button>

            <button onClick={onOpenStore} className="md:hidden p-2 text-gray-400 hover:text-purple-400 transition-colors cursor-pointer">
              <ShoppingBag className="w-5 h-5" />
            </button>

            <button className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-white transition-colors relative cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
            </button>
            
            <div className="h-8 w-px bg-white/10 mx-2"></div>
            
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">PlayerOne</p>
                <p className="text-xs text-gray-400">Nível 42</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 p-0.5">
                <img 
                  src="https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=100" 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover border-2 border-black"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <button 
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors cursor-pointer ml-2"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}