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
    updatedById: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { updatedById, ...productFields } = args;
    const productId = await ctx.db.insert("inventory", {
      ...productFields,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("stockMovements", {
      productId,
      type: "adjustment",
      quantityChanged: args.quantity,
      notes: "Initial stock registration",
      updatedById: args.updatedById,
      timestamp: Date.now(),
    });

    return productId;
  },
});

// Update stock count (for purchases, sales, or audits)
export const updateStock = mutation({
  args: {
    productId: v.id("inventory"),
    newQuantity: v.number(),
    type: v.union(v.literal("purchase"), v.literal("sale"), v.literal("adjustment")),
    quantityChanged: v.number(),
    notes: v.optional(v.string()),
    updatedById: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.productId, {
      quantity: args.newQuantity,
      updatedAt: Date.now(),
    });

    return await ctx.db.insert("stockMovements", {
      productId: args.productId,
      type: args.type,
      quantityChanged: args.quantityChanged,
      notes: args.notes || "Manual stock update",
      updatedById: args.updatedById,
      timestamp: Date.now(),
    });
  },
});

// Get stock movements for a specific product
export const getMovements = query({
  args: { productId: v.id("inventory") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stockMovements")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();
  },
});

// Get all stock movements (for reporting ledger)
export const getAllMovements = query({
  handler: async (ctx) => {
    return await ctx.db.query("stockMovements").collect();
  },
});
