import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all packages
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("packages").collect();
  },
});

// Find package by its tracking number
export const getByTracking = query({
  args: { trackingNumber: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("packages")
      .withIndex("by_tracking", (q) => q.eq("trackingNumber", args.trackingNumber))
      .first();
  },
});

// Book a new package
export const create = mutation({
  args: {
    senderName: v.string(),
    senderContact: v.string(),
    senderAddress: v.optional(v.string()),
    receiverName: v.string(),
    receiverAddress: v.string(),
    receiverContact: v.string(),
    packageType: v.string(),
    weight: v.number(),
    dimensions: v.optional(v.string()),
    description: v.optional(v.string()),
    originBranchId: v.id("branches"),
    destinationBranchId: v.id("branches"),
    currentBranchId: v.id("branches"),
    assignedVendorId: v.optional(v.id("vendors")),
    inventoryItemId: v.optional(v.id("inventory")),
    itemQuantity: v.optional(v.number()),
    driverName: v.optional(v.string()),
    vehicleNumber: v.optional(v.string()),
    driverPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const origin = await ctx.db.get(args.originBranchId);
    const dest = await ctx.db.get(args.destinationBranchId);
    if (!origin || !dest) {
      throw new Error("Invalid origin or destination branch.");
    }

    const existing = await ctx.db.query("packages").collect();
    const trackingNumber = `LK-${origin.code}-${dest.code}-${String(existing.length + 1).padStart(3, "0")}`;

    const operator = await ctx.db.query("users").first();
    if (!operator) {
      throw new Error("Seed the database before booking packages.");
    }

    // auto-decrement stock if inventory item is linked
    if (args.inventoryItemId && args.itemQuantity) {
      const item = await ctx.db.get(args.inventoryItemId);
      if (!item) throw new Error("Inventory item not found.");
      if (args.itemQuantity <= 0) {
        throw new Error("Item quantity must be greater than zero.");
      }
      if (item.quantity < args.itemQuantity) {
        throw new Error(`Insufficient stock for ${item.productName}. Available: ${item.quantity}, requested: ${args.itemQuantity}.`);
      }
      await ctx.db.patch(args.inventoryItemId, {
        quantity: item.quantity - args.itemQuantity,
        updatedAt: Date.now(),
      });
      await ctx.db.insert("stockMovements", {
        productId: args.inventoryItemId,
        type: "sale",
        quantityChanged: -args.itemQuantity,
        notes: `Reserved for delivery ${trackingNumber}`,
        updatedById: operator._id,
        timestamp: Date.now(),
      });
    }

    const packageId = await ctx.db.insert("packages", {
      ...args,
      trackingNumber,
      status: "booked",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("movementLogs", {
      packageId,
      status: "booked",
      locationBranchId: args.originBranchId,
      details: "Shipment booked and queued for dispatch.",
      timestamp: Date.now(),
      updatedById: operator._id,
    });

    return packageId;
  },
});

// Update package details (Phase 3 edit flow)
export const update = mutation({
  args: {
    packageId: v.id("packages"),
    senderName: v.optional(v.string()),
    senderContact: v.optional(v.string()),
    senderAddress: v.optional(v.string()),
    receiverName: v.optional(v.string()),
    receiverAddress: v.optional(v.string()),
    receiverContact: v.optional(v.string()),
    packageType: v.optional(v.string()),
    weight: v.optional(v.number()),
    dimensions: v.optional(v.string()),
    description: v.optional(v.string()),
    assignedVendorId: v.optional(v.id("vendors")),
    driverName: v.optional(v.string()),
    vehicleNumber: v.optional(v.string()),
    driverPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { packageId, ...fields } = args;
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) patch[key] = value;
    }
    await ctx.db.patch(packageId, patch);
  },
});

// Update shipment status (e.g. at branch, out for delivery)
export const updateStatus = mutation({
  args: {
    packageId: v.id("packages"),
    status: v.union(
      v.literal("booked"),
      v.literal("in_transit"),
      v.literal("arrived_at_branch"),
      v.literal("out_for_delivery"),
      v.literal("delivered"),
      v.literal("returned")
    ),
    currentBranchId: v.id("branches"),
    details: v.string(),
    updatedById: v.id("users"),
    driverName: v.optional(v.string()),
    vehicleNumber: v.optional(v.string()),
    driverPhone: v.optional(v.string()),
    receivedBy: v.optional(v.string()),
    deliveryNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { packageId, status, currentBranchId, details, updatedById, ...optionalFields } = args;

    // read old state first so we know the previous status
    const prev = await ctx.db.get(packageId);

    await ctx.db.patch(packageId, {
      status,
      currentBranchId,
      updatedAt: Date.now(),
      ...optionalFields,
    });

    // restore stock if package is returned and had an inventory item
    if (status === "returned" && prev && prev.status !== "returned" && prev.inventoryItemId && prev.itemQuantity && prev.itemQuantity > 0) {
      const item = await ctx.db.get(prev.inventoryItemId);
      if (item) {
        await ctx.db.patch(prev.inventoryItemId, {
          quantity: item.quantity + prev.itemQuantity,
          updatedAt: Date.now(),
        });
        await ctx.db.insert("stockMovements", {
          productId: prev.inventoryItemId,
          type: "purchase",
          quantityChanged: prev.itemQuantity,
          notes: `Returned from delivery ${prev.trackingNumber}`,
          updatedById,
          timestamp: Date.now(),
        });
      }
    }

    // Insert tracking update log
    return await ctx.db.insert("movementLogs", {
      packageId,
      status,
      locationBranchId: currentBranchId,
      details,
      timestamp: Date.now(),
      updatedById,
    });
  },
});
