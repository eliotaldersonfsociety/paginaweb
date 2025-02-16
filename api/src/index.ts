import { Hono } from "hono";
import authRouter from "./routes/auth.route";
import { postRouter } from "./routes/post.route";
import { cors } from "hono/cors";
import { userRouter } from "./routes/user.route"; // Importa la nueva ruta

import type { JwtVariables } from "hono/jwt";
import actualizarRouter from "./routes/actualizar.route";

type Variables = JwtVariables;

const app = new Hono<{ Variables: Variables }>();

// Habilitar CORS
app.use(cors({
  origin: "*", // Permitir solicitudes desde el frontend
  credentials: true, // Permitir cookies y autenticación con credenciales
}));

// Ruta GET de prueba
app.get("/api", (c) => {
  return c.json({ message: "API is working!" });
});

// Definir rutas
app.route("/api/v1/auth", authRouter);
app.route("/api/v1/posts", postRouter);
app.route("/api/v1/user", userRouter); // Agrega la nueva ruta de usuarios
app.route("/api/v1/actualizar", actualizarRouter); // Agrega la nueva ruta de usuarios

export default {
  port: 3001,
  fetch: app.fetch,
};
