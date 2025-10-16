import { FastifyRequest, FastifyReply } from "fastify";

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Missing Authorization header",
      });
    }

    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Invalid Authorization format. Expected: Bearer <token>",
      });
    }

    const expectedToken = process.env.BEARER_TOKEN || "mock-token";

    if (token !== expectedToken) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Invalid token",
      });
    }

    request.user = { authenticated: true };
  } catch (error) {
    return reply.status(500).send({
      error: "Internal Server Error",
      message: "Authentication failed",
    });
  }
}
