import { mutation } from "./_generated/server";
import { hashPassword } from "./auth";

export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // check if database is already seeded
    const existingBranches = await ctx.db.query("branches").collect();
    if (existingBranches.length > 0) {
      return "Database already seeded";
    }

    // add mock branches
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

    const brtId = await ctx.db.insert("branches", {
      name: "Biratnagar Branch",
      code: "BRT",
      address: "Main Road, Biratnagar",
      city: "Biratnagar",
      contactNumber: "021-441122",
      email: "brt@logikeep.com.np",
      status: "active",
      createdAt: Date.now(),
    });

    await ctx.db.insert("branches", {
      name: "Butwal Branch",
      code: "BUT",
      address: "Traffic Chowk, Butwal",
      city: "Butwal",
      contactNumber: "071-540112",
      email: "but@logikeep.com.np",
      status: "inactive", // Set one branch as inactive for demonstration
      createdAt: Date.now(),
    });

    // add transport vendors
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

    const gorkhaId = await ctx.db.insert("vendors", {
      name: "Gorkha Transport Services",
      contactPerson: "Krishna Thapa",
      contactNumber: "9856033445",
      email: "krishna@gorkha.com.np",
      address: "Milanchowk, Butwal",
      partnerType: "Logistics Partner",
      status: "active",
      createdAt: Date.now(),
    });

    await ctx.db.insert("vendors", {
      name: "Himalayan Delivery",
      contactPerson: "Pemba Sherpa",
      contactNumber: "9801122334",
      email: "pemba@himalayandelivey.com",
      address: "Boudha, Kathmandu",
      partnerType: "Local Carrier",
      status: "inactive",
      createdAt: Date.now(),
    });

    // add default users
    const adminUserId = await ctx.db.insert("users", {
      name: "Branch Manager",
      email: "admin@logikeep.com.np",
      passwordHash: hashPassword("admin123"),
      role: "admin",
      active: true,
      createdAt: Date.now(),
    });

    await ctx.db.insert("users", {
      name: "Kathmandu Staff",
      email: "ktm@logikeep.com.np",
      passwordHash: hashPassword("ktm123"),
      role: "branch_staff",
      branchId: ktmId,
      active: true,
      createdAt: Date.now(),
    });

    await ctx.db.insert("users", {
      name: "Pokhara Staff",
      email: "pkr@logikeep.com.np",
      passwordHash: hashPassword("pkr123"),
      role: "branch_staff",
      branchId: pkrId,
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

    // add inventory supplies for testing (split across branches)
    // Dharan branch stock
    await ctx.db.insert("inventory", {
      productName: "Thermal Labels 4x6",
      category: "Consumables",
      sku: "LAB-4X6-100",
      quantity: 50,
      lowStockAlert: 10,
      vendorId: fastCargoId,
      branchId: dhnId,
      price: 15.0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("inventory", {
      productName: "Bubble Wrap Roll 100m",
      category: "Packaging",
      sku: "BUB-WRP-100",
      quantity: 8,
      lowStockAlert: 10, // Low stock trigger
      vendorId: nepalCargoId,
      branchId: dhnId,
      price: 12.0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("inventory", {
      productName: "Clipboards",
      category: "Stationery",
      sku: "ST-CLP-01",
      quantity: 3,
      lowStockAlert: 5, // Low stock trigger
      vendorId: gorkhaId,
      branchId: dhnId,
      price: 4.5,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Kathmandu branch stock
    await ctx.db.insert("inventory", {
      productName: "Logistics Shipping Boxes (Medium)",
      category: "Packaging",
      sku: "BOX-MED-050",
      quantity: 15,
      lowStockAlert: 20, // Low stock trigger
      vendorId: nepalCargoId,
      branchId: ktmId,
      price: 2.5,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("inventory", {
      productName: "Weighing Scale 50kg",
      category: "Equipment",
      sku: "EQ-SCALE-50",
      quantity: 4,
      lowStockAlert: 1,
      vendorId: gorkhaId,
      branchId: ktmId,
      price: 85.0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("inventory", {
      productName: "Packing Tape Rolls",
      category: "Packaging",
      sku: "PKG-TAPE-48",
      quantity: 6,
      lowStockAlert: 12, // Low stock trigger
      vendorId: fastCargoId,
      branchId: ktmId,
      price: 1.8,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("inventory", {
      productName: "Permanent Markers",
      category: "Stationery",
      sku: "ST-MRK-12",
      quantity: 30,
      lowStockAlert: 10,
      vendorId: gorkhaId,
      branchId: ktmId,
      price: 0.9,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // add some package entries
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
      createdAt: Date.now() - 3600000 * 2, // 2 hours ago
      updatedAt: Date.now() - 3600000 * 2,
    });

    const pkg2Id = await ctx.db.insert("packages", {
      trackingNumber: "LK-KTM-DHN-002",
      senderName: "Kabita Shrestha",
      senderContact: "9812233445",
      senderAddress: "Tripureshwor, Kathmandu",
      receiverName: "Roshan Rai",
      receiverAddress: "Dharan-12, Sunsari",
      receiverContact: "9852022334",
      packageType: "Box",
      weight: 4.2,
      dimensions: "40 x 30 x 30 cm",
      description: "Winter clothes",
      status: "in_transit",
      originBranchId: ktmId,
      destinationBranchId: dhnId,
      currentBranchId: ktmId,
      assignedVendorId: fastCargoId,
      createdAt: Date.now() - 3600000 * 12, // 12 hours ago
      updatedAt: Date.now() - 3600000 * 6,
    });

    const pkg3Id = await ctx.db.insert("packages", {
      trackingNumber: "LK-PKR-KTM-003",
      senderName: "Sameer Thapa",
      senderContact: "9846012345",
      senderAddress: "Lakeside, Pokhara",
      receiverName: "Anjali Gupta",
      receiverAddress: "Koteshwor, Kathmandu",
      receiverContact: "9803344556",
      packageType: "Fragile",
      weight: 1.8,
      dimensions: "25 x 25 x 25 cm",
      description: "Handicrafts & vase",
      status: "arrived_at_branch",
      originBranchId: pkrId,
      destinationBranchId: ktmId,
      currentBranchId: ktmId,
      assignedVendorId: fastCargoId,
      createdAt: Date.now() - 3600000 * 24, // 24 hours ago
      updatedAt: Date.now() - 3600000 * 4,
    });

    const pkg4Id = await ctx.db.insert("packages", {
      trackingNumber: "LK-DHN-PKR-004",
      senderName: "Bishal Tamang",
      senderContact: "9815044332",
      senderAddress: "Bhanuchowk, Dharan",
      receiverName: "Gopal Adhikari",
      receiverAddress: "Srijanachowk, Pokhara",
      receiverContact: "9845012345",
      packageType: "Packet",
      weight: 0.8,
      dimensions: "20 x 15 x 10 cm",
      description: "Mobile accessories",
      status: "delivered",
      originBranchId: dhnId,
      destinationBranchId: pkrId,
      currentBranchId: pkrId,
      assignedVendorId: nepalCargoId,
      createdAt: Date.now() - 3600000 * 48, // 48 hours ago
      updatedAt: Date.now() - 3600000 * 10,
    });

    await ctx.db.insert("packages", {
      trackingNumber: "LK-KTM-BRT-005",
      senderName: "Niranjan Mahat",
      senderContact: "9851022339",
      senderAddress: "Lazimpat, Kathmandu",
      receiverName: "Sunita Yadav",
      receiverAddress: "Tintolia, Biratnagar",
      receiverContact: "9804011223",
      packageType: "Box",
      weight: 8.5,
      dimensions: "50 x 50 x 40 cm",
      description: "Office documents & stationeries",
      status: "booked",
      originBranchId: ktmId,
      destinationBranchId: brtId,
      currentBranchId: ktmId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // add activity logs for tracking progress
    await ctx.db.insert("movementLogs", {
      packageId: pkg1Id,
      status: "booked",
      locationBranchId: ktmId,
      details: "Shipment booked at Kathmandu Hub",
      timestamp: Date.now() - 3600000 * 2,
      updatedById: adminUserId,
    });

    await ctx.db.insert("movementLogs", {
      packageId: pkg2Id,
      status: "booked",
      locationBranchId: ktmId,
      details: "Shipment booked at Kathmandu Hub",
      timestamp: Date.now() - 3600000 * 12,
      updatedById: adminUserId,
    });
    await ctx.db.insert("movementLogs", {
      packageId: pkg2Id,
      status: "in_transit",
      locationBranchId: ktmId,
      details: "Shipment dispatched via Fast Cargo Nepal",
      timestamp: Date.now() - 3600000 * 6,
      updatedById: adminUserId,
    });

    await ctx.db.insert("movementLogs", {
      packageId: pkg3Id,
      status: "booked",
      locationBranchId: pkrId,
      details: "Shipment booked at Pokhara Branch",
      timestamp: Date.now() - 3600000 * 24,
      updatedById: adminUserId,
    });
    await ctx.db.insert("movementLogs", {
      packageId: pkg3Id,
      status: "in_transit",
      locationBranchId: pkrId,
      details: "Shipment dispatched via Fast Cargo Nepal",
      timestamp: Date.now() - 3600000 * 18,
      updatedById: adminUserId,
    });
    await ctx.db.insert("movementLogs", {
      packageId: pkg3Id,
      status: "arrived_at_branch",
      locationBranchId: ktmId,
      details: "Shipment arrived at Kathmandu Main Hub",
      timestamp: Date.now() - 3600000 * 4,
      updatedById: adminUserId,
    });

    await ctx.db.insert("movementLogs", {
      packageId: pkg4Id,
      status: "booked",
      locationBranchId: dhnId,
      details: "Shipment booked at Dharan Branch",
      timestamp: Date.now() - 3600000 * 48,
      updatedById: adminUserId,
    });
    await ctx.db.insert("movementLogs", {
      packageId: pkg4Id,
      status: "in_transit",
      locationBranchId: dhnId,
      details: "Shipment dispatched via Nepal Cargo Services",
      timestamp: Date.now() - 3600000 * 36,
      updatedById: adminUserId,
    });
    await ctx.db.insert("movementLogs", {
      packageId: pkg4Id,
      status: "arrived_at_branch",
      locationBranchId: pkrId,
      details: "Shipment arrived at Pokhara Branch",
      timestamp: Date.now() - 3600000 * 18,
      updatedById: adminUserId,
    });
    await ctx.db.insert("movementLogs", {
      packageId: pkg4Id,
      status: "delivered",
      locationBranchId: pkrId,
      details: "Shipment successfully delivered to Gopal Adhikari",
      timestamp: Date.now() - 3600000 * 10,
      updatedById: adminUserId,
    });

    return "Database successfully seeded with richer branches, vendors, users, inventory, and tracking details!";
  },
});

export const clearDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    for (const u of await ctx.db.query("users").collect()) {
      await ctx.db.delete(u._id);
    }
    for (const b of await ctx.db.query("branches").collect()) {
      await ctx.db.delete(b._id);
    }
    for (const v of await ctx.db.query("vendors").collect()) {
      await ctx.db.delete(v._id);
    }
    for (const p of await ctx.db.query("packages").collect()) {
      await ctx.db.delete(p._id);
    }
    for (const i of await ctx.db.query("inventory").collect()) {
      await ctx.db.delete(i._id);
    }
    for (const l of await ctx.db.query("movementLogs").collect()) {
      await ctx.db.delete(l._id);
    }
    return "Database cleared!";
  },
});
