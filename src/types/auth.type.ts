export interface AuthConfig {
  bearerToken: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  authenticated: boolean;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
}
