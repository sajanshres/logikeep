import { X } from "lucide-react";
import type { Doc, Id } from "../../convex/_generated/dataModel";

type ModalKind = "user" | "branch" | "package" | "vendor" | "inventory" | "transaction" | "history" | null;

type HistoryModalProps = {
  dbMovements: Doc<"stockMovements">[];
  dbUsers: { _id: Id<"users">; name: string }[];
  timezone: string;
  setModalOpen: (v: ModalKind) => void;
};

export default function HistoryModal({ dbMovements, dbUsers, timezone, setModalOpen }: HistoryModalProps) {
  return (
        <div className="modal-overlay" onClick={() => setModalOpen(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, color: "var(--title-color)", margin: 0, fontWeight: 700, letterSpacing: "-0.02em" }}>Stock Movement History</h3>
              <button className="icon-btn" onClick={() => setModalOpen(null)}><X size={18} /></button>
            </div>
            <div className="table-container">
              <table className="swiss-table" style={{ width: "100%", textAlign: "left", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Change</th>
                    <th>Notes</th>
                    <th>User</th>
                  </tr>
                </thead>
                <tbody>
                  {dbMovements.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>No movements recorded</td></tr>
                  ) : (
                    dbMovements.slice().reverse().map(log => {
                      const user = dbUsers.find(u => u._id === log.updatedById);
                      return (
                        <tr key={log._id}>
                          <td className="code-text" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            {new Date(log.timestamp).toLocaleString("en-US", { timeZone: timezone, month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td>
                            <span className="badge" style={{ background: log.type === "purchase" ? "var(--success-bg)" : log.type === "sale" ? "var(--error-bg)" : "var(--border-color)", color: "var(--title-color)" }}>
                              {log.type}
                            </span>
                          </td>
                          <td className="code-text" style={{ color: log.quantityChanged > 0 ? "var(--success-text)" : "var(--error-text)", fontWeight: 600 }}>
                            {log.quantityChanged > 0 ? "+" : ""}{log.quantityChanged}
                          </td>
                          <td>{log.notes || "-"}</td>
                          <td>{user?.name || "Unknown"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
  );
}
