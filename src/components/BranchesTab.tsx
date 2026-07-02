import ActionCell from "./ActionCell";
import type { Doc, Id } from "../../convex/_generated/dataModel";

type ModalKind = "user" | "branch" | "package" | "vendor" | "inventory" | "transaction" | "history" | null;

type BranchesTabProps = {
  dbBranches: Doc<"branches">[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  setModalOpen: (v: ModalKind) => void;
  openEditBranch: (b: Doc<"branches">) => void;
  removeBranch: (args: { branchId: Id<"branches"> }) => Promise<unknown>;
  resetBranchForm: () => void;
  toggleBranchStatus: (id: Id<"branches">, current: string | undefined) => void;
};

export default function BranchesTab({ dbBranches, searchQuery, setSearchQuery, setModalOpen, openEditBranch, removeBranch, resetBranchForm, toggleBranchStatus }: BranchesTabProps) {
  return (
          <div className="swiss-card wireframe-panel">
            <div className="module-toolbar">
              <input type="text" placeholder="Search branches..." className="swiss-input module-search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <button className="swiss-btn" onClick={() => { resetBranchForm(); setModalOpen("branch"); }}>+ Add New Branch</button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Branch Name</th>
                    <th>Branch Code</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dbBranches
                    .filter((b) => b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.code.toLowerCase().includes(searchQuery.toLowerCase()) || b.city.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((b) => (
                      <tr key={b._id}>
                        <td style={{ fontWeight: 700, color: "var(--title-color)" }}>{b.name}</td>
                        <td className="code-text" style={{ color: "var(--brand-color)", fontWeight: "bold" }}>{b.code}</td>
                        <td>{b.city}{b.address ? `, ${b.address}` : ""}</td>
                        <td>
                          <button
                            type="button"
                            className={`status-toggle ${(b.status ?? "active") === "active" ? "on" : ""}`}
                            onClick={() => toggleBranchStatus(b._id, b.status)}
                            title={(b.status ?? "active") === "active" ? "Active" : "Inactive"}
                          >
                            <span className="status-toggle-knob" />
                          </button>
                        </td>
                        <ActionCell
                          label={b.name}
                          onEdit={() => openEditBranch(b)}
                          onDelete={async () => {
                            if (confirm(`Deactivate branch ${b.name}?`)) await removeBranch({ branchId: b._id });
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
