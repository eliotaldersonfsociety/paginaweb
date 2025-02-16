import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { db } from "../db"; 
import { usersTable } from "../db/schema"; 
import { eq } from "drizzle-orm"; 

export const userRouter = new Hono();

if (!process.env.JWT_SECRET) {
    throw new Error("Not found JWT_SECRET");
}

const authMiddleware = jwt({
    secret: process.env.JWT_SECRET,
});

userRouter.get("/saldo", authMiddleware, async (c) => {
    console.log("Headers recibidos:", c.req.header());
    
    const payload = c.get("jwtPayload"); 
    console.log("JWT Payload recibido:", payload);

    if (!payload || !payload.id) {
        console.error("Error: El payload del JWT no contiene ID de usuario");
        return c.json({ error: "User ID not found in JWT payload" }, 400);
    }

    const user = await db
        .select({ saldo: usersTable.saldo })
        .from(usersTable)
        .where(eq(usersTable.id, Number(payload.id)))
        .limit(1);

    if (user.length === 0) {
        console.error("Usuario no encontrado en la base de datos.");
        return c.json({ error: "User not found" }, 404);
    }

    console.log("Saldo encontrado:", user[0].saldo);
    return c.json({ saldo: user[0].saldo });
});

export default userRouter;
