# LogiKeep Project - Logistics ERP

This is my logistics ERP college project. I used React, TypeScript, Vite, and Convex for the backend database.

## What it does
- **Branches**: KTM, Pokhara, and Dharan branches. You can manage them.
- **Packages**: Book packages and update where they are (booked, in transit, etc).
- **Users**: Admin, staff, and vendor roles.
- **Inventory**: Added inventory management. You can manage boxes, thermal labels, change stock amounts, and it has low stock warnings.
- **Reports**: Shipment ledger, stock movement ledger, and CSV export.

## Tech stack
- Vite with React
- TypeScript
- Convex for database
- Vanilla CSS (styling is swiss dark style)
- Lucide React icons

## How to run it:
1. Run `bun install` or `npm install` to get the dependencies
2. Start the frontend: `bun run dev`
3. Start the backend watcher: `npx convex dev`
4. Run the seed script to load default database entries: `npx convex run seed:seedDatabase`

## Database tables
- `users`: for logging in
- `branches`: the hub locations
- `vendors`: courier partners
- `packages`: package details and status
- `inventory`: storage items
- `movementLogs`: tracking details
- `stockMovements`: purchase, sale, and adjustment history
