import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { hashPassword } from "./auth";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("branch_staff"),
      v.literal("vendor")
    ),
    branchId: v.optional(v.id("branches")),
    phone: v.optional(v.string()),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      ...args,
      passwordHash: hashPassword(args.passwordHash),
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("admin"),
        v.literal("branch_staff"),
        v.literal("vendor")
      )
    ),
    branchId: v.optional(v.id("branches")),
    phone: v.optional(v.string()),
    active: v.optional(v.boolean()),
    passwordHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...fields } = args;
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        patch[key] = key === "passwordHash" ? hashPassword(value as string) : value;
      }
    }
    await ctx.db.patch(userId, patch);
  },
});

export const remove = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.userId);
  },
});
