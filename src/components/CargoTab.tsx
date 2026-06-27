import type { Doc, Id } from "../../convex/_generated/dataModel";

type CargoTabProps = {
  activeTab: string;
  dbPackages: Doc<"packages">[];
  loggedInDbUser: { _id: Id<"users">; branchId?: Id<"branches"> } | null | undefined;
  handleDispatch: (packageId: Id<"packages">) => void;
  handleMarkArrived: (packageId: Id<"packages">) => void;
  handleOutForDelivery: (packageId: Id<"packages">) => void;
  handleDeliver: (packageId: Id<"packages">) => void;
  handleMarkReturned: (packageId: Id<"packages">) => void;
  handleForwardToHub: (packageId: Id<"packages">) => void;
  statusLabel: (s: string) => string;
};

export default function CargoTab({ activeTab, dbPackages, loggedInDbUser, handleDispatch, handleMarkArrived, handleOutForDelivery, handleDeliver, handleMarkReturned, handleForwardToHub, statusLabel }: CargoTabProps) {
  return (
          <div className="swiss-card">
            <h3 className="swiss-title" style={{ fontSize: 16, marginBottom: 16, textTransform: "uppercase" }}>
              {activeTab === "incoming" ? "Incoming Cargo List" : "Outgoing Cargo List"}
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Tracking ID</th>
                    <th>Sender</th>
                    <th>Receiver</th>
                    <th>Status</th>
                    <th>Weight</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dbPackages
                    .filter((p) => {
                      const userBranchId = loggedInDbUser?.branchId;
                      if (!userBranchId) return false;
                      if (activeTab === "incoming") {
                        return (
                          (p.destinationBranchId === userBranchId && p.status === "in_transit") ||
                          (p.currentBranchId === userBranchId && p.status === "arrived_at_branch" && p.currentBranchId !== p.destinationBranchId)
                        );
                      }
                      return p.currentBranchId === userBranchId &&
                        (p.status === "booked" || p.status === "in_transit" || p.status === "arrived_at_branch" || p.status === "out_for_delivery");
                    })
                    .map((p) => (
                      <tr key={p._id}>
                        <td className="code-text" style={{ fontWeight: "bold", color: "var(--brand-color)" }}>{p.trackingNumber}</td>
                        <td>{p.senderName}</td>
                        <td>{p.receiverName}</td>
                        <td><span className="swiss-badge">{statusLabel(p.status)}</span></td>
                        <td className="code-text">{p.weight} kg</td>
                        <td style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {activeTab === "incoming" && p.status === "in_transit" && (
                            <button className="swiss-btn" style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }} onClick={() => handleMarkArrived(p._id)}>Mark Arrived</button>
                          )}
                          {activeTab === "incoming" && p.status === "arrived_at_branch" && p.currentBranchId !== p.destinationBranchId && (
                            <button className="swiss-btn" style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }} onClick={() => handleForwardToHub(p._id)}>Forward to Hub</button>
                          )}
                          {activeTab === "outgoing" && p.status === "booked" && (
                            <button className="swiss-btn" style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }} onClick={() => handleDispatch(p._id)}>Dispatch</button>
                          )}
                          {activeTab === "outgoing" && (p.status === "in_transit" || p.status === "arrived_at_branch") && (
                            <button className="swiss-btn" style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }} onClick={() => handleOutForDelivery(p._id)}>Out for Delivery</button>
                          )}
                          {activeTab === "outgoing" && (p.status === "arrived_at_branch" || p.status === "out_for_delivery") && (
                            <button className="secondary-btn" style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }} onClick={() => handleMarkReturned(p._id)}>Mark Returned</button>
                          )}
                          {activeTab === "outgoing" && p.status === "out_for_delivery" && (
                            <button className="swiss-btn" style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto", background: "var(--success-color)", borderColor: "var(--success-color)" }} onClick={() => handleDeliver(p._id)}>Deliver</button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
  );
}
