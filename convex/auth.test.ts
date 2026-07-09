import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./auth";
import { hashPassword as hashPasswordSrc } from "../src/auth";

describe("convex/auth.ts", () => {
  it("AU-01: hashPassword returns lk_ prefix", () => {
    const h = hashPassword("admin123");
    expect(h.startsWith("lk_")).toBe(true);
  });

  it("AU-02: same input gives same hash", () => {
    expect(hashPassword("admin123")).toBe(hashPassword("admin123"));
  });

  it("AU-03: different inputs give different hashes", () => {
    expect(hashPassword("admin123")).not.toBe(hashPassword("vendor123"));
  });

  it("AU-04: empty string still returns lk_ form", () => {
    const h = hashPassword("");
    expect(h.startsWith("lk_")).toBe(true);
  });

  it("AU-05: verifyPassword true for correct password", () => {
    const h = hashPassword("admin123");
    expect(verifyPassword("admin123", h)).toBe(true);
  });

  it("AU-06: verifyPassword false for wrong password", () => {
    const h = hashPassword("admin123");
    expect(verifyPassword("wrong", h)).toBe(false);
  });

  it("AU-07: verifyPassword true when stored equals plaintext (bug)", () => {
    expect(verifyPassword("plain", "plain")).toBe(true);
  });

  it("src and convex hashPassword implementations agree", () => {
    expect(hashPasswordSrc("test123")).toBe(hashPassword("test123"));
  });
});
