import { describe, it, expect, beforeEach } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// clear all data before each test so tracking numbers are predictable
const t = convexTest(schema);

const tables = ["stockMovements", "movementLogs", "packages", "inventory", "vendors", "users", "branches"] as const;

beforeEach(async () => {
  await t.run(async (ctx) => {
    // hard reset all tables
    for (const name of tables) {
      const docs = await ctx.db.query(name).collect();
      for (const d of docs) {
        await ctx.db.delete(d._id);
      }
    }
  });
});

// helper to set up branches + a user for each test
async function setupTestData(t: ReturnType<typeof convexTest>) {
  const branchA = await t.run(async (ctx) => {
    return await ctx.db.insert("branches", {
      name: "Kathmandu", code: "KTM", address: "123 Main St", city: "Kathmandu",
      contactNumber: "01-1234", email: "ktm@test.com", status: "active", createdAt: Date.now(),
    });
  });
  const branchB = await t.run(async (ctx) => {
    return await ctx.db.insert("branches", {
      name: "Dharan", code: "DHN", address: "456 Main St", city: "Dharan",
      contactNumber: "02-5678", email: "dhn@test.com", status: "active", createdAt: Date.now(),
    });
  });
  const user = await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      name: "Admin", email: "admin@test.com", passwordHash: "hashed",
      role: "admin", active: true, createdAt: Date.now(),
    });
  });
  return { branchA, branchB, user };
}

async function createInventoryItem(t: ReturnType<typeof convexTest>, branchId: string) {
  const vendor = await t.run(async (ctx) => {
    return await ctx.db.insert("vendors", {
      name: "Test Vendor", contactPerson: "Test", contactNumber: "999",
      email: "vendor@test.com", address: "addr", partnerType: "supplier",
      status: "active", createdAt: Date.now(),
    });
  });
  return await t.run(async (ctx) => {
    return await ctx.db.insert("inventory", {
      productName: "Widget", category: "cat", sku: "W001",
      quantity: 10, lowStockAlert: 2, vendorId: vendor, branchId, price: 100,
      createdAt: Date.now(), updatedAt: Date.now(),
    });
  });
}

