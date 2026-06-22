import { useState, useEffect } from "react";
import {
  Package,
  MapPin,
  Users,
  Search,
  Plus,
  Truck,
  Layers,
  AlertTriangle,
  History,
  Sun,
  Moon,
  LogOut,
  MapPinOff,
  ClipboardList,
} from "lucide-react";
import "./App.css";

interface Branch {
  id: string;
  name: string;
  code: string;
  city: string;
}


interface ShipmentPackage {
  id: string;
  trackingNumber: string;
  senderName: string;
  senderContact: string;
  receiverName: string;
  receiverAddress: string;
  receiverContact: string;
  packageType: string;
  weight: number;
  status: "booked" | "in_transit" | "arrived_at_branch" | "out_for_delivery" | "delivered" | "returned";
  originBranch: string;
  destinationBranch: string;
  currentLocation: string;
  createdAt: string;
}

interface InventoryItem {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  lowStockAlert: number;
  category: string;
  price: number;
}

const getBranchCode = (name: string) => {
  if (name.includes("Kathmandu")) return "KTM";
  if (name.includes("Pokhara")) return "PKR";
  if (name.includes("Dharan")) return "DHN";
  return "HUB";
};

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [activeRole, setActiveRole] = useState<"admin" | "branch_staff" | "vendor">("admin");

  const [branches] = useState<Branch[]>([
    { id: "1", name: "Kathmandu Main Hub", code: "KTM", city: "Kathmandu" },
    { id: "2", name: "Pokhara Branch", code: "PKR", city: "Pokhara" },
    { id: "3", name: "Dharan Branch", code: "DHN", city: "Dharan" },
  ]);

  const [packages, setPackages] = useState<ShipmentPackage[]>([
    {
      id: "pkg1",
      trackingNumber: "LK-KTM-PKR-001",
      senderName: "Aarav Sharma",
      senderContact: "9801234567",
      receiverName: "Prerna Joshi",
      receiverAddress: "Mahendrapool, Pokhara",
      receiverContact: "9812345678",
      packageType: "Document",
      weight: 0.5,
      status: "booked",
      originBranch: "Kathmandu Main Hub",
      destinationBranch: "Pokhara Branch",
      currentLocation: "Kathmandu Main Hub",
      createdAt: "2026-06-23 10:30 AM",
    },
    {
      id: "pkg2",
      trackingNumber: "LK-PKR-DHN-002",
      senderName: "Niranjan Thapa",
      senderContact: "9841122334",
      receiverName: "Deepa Rai",
      receiverAddress: "Bhanuchowk, Dharan",
      receiverContact: "9851122334",
      packageType: "Box (Medium)",
      weight: 4.2,
      status: "in_transit",
      originBranch: "Pokhara Branch",
      destinationBranch: "Dharan Branch",
      currentLocation: "En Route to Dharan",
      createdAt: "2026-06-22 02:15 PM",
    },
    {
      id: "pkg3",
      trackingNumber: "LK-DHN-KTM-003",
      senderName: "Ramesh Sen",
      senderContact: "9861122334",
      receiverName: "Gopal Shrestha",
      receiverAddress: "Koteshwor, Kathmandu",
      receiverContact: "9812304958",
      packageType: "Fragile Box",
      weight: 1.8,
      status: "delivered",
      originBranch: "Dharan Branch",
      destinationBranch: "Kathmandu Main Hub",
      currentLocation: "Kathmandu Main Hub",
      createdAt: "2026-06-21 11:00 AM",
    },
  ]);

  const [inventory, setInventory] = useState<InventoryItem[]>([
    {
      id: "inv1",
      productName: "Thermal Labels 4x6",
      sku: "LAB-4X6-100",
      quantity: 50,
      lowStockAlert: 20,
      category: "Consumables",
      price: 15.0,
    },
    {
      id: "inv2",
      productName: "Shipping Boxes (Medium)",
      sku: "BOX-MED-050",
      quantity: 12,
      lowStockAlert: 15,
      category: "Packaging",
      price: 2.5,
    },
    {
      id: "inv3",
      productName: "Bubble Wrap Roll",
      sku: "BBL-WRP-010",
      quantity: 8,
      lowStockAlert: 5,
      category: "Packaging",
      price: 18.5,
    },
  ]);
  const [searchTrackingNum, setSearchTrackingNum] = useState<string>("LK-KTM-PKR-001");
  const [searchedPackage, setSearchedPackage] = useState<ShipmentPackage | null>(null);
  const [trackingLogs, setTrackingLogs] = useState<any[]>([]);

  const [isBookModalOpen, setIsBookModalOpen] = useState<boolean>(false);
  const [newPackage, setNewPackage] = useState({
    senderName: "",
    senderContact: "",
    receiverName: "",
    receiverAddress: "",
    receiverContact: "",
    packageType: "Document",
    weight: 1.0,
    originBranch: "Kathmandu Main Hub",
    destinationBranch: "Pokhara Branch",
  });
  const handleTrack = () => {
    const pkg = packages.find(
      (p) => p.trackingNumber.toUpperCase().trim() === searchTrackingNum.toUpperCase().trim()
    );
    if (pkg) {
      setSearchedPackage(pkg);
      const logs = [];
      logs.push({
        title: "Shipment Booked",
        time: pkg.createdAt,
        desc: `Shipment request created at ${pkg.originBranch}.`,
        status: "completed",
      });

      if (pkg.status !== "booked") {
        logs.push({
          title: "Dispatched from Origin",
          time: "2026-06-23 11:30 AM",
          desc: `Package departed from ${pkg.originBranch} towards ${pkg.destinationBranch}.`,
          status: "completed",
        });
      }

      if (pkg.status === "arrived_at_branch" || pkg.status === "out_for_delivery" || pkg.status === "delivered") {
        logs.push({
          title: "Arrived at Destination Branch",
          time: "2026-06-23 03:00 PM",
          desc: `Received at ${pkg.destinationBranch}. Cargo sorted.`,
          status: "completed",
        });
      }

      if (pkg.status === "out_for_delivery" || pkg.status === "delivered") {
        logs.push({
          title: "Out for Delivery",
          time: "2026-06-23 04:30 PM",
          desc: "Assigned to carrier courier. Delivery in progress.",
          status: "completed",
        });
      }

      if (pkg.status === "delivered") {
        logs.push({
          title: "Delivered",
          time: "2026-06-23 05:45 PM",
          desc: `Successfully delivered to ${pkg.receiverName}. Proof signed.`,
          status: "completed",
        });
      } else if (pkg.status === "returned") {
        logs.push({
          title: "Returned to Branch",
          time: "2026-06-23 06:00 PM",
          desc: "Undelivered. Consignee unavailable. Package returned to depot.",
          status: "danger",
        });
      }

      setTrackingLogs(logs.reverse());
    } else {
      setSearchedPackage(null);
    }
  };
  useEffect(() => {
    handleTrack();
  }, [packages]);

  const triggerTrackLookup = (tracking: string) => {
    setSearchTrackingNum(tracking);
  };

  const handleBookShipment = (e: React.FormEvent) => {
    e.preventDefault();
    const newTracking = `LK-${newPackage.originBranch.substring(0, 3).toUpperCase()}-${newPackage.destinationBranch.substring(0, 3).toUpperCase()}-00${packages.length + 1}`;
    const addedPkg: ShipmentPackage = {
      id: `pkg${packages.length + 1}`,
      trackingNumber: newTracking,
      ...newPackage,
      status: "booked",
      currentLocation: newPackage.originBranch,
      createdAt: new Date().toLocaleString(),
    };

    setPackages([addedPkg, ...packages]);
    setIsBookModalOpen(false);
    setSearchTrackingNum(newTracking);
    setNewPackage({
      senderName: "",
      senderContact: "",
      receiverName: "",
      receiverAddress: "",
      receiverContact: "",
      packageType: "Document",
      weight: 1.0,
      originBranch: "Kathmandu Main Hub",
      destinationBranch: "Pokhara Branch",
    });
  };
  const adjustStock = (id: string, delta: number) => {
    setInventory(
      inventory.map((item) => {
        if (item.id === id) {
          const qty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: qty };
        }
        return item;
      })
    );
  };

  const lowStockCount = inventory.filter((item) => item.quantity <= item.lowStockAlert).length;

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="backdrop-blobs">
        <div className="blob-1"></div>
        <div className="blob-2"></div>
      </div>

      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Package className="logo-icon" size={24} />
          <span className="logo-text">LogiKeep ERP</span>
        </div>
        <ul className="sidebar-menu">
          <li className="menu-item active">
            <ClipboardList size={18} />
            Dashboard
          </li>
          <li className="menu-item" onClick={() => setIsBookModalOpen(true)}>
            <Plus size={18} />
            Book Shipment
          </li>
          <li className="menu-item" onClick={() => triggerTrackLookup("LK-PKR-DHN-002")}>
            <Truck size={18} />
            Dispatch Monitor
          </li>
          <li className="menu-item">
            <Layers size={18} />
            Inventory Stock
          </li>
        </ul>
        <div style={{ padding: "20px", borderTop: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            <Users size={16} />
            <span>Role: {activeRole.toUpperCase()}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-panel">
        
        {/* Header Bar */}
        <header className="dashboard-header">
          <div className="header-title">
            <h1>Nepal Hub Logistics Overview</h1>
            <p>Real-time tracking of branch transfers and warehouse operations.</p>
          </div>
          <div className="header-actions">
            {/* Role Switcher */}
            <select
              className="user-dropdown"
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as any)}
            >
              <option value="admin">👨‍💼 Administrator View</option>
              <option value="branch_staff">🏢 Kathmandu Staff View</option>
              <option value="vendor">🚚 Driver / Vendor View</option>
            </select>

            {/* Dark mode switcher */}
            <button className="theme-toggle-btn" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* Quick Summary metrics */}
        <section className="metrics-grid">
          <div className="metric-card">
            <div className="metric-info">
              <h3>Total Packages</h3>
              <div className="metric-value">{packages.length}</div>
            </div>
            <div className="metric-icon primary">
              <Package size={24} />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-info">
              <h3>Active Transit</h3>
              <div className="metric-value">
                {packages.filter((p) => p.status === "in_transit" || p.status === "out_for_delivery").length}
              </div>
            </div>
            <div className="metric-icon success">
              <Truck size={24} />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-info">
              <h3>Registered Branches</h3>
              <div className="metric-value">{branches.length}</div>
            </div>
            <div className="metric-icon primary">
              <MapPin size={24} />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-info">
              <h3>Low Stock Alerts</h3>
              <div className="metric-value">{lowStockCount}</div>
            </div>
            <div className={`metric-icon ${lowStockCount > 0 ? "danger" : "success"}`}>
              <AlertTriangle size={24} />
            </div>
          </div>
        </section>

        {/* Two Columns Dashboard Content */}
        <section className="layout-columns">
          
          {/* Column 1: Live Shipments & Operations */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Active Bookings panel */}
            <div className="widget-card">
              <div className="widget-header">
                <h2>Active Shipment Bookings</h2>
                {activeRole !== "vendor" && (
                  <button className="action-btn" onClick={() => setIsBookModalOpen(true)}>
                    <Plus size={16} /> Book Shipment
                  </button>
                )}
              </div>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Tracking Number</th>
                      <th>Receiver Details</th>
                      <th>Origin / Destination</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packages.map((pkg) => (
                      <tr key={pkg.id}>
                        <td style={{ fontWeight: 600, color: "var(--primary)" }}>{pkg.trackingNumber}</td>
                        <td>
                          <div>{pkg.receiverName}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{pkg.receiverContact}</div>
                        </td>
                        <td>
                          <div>From: {pkg.originBranch}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>To: {pkg.destinationBranch}</div>
                        </td>
                        <td>
                          <span className={`badge ${pkg.status}`}>
                            {pkg.status.replace("_", " ")}
                          </span>
                        </td>
                        <td>
                          <button
                            className="cancel-btn"
                            style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                            onClick={() => triggerTrackLookup(pkg.trackingNumber)}
                          >
                            Track Log
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inventory control stock card */}
            <div className="widget-card">
              <div className="widget-header">
                <h2>Warehouse Consumables & Stock (Logistics Integration)</h2>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Changes sync with shipping box logistics counts
                </span>
              </div>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Product Name</th>
                      <th>Quantity</th>
                      <th>Threshold</th>
                      <th>Status</th>
                      <th>Interactive Adjustment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => {
                      const isLow = item.quantity <= item.lowStockAlert;
                      return (
                        <tr key={item.id}>
                          <td style={{ fontFamily: "monospace" }}>{item.sku}</td>
                          <td style={{ fontWeight: 500 }}>{item.productName}</td>
                          <td style={{ fontWeight: 600, color: isLow ? "red" : "inherit" }}>
                            {item.quantity} units
                          </td>
                          <td>{item.lowStockAlert}</td>
                          <td>
                            <span className={`badge ${isLow ? "returned" : "delivered"}`}>
                              {isLow ? "Low Stock" : "Healthy"}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                className="cancel-btn"
                                style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                                onClick={() => adjustStock(item.id, -5)}
                              >
                                -5
                              </button>
                              <button
                                className="cancel-btn"
                                style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                                onClick={() => adjustStock(item.id, 5)}
                              >
                                +5
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Column 2: Quick Lookup / Interactive Map Track panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Live Tracking Widget */}
            <div className="widget-card">
              <div className="widget-header">
                <h2>Real-Time Package Tracker</h2>
                <History size={18} className="text-muted" />
              </div>
              <div className="tracker-input-container">
                <input
                  type="text"
                  className="tracker-input"
                  placeholder="Enter tracking number..."
                  value={searchTrackingNum}
                  onChange={(e) => setSearchTrackingNum(e.target.value)}
                />
                <button className="action-btn" onClick={handleTrack}>
                  <Search size={16} />
                </button>
              </div>

              {searchedPackage ? (
                <div>
                  <div style={{ marginBottom: "20px", padding: "16px", borderRadius: "12px", backgroundColor: "var(--border-color)" }}>
                    <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "4px" }}>
                      {searchedPackage.trackingNumber}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div><strong>Type:</strong> {searchedPackage.packageType} ({searchedPackage.weight} kg)</div>
                      <div><strong>Receiver:</strong> {searchedPackage.receiverName}</div>
                      <div><strong>Destination:</strong> {searchedPackage.receiverAddress}</div>
                    </div>
                  </div>

                  {/* Route Flow Map */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "24px 0", position: "relative", padding: "10px 5px" }}>
                    {/* Progress track line */}
                    <div style={{
                      position: "absolute",
                      left: "30px",
                      right: "30px",
                      top: "50%",
                      height: "4px",
                      backgroundColor: "var(--border-color)",
                      transform: "translateY(-50%)",
                      zIndex: 1
                    }}></div>
                    
                    {/* Active glowing progress bar */}
                    <div style={{
                      position: "absolute",
                      left: "30px",
                      width: searchedPackage.status === "booked" ? "0%" : 
                             searchedPackage.status === "in_transit" ? "50%" : "100%",
                      top: "50%",
                      height: "4px",
                      background: searchedPackage.status === "delivered" 
                        ? "linear-gradient(to right, var(--primary), var(--secondary))" 
                        : "var(--primary)",
                      transform: "translateY(-50%)",
                      zIndex: 1,
                      transition: "width 0.5s ease"
                    }}></div>

                    {/* Origin Node */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", zIndex: 2 }}>
                      <div style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        backgroundColor: "var(--primary)",
                        border: "4px solid var(--bg-card)",
                        boxShadow: "0 0 0 2px var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}></div>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{getBranchCode(searchedPackage.originBranch)}</span>
                    </div>

                    {/* Truck icon in transit */}
                    {searchedPackage.status === "in_transit" && (
                      <div style={{
                        position: "absolute",
                        left: "calc(50% - 16px)",
                        top: "calc(50% - 16px)",
                        backgroundColor: "var(--primary)",
                        color: "white",
                        padding: "6px",
                        borderRadius: "50%",
                        zIndex: 3,
                        boxShadow: "0 0 10px var(--primary)",
                        animation: "bounceSide 1s infinite alternate"
                      }}>
                        <Truck size={16} />
                      </div>
                    )}

                    {/* Destination Node */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", zIndex: 2 }}>
                      <div style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        backgroundColor: (searchedPackage.status === "delivered" || searchedPackage.status === "arrived_at_branch" || searchedPackage.status === "out_for_delivery") ? "var(--secondary)" : "var(--border-color)",
                        border: "4px solid var(--bg-card)",
                        boxShadow: (searchedPackage.status === "delivered" || searchedPackage.status === "arrived_at_branch" || searchedPackage.status === "out_for_delivery") ? "0 0 0 2px var(--secondary)" : "none",
                        transition: "all 0.3s ease"
                      }}></div>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{getBranchCode(searchedPackage.destinationBranch)}</span>
                    </div>
                  </div>

                  <div className="timeline">
                    {trackingLogs.map((log, idx) => (
                      <div className="timeline-item" key={idx}>
                        <div className={`timeline-dot ${log.status === "danger" ? "active" : "completed"}`}></div>
                        <div className="timeline-header">
                          <span className="timeline-title">{log.title}</span>
                          <span className="timeline-time">{log.time}</span>
                        </div>
                        <span className="timeline-desc">{log.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
                  <MapPinOff size={48} style={{ marginBottom: "12px", opacity: 0.5 }} />
                  <p>No package found. Try searching `LK-KTM-PKR-001` or `LK-PKR-DHN-002`</p>
                </div>
              )}
            </div>

            {/* Nepal Logistics branches network */}
            <div className="widget-card">
              <div className="widget-header">
                <h2>Network Branches</h2>
                <MapPin size={18} className="text-muted" />
              </div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
                {branches.map((b) => (
                  <li
                    key={b.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "12px",
                      borderRadius: "10px",
                      backgroundColor: "var(--border-color)",
                      fontSize: "0.9rem",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600 }}>{b.name}</span>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Hub Location: {b.city}</div>
                    </div>
                    <span style={{ fontWeight: 700, color: "var(--primary)" }}>{b.code}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

        </section>
      </main>

      {/* Book Shipment Modal */}
      {isBookModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Book New Shipment</h2>
              <button className="close-btn" onClick={() => setIsBookModalOpen(false)}>
                <LogOut size={20} />
              </button>
            </div>
            
            <form onSubmit={handleBookShipment}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Sender Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={newPackage.senderName}
                    onChange={(e) => setNewPackage({ ...newPackage, senderName: e.target.value })}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Sender Contact</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={newPackage.senderContact}
                    onChange={(e) => setNewPackage({ ...newPackage, senderContact: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Receiver Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={newPackage.receiverName}
                    onChange={(e) => setNewPackage({ ...newPackage, receiverName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Receiver Contact</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={newPackage.receiverContact}
                    onChange={(e) => setNewPackage({ ...newPackage, receiverContact: e.target.value })}
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Receiver Address</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={newPackage.receiverAddress}
                    onChange={(e) => setNewPackage({ ...newPackage, receiverAddress: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Package Type</label>
                  <select
                    className="form-select"
                    value={newPackage.packageType}
                    onChange={(e) => setNewPackage({ ...newPackage, packageType: e.target.value })}
                  >
                    <option value="Document">📄 Document</option>
                    <option value="Box (Medium)">📦 Box (Medium)</option>
                    <option value="Fragile Box">💎 Fragile Box</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={newPackage.weight}
                    onChange={(e) => setNewPackage({ ...newPackage, weight: parseFloat(e.target.value) || 1.0 })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Origin Branch</label>
                  <select
                    className="form-select"
                    value={newPackage.originBranch}
                    onChange={(e) => setNewPackage({ ...newPackage, originBranch: e.target.value })}
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Destination Branch</label>
                  <select
                    className="form-select"
                    value={newPackage.destinationBranch}
                    onChange={(e) => setNewPackage({ ...newPackage, destinationBranch: e.target.value })}
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => setIsBookModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="action-btn">
                  Book Shipment
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
