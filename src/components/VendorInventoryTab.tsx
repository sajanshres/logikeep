import type { Doc } from "../../convex/_generated/dataModel";

type VendorInventoryTabProps = {
  clientInventory: Doc<"inventory">[];
  clientMovements: Doc<"stockMovements">[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
};

export default function VendorInventoryTab({ clientInventory, clientMovements, searchQuery, setSearchQuery }: VendorInventoryTabProps) {
  const lowStockItems = clientInventory.filter((item) => item.quantity <= item.lowStockAlert);

  const sortedMovements = clientMovements
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp);

  const typeLabel = (t: string) => t === "purchase" ? "Stock In" : t === "sale" ? "Stock Out" : "Adjustment";

  return (
    <div className="swiss-card wireframe-panel">
      <div className="module-toolbar">
        <input type="text" placeholder="Search my inventory..." className="swiss-input module-search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      {lowStockItems.length > 0 && (
        <div style={{ background: "var(--brand-glow-hover)", border: "1px solid var(--brand-color)", padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "var(--brand-color)", fontWeight: 700 }}>
          ⚠ {lowStockItems.length} item(s) are below low-stock threshold
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Alert Level</th>
              <th>Price (NPR)</th>
            </tr>
          </thead>
          <tbody>
            {clientInventory
              .filter((item) => item.productName.toLowerCase().includes(searchQuery.toLowerCase()) || item.sku.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((item) => {
                const isLow = item.quantity <= item.lowStockAlert;
                return (
                  <tr key={item._id} style={isLow ? { background: "var(--brand-glow-hover)" } : {}}>
                    <td style={{ fontWeight: 700, color: isLow ? "var(--brand-color)" : "var(--title-color)" }}>{item.productName}</td>
                    <td className="code-text">{item.sku}</td>
                    <td>{item.category}</td>
                    <td className="code-text" style={{ fontWeight: 800, color: isLow ? "var(--brand-color)" : "var(--title-color)" }}>{item.quantity}</td>
                    <td className="code-text">{item.lowStockAlert}</td>
                    <td className="code-text">{item.price.toFixed(2)}</td>
                  </tr>
                );
              })}
            {clientInventory.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--badge-text)", padding: 24 }}>No inventory items found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h4 className="swiss-title" style={{ fontSize: 13, marginTop: 24, marginBottom: 12, textTransform: "uppercase" }}>Stock Movements</h4>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Change</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {sortedMovements.map((log) => (
              <tr key={log._id}>
                <td className="code-text" style={{ fontSize: 11, color: "var(--text-muted)" }}>{new Date(log.timestamp).toLocaleDateString()}</td>
                <td><span className="swiss-badge">{typeLabel(log.type)}</span></td>
                <td className="code-text" style={{ color: log.quantityChanged > 0 ? "var(--brand-color)" : "var(--danger)", fontWeight: 600 }}>{log.quantityChanged > 0 ? "+" : ""}{log.quantityChanged}</td>
                <td>{log.notes || "-"}</td>
              </tr>
            ))}
            {sortedMovements.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "var(--badge-text)", padding: 24 }}>No stock movements yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
