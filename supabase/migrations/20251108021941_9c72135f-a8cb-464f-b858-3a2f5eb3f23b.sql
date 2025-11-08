-- ===============================================
-- Fix Incomplete Role Management Migration
-- Update all RLS policies to use has_role() function
-- ===============================================

-- Fix log_acesso policies
DROP POLICY IF EXISTS "Admins podem ler todos os logs" ON public.log_acesso;
CREATE POLICY "Admins podem ler todos os logs"
ON public.log_acesso
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Fix historico_construcao policies
DROP POLICY IF EXISTS "Admins podem atualizar históricos" ON public.historico_construcao;
CREATE POLICY "Admins podem atualizar históricos"
ON public.historico_construcao
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins podem criar históricos" ON public.historico_construcao;
CREATE POLICY "Admins podem criar históricos"
ON public.historico_construcao
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins podem deletar históricos" ON public.historico_construcao;
CREATE POLICY "Admins podem deletar históricos"
ON public.historico_construcao
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Fix lotes policies
DROP POLICY IF EXISTS "Admins podem atualizar lotes" ON public.lotes;
CREATE POLICY "Admins podem atualizar lotes"
ON public.lotes
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins podem criar lotes" ON public.lotes;
CREATE POLICY "Admins podem criar lotes"
ON public.lotes
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins podem deletar lotes" ON public.lotes;
CREATE POLICY "Admins podem deletar lotes"
ON public.lotes
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));