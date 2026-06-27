import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Package, LayoutDashboard, Users, Building2, Handshake, FileText, Settings, LogOut, Bell, Search, Pencil, Trash2, X } from "lucide-react";
import type { Id } from "../convex/_generated/dataModel";
import { verifyPassword } from "./auth";
import Dashboard from "./components/Dashboard";
import Reports from "./components/Reports";
import Inventory from "./components/Inventory";
import Track from "./components/Track";
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

type ShipmentStatus = "booked" | "in_transit" | "arrived_at_branch" | "out_for_delivery" | "delivered" | "returned";
type LogisticsAction = "dispatch" | "deliver" | "statusUpdate" | "return" | "forward";

interface LogisticsModalState {
  action: LogisticsAction;
  packageId: Id<"packages">;
}

interface LogisticsUpdatePayload {
  packageId: Id<"packages">;
  status: ShipmentStatus;
  currentBranchId: Id<"branches">;
  details: string;
  updatedById: Id<"users">;
  driverName?: string;
  vehicleNumber?: string;
  receivedBy?: string;
  deliveryNotes?: string;
}

interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  tone: "info" | "success" | "warning";
}

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
  const [modalOpen, setModalOpen] = useState<"user" | "branch" | "package" | "vendor" | "inventory" | "transaction" | "history" | null>(null);
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

  // Transaction / History modal fields
  const [txProductId, setTxProductId] = useState<Id<"inventory"> | null>(null);
  const [txType, setTxType] = useState<"purchase" | "sale" | "adjustment">("purchase");
  const [txQuantity, setTxQuantity] = useState<string>("");
  const [txNotes, setTxNotes] = useState<string>("");

  // Track package state
  const [trackId, setTrackId] = useState<string>("");
  const [trackedPkgIdx, setTrackedPkgIdx] = useState<number>(-1);

  // Settings & reports
  const [settingsTab, setSettingsTab] = useState<"general" | "security" | "notifications">("general");
  const [reportTab, setReportTab] = useState<"shipments" | "inventory" | "analytics">("shipments");
  const [reportDateFrom, setReportDateFrom] = useState<string>("");
  const [reportDateTo, setReportDateTo] = useState<string>("");
  const [reportBranch, setReportBranch] = useState<string>("All");
  const [reportPartner, setReportPartner] = useState<string>("All");
  const [headerSearch, setHeaderSearch] = useState<string>("");
  const [editingUserId, setEditingUserId] = useState<Id<"users"> | null>(null);
  const [editingBranchId, setEditingBranchId] = useState<Id<"branches"> | null>(null);
  const [editingVendorId, setEditingVendorId] = useState<Id<"vendors"> | null>(null);
  const [editingPackageId, setEditingPackageId] = useState<Id<"packages"> | null>(null);
  const [editingProductId, setEditingProductId] = useState<Id<"inventory"> | null>(null);

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
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [logisticsModal, setLogisticsModal] = useState<LogisticsModalState | null>(null);
  const [logisticsStatus, setLogisticsStatus] = useState<ShipmentStatus>("in_transit");
  const [logisticsBranchId, setLogisticsBranchId] = useState<string>("");
  const [logisticsDriverName, setLogisticsDriverName] = useState<string>("");
  const [logisticsVehicleNumber, setLogisticsVehicleNumber] = useState<string>("");
  const [logisticsReceivedBy, setLogisticsReceivedBy] = useState<string>("");
  const [logisticsDeliveryNotes, setLogisticsDeliveryNotes] = useState<string>("");
  const [logisticsDetails, setLogisticsDetails] = useState<string>("");

  // Convex queries
  const dbUsers = useQuery(api.users.listPublic) ?? [];
  const dbBranches = useQuery(api.branches.list) ?? [];
  const dbPackages = useQuery(api.packages.list) ?? [];
  const dbVendors = useQuery(api.vendors.list) ?? [];
  const dbInventory = useQuery(api.inventory.list) ?? [];
  const dbMovements = useQuery(api.inventory.getMovements, txProductId ? { productId: txProductId } : "skip") ?? [];
  const dbAllMovements = useQuery(api.inventory.getAllMovements) ?? [];
  const authLoginUser = useQuery(api.users.getByEmail, loginEmail ? { email: loginEmail } : "skip");
  const authSessionUser = useQuery(api.users.getByEmail, loggedInUser && activeTab === "settings" ? { email: loggedInUser.email } : "skip");

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
  const updateProduct = useMutation(api.inventory.updateProduct);
  const removeProduct = useMutation(api.inventory.removeProduct);
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
    const user = authLoginUser;
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

  const resetProductForm = () => {
    setEditingProductId(null);
    setNewProductName("");
    setNewProductCategory("Consumables");
    setNewProductSku("");
    setNewProductQty("0");
    setNewProductAlert("10");
    setNewProductPrice("0");
    setNewProductVendorIdx(0);
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

  const openEditProduct = (item: (typeof dbInventory)[0]) => {
    setEditingProductId(item._id);
    setNewProductName(item.productName);
    setNewProductCategory(item.category);
    setNewProductSku(item.sku);
    setNewProductQty(String(item.quantity));
    setNewProductAlert(String(item.lowStockAlert));
    setNewProductPrice(String(item.price));
    const vendorIndex = dbVendors.findIndex((v) => v._id === item.vendorId);
    setNewProductVendorIdx(vendorIndex >= 0 ? vendorIndex : 0);
    setModalOpen("inventory");
  };

  const resetLogisticsModal = () => {
    setLogisticsModal(null);
    setLogisticsStatus("in_transit");
    setLogisticsBranchId("");
    setLogisticsDriverName("");
    setLogisticsVehicleNumber("");
    setLogisticsReceivedBy("");
    setLogisticsDeliveryNotes("");
    setLogisticsDetails("");
  };

  const openLogisticsModal = (action: LogisticsAction, packageId: Id<"packages">) => {
    const shipment = dbPackages.find((pkg) => pkg._id === packageId);
    const branchId = loggedInDbUser?.branchId ? String(loggedInDbUser.branchId) : "";
    const initialStatus: ShipmentStatus = action === "deliver"
      ? "delivered"
      : action === "return"
        ? "returned"
        : action === "forward"
          ? "in_transit"
          : action === "dispatch"
            ? "in_transit"
            : shipment?.status as ShipmentStatus || "booked";

    setLogisticsModal({ action, packageId });
    setLogisticsStatus(initialStatus);
    setLogisticsBranchId(action === "forward" ? "" : shipment ? String(shipment.currentBranchId) : branchId);
    setLogisticsDriverName(shipment?.driverName || "");
    setLogisticsVehicleNumber(shipment?.vehicleNumber || "");
    setLogisticsReceivedBy(shipment?.receivedBy || "");
    setLogisticsDeliveryNotes(shipment?.deliveryNotes || "");
    setLogisticsDetails("");
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
    const user = authSessionUser;
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
    setNotificationsOpen(false);
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

  // Add or edit inventory product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInDbUser) return;
    if (dbVendors.length < 1) {
      alert("Add at least one vendor first.");
      return;
    }
    const vendor = dbVendors[newProductVendorIdx] || dbVendors[0];

    if (editingProductId) {
      await updateProduct({
        productId: editingProductId,
        productName: newProductName,
        category: newProductCategory,
        sku: newProductSku,
        lowStockAlert: parseInt(newProductAlert) || 10,
        vendorId: vendor._id,
        price: parseFloat(newProductPrice) || 0,
      });
    } else {
      await createProduct({
        productName: newProductName,
        category: newProductCategory,
        sku: newProductSku,
        quantity: parseInt(newProductQty) || 0,
        lowStockAlert: parseInt(newProductAlert) || 10,
        vendorId: vendor._id,
        price: parseFloat(newProductPrice) || 0,
        updatedById: loggedInDbUser._id,
      });
    }

    resetProductForm();
    setModalOpen(null);
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txProductId || !loggedInUser) return;
    
    const qtyVal = parseInt(txQuantity) || 0;
    if (qtyVal === 0) return;
    
    const product = dbInventory.find(p => p._id === txProductId);
    if (!product) return;
    
    let appliedChange = qtyVal;
    if (txType === "sale") appliedChange = -Math.abs(qtyVal);
    if (txType === "purchase") appliedChange = Math.abs(qtyVal);
    
    await updateStock({
      productId: txProductId,
      newQuantity: Math.max(0, product.quantity + appliedChange),
      type: txType,
      quantityChanged: appliedChange,
      notes: txNotes,
      updatedById: loggedInDbUser!._id,
    });
    
    setModalOpen(null);
    setTxQuantity("");
    setTxNotes("");
  };

  const exportToCSV = () => {
    let csvData = "";
    if (reportTab === "shipments") {
      const headers = ["Tracking ID", "Sender", "Receiver", "Destination", "Status", "Date"];
      const rows = filteredReportPackages.map(p => [
        p.trackingNumber,
        `"${p.senderName}"`,
        `"${p.receiverName}"`,
        `"${branchName(p.destinationBranchId)}"`,
        p.status,
        new Date(p.createdAt).toLocaleDateString()
      ]);
      csvData = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    } else if (reportTab === "inventory") {
      const headers = ["Date", "Type", "Change", "Notes", "Product", "User"];
      const rows = dbAllMovements.slice().reverse().map(log => {
        const product = dbInventory.find(p => p._id === log.productId);
        const user = dbUsers.find(u => u._id === log.updatedById);
        return [
          new Date(log.timestamp).toLocaleString(),
          log.type,
          log.quantityChanged,
          `"${log.notes || ""}"`,
          `"${product?.productName || "Unknown"}"`,
          `"${user?.name || "Unknown"}"`
        ];
      });
      csvData = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    } else if (reportTab === "analytics") {
      const rows = [
        ["Total Shipments", dbPackages.length],
        ["Delivered", reportDelivered],
        ["In Transit", reportInTransit],
        ["Returned", reportReturned],
        ["Delivery Success Rate", `${reportSuccessRate}%`],
        ["Total Products", dbInventory.length],
        ["Low Stock Items", reportLowStock],
        ["Stock Value", `Rs ${reportStockValue}`],
        ["Active Vendors", dbVendors.length],
      ];
      csvData = [["Metric", "Value"].join(","), ...rows.map(r => r.join(","))].join("\n");
    }

    if (!csvData) return;
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logikeep_report_${reportTab}_${new Date().getTime()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
  const logisticsShipment = logisticsModal ? dbPackages.find((pkg) => pkg._id === logisticsModal.packageId) : null;

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
      vendors: "Vendor Management",
      partners: "Vendor Management",
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

  const loggedInDbUser = loggedInUser
    ? dbUsers.find((u) => u.email.toLowerCase() === loggedInUser.email.toLowerCase())
    : undefined;
  const matchedVendor = loggedInUser
    ? dbVendors.find((v) => v.email.toLowerCase() === loggedInUser.email.toLowerCase())
    : undefined;
  const branchScopedPackages = loggedInDbUser?.branchId
    ? dbPackages.filter((p) => p.originBranchId === loggedInDbUser.branchId || p.currentBranchId === loggedInDbUser.branchId || p.destinationBranchId === loggedInDbUser.branchId)
    : dbPackages;
  const vendorPackages = loggedInUser?.role === "Vendor" && matchedVendor
    ? dbPackages.filter((p) => p.assignedVendorId === matchedVendor._id)
    : [];
  const visiblePackages = loggedInUser?.role === "Vendor" && matchedVendor
    ? vendorPackages
    : loggedInUser?.role === "Branch Staff"
      ? branchScopedPackages
      : dbPackages;
  const dashboardPackages = visiblePackages;
  const notificationPackages = visiblePackages;
  const vendorPickupPackages = vendorPackages.filter((p) => p.status === "booked");
  const vendorInvoicePackages = vendorPackages.filter((p) => p.status === "delivered");
  const lowStockItems = notifyLowStock ? dbInventory.filter((item) => item.quantity <= item.lowStockAlert) : [];
  const deliveryNotifications = notifyDelivery
    ? notificationPackages
        .filter((p) => p.status === "delivered")
        .slice()
        .reverse()
        .slice(0, 5)
        .map((p) => ({
          id: `delivered-${p._id}`,
          title: `Delivered: ${p.trackingNumber}`,
          detail: `${branchName(p.destinationBranchId)} · ${new Date(p.updatedAt).toLocaleDateString()}`,
          tone: "success" as const,
        }))
    : [];
  const bookingNotifications = notifyBooking
    ? notificationPackages
        .filter((p) => p.status === "booked")
        .slice()
        .reverse()
        .slice(0, 5)
        .map((p) => ({
          id: `booked-${p._id}`,
          title: `New booking: ${p.trackingNumber}`,
          detail: `${branchName(p.originBranchId)} → ${branchName(p.destinationBranchId)}`,
          tone: "info" as const,
        }))
    : [];
  const lowStockNotifications = lowStockItems.map((item) => ({
    id: `low-${item._id}`,
    title: `Low stock: ${item.productName}`,
    detail: `${item.quantity} left · alert ${item.lowStockAlert}`,
    tone: "warning" as const,
  }));
  const weeklySummaryNotifications = notifyWeekly
    ? [{
        id: "weekly-summary",
        title: "Weekly summary ready",
        detail: `${dashboardPackages.length} shipments in your current view`,
        tone: "info" as const,
      }]
    : [];
  const notificationItems: NotificationItem[] = [
    ...lowStockNotifications,
    ...deliveryNotifications,
    ...bookingNotifications,
    ...weeklySummaryNotifications,
  ];

  const activeShipments = dashboardPackages.filter((p) => p.status !== "delivered" && p.status !== "returned").length;
  const deliveredCount = dashboardPackages.filter((p) => p.status === "delivered").length;
  const successRate = dashboardPackages.length > 0 ? Math.round((deliveredCount / dashboardPackages.length) * 100) : 0;

  const directionSlices = dbBranches.map((b, i) => {
    const count = dashboardPackages.filter((p) => p.destinationBranchId === b._id).length;
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

  // numbers for the analytics summary report
  const reportDelivered = dbPackages.filter((p) => p.status === "delivered").length;
  const reportInTransit = dbPackages.filter((p) => p.status === "in_transit" || p.status === "out_for_delivery").length;
  const reportReturned = dbPackages.filter((p) => p.status === "returned").length;
  const reportSuccessRate = dbPackages.length > 0 ? Math.round((reportDelivered / dbPackages.length) * 100) : 0;
  const reportLowStock = dbInventory.filter((item) => item.quantity <= item.lowStockAlert).length;
  const reportStockValue = dbInventory.reduce((sum, item) => sum + item.quantity * item.price, 0);
  console.log("render", activeTab);

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

  const handleMarkArrived = async (packageId: Id<"packages">) => {
    if (!loggedInDbUser?.branchId) return;
    const bName = dbBranches.find(b => b._id === loggedInDbUser.branchId)?.name || "branch";
    await updateStatus({ packageId, status: "arrived_at_branch", currentBranchId: loggedInDbUser.branchId, details: `Received at ${bName}`, updatedById: loggedInDbUser._id });
  };

  const handleDispatch = (packageId: Id<"packages">) => {
    openLogisticsModal("dispatch", packageId);
  };

  const handleOutForDelivery = async (packageId: Id<"packages">) => {
    if (!loggedInDbUser?.branchId) return;
    await updateStatus({ packageId, status: "out_for_delivery", currentBranchId: loggedInDbUser.branchId, details: "Out for local delivery", updatedById: loggedInDbUser._id });
  };

  const handleDeliver = (packageId: Id<"packages">) => {
    openLogisticsModal("deliver", packageId);
  };

  const handleAdminUpdateStatus = (packageId: Id<"packages">) => {
    openLogisticsModal("statusUpdate", packageId);
  };

  const handleMarkReturned = (packageId: Id<"packages">) => {
    openLogisticsModal("return", packageId);
  };

  const handleForwardToHub = (packageId: Id<"packages">) => {
    openLogisticsModal("forward", packageId);
  };

  const submitLogisticsAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logisticsModal || !loggedInDbUser) return;

    const shipment = dbPackages.find((pkg) => pkg._id === logisticsModal.packageId);
    if (!shipment) return;

    const selectedBranchId = logisticsBranchId ? (logisticsBranchId as Id<"branches">) : undefined;
    const currentBranchId = logisticsModal.action === "forward"
      ? shipment.currentBranchId
      : selectedBranchId ?? loggedInDbUser.branchId;
    if (!currentBranchId) {
      alert("Select a branch before saving.");
      return;
    }

    const update = async (payload: LogisticsUpdatePayload) => {
      await updateStatus(payload);
      resetLogisticsModal();
    };

    const currentBranchLabel = branchName(currentBranchId);

    switch (logisticsModal.action) {
      case "dispatch":
        await update({
          packageId: shipment._id,
          status: "in_transit",
          currentBranchId,
          details: logisticsDetails || `Dispatched with driver ${logisticsDriverName || "N/A"}${logisticsVehicleNumber ? ` (Vehicle: ${logisticsVehicleNumber})` : ""}`,
          updatedById: loggedInDbUser._id,
          driverName: logisticsDriverName || undefined,
          vehicleNumber: logisticsVehicleNumber || undefined,
        });
        break;
      case "deliver":
        if (!logisticsReceivedBy.trim()) {
          alert("Receiver name is required.");
          return;
        }
        await update({
          packageId: shipment._id,
          status: "delivered",
          currentBranchId,
          details: logisticsDetails || `Delivered to recipient. Signed by: ${logisticsReceivedBy}${logisticsDeliveryNotes ? ` (Notes: ${logisticsDeliveryNotes})` : ""}`,
          updatedById: loggedInDbUser._id,
          receivedBy: logisticsReceivedBy,
          deliveryNotes: logisticsDeliveryNotes || undefined,
        });
        break;
      case "statusUpdate": {
        const validTransitions: Record<string, string[]> = {
          booked: ["in_transit", "returned"],
          in_transit: ["arrived_at_branch", "returned"],
          arrived_at_branch: ["out_for_delivery", "in_transit", "returned"],
          out_for_delivery: ["delivered", "returned"],
          delivered: ["returned"],
          returned: [],
        };
        const currentPkgStatus = shipment.status;
        const allowed = validTransitions[currentPkgStatus] || [];
        if (logisticsStatus !== currentPkgStatus && !allowed.includes(logisticsStatus)) {
          alert(`Cannot transition from "${currentPkgStatus}" to "${logisticsStatus}".`);
          return;
        }
        if (logisticsStatus === "delivered" && !logisticsReceivedBy.trim()) {
          alert("Receiver name is required.");
          return;
        }
        await update({
          packageId: shipment._id,
          status: logisticsStatus,
          currentBranchId,
          details: logisticsDetails || `Admin manual status update to ${logisticsStatus.replace(/_/g, " ")}`,
          updatedById: loggedInDbUser._id,
          driverName: logisticsStatus === "in_transit" ? logisticsDriverName || undefined : undefined,
          vehicleNumber: logisticsStatus === "in_transit" ? logisticsVehicleNumber || undefined : undefined,
          receivedBy: logisticsStatus === "delivered" ? logisticsReceivedBy || undefined : undefined,
          deliveryNotes: logisticsStatus === "delivered" ? logisticsDeliveryNotes || undefined : undefined,
        });
        break;
      }
      case "return":
        await update({
          packageId: shipment._id,
          status: "returned",
          currentBranchId,
          details: logisticsDetails || `Returned to sender from ${currentBranchLabel}`,
          updatedById: loggedInDbUser._id,
        });
        break;
      case "forward":
        if (!selectedBranchId) {
          alert("Select the next hub before forwarding.");
          return;
        }
        if (selectedBranchId === shipment.currentBranchId) {
          alert("Choose a different hub for the forward action.");
          return;
        }
        await update({
          packageId: shipment._id,
          status: "in_transit",
          currentBranchId: selectedBranchId,
          details: logisticsDetails || `Transferred from ${branchName(shipment.currentBranchId)} to ${branchName(selectedBranchId)}`,
          updatedById: loggedInDbUser._id,
          driverName: logisticsDriverName || undefined,
          vehicleNumber: logisticsVehicleNumber || undefined,
        });
        break;
    }
  };

  const openTrackPackage = (trackingNumber: string) => {
    setTrackId(trackingNumber);
    const idx = dbPackages.findIndex((p) => p.trackingNumber === trackingNumber);
    setTrackedPkgIdx(idx);
    setActiveTab("track");
  };

  const weeklyCounts = weeklyPackageCounts(dashboardPackages);
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
              <NavBtn tab="vendors" label="Vendor Management" icon={<Handshake size={14} />} />
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
          <div className="topbar-actions" style={{ position: "relative" }}>
            <button
              type="button"
              className="topbar-icon-btn"
              title="Notifications"
              onClick={() => setNotificationsOpen((value) => !value)}
              style={{ position: "relative" }}
            >
              <Bell size={14} />
              {notificationItems.length > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    minWidth: 16,
                    height: 16,
                    padding: "0 4px",
                    borderRadius: 999,
                    background: "var(--brand-color)",
                    color: "white",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {notificationItems.length}
                </span>
              )}
            </button>
            {notificationsOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 10px)",
                  right: 56,
                  width: 320,
                  background: "var(--bg-color)",
                  border: "1px solid var(--border-color)",
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.18)",
                  borderRadius: 16,
                  padding: 14,
                  zIndex: 30,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <h4 className="swiss-title" style={{ fontSize: 13, margin: 0 }}>Notifications</h4>
                  <button type="button" className="secondary-btn" style={{ padding: "2px 8px", border: "none" }} onClick={() => setNotificationsOpen(false)}>✕</button>
                </div>
                {notificationItems.length === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--badge-text)" }}>No notifications right now.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 320, overflowY: "auto" }}>
                    {notificationItems.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          border: "1px solid var(--border-color)",
                          borderLeft: `4px solid ${item.tone === "warning" ? "var(--brand-color)" : item.tone === "success" ? "var(--success-color)" : "var(--secondary)"}`,
                          borderRadius: 12,
                          padding: "10px 12px",
                          background: "var(--bg-color)",
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--title-color)", marginBottom: 2 }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: "var(--badge-text)" }}>{item.detail}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
          <Dashboard
            role={role}
            dashboardPackages={dashboardPackages}
            activeShipments={activeShipments}
            deliveredCount={deliveredCount}
            successRate={successRate}
            dbInventory={dbInventory}
            dbVendors={dbVendors}
            dbBranches={dbBranches}
            lineChartPath={lineChartPath}
            weeklyCounts={weeklyCounts}
            barChartMax={barChartMax}
            directionSlices={directionSlices}
            directionTotal={directionTotal}
            branchName={branchName}
            statusLabel={statusLabel}
          />
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
                  {visiblePackages
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

        {/* vendor management tab */}
        {activeTab === "vendors" && (
          <div className="swiss-card wireframe-panel">
            <div className="module-toolbar">
              <input type="text" placeholder="Search vendors..." className="swiss-input module-search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <button className="swiss-btn" onClick={() => { resetVendorForm(); setModalOpen("vendor"); }}>+ Add New Vendor</button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Vendor Name</th>
                    <th>Vendor Type</th>
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
                            if (confirm(`Deactivate vendor ${v.name}?`)) await removeVendor({ vendorId: v._id });
                          }}
                        />
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Track Tab */}
        {activeTab === "track" && (
          <Track
            trackId={trackId}
            setTrackId={setTrackId}
            handleTrackPackage={handleTrackPackage}
            trackedPackage={trackedPackage}
            trackedMovementLogs={trackedMovementLogs}
            dbVendors={dbVendors}
            branchName={branchName}
            branchCode={branchCode}
            statusLabel={statusLabel}
          />
        )}

        {/* Pickup Requests Tab */}
        {activeTab === "pickup" && (
          <div className="swiss-card wireframe-panel">
            <div className="module-toolbar">
              <input type="text" placeholder="Search pickup requests..." className="swiss-input module-search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <span className="swiss-badge active">{vendorPickupPackages.length} pending</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Tracking ID</th>
                    <th>Sender</th>
                    <th>Destination</th>
                    <th>Weight</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorPickupPackages
                    .filter((p) =>
                      p.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      branchName(p.destinationBranchId).toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((p) => (
                      <tr key={p._id}>
                        <td className="code-text" style={{ fontWeight: "bold", color: "var(--brand-color)" }}>{p.trackingNumber}</td>
                        <td>{p.senderName}</td>
                        <td>{branchName(p.destinationBranchId)}</td>
                        <td className="code-text">{p.weight} kg</td>
                        <td><span className="swiss-badge">{statusLabel(p.status)}</span></td>
                        <td>
                          <button
                            type="button"
                            className="swiss-btn"
                            style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }}
                            onClick={async () => {
                              if (!loggedInDbUser) return;
                              await updateStatus({
                                packageId: p._id,
                                status: "in_transit",
                                currentBranchId: p.currentBranchId,
                                details: "Pickup accepted by carrier",
                                updatedById: loggedInDbUser._id,
                                driverName: p.driverName || undefined,
                                vehicleNumber: p.vehicleNumber || undefined,
                              });
                            }}
                          >
                            Accept Pickup
                          </button>
                        </td>
                      </tr>
                    ))}
                  {vendorPickupPackages.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: "var(--badge-text)", padding: 24 }}>No pickup requests assigned yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === "invoices" && (
          <div className="swiss-card wireframe-panel">
            <div className="module-toolbar">
              <input type="text" placeholder="Search invoices..." className="swiss-input module-search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <span className="swiss-badge active">{vendorInvoicePackages.length} paid / delivered</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Tracking ID</th>
                    <th>Route</th>
                    <th>Weight</th>
                    <th>Delivered</th>
                    <th>POD Recipient</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorInvoicePackages
                    .filter((p) =>
                      p.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      branchName(p.destinationBranchId).toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.receiverName.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((p) => (
                      <tr key={p._id}>
                        <td className="code-text" style={{ fontWeight: "bold", color: "var(--brand-color)" }}>{p.trackingNumber}</td>
                        <td>{branchName(p.originBranchId)} → {branchName(p.destinationBranchId)}</td>
                        <td className="code-text">{p.weight} kg</td>
                        <td className="code-text">{new Date(p.updatedAt).toLocaleDateString()}</td>
                        <td>{p.receivedBy || "—"}</td>
                      </tr>
                    ))}
                  {vendorInvoicePackages.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", color: "var(--badge-text)", padding: 24 }}>No delivered shipments yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <Reports
            reportTab={reportTab}
            setReportTab={setReportTab}
            exportToCSV={exportToCSV}
            reportDateFrom={reportDateFrom}
            setReportDateFrom={setReportDateFrom}
            reportDateTo={reportDateTo}
            setReportDateTo={setReportDateTo}
            reportBranch={reportBranch}
            setReportBranch={setReportBranch}
            reportPartner={reportPartner}
            setReportPartner={setReportPartner}
            dbBranches={dbBranches}
            dbVendors={dbVendors}
            dbPackages={dbPackages}
            dbInventory={dbInventory}
            dbUsers={dbUsers}
            dbAllMovements={dbAllMovements}
            filteredReportPackages={filteredReportPackages}
            reportDelivered={reportDelivered}
            reportInTransit={reportInTransit}
            reportReturned={reportReturned}
            reportSuccessRate={reportSuccessRate}
            reportLowStock={reportLowStock}
            reportStockValue={reportStockValue}
            branchName={branchName}
            statusLabel={statusLabel}
            timezone={timezone}
          />
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
                        return (
                          (p.destinationBranchId === userBranchId && p.status === "in_transit") ||
                          (p.currentBranchId === userBranchId && p.status === "arrived_at_branch" && p.currentBranchId !== p.destinationBranchId)
                        );
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
                          {activeTab === "incoming" && p.status === "in_transit" && (
                            <button className="swiss-btn" style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }} onClick={() => handleMarkArrived(p._id)}>Mark Arrived</button>
                          )}
                          {activeTab === "incoming" && p.status === "arrived_at_branch" && p.currentBranchId !== p.destinationBranchId && (
                            <button className="swiss-btn" style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }} onClick={() => handleForwardToHub(p._id)}>Forward to Hub</button>
                          )}
                          {activeTab === "outgoing" && p.status === "booked" && (
                            <button className="swiss-btn" style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }} onClick={() => handleDispatch(p._id)}>Dispatch</button>
                          )}
                          {activeTab === "outgoing" && (p.status === "in_transit" || p.status === "arrived_at_branch") && (
                            <button className="swiss-btn" style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }} onClick={() => handleOutForDelivery(p._id)}>Out for Delivery</button>
                          )}
                          {activeTab === "outgoing" && (p.status === "arrived_at_branch" || p.status === "out_for_delivery") && (
                            <button className="secondary-btn" style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }} onClick={() => handleMarkReturned(p._id)}>Mark Returned</button>
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
                <div><strong>Vendor Agency Name:</strong> {matchedVendor?.name || "N/A"}</div>
                <div><strong>Contact Representative:</strong> {matchedVendor?.contactPerson || loggedInUser.name}</div>
                <div><strong>Representative Email:</strong> {loggedInUser.email}</div>
                <div><strong>Agency Status:</strong> <span className={`swiss-badge ${matchedVendor?.status === "active" ? "active" : ""}`}>{matchedVendor?.status === "active" ? "Active" : "Inactive"}</span></div>
                <div><strong>Description:</strong> External logistics vendor authorized to execute long-haul transit dispatch and cargo pick-up routes.</div>
              </div>
            )}
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === "inventory" && (
          <Inventory
            dbInventory={dbInventory}
            dbVendors={dbVendors}
            lowStockItems={lowStockItems}
            notifyLowStock={notifyLowStock}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            txProductId={txProductId}
            setTxProductId={setTxProductId}
            setModalOpen={setModalOpen}
            loggedInDbUser={loggedInDbUser}
            openEditProduct={openEditProduct}
            resetProductForm={resetProductForm}
            updateStock={updateStock}
            removeProduct={removeProduct}
          />
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
              <h2 className="swiss-title" style={{ fontSize: 18 }}>{editingVendorId ? "Edit Vendor" : "Add New Vendor"}</h2>
              <button className="secondary-btn" style={{ padding: "2px 8px", border: "none" }} onClick={() => { resetVendorForm(); setModalOpen(null); }}>✕</button>
            </div>
            <form onSubmit={handleSaveVendor} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="grid-2">
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Vendor Name</label>
                  <input type="text" required className="swiss-input" value={newVendorName} onChange={(e) => setNewVendorName(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Vendor Type</label>
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
                <button type="submit" className="swiss-btn">{editingVendorId ? "Save Vendor" : "Create Vendor"}</button>
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
              <h2 className="swiss-title" style={{ fontSize: 18 }}>{editingProductId ? "Edit Product" : "Add New Product"}</h2>
              <button className="secondary-btn" style={{ padding: "2px 8px", border: "none" }} onClick={() => { resetProductForm(); setModalOpen(null); }}>✕</button>
            </div>
            <form onSubmit={handleSaveProduct} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>{editingProductId ? "Current Quantity" : "Initial Quantity"}</label>
                  <input
                    type="number"
                    required={!editingProductId}
                    className="swiss-input"
                    value={newProductQty}
                    onChange={(e) => setNewProductQty(e.target.value)}
                    disabled={!!editingProductId}
                  />
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
                <button type="button" className="secondary-btn" onClick={() => { resetProductForm(); setModalOpen(null); }}>Cancel</button>
                <button type="submit" className="swiss-btn">{editingProductId ? "Save Product" : "Create Product"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {modalOpen === "transaction" && txProductId && (
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
                <input type="text" className="swiss-input" value={txNotes} onChange={(e) => setTxNotes(e.target.value)} placeholder="e.g. Supplier Invoice #1234" />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                <button type="button" className="secondary-btn" onClick={() => setModalOpen(null)}>Cancel</button>
                <button type="submit" className="swiss-btn">Save Log</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {modalOpen === "history" && txProductId && (
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
      )}

      {logisticsModal && logisticsShipment && (
        <div className="modal-overlay" onClick={resetLogisticsModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2 className="swiss-title" style={{ fontSize: 18 }}>
                {logisticsModal.action === "dispatch"
                  ? "Dispatch Shipment"
                  : logisticsModal.action === "deliver"
                    ? "Confirm Delivery"
                    : logisticsModal.action === "statusUpdate"
                      ? "Update Shipment Status"
                      : logisticsModal.action === "return"
                        ? "Mark Returned"
                        : "Forward to Hub"}
              </h2>
              <button className="secondary-btn" style={{ padding: "2px 8px", border: "none" }} onClick={resetLogisticsModal}>✕</button>
            </div>
            <form onSubmit={submitLogisticsAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Shipment</label>
                <div className="swiss-badge active" style={{ width: "fit-content" }}>
                  {logisticsShipment.trackingNumber} · {branchName(logisticsShipment.originBranchId)} → {branchName(logisticsShipment.destinationBranchId)}
                </div>
              </div>

              {(logisticsModal.action === "dispatch" || logisticsModal.action === "forward" || (logisticsModal.action === "statusUpdate" && logisticsStatus === "in_transit")) && (
                <div className="grid-2">
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Driver Name</label>
                    <input type="text" className="swiss-input" value={logisticsDriverName} onChange={(e) => setLogisticsDriverName(e.target.value)} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Vehicle Number</label>
                    <input type="text" className="swiss-input" value={logisticsVehicleNumber} onChange={(e) => setLogisticsVehicleNumber(e.target.value)} />
                  </div>
                </div>
              )}

              {logisticsModal.action === "statusUpdate" && (
                <>
                  <div className="grid-2">
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Status</label>
                      <select className="swiss-input" value={logisticsStatus} onChange={(e) => setLogisticsStatus(e.target.value as ShipmentStatus)}>
                        <option value="booked">Booked</option>
                        <option value="in_transit">In Transit</option>
                        <option value="arrived_at_branch">At Branch</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="returned">Returned</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Current Branch</label>
                      <select className="swiss-input" value={logisticsBranchId} onChange={(e) => setLogisticsBranchId(e.target.value)}>
                        <option value="">Select branch</option>
                        {dbBranches.map((branch) => (
                          <option key={branch._id} value={branch._id}>{branch.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {logisticsStatus === "delivered" && (
                    <div className="grid-2">
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Received By</label>
                        <input type="text" className="swiss-input" value={logisticsReceivedBy} onChange={(e) => setLogisticsReceivedBy(e.target.value)} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Delivery Notes</label>
                        <input type="text" className="swiss-input" value={logisticsDeliveryNotes} onChange={(e) => setLogisticsDeliveryNotes(e.target.value)} />
                      </div>
                    </div>
                  )}
                </>
              )}

              {logisticsModal.action === "deliver" && (
                <div className="grid-2">
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Received By</label>
                    <input type="text" required className="swiss-input" value={logisticsReceivedBy} onChange={(e) => setLogisticsReceivedBy(e.target.value)} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Delivery Notes</label>
                    <input type="text" className="swiss-input" value={logisticsDeliveryNotes} onChange={(e) => setLogisticsDeliveryNotes(e.target.value)} />
                  </div>
                </div>
              )}

              {logisticsModal.action === "forward" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>Forward To Hub</label>
                  <select className="swiss-input" value={logisticsBranchId} onChange={(e) => setLogisticsBranchId(e.target.value)}>
                    <option value="">Select branch</option>
                    {dbBranches.map((branch) => (
                      <option key={branch._id} value={branch._id}>{branch.name} ({branch.code})</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "var(--title-color)", fontWeight: 600 }}>
                  {logisticsModal.action === "return"
                    ? "Return Reason"
                    : logisticsModal.action === "deliver"
                      ? "Delivery Details"
                      : logisticsModal.action === "forward"
                        ? "Transfer Details"
                        : logisticsModal.action === "dispatch"
                          ? "Dispatch Details"
                          : "Status Details"}
                </label>
                <textarea
                  rows={3}
                  className="swiss-input"
                  style={{ resize: "none" }}
                  value={logisticsDetails}
                  onChange={(e) => setLogisticsDetails(e.target.value)}
                  placeholder={logisticsModal.action === "dispatch"
                    ? "Driver and loading notes"
                    : logisticsModal.action === "deliver"
                      ? "Delivery remarks"
                      : logisticsModal.action === "forward"
                        ? "Transfer notes"
                        : logisticsModal.action === "return"
                          ? "Reason for return"
                          : "Add update details"}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                <button type="button" className="secondary-btn" onClick={resetLogisticsModal}>Cancel</button>
                <button type="submit" className="swiss-btn">
                  {logisticsModal.action === "dispatch"
                    ? "Dispatch"
                    : logisticsModal.action === "deliver"
                      ? "Mark Delivered"
                      : logisticsModal.action === "statusUpdate"
                        ? "Save Status"
                        : logisticsModal.action === "return"
                          ? "Mark Returned"
                          : "Forward"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
