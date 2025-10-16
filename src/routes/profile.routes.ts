import { FastifyInstance } from "fastify";
import { z } from "zod";
import { profileController } from "../controllers";
import { authMiddleware } from "../middlewares";

export async function profileRoutes(app: FastifyInstance) {
  app.post(
    "/profiles/upload",
    {
      onRequest: [authMiddleware],
      schema: {
        description:
          "Upload de perfil de navegador (arquivo ZIP criptografado)",
        tags: ["profiles"],
        consumes: ["multipart/form-data"],
        security: [{ bearerAuth: [] }],
        response: {
          201: z
            .object({
              id: z.uuid(),
              name: z.string(),
              original_name: z.string(),
              size: z.number(),
              encrypted_size: z.number(),
              storage_path: z.string(),
              created_at: z.string(),
              updated_at: z.string(),
            })
            .describe("Perfil criado com sucesso"),
          400: z
            .object({
              error: z.string(),
              message: z.string(),
            })
            .describe("Erro de validação"),
          401: z
            .object({
              error: z.string(),
              message: z.string(),
            })
            .describe("Não autorizado"),
          500: z
            .object({
              error: z.string(),
              message: z.string(),
            })
            .describe("Erro interno do servidor"),
        },
      },
    },
    async (request, reply) => {
      try {
        const data = await request.file();

        if (!data) {
          return reply.status(400).send({
            error: "Bad Request",
            message: "No file provided",
          });
        }

        const profile = await profileController.uploadProfile(data);

        return reply.status(201).send(profile);
      } catch (error) {
        console.error("Upload error:", error);
        return reply.status(500).send({
          error: "Internal Server Error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  app.get(
    "/profiles",
    {
      onRequest: [authMiddleware],
      schema: {
        description: "Lista todos os perfis com paginação",
        tags: ["profiles"],
        security: [{ bearerAuth: [] }],
        querystring: z.object({
          page: z.string().optional().default("1").describe("Número da página"),
          limit: z
            .string()
            .optional()
            .default("10")
            .describe("Itens por página"),
        }),
        response: {
          200: z
            .object({
              profiles: z.array(
                z.object({
                  id: z.uuid(),
                  name: z.string(),
                  original_name: z.string(),
                  size: z.number(),
                  encrypted_size: z.number(),
                  storage_path: z.string(),
                  created_at: z.string(),
                  updated_at: z.string(),
                })
              ),
              total: z.number().describe("Total de profiles"),
              page: z.number().describe("Página atual"),
              totalPages: z.number().describe("Total de páginas"),
            })
            .describe("Lista de profiles"),
          401: z
            .object({
              error: z.string(),
              message: z.string(),
            })
            .describe("Não autorizado"),
          500: z
            .object({
              error: z.string(),
              message: z.string(),
            })
            .describe("Erro interno do servidor"),
        },
      },
    },
    async (request, reply) => {
      try {
        const { page, limit } = request.query as {
          page?: string;
          limit?: string;
        };

        const pageNum = parseInt(page || "1", 10);
        const limitNum = parseInt(limit || "10", 10);

        const result = await profileController.listProfiles(pageNum, limitNum);

        return reply.status(200).send(result);
      } catch (error) {
        console.error("List profiles error:", error);

        return reply.status(500).send({
          error: "Internal Server Error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  app.get(
    "/profiles/:id/meta",
    {
      onRequest: [authMiddleware],
      schema: {
        description:
          "Consulta metadados de um perfil (nome, tamanho, datas, etc)",
        tags: ["profiles"],
        security: [{ bearerAuth: [] }],
        params: z.object({
          id: z.uuid(),
        }),
        response: {
          200: z
            .object({
              id: z.uuid(),
              name: z.string(),
              original_name: z.string(),
              size: z.number().describe("Tamanho original em bytes"),
              encrypted_size: z
                .number()
                .describe("Tamanho criptografado em bytes"),
              created_at: z.string().describe("Data de criação"),
              updated_at: z.string().describe("Data de última modificação"),
            })
            .describe("Metadados do profile"),
          401: z
            .object({
              error: z.string(),
              message: z.string(),
            })
            .describe("Não autorizado"),
          404: z
            .object({
              error: z.string(),
              message: z.string(),
            })
            .describe("Profile não encontrado"),
          500: z
            .object({
              error: z.string(),
              message: z.string(),
            })
            .describe("Erro interno do servidor"),
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        const metadata = await profileController.getMetadata(id);

        return reply.status(200).send(metadata);
      } catch (error) {
        console.error("Get metadata error:", error);

        if (error instanceof Error && error.message === "Profile not found") {
          return reply.status(404).send({
            error: "Not Found",
            message: "Profile not found",
          });
        }

        return reply.status(500).send({
          error: "Internal Server Error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  app.get(
    "/profiles/:id/download",
    {
      onRequest: [authMiddleware],
      schema: {
        description:
          "Download de perfil de navegador (descriptografado ou criptografado)",
        tags: ["profiles"],
        security: [{ bearerAuth: [] }],
        params: z.object({
          id: z.uuid(),
        }),
        querystring: z.object({
          decrypt: z
            .string()
            .optional()
            .default("true")
            .describe(
              "Se true, retorna arquivo descriptografado. Se false, retorna criptografado."
            ),
        }),
        response: {
          200: z.any().describe("Arquivo ZIP (stream)"),
          401: z
            .object({
              error: z.string(),
              message: z.string(),
            })
            .describe("Não autorizado"),
          404: z
            .object({
              error: z.string(),
              message: z.string(),
            })
            .describe("Profile não encontrado"),
          500: z
            .object({
              error: z.string(),
              message: z.string(),
            })
            .describe("Erro interno do servidor"),
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { decrypt } = request.query as { decrypt?: string };

        const shouldDecrypt = decrypt !== "false";

        const { stream, filename, contentType } =
          await profileController.downloadProfile(id, shouldDecrypt);

        reply.header("Content-Type", contentType);
        reply.header(
          "Content-Disposition",
          `attachment; filename="${filename}"`
        );

        return reply.send(stream);
      } catch (error) {
        console.error("Download error:", error);

        if (error instanceof Error && error.message === "Profile not found") {
          return reply.status(404).send({
            error: "Not Found",
            message: "Profile not found",
          });
        }

        return reply.status(500).send({
          error: "Internal Server Error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  app.get(
    "/profiles/:id/download-url",
    {
      onRequest: [authMiddleware],
      schema: {
        description:
          "Cria URL assinada para download temporário (arquivo criptografado)",
        tags: ["profiles"],
        security: [{ bearerAuth: [] }],
        params: z.object({
          id: z.uuid(),
        }),
        querystring: z.object({
          expiresIn: z
            .string()
            .optional()
            .default("3600")
            .describe("Tempo de expiração em segundos (padrão: 3600 = 1 hora)"),
        }),
        response: {
          200: z
            .object({
              url: z.string().url(),
              expiresIn: z.number(),
            })
            .describe("URL assinada criada com sucesso"),
          401: z
            .object({
              error: z.string(),
              message: z.string(),
            })
            .describe("Não autorizado"),
          404: z
            .object({
              error: z.string(),
              message: z.string(),
            })
            .describe("Profile não encontrado"),
          500: z
            .object({
              error: z.string(),
              message: z.string(),
            })
            .describe("Erro interno do servidor"),
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { expiresIn } = request.query as { expiresIn?: string };

        const expiresInSeconds = parseInt(expiresIn || "3600", 10);

        const url = await profileController.createDownloadUrl(
          id,
          expiresInSeconds
        );

        return reply.status(200).send({
          url,
          expiresIn: expiresInSeconds,
        });
      } catch (error) {
        console.error("Create download URL error:", error);

        if (error instanceof Error && error.message === "Profile not found") {
          return reply.status(404).send({
            error: "Not Found",
            message: "Profile not found",
          });
        }

        return reply.status(500).send({
          error: "Internal Server Error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  app.delete(
    "/profiles/:id",
    {
      onRequest: [authMiddleware],
      schema: {
        description: "Deleta um perfil (arquivo e metadados)",
        tags: ["profiles"],
        security: [{ bearerAuth: [] }],
        params: z.object({
          id: z.uuid(),
        }),
        response: {
          204: z.null().describe("Perfil deletado com sucesso"),
          401: z
            .object({
              error: z.string(),
              message: z.string(),
            })
            .describe("Não autorizado"),
          404: z
            .object({
              error: z.string(),
              message: z.string(),
            })
            .describe("Perfil não encontrado"),
          500: z
            .object({
              error: z.string(),
              message: z.string(),
            })
            .describe("Erro interno do servidor"),
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        await profileController.deleteProfile(id);

        return reply.status(204).send();
      } catch (error) {
        console.error("Delete profile error:", error);

        if (error instanceof Error && error.message === "Profile not found") {
          return reply.status(404).send({
            error: "Not Found",
            message: "Profile not found",
          });
        }

        return reply.status(500).send({
          error: "Internal Server Error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );
}
