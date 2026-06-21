import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all inventory items
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("inventory").collect();
  },
});

// Create product in stock
export const createProduct = mutation({
  args: {
    productName: v.string(),
    category: v.string(),
    sku: v.string(),
    quantity: v.number(),
    lowStockAlert: v.number(),
    vendorId: v.id("vendors"),
    price: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("inventory", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Update stock count (for purchases, sales, or audits)
export const updateStock = mutation({
  args: {
    productId: v.id("inventory"),
    newQuantity: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.productId, {
      quantity: args.newQuantity,
      updatedAt: Date.now(),
    });
  },
});
