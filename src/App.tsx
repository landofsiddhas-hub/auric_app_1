import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Barcode, 
  Package, 
  TrendingUp, 
  Scale, 
  Wrench, 
  Users, 
  BookOpen, 
  HardDrive,
  Truck,
  RotateCcw,
  Building2,
  Menu,
  X,
  Landmark,
  PiggyBank,
  UserCheck,
  Tag,
  Hammer,
  Sparkles
} from 'lucide-react';

import { Header } from './components/Header';
import { OwnerDashboard } from './modules/dashboard/OwnerDashboard';
import { RetailPOS } from './modules/pos/RetailPOS';
import { InventoryManager } from './modules/inventory/InventoryManager';
import { MetalRatesManager } from './modules/metalRates/MetalRatesManager';
import { OldGoldIntakeTerminal } from './modules/oldGold/OldGoldIntakeTerminal';
import { RepairsManager } from './modules/repairs/RepairsManager';
import { WholesaleKarigarManager } from './modules/wholesale/WholesaleKarigarManager';
import { AccountingReports } from './modules/accounting/AccountingReports';
import { DataMigrationAndScale } from './modules/migration/DataMigrationAndScale';
import { PurchaseManager } from './modules/purchases/PurchaseManager';
import { ReturnsManager } from './modules/returns/ReturnsManager';
import { SubscriptionManager } from './modules/subscriptions/SubscriptionManager';
import { GirviManager } from './modules/girvi/GirviManager';
import { GoldSavingsManager } from './modules/savings/GoldSavingsManager';
import { CustomerCRM } from './modules/crm/CustomerCRM';
import { BarcodeLabelDesigner } from './modules/hardware/BarcodeLabelDesigner';
import { ManufacturingJobStudio } from './modules/manufacturing/ManufacturingJobStudio';
import { IntelligenceReportingCenter } from './modules/analytics/IntelligenceReportingCenter';

import { 
  initialTenant, 
  initialMetalRates, 
  initialArticles, 
  initialCustomers, 
  initialRepairs, 
  initialKarigars, 
  initialOldMetalIntake,
  initialSuppliers,
  initialCreditNotes,
  initialGirviPledges,
  initialGoldChitSchemes,
  initialManufacturingOrders,
  initialCategories,
  initialSaleColumns,
  initialStaffUsers
} from './data/mockData';
import { 
  Article, 
  Branch, 
  CreditNote, 
  Customer, 
  Karigar, 
  MetalRateSnapshot, 
  MetalType, 
  OldMetalIntake, 
  PurchaseInvoice, 
  RepairOrder, 
  SaaSPlan, 
  SalesInvoice, 
  Supplier, 
  Tenant,
  GirviPledge,
  GirviPayment,
  GoldChitScheme,
  ManufacturingOrder,
  JewelleryCategory,
  SaleColumnConfig,
  StaffUser,
  StaffRole
} from './core/types';
import { AccountingEngine } from './core/accountingEngine';
import { toPaise, formatWeightGrams, roundDecimals } from './core/math';
import { createGirviDisbursalJournal, createGirviPaymentJournal } from './core/girviEngine';
import { recordInstallmentPayment, createChitPaymentJournal } from './core/savingsEngine';


