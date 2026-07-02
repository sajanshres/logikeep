import ActionCell from "./ActionCell";
import type { Id } from "../../convex/_generated/dataModel";

type UserRow = { _id: Id<"users">; _creationTime: number; name: string; email: string; role: "admin" | "branch_staff" | "vendor"; branchId: Id<"branches"> | undefined; phone: string | undefined; active: boolean; createdAt: number };

type ModalKind = "user" | "branch" | "package" | "vendor" | "inventory" | "transaction" | "history" | null;

type UsersTabProps = {
  dbUsers: UserRow[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  roleFilter: string;
  setRoleFilter: (v: string) => void;
  roleLabel: (r: string) => string;
  setModalOpen: (v: ModalKind) => void;
  openEditUser: (u: UserRow) => void;
  removeUser: (args: { userId: Id<"users"> }) => Promise<unknown>;
  resetUserForm: () => void;
  toggleUserStatus: (id: Id<"users">, current: boolean) => void;
};

export default function UsersTab({ dbUsers, searchQuery, setSearchQuery, roleFilter, setRoleFilter, roleLabel, setModalOpen, openEditUser, removeUser, resetUserForm, toggleUserStatus }: UsersTabProps) {
  return (
          <div className="swiss-card wireframe-panel">
            <div className="module-toolbar">
              <div className="module-toolbar-left">
                <input type="text" placeholder="Search users..." className="swiss-input module-search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <select className="swiss-input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="All">All Roles</option>
                  <option value="admin">Manager</option>
                  <option value="branch_staff">Branch Staff</option>
                  <option value="vendor">Vendor</option>
                </select>
              </div>
              <button className="swiss-btn" onClick={() => { resetUserForm(); setModalOpen("user"); }}>+ Add New User</button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dbUsers
                    .filter((u) => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                    .filter((u) => roleFilter === "All" || u.role === roleFilter)
                    .map((u) => {
                      const isActive = u.active ?? true;
                      return (
                      <tr key={u._id}>
                        <td style={{ fontWeight: 700, color: "var(--title-color)" }}>{u.name}</td>
                        <td className="code-text">{u.email}</td>
                        <td><span className="swiss-badge">{roleLabel(u.role)}</span></td>
                        <td>
                          <button
                            type="button"
                            className={`status-toggle ${isActive ? "on" : ""}`}
                            onClick={() => toggleUserStatus(u._id, isActive)}
                            title={isActive ? "Active" : "Inactive"}
                          >
                            <span className="status-toggle-knob" />
                          </button>
                        </td>
                        <ActionCell
                          label={u.name}
                          onEdit={() => openEditUser(u)}
                          onDelete={async () => {
                            if (confirm(`Remove user ${u.name}?`)) await removeUser({ userId: u._id });
                          }}
                        />
                      </tr>
                    );})}
                </tbody>
              </table>
            </div>
          </div>
  );
}
