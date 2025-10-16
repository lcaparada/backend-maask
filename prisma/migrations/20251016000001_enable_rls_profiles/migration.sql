-- Habilitar Row Level Security na tabela profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Service role has full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read their own profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can update their own profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can delete their own profiles" ON profiles;

-- Política: Service role tem acesso total (API backend)
CREATE POLICY "Service role has full access to profiles"
ON profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Política: Usuários autenticados podem ler todos os profiles
CREATE POLICY "Authenticated users can read their own profiles"
ON profiles
FOR SELECT
TO authenticated
USING (true);

-- Política: Usuários autenticados podem inserir profiles
CREATE POLICY "Authenticated users can insert profiles"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política: Usuários autenticados podem atualizar profiles
CREATE POLICY "Authenticated users can update their own profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política: Usuários autenticados podem deletar profiles
CREATE POLICY "Authenticated users can delete their own profiles"
ON profiles
FOR DELETE
TO authenticated
USING (true);
