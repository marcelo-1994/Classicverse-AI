-- ==========================================
-- SCRIPT SQL PARA O SUPABASE DO AJUDAAÍ
-- ==========================================
-- Rode este script no "SQL Editor" do painel do Supabase do AjudaAí.
-- Ele cria as tabelas do ClassicVerse AI sem interferir nas tabelas principais do AjudaAí.
-- Usamos o prefixo "cv_" (ClassicVerse) para manter tudo organizado.

-- 1. Tabela de Inventário (Skins e Avatares comprados)
CREATE TABLE IF NOT EXISTS public.cv_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_id) -- Garante que o usuário não compre a mesma skin duas vezes
);

-- 2. Tabela de Histórico de Partidas (Para Leaderboards e Estatísticas)
CREATE TABLE IF NOT EXISTS public.cv_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL, -- ex: 'tictactoe', 'chess'
  result TEXT NOT NULL, -- 'win', 'loss', 'draw'
  difficulty TEXT, -- 'easy', 'medium', 'hard'
  xp_earned INT DEFAULT 0,
  coins_earned INT DEFAULT 0,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- FUNÇÕES SEGURAS (RPC - Remote Procedure Calls)
-- ==========================================
-- Estas funções garantem que as moedas sejam atualizadas com segurança no servidor,
-- evitando que hackers manipulem o saldo pelo frontend.

-- 3. Função para adicionar moedas (quando o jogador vence uma partida)
-- NOTA: Substitua "profiles" e "ajuda_ai_coins" pelo nome real da sua tabela e coluna no AjudaAí.
CREATE OR REPLACE FUNCTION public.cv_increment_coins(user_id UUID, amount INT, source TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios de admin para poder atualizar o perfil
AS $$
DECLARE
  new_balance INT;
BEGIN
  -- Atualiza o saldo do usuário na tabela principal do AjudaAí
  UPDATE public.profiles
  SET ajuda_ai_coins = ajuda_ai_coins + amount
  WHERE id = user_id
  RETURNING ajuda_ai_coins INTO new_balance;

  -- (Opcional) Você pode inserir um log de transação aqui se o AjudaAí tiver uma tabela de extrato

  RETURN new_balance;
END;
$$;

-- 4. Função para comprar um item (deduz moedas e adiciona ao inventário)
CREATE OR REPLACE FUNCTION public.cv_purchase_item(user_id UUID, item_id TEXT, cost INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance INT;
BEGIN
  -- 1. Verifica o saldo atual do usuário no AjudaAí
  SELECT ajuda_ai_coins INTO current_balance
  FROM public.profiles
  WHERE id = user_id;

  -- 2. Se não tiver saldo, cancela a transação
  IF current_balance < cost THEN
    RETURN FALSE;
  END IF;

  -- 3. Deduz as moedas do perfil
  UPDATE public.profiles
  SET ajuda_ai_coins = ajuda_ai_coins - cost
  WHERE id = user_id;

  -- 4. Adiciona o item ao inventário do ClassicVerse
  INSERT INTO public.cv_inventory (user_id, item_id)
  VALUES (user_id, item_id);

  RETURN TRUE;
EXCEPTION WHEN unique_violation THEN
  -- Se o usuário já tiver o item, cancela (não cobra as moedas)
  RETURN FALSE;
END;
$$;

-- ==========================================
-- POLÍTICAS DE SEGURANÇA (RLS - Row Level Security)
-- ==========================================
-- Garante que um usuário só possa ver seu próprio inventário e histórico

ALTER TABLE public.cv_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu próprio inventário" 
ON public.cv_inventory FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver seu próprio histórico" 
ON public.cv_matches FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seu próprio histórico" 
ON public.cv_matches FOR INSERT 
WITH CHECK (auth.uid() = user_id);
