-- Tabela para armazenar o desafio diário (um por dia)
CREATE TABLE public.daily_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id),
  challenge_date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para rastrear progresso diário dos usuários
CREATE TABLE public.user_daily_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, challenge_date)
);

-- Enable RLS
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_progress ENABLE ROW LEVEL SECURITY;

-- Políticas para daily_challenges (todos podem ver)
CREATE POLICY "Anyone can view daily challenges"
ON public.daily_challenges FOR SELECT
USING (true);

-- Políticas para user_daily_progress
CREATE POLICY "Users can view their own daily progress"
ON public.user_daily_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily progress"
ON public.user_daily_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily progress"
ON public.user_daily_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Função para obter ou criar o desafio do dia
CREATE OR REPLACE FUNCTION public.get_or_create_daily_challenge()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_challenge_id UUID;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Verifica se já existe desafio para hoje
  SELECT challenge_id INTO v_challenge_id
  FROM daily_challenges
  WHERE challenge_date = v_today;
  
  -- Se não existe, cria um novo
  IF v_challenge_id IS NULL THEN
    -- Seleciona um desafio aleatório que não seja de prática
    SELECT id INTO v_challenge_id
    FROM challenges
    WHERE is_practice = false
    ORDER BY random()
    LIMIT 1;
    
    -- Insere o desafio do dia
    INSERT INTO daily_challenges (challenge_id, challenge_date)
    VALUES (v_challenge_id, v_today);
  END IF;
  
  RETURN v_challenge_id;
END;
$$;