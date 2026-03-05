import { Gamepad2, Twitter, Github, MessageSquare } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/10 glass-panel mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Gamepad2 className="w-6 h-6 text-purple-500" />
              <span className="font-display font-bold text-xl tracking-tight">
                CLASSICVERSE <span className="text-gradient">AI</span>
              </span>
            </div>
            <p className="text-gray-400 max-w-sm mb-6">
              A plataforma definitiva para jogos clássicos com inteligência artificial, 
              multiplayer online e integração com o ecossistema Ajuda Aí.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <MessageSquare className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Plataforma</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-purple-400 transition-colors">Jogos</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Torneios</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Ranking Global</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Planos</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Suporte</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-purple-400 transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Contato</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Privacidade</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Classicverse AI. Todos os direitos reservados.</p>
          <p className="mt-2 md:mt-0">Feito com 💜 para gamers.</p>
        </div>
      </div>
    </footer>
  );
}
