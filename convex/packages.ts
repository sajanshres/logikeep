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
    trackingNumber: v.string(),
    senderName: v.string(),
    senderContact: v.string(),
    receiverName: v.string(),
    receiverAddress: v.string(),
    receiverContact: v.string(),
    packageType: v.string(),
    weight: v.number(),
    originBranchId: v.id("branches"),
    destinationBranchId: v.id("branches"),
    currentBranchId: v.id("branches"),
  },
  handler: async (ctx, args) => {
    const packageId = await ctx.db.insert("packages", {
      ...args,
      status: "booked",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create initial movement log
    await ctx.db.insert("movementLogs", {
      packageId,
      status: "booked",
      locationBranchId: args.originBranchId,
      details: "Shipment booked and queued for dispatch.",
      timestamp: Date.now(),
      // Temp: System operator or first user as placeholder
      updatedById: (await ctx.db.query("users").first())?._id!,
    });

    return packageId;
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
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.packageId, {
      status: args.status,
      currentBranchId: args.currentBranchId,
      updatedAt: Date.now(),
    });

    // Insert tracking update log
    return await ctx.db.insert("movementLogs", {
      packageId: args.packageId,
      status: args.status,
      locationBranchId: args.currentBranchId,
      details: args.details,
      timestamp: Date.now(),
      updatedById: args.updatedById,
    });
  },
});
