import type { FormEvent } from "react";
import type { Id } from "../../convex/_generated/dataModel";

type ModalKind = "user" | "branch" | "package" | "vendor" | "inventory" | "transaction" | "history" | null;

type BranchModalProps = {
  editingBranchId: Id<"branches"> | null;
  newBranchName: string; setNewBranchName: (v: string) => void;
  newBranchCode: string; setNewBranchCode: (v: string) => void;
  newBranchAddress: string; setNewBranchAddress: (v: string) => void;
  newBranchCity: string; setNewBranchCity: (v: string) => void;
  newBranchContact: string; setNewBranchContact: (v: string) => void;
  newBranchEmail: string; setNewBranchEmail: (v: string) => void;
  newBranchActive: boolean; setNewBranchActive: (v: boolean) => void;
  handleSaveBranch: (e: FormEvent) => void;
  resetBranchForm: () => void;
  setModalOpen: (v: ModalKind) => void;
};

export default function BranchModal({ editingBranchId, newBranchName, setNewBranchName, newBranchCode, setNewBranchCode, newBranchAddress, setNewBranchAddress, newBranchCity, setNewBranchCity, newBranchContact, setNewBranchContact, newBranchEmail, setNewBranchEmail, newBranchActive, setNewBranchActive, handleSaveBranch, resetBranchForm, setModalOpen }: BranchModalProps) {
  return (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="swiss-title" style={{ fontSize: 18 }}>{editingBranchId ? "Edit Branch" : "Add New Branch"}</h2>
              <button className="secondary-btn" style={{ padding: "2px 8px", border: "none" }} onClick={() => { resetBranchForm(); setModalOpen(null); }}>✕</button>
            </div>
            <form onSubmit={handleSaveBranch} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="grid-2">
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Branch Name</label>
                  <input type="text" required className="swiss-input" value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Branch Code</label>
                  <input type="text" required className="swiss-input" placeholder="e.g. KTM" value={newBranchCode} onChange={(e) => setNewBranchCode(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Address</label>
                <input type="text" required className="swiss-input" value={newBranchAddress} onChange={(e) => setNewBranchAddress(e.target.value)} />
              </div>
              <div className="grid-2">
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>City</label>
                  <input type="text" required className="swiss-input" value={newBranchCity} onChange={(e) => setNewBranchCity(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Contact Number</label>
                  <input type="text" required className="swiss-input" value={newBranchContact} onChange={(e) => setNewBranchContact(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Email Address</label>
                <input type="email" className="swiss-input" value={newBranchEmail} onChange={(e) => setNewBranchEmail(e.target.value)} />
              </div>
              <div className="form-row-inline">
                <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Status</label>
                <button
                  type="button"
                  className={`status-toggle ${newBranchActive ? "on" : ""}`}
                  onClick={() => setNewBranchActive(!newBranchActive)}
                >
                  <span className="status-toggle-knob" />
                </button>
                <span style={{ fontSize: 11, color: "var(--badge-text)" }}>{newBranchActive ? "Active" : "Inactive"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                <button type="button" className="secondary-btn" onClick={() => setModalOpen(null)}>Cancel</button>
                <button type="submit" className="swiss-btn">{editingBranchId ? "Save Branch" : "Create Branch"}</button>
              </div>
            </form>
          </div>
        </div>
  );
}
