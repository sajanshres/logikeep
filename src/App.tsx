import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Package, LayoutDashboard, Users, Building2, Handshake, FileText, Settings, LogOut, Bell, Search, Pencil, Trash2 } from "lucide-react";
import type { Id } from "../convex/_generated/dataModel";
import { verifyPassword } from "./auth";
import "./App.css";

const SETTINGS_KEY = "logikeep-settings";

type AppSettings = {
  portalName: string;
  defaultBranch: string;
  timezone: string;
  notifyLowStock: boolean;
  notifyDelivery: boolean;
  notifyBooking: boolean;
  notifyWeekly: boolean;
};

function weeklyPackageCounts(packages: { createdAt: number }[], buckets = 5) {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  return Array.from({ length: buckets }, (_, i) => {
    const bucketEnd = now - (buckets - 1 - i) * weekMs;
    const bucketStart = bucketEnd - weekMs;
    return packages.filter((p) => p.createdAt >= bucketStart && p.createdAt < bucketEnd).length;
  });
}

function chartPathFromCounts(counts: number[]) {
  const max = Math.max(...counts, 1);
  const points = counts.map((c, i) => {
    const x = 50 + (i * 100);
    const y = 150 - (c / max) * 110;
    return `${x} ${y}`;
  });
  return `M ${points.join(" L ")}`;
}

// Local-only interface for the logged in session
interface SessionUser {
  name: string;
  email: string;
  role: "Admin" | "Branch Staff" | "Vendor";
  hub: string;
  status: "Active" | "Inactive";
}

