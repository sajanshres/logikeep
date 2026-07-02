import { useState } from "react";
import type { Doc, Id } from "../../convex/_generated/dataModel";

type PickupTabProps = {
  vendorPickupPackages: Doc<"packages">[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  createPackage: (args: {
    senderName: string;
    senderContact: string;
    senderAddress?: string;
    receiverName: string;
    receiverAddress: string;
    receiverContact: string;
    packageType: string;
    weight: number;
    dimensions?: string;
    description?: string;
    originBranchId: Id<"branches">;
    destinationBranchId: Id<"branches">;
    currentBranchId: Id<"branches">;
    assignedVendorId?: Id<"vendors">;
    driverName?: string;
    vehicleNumber?: string;
  }) => Promise<unknown>;
  dbBranches: Doc<"branches">[];
  matchedVendor: Doc<"vendors"> | null | undefined;
  branchName: (id: string | undefined) => string;
  statusLabel: (s: string) => string;
};

export default function PickupTab({ vendorPickupPackages, searchQuery, setSearchQuery, createPackage, dbBranches, matchedVendor, branchName, statusLabel }: PickupTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [fromBranchIdx, setFromBranchIdx] = useState(0);
  const [destBranchIdx, setDestBranchIdx] = useState(0);
  const [pkgType, setPkgType] = useState("Document");
  const [weight, setWeight] = useState("");
  const [description, setDescription] = useState("");

  const resetForm = () => {
    setReceiverName("");
    setReceiverPhone("");
    setReceiverAddress("");
    setFromBranchIdx(0);
    setDestBranchIdx(0);
    setPkgType("Document");
    setWeight("");
    setDescription("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbBranches.length || !matchedVendor) return;
    if (fromBranchIdx === destBranchIdx) { alert("Pickup and destination branch cannot be the same"); return; }
    const originBranch = dbBranches[fromBranchIdx] || dbBranches[0];
    const destBranch = dbBranches[destBranchIdx] || dbBranches[0];
    await createPackage({
      senderName: matchedVendor?.name || "Client",
      senderContact: matchedVendor?.contactNumber || "",
      senderAddress: matchedVendor?.address || "",
      receiverName,
      receiverContact: receiverPhone,
      receiverAddress,
      packageType: pkgType,
      weight: parseFloat(weight) || 0,
      description: description || undefined,
      originBranchId: originBranch._id,
      destinationBranchId: destBranch._id,
      currentBranchId: originBranch._id,
      assignedVendorId: matchedVendor._id,
    });
    resetForm();
    setShowForm(false);
  };

  return (
    <div className="swiss-card wireframe-panel">
      <div className="module-toolbar">
        <input type="text" placeholder="Search delivery requests..." className="swiss-input module-search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <button className="swiss-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "New Delivery Request"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px 0", borderBottom: "1px solid var(--border-color)", marginBottom: 16 }}>
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
          <div className="grid-2">
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>From Branch</label>
              <select className="swiss-input" value={fromBranchIdx} onChange={(e) => setFromBranchIdx(parseInt(e.target.value))}>
                {dbBranches.map((b, i) => (
                  <option key={b._id} value={i}>{b.name} ({b.code})</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Destination Branch</label>
              <select className="swiss-input" value={destBranchIdx} onChange={(e) => setDestBranchIdx(parseInt(e.target.value))}>
                {dbBranches.map((b, i) => (
                  <option key={b._id} value={i}>{b.name} ({b.code})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Package Type</label>
              <select className="swiss-input" value={pkgType} onChange={(e) => setPkgType(e.target.value)}>
                <option value="Document">Document</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Box">Box</option>
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Weight (kg)</label>
              <input type="number" step="0.1" required className="swiss-input" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Description</label>
            <textarea rows={2} required className="swiss-input" style={{ resize: "none" }} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="swiss-btn">Submit Delivery Request</button>
          </div>
        </form>
      )}

      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Tracking ID</th>
              <th>Sender</th>
              <th>Destination</th>
              <th>Weight</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {vendorPickupPackages
              .filter((p) =>
                p.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                branchName(p.destinationBranchId).toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((p) => (
                <tr key={p._id}>
                  <td className="code-text" style={{ fontWeight: "bold", color: "var(--brand-color)" }}>{p.trackingNumber}</td>
                  <td>{p.senderName}</td>
                  <td>{branchName(p.destinationBranchId)}</td>
                  <td className="code-text">{p.weight} kg</td>
                  <td><span className="swiss-badge">{statusLabel(p.status)}</span></td>
                </tr>
              ))}
            {vendorPickupPackages.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--badge-text)", padding: 24 }}>No delivery requests found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
