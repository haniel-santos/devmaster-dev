-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create challenges table
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT DEFAULT 'beginner',
  order_index INTEGER NOT NULL,
  test_code TEXT NOT NULL,
  template_code TEXT,
  solution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on challenges
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Create user_progress table
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- Enable RLS on user_progress
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Create user_energy table
CREATE TABLE public.user_energy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_energy INTEGER DEFAULT 7,
  max_energy INTEGER DEFAULT 7,
  last_regeneration_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraint for energy bounds using a trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION validate_energy_bounds()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_energy < 0 OR NEW.current_energy > NEW.max_energy THEN
    RAISE EXCEPTION 'current_energy must be between 0 and max_energy';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_energy_bounds
BEFORE INSERT OR UPDATE ON public.user_energy
FOR EACH ROW
EXECUTE FUNCTION validate_energy_bounds();

-- Enable RLS on user_energy
ALTER TABLE public.user_energy ENABLE ROW LEVEL SECURITY;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário')
  );
  
  -- Insert into user_energy
  INSERT INTO public.user_energy (user_id, current_energy, max_energy)
  VALUES (NEW.id, 7, 7);
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_energy_updated_at
  BEFORE UPDATE ON public.user_energy
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for challenges (everyone can read)
CREATE POLICY "Anyone can view challenges"
  ON public.challenges FOR SELECT
  USING (true);

-- RLS Policies for user_progress
CREATE POLICY "Users can view their own progress"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for user_energy
CREATE POLICY "Users can view their own energy"
  ON public.user_energy FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own energy"
  ON public.user_energy FOR UPDATE
  USING (auth.uid() = user_id);

-- Insert initial challenges
INSERT INTO public.challenges (title, description, difficulty, order_index, test_code, template_code, solution) VALUES
(
  'Soma de Dois Números',
  'Crie uma função que receba dois números e retorne a soma deles.',
  'beginner',
  1,
  'const result = soma(5, 3); if (result !== 8) throw new Error("Esperado 8, mas recebeu " + result);',
  'function soma(a, b) {\n  // Seu código aqui\n}',
  'function soma(a, b) {\n  return a + b;\n}'
),
(
  'Saudação Personalizada',
  'Crie uma função que receba um nome e retorne "Olá, <nome>".',
  'beginner',
  2,
  'const result = saudacao("Maria"); if (result !== "Olá, Maria") throw new Error("Esperado ''Olá, Maria'', mas recebeu " + result);',
  'function saudacao(nome) {\n  // Seu código aqui\n}',
  'function saudacao(nome) {\n  return `Olá, ${nome}`;\n}'
),
(
  'Maior Número do Array',
  'Crie uma função que receba um array de números e retorne o maior número.',
  'beginner',
  3,
  'const result = maiorNumero([1, 5, 3, 9, 2]); if (result !== 9) throw new Error("Esperado 9, mas recebeu " + result);',
  'function maiorNumero(numeros) {\n  // Seu código aqui\n}',
  'function maiorNumero(numeros) {\n  return Math.max(...numeros);\n}'
);