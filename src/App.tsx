import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { GameCategories } from './components/GameCategories';
import { Features } from './components/Features';
import { Pricing } from './components/Pricing';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './components/Dashboard';

export default function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (isLoggedIn) {
    return <Dashboard onLogout={() => setIsLoggedIn(false)} />;
  }

  return (
    <div className="min-h-screen font-sans selection:bg-purple-500/30">
      <Navbar onOpenAuth={() => setIsAuthModalOpen(true)} />
      <main>
        <Hero onPlay={() => setIsAuthModalOpen(true)} />
        <div id="games-section">
          <GameCategories />
        </div>
        <Features />
        <Pricing />
      </main>
      <Footer />
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onLogin={() => setIsLoggedIn(true)}
      />
    </div>
  );
}