describe("packages", () => {
  it("PK-01: booking with valid branches returns an id", async () => {
    const { branchA, branchB } = await setupTestData(t);
    const id = await t.mutation(api.packages.create, {
      senderName: "A", senderContact: "1",
      receiverName: "B", receiverAddress: "addr", receiverContact: "2",
      packageType: "box", weight: 1,
      originBranchId: branchA, destinationBranchId: branchB, currentBranchId: branchA,
    });
    expect(id).toBeTruthy();
  });

  it("PK-02: booking throws for bad branch id", async () => {
    const { branchA, branchB } = await setupTestData(t);
    await expect(
      t.mutation(api.packages.create, {
        senderName: "A", senderContact: "1",
        receiverName: "B", receiverAddress: "addr", receiverContact: "2",
        packageType: "box", weight: 1,
        originBranchId: "1branches" as Id<"branches">, destinationBranchId: branchB, currentBranchId: branchA,
      })
    ).rejects.toThrow("Invalid origin or destination branch.");
  });

  it("PK-03: booking with weight 0 throws", async () => {
    const { branchA, branchB } = await setupTestData(t);
    await expect(
      t.mutation(api.packages.create, {
        senderName: "A", senderContact: "1",
        receiverName: "B", receiverAddress: "addr", receiverContact: "2",
        packageType: "box", weight: 0,
        originBranchId: branchA, destinationBranchId: branchB, currentBranchId: branchA,
      })
    ).rejects.toThrow("Weight must be greater than zero.");
  });

  it("PK-04: booking with weight -1 throws", async () => {
    const { branchA, branchB } = await setupTestData(t);
    await expect(
      t.mutation(api.packages.create, {
        senderName: "A", senderContact: "1",
        receiverName: "B", receiverAddress: "addr", receiverContact: "2",
        packageType: "box", weight: -1,
        originBranchId: branchA, destinationBranchId: branchB, currentBranchId: branchA,
      })
    ).rejects.toThrow("Weight must be greater than zero.");
  });

  it("PK-05: tracking number matches pattern", async () => {
    const { branchA, branchB } = await setupTestData(t);
    await t.mutation(api.packages.create, {
      senderName: "A", senderContact: "1",
      receiverName: "B", receiverAddress: "addr", receiverContact: "2",
      packageType: "box", weight: 1,
      originBranchId: branchA, destinationBranchId: branchB, currentBranchId: branchA,
    });
    const packages = await t.query(api.packages.list, {});
    expect(packages).toHaveLength(1);
    expect(packages[0].trackingNumber).toMatch(/^LK-KTM-DHN-\d{3}$/);
  });

  it("PK-06: second package increments tracking", async () => {
    const { branchA, branchB } = await setupTestData(t);
    await t.mutation(api.packages.create, {
      senderName: "A", senderContact: "1",
      receiverName: "B", receiverAddress: "addr", receiverContact: "2",
      packageType: "box", weight: 1,
      originBranchId: branchA, destinationBranchId: branchB, currentBranchId: branchA,
    });
    await t.mutation(api.packages.create, {
      senderName: "C", senderContact: "3",
      receiverName: "D", receiverAddress: "addr2", receiverContact: "4",
      packageType: "box", weight: 2,
      originBranchId: branchA, destinationBranchId: branchB, currentBranchId: branchA,
    });
    const packages = await t.query(api.packages.list, {});
    expect(packages).toHaveLength(2);
    expect(packages[1].trackingNumber).toMatch(/002$/);
  });

  it("PK-07: booking with no users throws", async () => {
    // insert branches only, no user
    const branchA = await t.run(async (ctx) => {
      return await ctx.db.insert("branches", {
        name: "Kathmandu", code: "KTM", address: "123 Main St", city: "Kathmandu",
        contactNumber: "01-1234", email: "ktm@test.com", status: "active", createdAt: Date.now(),
      });
    });
    const branchB = await t.run(async (ctx) => {
      return await ctx.db.insert("branches", {
        name: "Dharan", code: "DHN", address: "456 Main St", city: "Dharan",
        contactNumber: "02-5678", email: "dhn@test.com", status: "active", createdAt: Date.now(),
      });
    });
    await expect(
      t.mutation(api.packages.create, {
        senderName: "A", senderContact: "1",
        receiverName: "B", receiverAddress: "addr", receiverContact: "2",
        packageType: "box", weight: 1,
        originBranchId: branchA, destinationBranchId: branchB, currentBranchId: branchA,
      })
    ).rejects.toThrow("Seed the database before booking packages.");
  });

  it("PK-08: booking with inventoryItemId decrements stock", async () => {
    const { branchA, branchB } = await setupTestData(t);
    const invItem = await createInventoryItem(t, branchA);
    await t.mutation(api.packages.create, {
      senderName: "A", senderContact: "1",
      receiverName: "B", receiverAddress: "addr", receiverContact: "2",
      packageType: "box", weight: 1,
      originBranchId: branchA, destinationBranchId: branchB, currentBranchId: branchA,
      inventoryItemId: invItem, itemQuantity: 2,
    });
    const item = await t.run(async (ctx) => await ctx.db.get(invItem));
    expect(item!.quantity).toBe(8);
  });

  it("PK-09: booking with inventory writes stockMovement", async () => {
    const { branchA, branchB, user } = await setupTestData(t);
    const invItem = await createInventoryItem(t, branchA);
    await t.mutation(api.packages.create, {
      senderName: "A", senderContact: "1",
      receiverName: "B", receiverAddress: "addr", receiverContact: "2",
      packageType: "box", weight: 1,
      originBranchId: branchA, destinationBranchId: branchB, currentBranchId: branchA,
      inventoryItemId: invItem, itemQuantity: 2,
      createdById: user,
    });
    const movements = await t.run(async (ctx) => await ctx.db.query("stockMovements").collect());
    expect(movements).toHaveLength(1);
    expect(movements[0].type).toBe("sale");
    expect(movements[0].quantityChanged).toBe(-2);
  });

  it("PK-10: booking with itemQuantity > available throws", async () => {
    const { branchA, branchB } = await setupTestData(t);
    const invItem = await createInventoryItem(t, branchA);
    await expect(
      t.mutation(api.packages.create, {
        senderName: "A", senderContact: "1",
        receiverName: "B", receiverAddress: "addr", receiverContact: "2",
        packageType: "box", weight: 1,
        originBranchId: branchA, destinationBranchId: branchB, currentBranchId: branchA,
        inventoryItemId: invItem, itemQuantity: 15,
      })
    ).rejects.toThrow("Insufficient stock");
  });

  it("PK-11: booking with itemQuantity 0 does not touch stock", async () => {
    const { branchA, branchB } = await setupTestData(t);
    const invItem = await createInventoryItem(t, branchA);
    await t.mutation(api.packages.create, {
      senderName: "A", senderContact: "1",
      receiverName: "B", receiverAddress: "addr", receiverContact: "2",
      packageType: "box", weight: 1,
      originBranchId: branchA, destinationBranchId: branchB, currentBranchId: branchA,
      inventoryItemId: invItem, itemQuantity: 0,
    });
    const item = await t.run(async (ctx) => await ctx.db.get(invItem));
    expect(item!.quantity).toBe(10);
  });

  it("PK-12: booking writes movementLogs with status booked", async () => {
    const { branchA, branchB } = await setupTestData(t);
    const pkgId = await t.mutation(api.packages.create, {
      senderName: "A", senderContact: "1",
      receiverName: "B", receiverAddress: "addr", receiverContact: "2",
      packageType: "box", weight: 1,
      originBranchId: branchA, destinationBranchId: branchB, currentBranchId: branchA,
    });
    const logs = await t.run(async (ctx) =>
      (await ctx.db.query("movementLogs").withIndex("by_package", (q) => q.eq("packageId", pkgId)).collect())
    );
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs.some((l) => l.status === "booked")).toBe(true);
  });

  it("PK-13: updateStatus to delivered works", async () => {
    const { branchA, branchB, user } = await setupTestData(t);
    const pkgId = await t.mutation(api.packages.create, {
      senderName: "A", senderContact: "1",
      receiverName: "B", receiverAddress: "addr", receiverContact: "2",
      packageType: "box", weight: 1,
      originBranchId: branchA, destinationBranchId: branchB, currentBranchId: branchA,
    });
    await t.mutation(api.packages.updateStatus, {
      packageId: pkgId, status: "delivered", currentBranchId: branchB,
      details: "delivered", updatedById: user,
    });
    const pkg = await t.run(async (ctx) => await ctx.db.get(pkgId));
    expect(pkg!.status).toBe("delivered");
    const logs = await t.run(async (ctx) =>
      (await ctx.db.query("movementLogs").withIndex("by_package", (q) => q.eq("packageId", pkgId)).collect())
    );
    expect(logs.some((l) => l.status === "delivered")).toBe(true);
  });

  it("PK-14: updateStatus to returned restores stock", async () => {
    const { branchA, branchB, user } = await setupTestData(t);
    const invItem = await createInventoryItem(t, branchA);
    const pkgId = await t.mutation(api.packages.create, {
      senderName: "A", senderContact: "1",
      receiverName: "B", receiverAddress: "addr", receiverContact: "2",
      packageType: "box", weight: 1,
      originBranchId: branchA, destinationBranchId: branchB, currentBranchId: branchA,
      inventoryItemId: invItem, itemQuantity: 2,
    });
    // stock now 8; return it -> should go back to 10
    await t.mutation(api.packages.updateStatus, {
      packageId: pkgId, status: "returned", currentBranchId: branchB,
      details: "returned", updatedById: user,
    });
    const item = await t.run(async (ctx) => await ctx.db.get(invItem));
    expect(item!.quantity).toBe(10);
  });

  it("PK-15: updateStatus to returned twice only restores once", async () => {
    const { branchA, branchB, user } = await setupTestData(t);
    const invItem = await createInventoryItem(t, branchA);
    const pkgId = await t.mutation(api.packages.create, {
      senderName: "A", senderContact: "1",
      receiverName: "B", receiverAddress: "addr", receiverContact: "2",
      packageType: "box", weight: 1,
      originBranchId: branchA, destinationBranchId: branchB, currentBranchId: branchA,
      inventoryItemId: invItem, itemQuantity: 2,
    });
    // stock now 8
    await t.mutation(api.packages.updateStatus, {
      packageId: pkgId, status: "returned", currentBranchId: branchB,
      details: "return 1", updatedById: user,
    });
    // stock now 10
    await t.mutation(api.packages.updateStatus, {
      packageId: pkgId, status: "returned", currentBranchId: branchB,
      details: "return 2", updatedById: user,
    });
    // should still be 10, not 12
    const item = await t.run(async (ctx) => await ctx.db.get(invItem));
    expect(item!.quantity).toBe(10);
  });

  it("PK-16: updateStatus to returned with no inventory does not crash", async () => {
    const { branchA, branchB, user } = await setupTestData(t);
    const pkgId = await t.mutation(api.packages.create, {
      senderName: "A", senderContact: "1",
      receiverName: "B", receiverAddress: "addr", receiverContact: "2",
      packageType: "box", weight: 1,
      originBranchId: branchA, destinationBranchId: branchB, currentBranchId: branchA,
    });
    // no inventory item linked, should not throw
    await expect(
      t.mutation(api.packages.updateStatus, {
        packageId: pkgId, status: "returned", currentBranchId: branchB,
        details: "returned", updatedById: user,
      })
    ).resolves.toBeTruthy();
  });

  it("PK-17: allows skipping straight to delivered — no transition validation", async () => {
    const { branchA, branchB, user } = await setupTestData(t);
    const pkgId = await t.mutation(api.packages.create, {
      senderName: "A", senderContact: "1",
      receiverName: "B", receiverAddress: "addr", receiverContact: "2",
      packageType: "box", weight: 1,
      originBranchId: branchA, destinationBranchId: branchB, currentBranchId: branchA,
    });
    // go straight from booked to delivered, should succeed (the bug)
    await expect(
      t.mutation(api.packages.updateStatus, {
        packageId: pkgId, status: "delivered", currentBranchId: branchB,
        details: "skip", updatedById: user,
      })
    ).resolves.toBeTruthy();
  });
});
