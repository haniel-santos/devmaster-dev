-- Add points column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create energy_purchases table for future monetization
CREATE TABLE IF NOT EXISTS public.energy_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_value INTEGER NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add module_name to challenges table
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS module_name TEXT DEFAULT 'Módulo 1: Lógica de Programação';

-- Add is_practice flag to challenges
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS is_practice BOOLEAN DEFAULT false;

-- Enable RLS on new tables
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements (public read)
CREATE POLICY "Anyone can view achievements"
  ON public.achievements
  FOR SELECT
  USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON public.user_achievements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for energy_purchases
CREATE POLICY "Users can view their own purchases"
  ON public.energy_purchases
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases"
  ON public.energy_purchases
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Insert initial achievements
INSERT INTO public.achievements (name, description, icon, requirement_type, requirement_value) VALUES
  ('Primeiros Passos', 'Complete seu primeiro desafio', '🎯', 'challenges_completed', 1),
  ('Persistente', 'Faça 10 tentativas', '💪', 'total_attempts', 10),
  ('Sábio', 'Complete 5 desafios sem erros', '🧠', 'perfect_challenges', 5),
  ('Começou a Jornada', 'Atinja o nível 2', '🚀', 'level_reached', 2),
  ('Lendário', 'Mantenha energia máxima por 3 dias', '👑', 'max_energy_streak', 3)
ON CONFLICT DO NOTHING;

-- Function to update user level based on points
CREATE OR REPLACE FUNCTION public.update_user_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.level := FLOOR(NEW.points / 100) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to automatically update level when points change
DROP TRIGGER IF EXISTS update_level_on_points_change ON public.profiles;
CREATE TRIGGER update_level_on_points_change
  BEFORE UPDATE OF points ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_level();

