import { X } from "lucide-react";
import type { FormEvent } from "react";

type ModalKind = "user" | "branch" | "package" | "vendor" | "inventory" | "transaction" | "history" | null;

type TransactionModalProps = {
  txType: "purchase" | "sale" | "adjustment"; setTxType: (v: "purchase" | "sale" | "adjustment") => void;
  txQuantity: string; setTxQuantity: (v: string) => void;
  txNotes: string; setTxNotes: (v: string) => void;
  handleTransactionSubmit: (e: FormEvent) => void;
  setModalOpen: (v: ModalKind) => void;
};

export default function TransactionModal({ txType, setTxType, txQuantity, setTxQuantity, txNotes, setTxNotes, handleTransactionSubmit, setModalOpen }: TransactionModalProps) {
  return (
        <div className="modal-overlay" onClick={() => setModalOpen(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, color: "var(--title-color)", margin: 0, fontWeight: 700, letterSpacing: "-0.02em" }}>Log Transaction</h3>
              <button className="icon-btn" onClick={() => setModalOpen(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleTransactionSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Transaction Type</label>
                <select className="swiss-input" value={txType} onChange={(e) => setTxType(e.target.value as "purchase" | "sale" | "adjustment")}>
                  <option value="purchase">Purchase (Add Stock)</option>
                  <option value="sale">Sale / Dispatch (Remove Stock)</option>
                  <option value="adjustment">Manual Adjustment</option>
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Quantity</label>
                <input type="number" required className="swiss-input" value={txQuantity} onChange={(e) => setTxQuantity(e.target.value)} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Notes / Reference</label>
                <input type="text" className="swiss-input" value={txNotes} onChange={(e) => setTxNotes(e.target.value)} placeholder="e.g. Stock received from client" />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                <button type="button" className="secondary-btn" onClick={() => setModalOpen(null)}>Cancel</button>
                <button type="submit" className="swiss-btn">Save Log</button>
              </div>
            </form>
          </div>
        </div>
  );
}
