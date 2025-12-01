-- Permitir que usuários vejam seus próprios logs de acesso
CREATE POLICY "Usuários podem ver seus próprios logs"
ON public.log_acesso
FOR SELECT
USING (
  cpf_usuario = (
    SELECT cpf FROM public.usuarios WHERE id = auth.uid()
  )
);

-- Permitir que usuários anonimizem seus próprios logs (update para mascarar CPF)
CREATE POLICY "Usuários podem anonimizar seus próprios logs"
ON public.log_acesso
FOR UPDATE
USING (
  cpf_usuario = (
    SELECT cpf FROM public.usuarios WHERE id = auth.uid()
  )
)
WITH CHECK (
  cpf_usuario = '***.***.***-**'
);