-- 1. Make the lotes storage bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'lotes';

-- 2. Create RLS policies for authenticated access to lot images
CREATE POLICY "Authenticated users can view lot images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lotes' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Admins can upload lot images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lotes' AND
  public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update lot images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lotes' AND
  public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete lot images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lotes' AND
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- 3. Create proper CPF validation function with check digit verification
CREATE OR REPLACE FUNCTION public.validate_cpf(cpf text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
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

-- 4. Update the handle_new_user trigger to use proper CPF validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_cpf TEXT;
  user_nome TEXT;
  user_email TEXT;
BEGIN
  user_cpf := NEW.raw_user_meta_data->>'cpf';
  user_nome := NEW.raw_user_meta_data->>'nome';
  user_email := NEW.email;

  -- Validate CPF with check digits
  IF NOT public.validate_cpf(user_cpf) THEN
    RAISE EXCEPTION 'CPF inválido';
  END IF;

  -- Check if CPF already exists
  IF EXISTS (SELECT 1 FROM public.usuarios WHERE cpf = user_cpf) THEN
    RAISE EXCEPTION 'CPF já cadastrado';
  END IF;

  INSERT INTO public.usuarios (id, cpf, nome, email, perfil)
  VALUES (NEW.id, user_cpf, user_nome, user_email, 'usuario');

  RETURN NEW;
END;
$$;