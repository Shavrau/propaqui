-- Adicionar campos de consentimento LGPD na tabela usuarios
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS consentimento_lgpd boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS data_consentimento timestamp with time zone,
ADD COLUMN IF NOT EXISTS versao_politica_privacidade text;

-- Adicionar coluna de consentimento na tabela log_acesso para rastrear se o usuário consentiu com o registro
ALTER TABLE public.log_acesso
ADD COLUMN IF NOT EXISTS consentido boolean DEFAULT true;

-- Criar função para limpar logs antigos (retenção de 2 anos conforme LGPD)
CREATE OR REPLACE FUNCTION public.limpar_logs_antigos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.log_acesso
  WHERE data_hora < NOW() - INTERVAL '2 years';
END;
$$;

-- Criar função para anonimizar CPF em logs antigos (após 1 ano)
CREATE OR REPLACE FUNCTION public.anonimizar_logs_antigos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.log_acesso
  SET cpf_usuario = '***.***.***-**'
  WHERE data_hora < NOW() - INTERVAL '1 year'
  AND cpf_usuario NOT LIKE '***%';
END;
$$;

-- Criar política RLS para usuários atualizarem seu próprio consentimento
CREATE POLICY "Usuários podem atualizar seu próprio consentimento"
ON public.usuarios
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);