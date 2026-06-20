import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get list of all branches
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("branches").collect();
  },
});

// Create a new branch
export const create = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    address: v.string(),
    city: v.string(),
    contactNumber: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("branches", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
