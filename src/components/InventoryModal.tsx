import type { FormEvent } from "react";
import type { Doc, Id } from "../../convex/_generated/dataModel";

type ModalKind = "user" | "branch" | "package" | "vendor" | "inventory" | "transaction" | "history" | null;

type InventoryModalProps = {
  editingProductId: Id<"inventory"> | null;
  newProductName: string; setNewProductName: (v: string) => void;
  newProductCategory: string; setNewProductCategory: (v: string) => void;
  newProductSku: string; setNewProductSku: (v: string) => void;
  newProductQty: string; setNewProductQty: (v: string) => void;
  newProductAlert: string; setNewProductAlert: (v: string) => void;
  newProductPrice: string; setNewProductPrice: (v: string) => void;
  newProductVendorIdx: number; setNewProductVendorIdx: (v: number) => void;
  dbVendors: Doc<"vendors">[];
  handleSaveProduct: (e: FormEvent) => void;
  resetProductForm: () => void;
  setModalOpen: (v: ModalKind) => void;
};

export default function InventoryModal({ editingProductId, newProductName, setNewProductName, newProductCategory, setNewProductCategory, newProductSku, setNewProductSku, newProductQty, setNewProductQty, newProductAlert, setNewProductAlert, newProductPrice, setNewProductPrice, newProductVendorIdx, setNewProductVendorIdx, dbVendors, handleSaveProduct, resetProductForm, setModalOpen }: InventoryModalProps) {
  return (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="swiss-title" style={{ fontSize: 18 }}>{editingProductId ? "Edit Product" : "Add New Product"}</h2>
              <button className="secondary-btn" style={{ padding: "2px 8px", border: "none" }} onClick={() => { resetProductForm(); setModalOpen(null); }}>✕</button>
            </div>
            <form onSubmit={handleSaveProduct} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="grid-2">
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Product Name</label>
                  <input type="text" required className="swiss-input" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>SKU Code</label>
                  <input type="text" required className="swiss-input" placeholder="e.g. LAB-4X6-100" value={newProductSku} onChange={(e) => setNewProductSku(e.target.value)} />
                </div>
              </div>
              <div className="grid-2">
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Category</label>
                  <select className="swiss-input" value={newProductCategory} onChange={(e) => setNewProductCategory(e.target.value)}>
                    <option value="Consumables">Consumables</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Office Supplies">Office Supplies</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Supplier</label>
                  <select className="swiss-input" value={newProductVendorIdx} onChange={(e) => setNewProductVendorIdx(parseInt(e.target.value))}>
                    {dbVendors.map((v, i) => (
                      <option key={v._id} value={i}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid-3">
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>{editingProductId ? "Current Quantity" : "Initial Quantity"}</label>
                  <input
                    type="number"
                    required
                    className="swiss-input"
                    value={newProductQty}
                    onChange={(e) => setNewProductQty(e.target.value)}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Low Stock Alert</label>
                  <input type="number" required className="swiss-input" value={newProductAlert} onChange={(e) => setNewProductAlert(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Price (NPR)</label>
                  <input type="number" step="0.01" required className="swiss-input" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                <button type="button" className="secondary-btn" onClick={() => { resetProductForm(); setModalOpen(null); }}>Cancel</button>
                <button type="submit" className="swiss-btn">{editingProductId ? "Save Product" : "Create Product"}</button>
              </div>
            </form>
          </div>
        </div>
  );
}
