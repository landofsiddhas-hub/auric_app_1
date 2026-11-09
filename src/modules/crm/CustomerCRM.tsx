import React, { useState } from 'react';
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  Wrench,
  MessageSquare,
  Plus,
  Printer,
  Send,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Hammer,
  Building2,
  Trash2,
  Edit3,
  Scale,
  ArrowUpDown,
  Package,
  AlertCircle,
} from 'lucide-react';
import {
  Customer,
  Karigar,
  Supplier,
  SalesInvoice,
  RepairOrder,
  GirviPledge,
  GoldChitScheme,
  Branch,
  Article,
  PurchaseInvoice,
} from '../../core/types';
import { formatCurrencyINR, formatWeightGrams, roundDecimals } from '../../core/math';

export type PartyRoleFilter = 'ALL' | 'CUSTOMER' | 'KARIGAR' | 'SUPPLIER';
export type PartyRole = 'CUSTOMER' | 'KARIGAR' | 'SUPPLIER';

interface CustomerCRMProps {
  customers: Customer[];
  karigars?: Karigar[];
  suppliers?: Supplier[];
  articles?: Article[];
  purchases?: PurchaseInvoice[];
  invoices: SalesInvoice[];
  repairs: RepairOrder[];
  pledges: GirviPledge[];
  schemes: GoldChitScheme[];
  activeBranch: Branch;
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer?: (customer: Customer) => void;
  onDeleteCustomer?: (customerId: string) => void;
  onAddKarigar?: (karigar: Karigar) => void;
  onUpdateKarigar?: (karigar: Karigar) => void;
  onDeleteKarigar?: (karigarId: string) => void;
  onAddSupplier?: (supplier: Supplier) => void;
  onUpdateSupplier?: (supplier: Supplier) => void;
  onDeleteSupplier?: (supplierId: string) => void;
  onSelectInvoiceForPrint?: (invoice: SalesInvoice) => void;
}

interface UnifiedPartyItem {
  id: string;
  role: PartyRole;
  name: string;
  subName?: string;
  phone: string;
  city: string;
  panNumber?: string;
  gstin?: string;
  cashBalanceINR: number;
  advanceCashINR: number;
  goldFineGrams: number;
  silverFineGrams: number;
  rawCustomer?: Customer;
  rawKarigar?: Karigar;
  rawSupplier?: Supplier;
}

