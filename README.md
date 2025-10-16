# 🔐 Maask Backend - API de Gerenciamento de Perfis de Navegador

API backend em Node.js + TypeScript para gerenciamento seguro de perfis de navegador Chromium com criptografia AES-256-GCM e armazenamento no Supabase.

## 📋 Índice

- [Características](#-características)
- [Tecnologias](#-tecnologias)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração do Supabase](#-configuração-do-supabase)
- [Uso](#-uso)
- [API Endpoints](#-api-endpoints)
- [Testes com curl](#-testes-com-curl)
- [Arquitetura](#-arquitetura)
- [Segurança](#-segurança)

## ✨ Características

- ✅ Upload de perfis de navegador (arquivos ZIP até 500MB)
- ✅ Criptografia AES-256-GCM em repouso
- ✅ Streaming de arquivos (sem buffers em memória)
- ✅ Autenticação Bearer Token
- ✅ Download com descriptografia automática
- ✅ URLs assinadas com expiração
- ✅ Metadados completos (nome, tamanho, datas)
- ✅ Documentação Swagger interativa
- ✅ Integração com Supabase Storage e Database

## 🛠 Tecnologias

- **Node.js** - Runtime JavaScript
- **TypeScript** - Linguagem tipada
- **Fastify** - Framework web de alta performance
- **Supabase** - Backend as a Service (Storage + PostgreSQL)
- **Prisma** - ORM moderno com type-safety completo
- **Zod** - Validação de schemas
- **AES-256-GCM** - Criptografia autenticada

## 📦 Pré-requisitos

- Node.js >= 18
- npm ou yarn
- Conta no Supabase (gratuita)

## 🚀 Instalação

1. **Clone o repositório**

```bash
git clone <seu-repositorio>
cd backend-maask
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure as variáveis de ambiente**

```bash
cp env.example .env
```

Edite o arquivo `.env` e configure:

```env
# Server
PORT=3333
HOST=0.0.0.0

# Supabase (obtenha em https://app.supabase.com)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-service-role-key  # ⚠️ Use SERVICE ROLE KEY (não anon key!)
SUPABASE_BUCKET=profiles

# Database (Prisma)
DATABASE_URL=postgresql://postgres.PROJECT:PASSWORD@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres

# Security
BEARER_TOKEN=mock-token
ENCRYPTION_KEY=sua-chave-de-32-caracteres-ou-mais
```

**Gere uma chave de criptografia segura:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 🗄 Configuração do Supabase

### 1. Criar Projeto no Supabase

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Crie um novo projeto
3. Obtenha as credenciais:
   - **Project URL**: Settings → API → Project URL
   - **service_role key**: Settings → API → service_role (secret) ⚠️
   - **Database URLs**: Settings → Database → Connection string

⚠️ **IMPORTANTE**: Use **service_role key**, NÃO a anon key!

### 2. Criar Bucket de Storage

**Execute o SQL no SQL Editor:**

```bash
# Veja o arquivo: prisma/seed-storage.sql
# Ou siga: BUCKET_SETUP.md
```

Isso criará:

- ✅ Bucket `profiles` (privado)
- ✅ Políticas RLS para service_role
- ✅ Limite de 500MB por arquivo

### 3. Criar Tabela no Database

**Opção 1: Usando Prisma Migrate (Recomendado)**

```bash
# Configure DATABASE_URL e DIRECT_URL no .env
npm run db:migrate
```

✅ Cria automaticamente:

- Tabela `profiles` com todos os campos
- Índices otimizados
- Trigger de updated_at
- RLS habilitado com políticas de segurança

**Opção 2: SQL Manual**

Execute o SQL abaixo no **SQL Editor** do Supabase:

```sql
-- Criar tabela de profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  size BIGINT NOT NULL,
  encrypted_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
```

## 🎯 Uso

### Modo de Desenvolvimento

```bash
npm run dev
```

### Modo de Produção

```bash
# Build
npm run build

# Start
npm start

# Ou tudo de uma vez (com migrations)
npm run start:prod
```

O servidor iniciará em `http://localhost:3333`

**Acesse a documentação Swagger em:** `http://localhost:3333/docs`

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev                  # Inicia servidor com hot-reload

# Produção
npm run build                # Compila TypeScript
npm start                    # Inicia servidor compilado
npm run start:prod           # Gera Prisma Client + Migrations + Start

# Database (Prisma)
npm run db:migrate           # Criar/aplicar migration (dev)
npm run db:migrate:deploy    # Aplicar migrations (produção)
npm run db:migrate:status    # Ver status das migrations
npm run db:migrate:reset     # Resetar banco (cuidado!)
npm run db:studio            # Abrir Prisma Studio (GUI)
npm run db:generate          # Gerar Prisma Client
npm run db:push              # Push schema sem migration
```

## 📡 API Endpoints

Todas as rotas (exceto `/health`) requerem autenticação Bearer token no header:

```
Authorization: Bearer mock-token
```

### 1. Health Check

```
GET /health
```

Verifica se a API está funcionando.

**Resposta:**

```json
{
  "status": "ok",
  "timestamp": "2025-10-15T12:00:00.000Z"
}
```

---

### 2. Upload de Profile

```
POST /profiles/upload
```

Faz upload de um arquivo ZIP de perfil de navegador. O arquivo será criptografado automaticamente.

**Headers:**

- `Authorization: Bearer mock-token`
- `Content-Type: multipart/form-data`

**Body (form-data):**

- `file`: arquivo ZIP (máx 500MB)

**Resposta (201):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "meu-perfil",
  "original_name": "meu-perfil.zip",
  "size": 12345678,
  "encrypted_size": 12346000,
  "storage_path": "profiles/550e8400-e29b-41d4-a716-446655440000.enc",
  "created_at": "2025-10-15T12:00:00.000Z",
  "updated_at": "2025-10-15T12:00:00.000Z"
}
```

---

### 3. Download de Profile

```
GET /profiles/:id/download?decrypt=true
```

Faz download de um perfil. Por padrão, descriptografa o arquivo.

**Headers:**

- `Authorization: Bearer mock-token`

**Query Parameters:**

- `decrypt` (opcional): `true` | `false` (padrão: `true`)

**Resposta:**

- Stream do arquivo ZIP (descriptografado ou criptografado)

---

### 4. URL de Download Assinada

```
GET /profiles/:id/download-url?expiresIn=3600
```

Gera uma URL assinada temporária para download direto (arquivo criptografado).

**Headers:**

- `Authorization: Bearer mock-token`

**Query Parameters:**

- `expiresIn` (opcional): tempo em segundos (padrão: 3600)

**Resposta:**

```json
{
  "url": "https://seu-projeto.supabase.co/storage/v1/object/sign/profiles/...",
  "expiresIn": 3600
}
```

---

### 5. Consultar Metadados

```
GET /profiles/:id/meta
```

Retorna apenas os metadados de um perfil (sem download).

**Headers:**

- `Authorization: Bearer mock-token`

**Resposta:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "meu-perfil",
  "original_name": "meu-perfil.zip",
  "size": 12345678,
  "encrypted_size": 12346000,
  "created_at": "2025-10-15T12:00:00.000Z",
  "updated_at": "2025-10-15T12:00:00.000Z"
}
```

---

### 6. Listar Profiles

```
GET /profiles?page=1&limit=10
```

Lista todos os perfis com paginação.

**Headers:**

- `Authorization: Bearer mock-token`

**Query Parameters:**

- `page` (opcional): número da página (padrão: 1)
- `limit` (opcional): itens por página (padrão: 10)

**Resposta:**

```json
{
  "profiles": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "meu-perfil",
      "original_name": "meu-perfil.zip",
      "size": 12345678,
      "encrypted_size": 12346000,
      "storage_path": "profiles/550e8400-e29b-41d4-a716-446655440000.enc",
      "created_at": "2025-10-15T12:00:00.000Z",
      "updated_at": "2025-10-15T12:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

---

### 7. Deletar Profile

```
DELETE /profiles/:id
```

Deleta um perfil (arquivo e metadados).

**Headers:**

- `Authorization: Bearer mock-token`

**Resposta:**

- Status 204 (No Content)

---

## 🧪 Testes com curl

### 1. Health Check

```bash
curl http://localhost:3333/health
```

### 2. Upload de Profile

```bash
# Crie um arquivo ZIP de teste
zip -r test-profile.zip ~/Library/Application\ Support/Google/Chrome/Default

# Faça o upload
curl -X POST http://localhost:3333/profiles/upload \
  -H "Authorization: Bearer mock-token" \
  -F "file=@test-profile.zip"
```

### 3. Listar Profiles

```bash
curl http://localhost:3333/profiles \
  -H "Authorization: Bearer mock-token"
```

### 4. Consultar Metadados

```bash
# Substitua <ID> pelo ID retornado no upload
curl http://localhost:3333/profiles/<ID>/meta \
  -H "Authorization: Bearer mock-token"
```

### 5. Download Descriptografado

```bash
curl http://localhost:3333/profiles/<ID>/download \
  -H "Authorization: Bearer mock-token" \
  -o restored-profile.zip
```

### 6. Download Criptografado

```bash
curl "http://localhost:3333/profiles/<ID>/download?decrypt=false" \
  -H "Authorization: Bearer mock-token" \
  -o encrypted-profile.enc
```

### 7. Criar URL Assinada

```bash
curl "http://localhost:3333/profiles/<ID>/download-url?expiresIn=7200" \
  -H "Authorization: Bearer mock-token"
```

### 8. Deletar Profile

```bash
curl -X DELETE http://localhost:3333/profiles/<ID> \
  -H "Authorization: Bearer mock-token"
```

## 🏗 Arquitetura

```
src/
├── config/
│   └── supabase.ts              # Configuração do cliente Supabase
├── container/
│   ├── service.container.ts     # Container de Dependency Injection
│   └── index.ts                 # Barrel exports do container
├── controllers/
│   ├── profile.controller.ts    # Controlador de profiles
│   └── index.ts                 # Instância dos controllers
├── middlewares/
│   └── auth.middleware.ts       # Middleware de autenticação Bearer
├── repositories/
│   └── prisma-metadata.repository.ts # Repository do Prisma
├── routes/
│   └── profile.routes.ts        # Rotas consolidadas de profiles
├── services/
│   ├── encryption.service.ts    # Serviço de criptografia AES-256-GCM
│   ├── storage.service.ts       # Serviço do Supabase Storage
│   └── metadata.service.ts      # Serviço de metadados (banco)
├── types/
│   ├── fastify.type.ts          # Types do Fastify
│   └── profile.type.ts          # Types de profile
├── utils/
│   └── byte-counter-stream.ts   # Utility para contagem de bytes
└── server.ts                    # Servidor Fastify
```

### Padrões de Arquitetura

- **Clean Architecture**: Separação em camadas (Routes → Controllers → Services → Repositories)
- **Dependency Injection**: Container centralizado gerencia instâncias
- **Repository Pattern**: Abstração da camada de dados
- **Service Layer**: Lógica de negócio isolada
- **Type Safety**: TypeScript em toda a aplicação

### Fluxo de Upload

1. Cliente envia arquivo ZIP via multipart
2. Middleware verifica Bearer token
3. Controller recebe o arquivo
4. Service de encryption criptografa com AES-256-GCM usando streams
5. Service de storage salva no Supabase Storage
6. Service de metadata registra no PostgreSQL
7. Retorna informações do perfil criado

### Fluxo de Download

1. Cliente solicita download com ID
2. Middleware verifica Bearer token
3. Controller busca metadados no banco
4. Service de storage busca arquivo criptografado
5. Service de encryption descriptografa usando streams
6. Retorna arquivo original ao cliente

## 🔒 Segurança

### Criptografia

- **Algoritmo:** AES-256-GCM (autenticado)
- **Key Derivation:** PBKDF2 com scrypt
- **IV:** 16 bytes aleatórios por arquivo
- **Salt:** 32 bytes aleatórios por arquivo
- **Auth Tag:** 16 bytes para verificar integridade

### Autenticação

- Bearer token simples (adequado para desenvolvimento)
- Para produção, recomenda-se implementar JWT ou OAuth2

### Boas Práticas

- ✅ Nunca commitar `.env`
- ✅ Usar HTTPS em produção
- ✅ Configurar CORS adequadamente
- ✅ Implementar rate limiting
- ✅ Validar todos os inputs
- ✅ Usar variáveis de ambiente para secrets

## 📝 Licença

Este projeto é parte de um teste técnico.

## 📚 Documentação Adicional

Este projeto inclui guias detalhados para facilitar o desenvolvimento:

- **[BUCKET_SETUP.md](BUCKET_SETUP.md)** - Como configurar o bucket do Supabase Storage
- **[ENABLE_RLS.md](ENABLE_RLS.md)** - Habilitar Row Level Security na tabela profiles
- **[FIX_RLS_ERROR.md](FIX_RLS_ERROR.md)** - Corrigir erros de RLS
- **[QUICK_TEST.md](QUICK_TEST.md)** - Testes rápidos com cURL
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Guia completo de testes
- **[POSTMAN_GUIDE.md](POSTMAN_GUIDE.md)** - Como usar a collection do Postman
- **[UPLOAD_FORMAT.md](UPLOAD_FORMAT.md)** - Formato esperado para uploads
- **[ADDING_SERVICES.md](ADDING_SERVICES.md)** - Como adicionar novos services

### Arquivos de Teste

- **test-quick.sh** - Script bash para teste rápido de upload
- **Maask_API.postman_collection.json** - Collection do Postman
- **Maask_Local.postman_environment.json** - Environment do Postman

## 🤝 Contribuindo

Para melhorias:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📧 Contato

Para dúvidas ou sugestões, abra uma issue no repositório.

---
