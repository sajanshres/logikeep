import { Pencil, Trash2 } from "lucide-react";

// little edit/delete buttons used in the table rows
export default function ActionCell({ label, onEdit, onDelete }: { label: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <td>
      <div className="table-actions">
        <button type="button" className="icon-btn" title={`Edit ${label}`} onClick={onEdit}><Pencil size={12} /></button>
        <button type="button" className="icon-btn icon-btn-danger" title={`Delete ${label}`} onClick={onDelete}><Trash2 size={12} /></button>
      </div>
    </td>
  );
}