export default function App() {
  // Theme toggle
  const [darkMode, setDarkMode] = useState<boolean>(false);
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Auth session
  const [loggedInUser, setLoggedInUser] = useState<SessionUser | null>(null);

  // Login form
  const [loginEmail, setLoginEmail] = useState<string>("admin@logikeep.com.np");
  const [loginPassword, setLoginPassword] = useState<string>("admin123");

  // Active tab
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Search and filter
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("All");

  // Modal control
  const [modalOpen, setModalOpen] = useState<"user" | "branch" | "package" | "vendor" | "inventory" | null>(null);
  const [packageModalTab, setPackageModalTab] = useState<number>(1);

  // User modal fields
  const [newFullName, setNewFullName] = useState<string>("");
  const [newUserEmail, setNewUserEmail] = useState<string>("");
  const [newUserPhone, setNewUserPhone] = useState<string>("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "branch_staff" | "vendor">("branch_staff");
  const [newUserBranch, setNewUserBranch] = useState<string>("");
  const [newUserPassword, setNewUserPassword] = useState<string>("");
  const [newUserConfirmPassword, setNewUserConfirmPassword] = useState<string>("");
  const [newUserActive, setNewUserActive] = useState<boolean>(true);

  // Branch modal fields
  const [newBranchName, setNewBranchName] = useState<string>("");
  const [newBranchCode, setNewBranchCode] = useState<string>("");
  const [newBranchAddress, setNewBranchAddress] = useState<string>("");
  const [newBranchCity, setNewBranchCity] = useState<string>("");
  const [newBranchContact, setNewBranchContact] = useState<string>("");
  const [newBranchEmail, setNewBranchEmail] = useState<string>("");
  const [newBranchActive, setNewBranchActive] = useState<boolean>(true);

  // Package modal fields
  const [senderName, setSenderName] = useState<string>("");
  const [senderPhone, setSenderPhone] = useState<string>("");
  const [senderAddress, setSenderAddress] = useState<string>("");
  const [receiverName, setReceiverName] = useState<string>("");
  const [receiverPhone, setReceiverPhone] = useState<string>("");
  const [receiverAddress, setReceiverAddress] = useState<string>("");
  const [packageType, setPackageType] = useState<string>("Document");
  const [packageWeight, setPackageWeight] = useState<string>("");
  const [packageDimL, setPackageDimL] = useState<string>("");
  const [packageDimW, setPackageDimW] = useState<string>("");
  const [packageDimH, setPackageDimH] = useState<string>("");
  const [packageDescription, setPackageDescription] = useState<string>("");
  const [assignBranchIdx, setAssignBranchIdx] = useState<number>(0);
  const [packageDriverName, setPackageDriverName] = useState<string>("");
  const [packageVehicleNumber, setPackageVehicleNumber] = useState<string>("");
  const [packageVendorId, setPackageVendorId] = useState<Id<"vendors"> | null>(null);

  // Vendor modal fields
  const [newVendorName, setNewVendorName] = useState<string>("");
  const [newVendorEmail, setNewVendorEmail] = useState<string>("");
  const [newVendorAddress, setNewVendorAddress] = useState<string>("");
  const [newVendorPhone, setNewVendorPhone] = useState<string>("");
  const [newVendorContact, setNewVendorContact] = useState<string>("");
  const [newVendorType, setNewVendorType] = useState<string>("Courier");

  // Inventory modal fields
  const [newProductName, setNewProductName] = useState<string>("");
  const [newProductCategory, setNewProductCategory] = useState<string>("Consumables");
  const [newProductSku, setNewProductSku] = useState<string>("");
  const [newProductQty, setNewProductQty] = useState<string>("0");
  const [newProductAlert, setNewProductAlert] = useState<string>("10");
  const [newProductPrice, setNewProductPrice] = useState<string>("0");
  const [newProductVendorIdx, setNewProductVendorIdx] = useState<number>(0);

  // Track package state
  const [trackId, setTrackId] = useState<string>("");
  const [trackedPkgIdx, setTrackedPkgIdx] = useState<number>(-1);

  // Settings & reports
  const [settingsTab, setSettingsTab] = useState<"general" | "security" | "notifications">("general");
  const [reportDateFrom, setReportDateFrom] = useState<string>("");
  const [reportDateTo, setReportDateTo] = useState<string>("");
  const [reportBranch, setReportBranch] = useState<string>("All");
  const [reportPartner, setReportPartner] = useState<string>("All");
  const [headerSearch, setHeaderSearch] = useState<string>("");
  const [editingUserId, setEditingUserId] = useState<Id<"users"> | null>(null);
  const [editingBranchId, setEditingBranchId] = useState<Id<"branches"> | null>(null);
  const [editingVendorId, setEditingVendorId] = useState<Id<"vendors"> | null>(null);
  const [editingPackageId, setEditingPackageId] = useState<Id<"packages"> | null>(null);

  const [portalName, setPortalName] = useState<string>("LogiKeep");
  const [defaultBranch, setDefaultBranch] = useState<string>("");
  const [timezone, setTimezone] = useState<string>("Asia/Kathmandu");
  const [notifyLowStock, setNotifyLowStock] = useState<boolean>(true);
  const [notifyDelivery, setNotifyDelivery] = useState<boolean>(true);
  const [notifyBooking, setNotifyBooking] = useState<boolean>(true);
  const [notifyWeekly, setNotifyWeekly] = useState<boolean>(false);
  const [settingsSaved, setSettingsSaved] = useState<boolean>(false);
  const [securityCurrent, setSecurityCurrent] = useState<string>("");
  const [securityNew, setSecurityNew] = useState<string>("");
  const [securityConfirm, setSecurityConfirm] = useState<string>("");

  // Convex queries
  const dbUsers = useQuery(api.users.list) ?? [];
  const dbBranches = useQuery(api.branches.list) ?? [];
  const dbPackages = useQuery(api.packages.list) ?? [];
  const dbVendors = useQuery(api.vendors.list) ?? [];
  const dbInventory = useQuery(api.inventory.list) ?? [];

  // Convex mutations
  const createUser = useMutation(api.users.create);
  const updateUser = useMutation(api.users.update);
  const removeUser = useMutation(api.users.remove);
  const createBranch = useMutation(api.branches.create);
  const updateBranch = useMutation(api.branches.update);
  const removeBranch = useMutation(api.branches.remove);
  const createPackage = useMutation(api.packages.create);
  const updatePackage = useMutation(api.packages.update);
  const createVendor = useMutation(api.vendors.create);
  const updateVendor = useMutation(api.vendors.update);
  const removeVendor = useMutation(api.vendors.remove);
  const createProduct = useMutation(api.inventory.createProduct);
  const updateStock = useMutation(api.inventory.updateStock);
  const backfillPhase3 = useMutation(api.migrate.backfillPhase3);
  const updateStatus = useMutation(api.packages.updateStatus);

  useEffect(() => {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as AppSettings;
      setPortalName(saved.portalName || "LogiKeep");
      setDefaultBranch(saved.defaultBranch || "");
      setTimezone(saved.timezone || "Asia/Kathmandu");
      setNotifyLowStock(saved.notifyLowStock ?? true);
      setNotifyDelivery(saved.notifyDelivery ?? true);
      setNotifyBooking(saved.notifyBooking ?? true);
      setNotifyWeekly(saved.notifyWeekly ?? false);
    } catch {
      // just catch errors if parsing fails
    }
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("logikeep-reports");
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as { reportDateFrom?: string; reportDateTo?: string; reportBranch?: string; reportPartner?: string };
      if (saved.reportDateFrom) setReportDateFrom(saved.reportDateFrom);
      if (saved.reportDateTo) setReportDateTo(saved.reportDateTo);
      if (saved.reportBranch) setReportBranch(saved.reportBranch);
      if (saved.reportPartner) setReportPartner(saved.reportPartner);
    } catch {
      // ignore errors
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("logikeep-reports", JSON.stringify({ reportDateFrom, reportDateTo, reportBranch, reportPartner }));
  }, [reportDateFrom, reportDateTo, reportBranch, reportPartner]);

  useEffect(() => {
    if (localStorage.getItem("logikeep-phase3-backfill-v2")) return;
    backfillPhase3({})
      .then(() => localStorage.setItem("logikeep-phase3-backfill-v2", "1"))
      .catch(() => {
        // backend might not be ready yet, will retry on next render
      });
  }, [backfillPhase3]);

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = dbUsers.find((u) => u.email.toLowerCase() === loginEmail.toLowerCase());
    if (user && (user.active ?? true) && verifyPassword(loginPassword, user.passwordHash)) {
      const roleMap: Record<string, "Admin" | "Branch Staff" | "Vendor"> = {
        admin: "Admin",
        branch_staff: "Branch Staff",
        vendor: "Vendor",
      };
      const branch = user.branchId
        ? dbBranches.find((b) => b._id === user.branchId)
        : null;
      setLoggedInUser({
        name: user.name,
        email: user.email,
        role: roleMap[user.role] || "Branch Staff",
        hub: branch ? branch.name : "All Branches",
        status: "Active",
      });
      setActiveTab("dashboard");
      setSearchQuery("");
    } else {
      alert("Invalid credentials or inactive account.");
    }
  };

  const resetUserForm = () => {
    setEditingUserId(null);
    setNewFullName("");
    setNewUserEmail("");
    setNewUserPhone("");
    setNewUserRole("branch_staff");
    setNewUserBranch("");
    setNewUserPassword("");
    setNewUserConfirmPassword("");
    setNewUserActive(true);
  };

  const resetBranchForm = () => {
    setEditingBranchId(null);
    setNewBranchName("");
    setNewBranchCode("");
    setNewBranchAddress("");
    setNewBranchCity("");
    setNewBranchContact("");
    setNewBranchEmail("");
    setNewBranchActive(true);
  };

  const resetVendorForm = () => {
    setEditingVendorId(null);
    setNewVendorName("");
    setNewVendorEmail("");
    setNewVendorAddress("");
    setNewVendorPhone("");
    setNewVendorContact("");
    setNewVendorType("Courier");
  };

  const resetPackageForm = () => {
    setEditingPackageId(null);
    setSenderName("");
    setSenderPhone("");
    setSenderAddress("");
    setReceiverName("");
    setReceiverPhone("");
    setReceiverAddress("");
    setPackageType("Document");
    setPackageWeight("");
    setPackageDimL("");
    setPackageDimW("");
    setPackageDimH("");
    setPackageDescription("");
    setPackageDriverName("");
    setPackageVehicleNumber("");
    setPackageVendorId(null);
    setPackageModalTab(1);
  };

  const parseDimensions = (dims?: string) => {
    if (!dims) return { l: "", w: "", h: "" };
    const parts = dims.replace(/cm/i, "").split("x").map((s) => s.trim());
    return { l: parts[0] || "", w: parts[1] || "", h: parts[2] || "" };
  };

  const openEditUser = (u: (typeof dbUsers)[0]) => {
    setEditingUserId(u._id);
    setNewFullName(u.name);
    setNewUserEmail(u.email);
    setNewUserPhone(u.phone || "");
    setNewUserRole(u.role);
    setNewUserBranch(u.branchId ? dbBranches.find((b) => b._id === u.branchId)?.name || "" : "");
    setNewUserActive(u.active ?? true);
    setNewUserPassword("");
    setNewUserConfirmPassword("");
    setModalOpen("user");
  };

  const openEditBranch = (b: (typeof dbBranches)[0]) => {
    setEditingBranchId(b._id);
    setNewBranchName(b.name);
    setNewBranchCode(b.code);
    setNewBranchAddress(b.address);
    setNewBranchCity(b.city);
    setNewBranchContact(b.contactNumber);
    setNewBranchEmail(b.email);
    setNewBranchActive((b.status ?? "active") === "active");
    setModalOpen("branch");
  };

  const openEditVendor = (v: (typeof dbVendors)[0]) => {
    setEditingVendorId(v._id);
    setNewVendorName(v.name);
    setNewVendorEmail(v.email);
    setNewVendorAddress(v.address);
    setNewVendorPhone(v.contactNumber);
    setNewVendorContact(v.contactPerson);
    setNewVendorType(v.partnerType || "Courier");
    setModalOpen("vendor");
  };

  const openEditPackage = (p: (typeof dbPackages)[0]) => {
    setEditingPackageId(p._id);
    setSenderName(p.senderName);
    setSenderPhone(p.senderContact);
    setSenderAddress(p.senderAddress || "");
    setReceiverName(p.receiverName);
    setReceiverPhone(p.receiverContact);
    setReceiverAddress(p.receiverAddress);
    setPackageType(p.packageType);
    setPackageWeight(String(p.weight));
    const { l, w, h } = parseDimensions(p.dimensions);
    setPackageDimL(l);
    setPackageDimW(w);
    setPackageDimH(h);
    setPackageDescription(p.description || "");
    setPackageDriverName(p.driverName || "");
    setPackageVehicleNumber(p.vehicleNumber || "");
    setPackageVendorId(p.assignedVendorId || null);
    setPackageModalTab(1);
    setModalOpen("package");
  };

  const saveSettings = () => {
    const payload: AppSettings = {
      portalName,
      defaultBranch,
      timezone,
      notifyLowStock,
      notifyDelivery,
      notifyBooking,
      notifyWeekly,
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const handleUpdatePassword = async () => {
    if (!loggedInUser) return;
    const user = dbUsers.find((u) => u.email.toLowerCase() === loggedInUser.email.toLowerCase());
    if (!user) return;
    if (!verifyPassword(securityCurrent, user.passwordHash)) {
      alert("Current password is incorrect.");
      return;
    }
    if (securityNew.length < 4) {
      alert("New password must be at least 4 characters.");
      return;
    }
    if (securityNew !== securityConfirm) {
      alert("New passwords do not match.");
      return;
    }
    await updateUser({ userId: user._id, passwordHash: securityNew });
    setSecurityCurrent("");
    setSecurityNew("");
    setSecurityConfirm("");
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setActiveTab("dashboard");
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const branch = dbBranches.find((b) => b.name === newUserBranch);
    if (editingUserId) {
      await updateUser({
        userId: editingUserId,
        name: newFullName,
        email: newUserEmail,
        role: newUserRole,
        branchId: branch?._id,
        phone: newUserPhone || undefined,
        active: newUserActive,
      });
    } else {
      if (newUserPassword !== newUserConfirmPassword) {
        alert("Passwords do not match!");
        return;
      }
      await createUser({
        name: newFullName,
        email: newUserEmail,
        passwordHash: newUserPassword,
        role: newUserRole,
        branchId: branch?._id,
        phone: newUserPhone || undefined,
        active: newUserActive,
      });
    }
    resetUserForm();
    setModalOpen(null);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    const status = newBranchActive ? "active" as const : "inactive" as const;
    if (editingBranchId) {
      await updateBranch({
        branchId: editingBranchId,
        name: newBranchName,
        code: newBranchCode.toUpperCase(),
        address: newBranchAddress,
        city: newBranchCity,
        contactNumber: newBranchContact,
        email: newBranchEmail || `${newBranchCode.toLowerCase()}@logikeep.com.np`,
        status,
      });
    } else {
      await createBranch({
        name: newBranchName,
        code: newBranchCode.toUpperCase(),
        address: newBranchAddress,
        city: newBranchCity,
        contactNumber: newBranchContact,
        email: newBranchEmail || `${newBranchCode.toLowerCase()}@logikeep.com.np`,
        status,
      });
    }
    resetBranchForm();
    setModalOpen(null);
  };

  // Add or edit package
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    const dimensions = packageDimL && packageDimW && packageDimH
      ? `${packageDimL} x ${packageDimW} x ${packageDimH} cm`
      : undefined;
    if (editingPackageId) {
      await updatePackage({
        packageId: editingPackageId,
        senderName,
        senderContact: senderPhone,
        senderAddress: senderAddress || undefined,
        receiverName,
        receiverAddress,
        receiverContact: receiverPhone,
        packageType,
        weight: parseFloat(packageWeight) || 0,
        dimensions,
        description: packageDescription || undefined,
        driverName: packageDriverName || undefined,
        vehicleNumber: packageVehicleNumber || undefined,
        assignedVendorId: packageVendorId || undefined,
      });
    } else {
      if (dbBranches.length < 1) return;
      const destBranch = dbBranches[assignBranchIdx] || dbBranches[0];
      const originBranch = dbBranches[0];
      await createPackage({
        senderName,
        senderContact: senderPhone,
        senderAddress: senderAddress || undefined,
        receiverName,
        receiverAddress,
        receiverContact: receiverPhone,
        packageType,
        weight: parseFloat(packageWeight) || 0,
        dimensions,
        description: packageDescription || undefined,
        driverName: packageDriverName || undefined,
        vehicleNumber: packageVehicleNumber || undefined,
        assignedVendorId: packageVendorId || undefined,
        originBranchId: originBranch._id,
        destinationBranchId: destBranch._id,
        currentBranchId: originBranch._id,
      });
    }
    resetPackageForm();
    setModalOpen(null);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVendorId) {
      await updateVendor({
        vendorId: editingVendorId,
        name: newVendorName,
        contactPerson: newVendorContact,
        contactNumber: newVendorPhone,
        email: newVendorEmail,
        address: newVendorAddress,
        partnerType: newVendorType,
      });
    } else {
      await createVendor({
        name: newVendorName,
        contactPerson: newVendorContact,
        contactNumber: newVendorPhone,
        email: newVendorEmail,
        address: newVendorAddress,
        partnerType: newVendorType,
        status: "active",
      });
    }
    resetVendorForm();
    setModalOpen(null);
  };

  // Add inventory product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dbVendors.length < 1) {
      alert("Add at least one vendor first.");
      return;
    }
    const vendor = dbVendors[newProductVendorIdx] || dbVendors[0];
    await createProduct({
      productName: newProductName,
      category: newProductCategory,
      sku: newProductSku,
      quantity: parseInt(newProductQty) || 0,
      lowStockAlert: parseInt(newProductAlert) || 10,
      vendorId: vendor._id,
      price: parseFloat(newProductPrice) || 0,
    });
    setNewProductName("");
    setNewProductSku("");
    setNewProductQty("0");
    setNewProductAlert("10");
    setNewProductPrice("0");
    setModalOpen(null);
  };

  // Track package
  const handleTrackPackage = (e: React.FormEvent) => {
    e.preventDefault();
    const idx = dbPackages.findIndex((p) => p.trackingNumber.toUpperCase().trim() === trackId.toUpperCase().trim());
    if (idx >= 0) {
      setTrackedPkgIdx(idx);
    } else {
      setTrackedPkgIdx(-1);
      alert("Package not found in registry.");
    }
  };

  const trackedPackage = trackedPkgIdx >= 0 ? dbPackages[trackedPkgIdx] : null;
  const trackedMovementLogs = useQuery(api.movementLogs.getByPackage, trackedPackage ? { packageId: trackedPackage._id } : "skip") ?? [];

  // Helper to get branch name by ID
  const branchName = (id: string | undefined) => {
    if (!id) return "—";
    const b = dbBranches.find((br) => br._id === id);
    return b ? b.name : "—";
  };
  const branchCode = (id: string | undefined) => {
    if (!id) return "—";
    const b = dbBranches.find((br) => br._id === id);
    return b ? b.code : "—";
  };

  // Status display name
  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      booked: "Booked",
      in_transit: "In Transit",
      arrived_at_branch: "At Branch",
      out_for_delivery: "Out for Delivery",
      delivered: "Delivered",
      returned: "Returned",
    };
    return map[s] || s;
  };

  const roleLabel = (r: string) => {
    const map: Record<string, string> = { admin: "Admin", branch_staff: "Branch Staff", vendor: "Vendor" };
    return map[r] || r;
  };

  const pageTitle = (tab: string, userRole: string) => {
    const titles: Record<string, string> = {
      dashboard: "Dashboard",
      users: "User Management",
      packages: userRole === "Admin" ? "Package Management" : userRole === "Branch Staff" ? "My Packages" : "My Shipments",
      branches: "Branch Management",
      vendors: "Partner Management",
      partners: "Partner Management",
      inventory: "Inventory",
      reports: "Reports",
      settings: "Settings",
      track: "Track Package",
      incoming: "Incoming",
      outgoing: "Outgoing",
      profile: "Profile",
      pickup: "Pickup Requests",
      invoices: "Invoices",
    };
    return titles[tab] || tab;
  };

  const activeShipments = dbPackages.filter((p) => p.status !== "delivered" && p.status !== "returned").length;
  const deliveredCount = dbPackages.filter((p) => p.status === "delivered").length;
  const successRate = dbPackages.length > 0 ? Math.round((deliveredCount / dbPackages.length) * 100) : 0;

  const directionSlices = dbBranches.map((b, i) => {
    const count = dbPackages.filter((p) => p.destinationBranchId === b._id).length;
    const colors = ["var(--brand-color)", "var(--secondary)", "#B7A1A5", "#7C5D5F", "#473636"];
    return { label: b.code, count, color: colors[i % colors.length] };
  }).filter((s) => s.count > 0);
  const directionTotal = directionSlices.reduce((sum, s) => sum + s.count, 0) || 1;

  const filteredReportPackages = dbPackages.filter((p) => {
    if (reportBranch !== "All" && branchName(p.destinationBranchId) !== reportBranch) return false;
    if (reportPartner !== "All") {
      const vendor = p.assignedVendorId ? dbVendors.find((v) => v._id === p.assignedVendorId) : null;
      if ((vendor?.name || "Unassigned") !== reportPartner) return false;
    }
    if (reportDateFrom) {
      const from = new Date(reportDateFrom).getTime();
      if (p.createdAt < from) return false;
    }
    if (reportDateTo) {
      const to = new Date(reportDateTo).getTime() + 86400000;
      if (p.createdAt > to) return false;
    }
    return true;
  });

  const toggleUserStatus = async (id: Id<"users">, current: boolean) => {
    await updateUser({ userId: id, active: !current });
  };

  const toggleBranchStatus = async (id: Id<"branches">, current: string | undefined) => {
    const next = (current ?? "active") === "active" ? "inactive" as const : "active" as const;
    await updateBranch({ branchId: id, status: next });
  };

  const toggleVendorStatus = async (id: Id<"vendors">, current: string) => {
    const next = current === "active" ? "inactive" as const : "active" as const;
    await updateVendor({ vendorId: id, status: next });
  };

  const loggedInDbUser = loggedInUser
    ? dbUsers.find((u) => u.email.toLowerCase() === loggedInUser.email.toLowerCase())
    : undefined;

  const handleMarkArrived = async (packageId: Id<"packages">) => {
    if (!loggedInDbUser?.branchId) return;
    const bName = dbBranches.find(b => b._id === loggedInDbUser.branchId)?.name || "branch";
    await updateStatus({ packageId, status: "arrived_at_branch", currentBranchId: loggedInDbUser.branchId, details: `Received at ${bName}`, updatedById: loggedInDbUser._id });
  };

  const handleDispatch = async (packageId: Id<"packages">) => {
    if (!loggedInDbUser?.branchId) return;
    const driver = window.prompt("Enter Driver Name:");
    if (driver === null) return;
    const vehicle = window.prompt("Enter Vehicle Number:");
    if (vehicle === null) return;
    const details = `Dispatched with driver ${driver || "N/A"}${vehicle ? ` (Vehicle: ${vehicle})` : ""}`;
    await updateStatus({ packageId, status: "in_transit", currentBranchId: loggedInDbUser.branchId, details, updatedById: loggedInDbUser._id, driverName: driver, vehicleNumber: vehicle });
  };

  const handleOutForDelivery = async (packageId: Id<"packages">) => {
    if (!loggedInDbUser?.branchId) return;
    await updateStatus({ packageId, status: "out_for_delivery", currentBranchId: loggedInDbUser.branchId, details: "Out for local delivery", updatedById: loggedInDbUser._id });
  };

  const handleDeliver = async (packageId: Id<"packages">) => {
    if (!loggedInDbUser?.branchId) return;
    const receivedBy = window.prompt("Enter Receiver Name (Proof of Delivery):");
    if (receivedBy === null) return;
    const notes = window.prompt("Enter Delivery Notes (optional):") || "";
    const details = `Delivered to recipient. Signed by: ${receivedBy}${notes ? ` (Notes: ${notes})` : ""}`;
    await updateStatus({ packageId, status: "delivered", currentBranchId: loggedInDbUser.branchId, details, updatedById: loggedInDbUser._id, receivedBy, deliveryNotes: notes });
  };

  const handleAdminUpdateStatus = async (packageId: Id<"packages">) => {
    if (!loggedInDbUser) return;
    const p = dbPackages.find(x => x._id === packageId);
    if (!p) return;
    const status = window.prompt("Enter new status (booked, in_transit, arrived_at_branch, out_for_delivery, delivered, returned):", p.status);
    if (!status) return;
    
    const validStatuses = ["booked", "in_transit", "arrived_at_branch", "out_for_delivery", "delivered", "returned"];
    if (!validStatuses.includes(status)) {
      alert(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
      return;
    }
    
    const branchCode = window.prompt("Enter current Branch Code:", dbBranches.find(b => b._id === p.currentBranchId)?.code || "");
    const branch = dbBranches.find(b => b.code.toLowerCase() === branchCode?.toLowerCase());
    if (!branch) { alert("Invalid branch code"); return; }
    
    let driverName, vehicleNumber, receivedBy, deliveryNotes;
    let details = `Admin manual status update to ${status.replace(/_/g, " ")}`;
    if (status === "in_transit") {
      driverName = window.prompt("Driver Name (optional):") || undefined;
      vehicleNumber = window.prompt("Vehicle Number (optional):") || undefined;
      if (driverName) {
        details = `Dispatched by admin with driver ${driverName}${vehicleNumber ? ` (Vehicle: ${vehicleNumber})` : ""}`;
      }
    } else if (status === "delivered") {
      receivedBy = window.prompt("Received By:") || undefined;
      deliveryNotes = window.prompt("Delivery Notes (optional):") || undefined;
      if (receivedBy) {
        details = `Delivered by admin. Signed by: ${receivedBy}${deliveryNotes ? ` (Notes: ${deliveryNotes})` : ""}`;
      }
    }
    
    await updateStatus({
      packageId,
      status: status as any,
      currentBranchId: branch._id,
      details,
      updatedById: loggedInDbUser._id,
      driverName,
      vehicleNumber,
      receivedBy,
      deliveryNotes
    });
  };

  const matchedVendor = loggedInUser
    ? dbVendors.find((v) => v.email.toLowerCase() === loggedInUser.email.toLowerCase())
    : undefined;

  const openTrackPackage = (trackingNumber: string) => {
    setTrackId(trackingNumber);
    const idx = dbPackages.findIndex((p) => p.trackingNumber === trackingNumber);
    setTrackedPkgIdx(idx);
    setActiveTab("track");
  };

  const weeklyCounts = weeklyPackageCounts(dbPackages);
  const lineChartPath = chartPathFromCounts(weeklyCounts);
  const barChartMax = Math.max(...weeklyCounts, 1);

  const userInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const ActionCell = ({ label, onEdit, onDelete }: { label: string; onEdit: () => void; onDelete: () => void }) => (
    <td>
      <div className="table-actions">
        <button type="button" className="icon-btn" title={`Edit ${label}`} onClick={onEdit}><Pencil size={12} /></button>
        <button type="button" className="icon-btn icon-btn-danger" title={`Delete ${label}`} onClick={onDelete}><Trash2 size={12} /></button>
      </div>
    </td>
  );

  const NavBtn = ({ tab, label, icon }: { tab: string; label: string; icon: React.ReactNode }) => (
    <button onClick={() => setActiveTab(tab)} className={`nav-item-btn ${activeTab === tab ? "active" : ""}`}>
      {icon}
      <span>{label}</span>
    </button>
  );

  // LOGIN SCREEN
  if (!loggedInUser) {
    return (
      <div className="login-screen flex-center" style={{ justifyContent: "center", width: "100%", minHeight: "100vh" }}>
        <div className="login-card">
          <div className="login-brand">
            <div className="flex-center gap-3" style={{ justifyContent: "center", marginBottom: 12 }}>
              <Package size={28} style={{ color: "var(--brand-color)" }} />
            </div>
            <h1 className="swiss-title" style={{ fontSize: 22, textTransform: "uppercase" }}>LogiKeep</h1>
            <p style={{ fontSize: 12, color: "var(--badge-text)", marginTop: 6 }}>Integrated Logistics & Inventory Management</p>
          </div>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, color: "var(--title-color)", fontWeight: 600 }}>Email</label>
              <input type="email" required className="swiss-input w-full" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, color: "var(--title-color)", fontWeight: 600 }}>Password</label>
              <input type="password" required className="swiss-input w-full" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
            </div>
            <button type="submit" className="swiss-btn" style={{ padding: 14, width: "100%", marginTop: 4 }}>Sign In</button>
          </form>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 8, borderTop: "1px solid var(--border-color)" }}>
            <button type="button" className="secondary-btn" style={{ fontSize: 10, padding: "6px 10px" }} onClick={() => { setLoginEmail("admin@logikeep.com.np"); setLoginPassword("admin123"); }}>Admin demo</button>
            <button type="button" className="secondary-btn" style={{ fontSize: 10, padding: "6px 10px" }} onClick={() => { setLoginEmail("dharan@logikeep.com.np"); setLoginPassword("dharan123"); }}>Branch staff demo</button>
            <button type="button" className="secondary-btn" style={{ fontSize: 10, padding: "6px 10px" }} onClick={() => { setLoginEmail("vendor@logikeep.com.np"); setLoginPassword("vendor123"); }}>Vendor demo</button>
            <button type="button" onClick={() => setDarkMode(!darkMode)} className="secondary-btn" style={{ fontSize: 10, padding: "6px 10px" }}>
              {darkMode ? "Light mode" : "Dark mode"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD
  const role = loggedInUser.role;

  return (
    <div className="app-layout">
      {/* SIDEBAR */}
      <aside>
        <div className="sidebar-brand">
          <Package size={24} style={{ color: "var(--brand-color)" }} />
          <span className="swiss-title">LogiKeep</span>
        </div>

        <nav className="sidebar-nav">
          {role === "Admin" && (
            <>
              <NavBtn tab="dashboard" label="Dashboard" icon={<LayoutDashboard size={14} />} />
              <NavBtn tab="users" label="User Management" icon={<Users size={14} />} />
              <NavBtn tab="packages" label="Package Management" icon={<Package size={14} />} />
              <NavBtn tab="branches" label="Branch Management" icon={<Building2 size={14} />} />
              <NavBtn tab="vendors" label="Partner Management" icon={<Handshake size={14} />} />
              <NavBtn tab="reports" label="Reports" icon={<FileText size={14} />} />
              <NavBtn tab="settings" label="Settings" icon={<Settings size={14} />} />
            </>
          )}

          {role === "Branch Staff" && (
            <>
              <NavBtn tab="dashboard" label="Dashboard" icon={<LayoutDashboard size={14} />} />
              <NavBtn tab="packages" label="My Packages" icon={<Package size={14} />} />
              <NavBtn tab="track" label="Track Package" icon={<Search size={14} />} />
              <NavBtn tab="incoming" label="Incoming" icon={<FileText size={14} />} />
              <NavBtn tab="outgoing" label="Outgoing" icon={<FileText size={14} />} />
              <NavBtn tab="inventory" label="Inventory" icon={<Building2 size={14} />} />
              <NavBtn tab="reports" label="Reports" icon={<FileText size={14} />} />
              <NavBtn tab="profile" label="Branch Profile" icon={<Users size={14} />} />
            </>
          )}

          {role === "Vendor" && (
            <>
              <NavBtn tab="dashboard" label="Dashboard" icon={<LayoutDashboard size={14} />} />
              <NavBtn tab="packages" label="My Shipments" icon={<Package size={14} />} />
              <NavBtn tab="pickup" label="Pickup Requests" icon={<FileText size={14} />} />
              <NavBtn tab="track" label="Track Shipment" icon={<Search size={14} />} />
              <NavBtn tab="invoices" label="Invoices" icon={<FileText size={14} />} />
              <NavBtn tab="profile" label="Vendor Profile" icon={<Users size={14} />} />
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <button onClick={() => setDarkMode(!darkMode)} className="secondary-btn sidebar-footer-btn">
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
          <button onClick={handleLogout} className="nav-item-btn logout-btn">
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main>
        <div className="app-topbar">
          <div className="topbar-search-wrap">
            <Search size={14} className="topbar-search-icon" />
            <input
              type="text"
              placeholder="Search..."
              className="swiss-input topbar-search"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
            />
          </div>
          <div className="topbar-actions">
            <button type="button" className="topbar-icon-btn" title="Notifications"><Bell size={14} /></button>
            <div className="user-chip">
              <div className="user-avatar">{userInitials(loggedInUser.name)}</div>
              <div>
                <p className="user-chip-name">{loggedInUser.name}</p>
                <p className="user-chip-role">{role}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="page-header">
          <h1 className="swiss-title page-title">{pageTitle(activeTab, role)}</h1>
          <p className="page-subtitle">{portalName} Portal</p>
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {role === "Admin" ? (
              <div className="grid-4">
                <div className="swiss-card">
                  <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--badge-text)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Total Packages</h4>
                  <p style={{ fontSize: 28, fontWeight: 800, color: "var(--title-color)" }} className="code-text">{dbPackages.length}</p>
                </div>
                <div className="swiss-card" style={{ borderColor: "var(--brand-color)" }}>
                  <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--brand-color)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Active Shipments</h4>
                  <p style={{ fontSize: 28, fontWeight: 800, color: "var(--title-color)" }} className="code-text">{activeShipments}</p>
                </div>
                <div className="swiss-card">
                  <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--badge-text)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Delivered</h4>
                  <p style={{ fontSize: 28, fontWeight: 800, color: "var(--title-color)" }} className="code-text">{deliveredCount}</p>
                </div>
                <div className="swiss-card">
                  <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--badge-text)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Success Rate</h4>
                  <p style={{ fontSize: 28, fontWeight: 800, color: "var(--title-color)" }} className="code-text">{successRate}%</p>
                </div>
              </div>
            ) : role === "Branch Staff" ? (
              <div className="grid-4">
                <div className="swiss-card">
                  <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--badge-text)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Total Packages</h4>
                  <p style={{ fontSize: 28, fontWeight: 800, color: "var(--title-color)" }} className="code-text">{dbPackages.length}</p>
                </div>
                <div className="swiss-card">
                  <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--badge-text)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Incoming</h4>
                  <p style={{ fontSize: 28, fontWeight: 800, color: "var(--title-color)" }} className="code-text">{dbPackages.filter((p) => p.status === "booked" || p.status === "in_transit").length}</p>
                </div>
                <div className="swiss-card">
                  <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--badge-text)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Delivered</h4>
                  <p style={{ fontSize: 28, fontWeight: 800, color: "var(--title-color)" }} className="code-text">{dbPackages.filter((p) => p.status === "delivered").length}</p>
                </div>
                <div className="swiss-card">
                  <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--badge-text)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Stock Items</h4>
                  <p style={{ fontSize: 28, fontWeight: 800, color: "var(--title-color)" }} className="code-text">{dbInventory.length}</p>
                </div>
              </div>
            ) : (
              <div className="grid-4">
                <div className="swiss-card">
                  <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--badge-text)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Active Shipments</h4>
                  <p style={{ fontSize: 28, fontWeight: 800, color: "var(--title-color)" }} className="code-text">{dbPackages.filter((p) => p.status !== "delivered" && p.status !== "returned").length}</p>
                </div>
                <div className="swiss-card">
                  <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--badge-text)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Delivered</h4>
                  <p style={{ fontSize: 28, fontWeight: 800, color: "var(--title-color)" }} className="code-text">{dbPackages.filter((p) => p.status === "delivered").length}</p>
                </div>
                <div className="swiss-card">
                  <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--badge-text)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Partner Vendors</h4>
                  <p style={{ fontSize: 28, fontWeight: 800, color: "var(--title-color)" }} className="code-text">{dbVendors.length}</p>
                </div>
                <div className="swiss-card">
                  <h4 style={{ fontSize: 10, fontWeight: 700, color: "var(--badge-text)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Branches</h4>
                  <p style={{ fontSize: 28, fontWeight: 800, color: "var(--title-color)" }} className="code-text">{dbBranches.length}</p>
                </div>
              </div>
            )}

            {/* Charts */}
            <div className="grid-3" style={{ gridTemplateColumns: "2fr 1fr" }}>
              <div className="swiss-card">
                <h3 className="swiss-title" style={{ fontSize: 14, borderBottom: "1px solid var(--border-color)", paddingBottom: 10, marginBottom: 16, textTransform: "uppercase" }}>
                  {role === "Branch Staff" ? "Weekly Package Volume" : "Shipment Overview"}
                </h3>
                <div style={{ height: 180, width: "100%" }}>
                  <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--brand-color)" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="var(--brand-color)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="50" x2="500" y2="50" stroke="var(--border-color)" strokeWidth="0.5" />
                    <line x1="0" y1="100" x2="500" y2="100" stroke="var(--border-color)" strokeWidth="0.5" />
                    <line x1="0" y1="150" x2="500" y2="150" stroke="var(--border-color)" strokeWidth="0.5" />
                    <path d={`${lineChartPath} L 450 200 L 50 200 Z`} fill="url(#glowGrad)" />
                    {role === "Branch Staff" ? (
                      <>
                        {weeklyCounts.map((c, i) => (
                          <rect key={i} x={75 + i * 100} y={150 - (c / barChartMax) * 110} width={20} height={(c / barChartMax) * 110} fill="var(--brand-color)" />
                        ))}
                      </>
                    ) : (
                      <>
                        <path d={lineChartPath} fill="none" stroke="var(--brand-color)" strokeWidth="2.5" />
                        {weeklyCounts.map((c, i) => {
                          const x = 47 + i * 100;
                          const y = 147 - (c / barChartMax) * 110;
                          return <rect key={i} x={x} y={y} width={6} height={6} fill="var(--bg-color)" stroke="var(--brand-color)" strokeWidth="1" />;
                        })}
                      </>
                    )}
                  </svg>
                </div>
              </div>
              <div className="swiss-card">
                <h3 className="swiss-title" style={{ fontSize: 14, borderBottom: "1px solid var(--border-color)", paddingBottom: 10, marginBottom: 16, textTransform: "uppercase" }}>Shipments by Direction</h3>
                <div className="pie-wrap">
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    {(() => {
                      let angle = 0;
                      return directionSlices.map((slice, i) => {
                        const pct = slice.count / directionTotal;
                        const startAngle = angle;
                        angle += pct * 360;
                        const endAngle = angle;
                        const x1 = 60 + 50 * Math.cos((Math.PI * startAngle) / 180);
                        const y1 = 60 + 50 * Math.sin((Math.PI * startAngle) / 180);
                        const x2 = 60 + 50 * Math.cos((Math.PI * endAngle) / 180);
                        const y2 = 60 + 50 * Math.sin((Math.PI * endAngle) / 180);
                        const large = pct > 0.5 ? 1 : 0;
                        return (
                          <path
                            key={i}
                            d={`M 60 60 L ${x1} ${y1} A 50 50 0 ${large} 1 ${x2} ${y2} Z`}
                            fill={slice.color}
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="pie-legend">
                    {directionSlices.map((slice) => (
                      <div key={slice.label} className="pie-legend-item">
                        <span className="pie-dot" style={{ background: slice.color }} />
                        <span>{slice.label}</span>
                        <span className="code-text" style={{ marginLeft: "auto", fontWeight: 700 }}>{slice.count}</span>
                      </div>
                    ))}
                    {directionSlices.length === 0 && (
                      <span style={{ fontSize: 12, color: "var(--badge-text)" }}>No shipment data yet</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Active packages table */}
            <div className="swiss-card">
              <h3 className="swiss-title" style={{ fontSize: 14, borderBottom: "1px solid var(--border-color)", paddingBottom: 10, marginBottom: 16, textTransform: "uppercase" }}>Active Cargo Shipments</h3>
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Tracking ID</th>
                      <th>Sender</th>
                      <th>Receiver</th>
                      <th>Destination</th>
                      <th>Type</th>
                      <th>Weight</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbPackages.slice(0, 5).map((pkg) => (
                      <tr key={pkg._id}>
                        <td className="code-text" style={{ color: "var(--brand-color)", fontWeight: "bold" }}>{pkg.trackingNumber}</td>
                        <td>{pkg.senderName}</td>
                        <td>{pkg.receiverName}</td>
                        <td>{branchName(pkg.destinationBranchId)}</td>
                        <td>{pkg.packageType}</td>
                        <td className="code-text">{pkg.weight} kg</td>
                        <td>
                          <span className={`swiss-badge ${pkg.status === "delivered" ? "active" : ""}`} style={{ fontSize: 9 }}>
                            {statusLabel(pkg.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === "users" && (
          <div className="swiss-card wireframe-panel">
            <div className="module-toolbar">
              <div className="module-toolbar-left">
                <input type="text" placeholder="Search users..." className="swiss-input module-search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <select className="swiss-input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="All">All Roles</option>
                  <option value="admin">Admin</option>
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
                    .filter((u) => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()) || u.name.toLowerCase().includes(headerSearch.toLowerCase()))
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
        )}

        {/* Branch Management Tab */}
        {activeTab === "branches" && (
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
                    .filter((b) => b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.code.toLowerCase().includes(searchQuery.toLowerCase()) || b.city.toLowerCase().includes(headerSearch.toLowerCase()))
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
        )}

        {/* Package Management Tab */}
        {activeTab === "packages" && (
          <div className="swiss-card wireframe-panel">
            <div className="module-toolbar">
              <input type="text" placeholder="Search packages..." className="swiss-input module-search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              {role === "Admin" && (
                <button className="swiss-btn" onClick={() => { resetPackageForm(); setModalOpen("package"); }}>+ Add New Package</button>
              )}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Tracking ID</th>
                    <th>Sender</th>
                    <th>Receiver</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dbPackages
                    .filter((p) => p.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) || p.senderName.toLowerCase().includes(searchQuery.toLowerCase()) || p.receiverName.toLowerCase().includes(searchQuery.toLowerCase()) || p.trackingNumber.toLowerCase().includes(headerSearch.toLowerCase()))
                    .map((p) => (
                      <tr key={p._id}>
                        <td className="code-text" style={{ fontWeight: "bold", color: "var(--brand-color)" }}>{p.trackingNumber}</td>
                        <td style={{ fontWeight: 700, color: "var(--title-color)" }}>{p.senderName}</td>
                        <td style={{ fontWeight: 700, color: "var(--title-color)" }}>{p.receiverName}</td>
                        <td><span className={`swiss-badge ${p.status === "delivered" ? "active" : ""}`}>{statusLabel(p.status)}</span></td>
                        <td className="code-text">{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="table-actions" style={{ alignItems: "center", gap: 8 }}>
                            <button type="button" className="icon-btn" title="Track package" onClick={() => openTrackPackage(p.trackingNumber)}><Search size={12} /></button>
                            {role === "Admin" && (
                              <>
                                <button type="button" className="icon-btn" title="Edit package" onClick={() => openEditPackage(p)}><Pencil size={12} /></button>
                                <button type="button" className="swiss-btn" style={{ padding: "2px 8px", fontSize: "10px", minWidth: "auto" }} title="Update Status" onClick={() => handleAdminUpdateStatus(p._id)}>Update</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Partner Management Tab */}
        {activeTab === "vendors" && (
          <div className="swiss-card wireframe-panel">
            <div className="module-toolbar">
              <input type="text" placeholder="Search partners..." className="swiss-input module-search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <button className="swiss-btn" onClick={() => { resetVendorForm(); setModalOpen("vendor"); }}>+ Add New Partner</button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Partner Name</th>
                    <th>Partner Type</th>
                    <th>Contact Person</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dbVendors
                    .filter((v) => v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.name.toLowerCase().includes(headerSearch.toLowerCase()))
                    .map((v) => (
                      <tr key={v._id}>
                        <td style={{ fontWeight: 700, color: "var(--title-color)" }}>{v.name}</td>
                        <td><span className="swiss-badge">{v.partnerType || "Courier"}</span></td>
                        <td>{v.contactPerson}</td>
                        <td>
                          <button
                            type="button"
                            className={`status-toggle ${v.status === "active" ? "on" : ""}`}
                            onClick={() => toggleVendorStatus(v._id, v.status)}
                            title={v.status === "active" ? "Active" : "Inactive"}
                          >
                            <span className="status-toggle-knob" />
                          </button>
                        </td>
                        <ActionCell
                          label={v.name}
                          onEdit={() => openEditVendor(v)}
                          onDelete={async () => {
                            if (confirm(`Deactivate partner ${v.name}?`)) await removeVendor({ vendorId: v._id });
                          }}
                        />
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Track / Pickup / Invoices Tab */}
        {(activeTab === "track" || activeTab === "pickup" || activeTab === "invoices") && (
          <div style={{ maxWidth: 700, margin: "0 auto", width: "100%" }}>
            <div className="swiss-card" style={{ marginBottom: 24 }}>
              <h3 className="swiss-title" style={{ fontSize: 16, marginBottom: 16, textTransform: "uppercase" }}>Trace Package Route</h3>
              <form onSubmit={handleTrackPackage} style={{ display: "flex", gap: 12 }}>
                <input type="text" placeholder="ENTER TRACKING ID (E.G. LK-KTM-PKR-001)" className="swiss-input" style={{ flexGrow: 1 }} value={trackId} onChange={(e) => setTrackId(e.target.value)} />
                <button type="submit" className="swiss-btn" style={{ padding: "0 24px" }}>Search</button>
              </form>
            </div>

            {trackedPackage ? (
              <div className="swiss-card">
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: 12, marginBottom: 20 }}>
                  <div>
                    <h4 className="swiss-title" style={{ fontSize: 18 }}>{trackedPackage.trackingNumber}</h4>
                    <p style={{ fontSize: 12, color: "var(--badge-text)" }}>Destination: {branchName(trackedPackage.destinationBranchId)}</p>
                  </div>
                  <span className="swiss-badge active" style={{ height: "fit-content" }}>{statusLabel(trackedPackage.status)}</span>
                </div>

                <div style={{ display: "flex", gap: 24, marginBottom: 20, flexWrap: "wrap" }}>
                  <div>
                    <span style={{ fontSize: 10, color: "var(--badge-text)", textTransform: "uppercase", display: "block", fontWeight: 700, marginBottom: 2 }}>Sender</span>
                    <span style={{ fontWeight: 700, color: "var(--title-color)" }}>{trackedPackage.senderName}</span>
                    {trackedPackage.senderAddress && (
                      <p style={{ fontSize: 11, color: "var(--badge-text)", marginTop: 2 }}>{trackedPackage.senderAddress}</p>
                    )}
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: "var(--badge-text)", textTransform: "uppercase", display: "block", fontWeight: 700, marginBottom: 2 }}>Receiver</span>
                    <span style={{ fontWeight: 700, color: "var(--title-color)" }}>{trackedPackage.receiverName}</span>
                    <p style={{ fontSize: 11, color: "var(--badge-text)", marginTop: 2 }}>{trackedPackage.receiverAddress}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: "var(--badge-text)", textTransform: "uppercase", display: "block", fontWeight: 700, marginBottom: 2 }}>Weight</span>
                    <span className="code-text" style={{ color: "var(--title-color)" }}>{trackedPackage.weight} kg</span>
                  </div>
                  {trackedPackage.dimensions && (
                    <div>
                      <span style={{ fontSize: 10, color: "var(--badge-text)", textTransform: "uppercase", display: "block", fontWeight: 700, marginBottom: 2 }}>Dimensions</span>
                      <span className="code-text" style={{ color: "var(--title-color)" }}>{trackedPackage.dimensions}</span>
                    </div>
                  )}
                  {trackedPackage.description && (
                    <div style={{ flexBasis: "100%" }}>
                      <span style={{ fontSize: 10, color: "var(--badge-text)", textTransform: "uppercase", display: "block", fontWeight: 700, marginBottom: 2 }}>Description</span>
                      <span style={{ color: "var(--title-color)" }}>{trackedPackage.description}</span>
                    </div>
                  )}
                  {trackedPackage.assignedVendorId && (
                    <div>
                      <span style={{ fontSize: 10, color: "var(--badge-text)", textTransform: "uppercase", display: "block", fontWeight: 700, marginBottom: 2 }}>Assigned Carrier</span>
                      <span style={{ fontWeight: 700, color: "var(--title-color)" }}>
                        {dbVendors.find(v => v._id === trackedPackage.assignedVendorId)?.name || "Partner Carrier"}
                      </span>
                    </div>
                  )}
                  {trackedPackage.driverName && (
                    <div>
                      <span style={{ fontSize: 10, color: "var(--badge-text)", textTransform: "uppercase", display: "block", fontWeight: 700, marginBottom: 2 }}>Driver Info</span>
                      <span style={{ fontWeight: 700, color: "var(--title-color)" }}>
                        {trackedPackage.driverName} {trackedPackage.vehicleNumber ? `(${trackedPackage.vehicleNumber})` : ""}
                      </span>
                    </div>
                  )}
                  {trackedPackage.receivedBy && (
                    <div style={{ flexBasis: "100%", borderTop: "1px dashed var(--border-color)", paddingTop: 12, marginTop: 4 }}>
                      <span style={{ fontSize: 10, color: "var(--success-color)", textTransform: "uppercase", display: "block", fontWeight: 700, marginBottom: 2 }}>Proof of Delivery</span>
                      <span style={{ fontWeight: 700, color: "var(--title-color)" }}>
                        Received by: {trackedPackage.receivedBy}
                      </span>
                      {trackedPackage.deliveryNotes && (
                        <p style={{ fontSize: 11, color: "var(--badge-text)", marginTop: 2 }}>Notes: {trackedPackage.deliveryNotes}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "32px 0", position: "relative", padding: "10px 5px" }}>
                  <div style={{ position: "absolute", left: "20px", right: "20px", top: "50%", height: "2px", backgroundColor: "var(--border-color)", transform: "translateY(-50%)", zIndex: 1 }} />
                  <div style={{
                    position: "absolute", left: "20px",
                    width: trackedPackage.status === "booked" ? "0%" : trackedPackage.status === "in_transit" ? "50%" : "100%",
                    top: "50%", height: "2px", background: "var(--brand-color)", transform: "translateY(-50%)", zIndex: 1, transition: "width 0.4s ease"
                  }} />
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2, background: "var(--bg-color)", padding: "0 8px" }}>
                    <div style={{ width: 12, height: 12, background: "var(--brand-color)", outline: "4px solid var(--hover-bg)" }} />
                    <span style={{ fontSize: 9, fontWeight: 700, marginTop: 4 }}>{branchCode(trackedPackage.originBranchId)}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2, background: "var(--bg-color)", padding: "0 8px" }}>
                    <div style={{ width: 12, height: 12, background: trackedPackage.status !== "booked" ? "var(--brand-color)" : "var(--border-color)" }} />
                    <span style={{ fontSize: 9, fontWeight: 700, marginTop: 4 }}>TRANSIT</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2, background: "var(--bg-color)", padding: "0 8px" }}>
                    <div style={{ width: 12, height: 12, background: trackedPackage.status === "delivered" ? "var(--brand-color)" : "var(--border-color)" }} />
                    <span style={{ fontSize: 9, fontWeight: 700, marginTop: 4 }}>{branchCode(trackedPackage.destinationBranchId)}</span>
                  </div>
                </div>

                <h4 className="swiss-title" style={{ fontSize: 12, marginBottom: 16, textTransform: "uppercase" }}>Transit Milestones</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 0, paddingLeft: 12 }}>
                  {trackedMovementLogs.length === 0 ? (
                    <div style={{ padding: "10px", color: "var(--badge-text)", fontSize: 12 }}>No movement logs available yet.</div>
                  ) : (
                    trackedMovementLogs.map((log, index) => (
                      <div key={log._id} style={{ display: "flex", gap: 16, borderLeft: index < trackedMovementLogs.length - 1 ? "1px solid var(--border-color)" : "none", paddingLeft: 20, paddingBottom: 24, position: "relative" }}>
                        <div style={{ position: "absolute", left: index < trackedMovementLogs.length - 1 ? -5 : -4, top: 4, width: 9, height: 9, background: "var(--brand-color)", borderRadius: "50%" }} />
                        <div>
                          <span className="code-text" style={{ fontSize: 10, color: "var(--badge-text)" }}>{new Date(log.timestamp).toLocaleString()}</span>
                          <p style={{ fontWeight: 700, color: "var(--title-color)", textTransform: "capitalize" }}>{log.status.replace(/_/g, " ")}</p>
                          <p style={{ fontSize: 12, color: "var(--badge-text)", marginTop: 2 }}>Location: {branchName(log.locationBranchId)}</p>
                          <p style={{ fontSize: 12, color: "var(--title-color)", marginTop: 4 }}>{log.details}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="swiss-card" style={{ padding: 32, textAlign: "center", color: "var(--badge-text)" }}>
                Enter a tracking ID to view shipment milestones.
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="swiss-card wireframe-panel">
            <div className="report-filters">
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--title-color)" }}>Date From</label>
                <input type="date" className="swiss-input" value={reportDateFrom} onChange={(e) => setReportDateFrom(e.target.value)} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--title-color)" }}>Date To</label>
                <input type="date" className="swiss-input" value={reportDateTo} onChange={(e) => setReportDateTo(e.target.value)} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--title-color)" }}>Branch</label>
                <select className="swiss-input" value={reportBranch} onChange={(e) => setReportBranch(e.target.value)}>
                  <option value="All">All Branches</option>
                  {dbBranches.map((b) => (
                    <option key={b._id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--title-color)" }}>Partner</label>
                <select className="swiss-input" value={reportPartner} onChange={(e) => setReportPartner(e.target.value)}>
                  <option value="All">All Partners</option>
                  {dbVendors.map((v) => (
                    <option key={v._id} value={v.name}>{v.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Tracking ID</th>
                    <th>Sender</th>
                    <th>Receiver</th>
                    <th>Destination</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReportPackages.map((p) => (
                    <tr key={p._id}>
                      <td className="code-text" style={{ color: "var(--brand-color)", fontWeight: 700 }}>{p.trackingNumber}</td>
                      <td>{p.senderName}</td>
                      <td>{p.receiverName}</td>
                      <td>{branchName(p.destinationBranchId)}</td>
                      <td><span className="swiss-badge">{statusLabel(p.status)}</span></td>
                      <td className="code-text">{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {filteredReportPackages.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: "var(--badge-text)", padding: 24 }}>No shipments match the selected filters</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
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
        )}

        {/* Incoming / Outgoing Tab */}
        {(activeTab === "incoming" || activeTab === "outgoing") && (
          <div className="swiss-card">
            <h3 className="swiss-title" style={{ fontSize: 16, marginBottom: 16, textTransform: "uppercase" }}>
              {activeTab === "incoming" ? "Incoming Cargo List" : "Outgoing Cargo List"}
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Tracking ID</th>
                    <th>Sender</th>
                    <th>Receiver</th>
                    <th>Status</th>
                    <th>Weight</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dbPackages
                    .filter((p) => {
                      const userBranchId = loggedInDbUser?.branchId;
                      if (!userBranchId) return false;
                      if (activeTab === "incoming") {
                        return p.destinationBranchId === userBranchId &&
                          (p.status === "booked" || p.status === "in_transit");
                      }
                      return p.currentBranchId === userBranchId &&
                        (p.status === "booked" || p.status === "in_transit" || p.status === "arrived_at_branch" || p.status === "out_for_delivery");
                    })
                    .map((p) => (
                      <tr key={p._id}>
                        <td className="code-text" style={{ fontWeight: "bold", color: "var(--brand-color)" }}>{p.trackingNumber}</td>
                        <td>{p.senderName}</td>
                        <td>{p.receiverName}</td>
                        <td><span className="swiss-badge">{statusLabel(p.status)}</span></td>
                        <td className="code-text">{p.weight} kg</td>
                        <td style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {activeTab === "incoming" && p.status !== "arrived_at_branch" && p.status !== "delivered" && (
                            <button className="swiss-btn" style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }} onClick={() => handleMarkArrived(p._id)}>Mark Arrived</button>
                          )}
                          {activeTab === "outgoing" && p.status === "booked" && (
                            <button className="swiss-btn" style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }} onClick={() => handleDispatch(p._id)}>Dispatch</button>
                          )}
                          {activeTab === "outgoing" && (p.status === "in_transit" || p.status === "arrived_at_branch") && (
                            <button className="swiss-btn" style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }} onClick={() => handleOutForDelivery(p._id)}>Out for Delivery</button>
                          )}
                          {activeTab === "outgoing" && p.status === "out_for_delivery" && (
                            <button className="swiss-btn" style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto", background: "var(--success-color)", borderColor: "var(--success-color)" }} onClick={() => handleDeliver(p._id)}>Deliver</button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
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
                <div><strong>Partner Agency Name:</strong> {matchedVendor?.name || "N/A"}</div>
                <div><strong>Contact Representative:</strong> {matchedVendor?.contactPerson || loggedInUser.name}</div>
                <div><strong>Representative Email:</strong> {loggedInUser.email}</div>
                <div><strong>Agency Status:</strong> <span className={`swiss-badge ${matchedVendor?.status === "active" ? "active" : ""}`}>{matchedVendor?.status === "active" ? "Active" : "Inactive"}</span></div>
                <div><strong>Description:</strong> External logistics partner authorized to execute long-haul transit dispatch and cargo pick-up routes.</div>
              </div>
            )}
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === "inventory" && (
          <div className="swiss-card wireframe-panel">
            <div className="module-toolbar">
              <input type="text" placeholder="Search products..." className="swiss-input module-search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <button className="swiss-btn" onClick={() => setModalOpen("inventory")}>+ Add Product</button>
            </div>

            {/* Low stock alert */}
            {dbInventory.filter((item) => item.quantity <= item.lowStockAlert).length > 0 && (
              <div style={{ background: "var(--brand-glow-hover)", border: "1px solid var(--brand-color)", padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "var(--brand-color)", fontWeight: 700 }}>
                ⚠ {dbInventory.filter((item) => item.quantity <= item.lowStockAlert).length} item(s) are below low-stock threshold
              </div>
            )}

            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Supplier</th>
                    <th>Quantity</th>
                    <th>Alert Level</th>
                    <th>Price (NPR)</th>
                    <th>Adjust</th>
                  </tr>
                </thead>
                <tbody>
                  {dbInventory
                    .filter((item) => item.productName.toLowerCase().includes(searchQuery.toLowerCase()) || item.sku.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((item) => {
                      const isLow = item.quantity <= item.lowStockAlert;
                      const vendor = dbVendors.find((v) => v._id === item.vendorId);
                      return (
                        <tr key={item._id} style={isLow ? { background: "var(--brand-glow-hover)" } : {}}>
                          <td style={{ fontWeight: 700, color: isLow ? "var(--brand-color)" : "var(--title-color)" }}>{item.productName}</td>
                          <td className="code-text">{item.sku}</td>
                          <td>{item.category}</td>
                          <td>{vendor?.name || "—"}</td>
                          <td className="code-text" style={{ fontWeight: 800, color: isLow ? "var(--brand-color)" : "var(--title-color)" }}>{item.quantity}</td>
                          <td className="code-text">{item.lowStockAlert}</td>
                          <td className="code-text">{item.price.toFixed(2)}</td>
                          <td style={{ display: "flex", gap: 4 }}>
                            <button
                              className="secondary-btn"
                              style={{ padding: "2px 8px", fontSize: 12, fontWeight: 800 }}
                              onClick={() => updateStock({ productId: item._id, newQuantity: Math.max(0, item.quantity - 1) })}
                            >−</button>
                            <button
                              className="secondary-btn"
                              style={{ padding: "2px 8px", fontSize: 12, fontWeight: 800 }}
                              onClick={() => updateStock({ productId: item._id, newQuantity: item.quantity + 1 })}
                            >+</button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}

      {/* User Modal */}
      {modalOpen === "user" && (
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
      )}

      {/* Branch Modal */}
      {modalOpen === "branch" && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="swiss-title" style={{ fontSize: 18 }}>{editingBranchId ? "Edit Branch" : "Add New Branch"}</h2>
              <button className="secondary-btn" style={{ padding: "2px 8px", border: "none" }} onClick={() => { resetBranchForm(); setModalOpen(null); }}>✕</button>
            </div>
            <form onSubmit={handleSaveBranch} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="grid-2">
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Branch Name</label>
                  <input type="text" required className="swiss-input" value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Branch Code</label>
                  <input type="text" required className="swiss-input" placeholder="e.g. KTM" value={newBranchCode} onChange={(e) => setNewBranchCode(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Address</label>
                <input type="text" required className="swiss-input" value={newBranchAddress} onChange={(e) => setNewBranchAddress(e.target.value)} />
              </div>
              <div className="grid-2">
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>City</label>
                  <input type="text" required className="swiss-input" value={newBranchCity} onChange={(e) => setNewBranchCity(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Contact Number</label>
                  <input type="text" required className="swiss-input" value={newBranchContact} onChange={(e) => setNewBranchContact(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Email Address</label>
                <input type="email" className="swiss-input" value={newBranchEmail} onChange={(e) => setNewBranchEmail(e.target.value)} />
              </div>
              <div className="form-row-inline">
                <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Status</label>
                <button
                  type="button"
                  className={`status-toggle ${newBranchActive ? "on" : ""}`}
                  onClick={() => setNewBranchActive(!newBranchActive)}
                >
                  <span className="status-toggle-knob" />
                </button>
                <span style={{ fontSize: 11, color: "var(--badge-text)" }}>{newBranchActive ? "Active" : "Inactive"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                <button type="button" className="secondary-btn" onClick={() => setModalOpen(null)}>Cancel</button>
                <button type="submit" className="swiss-btn">{editingBranchId ? "Save Branch" : "Create Branch"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Package Modal */}
      {modalOpen === "package" && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="swiss-title" style={{ fontSize: 18 }}>{editingPackageId ? "Edit Package" : "Add New Package"}</h2>
              <button className="secondary-btn" style={{ padding: "2px 8px", border: "none" }} onClick={() => { resetPackageForm(); setModalOpen(null); }}>✕</button>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button type="button" onClick={() => setPackageModalTab(1)} className={`modal-tab-btn ${packageModalTab === 1 ? "active" : ""}`}>1. Sender Information</button>
              <button type="button" onClick={() => setPackageModalTab(2)} className={`modal-tab-btn ${packageModalTab === 2 ? "active" : ""}`}>2. Receiver Information</button>
              <button type="button" onClick={() => setPackageModalTab(3)} className={`modal-tab-btn ${packageModalTab === 3 ? "active" : ""}`}>3. Package Information</button>
            </div>
            <form onSubmit={handleSavePackage} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {packageModalTab === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="grid-2">
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Sender Name</label>
                      <input type="text" required className="swiss-input" value={senderName} onChange={(e) => setSenderName(e.target.value)} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Sender Phone</label>
                      <input type="text" required className="swiss-input" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Sender Address</label>
                    <input type="text" required className="swiss-input" value={senderAddress} onChange={(e) => setSenderAddress(e.target.value)} />
                  </div>
                  <button type="button" className="swiss-btn" style={{ padding: "8px", alignSelf: "flex-end", width: 120 }} onClick={() => setPackageModalTab(2)}>Next →</button>
                </div>
              )}
              {packageModalTab === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="grid-2">
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Receiver Name</label>
                      <input type="text" required className="swiss-input" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Receiver Phone</label>
                      <input type="text" required className="swiss-input" value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Receiver Address</label>
                    <input type="text" required className="swiss-input" value={receiverAddress} onChange={(e) => setReceiverAddress(e.target.value)} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <button type="button" className="secondary-btn" onClick={() => setPackageModalTab(1)}>← Back</button>
                    <button type="button" className="swiss-btn" style={{ padding: "8px 16px" }} onClick={() => setPackageModalTab(3)}>Next →</button>
                  </div>
                </div>
              )}
              {packageModalTab === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="grid-2">
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Package Type</label>
                      <select className="swiss-input" value={packageType} onChange={(e) => setPackageType(e.target.value)}>
                        <option value="Document">📄 Document</option>
                        <option value="Electronics">🔌 Electronics</option>
                        <option value="Books">📚 Books</option>
                        <option value="Clothing">👕 Clothing</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Weight (kg)</label>
                      <input type="number" step="0.1" required className="swiss-input" value={packageWeight} onChange={(e) => setPackageWeight(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid-3">
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Length (cm)</label>
                      <input type="number" step="0.1" required className="swiss-input" placeholder="L" value={packageDimL} onChange={(e) => setPackageDimL(e.target.value)} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Width (cm)</label>
                      <input type="number" step="0.1" required className="swiss-input" placeholder="W" value={packageDimW} onChange={(e) => setPackageDimW(e.target.value)} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Height (cm)</label>
                      <input type="number" step="0.1" required className="swiss-input" placeholder="H" value={packageDimH} onChange={(e) => setPackageDimH(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid-2">
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Driver Name</label>
                      <input type="text" className="swiss-input" value={packageDriverName} onChange={(e) => setPackageDriverName(e.target.value)} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Vehicle Number</label>
                      <input type="text" className="swiss-input" value={packageVehicleNumber} onChange={(e) => setPackageVehicleNumber(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Assigned Carrier (Vendor)</label>
                    <select className="swiss-input" value={packageVendorId || ""} onChange={(e) => setPackageVendorId(e.target.value ? e.target.value as Id<"vendors"> : null)}>
                      <option value="">-- No Carrier Assigned --</option>
                      {dbVendors.map((v) => (
                        <option key={v._id} value={v._id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Destination Depot</label>
                    <select className="swiss-input" value={assignBranchIdx} onChange={(e) => setAssignBranchIdx(parseInt(e.target.value))}>
                      {dbBranches.map((b, i) => (
                        <option key={b._id} value={i}>{b.name} ({b.code})</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Description</label>
                    <textarea rows={3} required className="swiss-input" style={{ resize: "none" }} value={packageDescription} onChange={(e) => setPackageDescription(e.target.value)} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                    <button type="button" className="secondary-btn" onClick={() => setPackageModalTab(2)}>← Back</button>
                    <button type="submit" className="swiss-btn">{editingPackageId ? "Save Package" : "Create Package"}</button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Vendor Modal */}
      {modalOpen === "vendor" && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="swiss-title" style={{ fontSize: 18 }}>{editingVendorId ? "Edit Partner" : "Add New Partner"}</h2>
              <button className="secondary-btn" style={{ padding: "2px 8px", border: "none" }} onClick={() => { resetVendorForm(); setModalOpen(null); }}>✕</button>
            </div>
            <form onSubmit={handleSaveVendor} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="grid-2">
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Partner Name</label>
                  <input type="text" required className="swiss-input" value={newVendorName} onChange={(e) => setNewVendorName(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Partner Type</label>
                  <select className="swiss-input" value={newVendorType} onChange={(e) => setNewVendorType(e.target.value)}>
                    <option value="Courier">Courier</option>
                    <option value="Supplier">Supplier</option>
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Email Address</label>
                  <input type="email" required className="swiss-input" value={newVendorEmail} onChange={(e) => setNewVendorEmail(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Contact Person</label>
                  <input type="text" required className="swiss-input" value={newVendorContact} onChange={(e) => setNewVendorContact(e.target.value)} />
                </div>
              </div>
              <div className="grid-2">
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Contact Number</label>
                  <input type="text" required className="swiss-input" value={newVendorPhone} onChange={(e) => setNewVendorPhone(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Address</label>
                  <input type="text" required className="swiss-input" value={newVendorAddress} onChange={(e) => setNewVendorAddress(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                <button type="button" className="secondary-btn" onClick={() => setModalOpen(null)}>Cancel</button>
                <button type="submit" className="swiss-btn">{editingVendorId ? "Save Partner" : "Create Partner"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inventory Modal */}
      {modalOpen === "inventory" && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="swiss-title" style={{ fontSize: 18 }}>Add New Product</h2>
              <button className="secondary-btn" style={{ padding: "2px 8px", border: "none" }} onClick={() => setModalOpen(null)}>✕</button>
            </div>
            <form onSubmit={handleAddProduct} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="grid-2">
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Product Name</label>
                  <input type="text" required className="swiss-input" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>SKU Code</label>
                  <input type="text" required className="swiss-input" placeholder="e.g. LAB-4X6-100" value={newProductSku} onChange={(e) => setNewProductSku(e.target.value)} />
                </div>
              </div>
              <div className="grid-2">
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Category</label>
                  <select className="swiss-input" value={newProductCategory} onChange={(e) => setNewProductCategory(e.target.value)}>
                    <option value="Consumables">Consumables</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Office Supplies">Office Supplies</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Supplier</label>
                  <select className="swiss-input" value={newProductVendorIdx} onChange={(e) => setNewProductVendorIdx(parseInt(e.target.value))}>
                    {dbVendors.map((v, i) => (
                      <option key={v._id} value={i}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid-3">
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Initial Quantity</label>
                  <input type="number" required className="swiss-input" value={newProductQty} onChange={(e) => setNewProductQty(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Low Stock Alert</label>
                  <input type="number" required className="swiss-input" value={newProductAlert} onChange={(e) => setNewProductAlert(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Price (NPR)</label>
                  <input type="number" step="0.01" required className="swiss-input" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                <button type="button" className="secondary-btn" onClick={() => setModalOpen(null)}>Cancel</button>
                <button type="submit" className="swiss-btn">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
