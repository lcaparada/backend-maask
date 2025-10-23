import { FastifyInstance } from "fastify";
import { z } from "zod";
import { supabaseAuth } from "../config/supabase";

export async function authRoutes(app: FastifyInstance) {
  app.post(
    "/auth/login",
    {
      schema: {
        description: "Fazer login e obter access token",
        tags: ["auth"],
        body: z.object({
          email: z.email(),
          password: z.string(),
        }),
        response: {
          200: z.object({
            access_token: z.string(),
            refresh_token: z.string(),
            user: z.object({
              id: z.string(),
              email: z.email(),
            }),
          }),
          401: z.object({
            error: z.string(),
            message: z.string(),
          }),
          500: z.object({
            error: z.string(),
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const { email, password } = request.body as {
          email: string;
          password: string;
        };

        const { data, error } = await supabaseAuth.auth.signInWithPassword({
          email,
          password,
        });

        if (error || !data.session) {
          return reply.status(401).send({
            error: "Unauthorized",
            message: error?.message || "Invalid credentials",
          });
        }

        return reply.status(200).send({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          user: {
            id: data.user.id,
            email: data.user.email!,
          },
        });
      } catch (error) {
        console.error("Login error:", error);
        return reply.status(500).send({
          error: "Internal Server Error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  app.post(
    "/auth/logout",
    {
      schema: {
        description: "Fazer logout (invalidar token)",
        tags: ["auth"],
        headers: z.object({
          authorization: z.string(),
        }),
        response: {
          200: z.object({
            message: z.string(),
          }),
          401: z.object({
            error: z.string(),
            message: z.string(),
          }),
          500: z.object({
            error: z.string(),
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const authHeader = request.headers.authorization;

        if (!authHeader) {
          return reply.status(401).send({
            error: "Unauthorized",
            message: "Missing Authorization header",
          });
        }

        const token = authHeader.split(" ")[1];

        const { error } = await supabaseAuth.auth.signOut();

        if (error) {
          return reply.status(401).send({
            error: "Unauthorized",
            message: error.message,
          });
        }

        return reply.status(200).send({
          message: "Logged out successfully",
        });
      } catch (error) {
        console.error("Logout error:", error);
        return reply.status(500).send({
          error: "Internal Server Error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );
}
