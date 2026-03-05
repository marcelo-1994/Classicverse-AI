import { motion } from 'motion/react';
import { Gamepad2, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  onOpenAuth: () => void;
}

export function Navbar({ onOpenAuth }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-8 h-8 text-purple-500" />
            <span className="font-display font-bold text-2xl tracking-tight">
              CLASSICVERSE <span className="text-gradient">AI</span>
            </span>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a href="#games" className="hover:text-purple-400 transition-colors px-3 py-2 rounded-md text-sm font-medium">Jogos</a>
              <a href="#features" className="hover:text-purple-400 transition-colors px-3 py-2 rounded-md text-sm font-medium">Recursos IA</a>
              <a href="#pricing" className="hover:text-purple-400 transition-colors px-3 py-2 rounded-md text-sm font-medium">Planos</a>
              <button 
                onClick={onOpenAuth}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full font-medium transition-all shadow-[0_0_15px_rgba(168,85,247,0.5)] cursor-pointer"
              >
                Jogar Agora
              </button>
            </div>
          </div>
          
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-300 hover:text-white p-2 cursor-pointer">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden glass-panel border-t border-white/10">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a href="#games" className="hover:text-purple-400 block px-3 py-2 rounded-md text-base font-medium">Jogos</a>
            <a href="#features" className="hover:text-purple-400 block px-3 py-2 rounded-md text-base font-medium">Recursos IA</a>
            <a href="#pricing" className="hover:text-purple-400 block px-3 py-2 rounded-md text-base font-medium">Planos</a>
            <button 
              onClick={() => {
                setIsOpen(false);
                onOpenAuth();
              }}
              className="w-full text-left bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md font-medium cursor-pointer"
            >
              Jogar Agora
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
