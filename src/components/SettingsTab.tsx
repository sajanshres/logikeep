import type { Doc } from "../../convex/_generated/dataModel";

type SettingsTabProps = {
  settingsTab: "general" | "security" | "notifications";
  setSettingsTab: (v: "general" | "security" | "notifications") => void;
  portalName: string;
  setPortalName: (v: string) => void;
  defaultBranch: string;
  setDefaultBranch: (v: string) => void;
  timezone: string;
  setTimezone: (v: string) => void;
  dbBranches: Doc<"branches">[];
  securityCurrent: string;
  setSecurityCurrent: (v: string) => void;
  securityNew: string;
  setSecurityNew: (v: string) => void;
  securityConfirm: string;
  setSecurityConfirm: (v: string) => void;
  handleUpdatePassword: () => void;
  notifyLowStock: boolean;
  setNotifyLowStock: (v: boolean) => void;
  notifyDelivery: boolean;
  setNotifyDelivery: (v: boolean) => void;
  notifyBooking: boolean;
  setNotifyBooking: (v: boolean) => void;
  notifyWeekly: boolean;
  setNotifyWeekly: (v: boolean) => void;
  settingsSaved: boolean;
  saveSettings: () => void;
};

export default function SettingsTab({ settingsTab, setSettingsTab, portalName, setPortalName, defaultBranch, setDefaultBranch, timezone, setTimezone, dbBranches, securityCurrent, setSecurityCurrent, securityNew, setSecurityNew, securityConfirm, setSecurityConfirm, handleUpdatePassword, notifyLowStock, setNotifyLowStock, notifyDelivery, setNotifyDelivery, notifyBooking, setNotifyBooking, notifyWeekly, setNotifyWeekly, settingsSaved, saveSettings }: SettingsTabProps) {
  return (
          <div className="swiss-card wireframe-panel">
            <div className="settings-tabs">
              <button type="button" className={`settings-tab-btn ${settingsTab === "general" ? "active" : ""}`} onClick={() => setSettingsTab("general")}>General Settings</button>
              <button type="button" className={`settings-tab-btn ${settingsTab === "security" ? "active" : ""}`} onClick={() => setSettingsTab("security")}>Security</button>
              <button type="button" className={`settings-tab-btn ${settingsTab === "notifications" ? "active" : ""}`} onClick={() => setSettingsTab("notifications")}>Notifications</button>
            </div>
            {settingsTab === "general" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 480 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 600 }}>Portal Name</label>
                  <input type="text" className="swiss-input" value={portalName} onChange={(e) => setPortalName(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 600 }}>Default Branch</label>
                  <select className="swiss-input" value={defaultBranch} onChange={(e) => setDefaultBranch(e.target.value)}>
                    <option value="">Select branch</option>
                    {dbBranches.map((b) => (
                      <option key={b._id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 600 }}>Timezone</label>
                  <select className="swiss-input" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                    <option value="Asia/Kathmandu">Asia/Kathmandu (NPT)</option>
                  </select>
                </div>
                <button type="button" className="swiss-btn" style={{ alignSelf: "flex-start" }} onClick={saveSettings}>
                  {settingsSaved ? "Saved" : "Save Changes"}
                </button>
              </div>
            )}
            {settingsTab === "security" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 480 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 600 }}>Current Password</label>
                  <input type="password" className="swiss-input" value={securityCurrent} onChange={(e) => setSecurityCurrent(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 600 }}>New Password</label>
                  <input type="password" className="swiss-input" value={securityNew} onChange={(e) => setSecurityNew(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 600 }}>Confirm Password</label>
                  <input type="password" className="swiss-input" value={securityConfirm} onChange={(e) => setSecurityConfirm(e.target.value)} />
                </div>
                <button type="button" className="swiss-btn" style={{ alignSelf: "flex-start" }} onClick={handleUpdatePassword}>
                  {settingsSaved ? "Password Updated" : "Update Password"}
                </button>
              </div>
            )}
            {settingsTab === "notifications" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 480 }}>
                <label className="flex-center" style={{ justifyContent: "space-between", fontSize: 13 }}>
                  <span>Low stock alerts</span>
                  <input type="checkbox" checked={notifyLowStock} onChange={(e) => setNotifyLowStock(e.target.checked)} />
                </label>
                <label className="flex-center" style={{ justifyContent: "space-between", fontSize: 13 }}>
                  <span>Delivery status updates</span>
                  <input type="checkbox" checked={notifyDelivery} onChange={(e) => setNotifyDelivery(e.target.checked)} />
                </label>
                <label className="flex-center" style={{ justifyContent: "space-between", fontSize: 13 }}>
                  <span>New package bookings</span>
                  <input type="checkbox" checked={notifyBooking} onChange={(e) => setNotifyBooking(e.target.checked)} />
                </label>
                <label className="flex-center" style={{ justifyContent: "space-between", fontSize: 13 }}>
                  <span>Weekly summary report</span>
                  <input type="checkbox" checked={notifyWeekly} onChange={(e) => setNotifyWeekly(e.target.checked)} />
                </label>
                <button type="button" className="swiss-btn" style={{ alignSelf: "flex-start", marginTop: 8 }} onClick={saveSettings}>
                  {settingsSaved ? "Saved" : "Save Preferences"}
                </button>
              </div>
            )}
          </div>
  );
}
