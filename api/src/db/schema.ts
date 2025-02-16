import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users", {
    id: integer("id").primaryKey(),
    name: text("name").notNull(),
    lastname: text("lastname").notNull(),
    email: text("email").unique().notNull(),
    password: text("password").notNull(),
    direction: text("direction").notNull(),
    postalcode: integer("postalcode").notNull(),
    saldo: integer("saldo").notNull().default(0),
});

export const purchasesTable = sqliteTable("purchases", {
    id: integer("id").primaryKey(),
    items: text("items").notNull(),
    payment_method: text("payment_method").notNull(),
    userId: integer("user_id")
        .notNull()
        .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: text("created_at")
        .default(sql`(CURRENT_TIMESTAMP)`)
        .notNull(),
    updateAt: integer("update_at", {mode: "timestamp"}).$onUpdate(
        () => new Date()
        ),
    total_amount: integer("total_amount").notNull().default(0),
});

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;

export type InsertPost = typeof purchasesTable.$inferInsert;
export type SelectPost = typeof purchasesTable.$inferSelect;

