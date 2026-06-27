import type { Doc } from "../../convex/_generated/dataModel";

// dashboard tab - stat cards, charts and the active shipments table
type DashboardProps = {
  role: string;
  dashboardPackages: Doc<"packages">[];
  activeShipments: number;
  deliveredCount: number;
  successRate: number;
  dbInventory: Doc<"inventory">[];
  dbVendors: Doc<"vendors">[];
  dbBranches: Doc<"branches">[];
  lineChartPath: string;
  weeklyCounts: number[];
  barChartMax: number;
  directionSlices: { label: string; count: number; color: string }[];
  directionTotal: number;
  branchName: (id: string | undefined) => string;
  statusLabel: (s: string) => string;
};

export default function Dashboard({
  role,
  dashboardPackages,
  activeShipments,
  deliveredCount,
  successRate,
  dbInventory,
  dbVendors,
  dbBranches,
  lineChartPath,
  weeklyCounts,
  barChartMax,
  directionSlices,
  directionTotal,
  branchName,
  statusLabel,
}: DashboardProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {role === "Admin" ? (
        <div className="grid-4">
          <div className="swiss-card">
            <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--badge-text)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Total Packages</h4>
            <p style={{ fontSize: 28, fontWeight: 800, color: "var(--title-color)" }} className="code-text">{dashboardPackages.length}</p>
          </div>
          <div className="swiss-card" style={{ borderColor: "var(--brand-color)" }}>
            <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--brand-color)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Active Shipments</h4>
            <p style={{ fontSize: 28, fontWeight: 800, color: "var(--title-color)" }} className="code-text">{activeShipments}</p>
          </div>
          <div className="swiss-card">
            <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--badge-text)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Delivered</h4>
            <p style={{ fontSize: 28, fontWeight: 800, color: "var(--title-color)" }} className="code-text">{deliveredCount}</p>
          </div>
          <div className="swiss-card">
            <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--badge-text)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Success Rate</h4>
            <p style={{ fontSize: 28, fontWeight: 800, color: "var(--title-color)" }} className="code-text">{successRate}%</p>
          </div>
        </div>
      ) : role === "Branch Staff" ? (
        <div className="grid-4">
          <div className="swiss-card">
            <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--badge-text)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Total Packages</h4>
            <p style={{ fontSize: 28, fontWeight: 800, color: "var(--title-color)" }} className="code-text">{dashboardPackages.length}</p>
          </div>
          <div className="swiss-card">
            <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--badge-text)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Incoming</h4>
            <p style={{ fontSize: 28, fontWeight: 800, color: "var(--title-color)" }} className="code-text">{dashboardPackages.filter((p) => p.status === "booked" || p.status === "in_transit").length}</p>
          </div>
          <div className="swiss-card">
            <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--badge-text)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Delivered</h4>
            <p style={{ fontSize: 28, fontWeight: 800, color: "var(--title-color)" }} className="code-text">{dashboardPackages.filter((p) => p.status === "delivered").length}</p>
          </div>
          <div className="swiss-card">
            <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--badge-text)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Stock Items</h4>
            <p style={{ fontSize: 28, fontWeight: 800, color: "var(--title-color)" }} className="code-text">{dbInventory.length}</p>
          </div>
        </div>
      ) : (
        <div className="grid-4">
          <div className="swiss-card">
            <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--badge-text)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Active Shipments</h4>
            <p style={{ fontSize: 28, fontWeight: 800, color: "var(--title-color)" }} className="code-text">{dashboardPackages.filter((p) => p.status !== "delivered" && p.status !== "returned").length}</p>
          </div>
          <div className="swiss-card">
            <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--badge-text)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Delivered</h4>
            <p style={{ fontSize: 28, fontWeight: 800, color: "var(--title-color)" }} className="code-text">{dashboardPackages.filter((p) => p.status === "delivered").length}</p>
          </div>
          <div className="swiss-card">
            <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--badge-text)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Vendors</h4>
            <p style={{ fontSize: 28, fontWeight: 800, color: "var(--title-color)" }} className="code-text">{dbVendors.length}</p>
          </div>
          <div className="swiss-card">
            <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--badge-text)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Branches</h4>
            <p style={{ fontSize: 28, fontWeight: 800, color: "var(--title-color)" }} className="code-text">{dbBranches.length}</p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid-3" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <div className="swiss-card">
          <h3 className="swiss-title" style={{ fontSize: 14, borderBottom: "1px solid var(--border-color)", paddingBottom: 10, marginBottom: 16, textTransform: "uppercase" }}>
            {role === "Branch Staff" ? "Weekly Package Volume" : "Shipment Overview"}
          </h3>
          <div style={{ height: 180, width: "100%" }}>
            <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand-color)" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="var(--brand-color)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="50" x2="500" y2="50" stroke="var(--border-color)" strokeWidth="0.5" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="var(--border-color)" strokeWidth="0.5" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="var(--border-color)" strokeWidth="0.5" />
              <path d={`${lineChartPath} L 450 200 L 50 200 Z`} fill="url(#glowGrad)" />
              {role === "Branch Staff" ? (
                <>
                  {weeklyCounts.map((c, i) => (
                    <rect key={i} x={75 + i * 100} y={150 - (c / barChartMax) * 110} width={20} height={(c / barChartMax) * 110} fill="var(--brand-color)" />
                  ))}
                </>
              ) : (
                <>
                  <path d={lineChartPath} fill="none" stroke="var(--brand-color)" strokeWidth="2.5" />
                  {weeklyCounts.map((c, i) => {
                    const x = 47 + i * 100;
                    const y = 147 - (c / barChartMax) * 110;
                    return <rect key={i} x={x} y={y} width={6} height={6} fill="var(--bg-color)" stroke="var(--brand-color)" strokeWidth="1" />;
                  })}
                </>
              )}
            </svg>
          </div>
        </div>
        <div className="swiss-card">
          <h3 className="swiss-title" style={{ fontSize: 14, borderBottom: "1px solid var(--border-color)", paddingBottom: 10, marginBottom: 16, textTransform: "uppercase" }}>Shipments by Direction</h3>
          <div className="pie-wrap">
            <svg width="120" height="120" viewBox="0 0 120 120">
              {(() => {
                let angle = 0;
                return directionSlices.map((slice, i) => {
                  const pct = slice.count / directionTotal;
                  const startAngle = angle;
                  angle += pct * 360;
                  const endAngle = angle;
                  const x1 = 60 + 50 * Math.cos((Math.PI * startAngle) / 180);
                  const y1 = 60 + 50 * Math.sin((Math.PI * startAngle) / 180);
                  const x2 = 60 + 50 * Math.cos((Math.PI * endAngle) / 180);
                  const y2 = 60 + 50 * Math.sin((Math.PI * endAngle) / 180);
                  const large = pct > 0.5 ? 1 : 0;
                  return (
                    <path
                      key={i}
                      d={`M 60 60 L ${x1} ${y1} A 50 50 0 ${large} 1 ${x2} ${y2} Z`}
                      fill={slice.color}
                    />
                  );
                });
              })()}
            </svg>
            <div className="pie-legend">
              {directionSlices.map((slice) => (
                <div key={slice.label} className="pie-legend-item">
                  <span className="pie-dot" style={{ background: slice.color }} />
                  <span>{slice.label}</span>
                  <span className="code-text" style={{ marginLeft: "auto", fontWeight: 700 }}>{slice.count}</span>
                </div>
              ))}
              {directionSlices.length === 0 && (
                <span style={{ fontSize: 12, color: "var(--badge-text)" }}>No shipment data yet</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active packages table */}
      <div className="swiss-card">
        <h3 className="swiss-title" style={{ fontSize: 14, borderBottom: "1px solid var(--border-color)", paddingBottom: 10, marginBottom: 16, textTransform: "uppercase" }}>Active Cargo Shipments</h3>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Tracking ID</th>
                <th>Sender</th>
                <th>Receiver</th>
                <th>Destination</th>
                <th>Type</th>
                <th>Weight</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
            {dashboardPackages.slice(0, 5).map((pkg) => (
                <tr key={pkg._id}>
                  <td className="code-text" style={{ color: "var(--brand-color)", fontWeight: "bold" }}>{pkg.trackingNumber}</td>
                  <td>{pkg.senderName}</td>
                  <td>{pkg.receiverName}</td>
                  <td>{branchName(pkg.destinationBranchId)}</td>
                  <td>{pkg.packageType}</td>
                  <td className="code-text">{pkg.weight} kg</td>
                  <td>
                    <span className={`swiss-badge ${pkg.status === "delivered" ? "active" : ""}`} style={{ fontSize: 9 }}>
                      {statusLabel(pkg.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
