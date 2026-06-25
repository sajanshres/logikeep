import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User profiles and role-based access control (RBAC)
  users: defineTable({
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(), // Simple hash for local/development storage
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

  // Branches/Offices handling logistics and transfers
  branches: defineTable({
    name: v.string(),
    code: v.string(), // e.g., KTM, PKR, DHN
    address: v.string(),
    city: v.string(),
    contactNumber: v.string(),
    email: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
    createdAt: v.number(),
  }).index("by_code", ["code"]),

  // Packages/Shipments details
  packages: defineTable({
    trackingNumber: v.string(), // Unique tracking code
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
    assignedVendorId: v.optional(v.id("vendors")), // Assigned carrier or transport supplier
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tracking", ["trackingNumber"])
    .index("by_status", ["status"])
    .index("by_current_branch", ["currentBranchId"]),

  // Vendors/Suppliers/Carriers
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

  // Inventory/Product records
  inventory: defineTable({
    productName: v.string(),
    category: v.string(),
    sku: v.string(), // Stock Keeping Unit
    quantity: v.number(),
    lowStockAlert: v.number(),
    vendorId: v.id("vendors"), // Associated supplier
    price: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_sku", ["sku"]),

  // Logs for package/shipment tracking updates
  movementLogs: defineTable({
    packageId: v.id("packages"),
    status: v.string(),
    locationBranchId: v.id("branches"),
    details: v.string(), // Description of movement, e.g., "Received at Kathmandu Branch"
    timestamp: v.number(),
    updatedById: v.id("users"), // User who recorded this update
  }).index("by_package", ["packageId"]),
});
