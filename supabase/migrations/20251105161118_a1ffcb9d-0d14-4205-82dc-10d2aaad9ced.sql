-- Create table for area change history
CREATE TABLE public.historico_alteracao_area (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lote_id UUID NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
  area_anterior NUMERIC NOT NULL,
  area_nova NUMERIC NOT NULL,
  motivo TEXT,
  alterado_por UUID NOT NULL REFERENCES public.usuarios(id),
  data_alteracao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.historico_alteracao_area ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Todos os usuários autenticados podem ler histórico de alterações" 
ON public.historico_alteracao_area 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins podem criar histórico de alterações" 
ON public.historico_alteracao_area 
FOR INSERT 
WITH CHECK (public.get_user_perfil(auth.uid()) = 'admin');

-- Create index for better performance
CREATE INDEX idx_historico_alteracao_area_lote_id ON public.historico_alteracao_area(lote_id);
CREATE INDEX idx_historico_alteracao_area_data ON public.historico_alteracao_area(data_alteracao DESC);