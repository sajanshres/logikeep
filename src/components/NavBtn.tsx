import type { ReactNode } from "react";

// sidebar nav button
export default function NavBtn({ tab, label, icon, activeTab, setActiveTab }: { tab: string; label: string; icon: ReactNode; activeTab: string; setActiveTab: (v: string) => void }) {
  return (
    <button onClick={() => setActiveTab(tab)} className={`nav-item-btn ${activeTab === tab ? "active" : ""}`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
