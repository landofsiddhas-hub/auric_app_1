import React, { useState } from 'react';
import {
  Store,
  UserCircle2,
  Sun,
  Moon,
  TrendingUp,
  Plus,
  Lock,
  KeyRound,
  Building2,
  Trash2,
  Edit3,
  CheckCircle2,
  ShieldCheck,
  Users,
  ArrowRightLeft,
} from 'lucide-react';
import { Article, Branch, MetalRateSnapshot, StaffRole, StaffUser, Tenant } from '../core/types';
import { formatCurrencyINR } from '../core/math';

interface HeaderProps {
  tenant: Tenant;
  branches: Branch[];
  activeBranch: Branch;
  onSelectBranch: (branch: Branch) => void;
  onUpdateTenant?: (updatedTenant: Tenant) => void;
  onAddBranch?: (branch: Branch) => void;
  onUpdateBranch?: (branch: Branch) => void;
  onDeleteBranch?: (branchId: string) => void;
  metalRates: MetalRateSnapshot;
  userRole: StaffRole;
  onChangeRole: (role: StaffRole) => void;
  staffUsers?: StaffUser[];
  currentStaff?: StaffUser;
  onSelectStaff?: (staff: StaffUser) => void;
  onAddStaff?: (staff: StaffUser) => void;
  onUpdateStaff?: (staff: StaffUser) => void;
  onDeleteStaff?: (staffId: string) => void;
  articles?: Article[];
  onNavigateTab?: (tab: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  tenant,
  branches,
  activeBranch,
  onSelectBranch,
  onUpdateTenant,
  onAddBranch,
  onUpdateBranch,
  onDeleteBranch,
  metalRates,
  userRole,
  onChangeRole,
  staffUsers = [],
  currentStaff,
  onSelectStaff,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  articles = [],
  onNavigateTab,
  darkMode,
  onToggleDarkMode,
}) => {
  // Branch Manager Modal state
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [shopTradeName, setShopTradeName] = useState(tenant.tradeName);
  const [shopLegalName, setShopLegalName] = useState(tenant.legalName);

  const [bName, setBName] = useState('');
  const [bCode, setBCode] = useState('');
  const [bCity, setBCity] = useState('');
  const [bAddress, setBAddress] = useState('');
  const [bGstin, setBGstin] = useState('');
  const [bPhone, setBPhone] = useState('');
  const [bManager, setBManager] = useState('');
  const [bIsHq, setBIsHq] = useState(false);
  const [branchSavedMsg, setBranchSavedMsg] = useState<string | null>(null);

  // Staff Login / PIN Lock Modal & Staff Manager Modal state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginTargetStaffId, setLoginTargetStaffId] = useState<string>(
    currentStaff?.id || staffUsers[0]?.id || ''
  );
  const [enteredPin, setEnteredPin] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const [showStaffManagerModal, setShowStaffManagerModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>('CASHIER');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffBranchId, setNewStaffBranchId] = useState<string>('ALL');

  // Open Branch Modal & populate form
  const handleOpenBranchModal = (branchToEdit?: Branch) => {
    setShopTradeName(tenant.tradeName);
    setShopLegalName(tenant.legalName);
    if (branchToEdit) {
      setEditingBranchId(branchToEdit.id);
      setBName(branchToEdit.name);
      setBCode(branchToEdit.code);
      setBCity(branchToEdit.city);
      setBAddress(branchToEdit.address);
      setBGstin(branchToEdit.gstin);
      setBPhone(branchToEdit.phone);
      setBManager(branchToEdit.managerName);
      setBIsHq(branchToEdit.isHeadquarters);
    } else {
      setEditingBranchId(null);
      setBName('');
      setBCode(`BR-${Math.floor(10 + Math.random() * 89)}`);
      setBCity('');
      setBAddress('');
      setBGstin(activeBranch.gstin || '27AAACC1234F1Z5');
      setBPhone('');
      setBManager('');
      setBIsHq(false);
    }
    setShowBranchModal(true);
  };

  const handleSaveShopIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopTradeName.trim() || !onUpdateTenant) return;
    onUpdateTenant({
      ...tenant,
      tradeName: shopTradeName.trim(),
      legalName: shopLegalName.trim() || shopTradeName.trim(),
    });
    setBranchSavedMsg(`Updated Shop Name to "${shopTradeName.trim()}".`);
    setTimeout(() => setBranchSavedMsg(null), 3500);
  };

  const handleSaveBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bName.trim() || !bCity.trim()) return;

    const branchRecord: Branch = {
      id: editingBranchId || `BR-${Date.now()}`,
      name: bName.trim(),
      code: bCode.trim().toUpperCase() || `BR-${Date.now().toString().slice(-3)}`,
      city: bCity.trim(),
      address: bAddress.trim() || bCity.trim(),
      gstin: bGstin.trim().toUpperCase() || activeBranch.gstin,
      phone: bPhone.trim() || '+91 98200 00000',
      managerName: bManager.trim() || 'Branch Manager',
      isHeadquarters: bIsHq,
    };

    if (editingBranchId && onUpdateBranch) {
      onUpdateBranch(branchRecord);
      setBranchSavedMsg(`Updated branch "${branchRecord.name}".`);
    } else if (onAddBranch) {
      onAddBranch(branchRecord);
      onSelectBranch(branchRecord);
      setBranchSavedMsg(`Added and connected new branch "${branchRecord.name}".`);
    }

    setEditingBranchId(null);
    setBName('');
    setBCity('');
    setBAddress('');
    setBPhone('');
    setBManager('');
    setTimeout(() => setBranchSavedMsg(null), 3500);
  };

  // Handle Staff PIN Login submission
  const handleVerifyPinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const targetStaff = staffUsers.find((u) => u.id === loginTargetStaffId);
    if (!targetStaff) return;

    if (enteredPin.trim() !== targetStaff.pin) {
      setLoginError(`Incorrect PIN for ${targetStaff.name}. (Demo PIN is ${targetStaff.pin})`);
      return;
    }

    setLoginError(null);
    setEnteredPin('');
    if (onSelectStaff) {
      onSelectStaff(targetStaff);
    }
    onChangeRole(targetStaff.role);

    // If staff member is assigned to a specific branch, automatically connect to that branch
    if (targetStaff.assignedBranchId !== 'ALL') {
      const assignedBranch = branches.find((b) => b.id === targetStaff.assignedBranchId);
      if (assignedBranch) {
        onSelectBranch(assignedBranch);
      }
    }
    setShowLoginModal(false);
  };

  // Handle Add New Staff User
  const handleCreateStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffPin.trim() || !onAddStaff) return;

    const newStaff: StaffUser = {
      id: `USR-${Date.now()}`,
      name: newStaffName.trim(),
      role: newStaffRole,
      pin: newStaffPin.trim(),
      phone: newStaffPhone.trim() || undefined,
      assignedBranchId: newStaffBranchId,
      active: true,
    };

    onAddStaff(newStaff);
    setNewStaffName('');
    setNewStaffPin('');
    setNewStaffPhone('');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
        {/* Top Bar: Brand & System Controls */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Zone 1: Wordmark & Organization */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold tracking-wider">
                AU
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                    AURIC
                  </span>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/40">
                    Jewellery OS
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenBranchModal(activeBranch)}
                  title="Click to edit Shop Name & Branches"
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 truncate max-w-[200px] flex items-center gap-1 text-left"
                >
                  <span>{tenant.tradeName}</span>
                  <Edit3 className="w-2.5 h-2.5 opacity-60 shrink-0" />
                </button>
              </div>
            </div>

            {/* Zone 2: Live Metal Ticker Strip */}
            <div className="hidden lg:flex items-center gap-4 px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs font-mono whitespace-nowrap shrink-0">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-slate-400 dark:text-slate-500 font-sans">Gold 24K:</span>
                <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                  {formatCurrencyINR(metalRates.ratePerGram24K)}/g
                </span>
              </div>
              <div className="h-3 w-px bg-slate-300 dark:bg-slate-700 shrink-0" />
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                <span className="text-slate-400 dark:text-slate-500 font-sans">Gold 22K:</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                  {formatCurrencyINR(metalRates.ratePerGram22K)}/g
                </span>
              </div>
              <div className="h-3 w-px bg-slate-300 dark:bg-slate-700 shrink-0" />
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                <span className="text-slate-400 dark:text-slate-500 font-sans">Silver 999:</span>
                <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                  {formatCurrencyINR(metalRates.ratePerGramSilver999)}/g
                </span>
              </div>
            </div>

            {/* Zone 3: Branch Switcher + Manager, Staff Login + Role, & Theme */}
            <div className="flex items-center gap-2.5">
              {/* Div 1: Branch Selector & Add/Manage Branches Trigger */}
              <div className="relative flex items-center gap-1">
                <Store className="w-4 h-4 text-slate-400 absolute left-2.5 pointer-events-none" />
                <select
                  aria-label="Active Showroom Branch"
                  value={activeBranch.id}
                  onChange={(e) => {
                    if (e.target.value === '__MANAGE_BRANCHES__') {
                      handleOpenBranchModal();
                      return;
                    }
                    const found = branches.find((b) => b.id === e.target.value);
                    if (found) onSelectBranch(found);
                  }}
                  className="pl-8 pr-6 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city})
                    </option>
                  ))}
                  <option value="__MANAGE_BRANCHES__">
                    + Add / Manage Showroom Branches...
                  </option>
                </select>
                <button
                  type="button"
                  onClick={() => handleOpenBranchModal()}
                  title="Add or Manage Showroom Branches"
                  className="p-1.5 text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 rounded-lg border border-amber-200 dark:border-amber-800/60 transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Div 2: Staff Login & Role Switcher */}
              <div className="relative hidden sm:flex items-center gap-1">
                <UserCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-2.5 pointer-events-none" />
                <select
                  aria-label="Current Role"
                  value={currentStaff ? currentStaff.id : userRole}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__MANAGE_STAFF__') {
                      setShowStaffManagerModal(true);
                      return;
                    }
                    if (val === '__LOCK_SESSION__') {
                      setLoginTargetStaffId(currentStaff?.id || staffUsers[0]?.id || '');
                      setEnteredPin('');
                      setLoginError(null);
                      setShowLoginModal(true);
                      return;
                    }
                    const targetStaff = staffUsers.find((u) => u.id === val);
                    if (targetStaff) {
                      setLoginTargetStaffId(targetStaff.id);
                      setEnteredPin('');
                      setLoginError(null);
                      setShowLoginModal(true);
                    } else {
                      onChangeRole(val as StaffRole);
                    }
                  }}
                  className="pl-8 pr-6 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {staffUsers.length > 0 ? (
                    <>
                      {staffUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                      <option value="__MANAGE_STAFF__">
                        ⚙ Manage Staff Logins &amp; PINs...
                      </option>
                      <option value="__LOCK_SESSION__">
                        🔒 Lock / Switch Staff Login...
                      </option>
                    </>
                  ) : (
                    <>
                      <option value="OWNER">Role: Business Owner</option>
                      <option value="MANAGER">Role: Branch Manager</option>
                      <option value="CASHIER">Role: Counter Cashier</option>
                      <option value="ACCOUNTANT">Role: Senior Accountant</option>
                    </>
                  )}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setLoginTargetStaffId(currentStaff?.id || staffUsers[0]?.id || '');
                    setEnteredPin('');
                    setLoginError(null);
                    setShowLoginModal(true);
                  }}
                  title="Staff PIN Login / Lock Screen"
                  className="p-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-50 hover:text-amber-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Dark Mode Toggle */}
              <button
                type="button"
                onClick={onToggleDarkMode}
                aria-label="Toggle Color Theme"
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MODAL 1: Showroom & Multi-Branch Network Manager */}
      {showBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl p-6 space-y-5 my-8 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-600" />
                  Showroom Identity &amp; Connected Branch Network ({branches.length} Branches)
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Customize your Shop Name for live vendor demos, add or edit showroom branches, and see how stock &amp; billing connect across locations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBranchModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {branchSavedMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{branchSavedMsg}</span>
              </div>
            )}

            {/* Section A: Main Jewellery Shop / Brand Name */}
            <form
              onSubmit={handleSaveShopIdentity}
              className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 space-y-2.5"
            >
              <div className="font-bold text-amber-900 dark:text-amber-300">
                1. Main Jewellery Shop / Brand Identity (Shown in Header &amp; Printed Invoices)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                    Shop Display / Trade Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={shopTradeName}
                    onChange={(e) => setShopTradeName(e.target.value)}
                    placeholder="e.g. Shree Ganesh Jewellers"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                    Legal Firm Name
                  </label>
                  <input
                    type="text"
                    value={shopLegalName}
                    onChange={(e) => setShopLegalName(e.target.value)}
                    placeholder="e.g. Ganesh Ornaments Pvt Ltd"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Update Shop Name
                </button>
              </div>
            </form>

            {/* Section B: Connected Branches List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  2. Connected Showroom Branches (How Branches Work Together)
                </span>
                <span className="text-[11px] text-slate-500">
                  Each branch has its own Stock Vault &amp; POS GSTIN while sharing Daily Metal Rates &amp; Party Khata
                </span>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                {branches.map((b) => {
                  const isCurrent = b.id === activeBranch.id;
                  const branchStockCount = articles.filter(
                    (a) => a.branchId === b.id && a.status === 'AVAILABLE'
                  ).length;

                  return (
                    <div
                      key={b.id}
                      className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        isCurrent ? 'bg-amber-50/40 dark:bg-slate-800/70' : 'bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{b.name}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {b.code}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              Active Counter
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {b.city} · GSTIN: {b.gstin} · Mgr: {b.managerName} ·{' '}
                          <strong className="text-amber-600">{branchStockCount} items in stock</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => onSelectBranch(b)}
                            className="px-2.5 py-1 rounded bg-amber-600 text-white font-semibold text-[11px]"
                          >
                            Switch Here
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenBranchModal(b)}
                          className="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          title="Edit Branch"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {branches.length > 1 && onDeleteBranch && (
                          <button
                            type="button"
                            onClick={() => onDeleteBranch(b.id)}
                            className="p-1.5 rounded border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 text-rose-600"
                            title="Remove Branch"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section C: Add or Edit a Branch Form */}
            <form
              onSubmit={handleSaveBranchSubmit}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">
                  {editingBranchId ? 'Edit Selected Showroom Branch' : '3. + Add & Connect a New Showroom Branch'}
                </span>
                {editingBranchId && (
                  <button
                    type="button"
                    onClick={() => handleOpenBranchModal()}
                    className="text-[11px] text-amber-600 font-semibold hover:underline"
                  >
                    + Switch to Add New Branch
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                    Branch / Showroom Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={bName}
                    onChange={(e) => setBName(e.target.value)}
                    placeholder="e.g. Borivali West Showroom"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                    City &amp; State *
                  </label>
                  <input
                    type="text"
                    required
                    value={bCity}
                    onChange={(e) => setBCity(e.target.value)}
                    placeholder="e.g. Mumbai, Maharashtra"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                    Branch Code
                  </label>
                  <input
                    type="text"
                    value={bCode}
                    onChange={(e) => setBCode(e.target.value.toUpperCase())}
                    placeholder="BR-BOR-04"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                    Branch GSTIN
                  </label>
                  <input
                    type="text"
                    value={bGstin}
                    onChange={(e) => setBGstin(e.target.value.toUpperCase())}
                    placeholder="27AAACC1234F1Z5"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                    Branch Manager Name
                  </label>
                  <input
                    type="text"
                    value={bManager}
                    onChange={(e) => setBManager(e.target.value)}
                    placeholder="e.g. Rajesh Soni"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={bAddress}
                    onChange={(e) => setBAddress(e.target.value)}
                    placeholder="Shop 4, MG Road"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {onNavigateTab ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowBranchModal(false);
                      onNavigateTab('INVENTORY');
                    }}
                    className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Transfer Gold/Silver Stock Between Branches</span>
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBranchModal(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs"
                  >
                    {editingBranchId ? 'Save Branch Changes' : '+ Add & Connect Branch'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Staff PIN Login & Session Lock Screen */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                  <KeyRound className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Showroom Staff Login &amp; PIN Lock
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Authenticate staff member &amp; connect to their assigned branch
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleVerifyPinLogin} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Staff Account
                </label>
                <select
                  value={loginTargetStaffId}
                  onChange={(e) => {
                    setLoginTargetStaffId(e.target.value);
                    setLoginError(null);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                >
                  {staffUsers.map((u) => {
                    const bNameFound =
                      u.assignedBranchId === 'ALL'
                        ? 'All Branches'
                        : branches.find((b) => b.id === u.assignedBranchId)?.name || 'Assigned Branch';
                    return (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.role} ({bNameFound})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    4-Digit Security PIN
                  </label>
                  {(() => {
                    const target = staffUsers.find((u) => u.id === loginTargetStaffId);
                    return target ? (
                      <button
                        type="button"
                        onClick={() => setEnteredPin(target.pin)}
                        className="text-[11px] text-amber-600 hover:underline font-mono"
                      >
                        Demo Fill PIN ({target.pin})
                      </button>
                    ) : null;
                  })()}
                </div>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  placeholder="Enter 4-digit PIN..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm tracking-widest text-center"
                />
              </div>

              {loginError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-[11px]">
                  {loginError}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    setShowStaffManagerModal(true);
                  }}
                  className="text-amber-600 dark:text-amber-400 font-semibold hover:underline"
                >
                  + Add / Manage Staff Accounts
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs"
                >
                  Unlock &amp; Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Staff Accounts & Role Permissions Manager */}
      {showStaffManagerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-4 my-8 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-600" />
                  Staff Logins, PINs &amp; Branch Assignment ({staffUsers.length} Users)
                </h2>
                <p className="text-[11px] text-slate-500">
                  Create login PINs for your Owners, Branch Managers, Counter Cashiers, and Accountants.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowStaffManagerModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
              {staffUsers.map((u) => {
                const isLogged = currentStaff?.id === u.id;
                const branchLabel =
                  u.assignedBranchId === 'ALL'
                    ? 'All Connected Branches'
                    : branches.find((b) => b.id === u.assignedBranchId)?.name || 'Branch';

                return (
                  <div
                    key={u.id}
                    className="p-3 flex items-center justify-between bg-white dark:bg-slate-900"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{u.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          {u.role}
                        </span>
                        {isLogged && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Logged In
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Branch: {branchLabel} · Login PIN: <strong>{u.pin}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isLogged && onSelectStaff && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectStaff(u);
                            onChangeRole(u.role);
                            setShowStaffManagerModal(false);
                          }}
                          className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold text-[11px]"
                        >
                          Sign In
                        </button>
                      )}
                      {staffUsers.length > 1 && onDeleteStaff && (
                        <button
                          type="button"
                          onClick={() => onDeleteStaff(u.id)}
                          className="p-1.5 rounded border border-rose-200 text-rose-600 hover:bg-rose-50"
                          title="Remove Staff User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add New Staff Form */}
            <form
              onSubmit={handleCreateStaffSubmit}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3"
            >
              <div className="font-bold text-slate-900 dark:text-white">
                + Add New Staff Login Account
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Staff Name *</label>
                  <input
                    type="text"
                    required
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="e.g. Amit Shah"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Role *</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as StaffRole)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="OWNER">OWNER</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="CASHIER">CASHIER</option>
                    <option value="ACCOUNTANT">ACCOUNTANT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Assigned Branch *</label>
                  <select
                    value={newStaffBranchId}
                    onChange={(e) => setNewStaffBranchId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="ALL">All Branches</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">4-Digit PIN *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={newStaffPin}
                    onChange={(e) => setNewStaffPin(e.target.value)}
                    placeholder="e.g. 5555"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStaffManagerModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  + Create Staff Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
