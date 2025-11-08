-- Remove duplicate insecure storage policies that check usuarios.perfil
-- These old policies allow authorization bypass since they don't use has_role()

DROP POLICY IF EXISTS "Admins podem fazer upload de imagens" ON storage.objects;
DROP POLICY IF EXISTS "Admins podem deletar imagens" ON storage.objects;
DROP POLICY IF EXISTS "Qualquer pessoa autenticada pode visualizar imagens" ON storage.objects;

-- Only the secure policies remain:
-- ✓ 'Admins can upload lot images' (uses has_role)
-- ✓ 'Admins can update lot images' (uses has_role)
-- ✓ 'Admins can delete lot images' (uses has_role)
-- ✓ 'Authenticated users can view lot images' (uses auth.role)