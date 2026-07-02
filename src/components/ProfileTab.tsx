import type { Doc } from "../../convex/_generated/dataModel";

type ProfileTabProps = {
  role: string;
  loggedInUser: { name: string; email: string; role: "Manager" | "Branch Staff" | "Vendor"; hub: string; status: "Active" | "Inactive" };
  matchedVendor: Doc<"vendors"> | null | undefined;
};

export default function ProfileTab({ role, loggedInUser, matchedVendor }: ProfileTabProps) {
  return (
          <div className="swiss-card" style={{ maxWidth: 600, margin: "0 auto", width: "100%" }}>
            <h3 className="swiss-title" style={{ fontSize: 18, marginBottom: 20, textTransform: "uppercase" }}>
              {role === "Branch Staff" ? "Branch Profile Hub" : "Vendor Profile Hub"}
            </h3>
            {role === "Branch Staff" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 13 }}>
                <div><strong>Branch Depot Name:</strong> {loggedInUser.hub}</div>
                <div><strong>Assigned Manager:</strong> {loggedInUser.name}</div>
                <div><strong>Corporate Email:</strong> {loggedInUser.email}</div>
                <div><strong>Branch Status:</strong> <span className="swiss-badge active">{loggedInUser.status}</span></div>
                <div><strong>Description:</strong> Regional transit sorting hub responsible for package processing and final receiver dispatch.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 13 }}>
                <div><strong>Client Name:</strong> {matchedVendor?.name || "N/A"}</div>
                <div><strong>Contact Representative:</strong> {matchedVendor?.contactPerson || loggedInUser.name}</div>
                <div><strong>Representative Email:</strong> {loggedInUser.email}</div>
                <div><strong>Agency Status:</strong> <span className={`swiss-badge ${matchedVendor?.status === "active" ? "active" : ""}`}>{matchedVendor?.status === "active" ? "Active" : "Inactive"}</span></div>
                <div><strong>Description:</strong> Client business whose goods are warehoused and shipped through our logistics network.</div>
              </div>
            )}
          </div>
  );
}
