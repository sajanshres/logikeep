import { mutation } from "./_generated/server";
import { hashPassword } from "./auth";

export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Check if database is already populated
    const existingBranches = await ctx.db.query("branches").collect();
    if (existingBranches.length > 0) {
      return "Database already seeded";
    }

    // 2. Add Branches
    const ktmId = await ctx.db.insert("branches", {
      name: "Kathmandu Main Hub",
      code: "KTM",
      address: "New Baneshwor, Kathmandu",
      city: "Kathmandu",
      contactNumber: "01-4455667",
      email: "ktm@logikeep.com.np",
      status: "active",
      createdAt: Date.now(),
    });

    const pkrId = await ctx.db.insert("branches", {
      name: "Pokhara Branch",
      code: "PKR",
      address: "Lakeside Road, Pokhara",
      city: "Pokhara",
      contactNumber: "061-552233",
      email: "pkr@logikeep.com.np",
      status: "active",
      createdAt: Date.now(),
    });

    const dhnId = await ctx.db.insert("branches", {
      name: "Dharan Branch",
      code: "DHN",
      address: "Bhanuchowk, Dharan",
      city: "Dharan",
      contactNumber: "025-520112",
      email: "dhn@logikeep.com.np",
      status: "active",
      createdAt: Date.now(),
    });

    // 3. Add Vendors/Suppliers
    const fastCargoId = await ctx.db.insert("vendors", {
      name: "Fast Cargo Nepal",
      contactPerson: "Sajan Shrestha",
      contactNumber: "9851000001",
      email: "vendor@logikeep.com.np",
      address: "Chabahil, Kathmandu",
      partnerType: "Courier",
      status: "active",
      createdAt: Date.now(),
    });

    const nepalCargoId = await ctx.db.insert("vendors", {
      name: "Nepal Cargo Services",
      contactPerson: "Ram Yadav",
      contactNumber: "9841223344",
      email: "ram@nepalcargo.com.np",
      address: "Birgunj, Parsa",
      partnerType: "Supplier",
      status: "active",
      createdAt: Date.now(),
    });

    // 4. Add Users
    // Admin User
    await ctx.db.insert("users", {
      name: "Administrator",
      email: "admin@logikeep.com.np",
      passwordHash: hashPassword("admin123"),
      role: "admin",
      active: true,
      createdAt: Date.now(),
    });

    await ctx.db.insert("users", {
      name: "Dharan Staff",
      email: "dharan@logikeep.com.np",
      passwordHash: hashPassword("dharan123"),
      role: "branch_staff",
      branchId: dhnId,
      active: true,
      createdAt: Date.now(),
    });

    await ctx.db.insert("users", {
      name: "Hari Prasad",
      email: "vendor@logikeep.com.np",
      passwordHash: hashPassword("vendor123"),
      role: "vendor",
      active: true,
      createdAt: Date.now(),
    });

    // 5. Add Inventory/Products
    await ctx.db.insert("inventory", {
      productName: "Thermal Labels 4x6",
      category: "Consumables",
      sku: "LAB-4X6-100",
      quantity: 50,
      lowStockAlert: 10,
      vendorId: fastCargoId,
      price: 15.0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("inventory", {
      productName: "Logistics Shipping Boxes (Medium)",
      category: "Packaging",
      sku: "BOX-MED-050",
      quantity: 15,
      lowStockAlert: 20, // Low stock trigger
      vendorId: nepalCargoId,
      price: 2.5,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 6. Add Packages
    const pkg1Id = await ctx.db.insert("packages", {
      trackingNumber: "LK-KTM-PKR-001",
      senderName: "Aarav Sharma",
      senderContact: "9801234567",
      senderAddress: "Baneshwor, Kathmandu",
      receiverName: "Prerna Joshi",
      receiverAddress: "Mahendrapool, Pokhara",
      receiverContact: "9812345678",
      packageType: "Document",
      weight: 0.5,
      dimensions: "30 x 20 x 5 cm",
      description: "Legal documents",
      status: "booked",
      originBranchId: ktmId,
      destinationBranchId: pkrId,
      currentBranchId: ktmId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 7. Add Movement Log for Package 1
    await ctx.db.insert("movementLogs", {
      packageId: pkg1Id,
      status: "booked",
      locationBranchId: ktmId,
      details: "Shipment booked at Kathmandu Hub",
      timestamp: Date.now(),
      updatedById: (await ctx.db.query("users").filter((q) => q.eq(q.field("role"), "admin")).first())!._id,
    });

    return "Database successfully seeded with mock branches, vendors, users, inventory, and tracking details!";
  },
});
