-- ===============================================
-- FIX 1: Implement Secure Role Management System
-- ===============================================

-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Migrate existing role data from usuarios.perfil to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 
  CASE 
    WHEN perfil = 'admin' THEN 'admin'::app_role
    ELSE 'user'::app_role
  END
FROM public.usuarios;

-- Update the has_role security definer function to use user_roles table
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update get_user_perfil to use user_roles
CREATE OR REPLACE FUNCTION public.get_user_perfil(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
$$;

-- Update handle_new_user trigger to insert into user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_cpf text;
  user_role app_role;
BEGIN
  -- Validate and extract CPF
  user_cpf := new.raw_user_meta_data->>'cpf';
  
  -- Basic CPF validation (must be 11 digits)
  IF user_cpf IS NULL OR length(regexp_replace(user_cpf, '[^0-9]', '', 'g')) != 11 THEN
    RAISE EXCEPTION 'Invalid CPF format';
  END IF;
  
  -- Remove CPF formatting
  user_cpf := regexp_replace(user_cpf, '[^0-9]', '', 'g');
  
  -- Determine role (default to 'user')
  user_role := COALESCE((new.raw_user_meta_data->>'perfil')::app_role, 'user'::app_role);
  
  -- Insert into usuarios (keeping perfil for backward compatibility during transition)
  INSERT INTO public.usuarios (id, cpf, nome, email, perfil)
  VALUES (
    new.id,
    user_cpf,
    new.raw_user_meta_data->>'nome',
    new.email,
    user_role::text
  );
  
  -- Insert into user_roles (secure role storage)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, user_role);
  
  RETURN new;
END;
$$;

-- ===============================================
-- FIX 2: Add Server-Side Input Validation
-- ===============================================

-- Add CHECK constraints for area values in lotes table
ALTER TABLE public.lotes 
ADD CONSTRAINT lotes_area_total_valid 
CHECK (area_total > 0 AND area_total <= 1000000);

-- Add CHECK constraints for historico_construcao
ALTER TABLE public.historico_construcao
ADD CONSTRAINT historico_area_construida_valid
CHECK (area_construida >= 0 AND area_construida <= 1000000);

ALTER TABLE public.historico_construcao
ADD CONSTRAINT historico_area_demolida_valid
CHECK (area_demolida >= 0 AND area_demolida <= 1000000);

-- Add CHECK constraints for historico_alteracao_area
ALTER TABLE public.historico_alteracao_area
ADD CONSTRAINT historico_alteracao_area_anterior_valid
CHECK (area_anterior > 0 AND area_anterior <= 1000000);

ALTER TABLE public.historico_alteracao_area
ADD CONSTRAINT historico_alteracao_area_nova_valid
CHECK (area_nova > 0 AND area_nova <= 1000000);

-- Add length constraints for text fields
ALTER TABLE public.historico_alteracao_area
ADD CONSTRAINT historico_alteracao_motivo_length
CHECK (motivo IS NULL OR length(motivo) <= 1000);

-- Add length constraints for lotes text fields
ALTER TABLE public.lotes
ADD CONSTRAINT lotes_numero_iptu_length CHECK (length(numero_iptu) <= 50);

ALTER TABLE public.lotes
ADD CONSTRAINT lotes_numero_cadastro_length CHECK (length(numero_cadastro) <= 50);

ALTER TABLE public.lotes
ADD CONSTRAINT lotes_loteamento_length CHECK (length(loteamento) <= 100);

ALTER TABLE public.lotes
ADD CONSTRAINT lotes_quadra_length CHECK (length(quadra) <= 20);

ALTER TABLE public.lotes
ADD CONSTRAINT lotes_numero_lote_length CHECK (length(numero_lote) <= 20);

-- Add length constraints for usuarios
ALTER TABLE public.usuarios
ADD CONSTRAINT usuarios_cpf_length CHECK (length(cpf) = 11);

ALTER TABLE public.usuarios
ADD CONSTRAINT usuarios_nome_length CHECK (length(nome) >= 3 AND length(nome) <= 200);

-- Create index on user_roles for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);