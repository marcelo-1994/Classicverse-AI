// ==========================================
// MÓDULO CENTRAL DE IA ADAPTATIVA (aiEngine)
// ==========================================
// Este módulo é responsável por analisar o desempenho do jogador
// e ajustar a dificuldade dos jogos dinamicamente para manter o "Flow".

interface GamePerformance {
  userId: string;
  gameId: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number; // 0.0 a 1.0
  currentDifficultyLevel: number; // 1 a 100
}

export const AIEngine = {
  /**
   * 1. Analisa o desempenho recente do jogador no banco de dados
   * (Simulado aqui, mas na prática faria um SELECT na tabela cv_matches)
   */
  analisarDesempenho: async (userId: string, gameId: string): Promise<GamePerformance> => {
    console.log(`[AIEngine] Analisando desempenho de ${userId} no jogo ${gameId}...`);
    
    // Simulação de busca no banco de dados (Supabase)
    // Na vida real: SELECT count(*), sum(case when result='win' then 1 else 0 end) FROM cv_matches WHERE user_id = userId AND game_id = gameId
    
    const mockWins = Math.floor(Math.random() * 10) + 5;
    const mockLosses = Math.floor(Math.random() * 5);
    const total = mockWins + mockLosses;
    
    return {
      userId,
      gameId,
      matchesPlayed: total,
      wins: mockWins,
      losses: mockLosses,
      winRate: total > 0 ? mockWins / total : 0.5,
      currentDifficultyLevel: 50 // Dificuldade base inicial
    };
  },

  /**
   * 2. Calcula o novo nível de dificuldade baseado na taxa de vitória
   * Lógica:
   * Se taxa_vitoria > 70% -> aumentar dificuldade
   * Se taxa_vitoria < 40% -> diminuir dificuldade
   */
  calcularNivelDificuldade: (performance: GamePerformance): number => {
    let newDifficulty = performance.currentDifficultyLevel;

    if (performance.winRate > 0.70) {
      // Jogador está ganhando muito fácil, aumenta a dificuldade em 10%
      newDifficulty = Math.min(100, newDifficulty * 1.10);
      console.log(`[AIEngine] Taxa de vitória alta (${(performance.winRate*100).toFixed(1)}%). Aumentando dificuldade para ${newDifficulty.toFixed(0)}.`);
    } else if (performance.winRate < 0.40) {
      // Jogador está perdendo muito, diminui a dificuldade em 5% para não frustrar
      newDifficulty = Math.max(1, newDifficulty * 0.95);
      console.log(`[AIEngine] Taxa de vitória baixa (${(performance.winRate*100).toFixed(1)}%). Reduzindo dificuldade para ${newDifficulty.toFixed(0)}.`);
    } else {
      console.log(`[AIEngine] Taxa de vitória balanceada (${(performance.winRate*100).toFixed(1)}%). Mantendo dificuldade em ${newDifficulty.toFixed(0)}.`);
    }

    return Math.round(newDifficulty);
  },

  /**
   * 3. Ajusta os parâmetros específicos de cada jogo com base no nível de dificuldade
   * Retorna um objeto com as configurações que a engine do jogo vai usar.
   */
  ajustarParametrosJogo: (gameId: string, difficultyLevel: number) => {
    // difficultyLevel varia de 1 a 100
    const factor = difficultyLevel / 100;

    switch (gameId) {
      case 'spaceshooter':
        return {
          enemySpeed: 2 + (factor * 5), // Inimigos mais rápidos
          spawnRate: 2000 - (factor * 1500), // Menos tempo entre spawns (mais inimigos)
          enemyHealth: 10 + (factor * 40), // Inimigos mais resistentes
          aiAggressiveness: factor // Define se os inimigos atiram mais
        };
      
      case 'blockpuzzle':
        return {
          dropSpeed: 1000 - (factor * 800), // Peças caem mais rápido
          complexPiecesProbability: factor * 0.5 // Maior chance de vir peças difíceis
        };

      case 'chess':
        return {
          searchDepth: Math.max(1, Math.floor(factor * 5)), // Profundidade do algoritmo Minimax
          blunderProbability: 1 - factor // Chance da IA cometer um erro de propósito
        };

      case 'arcademaze':
        return {
          ghostSpeed: 1.5 + (factor * 3),
          ghostIntelligence: factor // 0 = movimento aleatório, 1 = perseguição implacável (A*)
        };

      default:
        return { difficultyMultiplier: factor };
    }
  }
};
