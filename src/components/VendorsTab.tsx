import ActionCell from "./ActionCell";
import type { Doc, Id } from "../../convex/_generated/dataModel";

type ModalKind = "user" | "branch" | "package" | "vendor" | "inventory" | "transaction" | "history" | null;

type VendorsTabProps = {
  dbVendors: Doc<"vendors">[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  headerSearch: string;
  setModalOpen: (v: ModalKind) => void;
  openEditVendor: (v: Doc<"vendors">) => void;
  removeVendor: (args: { vendorId: Id<"vendors"> }) => Promise<unknown>;
  resetVendorForm: () => void;
  toggleVendorStatus: (id: Id<"vendors">, current: string) => void;
};

export default function VendorsTab({ dbVendors, searchQuery, setSearchQuery, headerSearch, setModalOpen, openEditVendor, removeVendor, resetVendorForm, toggleVendorStatus }: VendorsTabProps) {
  return (
          <div className="swiss-card wireframe-panel">
            <div className="module-toolbar">
              <input type="text" placeholder="Search vendors..." className="swiss-input module-search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <button className="swiss-btn" onClick={() => { resetVendorForm(); setModalOpen("vendor"); }}>+ Add New Vendor</button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Vendor Name</th>
                    <th>Vendor Type</th>
                    <th>Contact Person</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dbVendors
                    .filter((v) => v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.name.toLowerCase().includes(headerSearch.toLowerCase()))
                    .map((v) => (
                      <tr key={v._id}>
                        <td style={{ fontWeight: 700, color: "var(--title-color)" }}>{v.name}</td>
                        <td><span className="swiss-badge">{v.partnerType || "Retailer"}</span></td>
                        <td>{v.contactPerson}</td>
                        <td>
                          <button
                            type="button"
                            className={`status-toggle ${v.status === "active" ? "on" : ""}`}
                            onClick={() => toggleVendorStatus(v._id, v.status)}
                            title={v.status === "active" ? "Active" : "Inactive"}
                          >
                            <span className="status-toggle-knob" />
                          </button>
                        </td>
                        <ActionCell
                          label={v.name}
                          onEdit={() => openEditVendor(v)}
                          onDelete={async () => {
                            if (confirm(`Deactivate vendor ${v.name}?`)) await removeVendor({ vendorId: v._id });
                          }}
                        />
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
  );
}