-- Insert additional challenges for all 5 modules
INSERT INTO public.challenges (title, description, difficulty, order_index, template_code, test_code, solution, module_name) VALUES
  -- Módulo 1: Lógica de Programação (existing 3 + 2 more)
  ('Verificar Paridade', 'Crie uma função que retorna true se o número for par', 'beginner', 4, 'function isPar(num) {\n  // seu código aqui\n}', 'const result = isPar(4);\nif (result === true && isPar(5) === false) {\n  return true;\n}\nthrow new Error("Teste falhou");', 'function isPar(num) {\n  return num % 2 === 0;\n}', 'Módulo 1: Lógica de Programação'),
  ('Tabuada', 'Crie uma função que retorna um array com a tabuada de um número', 'beginner', 5, 'function tabuada(num) {\n  // seu código aqui\n}', 'const result = tabuada(5);\nif (result.length === 10 && result[0] === 5 && result[9] === 50) {\n  return true;\n}\nthrow new Error("Teste falhou");', 'function tabuada(num) {\n  return Array.from({length: 10}, (_, i) => num * (i + 1));\n}', 'Módulo 1: Lógica de Programação'),
  
  -- Módulo 2: Arrays
  ('Dobrar Valores', 'Crie uma função que dobra todos os valores de um array', 'beginner', 6, 'function dobrarValores(arr) {\n  // seu código aqui\n}', 'const result = dobrarValores([1, 2, 3]);\nif (JSON.stringify(result) === "[2,4,6]") {\n  return true;\n}\nthrow new Error("Teste falhou");', 'function dobrarValores(arr) {\n  return arr.map(x => x * 2);\n}', 'Módulo 2: Arrays'),
  ('Filtrar Pares', 'Crie uma função que retorna apenas números pares de um array', 'beginner', 7, 'function filtrarPares(arr) {\n  // seu código aqui\n}', 'const result = filtrarPares([1, 2, 3, 4, 5]);\nif (JSON.stringify(result) === "[2,4]") {\n  return true;\n}\nthrow new Error("Teste falhou");', 'function filtrarPares(arr) {\n  return arr.filter(x => x % 2 === 0);\n}', 'Módulo 2: Arrays'),
  ('Soma de Array', 'Crie uma função que soma todos os valores de um array', 'beginner', 8, 'function somaArray(arr) {\n  // seu código aqui\n}', 'const result = somaArray([1, 2, 3, 4]);\nif (result === 10) {\n  return true;\n}\nthrow new Error("Teste falhou");', 'function somaArray(arr) {\n  return arr.reduce((a, b) => a + b, 0);\n}', 'Módulo 2: Arrays'),
  ('Ordenar Array', 'Crie uma função que ordena um array de números', 'beginner', 9, 'function ordenarArray(arr) {\n  // seu código aqui\n}', 'const result = ordenarArray([3, 1, 4, 2]);\nif (JSON.stringify(result) === "[1,2,3,4]") {\n  return true;\n}\nthrow new Error("Teste falhou");', 'function ordenarArray(arr) {\n  return arr.sort((a, b) => a - b);\n}', 'Módulo 2: Arrays'),
  ('Remover Duplicados', 'Crie uma função que remove duplicados de um array', 'intermediate', 10, 'function removerDuplicados(arr) {\n  // seu código aqui\n}', 'const result = removerDuplicados([1, 2, 2, 3, 3, 3]);\nif (JSON.stringify(result) === "[1,2,3]") {\n  return true;\n}\nthrow new Error("Teste falhou");', 'function removerDuplicados(arr) {\n  return [...new Set(arr)];\n}', 'Módulo 2: Arrays'),
  
  -- Módulo 3: Funções
  ('Função Anônima', 'Crie uma arrow function que multiplica dois números', 'beginner', 11, 'const multiplicar = // seu código aqui', 'const result = multiplicar(3, 4);\nif (result === 12) {\n  return true;\n}\nthrow new Error("Teste falhou");', 'const multiplicar = (a, b) => a * b;', 'Módulo 3: Funções'),
  ('Callback Function', 'Crie uma função que executa um callback após 0ms', 'intermediate', 12, 'function executarCallback(callback) {\n  // seu código aqui\n}', 'let testValue = 0;\nexecutarCallback(() => { testValue = 42; });\nsetTimeout(() => {\n  if (testValue === 42) return true;\n  throw new Error("Teste falhou");\n}, 10);', 'function executarCallback(callback) {\n  setTimeout(callback, 0);\n}', 'Módulo 3: Funções'),
  ('Closure', 'Crie uma função que retorna outra função incrementadora', 'intermediate', 13, 'function criarContador() {\n  // seu código aqui\n}', 'const contador = criarContador();\nif (contador() === 1 && contador() === 2) {\n  return true;\n}\nthrow new Error("Teste falhou");', 'function criarContador() {\n  let count = 0;\n  return () => ++count;\n}', 'Módulo 3: Funções'),
  ('Higher Order Function', 'Crie uma função que aplica outra função a cada elemento', 'intermediate', 14, 'function aplicarFuncao(arr, fn) {\n  // seu código aqui\n}', 'const result = aplicarFuncao([1, 2, 3], x => x * 2);\nif (JSON.stringify(result) === "[2,4,6]") {\n  return true;\n}\nthrow new Error("Teste falhou");', 'function aplicarFuncao(arr, fn) {\n  return arr.map(fn);\n}', 'Módulo 3: Funções'),
  ('Currying', 'Crie uma função curried para multiplicação', 'advanced', 15, 'function multiplicarCurried(a) {\n  // seu código aqui\n}', 'const result = multiplicarCurried(5)(4);\nif (result === 20) {\n  return true;\n}\nthrow new Error("Teste falhou");', 'function multiplicarCurried(a) {\n  return (b) => a * b;\n}', 'Módulo 3: Funções'),
  
  -- Módulo 4: Objetos
  ('Criar Objeto', 'Crie uma função que retorna um objeto pessoa com nome e idade', 'beginner', 16, 'function criarPessoa(nome, idade) {\n  // seu código aqui\n}', 'const result = criarPessoa("João", 25);\nif (result.nome === "João" && result.idade === 25) {\n  return true;\n}\nthrow new Error("Teste falhou");', 'function criarPessoa(nome, idade) {\n  return { nome, idade };\n}', 'Módulo 4: Objetos'),
  ('Acessar Propriedades', 'Crie uma função que retorna o valor de uma propriedade', 'beginner', 17, 'function getProp(obj, key) {\n  // seu código aqui\n}', 'const result = getProp({a: 1, b: 2}, "a");\nif (result === 1) {\n  return true;\n}\nthrow new Error("Teste falhou");', 'function getProp(obj, key) {\n  return obj[key];\n}', 'Módulo 4: Objetos'),
  ('Mesclar Objetos', 'Crie uma função que mescla dois objetos', 'intermediate', 18, 'function mesclarObjetos(obj1, obj2) {\n  // seu código aqui\n}', 'const result = mesclarObjetos({a: 1}, {b: 2});\nif (result.a === 1 && result.b === 2) {\n  return true;\n}\nthrow new Error("Teste falhou");', 'function mesclarObjetos(obj1, obj2) {\n  return {...obj1, ...obj2};\n}', 'Módulo 4: Objetos'),
  ('Contar Propriedades', 'Crie uma função que conta as propriedades de um objeto', 'beginner', 19, 'function contarProps(obj) {\n  // seu código aqui\n}', 'const result = contarProps({a: 1, b: 2, c: 3});\nif (result === 3) {\n  return true;\n}\nthrow new Error("Teste falhou");', 'function contarProps(obj) {\n  return Object.keys(obj).length;\n}', 'Módulo 4: Objetos'),
  ('Destruturação', 'Use destruturação para extrair nome e idade', 'intermediate', 20, 'function extrairDados(pessoa) {\n  // use destruturação aqui\n  // retorne {nome, idade}\n}', 'const result = extrairDados({nome: "Ana", idade: 30});\nif (result.nome === "Ana" && result.idade === 30) {\n  return true;\n}\nthrow new Error("Teste falhou");', 'function extrairDados(pessoa) {\n  const {nome, idade} = pessoa;\n  return {nome, idade};\n}', 'Módulo 4: Objetos'),
  
  -- Módulo 5: Mini-projetos JS
  ('Calculadora', 'Crie uma função calculadora que aceita operação e números', 'intermediate', 21, 'function calculadora(op, a, b) {\n  // seu código aqui\n}', 'if (calculadora("+", 5, 3) === 8 && calculadora("*", 4, 2) === 8) {\n  return true;\n}\nthrow new Error("Teste falhou");', 'function calculadora(op, a, b) {\n  if (op === "+") return a + b;\n  if (op === "*") return a * b;\n  return 0;\n}', 'Módulo 5: Mini-projetos JS'),
  ('Validar Email', 'Crie uma função que valida se um email é válido', 'intermediate', 22, 'function validarEmail(email) {\n  // seu código aqui\n}', 'if (validarEmail("test@email.com") && !validarEmail("invalid")) {\n  return true;\n}\nthrow new Error("Teste falhou");', 'function validarEmail(email) {\n  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);\n}', 'Módulo 5: Mini-projetos JS'),
  ('Contador de Palavras', 'Crie uma função que conta palavras em um texto', 'beginner', 23, 'function contarPalavras(texto) {\n  // seu código aqui\n}', 'if (contarPalavras("olá mundo") === 2) {\n  return true;\n}\nthrow new Error("Teste falhou");', 'function contarPalavras(texto) {\n  return texto.split(" ").length;\n}', 'Módulo 5: Mini-projetos JS'),
  ('Inverter String', 'Crie uma função que inverte uma string', 'beginner', 24, 'function inverterString(str) {\n  // seu código aqui\n}', 'if (inverterString("hello") === "olleh") {\n  return true;\n}\nthrow new Error("Teste falhou");', 'function inverterString(str) {\n  return str.split("").reverse().join("");\n}', 'Módulo 5: Mini-projetos JS'),
  ('FizzBuzz', 'Implemente o clássico FizzBuzz para números 1-15', 'intermediate', 25, 'function fizzBuzz() {\n  // retorne array com resultado\n}', 'const result = fizzBuzz();\nif (result[2] === "Fizz" && result[4] === "Buzz" && result[14] === "FizzBuzz") {\n  return true;\n}\nthrow new Error("Teste falhou");', 'function fizzBuzz() {\n  return Array.from({length: 15}, (_, i) => {\n    const n = i + 1;\n    if (n % 15 === 0) return "FizzBuzz";\n    if (n % 3 === 0) return "Fizz";\n    if (n % 5 === 0) return "Buzz";\n    return String(n);\n  });\n}', 'Módulo 5: Mini-projetos JS')
ON CONFLICT DO NOTHING;