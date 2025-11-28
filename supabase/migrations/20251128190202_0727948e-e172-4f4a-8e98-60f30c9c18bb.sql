-- Add hints column to challenges table
ALTER TABLE public.challenges
ADD COLUMN hints text[] DEFAULT '{}';

-- Update existing challenges with sample hints
UPDATE public.challenges
SET hints = ARRAY[
  'Lembre-se de declarar a função com a palavra-chave function',
  'Use a sintaxe: function nomeFuncao(parametros) { return resultado; }',
  'Teste sua função com diferentes valores antes de submeter'
]
WHERE hints = '{}' OR hints IS NULL;