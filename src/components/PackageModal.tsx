import type { FormEvent } from "react";
import type { Doc, Id } from "../../convex/_generated/dataModel";

type ModalKind = "user" | "branch" | "package" | "vendor" | "inventory" | "transaction" | "history" | null;

type PackageModalProps = {
  editingPackageId: Id<"packages"> | null;
  packageModalTab: number; setPackageModalTab: (v: number) => void;
  senderName: string; setSenderName: (v: string) => void;
  senderPhone: string; setSenderPhone: (v: string) => void;
  senderAddress: string; setSenderAddress: (v: string) => void;
  receiverName: string; setReceiverName: (v: string) => void;
  receiverPhone: string; setReceiverPhone: (v: string) => void;
  receiverAddress: string; setReceiverAddress: (v: string) => void;
  packageType: string; setPackageType: (v: string) => void;
  packageWeight: string; setPackageWeight: (v: string) => void;
  packageDimL: string; setPackageDimL: (v: string) => void;
  packageDimW: string; setPackageDimW: (v: string) => void;
  packageDimH: string; setPackageDimH: (v: string) => void;
  packageDescription: string; setPackageDescription: (v: string) => void;
  assignBranchIdx: number; setAssignBranchIdx: (v: number) => void;
  packageDriverName: string; setPackageDriverName: (v: string) => void;
  packageVehicleNumber: string; setPackageVehicleNumber: (v: string) => void;
  packageVendorId: Id<"vendors"> | null; setPackageVendorId: (v: Id<"vendors"> | null) => void;
  dbBranches: Doc<"branches">[];
  dbVendors: Doc<"vendors">[];
  handleSavePackage: (e: FormEvent) => void;
  resetPackageForm: () => void;
  setModalOpen: (v: ModalKind) => void;
};

export default function PackageModal({ editingPackageId, packageModalTab, setPackageModalTab, senderName, setSenderName, senderPhone, setSenderPhone, senderAddress, setSenderAddress, receiverName, setReceiverName, receiverPhone, setReceiverPhone, receiverAddress, setReceiverAddress, packageType, setPackageType, packageWeight, setPackageWeight, packageDimL, setPackageDimL, packageDimW, setPackageDimW, packageDimH, setPackageDimH, packageDescription, setPackageDescription, assignBranchIdx, setAssignBranchIdx, packageDriverName, setPackageDriverName, packageVehicleNumber, setPackageVehicleNumber, packageVendorId, setPackageVendorId, dbBranches, dbVendors, handleSavePackage, resetPackageForm, setModalOpen }: PackageModalProps) {
  return (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="swiss-title" style={{ fontSize: 18 }}>{editingPackageId ? "Edit Package" : "Add New Package"}</h2>
              <button className="secondary-btn" style={{ padding: "2px 8px", border: "none" }} onClick={() => { resetPackageForm(); setModalOpen(null); }}>✕</button>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button type="button" onClick={() => setPackageModalTab(1)} className={`modal-tab-btn ${packageModalTab === 1 ? "active" : ""}`}>1. Sender Information</button>
              <button type="button" onClick={() => setPackageModalTab(2)} className={`modal-tab-btn ${packageModalTab === 2 ? "active" : ""}`}>2. Receiver Information</button>
              <button type="button" onClick={() => setPackageModalTab(3)} className={`modal-tab-btn ${packageModalTab === 3 ? "active" : ""}`}>3. Package Information</button>
            </div>
            <form onSubmit={handleSavePackage} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {packageModalTab === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="grid-2">
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Sender Name</label>
                      <input type="text" required className="swiss-input" value={senderName} onChange={(e) => setSenderName(e.target.value)} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Sender Phone</label>
                      <input type="text" required className="swiss-input" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Sender Address</label>
                    <input type="text" required className="swiss-input" value={senderAddress} onChange={(e) => setSenderAddress(e.target.value)} />
                  </div>
                  <button type="button" className="swiss-btn" style={{ padding: "8px", alignSelf: "flex-end", width: 120 }} onClick={() => { if (!senderName.trim() || !senderPhone.trim() || !senderAddress.trim()) { alert("Please fill in the sender details"); return; } setPackageModalTab(2); }}>Next →</button>
                </div>
              )}
              {packageModalTab === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="grid-2">
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Receiver Name</label>
                      <input type="text" required className="swiss-input" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Receiver Phone</label>
                      <input type="text" required className="swiss-input" value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Receiver Address</label>
                    <input type="text" required className="swiss-input" value={receiverAddress} onChange={(e) => setReceiverAddress(e.target.value)} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <button type="button" className="secondary-btn" onClick={() => setPackageModalTab(1)}>← Back</button>
                    <button type="button" className="swiss-btn" style={{ padding: "8px 16px" }} onClick={() => { if (!receiverName.trim() || !receiverPhone.trim() || !receiverAddress.trim()) { alert("Please fill in the receiver details"); return; } setPackageModalTab(3); }}>Next →</button>
                  </div>
                </div>
              )}
              {packageModalTab === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="grid-2">
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Package Type</label>
                      <select className="swiss-input" value={packageType} onChange={(e) => setPackageType(e.target.value)}>
                        <option value="Document">📄 Document</option>
                        <option value="Electronics">🔌 Electronics</option>
                        <option value="Books">📚 Books</option>
                        <option value="Clothing">👕 Clothing</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Weight (kg)</label>
                      <input type="number" step="0.1" required className="swiss-input" value={packageWeight} onChange={(e) => setPackageWeight(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid-3">
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Length (cm)</label>
                      <input type="number" step="0.1" required className="swiss-input" placeholder="L" value={packageDimL} onChange={(e) => setPackageDimL(e.target.value)} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Width (cm)</label>
                      <input type="number" step="0.1" required className="swiss-input" placeholder="W" value={packageDimW} onChange={(e) => setPackageDimW(e.target.value)} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Height (cm)</label>
                      <input type="number" step="0.1" required className="swiss-input" placeholder="H" value={packageDimH} onChange={(e) => setPackageDimH(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid-2">
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Driver Name</label>
                      <input type="text" className="swiss-input" value={packageDriverName} onChange={(e) => setPackageDriverName(e.target.value)} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Vehicle Number</label>
                      <input type="text" className="swiss-input" value={packageVehicleNumber} onChange={(e) => setPackageVehicleNumber(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Vendor (Client)</label>
                    <select className="swiss-input" value={packageVendorId || ""} onChange={(e) => setPackageVendorId(e.target.value ? e.target.value as Id<"vendors"> : null)}>
                      <option value="">-- Walk-in Customer --</option>
                      {dbVendors.map((v) => (
                        <option key={v._id} value={v._id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Destination Depot</label>
                    <select className="swiss-input" value={assignBranchIdx} onChange={(e) => setAssignBranchIdx(parseInt(e.target.value))}>
                      {dbBranches.map((b, i) => (
                        <option key={b._id} value={i}>{b.name} ({b.code})</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Description</label>
                    <textarea rows={3} required className="swiss-input" style={{ resize: "none" }} value={packageDescription} onChange={(e) => setPackageDescription(e.target.value)} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                    <button type="button" className="secondary-btn" onClick={() => setPackageModalTab(2)}>← Back</button>
                    <button type="submit" className="swiss-btn">{editingPackageId ? "Save Package" : "Create Package"}</button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
  );
}
