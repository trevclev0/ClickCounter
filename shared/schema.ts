import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Counter User Schema
export const counterUsers = pgTable("counter_users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  count: integer("count").notNull().default(0),
});

export const insertCounterUserSchema = createInsertSchema(counterUsers);
export type InsertCounterUser = z.infer<typeof insertCounterUserSchema>;
export type CounterUser = typeof counterUsers.$inferSelect;

// WebSocket message schemas
export const messageSchema = z.object({
  type: z.enum(['increment', 'user_joined', 'user_list', 'ping', 'pong']),
  payload: z.any(),
});

export type WebSocketMessage = z.infer<typeof messageSchema>;
