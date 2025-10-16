-- ============================================
-- Configuração do Supabase Storage Bucket
-- ============================================
-- IMPORTANTE: Execute este SQL diretamente no SQL Editor do Supabase
-- Não pode ser executado via Prisma Migrate
-- ============================================

-- 1. Criar o bucket 'profiles' (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'profiles'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'profiles',
      'profiles',
      false,
      524288000,
      ARRAY['application/zip', 'application/x-zip-compressed', 'application/octet-stream']
    );
    RAISE NOTICE 'Bucket "profiles" criado com sucesso!';
  ELSE
    RAISE NOTICE 'Bucket "profiles" já existe.';
  END IF;
END $$;

-- 2. Limpar políticas antigas (se existirem)
DROP POLICY IF EXISTS "Service role has full access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- 3. Criar política: Service role tem acesso total
CREATE POLICY "Service role has full access"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'profiles')
WITH CHECK (bucket_id = 'profiles');

-- 4. Criar política: Usuários autenticados podem ler
CREATE POLICY "Authenticated users can read"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'profiles');

-- 5. Criar política: Usuários autenticados podem fazer upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profiles');

-- 6. Criar política: Usuários autenticados podem deletar
CREATE POLICY "Authenticated users can delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profiles');

-- ============================================
-- Verificação
-- ============================================

-- Verificar se o bucket foi criado
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'profiles';

-- Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%profiles%'
ORDER BY policyname;
