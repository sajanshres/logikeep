import { Pencil, Trash2 } from "lucide-react";
import type { Doc, Id } from "../../convex/_generated/dataModel";

type ModalKind = "user" | "branch" | "package" | "vendor" | "inventory" | "transaction" | "history" | null;

// inventory tab - product stock table, low stock banner and stock adjust
type InventoryProps = {
  dbInventory: Doc<"inventory">[];
  dbVendors: Doc<"vendors">[];
  lowStockItems: Doc<"inventory">[];
  notifyLowStock: boolean;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  txProductId: Id<"inventory"> | null;
  setTxProductId: (v: Id<"inventory"> | null) => void;
  setModalOpen: (v: ModalKind) => void;
  loggedInDbUser: { _id: Id<"users"> } | null | undefined;
  openEditProduct: (item: Doc<"inventory">) => void;
  resetProductForm: () => void;
  updateStock: (args: { productId: Id<"inventory">; newQuantity: number; type: "purchase" | "sale" | "adjustment"; quantityChanged: number; notes?: string; updatedById: Id<"users"> }) => Promise<unknown>;
  removeProduct: (args: { productId: Id<"inventory"> }) => Promise<unknown>;
};

export default function Inventory({
  dbInventory, dbVendors, lowStockItems, notifyLowStock,
  searchQuery, setSearchQuery, txProductId, setTxProductId, setModalOpen,
  loggedInDbUser, openEditProduct, resetProductForm, updateStock, removeProduct,
}: InventoryProps) {
  return (
          <div className="swiss-card wireframe-panel">
            <div className="module-toolbar">
              <input type="text" placeholder="Search products..." className="swiss-input module-search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <button className="swiss-btn" onClick={() => { resetProductForm(); setModalOpen("inventory"); }}>+ Add Product</button>
            </div>

            {/* Low stock alert */}
            {notifyLowStock && lowStockItems.length > 0 && (
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
                    <th>Supplier</th>
                    <th>Quantity</th>
                    <th>Alert Level</th>
                    <th>Price (NPR)</th>
                    <th>Adjust</th>
                  </tr>
                </thead>
                <tbody>
                  {dbInventory
                    .filter((item) => item.productName.toLowerCase().includes(searchQuery.toLowerCase()) || item.sku.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((item) => {
                      const isLow = item.quantity <= item.lowStockAlert;
                      const vendor = dbVendors.find((v) => v._id === item.vendorId);
                      return (
                        <tr key={item._id} style={isLow ? { background: "var(--brand-glow-hover)" } : {}}>
                          <td style={{ fontWeight: 700, color: isLow ? "var(--brand-color)" : "var(--title-color)" }}>{item.productName}</td>
                          <td className="code-text">{item.sku}</td>
                          <td>{item.category}</td>
                          <td>{vendor?.name || "—"}</td>
                          <td className="code-text" style={{ fontWeight: 800, color: isLow ? "var(--brand-color)" : "var(--title-color)" }}>{item.quantity}</td>
                          <td className="code-text">{item.lowStockAlert}</td>
                          <td className="code-text">{item.price.toFixed(2)}</td>
                          <td style={{ display: "flex", gap: 4 }}>
                            <button
                              className="secondary-btn"
                              style={{ padding: "2px 8px", fontSize: 12, fontWeight: 800 }}
                              onClick={() => updateStock({ 
                                productId: item._id, 
                                newQuantity: Math.max(0, item.quantity - 1),
                                type: "adjustment",
                                quantityChanged: -1,
                                notes: "Quick inline adjustment",
                                updatedById: loggedInDbUser!._id
                              })}
                            >−</button>
                            <button
                              className="secondary-btn"
                              style={{ padding: "2px 8px", fontSize: 12, fontWeight: 800 }}
                              onClick={() => updateStock({ 
                                productId: item._id, 
                                newQuantity: item.quantity + 1,
                                type: "adjustment",
                                quantityChanged: 1,
                                notes: "Quick inline adjustment",
                                updatedById: loggedInDbUser!._id
                              })}
                            >+</button>
                            <button
                              className="swiss-btn"
                              style={{ padding: "2px 8px", fontSize: 12 }}
                              onClick={() => {
                                setTxProductId(item._id);
                                setModalOpen("transaction");
                              }}
                            >Log Tx</button>
                            <button
                              className="secondary-btn"
                              style={{ padding: "2px 8px", fontSize: 12 }}
                              onClick={() => {
                                setTxProductId(item._id);
                                setModalOpen("history");
                              }}
                            >History</button>
                            <button
                              className="icon-btn"
                              title="Edit product"
                              onClick={() => openEditProduct(item)}
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              className="icon-btn icon-btn-danger"
                              title="Delete product"
                              onClick={async () => {
                                if (confirm(`Delete product ${item.productName}?`)) {
                                  try {
                                    await removeProduct({ productId: item._id });
                                    if (txProductId === item._id) {
                                      setTxProductId(null);
                                    }
                                  } catch (error) {
                                    alert(error instanceof Error ? error.message : "Could not delete this product.");
                                  }
                                }
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
  );
}
