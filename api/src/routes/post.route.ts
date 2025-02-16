import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { db } from "../db"; // Asegúrate de importar tu instancia de base de datos
import { eq } from "drizzle-orm"; // Importa la función eq desde drizzle-orm
import { purchasesTable } from "../db/schema"; // Importa la tabla de compras
import type { InsertPost } from "../db/schema"; // Importa el tipo de inserción

export const postRouter = new Hono();

if (!process.env.JWT_SECRET) {
    throw new Error("Not found JWT_SECRET");
}

// Middleware de autenticación JWT
const authMiddleware = jwt({
    secret: process.env.JWT_SECRET,
});

// Endpoint para obtener posts (compras)
postRouter.get("/", authMiddleware, async (c) => {
    const payload = c.get("jwtPayload");
    const userId = payload.id;
    try {
      // Consulta las compras del usuario en la tabla "purchases"
      const purchases = await db
        .select()
        .from(purchasesTable)
        .where(eq(purchasesTable.userId, Number(userId)));
  
      return c.json({ purchases });
    } catch (error) {
      console.error("Error fetching purchases:", error);
      return c.json({ error: "Error fetching purchases" }, 500);
    }
  });
  

// Endpoint para crear una nueva compra
postRouter.post("/", authMiddleware, async (c) => {
    const payload = c.get("jwtPayload"); // Obtén los datos del usuario autenticado
    console.log("JWT Payload:", payload); // Depura el payload
    const body = await c.req.json(); // Obtén el cuerpo de la solicitud
    console.log("Request Body:", body); // Depura el cuerpo de la solicitud
    // Valida que el cuerpo de la solicitud tenga los datos necesarios
    if (!body.items || !body.payment_method || !body.total_amount) {
        return c.json({ error: "Missing required fields" }, 400);
    }

    // Verifica que el userId esté presente en el payload
    if (!payload.id) {
        return c.json({ error: "User ID not found in JWT payload" }, 400);
    }

    // Crea la nueva compra en la base de datos
    try {
        const newPurchase: InsertPost = {
            items: JSON.stringify(body.items),
            payment_method: body.payment_method,
            userId: Number(payload.id), // Asume que el JWT incluye el ID del usuario
            total_amount: body.total_amount,
        };

        const result = await db.insert(purchasesTable).values(newPurchase).returning();
        return c.json({ message: "Purchase created successfully", data: result }, 201);
    } catch (error) {
        console.error("Error creating purchase:", error);
        return c.json({ error: "Failed to create purchase" }, 500);
    }
});

export default postRouter;