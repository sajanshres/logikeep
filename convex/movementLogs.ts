import { query } from "./_generated/server";
import { v } from "convex/values";

// Get all movement logs for a specific package, sorted by timestamp ascending
export const getByPackage = query({
  args: { packageId: v.id("packages") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("movementLogs")
      .withIndex("by_package", (q) => q.eq("packageId", args.packageId))
      .order("asc")
      .collect();
  },
});