export const CustomerCRM: React.FC<CustomerCRMProps> = ({
  customers,
  karigars = [],
  suppliers = [],
  articles = [],
  purchases = [],
  invoices,
  repairs,
  activeBranch,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onAddKarigar,
  onUpdateKarigar,
  onDeleteKarigar,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onSelectInvoiceForPrint,
}) => {
  const [roleFilter, setRoleFilter] = useState<PartyRoleFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartyKey, setSelectedPartyKey] = useState<string>(
    customers[0] ? `CUSTOMER:${customers[0].id}` : karigars[0] ? `KARIGAR:${karigars[0].id}` : ''
  );

  // Sub-tabs when viewing a Customer dossier
  const [activeCustomerTab, setActiveCustomerTab] = useState<'INVOICES' | 'REPAIRS' | 'WHATSAPP'>('INVOICES');

  // Add / Edit Party Modal state
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [editingPartyKey, setEditingPartyKey] = useState<string | null>(null);
  const [formRole, setFormRole] = useState<PartyRole>('CUSTOMER');
  const [formName, setFormName] = useState('');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCity, setFormCity] = useState('Mumbai, Maharashtra');
  const [formAddress, setFormAddress] = useState('');
  const [formPan, setFormPan] = useState('');
  const [formGstin, setFormGstin] = useState('');
  const [formSpecialty, setFormSpecialty] = useState('22K Gold Ornaments & Payal');
  const [formDefaultWastage, setFormDefaultWastage] = useState<number>(2.5);
  const [formDefaultMajuri, setFormDefaultMajuri] = useState<number>(350);
  const [formCashBalance, setFormCashBalance] = useState<number>(0);
  const [formAdvanceCash, setFormAdvanceCash] = useState<number>(0);
  const [formGoldFineGrams, setFormGoldFineGrams] = useState<number>(0);
  const [formSilverFineGrams, setFormSilverFineGrams] = useState<number>(0);

  // Jama / Naam Settlement Drawer State
  const [showSettlementPanel, setShowSettlementPanel] = useState(false);
  const [settleType, setSettleType] = useState<'JAMA_RECEIVED' | 'NAAM_GIVEN'>('JAMA_RECEIVED');
  const [settleCashINR, setSettleCashINR] = useState<number>(0);
  const [settleGoldGrams, setSettleGoldGrams] = useState<number>(0);
  const [settleSilverGrams, setSettleSilverGrams] = useState<number>(0);
  const [settleNote, setSettleNote] = useState('');
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Delete confirmation state
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);

  // WhatsApp simulation state
  const [simulatedTemplate, setSimulatedTemplate] = useState<'INVOICE' | 'REPAIR_READY'>('INVOICE');

  // Build unified party list across Customers, Karigars, and Suppliers
  const unifiedParties: UnifiedPartyItem[] = [
    ...customers.map((c): UnifiedPartyItem => ({
      id: c.id,
      role: 'CUSTOMER',
      name: c.name,
      subName: c.email,
      phone: c.phone,
      city: c.city || 'Local Showroom',
      panNumber: c.panNumber,
      gstin: c.gstin,
      cashBalanceINR: c.outstandingBalance || 0,
      advanceCashINR: c.advanceBalance || 0,
      goldFineGrams: c.goldFineBalanceGrams || 0,
      silverFineGrams: c.silverFineBalanceGrams || 0,
      rawCustomer: c,
    })),
    ...karigars.map((k): UnifiedPartyItem => ({
      id: k.id,
      role: 'KARIGAR',
      name: k.name,
      subName: k.specialization,
      phone: k.phone,
      city: k.city || 'Workshop',
      panNumber: k.panNumber,
      gstin: k.gstin,
      cashBalanceINR: k.labourPayableAmount || 0,
      advanceCashINR: 0,
      goldFineGrams: k.goldBalanceGrams || 0,
      silverFineGrams: k.silverBalanceGrams || 0,
      rawKarigar: k,
    })),
    ...suppliers.map((s): UnifiedPartyItem => ({
      id: s.id,
      role: 'SUPPLIER',
      name: s.name,
      subName: `${s.tradeName} · ${s.category.replace(/_/g, ' ')}`,
      phone: s.phone,
      city: s.city,
      panNumber: s.panNumber,
      gstin: s.gstin,
      cashBalanceINR: s.fiatPayableAmount || 0,
      advanceCashINR: 0,
      goldFineGrams: s.fineGoldBalanceGrams || 0,
      silverFineGrams: s.fineSilverBalanceGrams || 0,
      rawSupplier: s,
    })),
  ];

  // Filtered party list
  const filteredParties = unifiedParties.filter((p) => {
    const matchesRole = roleFilter === 'ALL' || p.role === roleFilter;
    if (!matchesRole) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.phone.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      (p.subName && p.subName.toLowerCase().includes(q)) ||
      (p.panNumber && p.panNumber.toLowerCase().includes(q)) ||
      (p.gstin && p.gstin.toLowerCase().includes(q))
    );
  });

  // Resolve currently selected party
  const selectedParty =
    unifiedParties.find((p) => `${p.role}:${p.id}` === selectedPartyKey) ||
    filteredParties[0] ||
    unifiedParties[0];

  // Aggregate Triple-Balance Summary across currently filtered parties
  const totalCashBalanceINR = roundDecimals(
    filteredParties.reduce((acc, p) => acc + p.cashBalanceINR, 0),
    2
  );
  const totalGoldFineGrams = roundDecimals(
    filteredParties.reduce((acc, p) => acc + p.goldFineGrams, 0),
    3
  );
  const totalSilverFineGrams = roundDecimals(
    filteredParties.reduce((acc, p) => acc + p.silverFineGrams, 0),
    3
  );

  // Open modal to add a new party
  const handleOpenAddModal = (defaultRole: PartyRole = roleFilter === 'ALL' ? 'CUSTOMER' : roleFilter) => {
    setEditingPartyKey(null);
    setFormRole(defaultRole);
    setFormName('');
    setFormContactPerson('');
    setFormPhone('');
    setFormEmail('');
    setFormCity('Mumbai, Maharashtra');
    setFormAddress('');
    setFormPan('');
    setFormGstin('');
    setFormSpecialty('22K Gold Ornaments & Silver Payal');
    setFormDefaultWastage(2.5);
    setFormDefaultMajuri(350);
    setFormCashBalance(0);
    setFormAdvanceCash(0);
    setFormGoldFineGrams(0);
    setFormSilverFineGrams(0);
    setShowPartyModal(true);
  };

  // Open modal to edit existing party
  const handleOpenEditModal = (party: UnifiedPartyItem) => {
    setEditingPartyKey(`${party.role}:${party.id}`);
    setFormRole(party.role);
    setFormName(party.name);
    setFormPhone(party.phone);
    setFormCity(party.city);
    setFormPan(party.panNumber || '');
    setFormGstin(party.gstin || '');
    setFormCashBalance(party.cashBalanceINR);
    setFormAdvanceCash(party.advanceCashINR);
    setFormGoldFineGrams(party.goldFineGrams);
    setFormSilverFineGrams(party.silverFineGrams);

    if (party.role === 'CUSTOMER' && party.rawCustomer) {
      setFormEmail(party.rawCustomer.email || '');
      setFormAddress(party.rawCustomer.address || '');
    } else if (party.role === 'KARIGAR' && party.rawKarigar) {
      setFormSpecialty(party.rawKarigar.specialization || '');
      setFormDefaultWastage(party.rawKarigar.defaultWastagePercent ?? 2.5);
      setFormDefaultMajuri(party.rawKarigar.defaultMajuriPerGram ?? 350);
    } else if (party.role === 'SUPPLIER' && party.rawSupplier) {
      setFormContactPerson(party.rawSupplier.tradeName || '');
    }

    setShowPartyModal(true);
  };

  // Save new or edited party
  const handleSavePartySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) return;

    if (formRole === 'CUSTOMER') {
      const existing = editingPartyKey ? customers.find((c) => `CUSTOMER:${c.id}` === editingPartyKey) : undefined;
      const custRecord: Customer = {
        id: existing ? existing.id : `CUST-${Date.now()}`,
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim() || undefined,
        panNumber: formPan.trim().toUpperCase() || undefined,
        gstin: formGstin.trim().toUpperCase() || undefined,
        address: formAddress.trim() || 'Showroom Walk-in',
        city: formCity.trim() || 'Local',
        loyaltyPoints: existing ? existing.loyaltyPoints : 100,
        outstandingBalance: Number(formCashBalance) || 0,
        advanceBalance: Number(formAdvanceCash) || 0,
        goldFineBalanceGrams: Number(formGoldFineGrams) || 0,
        silverFineBalanceGrams: Number(formSilverFineGrams) || 0,
        createdAt: existing ? existing.createdAt : new Date().toISOString(),
      };

      if (existing && onUpdateCustomer) {
        onUpdateCustomer(custRecord);
        setStatusBanner(`Updated Customer Khata for ${custRecord.name}.`);
      } else {
        onAddCustomer(custRecord);
        setStatusBanner(`Added Customer ${custRecord.name} to Party & Khata Ledger.`);
      }
      setSelectedPartyKey(`CUSTOMER:${custRecord.id}`);
    } else if (formRole === 'KARIGAR') {
      const existing = editingPartyKey ? karigars.find((k) => `KARIGAR:${k.id}` === editingPartyKey) : undefined;
      const karigarRecord: Karigar = {
        id: existing ? existing.id : `KAR-${Date.now()}`,
        name: formName.trim(),
        phone: formPhone.trim(),
        city: formCity.trim() || 'Workshop',
        panNumber: formPan.trim().toUpperCase() || undefined,
        gstin: formGstin.trim().toUpperCase() || undefined,
        specialization: formSpecialty.trim() || '22K Gold & Silver Ornaments',
        defaultWastagePercent: Number(formDefaultWastage) || 2.5,
        defaultMajuriPerGram: Number(formDefaultMajuri) || 0,
        goldBalanceGrams: Number(formGoldFineGrams) || 0,
        silverBalanceGrams: Number(formSilverFineGrams) || 0,
        labourPayableAmount: Number(formCashBalance) || 0,
        pendingJobsCount: existing ? existing.pendingJobsCount : 0,
      };

      if (existing && onUpdateKarigar) {
        onUpdateKarigar(karigarRecord);
        setStatusBanner(`Updated Karigar Hisab profile for ${karigarRecord.name}.`);
      } else if (onAddKarigar) {
        onAddKarigar(karigarRecord);
        setStatusBanner(`Added Karigar ${karigarRecord.name} to Party & Khata Ledger.`);
      }
      setSelectedPartyKey(`KARIGAR:${karigarRecord.id}`);
    } else if (formRole === 'SUPPLIER') {
      const existing = editingPartyKey ? suppliers.find((s) => `SUPPLIER:${s.id}` === editingPartyKey) : undefined;
      const supplierRecord: Supplier = {
        id: existing ? existing.id : `SUP-${Date.now()}`,
        name: formName.trim(),
        tradeName: formContactPerson.trim() || formName.trim(),
        gstin: formGstin.trim().toUpperCase() || 'UNREGISTERED',
        panNumber: formPan.trim().toUpperCase() || undefined,
        phone: formPhone.trim(),
        city: formCity.trim() || 'Bullion Market',
        category: existing ? existing.category : 'BULLION_DEALER',
        fineGoldBalanceGrams: Number(formGoldFineGrams) || 0,
        fineSilverBalanceGrams: Number(formSilverFineGrams) || 0,
        fiatPayableAmount: Number(formCashBalance) || 0,
      };

      if (existing && onUpdateSupplier) {
        onUpdateSupplier(supplierRecord);
        setStatusBanner(`Updated Supplier Khata for ${supplierRecord.name}.`);
      } else if (onAddSupplier) {
        onAddSupplier(supplierRecord);
        setStatusBanner(`Added Supplier / Vyapari ${supplierRecord.name} to Party & Khata Ledger.`);
      }
      setSelectedPartyKey(`SUPPLIER:${supplierRecord.id}`);
    }

    setShowPartyModal(false);
    setTimeout(() => setStatusBanner(null), 4000);
  };

  // Delete / Remove Party handler
  const handleConfirmDeleteParty = (party: UnifiedPartyItem) => {
    if (party.role === 'CUSTOMER' && onDeleteCustomer) {
      onDeleteCustomer(party.id);
    } else if (party.role === 'KARIGAR' && onDeleteKarigar) {
      onDeleteKarigar(party.id);
    } else if (party.role === 'SUPPLIER' && onDeleteSupplier) {
      onDeleteSupplier(party.id);
    }
    setConfirmDeleteKey(null);
    setStatusBanner(`Removed ${party.name} (${party.role}) from Party & Khata Ledger.`);
    setTimeout(() => setStatusBanner(null), 4000);
  };

  // Record Jama / Naam Settlement on selected Party
  const handlePostSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParty) return;

    // Direction: JAMA_RECEIVED reduces balance owed (or increases advance); NAAM_GIVEN increases balance
    const multiplier = settleType === 'JAMA_RECEIVED' ? -1 : 1;
    const deltaCash = roundDecimals((Number(settleCashINR) || 0) * multiplier, 2);
    const deltaGold = roundDecimals((Number(settleGoldGrams) || 0) * multiplier, 3);
    const deltaSilver = roundDecimals((Number(settleSilverGrams) || 0) * multiplier, 3);

    if (selectedParty.role === 'CUSTOMER' && selectedParty.rawCustomer && onUpdateCustomer) {
      const c = selectedParty.rawCustomer;
      onUpdateCustomer({
        ...c,
        outstandingBalance: Math.max(0, roundDecimals((c.outstandingBalance || 0) + deltaCash, 2)),
        goldFineBalanceGrams: roundDecimals((c.goldFineBalanceGrams || 0) + deltaGold, 3),
        silverFineBalanceGrams: roundDecimals((c.silverFineBalanceGrams || 0) + deltaSilver, 3),
      });
    } else if (selectedParty.role === 'KARIGAR' && selectedParty.rawKarigar && onUpdateKarigar) {
      const k = selectedParty.rawKarigar;
      onUpdateKarigar({
        ...k,
        labourPayableAmount: roundDecimals((k.labourPayableAmount || 0) + deltaCash, 2),
        goldBalanceGrams: roundDecimals((k.goldBalanceGrams || 0) + deltaGold, 3),
        silverBalanceGrams: roundDecimals((k.silverBalanceGrams || 0) + deltaSilver, 3),
      });
    } else if (selectedParty.role === 'SUPPLIER' && selectedParty.rawSupplier && onUpdateSupplier) {
      const s = selectedParty.rawSupplier;
      onUpdateSupplier({
        ...s,
        fiatPayableAmount: roundDecimals((s.fiatPayableAmount || 0) + deltaCash, 2),
        fineGoldBalanceGrams: roundDecimals((s.fineGoldBalanceGrams || 0) + deltaGold, 3),
        fineSilverBalanceGrams: roundDecimals((s.fineSilverBalanceGrams || 0) + deltaSilver, 3),
      });
    }

    setStatusBanner(
      `Recorded ${settleType === 'JAMA_RECEIVED' ? 'Jama (Received/Settled)' : 'Naam (Issued/Debit)'} entry for ${selectedParty.name}${settleNote ? ` — ${settleNote}` : ''}.`
    );
    setSettleCashINR(0);
    setSettleGoldGrams(0);
    setSettleSilverGrams(0);
    setSettleNote('');
    setShowSettlementPanel(false);
    setTimeout(() => setStatusBanner(null), 4000);
  };

  // Related records for currently selected party
  const customerInvoices =
    selectedParty?.role === 'CUSTOMER'
      ? invoices.filter((i) => i.customerId === selectedParty.id)
      : [];
  const customerRepairs =
    selectedParty?.role === 'CUSTOMER'
      ? repairs.filter((r) => r.customerId === selectedParty.id)
      : [];
  const karigarArticles =
    selectedParty?.role === 'KARIGAR'
      ? articles.filter(
          (a) =>
            a.karigarId === selectedParty.id ||
            (a.labourDetails?.labourName &&
              a.labourDetails.labourName.toLowerCase() === selectedParty.name.toLowerCase())
        )
      : [];
  const supplierPurchases =
    selectedParty?.role === 'SUPPLIER'
      ? purchases.filter(
          (p) =>
            p.supplierId === selectedParty.id ||
            p.supplierName.toLowerCase() === selectedParty.name.toLowerCase()
        )
      : [];

  return (
    <div className="space-y-5">
      {/* Top Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              Unified Party &amp; Khata Master Ledger (ग्राहक, कारीगर एवं व्यापारी खाता)
            </h1>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Single Bahi-Khata directory to easily add, edit, settle Jama/Naam, or remove Customers (Grahak), Karigars (Artisans), and Bullion Suppliers (Vyapari) with Triple-Column Balances (Cash ₹ · Fine Gold g · Fine Silver g).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleOpenAddModal('CUSTOMER')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs transition-colors text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Party (Customer / Karigar / Supplier)</span>
          </button>
        </div>
      </div>

      {/* Status Notification Banner */}
      {statusBanner && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{statusBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-xs font-bold opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Role Filter Tabs + Triple-Balance Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Role Filter Pills (6 cols) */}
        <div className="lg:col-span-6 flex flex-wrap items-center gap-1.5 bg-white dark:bg-neutral-900 p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
          {[
            { id: 'ALL', label: `All Parties (${unifiedParties.length})`, icon: Users },
            { id: 'CUSTOMER', label: `Customers (${customers.length})`, icon: Users },
            { id: 'KARIGAR', label: `Karigars (${karigars.length})`, icon: Hammer },
            { id: 'SUPPLIER', label: `Suppliers (${suppliers.length})`, icon: Building2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = roleFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id as PartyRoleFilter)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Triple-Balance Summary Strip (6 cols) */}
        <div className="lg:col-span-6 grid grid-cols-3 gap-2.5">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block">
              Cash Khata Balance (₹)
            </span>
            <span className="text-sm font-bold font-mono text-neutral-900 dark:text-white">
              {formatCurrencyINR(totalCashBalanceINR)}
            </span>
          </div>
          <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 rounded-xl p-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
              Fine Gold Balance (Au)
            </span>
            <span className="text-sm font-bold font-mono text-amber-700 dark:text-amber-300">
              {formatWeightGrams(totalGoldFineGrams)}
            </span>
          </div>
          <div className="bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
              Fine Silver Balance (Ag)
            </span>
            <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
              {formatWeightGrams(totalSilverFineGrams)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Grid: Left Party Directory (4 cols) + Right Party Dossier (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Unified Party Directory */}
        <div className="lg:col-span-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs flex flex-col">
          <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search party by name, mobile, city, PAN, GSTIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>

          <div className="divide-y divide-neutral-200 dark:divide-neutral-800 max-h-[640px] overflow-y-auto">
            {filteredParties.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-500">
                No matching parties found in this category.
              </div>
            ) : (
              filteredParties.map((party) => {
                const partyKey = `${party.role}:${party.id}`;
                const isSelected = selectedParty && `${selectedParty.role}:${selectedParty.id}` === partyKey;

                return (
                  <button
                    key={partyKey}
                    type="button"
                    onClick={() => {
                      setSelectedPartyKey(partyKey);
                      setShowSettlementPanel(false);
                      setConfirmDeleteKey(null);
                    }}
                    className={`w-full p-3.5 text-left transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 border-l-4 border-amber-600 dark:bg-amber-500/15'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            party.role === 'CUSTOMER'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : party.role === 'KARIGAR'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}
                        >
                          {party.role}
                        </span>
                        <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                          {party.name}
                        </span>
                      </div>

                      <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                        {party.phone} · {party.city}
                      </div>

                      {/* Triple-Balance Micro Strip */}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          ₹: {formatCurrencyINR(party.cashBalanceINR)}
                        </span>
                        {party.goldFineGrams !== 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                            Au: {party.goldFineGrams}g
                          </span>
                        )}
                        {party.silverFineGrams !== 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            Ag: {party.silverFineGrams}g
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-amber-600' : 'text-neutral-300 dark:text-neutral-600'
                      }`}
                    />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Party Dossier & Khata Actions */}
        {selectedParty ? (
          <div className="lg:col-span-8 space-y-5">
            {/* Party Profile & Action Card */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        selectedParty.role === 'CUSTOMER'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : selectedParty.role === 'KARIGAR'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}
                    >
                      {selectedParty.role === 'CUSTOMER'
                        ? 'Customer (ग्राहक)'
                        : selectedParty.role === 'KARIGAR'
                        ? 'Karigar / Artisan (कारीगर)'
                        : 'Bullion Supplier (व्यापारी)'}
                    </span>
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                      {selectedParty.name}
                    </h2>
                  </div>

                  {selectedParty.subName && (
                    <div className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-0.5">
                      {selectedParty.subName}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 mt-1.5">
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3.5 h-3.5 text-neutral-400" />
                      {selectedParty.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                      {selectedParty.city}
                    </span>
                    {selectedParty.panNumber && (
                      <span className="font-mono text-[11px] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                        PAN: {selectedParty.panNumber}
                      </span>
                    )}
                    {selectedParty.gstin && (
                      <span className="font-mono text-[11px] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                        GSTIN: {selectedParty.gstin}
                      </span>
                    )}
                  </div>
                </div>

                {/* Party Action Buttons: Settle Jama/Naam, Edit, Delete/Remove */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSettlementPanel(!showSettlementPanel)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span>Jama / Naam Hisab</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(selectedParty)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-medium"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  {confirmDeleteKey === `${selectedParty.role}:${selectedParty.id}` ? (
                    <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 px-2 py-1 rounded-lg">
                      <span className="text-[11px] text-rose-700 dark:text-rose-300 font-semibold">
                        Confirm Remove?
                      </span>
                      <button
                        type="button"
                        onClick={() => handleConfirmDeleteParty(selectedParty)}
                        className="px-2 py-0.5 bg-rose-600 text-white rounded text-[11px] font-bold"
                      >
                        Yes, Remove
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteKey(null)}
                        className="px-1.5 py-0.5 text-neutral-500 text-[11px]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteKey(`${selectedParty.role}:${selectedParty.id}`)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Triple-Balance Account Strip (Cash ₹, Fine Gold g, Fine Silver g, & Role Meta) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-800">
                  <span className="text-neutral-500 block text-[11px]">
                    {selectedParty.role === 'CUSTOMER'
                      ? 'Cash Due (Receivable)'
                      : selectedParty.role === 'KARIGAR'
                      ? 'Cash Majuri Payable'
                      : 'Cash Payable (Vyapari)'}
                  </span>
                  <strong className="font-mono text-sm text-rose-600 dark:text-rose-400">
                    {formatCurrencyINR(selectedParty.cashBalanceINR)}
                  </strong>
                  {selectedParty.role === 'CUSTOMER' && selectedParty.advanceCashINR > 0 && (
                    <span className="block text-[10px] font-mono text-emerald-600 mt-0.5">
                      Advance: {formatCurrencyINR(selectedParty.advanceCashINR)}
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40">
                  <span className="text-amber-800 dark:text-amber-300 block text-[11px]">
                    Fine Gold Balance (999)
                  </span>
                  <strong className="font-mono text-sm text-amber-700 dark:text-amber-400">
                    {formatWeightGrams(selectedParty.goldFineGrams)}
                  </strong>
                  <span className="block text-[10px] text-amber-600/80">
                    {selectedParty.goldFineGrams > 0 ? 'Fine Gold Due / Custody' : 'Settled (0.000g)'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400 block text-[11px]">
                    Fine Silver Balance (999)
                  </span>
                  <strong className="font-mono text-sm text-slate-800 dark:text-slate-200">
                    {formatWeightGrams(selectedParty.silverFineGrams)}
                  </strong>
                  <span className="block text-[10px] text-slate-500">
                    {selectedParty.silverFineGrams > 0 ? 'Fine Silver Due / Custody' : 'Settled (0.000g)'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-800">
                  {selectedParty.role === 'KARIGAR' && selectedParty.rawKarigar ? (
                    <>
                      <span className="text-neutral-500 block text-[11px]">Agreed Wastage / Rate</span>
                      <strong className="font-mono text-sm text-neutral-900 dark:text-white">
                        {selectedParty.rawKarigar.defaultWastagePercent ?? 2.0}% Wastage
                      </strong>
                      <span className="block text-[10px] font-mono text-neutral-500">
                        Default Majuri: ₹{selectedParty.rawKarigar.defaultMajuriPerGram ?? 350}/g
                      </span>
                    </>
                  ) : selectedParty.role === 'SUPPLIER' && selectedParty.rawSupplier ? (
                    <>
                      <span className="text-neutral-500 block text-[11px]">Trade Name</span>
                      <strong className="text-sm text-neutral-900 dark:text-white truncate block">
                        {selectedParty.rawSupplier.tradeName}
                      </strong>
                      <span className="block text-[10px] font-mono text-neutral-500">
                        {selectedParty.rawSupplier.category.replace(/_/g, ' ')}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-neutral-500 block text-[11px]">Customer Loyalty</span>
                      <strong className="font-mono text-sm text-amber-600 dark:text-amber-400">
                        {selectedParty.rawCustomer?.loyaltyPoints || 100} pts
                      </strong>
                      <span className="block text-[10px] text-neutral-500">
                        {customerInvoices.length} Retail Bills
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Collapsible Jama / Naam Settlement Form */}
              {showSettlementPanel && (
                <form
                  onSubmit={handlePostSettlement}
                  className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-300 dark:border-amber-800/70 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-amber-600" />
                      Record Jama / Naam Entry for {selectedParty.name}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowSettlementPanel(false)}
                      className="text-xs text-neutral-500 hover:text-neutral-800"
                    >
                      Close ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
                    <div>
                      <label className="block text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                        Entry Type
                      </label>
                      <select
                        value={settleType}
                        onChange={(e) => setSettleType(e.target.value as 'JAMA_RECEIVED' | 'NAAM_GIVEN')}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-neutral-900 font-semibold"
                      >
                        <option value="JAMA_RECEIVED">Jama (Paid / Settled -)</option>
                        <option value="NAAM_GIVEN">Naam (New Due / Issued +)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                        Cash Amount (₹)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={settleCashINR || ''}
                        onChange={(e) => setSettleCashINR(Number(e.target.value) || 0)}
                        placeholder="₹0"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                        Fine Gold (g)
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={settleGoldGrams || ''}
                        onChange={(e) => setSettleGoldGrams(Number(e.target.value) || 0)}
                        placeholder="0.000g"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                        Fine Silver (g)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={settleSilverGrams || ''}
                        onChange={(e) => setSettleSilverGrams(Number(e.target.value) || 0)}
                        placeholder="0.00g"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                        Remark / Voucher Note
                      </label>
                      <input
                        type="text"
                        value={settleNote}
                        onChange={(e) => setSettleNote(e.target.value)}
                        placeholder="e.g. Fine bar given / RTGS"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                    >
                      Post Khata Entry
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Role-Specific Dossier Content */}
            {selectedParty.role === 'CUSTOMER' && (
              <>
                <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto">
                  {[
                    { id: 'INVOICES', label: `Retail Bills (${customerInvoices.length})`, icon: FileText },
                    { id: 'REPAIRS', label: `Repairs (${customerRepairs.length})`, icon: Wrench },
                    { id: 'WHATSAPP', label: 'WhatsApp Alerts', icon: MessageSquare },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeCustomerTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveCustomerTab(tab.id as any)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                          isActive
                            ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                            : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
                  {activeCustomerTab === 'INVOICES' && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                        Sales Invoices &amp; Ornaments Purchased
                      </h3>
                      {customerInvoices.length === 0 ? (
                        <div className="p-6 text-center text-xs text-neutral-500">
                          No sales invoices recorded yet for this customer.
                        </div>
                      ) : (
                        <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                          {customerInvoices.map((inv) => (
                            <div key={inv.id} className="py-3.5 space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-mono font-bold text-sm text-neutral-900 dark:text-neutral-100">
                                    {inv.invoiceNumber}
                                  </span>
                                  <span className="text-xs text-neutral-500 ml-2">
                                    {new Date(inv.createdAt).toLocaleDateString('en-IN')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-neutral-900 dark:text-neutral-100 font-mono">
                                    {formatCurrencyINR(inv.grandTotal)}
                                  </span>
                                  {onSelectInvoiceForPrint && (
                                    <button
                                      type="button"
                                      onClick={() => onSelectInvoiceForPrint(inv)}
                                      className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded"
                                      title="Reprint Invoice"
                                    >
                                      <Printer className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-lg space-y-1">
                                {inv.items.map((item, i) => (
                                  <div key={i} className="flex justify-between text-xs">
                                    <span>
                                      {item.title} ({item.purity} · {item.tounchPercent}% Tunch)
                                    </span>
                                    <span className="font-mono">
                                      {formatWeightGrams(item.netWeight)} · {formatCurrencyINR(item.totalPrice)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeCustomerTab === 'REPAIRS' && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                        Repair Orders
                      </h3>
                      {customerRepairs.length === 0 ? (
                        <div className="p-6 text-center text-xs text-neutral-500">
                          No repair tickets recorded for this customer.
                        </div>
                      ) : (
                        <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                          {customerRepairs.map((rep) => (
                            <div key={rep.id} className="py-3 flex items-center justify-between text-xs">
                              <div>
                                <div className="font-mono font-bold">{rep.repairNumber} — {rep.articleDescription}</div>
                                <div className="text-neutral-500">
                                  Wt: {formatWeightGrams(rep.customerArticleGrossWeight)} · Promised: {rep.promisedDate}
                                </div>
                              </div>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                                {rep.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeCustomerTab === 'WHATSAPP' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                          WhatsApp Customer Dispatch
                        </h3>
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verified Template
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {[
                          { id: 'INVOICE', label: 'Tax Bill PDF Link' },
                          { id: 'REPAIR_READY', label: 'Repair Ready Alert' },
                        ].map((tpl) => (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => setSimulatedTemplate(tpl.id as any)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
                              simulatedTemplate === tpl.id
                                ? 'border-emerald-600 bg-emerald-500/10 text-emerald-700'
                                : 'border-neutral-200 text-neutral-600'
                            }`}
                          >
                            {tpl.label}
                          </button>
                        ))}
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 p-4 rounded-xl space-y-3 text-xs">
                        <p className="text-neutral-700 dark:text-neutral-200">
                          {simulatedTemplate === 'INVOICE'
                            ? `Namaste ${selectedParty.name}! Thank you for shopping at ${activeBranch.name}. Your GST Invoice is ready.`
                            : `Namaste ${selectedParty.name}! Your ornament repair is complete and ready for collection at ${activeBranch.name}.`}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setStatusBanner(`WhatsApp message dispatched to ${selectedParty.phone}.`);
                            setTimeout(() => setStatusBanner(null), 3500);
                          }}
                          className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send WhatsApp Message</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {selectedParty.role === 'KARIGAR' && (
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-amber-600" />
                    Stock Items Crafted by {selectedParty.name} ({karigarArticles.length} items)
                  </h3>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    Tunch + Wastage % = Payable Fine Grams
                  </span>
                </div>

                {karigarArticles.length === 0 ? (
                  <div className="p-6 text-center text-xs text-neutral-500">
                    No stock ornaments currently linked to this Karigar. When adding Gold/Silver stock, select {selectedParty.name} in Section 4 (Karigar Hisab).
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-mono">
                          <th className="py-2 px-2">Tag / Ornament</th>
                          <th className="py-2 px-2 text-right">Net Wt</th>
                          <th className="py-2 px-2 text-right">Item Tunch</th>
                          <th className="py-2 px-2 text-right">Wastage</th>
                          <th className="py-2 px-2 text-right">Fine Payable</th>
                          <th className="py-2 px-2 text-right">Cash Majuri</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono">
                        {karigarArticles.map((art) => {
                          const tunch = art.tounchPercent ?? roundDecimals(art.fineness / 10, 2);
                          const wst = art.labourDetails?.wastagePercent ?? art.wastagePercent;
                          const finePayable =
                            art.labourDetails?.fineMetalPayableGrams ??
                            roundDecimals((art.netWeightGrams * (tunch + wst)) / 100, 3);
                          return (
                            <tr key={art.id}>
                              <td className="py-2 px-2 font-sans">
                                <div className="font-semibold text-neutral-900 dark:text-white">
                                  {art.title}
                                </div>
                                <div className="text-[10px] font-mono text-amber-600">
                                  {art.tagId} · {art.metal} ({art.status})
                                </div>
                              </td>
                              <td className="py-2 px-2 text-right">{formatWeightGrams(art.netWeightGrams)}</td>
                              <td className="py-2 px-2 text-right">{tunch}%</td>
                              <td className="py-2 px-2 text-right">{wst}%</td>
                              <td className="py-2 px-2 text-right font-bold text-amber-600">
                                {formatWeightGrams(finePayable)}
                              </td>
                              <td className="py-2 px-2 text-right">
                                {formatCurrencyINR(art.labourDetails?.computedLabourCostINR || 0)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {selectedParty.role === 'SUPPLIER' && (
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                  Bullion &amp; Wholesale Purchases from {selectedParty.name} ({supplierPurchases.length})
                </h3>
                {supplierPurchases.length === 0 ? (
                  <div className="p-6 text-center text-xs text-neutral-500">
                    No bullion purchase vouchers recorded yet for this supplier.
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-200 dark:divide-neutral-800 text-xs">
                    {supplierPurchases.map((pur) => (
                      <div key={pur.id} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="font-mono font-bold text-neutral-900 dark:text-white">
                            {pur.purchaseInvoiceNumber}
                          </div>
                          <div className="text-neutral-500 font-mono">
                            Gross: {formatWeightGrams(pur.totalGrossWeightGrams)} · Fine: {formatWeightGrams(pur.totalFineWeightGrams)}
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="font-bold text-neutral-900 dark:text-white">
                            {formatCurrencyINR(pur.grandTotal)}
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                            {pur.paymentStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Unified Add / Edit Party Modal (Customer, Karigar, or Supplier) */}
      {showPartyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3 border-neutral-200 dark:border-neutral-800">
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                {editingPartyKey ? 'Edit Party & Khata Profile' : 'Add Party to Unified Khata Ledger'}
              </h2>
              <button
                type="button"
                onClick={() => setShowPartyModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePartySubmit} className="space-y-3.5 text-xs">
              {/* Role Selection Pills */}
              {!editingPartyKey && (
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Select Party Type (खाता प्रकार) *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'CUSTOMER', label: 'Customer (ग्राहक)', icon: Users },
                      { id: 'KARIGAR', label: 'Karigar (कारीगर)', icon: Hammer },
                      { id: 'SUPPLIER', label: 'Supplier (व्यापारी)', icon: Building2 },
                    ].map((r) => {
                      const Icon = r.icon;
                      const active = formRole === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setFormRole(r.id as PartyRole)}
                          className={`p-2.5 rounded-xl border font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                            active
                              ? 'border-amber-600 bg-amber-500/10 text-amber-800 dark:text-amber-300'
                              : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{r.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    {formRole === 'SUPPLIER'
                      ? 'Bullion / Wholesale Firm Name *'
                      : formRole === 'KARIGAR'
                      ? 'Karigar / Artisan Name *'
                      : 'Customer Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={
                      formRole === 'KARIGAR'
                        ? 'e.g. Rameshwar Soni (Agra Payal)'
                        : formRole === 'SUPPLIER'
                        ? 'e.g. Nakoda Bullion House'
                        : 'e.g. Smt. Kavita Singhania'
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Mobile / WhatsApp Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+91 98200..."
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    City / Market
                  </label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="e.g. Zaveri Bazaar, Rajkot"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    value={formPan}
                    onChange={(e) => setFormPan(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    GSTIN (Optional for B2C/Karigar)
                  </label>
                  <input
                    type="text"
                    value={formGstin}
                    onChange={(e) => setFormGstin(e.target.value.toUpperCase())}
                    placeholder="27AAAAA0000A1Z5"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 uppercase font-mono"
                  />
                </div>
              </div>

              {/* Role-Specific Fields */}
              {formRole === 'KARIGAR' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50">
                  <div>
                    <label className="block font-medium text-amber-900 dark:text-amber-300 mb-1">
                      Karigar Specialty
                    </label>
                    <input
                      type="text"
                      value={formSpecialty}
                      onChange={(e) => setFormSpecialty(e.target.value)}
                      placeholder="e.g. Silver Payal, 22K Chains"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-amber-900 dark:text-amber-300 mb-1">
                      Default Wastage / Badti (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formDefaultWastage}
                      onChange={(e) => setFormDefaultWastage(Number(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-neutral-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-amber-900 dark:text-amber-300 mb-1">
                      Default Cash Majuri (₹/g)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={formDefaultMajuri}
                      onChange={(e) => setFormDefaultMajuri(Number(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-neutral-900 font-mono"
                    />
                  </div>
                </div>
              )}

              {formRole === 'SUPPLIER' && (
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Primary Contact Person (Vyapari Name)
                  </label>
                  <input
                    type="text"
                    value={formContactPerson}
                    onChange={(e) => setFormContactPerson(e.target.value)}
                    placeholder="e.g. Champaklal Shah"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                  />
                </div>
              )}

              {/* Triple-Column Opening / Running Balance Section */}
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-2">
                <div className="font-bold text-neutral-800 dark:text-neutral-200">
                  Triple-Column Khata Balance (Cash ₹ · Fine Gold g · Fine Silver g)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-500 mb-1">
                      {formRole === 'CUSTOMER' ? 'Cash Receivable (₹)' : 'Cash Majuri / Payable (₹)'}
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={formCashBalance}
                      onChange={(e) => setFormCashBalance(Number(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-amber-700 dark:text-amber-400 mb-1">
                      Fine Gold Balance (999 g)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={formGoldFineGrams}
                      onChange={(e) => setFormGoldFineGrams(Number(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                      Fine Silver Balance (999 g)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formSilverFineGrams}
                      onChange={(e) => setFormSilverFineGrams(Number(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowPartyModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                >
                  {editingPartyKey ? 'Save Changes' : 'Save Party to Khata Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
