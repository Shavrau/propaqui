-- Adicionar coluna para consentimento específico de logs
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS consentimento_logs boolean DEFAULT false;

-- Atualizar trigger para incluir consentimento de logs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_cpf TEXT;
  user_nome TEXT;
  user_email TEXT;
  user_consentimento_lgpd BOOLEAN;
  user_consentimento_logs BOOLEAN;
  user_versao_politica TEXT;
BEGIN
  user_cpf := NEW.raw_user_meta_data->>'cpf';
  user_nome := NEW.raw_user_meta_data->>'nome';
  user_email := NEW.email;
  user_consentimento_lgpd := COALESCE((NEW.raw_user_meta_data->>'consentimento_lgpd')::boolean, false);
  user_consentimento_logs := COALESCE((NEW.raw_user_meta_data->>'consentimento_logs')::boolean, false);
  user_versao_politica := NEW.raw_user_meta_data->>'versao_politica';

  -- Validate CPF with check digits
  IF NOT public.validate_cpf(user_cpf) THEN
    RAISE EXCEPTION 'CPF inválido';
  END IF;

  -- Check if CPF already exists
  IF EXISTS (SELECT 1 FROM public.usuarios WHERE cpf = user_cpf) THEN
    RAISE EXCEPTION 'CPF já cadastrado';
  END IF;

  INSERT INTO public.usuarios (id, cpf, nome, email, perfil, consentimento_lgpd, consentimento_logs, data_consentimento, versao_politica_privacidade)
  VALUES (NEW.id, user_cpf, user_nome, user_email, 'usuario', user_consentimento_lgpd, user_consentimento_logs, NOW(), user_versao_politica);

  RETURN NEW;
END;
$$;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();