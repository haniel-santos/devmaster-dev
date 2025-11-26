-- Fix search_path for validate_energy_bounds function
CREATE OR REPLACE FUNCTION validate_energy_bounds()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.current_energy < 0 OR NEW.current_energy > NEW.max_energy THEN
    RAISE EXCEPTION 'current_energy must be between 0 and max_energy';
  END IF;
  RETURN NEW;
END;
$$;

-- Fix search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;