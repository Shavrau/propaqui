-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON public.usuarios;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.usuarios;

-- Create security definer function to check user profile
CREATE OR REPLACE FUNCTION public.get_user_perfil(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT perfil FROM public.usuarios WHERE id = _user_id;
$$;

-- Create new policies using the security definer function
CREATE POLICY "Usuários podem ver seu próprio perfil" 
ON public.usuarios 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins podem ver todos os perfis" 
ON public.usuarios 
FOR SELECT 
USING (public.get_user_perfil(auth.uid()) = 'admin');