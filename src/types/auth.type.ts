export interface AuthConfig {
  bearerToken: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      authenticated: boolean;
    };
  }
}
