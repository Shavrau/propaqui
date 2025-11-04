-- Criar tabela de perfis de usuário (integrada com auth.users)
create table public.usuarios (
  id uuid references auth.users on delete cascade primary key,
  cpf varchar(14) unique not null,
  nome varchar(255) not null,
  email varchar(255),
  perfil varchar(20) not null default 'usuario' check (perfil in ('admin', 'usuario')),
  created_at timestamp with time zone default now()
);

-- Habilitar RLS na tabela usuarios
alter table public.usuarios enable row level security;

-- Políticas RLS para usuarios
create policy "Usuários podem ver seu próprio perfil"
  on public.usuarios for select
  using (auth.uid() = id);

create policy "Admins podem ver todos os perfis"
  on public.usuarios for select
  using (
    exists (
      select 1 from public.usuarios
      where id = auth.uid() and perfil = 'admin'
    )
  );

-- Criar tabela de lotes
create table public.lotes (
  id uuid default gen_random_uuid() primary key,
  numero_iptu varchar(20) unique not null,
  numero_cadastro varchar(50) unique not null,
  loteamento varchar(255) not null,
  quadra varchar(50) not null,
  numero_lote varchar(50) not null,
  area_total decimal(10, 2) not null,
  imagens text[],
  created_by uuid references public.usuarios(id) not null,
  created_at timestamp with time zone default now()
);

-- Habilitar RLS na tabela lotes
alter table public.lotes enable row level security;

-- Políticas RLS para lotes
create policy "Todos os usuários autenticados podem ler lotes"
  on public.lotes for select
  using (auth.role() = 'authenticated');

create policy "Admins podem criar lotes"
  on public.lotes for insert
  with check (
    exists (
      select 1 from public.usuarios
      where id = auth.uid() and perfil = 'admin'
    )
  );

create policy "Admins podem atualizar lotes"
  on public.lotes for update
  using (
    exists (
      select 1 from public.usuarios
      where id = auth.uid() and perfil = 'admin'
    )
  );

create policy "Admins podem deletar lotes"
  on public.lotes for delete
  using (
    exists (
      select 1 from public.usuarios
      where id = auth.uid() and perfil = 'admin'
    )
  );

-- Criar tabela de histórico de construção
create table public.historico_construcao (
  id uuid default gen_random_uuid() primary key,
  lote_id uuid references public.lotes(id) on delete cascade not null,
  area_construida decimal(10, 2) not null,
  area_demolida decimal(10, 2) default 0,
  data_aprovacao date not null,
  created_at timestamp with time zone default now()
);

-- Habilitar RLS na tabela historico_construcao
alter table public.historico_construcao enable row level security;

-- Políticas RLS para historico_construcao
create policy "Todos os usuários autenticados podem ler históricos"
  on public.historico_construcao for select
  using (auth.role() = 'authenticated');

create policy "Admins podem criar históricos"
  on public.historico_construcao for insert
  with check (
    exists (
      select 1 from public.usuarios
      where id = auth.uid() and perfil = 'admin'
    )
  );

create policy "Admins podem atualizar históricos"
  on public.historico_construcao for update
  using (
    exists (
      select 1 from public.usuarios
      where id = auth.uid() and perfil = 'admin'
    )
  );

create policy "Admins podem deletar históricos"
  on public.historico_construcao for delete
  using (
    exists (
      select 1 from public.usuarios
      where id = auth.uid() and perfil = 'admin'
    )
  );

-- Criar tabela de log de acesso
create table public.log_acesso (
  id uuid default gen_random_uuid() primary key,
  cpf_usuario varchar(14) not null,
  lote_id uuid references public.lotes(id) on delete cascade not null,
  data_hora timestamp with time zone default now()
);

-- Habilitar RLS na tabela log_acesso
alter table public.log_acesso enable row level security;

-- Políticas RLS para log_acesso
create policy "Todos os usuários autenticados podem criar logs"
  on public.log_acesso for insert
  with check (auth.role() = 'authenticated');

create policy "Admins podem ler todos os logs"
  on public.log_acesso for select
  using (
    exists (
      select 1 from public.usuarios
      where id = auth.uid() and perfil = 'admin'
    )
  );

-- Criar bucket de storage para imagens dos lotes
insert into storage.buckets (id, name, public)
values ('lotes', 'lotes', true);

-- Políticas de storage para o bucket lotes
create policy "Qualquer pessoa autenticada pode visualizar imagens"
  on storage.objects for select
  using (bucket_id = 'lotes' and auth.role() = 'authenticated');

create policy "Admins podem fazer upload de imagens"
  on storage.objects for insert
  with check (
    bucket_id = 'lotes' and
    exists (
      select 1 from public.usuarios
      where id = auth.uid() and perfil = 'admin'
    )
  );

create policy "Admins podem deletar imagens"
  on storage.objects for delete
  using (
    bucket_id = 'lotes' and
    exists (
      select 1 from public.usuarios
      where id = auth.uid() and perfil = 'admin'
    )
  );

-- Criar função para criar perfil de usuário automaticamente
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.usuarios (id, cpf, nome, email, perfil)
  values (
    new.id,
    new.raw_user_meta_data->>'cpf',
    new.raw_user_meta_data->>'nome',
    new.email,
    coalesce(new.raw_user_meta_data->>'perfil', 'usuario')
  );
  return new;
end;
$$;

-- Criar trigger para executar a função ao criar novo usuário
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();