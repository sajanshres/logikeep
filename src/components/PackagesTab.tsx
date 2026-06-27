import { Pencil, Search } from "lucide-react";
import type { Doc, Id } from "../../convex/_generated/dataModel";

type ModalKind = "user" | "branch" | "package" | "vendor" | "inventory" | "transaction" | "history" | null;

type PackagesTabProps = {
  visiblePackages: Doc<"packages">[];
  role: string;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  headerSearch: string;
  setModalOpen: (v: ModalKind) => void;
  openEditPackage: (p: Doc<"packages">) => void;
  openTrackPackage: (trackingNumber: string) => void;
  resetPackageForm: () => void;
  handleAdminUpdateStatus: (packageId: Id<"packages">) => void;
  statusLabel: (s: string) => string;
};

export default function PackagesTab({ visiblePackages, role, searchQuery, setSearchQuery, headerSearch, setModalOpen, openEditPackage, openTrackPackage, resetPackageForm, handleAdminUpdateStatus, statusLabel }: PackagesTabProps) {
  return (
          <div className="swiss-card wireframe-panel">
            <div className="module-toolbar">
              <input type="text" placeholder="Search packages..." className="swiss-input module-search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              {role === "Admin" && (
                <button className="swiss-btn" onClick={() => { resetPackageForm(); setModalOpen("package"); }}>+ Add New Package</button>
              )}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Tracking ID</th>
                    <th>Sender</th>
                    <th>Receiver</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePackages
                    .filter((p) => p.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) || p.senderName.toLowerCase().includes(searchQuery.toLowerCase()) || p.receiverName.toLowerCase().includes(searchQuery.toLowerCase()) || p.trackingNumber.toLowerCase().includes(headerSearch.toLowerCase()))
                    .map((p) => (
                      <tr key={p._id}>
                        <td className="code-text" style={{ fontWeight: "bold", color: "var(--brand-color)" }}>{p.trackingNumber}</td>
                        <td style={{ fontWeight: 700, color: "var(--title-color)" }}>{p.senderName}</td>
                        <td style={{ fontWeight: 700, color: "var(--title-color)" }}>{p.receiverName}</td>
                        <td><span className={`swiss-badge ${p.status === "delivered" ? "active" : ""}`}>{statusLabel(p.status)}</span></td>
                        <td className="code-text">{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="table-actions" style={{ alignItems: "center", gap: 8 }}>
                            <button type="button" className="icon-btn" title="Track package" onClick={() => openTrackPackage(p.trackingNumber)}><Search size={12} /></button>
                            {role === "Admin" && (
                              <>
                                <button type="button" className="icon-btn" title="Edit package" onClick={() => openEditPackage(p)}><Pencil size={12} /></button>
                                <button type="button" className="swiss-btn" style={{ padding: "2px 8px", fontSize: "10px", minWidth: "auto" }} title="Update Status" onClick={() => handleAdminUpdateStatus(p._id)}>Update</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
  );
}
