import { describe, it, expect, beforeEach } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api } from "./_generated/api";

// clear users before each test
const t = convexTest(schema);

beforeEach(async () => {
  await t.run(async (ctx) => {
    const users = await ctx.db.query("users").collect();
    for (const u of users) {
      await ctx.db.delete(u._id);
    }
  });
});

describe("users", () => {
  it("US-01: create stores hashed password not plaintext", async () => {
    await t.mutation(api.users.create, {
      name: "New", email: "new@test.com", passwordHash: "mypassword",
      role: "branch_staff", active: true,
    });
    const user = await t.query(api.users.getByEmail, { email: "new@test.com" });
    expect(user!.passwordHash).not.toBe("mypassword");
  });

  it("US-02: getByEmail finds a seeded user", async () => {
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        name: "Admin", email: "admin@test.com", passwordHash: "hashed",
        role: "admin", active: true, createdAt: Date.now(),
      });
    });
    const user = await t.query(api.users.getByEmail, { email: "admin@test.com" });
    expect(user).not.toBeNull();
    expect(user!.email).toBe("admin@test.com");
  });

  it("US-03: getByEmail returns null for unknown email", async () => {
    const user = await t.query(api.users.getByEmail, { email: "nobody@test.com" });
    expect(user).toBeNull();
  });

  it("US-04: listPublic never returns passwordHash", async () => {
    // seed a few users
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        name: "Admin", email: "admin@test.com", passwordHash: "hashed",
        role: "admin", active: true, createdAt: Date.now(),
      });
      await ctx.db.insert("users", {
        name: "Staff", email: "staff@test.com", passwordHash: "hashed2",
        role: "branch_staff", active: true, createdAt: Date.now(),
      });
    });
    const users = await t.query(api.users.listPublic, {});
    for (const u of users) {
      expect(u).not.toHaveProperty("passwordHash");
    }
  });

  it("US-05: create with duplicate email succeeds no server guard", async () => {
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        name: "Admin", email: "admin@test.com", passwordHash: "hashed",
        role: "admin", active: true, createdAt: Date.now(),
      });
    });
    // creating another user with same email — should succeed (no unique constraint)
    const id = await t.mutation(api.users.create, {
      name: "Another", email: "admin@test.com", passwordHash: "other123",
      role: "branch_staff", active: true,
    });
    expect(id).toBeTruthy();
  });
});
