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
    driverName: v.optional(v.string()),
    vehicleNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const origin = await ctx.db.get(args.originBranchId);
    const dest = await ctx.db.get(args.destinationBranchId);
    if (!origin || !dest) {
      throw new Error("Invalid origin or destination branch.");
    }

    const existing = await ctx.db.query("packages").collect();
    const trackingNumber = `LK-${origin.code}-${dest.code}-${String(existing.length + 1).padStart(3, "0")}`;

    const packageId = await ctx.db.insert("packages", {
      ...args,
      trackingNumber,
      status: "booked",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const operator = await ctx.db.query("users").first();
    if (!operator) {
      throw new Error("Seed the database before booking packages.");
    }

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
    receivedBy: v.optional(v.string()),
    deliveryNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { packageId, status, currentBranchId, details, updatedById, ...optionalFields } = args;
    
    await ctx.db.patch(packageId, {
      status,
      currentBranchId,
      updatedAt: Date.now(),
      ...optionalFields,
    });

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
