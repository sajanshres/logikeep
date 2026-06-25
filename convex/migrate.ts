import { mutation } from "./_generated/server";
import { hashPassword } from "./auth";

// run this to fix old data in the database with the new columns so schema validation works
export const backfillPhase3 = mutation({
  args: {},
  handler: async (ctx) => {
    let patched = 0;

    for (const user of await ctx.db.query("users").collect()) {
      const patch: Record<string, unknown> = {};
      if (user.active === undefined) patch.active = true;
      if (user.passwordHash && !user.passwordHash.startsWith("lk_")) {
        patch.passwordHash = hashPassword(user.passwordHash);
      }
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(user._id, patch);
        patched++;
      }
    }

    for (const branch of await ctx.db.query("branches").collect()) {
      if (branch.status === undefined) {
        await ctx.db.patch(branch._id, { status: "active" as const });
        patched++;
      }
    }

    for (const vendor of await ctx.db.query("vendors").collect()) {
      const patch: Record<string, unknown> = {};
      if (vendor.partnerType === undefined) patch.partnerType = "Courier";
      if (vendor.status === undefined) patch.status = "active";
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(vendor._id, patch);
        patched++;
      }
    }

    return `Backfill complete. Patched ${patched} record(s).`;
  },
});