export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Helper to load persisted state or fall back to initial seed data
  const loadPersisted = <T,>(key: string, fallback: T): T => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed !== null && parsed !== undefined) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return fallback;
  };

  // Tenant, Connected Branches, and Staff Login state (persisted in localStorage)
  const [tenant, setTenant] = useState<Tenant>(() =>
    loadPersisted('auric_tenant_v2', initialTenant)
  );
  const [activeBranch, setActiveBranch] = useState<Branch>(
    () => loadPersisted('auric_tenant_v2', initialTenant).branches[0] || initialTenant.branches[0]
  );
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() =>
    loadPersisted('auric_staff_users_v2', initialStaffUsers)
  );
  const [currentStaff, setCurrentStaff] = useState<StaffUser>(() =>
    loadPersisted('auric_staff_users_v2', initialStaffUsers)[0] || initialStaffUsers[0]
  );
  const [userRole, setUserRole] = useState<StaffRole>('OWNER');

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    | 'DASHBOARD'
    | 'POS'
    | 'INVENTORY'
    | 'BARCODE_DESIGNER'
    | 'GIRVI'
    | 'SAVINGS'
    | 'CRM'
    | 'PURCHASES'
    | 'RETURNS'
    | 'RATES'
    | 'OLD_GOLD'
    | 'REPAIRS'
    | 'MANUFACTURING'
    | 'WHOLESALE_KARIGAR'
    | 'ACCOUNTING'
    | 'AI_REPORTING'
    | 'MIGRATION'
    | 'SUBSCRIPTIONS'
  >('DASHBOARD');

  // Domain authoritative state (with localStorage persistence for pilot demos)
  const [metalRates, setMetalRates] = useState<MetalRateSnapshot>(() =>
    loadPersisted('auric_rates_v2', initialMetalRates)
  );
  const [articles, setArticles] = useState<Article[]>(() =>
    loadPersisted('auric_articles_v2', initialArticles)
  );
  const [categories, setCategories] = useState<JewelleryCategory[]>(() =>
    loadPersisted('auric_categories_v2', initialCategories)
  );
  const [saleColumns, setSaleColumns] = useState<SaleColumnConfig[]>(() =>
    loadPersisted('auric_pos_sale_columns_v2', initialSaleColumns)
  );
  const [customers, setCustomers] = useState<Customer[]>(() =>
    loadPersisted('auric_customers_v2', initialCustomers)
  );
  const [repairs, setRepairs] = useState<RepairOrder[]>(initialRepairs);
  const [karigars, setKarigars] = useState<Karigar[]>(() =>
    loadPersisted('auric_karigars_v2', initialKarigars)
  );
  const [oldGoldVouchers, setOldGoldVouchers] = useState<OldMetalIntake[]>(() =>
    loadPersisted('auric_old_gold_v2', initialOldMetalIntake)
  );
  const [invoices, setInvoices] = useState<SalesInvoice[]>(() =>
    loadPersisted('auric_invoices_v2', [])
  );
  const [suppliers, setSuppliers] = useState<Supplier[]>(() =>
    loadPersisted('auric_suppliers_v2', initialSuppliers)
  );
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>(initialCreditNotes);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [pledges, setPledges] = useState<GirviPledge[]>(initialGirviPledges);
  const [schemes, setSchemes] = useState<GoldChitScheme[]>(initialGoldChitSchemes);
  const [manufacturingOrders, setManufacturingOrders] = useState<ManufacturingOrder[]>(initialManufacturingOrders);

  useEffect(() => {
    try {
      localStorage.setItem('auric_tenant_v2', JSON.stringify(tenant));
      localStorage.setItem('auric_staff_users_v2', JSON.stringify(staffUsers));
      localStorage.setItem('auric_rates_v2', JSON.stringify(metalRates));
      localStorage.setItem('auric_articles_v2', JSON.stringify(articles));
      localStorage.setItem('auric_categories_v2', JSON.stringify(categories));
      localStorage.setItem('auric_customers_v2', JSON.stringify(customers));
      localStorage.setItem('auric_karigars_v2', JSON.stringify(karigars));
      localStorage.setItem('auric_suppliers_v2', JSON.stringify(suppliers));
      localStorage.setItem('auric_old_gold_v2', JSON.stringify(oldGoldVouchers));
      localStorage.setItem('auric_invoices_v2', JSON.stringify(invoices));
    } catch {
      // ignore storage errors
    }
  }, [tenant, staffUsers, metalRates, articles, categories, customers, karigars, suppliers, oldGoldVouchers, invoices]);


  // Accounting Engine instance (persists balanced double-entry journals)
  const [accounting] = useState<AccountingEngine>(() => {
    const engine = new AccountingEngine();
    // Initial opening balanced journal
    engine.postJournal({
      entryNumber: 'JRN-OPENING-01',
      tenantId: 'TEN-AURIC-01',
      branchId: 'BR-MUM-ZAV',
      date: '2026-10-01',
      referenceType: 'STOCK_ADJUSTMENT',
      referenceId: 'OPEN-01',
      narration: 'Opening Showroom Stock & Cash In Till',
      lines: [
        {
          accountId: 'ACC-GOLD-STOCK',
          accountName: 'Gold Showroom Inventory (22K/18K)',
          accountCategory: 'ASSET',
          debitPaise: toPaise(12500000),
          creditPaise: 0,
        },
        {
          accountId: 'ACC-CASH',
          accountName: 'Cash on Hand (Till Float)',
          accountCategory: 'ASSET',
          debitPaise: toPaise(25000),
          creditPaise: 0,
        },
        {
          accountId: 'ACC-CAPITAL',
          accountName: "Owner's Equity & Capital",
          accountCategory: 'EQUITY',
          debitPaise: 0,
          creditPaise: toPaise(12525000),
        },
      ],
      postedBy: 'System Administrator',
    });
    return engine;
  });

  // Sync theme with HTML root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle new retail sale posting (Invariant 1, 2, 3)
  const handlePostSale = (invoice: SalesInvoice) => {
    // 1. Mark sold articles as SOLD (Invariant 1)
    const soldIds = invoice.items.map((i) => i.articleId);
    setArticles((prev) =>
      prev.map((a) => (soldIds.includes(a.id) ? { ...a, status: 'SOLD', updatedAt: new Date().toISOString() } : a))
    );

    // 1b. Mark any redeemed Old Gold / Silver vouchers as REDEEMED_IN_SALE with the invoice reference
    if (invoice.oldGoldVouchers && invoice.oldGoldVouchers.length > 0) {
      const redeemedIds = invoice.oldGoldVouchers.map((v) => v.id);
      setOldGoldVouchers((prev) =>
        prev.map((v) =>
          redeemedIds.includes(v.id)
            ? {
                ...v,
                status: 'REDEEMED_IN_SALE',
                redeemedInvoiceNumber: invoice.invoiceNumber,
                redeemedAt: invoice.createdAt,
              }
            : v
        )
      );
    }

    // 2. Post balanced journal into Accounting Engine (Invariant 2, 3)
    accounting.postJournal({
      entryNumber: `JRN-${invoice.invoiceNumber}`,
      tenantId: invoice.tenantId,
      branchId: invoice.branchId,
      date: invoice.createdAt.slice(0, 10),
      referenceType: 'SALE',
      referenceId: invoice.invoiceNumber,
      narration: `Retail invoice ${invoice.invoiceNumber} to ${invoice.customerName}`,
      lines: [
        {
          accountId: 'ACC-RECEIVABLE-CASH',
          accountName: 'Cash / Bank / Old Metal Collections',
          accountCategory: 'ASSET',
          debitPaise: toPaise(invoice.grandTotal),
          creditPaise: 0,
        },
        {
          accountId: 'ACC-SALES-TAXABLE',
          accountName: 'Taxable Jewellery Sales (HSN 7113)',
          accountCategory: 'REVENUE',
          debitPaise: 0,
          creditPaise: toPaise(invoice.subtotalTaxable),
        },
        {
          accountId: 'ACC-GST-CGST',
          accountName: 'Output CGST Payable (1.5%)',
          accountCategory: 'LIABILITY',
          debitPaise: 0,
          creditPaise: toPaise(invoice.totalCgst),
        },
        {
          accountId: 'ACC-GST-SGST',
          accountName: 'Output SGST Payable (1.5%)',
          accountCategory: 'LIABILITY',
          debitPaise: 0,
          creditPaise: toPaise(invoice.totalSgst),
        },
      ],
      postedBy: invoice.cashierName,
    });

    // 3. Append invoice
    setInvoices((prev) => [invoice, ...prev]);
  };

  // Handle Supplier Purchase Goods Inward (Scenario 1 & Invariant 2)
  const handlePostPurchase = (invoice: PurchaseInvoice, createdArticles: Article[]) => {
    // 1. Add newly created & tagged articles to inventory
    setArticles((prev) => [...createdArticles, ...prev]);

    // 2. Post balanced purchase journal: Dr Gold Stock, Dr Input CGST, Dr Input SGST; Cr Accounts Payable
    accounting.postJournal({
      entryNumber: `JRN-${invoice.purchaseInvoiceNumber}`,
      tenantId: tenant.id,
      branchId: invoice.branchId,
      date: invoice.invoiceDate,
      referenceType: 'PURCHASE',
      referenceId: invoice.purchaseInvoiceNumber,
      narration: `Goods Inward from ${invoice.supplierName} (${formatWeightGrams(invoice.totalGrossWeightGrams)})`,
      lines: [
        {
          accountId: 'ACC-GOLD-STOCK',
          accountName: 'Gold Showroom Inventory',
          accountCategory: 'ASSET',
          debitPaise: toPaise(invoice.taxableSubtotal),
          creditPaise: 0,
        },
        {
          accountId: 'ACC-INPUT-CGST',
          accountName: 'Input CGST Credit (1.5%)',
          accountCategory: 'ASSET',
          debitPaise: toPaise(invoice.cgstAmount),
          creditPaise: 0,
        },
        {
          accountId: 'ACC-INPUT-SGST',
          accountName: 'Input SGST Credit (1.5%)',
          accountCategory: 'ASSET',
          debitPaise: toPaise(invoice.sgstAmount),
          creditPaise: 0,
        },
        {
          accountId: 'ACC-ACCOUNTS-PAYABLE',
          accountName: `Supplier Payable — ${invoice.supplierName}`,
          accountCategory: 'LIABILITY',
          debitPaise: 0,
          creditPaise: toPaise(invoice.grandTotal),
        },
      ],
      postedBy: invoice.receivedBy,
    });

    // 3. Append to purchases log
    setPurchases((prev) => [invoice, ...prev]);
  };

  // Handle Customer Sales Return & Credit Note (Scenario 6, Invariant 8 & 9)
  const handleIssueCreditNote = (creditNote: CreditNote) => {
    // 1. If restockStatus is RESTOCKED_AVAILABLE, restore article to AVAILABLE
    if (creditNote.restockStatus === 'RESTOCKED_AVAILABLE') {
      setArticles((prev) =>
        prev.map((a) =>
          a.id === creditNote.articleId ? { ...a, status: 'AVAILABLE', updatedAt: new Date().toISOString() } : a
        )
      );
    } else {
      setArticles((prev) =>
        prev.map((a) =>
          a.id === creditNote.articleId ? { ...a, status: 'MELTED', updatedAt: new Date().toISOString() } : a
        )
      );
    }

    // 2. Post balanced credit note reversal journal
    accounting.postJournal({
      entryNumber: `JRN-${creditNote.creditNoteNumber}`,
      tenantId: tenant.id,
      branchId: activeBranch.id,
      date: creditNote.createdAt.slice(0, 10),
      referenceType: 'SALE',
      referenceId: creditNote.creditNoteNumber,
      narration: `Sales Return Credit Note ${creditNote.creditNoteNumber} against ${creditNote.originalInvoiceNumber}`,
      lines: [
        {
          accountId: 'ACC-SALES-RETURNS',
          accountName: 'Sales Returns & Allowances',
          accountCategory: 'REVENUE',
          debitPaise: toPaise(creditNote.returnedTaxableValue),
          creditPaise: 0,
        },
        {
          accountId: 'ACC-GST-CGST',
          accountName: 'Output CGST Reversal (1.5%)',
          accountCategory: 'LIABILITY',
          debitPaise: toPaise(creditNote.returnedCgst),
          creditPaise: 0,
        },
        {
          accountId: 'ACC-GST-SGST',
          accountName: 'Output SGST Reversal (1.5%)',
          accountCategory: 'LIABILITY',
          debitPaise: toPaise(creditNote.returnedSgst),
          creditPaise: 0,
        },
        {
          accountId: 'ACC-STORE-CREDIT',
          accountName: `Store Credit Issued — ${creditNote.customerName}`,
          accountCategory: 'LIABILITY',
          debitPaise: 0,
          creditPaise: toPaise(creditNote.totalRefundAmount),
        },
      ],
      postedBy: creditNote.authorizedBy,
    });

    // 3. Append credit note
    setCreditNotes((prev) => [creditNote, ...prev]);
  };

  // Handle stock addition & sync Karigar / Labour Hisab ledger if labour record is attached
  const handleAddArticle = (article: Article) => {
    setArticles((prev) => [article, ...prev]);

    if (article.labourDetails && article.labourDetails.labourName.trim()) {
      const lName = article.labourDetails.labourName.trim();
      const netFineDueGrams =
        article.labourDetails.netFineMetalDueGrams ??
        article.labourDetails.fineMetalPayableGrams ??
        0;
      const netCashDueINR =
        article.labourDetails.netCashDueINR ??
        article.labourDetails.totalLabourCostINR ??
        0;

      setKarigars((prev) => {
        const exists = prev.some((k) => k.name.toLowerCase() === lName.toLowerCase());
        if (exists) {
          return prev.map((k) =>
            k.name.toLowerCase() === lName.toLowerCase()
              ? {
                  ...k,
                  goldBalanceGrams:
                    article.metal === 'GOLD'
                      ? roundDecimals(k.goldBalanceGrams + netFineDueGrams, 3)
                      : k.goldBalanceGrams,
                  silverBalanceGrams:
                    article.metal === 'SILVER'
                      ? roundDecimals(k.silverBalanceGrams + netFineDueGrams, 3)
                      : k.silverBalanceGrams,
                  labourPayableAmount: roundDecimals(k.labourPayableAmount + netCashDueINR, 2),
                }
              : k
          );
        }
        return [
          ...prev,
          {
            id: `KAR-${Date.now()}`,
            name: lName,
            phone: '+91 98000 00000',
            city: 'Showroom Workshop',
            specialization: `${article.metal} ${article.category} Artisan`,
            defaultWastagePercent: article.labourDetails?.labourWastagePercent || 2.5,
            defaultMajuriPerGram: article.labourDetails?.compensationValue || 0,
            goldBalanceGrams: article.metal === 'GOLD' ? netFineDueGrams : 0,
            silverBalanceGrams: article.metal === 'SILVER' ? netFineDueGrams : 0,
            labourPayableAmount: netCashDueINR,
            pendingJobsCount: 0,
          },
        ];
      });
    }
  };

  // Handle stock article edit
  const handleUpdateArticle = (updatedArticle: Article) => {
    setArticles((prev) =>
      prev.map((a) => (a.id === updatedArticle.id ? updatedArticle : a))
    );
  };

  // Handle editable categories update & propagate category renames to articles
  const handleUpdateCategories = (
    nextCategories: JewelleryCategory[],
    renamedFrom?: { oldName: string; newName: string }
  ) => {
    setCategories(nextCategories);
    if (renamedFrom && renamedFrom.oldName !== renamedFrom.newName) {
      setArticles((prev) =>
        prev.map((a) =>
          a.category === renamedFrom.oldName ? { ...a, category: renamedFrom.newName } : a
        )
      );
    }
  };

  // Handle branch stock transfer (Invariant 7)
  const handleTransferArticle = (articleId: string, destinationBranchId: string) => {
    setArticles((prev) =>
      prev.map((a) =>
        a.id === articleId
          ? {
              ...a,
              branchId: destinationBranchId,
              location: 'Transit Vault / Receiving',
              status: 'AVAILABLE',
              updatedAt: new Date().toISOString(),
            }
          : a
      )
    );
  };

  // Handle Karigar metal issue
  const handleIssueMetalToKarigar = (
    karigarId: string,
    metal: MetalType,
    grossWeight: number,
    fineness: number
  ) => {
    const fineGrams = roundDecimals((grossWeight * fineness) / 1000, 3);
    setKarigars((prev) =>
      prev.map((k) =>
        k.id === karigarId
          ? {
              ...k,
              goldBalanceGrams:
                metal === 'GOLD' ? roundDecimals(k.goldBalanceGrams + fineGrams, 3) : k.goldBalanceGrams,
              silverBalanceGrams:
                metal === 'SILVER' ? roundDecimals(k.silverBalanceGrams + fineGrams, 3) : k.silverBalanceGrams,
              pendingJobsCount: k.pendingJobsCount + 1,
            }
          : k
      )
    );
  };

  // Handle SaaS plan upgrade
  const handleUpgradePlan = (newPlan: SaaSPlan['id']) => {
    setTenant((prev) => ({ ...prev, subscriptionPlan: newPlan }));
  };

  // Handle new Girvi pledge sanction & disbursal journal
  const handleAddPledge = (pledge: GirviPledge) => {
    setPledges((prev) => [pledge, ...prev]);
    accounting.postJournal(createGirviDisbursalJournal(pledge));
  };

  // Handle Girvi interest & principal servicing payment & payment journal
  const handleRecordGirviPayment = (pledgeId: string, payment: GirviPayment) => {
    const target = pledges.find((p) => p.id === pledgeId);
    if (!target) return;

    const newBalance = Math.max(0, target.balancePrincipalINR - payment.principalAmount);
    const newInterestPaid = roundDecimals(target.totalInterestPaidINR + payment.interestAmount, 2);
    const newPrincipalPaid = roundDecimals(target.totalPrincipalPaidINR + payment.principalAmount, 2);

    setPledges((prev) =>
      prev.map((p) =>
        p.id === pledgeId
          ? {
              ...p,
              balancePrincipalINR: newBalance,
              totalInterestPaidINR: newInterestPaid,
              totalPrincipalPaidINR: newPrincipalPaid,
              payments: [payment, ...p.payments],
              status: newBalance <= 0 ? 'REDEEMED' : p.status,
              redeemedDate: newBalance <= 0 ? new Date().toISOString() : p.redeemedDate,
            }
          : p
      )
    );

    accounting.postJournal(createGirviPaymentJournal(target, payment));
  };

  // Handle Girvi full redemption
  const handleRedeemGirviPledge = (pledgeId: string, finalPayment?: GirviPayment) => {
    setPledges((prev) =>
      prev.map((p) =>
        p.id === pledgeId
          ? {
              ...p,
              status: 'REDEEMED',
              redeemedDate: new Date().toISOString(),
              balancePrincipalINR: 0,
            }
          : p
      )
    );
  };

  // Handle new Swarna Nidhi scheme enrollment
  const handleAddScheme = (scheme: GoldChitScheme) => {
    setSchemes((prev) => [scheme, ...prev]);
  };

  // Handle Swarna Nidhi installment payment & deposit journal
  const handlePaySchemeInstallment = (
    schemeId: string,
    installmentNumber: number,
    paymentMode: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER'
  ) => {
    const target = schemes.find((s) => s.id === schemeId);
    if (!target) return;

    const { updatedScheme, installment } = recordInstallmentPayment(
      target,
      installmentNumber,
      paymentMode,
      metalRates.ratePerGram22K
    );

    setSchemes((prev) => prev.map((s) => (s.id === schemeId ? updatedScheme : s)));
    accounting.postJournal(createChitPaymentJournal(updatedScheme, installment));
  };

  // Handle Swarna Nidhi redemption at POS
  const handleRedeemSchemeAtPos = (scheme: GoldChitScheme) => {
    setSchemes((prev) =>
      prev.map((s) => (s.id === scheme.id ? { ...s, status: 'REDEEMED_AT_POS' } : s))
    );
    setActiveTab('POS');
  };

  // Unified Party & Khata CRUD handlers (Customer, Karigar, Supplier)
  const handleAddCustomer = (customer: Customer) => {
    setCustomers((prev) => [customer, ...prev]);
  };
  const handleUpdateCustomer = (customer: Customer) => {
    setCustomers((prev) => prev.map((c) => (c.id === customer.id ? customer : c)));
  };
  const handleDeleteCustomer = (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
  };

  const handleAddKarigar = (karigar: Karigar) => {
    setKarigars((prev) => [karigar, ...prev]);
  };
  const handleUpdateKarigar = (karigar: Karigar) => {
    setKarigars((prev) => prev.map((k) => (k.id === karigar.id ? karigar : k)));
  };
  const handleDeleteKarigar = (karigarId: string) => {
    setKarigars((prev) => prev.filter((k) => k.id !== karigarId));
  };

  const handleAddSupplier = (supplier: Supplier) => {
    setSuppliers((prev) => [supplier, ...prev]);
  };
  const handleUpdateSupplier = (supplier: Supplier) => {
    setSuppliers((prev) => prev.map((s) => (s.id === supplier.id ? supplier : s)));
  };
  const handleDeleteSupplier = (supplierId: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
  };

  // Handle Manufacturing Job Card updates
  const handleUpdateManufacturingOrder = (order: ManufacturingOrder) => {
    setManufacturingOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
  };

  // Handle new Manufacturing Order creation
  const handleCreateManufacturingOrder = (order: ManufacturingOrder) => {
    setManufacturingOrders((prev) => [order, ...prev]);
  };

  // Handle Manufacturing completion: receive finished article into showroom stock and post balanced journal
  const handleReceiveFinishedArticle = (newArticle: Article, journal: any) => {
    setArticles((prev) => [newArticle, ...prev]);
    accounting.postJournal(journal);
  };

  const navItems = [
    { id: 'DASHBOARD', label: 'Owner Cockpit', icon: LayoutDashboard },
    { id: 'POS', label: 'Sale & Billing POS', icon: Barcode },
    { id: 'INVENTORY', label: 'Gold & Silver Stock', icon: Package },
    { id: 'RATES', label: 'Daily Metal Rates', icon: TrendingUp },
    { id: 'CRM', label: 'Party & Khata Ledger', icon: UserCheck },
    { id: 'WHOLESALE_KARIGAR', label: 'Karigar & Labour', icon: Users },
    { id: 'OLD_GOLD', label: 'Old Gold / Silver', icon: Scale },
    { id: 'PURCHASES', label: 'Supplier Inward', icon: Truck },
    { id: 'REPAIRS', label: 'Customer Repairs', icon: Wrench },
    { id: 'BARCODE_DESIGNER', label: 'Barcode Tags', icon: Tag },
    { id: 'RETURNS', label: 'Sales Returns', icon: RotateCcw },
    { id: 'ACCOUNTING', label: 'Accounts & GST', icon: BookOpen },
  ] as const;


  // Branch & Staff Management Handlers
  const handleAddBranch = (newBranch: Branch) => {
    setTenant((prev) => ({
      ...prev,
      branches: [...prev.branches, newBranch],
    }));
  };

  const handleUpdateBranch = (updatedBranch: Branch) => {
    setTenant((prev) => ({
      ...prev,
      branches: prev.branches.map((b) => (b.id === updatedBranch.id ? updatedBranch : b)),
    }));
    if (activeBranch.id === updatedBranch.id) {
      setActiveBranch(updatedBranch);
    }
  };

  const handleDeleteBranch = (branchId: string) => {
    setTenant((prev) => {
      const remaining = prev.branches.filter((b) => b.id !== branchId);
      if (remaining.length > 0 && activeBranch.id === branchId) {
        setActiveBranch(remaining[0]);
      }
      return {
        ...prev,
        branches: remaining.length > 0 ? remaining : prev.branches,
      };
    });
  };

  const handleAddStaff = (newStaff: StaffUser) => {
    setStaffUsers((prev) => [...prev, newStaff]);
  };

  const handleUpdateStaff = (updatedStaff: StaffUser) => {
    setStaffUsers((prev) => prev.map((u) => (u.id === updatedStaff.id ? updatedStaff : u)));
    if (currentStaff.id === updatedStaff.id) {
      setCurrentStaff(updatedStaff);
    }
  };

  const handleDeleteStaff = (staffId: string) => {
    setStaffUsers((prev) => prev.filter((u) => u.id !== staffId));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Authoritative Header */}
      <Header
        tenant={tenant}
        branches={tenant.branches}
        activeBranch={activeBranch}
        onSelectBranch={setActiveBranch}
        onUpdateTenant={setTenant}
        onAddBranch={handleAddBranch}
        onUpdateBranch={handleUpdateBranch}
        onDeleteBranch={handleDeleteBranch}
        metalRates={metalRates}
        userRole={userRole}
        onChangeRole={setUserRole}
        staffUsers={staffUsers}
        currentStaff={currentStaff}
        onSelectStaff={setCurrentStaff}
        onAddStaff={handleAddStaff}
        onUpdateStaff={handleUpdateStaff}
        onDeleteStaff={handleDeleteStaff}
        articles={articles}
        onNavigateTab={(tab) => setActiveTab(tab as any)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Main Workspace Layout with Sidebar Navigation */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6">
        
        {/* Mobile Nav Toggle */}
        <div className="md:hidden flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Navigation Menu
          </span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <aside
          className={`w-full md:w-56 shrink-0 space-y-1 ${
            mobileMenuOpen ? 'block' : 'hidden md:block'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 pb-2">
            Operations & Modules
          </div>

          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap text-left ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Showroom Quick Info Box */}
          <div className="pt-6 hidden md:block">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-white truncate">
                {activeBranch.name}
              </div>
              <div className="text-slate-500 font-mono text-[10px]">
                GSTIN: {activeBranch.gstin}
              </div>
              <div className="text-slate-500 text-[10px]">
                Mgr: {activeBranch.managerName}
              </div>
              <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                POS Online · Invariants Active
              </div>
            </div>
          </div>
        </aside>

        {/* Content Viewport */}
        <main className="flex-1 min-w-0">
          {activeTab === 'DASHBOARD' && (
            <OwnerDashboard
              articles={articles}
              invoices={invoices}
              repairs={repairs}
              karigars={karigars}
              customers={customers}
              activeBranch={activeBranch}
              onNavigateTab={(tab) => setActiveTab(tab as any)}
            />
          )}

          {activeTab === 'POS' && (
            <RetailPOS
              articles={articles}
              customers={customers}
              activeBranch={activeBranch}
              metalRates={metalRates}
              onPostSale={handlePostSale}
              oldGoldVouchers={oldGoldVouchers}
              onAddOldGoldVoucher={(v) => setOldGoldVouchers((prev) => [v, ...prev])}
              saleColumns={saleColumns}
              onUpdateSaleColumns={setSaleColumns}
            />
          )}

          {activeTab === 'INVENTORY' && (
            <InventoryManager
              articles={articles}
              branches={tenant.branches}
              activeBranch={activeBranch}
              categories={categories}
              metalRates={metalRates}
              karigars={karigars}
              onAddArticle={handleAddArticle}
              onUpdateArticle={handleUpdateArticle}
              onTransferArticle={handleTransferArticle}
              onUpdateCategories={handleUpdateCategories}
            />
          )}

          {activeTab === 'BARCODE_DESIGNER' && (
            <BarcodeLabelDesigner
              articles={articles}
              activeBranch={activeBranch}
            />
          )}

          {activeTab === 'GIRVI' && (
            <GirviManager
              pledges={pledges}
              customers={customers}
              activeBranch={activeBranch}
              metalRates={metalRates}
              onAddPledge={handleAddPledge}
              onRecordPayment={handleRecordGirviPayment}
              onRedeemPledge={handleRedeemGirviPledge}
            />
          )}

          {activeTab === 'SAVINGS' && (
            <GoldSavingsManager
              schemes={schemes}
              customers={customers}
              activeBranch={activeBranch}
              metalRates={metalRates}
              onAddScheme={handleAddScheme}
              onPayInstallment={handlePaySchemeInstallment}
              onRedeemSchemeAtPos={handleRedeemSchemeAtPos}
            />
          )}

          {activeTab === 'CRM' && (
            <CustomerCRM
              customers={customers}
              karigars={karigars}
              suppliers={suppliers}
              articles={articles}
              invoices={invoices}
              repairs={repairs}
              pledges={pledges}
              schemes={schemes}
              activeBranch={activeBranch}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onAddKarigar={handleAddKarigar}
              onUpdateKarigar={handleUpdateKarigar}
              onDeleteKarigar={handleDeleteKarigar}
              onAddSupplier={handleAddSupplier}
              onUpdateSupplier={handleUpdateSupplier}
              onDeleteSupplier={handleDeleteSupplier}
            />
          )}


          {activeTab === 'PURCHASES' && (
            <PurchaseManager
              suppliers={suppliers}
              activeBranch={activeBranch}
              onPostPurchase={handlePostPurchase}
            />
          )}

          {activeTab === 'RETURNS' && (
            <ReturnsManager
              creditNotes={creditNotes}
              invoices={invoices}
              onIssueCreditNote={handleIssueCreditNote}
            />
          )}

          {activeTab === 'RATES' && (
            <MetalRatesManager
              currentRates={metalRates}
              activeBranch={activeBranch}
              onUpdateRates={setMetalRates}
            />
          )}

          {activeTab === 'OLD_GOLD' && (
            <OldGoldIntakeTerminal
              vouchers={oldGoldVouchers}
              customers={customers}
              metalRates={metalRates}
              onAddVoucher={(v) => setOldGoldVouchers((prev) => [v, ...prev])}
              onDeleteVoucher={(id) => setOldGoldVouchers((prev) => prev.filter((v) => v.id !== id))}
            />
          )}

          {activeTab === 'REPAIRS' && (
            <RepairsManager
              repairs={repairs}
              customers={customers}
              karigars={karigars}
              onAddRepair={(r) => setRepairs([r, ...repairs])}
              onUpdateStatus={(repairId, status) => {
                setRepairs((prev) =>
                  prev.map((r) => (r.id === repairId ? { ...r, status } : r))
                );
              }}
            />
          )}

          {activeTab === 'MANUFACTURING' && (
            <ManufacturingJobStudio
              orders={manufacturingOrders}
              karigars={karigars}
              activeBranch={activeBranch}
              metalRates={metalRates}
              onUpdateOrder={handleUpdateManufacturingOrder}
              onCreateOrder={handleCreateManufacturingOrder}
              onReceiveFinishedArticle={handleReceiveFinishedArticle}
            />
          )}

          {activeTab === 'AI_REPORTING' && (
            <IntelligenceReportingCenter
              articles={articles}
              invoices={invoices}
              customers={customers}
              pledges={pledges}
              schemes={schemes}
              karigars={karigars}
              orders={manufacturingOrders}
              rates={metalRates}
              activeBranch={activeBranch}
              onNavigateTab={(tab) => setActiveTab(tab as any)}
            />
          )}

          {activeTab === 'WHOLESALE_KARIGAR' && (
            <WholesaleKarigarManager
              karigars={karigars}
              onAddKarigar={(k) => setKarigars([...karigars, k])}
              onIssueMetalToKarigar={handleIssueMetalToKarigar}
            />
          )}

          {activeTab === 'ACCOUNTING' && (
            <AccountingReports
              accounting={accounting}
              invoices={invoices}
              activeBranch={activeBranch}
              onLockPeriod={(d) => accounting.lockPeriod(d)}
            />
          )}

          {activeTab === 'MIGRATION' && (
            <DataMigrationAndScale
              onImportArticles={(newItems) => setArticles([...newItems, ...articles])}
              branchId={activeBranch.id}
            />
          )}

          {activeTab === 'SUBSCRIPTIONS' && (
            <SubscriptionManager
              tenant={tenant}
              totalArticlesCount={articles.length}
              onUpgradePlan={handleUpgradePlan}
            />
          )}
        </main>

      </div>
    </div>
  );
}
