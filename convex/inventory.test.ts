import { describe, it, expect, beforeEach } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api } from "./_generated/api";

// clear all data before each test
const t = convexTest(schema);

const tables = ["stockMovements", "movementLogs", "packages", "inventory", "vendors", "users", "branches"] as const;

beforeEach(async () => {
  await t.run(async (ctx) => {
    for (const name of tables) {
      const docs = await ctx.db.query(name).collect();
      for (const d of docs) {
        await ctx.db.delete(d._id);
      }
    }
  });
});

// helper to set up branches, vendor, and user for each test
async function setupInventory(t: ReturnType<typeof convexTest>) {
  const vendor = await t.run(async (ctx) => {
    return await ctx.db.insert("vendors", {
      name: "Test Vendor", contactPerson: "Test", contactNumber: "999",
      email: "vendor@test.com", address: "addr", partnerType: "supplier",
      status: "active", createdAt: Date.now(),
    });
  });
  const branch = await t.run(async (ctx) => {
    return await ctx.db.insert("branches", {
      name: "Kathmandu", code: "KTM", address: "123 Main St", city: "Kathmandu",
      contactNumber: "01-1234", email: "ktm@test.com", status: "active", createdAt: Date.now(),
    });
  });
  const user = await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      name: "Admin", email: "admin@test.com", passwordHash: "hashed",
      role: "admin", active: true, createdAt: Date.now(),
    });
  });
  return { vendor, branch, user };
}

async function createProduct(t: ReturnType<typeof convexTest>, branchId: string, vendorId: string, userId: string) {
  return await t.mutation(api.inventory.createProduct, {
    productName: "Widget", category: "cat", sku: "W001",
    quantity: 10, lowStockAlert: 2, vendorId, branchId, price: 100,
    updatedById: userId,
  });
}

describe("inventory", () => {
  it("IN-01: createProduct with negative quantity throws", async () => {
    const { vendor, branch, user } = await setupInventory(t);
    await expect(
      t.mutation(api.inventory.createProduct, {
        productName: "Widget", category: "cat", sku: "W001",
        quantity: -1, lowStockAlert: 2, vendorId: vendor, branchId: branch,
        price: 100, updatedById: user,
      })
    ).rejects.toThrow("Quantity cannot be negative.");
  });

  it("IN-02: createProduct with negative lowStockAlert throws", async () => {
    const { vendor, branch, user } = await setupInventory(t);
    await expect(
      t.mutation(api.inventory.createProduct, {
        productName: "Widget", category: "cat", sku: "W001",
        quantity: 10, lowStockAlert: -1, vendorId: vendor, branchId: branch,
        price: 100, updatedById: user,
      })
    ).rejects.toThrow("Low stock alert cannot be negative.");
  });

  it("IN-03: createProduct with quantity 0 succeeds", async () => {
    const { vendor, branch, user } = await setupInventory(t);
    const id = await t.mutation(api.inventory.createProduct, {
      productName: "Widget", category: "cat", sku: "W001",
      quantity: 0, lowStockAlert: 2, vendorId: vendor, branchId: branch,
      price: 100, updatedById: user,
    });
    expect(id).toBeTruthy();
  });

  it("IN-04: updateStock with negative newQuantity throws", async () => {
    const { vendor, branch, user } = await setupInventory(t);
    const productId = await createProduct(t, branch, vendor, user);
    await expect(
      t.mutation(api.inventory.updateStock, {
        productId, newQuantity: -1, type: "sale", quantityChanged: -5, updatedById: user,
      })
    ).rejects.toThrow("Quantity cannot be negative.");
  });

  it("IN-05: updateStock writes stockMovements row", async () => {
    const { vendor, branch, user } = await setupInventory(t);
    const productId = await createProduct(t, branch, vendor, user);
    await t.mutation(api.inventory.updateStock, {
      productId, newQuantity: 8, type: "sale", quantityChanged: -2, updatedById: user,
    });
    const movements = await t.run(async (ctx) =>
      await ctx.db.query("stockMovements").withIndex("by_product", (q) => q.eq("productId", productId)).collect()
    );
    // find the sale movement among the rows
    const saleMovements = movements.filter(m => m.type === "sale");
    expect(saleMovements).toHaveLength(1);
    expect(saleMovements[0].type).toBe("sale");
    expect(saleMovements[0].quantityChanged).toBe(-2);
  });

  it("IN-06: updateStock with no notes defaults to Manual stock update", async () => {
    const { vendor, branch, user } = await setupInventory(t);
    const productId = await createProduct(t, branch, vendor, user);
    await t.mutation(api.inventory.updateStock, {
      productId, newQuantity: 8, type: "adjustment", quantityChanged: -2, updatedById: user,
    });
    const movements = await t.run(async (ctx) =>
      await ctx.db.query("stockMovements").withIndex("by_product", (q) => q.eq("productId", productId)).collect()
    );
    expect(movements.some(m => m.notes === "Manual stock update")).toBe(true);
  });

  it("IN-07: getMovements returns only rows for requested product", async () => {
    const { vendor, branch, user } = await setupInventory(t);
    const productA = await createProduct(t, branch, vendor, user);
    const productB = await t.mutation(api.inventory.createProduct, {
      productName: "Gadget", category: "cat", sku: "G001",
      quantity: 5, lowStockAlert: 1, vendorId: vendor, branchId: branch,
      price: 200, updatedById: user,
    });
    // add movements to both
    await t.mutation(api.inventory.updateStock, {
      productId: productA, newQuantity: 8, type: "sale", quantityChanged: -2, updatedById: user,
    });
    await t.mutation(api.inventory.updateStock, {
      productId: productB, newQuantity: 3, type: "sale", quantityChanged: -2, updatedById: user,
    });
    const movements = await t.query(api.inventory.getMovements, { productId: productA });
    // all returned should be for productA only
    expect(movements.length).toBeGreaterThan(0);
    expect(movements.every(m => m.productId === productA)).toBe(true);
  });
});
