import type { FormEvent } from "react";
import type { Doc } from "../../convex/_generated/dataModel";

// track tab - search a package by tracking number and show its timeline
type TrackProps = {
  trackId: string;
  setTrackId: (v: string) => void;
  handleTrackPackage: (e: FormEvent) => void;
  trackedPackage: Doc<"packages"> | null;
  trackedMovementLogs: Doc<"movementLogs">[];
  dbVendors: Doc<"vendors">[];
  branchName: (id: string | undefined) => string;
  branchCode: (id: string | undefined) => string;
  statusLabel: (s: string) => string;
};

export default function Track({
  trackId, setTrackId, handleTrackPackage,
  trackedPackage, trackedMovementLogs, dbVendors,
  branchName, branchCode, statusLabel,
}: TrackProps) {
  return (
          <div style={{ maxWidth: 700, margin: "0 auto", width: "100%" }}>
            <div className="swiss-card" style={{ marginBottom: 24 }}>
              <h3 className="swiss-title" style={{ fontSize: 16, marginBottom: 16, textTransform: "uppercase" }}>Trace Package Route</h3>
              <form onSubmit={handleTrackPackage} style={{ display: "flex", gap: 12 }}>
                <input type="text" placeholder="ENTER TRACKING ID (E.G. LK-KTM-PKR-001)" className="swiss-input" style={{ flexGrow: 1 }} value={trackId} onChange={(e) => setTrackId(e.target.value)} />
                <button type="submit" className="swiss-btn" style={{ padding: "0 24px" }}>Search</button>
              </form>
            </div>

            {trackedPackage ? (
              <div className="swiss-card">
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: 12, marginBottom: 20 }}>
                  <div>
                    <h4 className="swiss-title" style={{ fontSize: 18 }}>{trackedPackage.trackingNumber}</h4>
                    <p style={{ fontSize: 12, color: "var(--badge-text)" }}>Destination: {branchName(trackedPackage.destinationBranchId)}</p>
                  </div>
                  <span className="swiss-badge active" style={{ height: "fit-content" }}>{statusLabel(trackedPackage.status)}</span>
                </div>

                <div style={{ display: "flex", gap: 24, marginBottom: 20, flexWrap: "wrap" }}>
                  <div>
                    <span style={{ fontSize: 10, color: "var(--badge-text)", textTransform: "uppercase", display: "block", fontWeight: 700, marginBottom: 2 }}>Sender</span>
                    <span style={{ fontWeight: 700, color: "var(--title-color)" }}>{trackedPackage.senderName}</span>
                    {trackedPackage.senderAddress && (
                      <p style={{ fontSize: 11, color: "var(--badge-text)", marginTop: 2 }}>{trackedPackage.senderAddress}</p>
                    )}
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: "var(--badge-text)", textTransform: "uppercase", display: "block", fontWeight: 700, marginBottom: 2 }}>Receiver</span>
                    <span style={{ fontWeight: 700, color: "var(--title-color)" }}>{trackedPackage.receiverName}</span>
                    <p style={{ fontSize: 11, color: "var(--badge-text)", marginTop: 2 }}>{trackedPackage.receiverAddress}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: "var(--badge-text)", textTransform: "uppercase", display: "block", fontWeight: 700, marginBottom: 2 }}>Weight</span>
                    <span className="code-text" style={{ color: "var(--title-color)" }}>{trackedPackage.weight} kg</span>
                  </div>
                  {trackedPackage.dimensions && (
                    <div>
                      <span style={{ fontSize: 10, color: "var(--badge-text)", textTransform: "uppercase", display: "block", fontWeight: 700, marginBottom: 2 }}>Dimensions</span>
                      <span className="code-text" style={{ color: "var(--title-color)" }}>{trackedPackage.dimensions}</span>
                    </div>
                  )}
                  {trackedPackage.description && (
                    <div style={{ flexBasis: "100%" }}>
                      <span style={{ fontSize: 10, color: "var(--badge-text)", textTransform: "uppercase", display: "block", fontWeight: 700, marginBottom: 2 }}>Description</span>
                      <span style={{ color: "var(--title-color)" }}>{trackedPackage.description}</span>
                    </div>
                  )}
                  {trackedPackage.assignedVendorId && (
                    <div>
                      <span style={{ fontSize: 10, color: "var(--badge-text)", textTransform: "uppercase", display: "block", fontWeight: 700, marginBottom: 2 }}>Assigned Carrier</span>
                      <span style={{ fontWeight: 700, color: "var(--title-color)" }}>
                        {dbVendors.find(v => v._id === trackedPackage.assignedVendorId)?.name || "Vendor Carrier"}
                      </span>
                    </div>
                  )}
                  {trackedPackage.driverName && (
                    <div>
                      <span style={{ fontSize: 10, color: "var(--badge-text)", textTransform: "uppercase", display: "block", fontWeight: 700, marginBottom: 2 }}>Driver Info</span>
                      <span style={{ fontWeight: 700, color: "var(--title-color)" }}>
                        {trackedPackage.driverName} {trackedPackage.vehicleNumber ? `(${trackedPackage.vehicleNumber})` : ""}
                      </span>
                    </div>
                  )}
                  {trackedPackage.receivedBy && (
                    <div style={{ flexBasis: "100%", borderTop: "1px dashed var(--border-color)", paddingTop: 12, marginTop: 4 }}>
                      <span style={{ fontSize: 10, color: "var(--success-color)", textTransform: "uppercase", display: "block", fontWeight: 700, marginBottom: 2 }}>Proof of Delivery</span>
                      <span style={{ fontWeight: 700, color: "var(--title-color)" }}>
                        Received by: {trackedPackage.receivedBy}
                      </span>
                      {trackedPackage.deliveryNotes && (
                        <p style={{ fontSize: 11, color: "var(--badge-text)", marginTop: 2 }}>Notes: {trackedPackage.deliveryNotes}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "32px 0", position: "relative", padding: "10px 5px" }}>
                  <div style={{ position: "absolute", left: "20px", right: "20px", top: "50%", height: "2px", backgroundColor: "var(--border-color)", transform: "translateY(-50%)", zIndex: 1 }} />
                  <div style={{
                    position: "absolute", left: "20px",
                    width: trackedPackage.status === "booked" ? "0%" : trackedPackage.status === "in_transit" ? "50%" : "100%",
                    top: "50%", height: "2px", background: "var(--brand-color)", transform: "translateY(-50%)", zIndex: 1, transition: "width 0.4s ease"
                  }} />
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2, background: "var(--bg-color)", padding: "0 8px" }}>
                    <div style={{ width: 12, height: 12, background: "var(--brand-color)", outline: "4px solid var(--hover-bg)" }} />
                    <span style={{ fontSize: 9, fontWeight: 700, marginTop: 4 }}>{branchCode(trackedPackage.originBranchId)}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2, background: "var(--bg-color)", padding: "0 8px" }}>
                    <div style={{ width: 12, height: 12, background: trackedPackage.status !== "booked" ? "var(--brand-color)" : "var(--border-color)" }} />
                    <span style={{ fontSize: 9, fontWeight: 700, marginTop: 4 }}>TRANSIT</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2, background: "var(--bg-color)", padding: "0 8px" }}>
                    <div style={{ width: 12, height: 12, background: trackedPackage.status === "delivered" ? "var(--brand-color)" : "var(--border-color)" }} />
                    <span style={{ fontSize: 9, fontWeight: 700, marginTop: 4 }}>{branchCode(trackedPackage.destinationBranchId)}</span>
                  </div>
                </div>

                <h4 className="swiss-title" style={{ fontSize: 12, marginBottom: 16, textTransform: "uppercase" }}>Transit Milestones</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 0, paddingLeft: 12 }}>
                  {trackedMovementLogs.length === 0 ? (
                    <div style={{ padding: "10px", color: "var(--badge-text)", fontSize: 12 }}>No movement logs available yet.</div>
                  ) : (
                    trackedMovementLogs.map((log, index) => (
                      <div key={log._id} style={{ display: "flex", gap: 16, borderLeft: index < trackedMovementLogs.length - 1 ? "1px solid var(--border-color)" : "none", paddingLeft: 20, paddingBottom: 24, position: "relative" }}>
                        <div style={{ position: "absolute", left: index < trackedMovementLogs.length - 1 ? -5 : -4, top: 4, width: 9, height: 9, background: "var(--brand-color)", borderRadius: "50%" }} />
                        <div>
                          <span className="code-text" style={{ fontSize: 10, color: "var(--badge-text)" }}>{new Date(log.timestamp).toLocaleString()}</span>
                          <p style={{ fontWeight: 700, color: "var(--title-color)", textTransform: "capitalize" }}>{log.status.replace(/_/g, " ")}</p>
                          <p style={{ fontSize: 12, color: "var(--badge-text)", marginTop: 2 }}>Location: {branchName(log.locationBranchId)}</p>
                          <p style={{ fontSize: 12, color: "var(--title-color)", marginTop: 4 }}>{log.details}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="swiss-card" style={{ padding: 32, textAlign: "center", color: "var(--badge-text)" }}>
                Enter a tracking ID to view shipment milestones.
              </div>
            )}
          </div>
  );
}
