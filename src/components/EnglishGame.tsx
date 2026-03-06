import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Trophy, Star, Volume2, CheckCircle2, XCircle, Sparkles, BookOpen } from 'lucide-react';

interface Question {
  id: number;
  word: string;
  translation: string;
  options: string[];
  type: 'translate' | 'listen';
}

const QUESTIONS: Question[] = [
  { id: 1, word: 'Apple', translation: 'Maçã', options: ['Banana', 'Maçã', 'Laranja', 'Uva'], type: 'translate' },
  { id: 2, word: 'Dog', translation: 'Cachorro', options: ['Gato', 'Pássaro', 'Cachorro', 'Peixe'], type: 'translate' },
  { id: 3, word: 'Water', translation: 'Água', options: ['Fogo', 'Terra', 'Ar', 'Água'], type: 'translate' },
  { id: 4, word: 'Friend', translation: 'Amigo', options: ['Inimigo', 'Amigo', 'Irmão', 'Pai'], type: 'translate' },
  { id: 5, word: 'House', translation: 'Casa', options: ['Carro', 'Casa', 'Escola', 'Rua'], type: 'translate' },
  { id: 6, word: 'Book', translation: 'Livro', options: ['Caderno', 'Lápis', 'Livro', 'Mesa'], type: 'translate' },
  { id: 7, word: 'Sun', translation: 'Sol', options: ['Lua', 'Estrela', 'Sol', 'Nuvem'], type: 'translate' },
  { id: 8, word: 'Time', translation: 'Tempo', options: ['Espaço', 'Hora', 'Tempo', 'Dia'], type: 'translate' },
];

interface EnglishGameProps {
  onBack: () => void;
}

export function EnglishGame({ onBack }: EnglishGameProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

  const currentQuestion = QUESTIONS[currentQuestionIndex];

  useEffect(() => {
    if (currentQuestion) {
      setShuffledOptions([...currentQuestion.options].sort(() => Math.random() - 0.5));
    }
  }, [currentQuestionIndex]);

  const handleAnswer = (answer: string) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answer);
    const correct = answer === currentQuestion.translation;
    setIsCorrect(correct);

    if (correct) {
      setScore(s => s + 10);
      setXp(x => x + 25 + (streak * 5));
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      if (currentQuestionIndex < QUESTIONS.length - 1) {
        setCurrentQuestionIndex(i => i + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      } else {
        setIsGameOver(true);
      }
    }, 1500);
  };

  const playPronunciation = () => {
    // In a real app, use SpeechSynthesis API
    const utterance = new SpeechSynthesisUtterance(currentQuestion.word);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
      {/* Header */}
      <header className="p-4 sm:p-6 flex items-center justify-between glass-panel border-b border-white/10 z-10">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-amber-400">{xp} XP</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame className={`w-5 h-5 ${streak > 2 ? 'text-orange-500 animate-pulse' : 'text-gray-500'}`} />
            <span className="font-bold">{streak}x</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
        
        {/* Background Elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <AnimatePresence mode="wait">
          {!isGameOver ? (
            <motion.div 
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-2xl"
            >
              {/* Progress Bar */}
              <div className="w-full h-2 bg-white/10 rounded-full mb-12 overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                  initial={{ width: `${(currentQuestionIndex / QUESTIONS.length) * 100}%` }}
                  animate={{ width: `${((currentQuestionIndex + 1) / QUESTIONS.length) * 100}%` }}
                />
              </div>

              <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/10 text-center relative">
                
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                  <BookOpen className="w-4 h-4" />
                  Traduza a Palavra
                </div>

                <div className="mb-12 mt-4">
                  <h2 className="text-5xl sm:text-7xl font-display font-bold mb-6 text-gradient bg-gradient-to-r from-amber-200 to-orange-400">
                    {currentQuestion.word}
                  </h2>
                  <button 
                    onClick={playPronunciation}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-5 h-5 text-amber-400" />
                    <span>Ouvir Pronúncia</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {shuffledOptions.map((option, index) => {
                    let buttonClass = "glass-panel p-6 rounded-2xl border border-white/10 text-xl font-medium transition-all cursor-pointer hover:bg-white/5 hover:border-amber-500/50";
                    
                    if (selectedAnswer === option) {
                      if (isCorrect) {
                        buttonClass = "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]";
                      } else {
                        buttonClass = "bg-red-500/20 border-red-500 text-red-400";
                      }
                    } else if (selectedAnswer !== null && option === currentQuestion.translation) {
                      buttonClass = "bg-emerald-500/20 border-emerald-500 text-emerald-400";
                    }

                    return (
                      <motion.button
                        key={index}
                        whileHover={selectedAnswer === null ? { scale: 1.02 } : {}}
                        whileTap={selectedAnswer === null ? { scale: 0.98 } : {}}
                        onClick={() => handleAnswer(option)}
                        disabled={selectedAnswer !== null}
                        className={buttonClass}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option}</span>
                          {selectedAnswer === option && isCorrect && <CheckCircle2 className="w-6 h-6" />}
                          {selectedAnswer === option && !isCorrect && <XCircle className="w-6 h-6" />}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center glass-panel p-12 rounded-3xl border border-amber-500/30 max-w-md w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 to-orange-500"></div>
              
              <Sparkles className="w-20 h-20 text-amber-400 mx-auto mb-6" />
              
              <h2 className="text-4xl font-display font-bold mb-2">Lição Concluída!</h2>
              <p className="text-gray-400 mb-8 text-lg">Você está indo muito bem.</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="text-sm text-gray-400 mb-1">Acertos</div>
                  <div className="text-3xl font-bold text-emerald-400">{score / 10}/{QUESTIONS.length}</div>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="text-sm text-gray-400 mb-1">XP Ganho</div>
                  <div className="text-3xl font-bold text-amber-400">+{xp}</div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={onBack}
                  className="flex-1 py-4 glass-panel hover:bg-white/10 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Voltar
                </button>
                <button 
                  onClick={() => {
                    setCurrentQuestionIndex(0);
                    setScore(0);
                    setXp(0);
                    setStreak(0);
                    setIsGameOver(false);
                    setSelectedAnswer(null);
                    setIsCorrect(null);
                  }}
                  className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl font-bold transition-colors shadow-[0_0_20px_rgba(245,158,11,0.4)] cursor-pointer"
                >
                  Próxima Lição
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
