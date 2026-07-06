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
    inventoryItemId?: Id<"inventory">;
    itemQuantity?: number;
    driverName?: string;
    vehicleNumber?: string;
  }) => Promise<unknown>;
  dbBranches: Doc<"branches">[];
  dbInventory: Doc<"inventory">[];
  matchedVendor: Doc<"vendors"> | null | undefined;
  branchName: (id: string | undefined) => string;
  statusLabel: (s: string) => string;
};

export default function PickupTab({ vendorPickupPackages, searchQuery, setSearchQuery, createPackage, dbBranches, dbInventory, matchedVendor, branchName, statusLabel }: PickupTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [fromBranchIdx, setFromBranchIdx] = useState(0);
  const [destBranchIdx, setDestBranchIdx] = useState(0);
  const [pkgType, setPkgType] = useState("Document");
  const [weight, setWeight] = useState("");
  const [description, setDescription] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [itemQty, setItemQty] = useState<string>("");

  const resetForm = () => {
    setReceiverName("");
    setReceiverPhone("");
    setReceiverAddress("");
    setFromBranchIdx(0);
    setDestBranchIdx(0);
    setPkgType("Document");
    setWeight("");
    setDescription("");
    setSelectedItemId("");
    setItemQty("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbBranches.length || !matchedVendor) return;
    if (fromBranchIdx === destBranchIdx) { alert("Pickup and destination branch cannot be the same"); return; }
    if (selectedItemId && (!itemQty || parseInt(itemQty, 10) < 1)) {
      alert("Please enter a valid quantity for the selected item.");
      return;
    }
    const vendorItems = matchedVendor ? dbInventory.filter(item => item.vendorId === matchedVendor._id) : [];
    if (selectedItemId) {
      const item = vendorItems.find(i => i._id === selectedItemId);
      if (item && (parseInt(itemQty, 10) || 0) > item.quantity) {
        alert(`Insufficient stock for ${item.productName}. Available: ${item.quantity}.`);
        return;
      }
    }
    const originBranch = dbBranches[fromBranchIdx] || dbBranches[0];
    const destBranch = dbBranches[destBranchIdx] || dbBranches[0];
    // if an item is selected, force origin to the item's actual branch
    const itemForOrigin = selectedItemId ? dbInventory.find(i => i._id === selectedItemId) : null;
    const actualOrigin = itemForOrigin ? dbBranches.find(b => b._id === itemForOrigin.branchId) : null;
    const finalOrigin = actualOrigin || originBranch;
    if (finalOrigin._id === destBranch._id) {
      alert("Shipment origin and destination cannot be the same branch.");
      return;
    }
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
      originBranchId: finalOrigin._id,
      destinationBranchId: destBranch._id,
      currentBranchId: finalOrigin._id,
      assignedVendorId: matchedVendor._id,
      inventoryItemId: (selectedItemId ? selectedItemId as Id<"inventory"> : undefined),
      itemQuantity: selectedItemId ? (parseInt(itemQty, 10) || 1) : undefined,
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
              <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>
                {selectedItemId ? "Ships From (locked to item)" : "From Branch"}
              </label>
              {selectedItemId ? (
                <input type="text" className="swiss-input" value={(() => {
                  const item = dbInventory.find(i => i._id === selectedItemId);
                  const branch = item ? dbBranches.find(b => b._id === item.branchId) : null;
                  return branch ? `${branch.name} (${branch.code})` : "—";
                })()} disabled style={{ background: "var(--hover-bg)" }} />
              ) : (
                <select className="swiss-input" value={fromBranchIdx} onChange={(e) => setFromBranchIdx(parseInt(e.target.value))}>
                  {dbBranches.map((b, i) => (
                    (b.status ?? "active") === "active" ? (
                      <option key={b._id} value={i}>{b.name} ({b.code})</option>
                    ) : null
                  ))}
                </select>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Destination Branch</label>
              <select className="swiss-input" value={destBranchIdx} onChange={(e) => setDestBranchIdx(parseInt(e.target.value))}>
                {dbBranches.map((b, i) => (
                  (b.status ?? "active") === "active" ? (
                    <option key={b._id} value={i}>{b.name} ({b.code})</option>
                  ) : null
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
          {matchedVendor && (() => {
            const vendorItems = dbInventory.filter(item => item.vendorId === matchedVendor._id);
            return vendorItems.length > 0 ? (
              <div className="grid-2">
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Item from Inventory (optional)</label>
                  <select className="swiss-input" value={selectedItemId} onChange={(e) => {
                    setSelectedItemId(e.target.value);
                    if (e.target.value) {
                      const item = vendorItems.find(i => i._id === e.target.value);
                      if (item) {
                        const branchIdx = dbBranches.findIndex(b => b._id === item.branchId);
                        if (branchIdx >= 0) setFromBranchIdx(branchIdx);
                        if (!description.trim()) setDescription(`${itemQty || "1"}× ${item.productName}`);
                      }
                    }
                  }}>
                    <option value="">— None —</option>
                    {vendorItems.map(item => (
                      <option key={item._id} value={item._id}>{item.productName} (stock: {item.quantity})</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Quantity</label>
                  <input type="number" min="1" className="swiss-input" value={itemQty} onChange={(e) => setItemQty(e.target.value)} placeholder="0" />
                </div>
              </div>
            ) : null;
          })()}
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
