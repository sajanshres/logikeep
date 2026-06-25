import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("vendors").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    contactPerson: v.string(),
    contactNumber: v.string(),
    email: v.string(),
    address: v.string(),
    partnerType: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("vendors", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    vendorId: v.id("vendors"),
    name: v.optional(v.string()),
    contactPerson: v.optional(v.string()),
    contactNumber: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    partnerType: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  },
  handler: async (ctx, args) => {
    const { vendorId, ...fields } = args;
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) patch[key] = value;
    }
    await ctx.db.patch(vendorId, patch);
  },
});

export const remove = mutation({
  args: { vendorId: v.id("vendors") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.vendorId, { status: "inactive" });
  },
});
