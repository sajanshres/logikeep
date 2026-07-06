import type { Doc, Id } from "../../convex/_generated/dataModel";

// reports tab - shipment ledger, stock movements and analytics summary + csv export
type ReportsProps = {
  reportTab: "shipments" | "inventory" | "analytics";
  setReportTab: (v: "shipments" | "inventory" | "analytics") => void;
  exportToCSV: () => void;
  reportDateFrom: string;
  setReportDateFrom: (v: string) => void;
  reportDateTo: string;
  setReportDateTo: (v: string) => void;
  reportBranch: string;
  setReportBranch: (v: string) => void;
  reportPartner: string;
  setReportPartner: (v: string) => void;
  dbBranches: Doc<"branches">[];
  dbVendors: Doc<"vendors">[];

  dbInventory: Doc<"inventory">[];
  dbUsers: { _id: Id<"users">; name: string }[];
  dbAllMovements: Doc<"stockMovements">[];
  filteredReportPackages: Doc<"packages">[];
  reportDelivered: number;
  reportInTransit: number;
  reportReturned: number;
  reportSuccessRate: number;
  reportLowStock: number;
  reportStockValue: number;
  branchName: (id: string | undefined) => string;
  statusLabel: (s: string) => string;
  timezone: string;
};

export default function Reports({
  reportTab, setReportTab, exportToCSV,
  reportDateFrom, setReportDateFrom, reportDateTo, setReportDateTo,
  reportBranch, setReportBranch, reportPartner, setReportPartner,
  dbBranches, dbVendors, dbInventory, dbUsers, dbAllMovements,
  filteredReportPackages,
  reportDelivered, reportInTransit, reportReturned, reportSuccessRate, reportLowStock, reportStockValue,
  branchName, statusLabel, timezone,
}: ReportsProps) {
  return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 16, borderBottom: "1px solid var(--border-color)", paddingBottom: 16 }}>
              <button 
                className={reportTab === "shipments" ? "swiss-btn" : "secondary-btn"} 
                onClick={() => setReportTab("shipments")}
              >Shipments Ledger</button>
              <button 
                className={reportTab === "inventory" ? "swiss-btn" : "secondary-btn"} 
                onClick={() => setReportTab("inventory")}
              >Stock Movements</button>
              <button 
                className={reportTab === "analytics" ? "swiss-btn" : "secondary-btn"} 
                onClick={() => setReportTab("analytics")}
              >Analytics Summary</button>
              <div style={{ marginLeft: "auto" }}>
                <button className="swiss-btn" style={{ background: "var(--brand-color)" }} onClick={exportToCSV}>Export CSV</button>
              </div>
            </div>

            {reportTab === "shipments" && (
              <div className="swiss-card wireframe-panel">
                <div className="report-filters">
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--title-color)" }}>Date From</label>
                    <input type="date" className="swiss-input" value={reportDateFrom} onChange={(e) => setReportDateFrom(e.target.value)} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--title-color)" }}>Date To</label>
                    <input type="date" className="swiss-input" value={reportDateTo} onChange={(e) => setReportDateTo(e.target.value)} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--title-color)" }}>Branch</label>
                    <select className="swiss-input" value={reportBranch} onChange={(e) => setReportBranch(e.target.value)}>
                      <option value="All">All Branches</option>
                      {dbBranches.map((b) => (
                        <option key={b._id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--title-color)" }}>Vendor</label>
                    <select className="swiss-input" value={reportPartner} onChange={(e) => setReportPartner(e.target.value)}>
                      <option value="All">All Vendors</option>
                      {dbVendors.map((v) => (
                        <option key={v._id} value={v.name}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Tracking ID</th>
                        <th>Sender</th>
                        <th>Receiver</th>
                        <th>Destination</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReportPackages.map((p) => (
                        <tr key={p._id}>
                          <td className="code-text" style={{ color: "var(--brand-color)", fontWeight: 700 }}>{p.trackingNumber}</td>
                          <td>{p.senderName}</td>
                          <td>{p.receiverName}</td>
                          <td>{branchName(p.destinationBranchId)}</td>
                          <td><span className="swiss-badge">{statusLabel(p.status)}</span></td>
                          <td className="code-text">{new Date(p.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {filteredReportPackages.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", color: "var(--badge-text)", padding: 24 }}>No shipments match the selected filters</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportTab === "inventory" && (
              <div className="swiss-card wireframe-panel">
                <div style={{ overflowX: "auto" }}>
                  <table className="swiss-table" style={{ width: "100%", textAlign: "left", fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Change</th>
                        <th>Notes</th>
                        <th>Product</th>
                        <th>User</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dbAllMovements.slice().reverse().map((log) => {
                        const product = dbInventory.find(p => p._id === log.productId);
                        const user = dbUsers.find(u => u._id === log.updatedById);
                        return (
                          <tr key={log._id}>
                            <td className="code-text" style={{ fontSize: 11, color: "var(--text-muted)" }}>{new Date(log.timestamp).toLocaleString("en-US", { timeZone: timezone, month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                            <td><span className="badge" style={{ background: log.type === "purchase" ? "var(--success-bg)" : log.type === "sale" ? "var(--error-bg)" : "var(--border-color)", color: "var(--title-color)" }}>{log.type === "purchase" ? "stock in" : log.type === "sale" ? "stock out" : log.type}</span></td>
                            <td className="code-text" style={{ color: log.quantityChanged > 0 ? "var(--success-text)" : "var(--error-text)", fontWeight: 600 }}>{log.quantityChanged > 0 ? "+" : ""}{log.quantityChanged}</td>
                            <td>{log.notes || "-"}</td>
                            <td>{product?.productName || "Unknown"}</td>
                            <td>{user?.name || "Unknown"}</td>
                          </tr>
                        );
                      })}
                      {dbAllMovements.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: "center", padding: 24, color: "var(--badge-text)" }}>No stock movements recorded</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportTab === "analytics" && (
              <div className="grid-3" style={{ marginTop: 16 }}>
                <div className="swiss-card stat-card" style={{ padding: 24 }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "var(--title-color)" }}>Total Shipments</h4>
                  <div className="stat-value" style={{ fontSize: 32, fontWeight: 800 }}>{filteredReportPackages.length}</div>
                  <div className="stat-subtitle" style={{ fontSize: 12, color: "var(--badge-text)", marginTop: 8 }}>All time volume</div>
                </div>
                <div className="swiss-card stat-card" style={{ padding: 24 }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "var(--title-color)" }}>Total Products</h4>
                  <div className="stat-value" style={{ fontSize: 32, fontWeight: 800 }}>{dbInventory.length}</div>
                  <div className="stat-subtitle" style={{ fontSize: 12, color: "var(--badge-text)", marginTop: 8 }}>In inventory</div>
                </div>
                <div className="swiss-card stat-card" style={{ padding: 24 }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "var(--title-color)" }}>Active Vendors</h4>
                  <div className="stat-value" style={{ fontSize: 32, fontWeight: 800 }}>{dbVendors.filter(v => v.status === "active").length}</div>
                  <div className="stat-subtitle" style={{ fontSize: 12, color: "var(--badge-text)", marginTop: 8 }}>Client Businesses</div>
                </div>
                <div className="swiss-card stat-card" style={{ padding: 24 }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "var(--title-color)" }}>Delivered</h4>
                  <div className="stat-value" style={{ fontSize: 32, fontWeight: 800 }}>{reportDelivered}</div>
                  <div className="stat-subtitle" style={{ fontSize: 12, color: "var(--badge-text)", marginTop: 8 }}>Completed shipments</div>
                </div>
                <div className="swiss-card stat-card" style={{ padding: 24 }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "var(--title-color)" }}>In Transit</h4>
                  <div className="stat-value" style={{ fontSize: 32, fontWeight: 800 }}>{reportInTransit}</div>
                  <div className="stat-subtitle" style={{ fontSize: 12, color: "var(--badge-text)", marginTop: 8 }}>On the move now</div>
                </div>
                <div className="swiss-card stat-card" style={{ padding: 24, borderColor: "var(--brand-color)" }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "var(--brand-color)" }}>Delivery Success Rate</h4>
                  <div className="stat-value" style={{ fontSize: 32, fontWeight: 800 }}>{reportSuccessRate}%</div>
                  <div className="stat-subtitle" style={{ fontSize: 12, color: "var(--badge-text)", marginTop: 8 }}>{reportReturned} returned</div>
                </div>
                <div className="swiss-card stat-card" style={{ padding: 24 }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "var(--title-color)" }}>Low Stock Items</h4>
                  <div className="stat-value" style={{ fontSize: 32, fontWeight: 800, color: reportLowStock > 0 ? "var(--error-text)" : "var(--title-color)" }}>{reportLowStock}</div>
                  <div className="stat-subtitle" style={{ fontSize: 12, color: "var(--badge-text)", marginTop: 8 }}>Need restocking</div>
                </div>
                <div className="swiss-card stat-card" style={{ padding: 24 }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "var(--title-color)" }}>Stock Value</h4>
                  <div className="stat-value code-text" style={{ fontSize: 32, fontWeight: 800 }}>Rs {reportStockValue.toLocaleString()}</div>
                  <div className="stat-subtitle" style={{ fontSize: 12, color: "var(--badge-text)", marginTop: 8 }}>Total inventory worth</div>
                </div>
              </div>
            )}
          </div>
  );
}
