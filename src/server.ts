import "dotenv/config";
import Fastify from "fastify";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { fastifyCors } from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastifyMultipart from "@fastify/multipart";
import { profileRoutes } from "./routes";

const app = Fastify({
  logger: true,
}).withTypeProvider<ZodTypeProvider>();

app.register(fastifyCors, {
  origin: (origin, cb) => {
    cb(null, true);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  exposedHeaders: ["Content-Disposition"],
});

app.register(fastifyMultipart, {
  limits: {
    fileSize: 500 * 1024 * 1024,
  },
});

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: "Maask API",
      description:
        "API para gerenciamento seguro de perfis de navegador Chromium",
      version: "1.0.0",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3333}`,
        description: "Servidor de desenvolvimento",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Token de autenticação Bearer (use 'mock-token' para testes)",
        },
      },
    },
  },
  transform: jsonSchemaTransform,
});

app.register(fastifySwaggerUi, {
  routePrefix: "/docs",
});

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.register(profileRoutes);

app.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "3333");
    const host = process.env.HOST || "0.0.0.0";

    await app.listen({ port, host });

    console.log("🚀 HTTP server running!");
    console.log(`📚 Documentation available at: http://localhost:${port}/docs`);
    console.log(
      `🔒 Authentication: Bearer ${process.env.BEARER_TOKEN || "mock-token"}`
    );
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
