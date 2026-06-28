import type { FormEvent } from "react";
import type { Doc, Id } from "../../convex/_generated/dataModel";

type ModalKind = "user" | "branch" | "package" | "vendor" | "inventory" | "transaction" | "history" | null;

type UserModalProps = {
  editingUserId: Id<"users"> | null;
  newFullName: string; setNewFullName: (v: string) => void;
  newUserEmail: string; setNewUserEmail: (v: string) => void;
  newUserPhone: string; setNewUserPhone: (v: string) => void;
  newUserRole: "admin" | "branch_staff" | "vendor"; setNewUserRole: (v: "admin" | "branch_staff" | "vendor") => void;
  newUserBranch: string; setNewUserBranch: (v: string) => void;
  newUserPassword: string; setNewUserPassword: (v: string) => void;
  newUserConfirmPassword: string; setNewUserConfirmPassword: (v: string) => void;
  newUserActive: boolean; setNewUserActive: (v: boolean) => void;
  dbBranches: Doc<"branches">[];
  handleSaveUser: (e: FormEvent) => void;
  resetUserForm: () => void;
  setModalOpen: (v: ModalKind) => void;
};

export default function UserModal({ editingUserId, newFullName, setNewFullName, newUserEmail, setNewUserEmail, newUserPhone, setNewUserPhone, newUserRole, setNewUserRole, newUserBranch, setNewUserBranch, newUserPassword, setNewUserPassword, newUserConfirmPassword, setNewUserConfirmPassword, newUserActive, setNewUserActive, dbBranches, handleSaveUser, resetUserForm, setModalOpen }: UserModalProps) {
  return (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="swiss-title" style={{ fontSize: 18 }}>{editingUserId ? "Edit User" : "Add New User"}</h2>
              <button className="secondary-btn" style={{ padding: "2px 8px", border: "none" }} onClick={() => { resetUserForm(); setModalOpen(null); }}>✕</button>
            </div>
            <form onSubmit={handleSaveUser} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="grid-2">
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Full Name</label>
                  <input type="text" required className="swiss-input" value={newFullName} onChange={(e) => setNewFullName(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Email Address</label>
                  <input type="email" required className="swiss-input" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} />
                </div>
              </div>
              <div className="grid-2">
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Phone Number</label>
                  <input type="text" className="swiss-input" value={newUserPhone} onChange={(e) => setNewUserPhone(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Role</label>
                  <select className="swiss-input" value={newUserRole} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewUserRole(e.target.value as "admin" | "branch_staff" | "vendor")}>
                    <option value="branch_staff">Branch Staff</option>
                    <option value="admin">Admin</option>
                    <option value="vendor">Vendor</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Assign Branch</label>
                <select className="swiss-input" value={newUserBranch} onChange={(e) => setNewUserBranch(e.target.value)}>
                  <option value="">All Branches</option>
                  {dbBranches.map((b) => (
                    <option key={b._id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
              {!editingUserId && (
                <div className="grid-2">
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Password</label>
                    <input type="password" required className="swiss-input" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Confirm Password</label>
                    <input type="password" required className="swiss-input" value={newUserConfirmPassword} onChange={(e) => setNewUserConfirmPassword(e.target.value)} />
                  </div>
                </div>
              )}
              <div className="form-row-inline">
                <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Status</label>
                <button
                  type="button"
                  className={`status-toggle ${newUserActive ? "on" : ""}`}
                  onClick={() => setNewUserActive(!newUserActive)}
                >
                  <span className="status-toggle-knob" />
                </button>
                <span style={{ fontSize: 11, color: "var(--badge-text)" }}>{newUserActive ? "Active" : "Inactive"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                <button type="button" className="secondary-btn" onClick={() => setModalOpen(null)}>Cancel</button>
                <button type="submit" className="swiss-btn">{editingUserId ? "Save User" : "Create User"}</button>
              </div>
            </form>
          </div>
        </div>
  );
}
