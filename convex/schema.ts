import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // users and roles (admin, staff, vendor)
  users: defineTable({
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(), // just simple hashes for local testing
    role: v.union(
      v.literal("admin"),
      v.literal("branch_staff"),
      v.literal("vendor")
    ),
    branchId: v.optional(v.id("branches")),
    phone: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  // branches / locations
  branches: defineTable({
    name: v.string(),
    code: v.string(), // KTM, PKR, DHN
    address: v.string(),
    city: v.string(),
    contactNumber: v.string(),
    email: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
    createdAt: v.number(),
  }).index("by_code", ["code"]),

  // packages / shipments
  packages: defineTable({
    trackingNumber: v.string(), // unique tracking number
    senderName: v.string(),
    senderContact: v.string(),
    senderAddress: v.optional(v.string()),
    receiverName: v.string(),
    receiverAddress: v.string(),
    receiverContact: v.string(),
    packageType: v.string(),
    weight: v.number(),
    dimensions: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("booked"),
      v.literal("in_transit"),
      v.literal("arrived_at_branch"),
      v.literal("out_for_delivery"),
      v.literal("delivered"),
      v.literal("returned")
    ),
    originBranchId: v.id("branches"),
    destinationBranchId: v.id("branches"),
    currentBranchId: v.id("branches"),
    assignedVendorId: v.optional(v.id("vendors")), // vendor handling this package
    driverName: v.optional(v.string()),
    vehicleNumber: v.optional(v.string()),
    driverPhone: v.optional(v.string()),
    inventoryItemId: v.optional(v.id("inventory")),
    itemQuantity: v.optional(v.number()),
    receivedBy: v.optional(v.string()),
    deliveryNotes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tracking", ["trackingNumber"])
    .index("by_status", ["status"])
    .index("by_current_branch", ["currentBranchId"]),

  // vendors / suppliers
  vendors: defineTable({
    name: v.string(),
    contactPerson: v.string(),
    contactNumber: v.string(),
    email: v.string(),
    address: v.string(),
    partnerType: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
    createdAt: v.number(),
  }),

  // inventory items
  inventory: defineTable({
    productName: v.string(),
    category: v.string(),
    sku: v.string(), // SKU code
    quantity: v.number(),
    lowStockAlert: v.number(),
    vendorId: v.id("vendors"), // supplier who provides it
    branchId: v.id("branches"), // which branch this stock belongs to
    price: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_sku", ["sku"]).index("by_branch", ["branchId"]),

  // logs of tracking updates
  movementLogs: defineTable({
    packageId: v.id("packages"),
    status: v.string(),
    locationBranchId: v.id("branches"),
    details: v.string(), // e.g., "Received at Kathmandu Branch"
    timestamp: v.number(),
    updatedById: v.id("users"), // User who recorded this update
  }).index("by_package", ["packageId"]),

  // logs of inventory updates (purchases, sales, audits)
  stockMovements: defineTable({
    productId: v.id("inventory"),
    type: v.union(v.literal("purchase"), v.literal("sale"), v.literal("adjustment")),
    quantityChanged: v.number(), // positive for purchase, negative for sale/use
    notes: v.optional(v.string()),
    updatedById: v.id("users"),
    timestamp: v.number(),
  }).index("by_product", ["productId"]).index("by_timestamp", ["timestamp"]),
});
