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
    branchId: v.id("branches"),
    price: v.number(),
    updatedById: v.id("users"),
  },
  handler: async (ctx, args) => {
    if (args.quantity < 0) throw new Error("Quantity cannot be negative.");
    if (args.price < 0) throw new Error("Price cannot be negative.");
    if (args.lowStockAlert < 0) throw new Error("Low stock alert cannot be negative.");

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
      updatedById,
      timestamp: Date.now(),
    });

    return productId;
  },
});

export const updateProduct = mutation({
  args: {
    productId: v.id("inventory"),
    productName: v.optional(v.string()),
    category: v.optional(v.string()),
    sku: v.optional(v.string()),
    lowStockAlert: v.optional(v.number()),
    vendorId: v.optional(v.id("vendors")),
    price: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { productId, ...fields } = args;
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) patch[key] = value;
    }
    await ctx.db.patch(productId, patch);
  },
});

export const removeProduct = mutation({
  args: {
    productId: v.id("inventory"),
  },
  handler: async (ctx, args) => {
    const movements = await ctx.db
      .query("stockMovements")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();

    // allow deletion of a never-traded product (only the initial stock registration)
    if (movements.length <= 1) {
      for (const m of movements) {
        await ctx.db.delete(m._id);
      }
      await ctx.db.delete(args.productId);
      return;
    }

    throw new Error("This product has stock movement history and can't be deleted. Keep it for audit records.");
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
    if (args.newQuantity < 0) throw new Error("Quantity cannot be negative.");
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
