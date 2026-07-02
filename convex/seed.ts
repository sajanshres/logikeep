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

    // add client businesses (vendors = clients whose goods we warehouse and ship)
    const himalayanHandicraftsId = await ctx.db.insert("vendors", {
      name: "Himalayan Handicrafts",
      contactPerson: "Sajan Shrestha",
      contactNumber: "9851000001",
      email: "vendor@logikeep.com.np",
      address: "Chabahil, Kathmandu",
      partnerType: "Retailer",
      status: "active",
      createdAt: Date.now(),
    });

    const gorkhaGarmentsId = await ctx.db.insert("vendors", {
      name: "Gorkha Garments",
      contactPerson: "Ram Yadav",
      contactNumber: "9841223344",
      email: "ram@gorkhagarments.com.np",
      address: "Birgunj, Parsa",
      partnerType: "Manufacturer",
      status: "active",
      createdAt: Date.now(),
    });

    const annapurnaOrganicsId = await ctx.db.insert("vendors", {
      name: "Annapurna Organics",
      contactPerson: "Krishna Thapa",
      contactNumber: "9856033445",
      email: "krishna@annapurnaorganics.com.np",
      address: "Milanchowk, Butwal",
      partnerType: "Distributor",
      status: "active",
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

    // add client goods inventory (split across branches)
    // Dharan branch stock
    const pashminaShawlsId = await ctx.db.insert("inventory", {
      productName: "Pashmina Shawls",
      category: "Textiles",
      sku: "TEX-PASH-001",
      quantity: 12,
      lowStockAlert: 10,
      vendorId: himalayanHandicraftsId,
      branchId: dhnId,
      price: 2500.0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const phoneCasesId = await ctx.db.insert("inventory", {
      productName: "Denim Jackets",
      category: "Textiles",
      sku: "TEX-DENIM-030",
      quantity: 8,
      lowStockAlert: 10, // Low stock trigger
      vendorId: gorkhaGarmentsId,
      branchId: dhnId,
      price: 2200.0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("inventory", {
      productName: "Organic Tea Packs",
      category: "Food & Beverage",
      sku: "FB-TEA-010",
      quantity: 3,
      lowStockAlert: 5, // Low stock trigger
      vendorId: annapurnaOrganicsId,
      branchId: dhnId,
      price: 450.0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Kathmandu branch stock
    const handmadeCarpetsId = await ctx.db.insert("inventory", {
      productName: "Handmade Carpets",
      category: "Textiles",
      sku: "TEX-CARP-002",
      quantity: 6,
      lowStockAlert: 8, // Low stock trigger
      vendorId: himalayanHandicraftsId,
      branchId: ktmId,
      price: 8500.0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("inventory", {
      productName: "Winter Jackets (Carton)",
      category: "Textiles",
      sku: "TEX-WINT-020",
      quantity: 20,
      lowStockAlert: 15,
      vendorId: gorkhaGarmentsId,
      branchId: ktmId,
      price: 3500.0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const rockSaltId = await ctx.db.insert("inventory", {
      productName: "Himalayan Rock Salt",
      category: "Food & Beverage",
      sku: "FB-SALT-005",
      quantity: 4,
      lowStockAlert: 10, // Low stock trigger
      vendorId: annapurnaOrganicsId,
      branchId: ktmId,
      price: 280.0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("inventory", {
      productName: "Cotton Kurtas",
      category: "Textiles",
      sku: "TEX-KURT-015",
      quantity: 35,
      lowStockAlert: 20,
      vendorId: gorkhaGarmentsId,
      branchId: ktmId,
      price: 1800.0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // some stock movement history so the ledger isnt empty
    const day = 24 * 60 * 60 * 1000;
    await ctx.db.insert("stockMovements", {
      productId: pashminaShawlsId,
      type: "purchase",
      quantityChanged: 50,
      notes: "Stock received from Himalayan Handicrafts",
      updatedById: adminUserId,
      timestamp: Date.now() - 5 * day,
    });
    await ctx.db.insert("stockMovements", {
      productId: handmadeCarpetsId,
      type: "purchase",
      quantityChanged: 30,
      notes: "Received Gorkha Garments shipment",
      updatedById: adminUserId,
      timestamp: Date.now() - 4 * day,
    });
    await ctx.db.insert("stockMovements", {
      productId: phoneCasesId,
      type: "sale",
      quantityChanged: -4,
      notes: "Dispatched for delivery to Pokhara",
      updatedById: adminUserId,
      timestamp: Date.now() - 3 * day,
    });
    await ctx.db.insert("stockMovements", {
      productId: rockSaltId,
      type: "sale",
      quantityChanged: -6,
      notes: "Dispatched for delivery to Dharan",
      updatedById: adminUserId,
      timestamp: Date.now() - 2 * day,
    });
    await ctx.db.insert("stockMovements", {
      productId: handmadeCarpetsId,
      type: "adjustment",
      quantityChanged: -2,
      notes: "Damaged units written off",
      updatedById: adminUserId,
      timestamp: Date.now() - 1 * day,
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
      assignedVendorId: himalayanHandicraftsId,
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
      assignedVendorId: gorkhaGarmentsId,
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
      assignedVendorId: gorkhaGarmentsId,
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
      details: "Shipment dispatched for client delivery",
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
      details: "Shipment dispatched for client delivery",
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
      details: "Shipment dispatched for client delivery",
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
    for (const s of await ctx.db.query("stockMovements").collect()) {
      await ctx.db.delete(s._id);
    }
    return "Database cleared!";
  },
});
