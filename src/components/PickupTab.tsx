import type { Doc, Id } from "../../convex/_generated/dataModel";

type PickupTabProps = {
  vendorPickupPackages: Doc<"packages">[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  loggedInDbUser: { _id: Id<"users"> } | null | undefined;
  updateStatus: (args: { packageId: Id<"packages">; status: "booked" | "in_transit" | "arrived_at_branch" | "out_for_delivery" | "delivered" | "returned"; currentBranchId: Id<"branches">; details: string; updatedById: Id<"users">; driverName?: string; vehicleNumber?: string; receivedBy?: string; deliveryNotes?: string }) => Promise<unknown>;
  branchName: (id: string | undefined) => string;
  statusLabel: (s: string) => string;
};

export default function PickupTab({ vendorPickupPackages, searchQuery, setSearchQuery, loggedInDbUser, updateStatus, branchName, statusLabel }: PickupTabProps) {
  return (
          <div className="swiss-card wireframe-panel">
            <div className="module-toolbar">
              <input type="text" placeholder="Search pickup requests..." className="swiss-input module-search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <span className="swiss-badge active">{vendorPickupPackages.length} pending</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Tracking ID</th>
                    <th>Sender</th>
                    <th>Destination</th>
                    <th>Weight</th>
                    <th>Status</th>
                    <th>Action</th>
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
                        <td>
                          <button
                            type="button"
                            className="swiss-btn"
                            style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }}
                            onClick={async () => {
                              if (!loggedInDbUser) return;
                              await updateStatus({
                                packageId: p._id,
                                status: "in_transit",
                                currentBranchId: p.currentBranchId,
                                details: "Pickup accepted by carrier",
                                updatedById: loggedInDbUser._id,
                                driverName: p.driverName || undefined,
                                vehicleNumber: p.vehicleNumber || undefined,
                              });
                            }}
                          >
                            Accept Pickup
                          </button>
                        </td>
                      </tr>
                    ))}
                  {vendorPickupPackages.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: "var(--badge-text)", padding: 24 }}>No pickup requests assigned yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
  );
}
