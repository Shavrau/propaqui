-- Fix search_path for validate_cpf function to prevent security issues
CREATE OR REPLACE FUNCTION public.validate_cpf(cpf text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  sum1 int := 0;
  sum2 int := 0;
  dv1 int;
  dv2 int;
  cleaned_cpf text;
BEGIN
  -- Remove non-digits and check length
  cleaned_cpf := regexp_replace(cpf, '[^0-9]', '', 'g');
  IF length(cleaned_cpf) != 11 THEN
    RETURN false;
  END IF;
  
  -- Reject known invalid sequences (all same digits)
  IF cleaned_cpf IN ('00000000000', '11111111111', '22222222222', '33333333333',
             '44444444444', '55555555555', '66666666666', '77777777777',
             '88888888888', '99999999999') THEN
    RETURN false;
  END IF;
  
  -- Calculate first check digit
  FOR i IN 0..8 LOOP
    sum1 := sum1 + (substring(cleaned_cpf, i+1, 1)::int * (10-i));
  END LOOP;
  dv1 := 11 - (sum1 % 11);
  IF dv1 >= 10 THEN dv1 := 0; END IF;
  
  -- Calculate second check digit
  FOR i IN 0..9 LOOP
    sum2 := sum2 + (substring(cleaned_cpf, i+1, 1)::int * (11-i));
  END LOOP;
  dv2 := 11 - (sum2 % 11);
  IF dv2 >= 10 THEN dv2 := 0; END IF;
  
  -- Verify check digits match
  RETURN (substring(cleaned_cpf, 10, 1)::int = dv1) AND (substring(cleaned_cpf, 11, 1)::int = dv2);
END;
$$;