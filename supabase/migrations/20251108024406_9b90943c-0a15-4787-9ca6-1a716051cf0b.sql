-- Fix recursive RLS policy on user_roles table
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix inconsistent role check in historico_alteracao_area
DROP POLICY IF EXISTS "Admins podem criar histórico de alterações" ON public.historico_alteracao_area;

CREATE POLICY "Admins podem criar histórico de alterações"
ON public.historico_alteracao_area
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix overly permissive log_acesso policy that exposes CPF data
DROP POLICY IF EXISTS "Todos os usuários autenticados podem ler histórico de altera" ON public.log_acesso;

-- Note: Admin-only policy already exists, so no need to create a new one