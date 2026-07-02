import type { FormEvent } from "react";
import type { Id } from "../../convex/_generated/dataModel";

type ModalKind = "user" | "branch" | "package" | "vendor" | "inventory" | "transaction" | "history" | null;

type VendorModalProps = {
  editingVendorId: Id<"vendors"> | null;
  newVendorName: string; setNewVendorName: (v: string) => void;
  newVendorType: string; setNewVendorType: (v: string) => void;
  newVendorEmail: string; setNewVendorEmail: (v: string) => void;
  newVendorContact: string; setNewVendorContact: (v: string) => void;
  newVendorPhone: string; setNewVendorPhone: (v: string) => void;
  newVendorAddress: string; setNewVendorAddress: (v: string) => void;
  handleSaveVendor: (e: FormEvent) => void;
  resetVendorForm: () => void;
  setModalOpen: (v: ModalKind) => void;
};

export default function VendorModal({ editingVendorId, newVendorName, setNewVendorName, newVendorType, setNewVendorType, newVendorEmail, setNewVendorEmail, newVendorContact, setNewVendorContact, newVendorPhone, setNewVendorPhone, newVendorAddress, setNewVendorAddress, handleSaveVendor, resetVendorForm, setModalOpen }: VendorModalProps) {
  return (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="swiss-title" style={{ fontSize: 18 }}>{editingVendorId ? "Edit Vendor" : "Add New Vendor"}</h2>
              <button className="secondary-btn" style={{ padding: "2px 8px", border: "none" }} onClick={() => { resetVendorForm(); setModalOpen(null); }}>✕</button>
            </div>
            <form onSubmit={handleSaveVendor} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="grid-2">
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Vendor Name</label>
                  <input type="text" required className="swiss-input" value={newVendorName} onChange={(e) => setNewVendorName(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Vendor Type</label>
                  <select className="swiss-input" value={newVendorType} onChange={(e) => setNewVendorType(e.target.value)}>
                    <option value="Retailer">Retailer</option>
                    <option value="Wholesaler">Wholesaler</option>
                    <option value="Manufacturer">Manufacturer</option>
                    <option value="Exporter">Exporter</option>
                    <option value="Distributor">Distributor</option>
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Email Address</label>
                  <input type="email" required className="swiss-input" value={newVendorEmail} onChange={(e) => setNewVendorEmail(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Contact Person</label>
                  <input type="text" required className="swiss-input" value={newVendorContact} onChange={(e) => setNewVendorContact(e.target.value)} />
                </div>
              </div>
              <div className="grid-2">
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Contact Number</label>
                  <input type="text" required className="swiss-input" value={newVendorPhone} onChange={(e) => setNewVendorPhone(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Address</label>
                  <input type="text" required className="swiss-input" value={newVendorAddress} onChange={(e) => setNewVendorAddress(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                <button type="button" className="secondary-btn" onClick={() => setModalOpen(null)}>Cancel</button>
                <button type="submit" className="swiss-btn">{editingVendorId ? "Save Vendor" : "Create Vendor"}</button>
              </div>
            </form>
          </div>
        </div>
  );
}
