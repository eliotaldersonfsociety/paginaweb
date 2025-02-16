import { hash, password } from "bun";
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db/index";
import { usersTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { sign, verify } from "hono/jwt";

if (!process.env.JWT_SECRET) {
    throw new Error("Not found JWT_SECRET")
}

export const authRouter = new Hono();

const registerSchema = z.object({
    name: z.string().trim().toLowerCase().min(3, { message: "Name must be at least 3 characters long" }),
    lastname: z.string().trim().toLowerCase().min(3, { message: "Lastname must be at least 3 characters long" }),
    email: z.string().trim().toLowerCase().email({
        message: "Invalid email address",
    }),
    password: z.string().min(8, {
        message: "Password must be at least 8 characters long",
    }),
    repassword: z.string().min(8, { message: "Password must be at least 8 characters long" }),
    direction: z.string().trim().toLowerCase().min(3, { message: "Direction must be at least 3 characters long" }).optional(),
    postalcode: z.string().trim().toLowerCase().min(3, { message: "Postal code must be at least 3 characters long" }),
});

const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email({
        message: "Invalid email address",
    }),
    password: z.string().min(8, {
        message: "Password must be at least 8 characters long",
    }),
});

authRouter.post(
    "/register",
    zValidator("json", registerSchema),
    async (c) => {
        const { name, lastname, email, password, repassword, direction, postalcode } = await c.req.json();

        if (password !== repassword) {
            return c.json({ message: "Passwords do not match" }, 400);
        }

        const existingUser = await db.select().from(usersTable).where(eq(usersTable.email, email));

        if (existingUser.length > 0) {
            return c.json({ message: "Email already registered" }, 400);
        }

        const hashedPassword = await Bun.password.hash(password);

        try {
            const newUserArr = await db
                .insert(usersTable)
                .values({
                    name,
                    lastname,
                    email,
                    password: hashedPassword,
                    direction,
                    postalcode,
                })
                .returning({
                    id: usersTable.id,
                    name: usersTable.name,
                    lastname: usersTable.lastname,
                    email: usersTable.email,
                });

                const newUser = newUserArr[0];

                const payload = {
                    id: newUser.id,
                    email: newUser.email,
                    exp: Math.floor(Date.now() / 1000) + 3600,
                };

                const secret = process.env.JWT_SECRET as string;
                const token = await sign(payload, secret);


                return c.json({ newUser, token });
            } catch (error) {
            console.error("Error during registration:", error);
            return c.json({ message: "Error during registration" }, 500);
        }
    }
);

authRouter.post(
    "/login",
    zValidator("json", loginSchema),
    async (c) => {
        const { email, password } = await c.req.json();

            const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

            if (!user) {
                return c.json({ message: "User not found"}, 404);
            }

            const isMatch = await Bun.password.verify(password, user.password);
            
            if (!isMatch) {
                return c.json({ message: "Invalid password"}, 401);
            }

            const payload = {
                id: user.id, 
                email: user.email, 
                exp: Math.floor(Date.now() / 1000) + 3600
            };

            const secret = process.env.JWT_SECRET as string;

            const token = await sign(payload, secret);


            // JWT or Session handling (Important next step)
            return c.json({ 
            Token: token,
            user: {
                id: user.id,
                name: user.name,
                lastname: user.lastname,
                email: user.email,
            },
         });
     
        }
    );

    

export default authRouter;