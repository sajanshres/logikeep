import type { Doc } from "../../convex/_generated/dataModel";

type InvoicesTabProps = {
  vendorInvoicePackages: Doc<"packages">[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  branchName: (id: string | undefined) => string;
};

export default function InvoicesTab({ vendorInvoicePackages, searchQuery, setSearchQuery, branchName }: InvoicesTabProps) {
  return (
          <div className="swiss-card wireframe-panel">
            <div className="module-toolbar">
              <input type="text" placeholder="Search invoices..." className="swiss-input module-search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <span className="swiss-badge active">{vendorInvoicePackages.length} paid / delivered</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Tracking ID</th>
                    <th>Route</th>
                    <th>Weight</th>
                    <th>Delivered</th>
                    <th>POD Recipient</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorInvoicePackages
                    .filter((p) =>
                      p.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      branchName(p.destinationBranchId).toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.receiverName.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((p) => (
                      <tr key={p._id}>
                        <td className="code-text" style={{ fontWeight: "bold", color: "var(--brand-color)" }}>{p.trackingNumber}</td>
                        <td>{branchName(p.originBranchId)} → {branchName(p.destinationBranchId)}</td>
                        <td className="code-text">{p.weight} kg</td>
                        <td className="code-text">{new Date(p.updatedAt).toLocaleDateString()}</td>
                        <td>{p.receivedBy || "—"}</td>
                      </tr>
                    ))}
                  {vendorInvoicePackages.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", color: "var(--badge-text)", padding: 24 }}>No delivered shipments yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
  );
}
