import { createClient } from '@supabase/supabase-js';

// Serviço de Integração com o Backend do AjudaAí (Supabase)
// Como o AjudaAí usa Supabase, podemos conectar diretamente ao banco de dados
// usando a chave pública (anon key) e a URL do projeto Supabase do AjudaAí.

const supabaseUrl = import.meta.env.VITE_AJUDA_AI_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_AJUDA_AI_SUPABASE_ANON_KEY;

// Inicializa o cliente real apenas se as variáveis de ambiente existirem.
// Caso contrário, usa um mock para o preview não quebrar.
export const supabaseAjudaAi = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const AjudaAiService = {
  /**
   * 1. Autenticação (Single Sign-On / SSO)
   * Usa o Supabase Auth para logar o usuário com as mesmas credenciais do AjudaAí.
   */
  async authenticateWithAjudaAi(email: string, password?: string) {
    try {
      if (supabaseAjudaAi && password) {
        // Exemplo real com Supabase Auth
        const { data, error } = await supabaseAjudaAi.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        // Busca o perfil do usuário na tabela 'profiles' do AjudaAí
        const { data: profile } = await supabaseAjudaAi
          .from('profiles')
          .select('name, ajuda_ai_coins, is_premium')
          .eq('id', data.user.id)
          .single();
          
        return { success: true, user: { ...data.user, ...profile } };
      }
      
      // Simulação para o preview (se não houver chaves configuradas)
      return {
        success: true,
        user: {
          id: 'ajudaai_user_123',
          name: 'PlayerOne',
          email: email,
          ajudaAiCoins: 1500,
          isPremium: true,
        }
      };
    } catch (error) {
      console.error('Erro ao autenticar com Supabase AjudaAí:', error);
      throw error;
    }
  },

  /**
   * 2. Sincronização de Moedas/Economia (RPC)
   * Chama a função SQL segura que criamos no Supabase do AjudaAí.
   */
  async syncCoins(userId: string, coinsEarned: number, gameId: string) {
    try {
      if (supabaseAjudaAi) {
        // Exemplo real chamando a RPC (Stored Procedure) no Supabase
        const { data, error } = await supabaseAjudaAi.rpc('cv_increment_coins', {
          user_id: userId,
          amount: coinsEarned,
          source: `classicverse_${gameId}`
        });
        
        if (error) throw error;
        return { success: true, newTotal: data };
      }
      
      console.log(`[Supabase AjudaAí Mock] Sincronizando +${coinsEarned} moedas para o usuário ${userId}`);
      return { success: true, newTotal: 1500 + coinsEarned };
    } catch (error) {
      console.error('Erro ao sincronizar moedas no Supabase:', error);
      return { success: false };
    }
  },

  /**
   * 3. Resgate de Recompensas do Ecossistema (RPC)
   * Chama a função SQL segura que deduz moedas e adiciona ao inventário.
   */
  async purchaseItemWithAjudaAiCoins(userId: string, itemId: string, cost: number) {
    try {
      if (supabaseAjudaAi) {
        // Exemplo real chamando a RPC para deduzir moedas com segurança
        const { data, error } = await supabaseAjudaAi.rpc('cv_purchase_item', {
          user_id: userId,
          item_id: itemId,
          cost: cost
        });
        
        if (error) throw error;
        return data === true; // Retorna true se a compra foi bem sucedida
      }
      
      console.log(`[Supabase AjudaAí Mock] Deduzindo ${cost} moedas do usuário ${userId} para o item ${itemId}`);
      return true;
    } catch (error) {
      console.error('Erro ao processar compra no Supabase:', error);
      return false;
    }
  },

  /**
   * 4. Buscar Inventário do ClassicVerse
   * Lê a tabela cv_inventory que criamos no banco do AjudaAí.
   */
  async getUserInventory(userId: string) {
    try {
      if (supabaseAjudaAi) {
        const { data, error } = await supabaseAjudaAi
          .from('cv_inventory')
          .select('item_id')
          .eq('user_id', userId);
          
        if (error) throw error;
        return data.map(row => row.item_id);
      }
      
      // Mock para o preview
      return ['skin_1']; // Retorna a skin padrão
    } catch (error) {
      console.error('Erro ao buscar inventário:', error);
      return [];
    }
  },

  /**
   * 5. Salvar Histórico de Partida
   * Insere um registro na tabela cv_matches.
   */
  async saveMatchResult(userId: string, gameId: string, result: 'win' | 'loss' | 'draw', difficulty: string, xpEarned: number, coinsEarned: number) {
    try {
      if (supabaseAjudaAi) {
        const { error } = await supabaseAjudaAi
          .from('cv_matches')
          .insert({
            user_id: userId,
            game_id: gameId,
            result,
            difficulty,
            xp_earned: xpEarned,
            coins_earned: coinsEarned
          });
          
        if (error) throw error;
        return true;
      }
      
      console.log(`[Supabase AjudaAí Mock] Partida salva: ${gameId} - ${result}`);
      return true;
    } catch (error) {
      console.error('Erro ao salvar partida:', error);
      return false;
    }
  }
};
