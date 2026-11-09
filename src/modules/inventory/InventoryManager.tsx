import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Barcode,
  ArrowRightLeft,
  ShieldCheck,
  Printer,
  FolderEdit,
  Hammer,
  Edit3,
  Trash2,
  Check,
  Coins,
  Sparkles,
} from 'lucide-react';
import {
  Article,
  ArtisanLabourRecord,
  Branch,
  JewelleryCategory,
  Karigar,
  LabourCompensationType,
  MakingChargeType,
  MetalRateSnapshot,
  MetalType,
} from '../../core/types';
import {
  calculateFineMetalEquivalent,
  formatCurrencyINR,
  formatWeightGrams,
  roundDecimals,
} from '../../core/math';
import {
  computeArtisanLabourCost,
  computeKarigarHisab,
  getApplicableRatePerGram,
} from '../../core/pricingEngine';

interface InventoryManagerProps {
  articles: Article[];
  branches: Branch[];
  activeBranch: Branch;
  categories?: JewelleryCategory[];
  metalRates?: MetalRateSnapshot;
  karigars?: Karigar[];
  onAddArticle: (article: Article) => void;
  onUpdateArticle?: (article: Article) => void;
  onTransferArticle: (articleId: string, destinationBranchId: string) => void;
  onUpdateCategories?: (categories: JewelleryCategory[], renamedFrom?: { oldName: string; newName: string }) => void;
}

const DEFAULT_RATES: MetalRateSnapshot = {
  timestamp: new Date().toISOString(),
  ratePerGram24K: 7880,
  ratePerGram22K: 7218,
  ratePerGram18K: 5910,
  ratePerGram14K: 4610,
  ratePerGramSilver999: 95.2,
  ratePerGramSilver925: 88.0,
  ratePerGramPlatinum950: 3250,
  source: 'MANUAL_AUTHORIZED',
  authorizedBy: 'Store Admin',
};

const GOLD_PURITY_PRESETS = [
  { code: '24K', label: '24K Pure (99.9% Tunch)', tounch: 99.9, fineness: 999 },
  { code: '22K', label: '22K Hallmarked (91.6% Tunch)', tounch: 91.6, fineness: 916 },
  { code: '20K', label: '20K Gold (83.3% Tunch)', tounch: 83.3, fineness: 833 },
  { code: '18K', label: '18K Gold (75.0% Tunch)', tounch: 75.0, fineness: 750 },
  { code: '14K', label: '14K Gold (58.5% Tunch)', tounch: 58.5, fineness: 585 },
  { code: 'CUSTOM', label: 'Custom Gold Tunch (Tonch) %', tounch: 91.6, fineness: 916 },
];

const SILVER_PURITY_PRESETS = [
  { code: '999', label: '999 Fine Silver (99.9% Tunch)', tounch: 99.9, fineness: 999 },
  { code: '925', label: '925 Sterling Silver (92.5% Tunch)', tounch: 92.5, fineness: 925 },
  { code: '85T', label: '85 Tunch Silver (85.0%)', tounch: 85.0, fineness: 850 },
  { code: '80T', label: '80 Tunch Silver Payal (80.0%)', tounch: 80.0, fineness: 800 },
  { code: '75T', label: '75 Tunch Silver (75.0%)', tounch: 75.0, fineness: 750 },
  { code: '70T', label: '70 Tunch Silver (70.0%)', tounch: 70.0, fineness: 700 },
  { code: 'CUSTOM', label: 'Custom Silver Tunch (Tonch) %', tounch: 80.0, fineness: 800 },
];

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  articles,
  branches,
  activeBranch,
  categories: propCategories,
  metalRates = DEFAULT_RATES,
  karigars = [],
  onAddArticle,
  onUpdateArticle,
  onTransferArticle,
  onUpdateCategories,
}) => {
  const [localCategories, setLocalCategories] = useState<JewelleryCategory[]>([
    { id: 'c1', name: 'Chains', metalType: 'GOLD', defaultPurity: '22K', defaultTounch: 91.6, defaultWastagePercent: 2.5, defaultMakingChargeType: 'PER_GRAM', defaultMakingChargeValue: 480 },
    { id: 'c2', name: 'Rings', metalType: 'BOTH', defaultPurity: '22K', defaultTounch: 91.6, defaultWastagePercent: 2.0, defaultMakingChargeType: 'PER_GRAM', defaultMakingChargeValue: 500 },
    { id: 'c3', name: 'Bangles', metalType: 'GOLD', defaultPurity: '22K', defaultTounch: 91.6, defaultWastagePercent: 3.0, defaultMakingChargeType: 'PERCENTAGE', defaultMakingChargeValue: 12.0 },
    { id: 'c4', name: 'Necklaces', metalType: 'GOLD', defaultPurity: '22K', defaultTounch: 91.6, defaultWastagePercent: 3.5, defaultMakingChargeType: 'PER_GRAM', defaultMakingChargeValue: 650 },
    { id: 'c5', name: 'Earrings', metalType: 'GOLD', defaultPurity: '22K', defaultTounch: 91.6, defaultWastagePercent: 2.0, defaultMakingChargeType: 'PER_GRAM', defaultMakingChargeValue: 520 },
    { id: 'c6', name: 'Mangalsutra', metalType: 'GOLD', defaultPurity: '22K', defaultTounch: 91.6, defaultWastagePercent: 2.5, defaultMakingChargeType: 'PER_GRAM', defaultMakingChargeValue: 450 },
    { id: 'c7', name: 'Silver Payal (Anklets)', metalType: 'SILVER', defaultPurity: '80T', defaultTounch: 80.0, defaultWastagePercent: 5.0, defaultMakingChargeType: 'PER_GRAM', defaultMakingChargeValue: 18 },
    { id: 'c8', name: 'Silver Bichhiya (Toe Rings)', metalType: 'SILVER', defaultPurity: '75T', defaultTounch: 75.0, defaultWastagePercent: 4.0, defaultMakingChargeType: 'PER_GRAM', defaultMakingChargeValue: 22 },
    { id: 'c9', name: 'Silver Pooja & Utensils', metalType: 'SILVER', defaultPurity: '925', defaultTounch: 92.5, defaultWastagePercent: 3.0, defaultMakingChargeType: 'PER_GRAM', defaultMakingChargeValue: 15 },
    { id: 'c10', name: '925 Sterling Silver Jewels', metalType: 'SILVER', defaultPurity: '925', defaultTounch: 92.5, defaultWastagePercent: 4.0, defaultMakingChargeType: 'PER_GRAM', defaultMakingChargeValue: 35 },
    { id: 'c11', name: 'Coins & Bars', metalType: 'BOTH', defaultPurity: '999', defaultTounch: 99.9, defaultWastagePercent: 0, defaultMakingChargeType: 'FIXED', defaultMakingChargeValue: 350 },
  ]);

  const categories = propCategories && propCategories.length > 0 ? propCategories : localCategories;

  const updateCategoriesList = (
    next: JewelleryCategory[],
    renamedFrom?: { oldName: string; newName: string }
  ) => {
    setLocalCategories(next);
    if (onUpdateCategories) {
      onUpdateCategories(next, renamedFrom);
    }
  };

  // Filters
  const [search, setSearch] = useState('');
  const [metalFilter, setMetalFilter] = useState<'ALL' | 'GOLD' | 'SILVER'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedTagArticle, setSelectedTagArticle] = useState<Article | null>(null);
  const [transferArticleId, setTransferArticleId] = useState<string | null>(null);
  const [destinationBranchId, setDestinationBranchId] = useState<string>(branches[1]?.id || '');

  // Category Manager Modal State
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatMetal, setEditCatMetal] = useState<'GOLD' | 'SILVER' | 'BOTH'>('GOLD');
  const [editCatPurity, setEditCatPurity] = useState('22K');
  const [editCatTounch, setEditCatTounch] = useState(91.6);
  const [editCatWastage, setEditCatWastage] = useState(2.5);
  const [editCatMakingType, setEditCatMakingType] = useState<MakingChargeType>('PER_GRAM');
  const [editCatMakingVal, setEditCatMakingVal] = useState(450);

  const [newCatName, setNewCatName] = useState('');
  const [newCatMetal, setNewCatMetal] = useState<'GOLD' | 'SILVER' | 'BOTH'>('GOLD');
  const [newCatPurity, setNewCatPurity] = useState('22K');
  const [newCatTounch, setNewCatTounch] = useState(91.6);
  const [newCatWastage, setNewCatWastage] = useState(2.5);
  const [newCatMakingType, setNewCatMakingType] = useState<MakingChargeType>('PER_GRAM');
  const [newCatMakingVal, setNewCatMakingVal] = useState(450);

  // Quick inline new category inside Add Stock modal
  const [showQuickNewCategory, setShowQuickNewCategory] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState('');

  // Stock Entry Form State
  const [title, setTitle] = useState('');
  const [metal, setMetal] = useState<MetalType>('GOLD');
  const [category, setCategory] = useState('Chains');
  const [purity, setPurity] = useState('22K');
  const [tounchPercent, setTounchPercent] = useState(91.6);
  const [fineness, setFineness] = useState(916);
  const [grossWeight, setGrossWeight] = useState(10.0);
  const [stoneWeight, setStoneWeight] = useState(0.0);
  const [rateAtEntryPerGram, setRateAtEntryPerGram] = useState(metalRates.ratePerGram22K);
  const [wastagePercent, setWastagePercent] = useState(2.5);
  const [makingChargeType, setMakingChargeType] = useState<MakingChargeType>('PER_GRAM');
  const [makingChargeValue, setMakingChargeValue] = useState(480);
  const [huid, setHuid] = useState('');
  const [location, setLocation] = useState('Counter 1 / Safe A');

  // Artisan / Karigar Hisab details at Stock Entry
  const [labourName, setLabourName] = useState('Gopal Mondal');
  const [labourCompensationType, setLabourCompensationType] =
    useState<LabourCompensationType>('RUPEES_PER_GRAM');
  const [labourCompensationValue, setLabourCompensationValue] = useState(350);
  const [metalGivenType, setMetalGivenType] = useState<'NONE' | 'GOLD' | 'SILVER'>('NONE');
  const [metalGivenWeightGrams, setMetalGivenWeightGrams] = useState(0);
  const [metalGivenTounch, setMetalGivenTounch] = useState(99.9);
  const [labourWastagePercent, setLabourWastagePercent] = useState(1.8);
  const [cashPaidNowINR, setCashPaidNowINR] = useState(0);

  // Helper to get default rate when metal/tunch changes
  const computeDefaultRateForMetalAndTounch = (targetMetal: MetalType, targetTounch: number) => {
    const targetFineness = Math.round(targetTounch * 10);
    return getApplicableRatePerGram({ metal: targetMetal, fineness: targetFineness }, metalRates);
  };

  // Switch Metal inside Add Stock Modal
  const handleSelectMetalInModal = (nextMetal: MetalType) => {
    setMetal(nextMetal);
    const matchingCats = categories.filter(
      (c) => c.metalType === nextMetal || c.metalType === 'BOTH'
    );
    const firstCat = matchingCats[0] || categories[0];
    if (firstCat) {
      setCategory(firstCat.name);
      setPurity(firstCat.defaultPurity);
      setTounchPercent(firstCat.defaultTounch);
      const nextFineness = Math.round(firstCat.defaultTounch * 10);
      setFineness(nextFineness);
      setWastagePercent(firstCat.defaultWastagePercent);
      setMakingChargeType(firstCat.defaultMakingChargeType);
      setMakingChargeValue(firstCat.defaultMakingChargeValue);
      setRateAtEntryPerGram(computeDefaultRateForMetalAndTounch(nextMetal, firstCat.defaultTounch));
    } else if (nextMetal === 'SILVER') {
      setPurity('80T');
      setTounchPercent(80.0);
      setFineness(800);
      setWastagePercent(5.0);
      setMakingChargeType('PER_GRAM');
      setMakingChargeValue(18);
      setRateAtEntryPerGram(computeDefaultRateForMetalAndTounch('SILVER', 80.0));
    } else {
      setPurity('22K');
      setTounchPercent(91.6);
      setFineness(916);
      setWastagePercent(2.5);
      setMakingChargeType('PER_GRAM');
      setMakingChargeValue(480);
      setRateAtEntryPerGram(computeDefaultRateForMetalAndTounch('GOLD', 91.6));
    }
  };

  // Switch Category inside Add Stock Modal
  const handleSelectCategoryInModal = (catName: string) => {
    setCategory(catName);
    const found = categories.find((c) => c.name === catName);
    if (found) {
      const targetMetal =
        found.metalType === 'BOTH' ? metal : (found.metalType as MetalType);
      setMetal(targetMetal);
      setPurity(found.defaultPurity);
      setTounchPercent(found.defaultTounch);
      setFineness(Math.round(found.defaultTounch * 10));
      setWastagePercent(found.defaultWastagePercent);
      setMakingChargeType(found.defaultMakingChargeType);
      setMakingChargeValue(found.defaultMakingChargeValue);
      setRateAtEntryPerGram(
        computeDefaultRateForMetalAndTounch(targetMetal, found.defaultTounch)
      );
    }
  };

  // Open modal for New Stock Entry
  const handleOpenAddModal = (initialMetal: MetalType = 'GOLD') => {
    setEditingArticle(null);
    setTitle('');
    setGrossWeight(10.0);
    setStoneWeight(0.0);
    setHuid('');
    const defaultKarigar = karigars[0];
    setLabourName(defaultKarigar?.name || 'Gopal Mondal');
    setLabourCompensationType(initialMetal === 'SILVER' ? 'NONE_TOUCH_ONLY' : 'RUPEES_PER_GRAM');
    setLabourCompensationValue(initialMetal === 'SILVER' ? 0 : (defaultKarigar?.defaultMajuriPerGram ?? 350));
    setMetalGivenType('NONE');
    setMetalGivenWeightGrams(0);
    setMetalGivenTounch(99.9);
    setLabourWastagePercent(
      defaultKarigar?.defaultWastagePercent ?? (initialMetal === 'SILVER' ? 3.5 : 1.8)
    );
    setCashPaidNowINR(0);
    handleSelectMetalInModal(initialMetal);
    setShowAddModal(true);
  };

  // Open modal to Edit Existing Stock Article
  const handleOpenEditModal = (art: Article) => {
    setEditingArticle(art);
    setTitle(art.title);
    setMetal(art.metal);
    setCategory(art.category);
    setPurity(art.purity);
    const artTounch = art.tounchPercent ?? roundDecimals(art.fineness / 10, 2);
    setTounchPercent(artTounch);
    setFineness(art.fineness);
    setGrossWeight(art.grossWeightGrams);
    setStoneWeight(art.stoneWeightGrams);
    setRateAtEntryPerGram(
      art.rateAtEntryPerGram ?? computeDefaultRateForMetalAndTounch(art.metal, artTounch)
    );
    setWastagePercent(art.wastagePercent);
    setMakingChargeType(art.makingChargeType);
    setMakingChargeValue(art.makingChargeValue);
    setHuid(art.huid || '');
    setLocation(art.location);

    if (art.labourDetails) {
      setLabourName(art.labourDetails.labourName);
      setLabourCompensationType(
        art.labourDetails.compensationType === 'METAL_GIVEN'
          ? 'NONE_TOUCH_ONLY'
          : art.labourDetails.compensationType
      );
      setLabourCompensationValue(
        art.labourDetails.compensationType === 'METAL_GIVEN'
          ? 0
          : art.labourDetails.compensationValue
      );
      setMetalGivenType(art.labourDetails.metalGivenType || 'NONE');
      setMetalGivenWeightGrams(art.labourDetails.metalGivenWeightGrams || 0);
      setMetalGivenTounch(
        art.labourDetails.metalGivenTunch ?? art.labourDetails.metalGivenTounch ?? 99.9
      );
      setLabourWastagePercent(art.labourDetails.labourWastagePercent || 0);
      setCashPaidNowINR(art.labourDetails.cashPaidNowINR || 0);
    } else {
      setLabourName(karigars[0]?.name || 'Gopal Mondal');
      setLabourCompensationType('RUPEES_PER_GRAM');
      setLabourCompensationValue(0);
      setMetalGivenType('NONE');
      setMetalGivenWeightGrams(0);
      setLabourWastagePercent(0);
      setCashPaidNowINR(0);
    }

    setShowAddModal(true);
  };

  // Filter articles
  const branchArticles = articles.filter((a) => a.branchId === activeBranch.id);
  const filteredArticles = branchArticles.filter((a) => {
    const matchesMetal = metalFilter === 'ALL' || a.metal === metalFilter;
    const matchesCategory = categoryFilter === 'ALL' || a.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      a.title.toLowerCase().includes(q) ||
      a.tagId.toLowerCase().includes(q) ||
      a.sku.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      (a.labourDetails?.labourName && a.labourDetails.labourName.toLowerCase().includes(q)) ||
      (a.huid && a.huid.toLowerCase().includes(q));

    return matchesMetal && matchesCategory && matchesStatus && matchesSearch;
  });

  // Summary metrics
  const availableGold = branchArticles.filter((a) => a.metal === 'GOLD' && a.status === 'AVAILABLE');
  const availableSilver = branchArticles.filter((a) => a.metal === 'SILVER' && a.status === 'AVAILABLE');
  const totalGoldNetGrams = availableGold.reduce((s, a) => s + a.netWeightGrams, 0);
  const totalGoldFineGrams = availableGold.reduce((s, a) => s + a.fineGoldEquivalentGrams, 0);
  const totalSilverNetGrams = availableSilver.reduce((s, a) => s + a.netWeightGrams, 0);
  const totalSilverFineGrams = availableSilver.reduce((s, a) => s + a.fineGoldEquivalentGrams, 0);

  // Live calculations inside Add/Edit Modal
  const modalNetWeight = Math.max(0, roundDecimals(grossWeight - stoneWeight, 3));
  const modalFineWeight = calculateFineMetalEquivalent(modalNetWeight, fineness);
  const modalMetalCostAtEntry = roundDecimals(modalNetWeight * rateAtEntryPerGram, 2);
  const modalWastageGrams = roundDecimals((modalNetWeight * wastagePercent) / 100, 3);

  const currentLabourRecord: ArtisanLabourRecord = {
    labourName: labourName.trim() || 'In-House Karigar',
    compensationType: labourCompensationType,
    compensationValue:
      labourCompensationType === 'NONE_TOUCH_ONLY' ? 0 : labourCompensationValue,
    metalGivenType,
    metalGivenWeightGrams: metalGivenType === 'NONE' ? 0 : metalGivenWeightGrams,
    metalGivenTunch: metalGivenTounch,
    metalGivenTounch,
    labourWastagePercent,
    cashPaidNowINR,
  };

  const karigarHisab = computeKarigarHisab(
    modalNetWeight,
    tounchPercent,
    rateAtEntryPerGram,
    currentLabourRecord,
    metalRates
  );

  const computedArtisanCostINR =
    karigarHisab.cashMajuriINR > 0
      ? karigarHisab.cashMajuriINR
      : computeArtisanLabourCost(modalNetWeight, rateAtEntryPerGram, currentLabourRecord, metalRates);

  const computedTotalAcquisitionCost = roundDecimals(
    modalMetalCostAtEntry + karigarHisab.totalAcquisitionLabourAndWastageINR,
    2
  );

  // Save new or edited stock article
  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();
    const netWeight = modalNetWeight;
    const fineWeight = modalFineWeight;
    const finalLabourRecord: ArtisanLabourRecord = {
      ...currentLabourRecord,
      totalPayableTunchPercent: karigarHisab.totalPayableTunchPercent,
      fineMetalPayableGrams: karigarHisab.totalFineMetalPayableGrams,
      fineMetalGivenGrams: karigarHisab.fineMetalGivenGrams,
      netFineMetalDueGrams: karigarHisab.netFineMetalDueGrams,
      cashPaidNowINR: karigarHisab.cashPaidNowINR,
      netCashDueINR: karigarHisab.netCashDueINR,
      totalLabourCostINR:
        karigarHisab.cashMajuriINR > 0
          ? karigarHisab.cashMajuriINR
          : karigarHisab.totalAcquisitionLabourAndWastageINR,
    };

    if (editingArticle && onUpdateArticle) {
      const updated: Article = {
        ...editingArticle,
        title: title.trim(),
        category,
        metal,
        purity,
        fineness,
        tounchPercent,
        rateAtEntryPerGram,
        grossWeightGrams: grossWeight,
        stoneWeightGrams: stoneWeight,
        netWeightGrams: netWeight,
        fineGoldEquivalentGrams: fineWeight,
        makingChargeType,
        makingChargeValue,
        wastagePercent,
        labourDetails: finalLabourRecord,
        huid: huid.trim() ? huid.toUpperCase() : undefined,
        costPrice: computedTotalAcquisitionCost,
        location,
        updatedAt: new Date().toISOString(),
      };
      onUpdateArticle(updated);
    } else {
      const tagId = `TAG-${Math.floor(10000 + Math.random() * 90000)}`;
      const prefix = category.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'JWL';
      const sku = `${prefix}-${purity}-${Math.floor(100 + Math.random() * 900)}`;

      const newArticle: Article = {
        id: `ART-${Date.now()}`,
        sku,
        tagId,
        huid: huid.trim() ? huid.toUpperCase() : undefined,
        title: title.trim(),
        category,
        metal,
        purity,
        fineness,
        tounchPercent,
        rateAtEntryPerGram,
        grossWeightGrams: grossWeight,
        stoneWeightGrams: stoneWeight,
        netWeightGrams: netWeight,
        fineGoldEquivalentGrams: fineWeight,
        makingChargeType,
        makingChargeValue,
        wastagePercent,
        labourDetails: finalLabourRecord,
        stones: [],
        hallmarkCost: metal === 'SILVER' ? 0 : 45,
        costPrice: computedTotalAcquisitionCost,
        branchId: activeBranch.id,
        location,
        status: 'AVAILABLE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onAddArticle(newArticle);
    }

    setShowAddModal(false);
    setEditingArticle(null);
  };

  // Quick Add Category from inside Stock Modal
  const handleQuickAddCategory = () => {
    const trimmed = quickCategoryName.trim();
    if (!trimmed) return;
    if (!categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      const newCat: JewelleryCategory = {
        id: `CAT-${Date.now()}`,
        name: trimmed,
        metalType: metal === 'SILVER' ? 'SILVER' : 'GOLD',
        defaultPurity: purity,
        defaultTounch: tounchPercent,
        defaultWastagePercent: wastagePercent,
        defaultMakingChargeType: makingChargeType,
        defaultMakingChargeValue: makingChargeValue,
      };
      updateCategoriesList([...categories, newCat]);
    }
    setCategory(trimmed);
    setQuickCategoryName('');
    setShowQuickNewCategory(false);
  };

  // Add Category in Category Manager Modal
  const handleAddCategoryInManager = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    const created: JewelleryCategory = {
      id: `CAT-${Date.now()}`,
      name: trimmed,
      metalType: newCatMetal,
      defaultPurity: newCatPurity,
      defaultTounch: newCatTounch,
      defaultWastagePercent: newCatWastage,
      defaultMakingChargeType: newCatMakingType,
      defaultMakingChargeValue: newCatMakingVal,
    };
    updateCategoriesList([...categories, created]);
    setNewCatName('');
  };

  // Save Edited Category in Category Manager Modal
  const handleSaveEditedCategory = (oldCat: JewelleryCategory) => {
    const trimmed = editCatName.trim();
    if (!trimmed) return;
    const nextList = categories.map((c) =>
      c.id === oldCat.id
        ? {
            ...c,
            name: trimmed,
            metalType: editCatMetal,
            defaultPurity: editCatPurity,
            defaultTounch: editCatTounch,
            defaultWastagePercent: editCatWastage,
            defaultMakingChargeType: editCatMakingType,
            defaultMakingChargeValue: editCatMakingVal,
          }
        : c
    );
    updateCategoriesList(
      nextList,
      oldCat.name !== trimmed ? { oldName: oldCat.name, newName: trimmed } : undefined
    );
    setEditingCatId(null);
  };

  const handleDeleteCategory = (catId: string) => {
    updateCategoriesList(categories.filter((c) => c.id !== catId));
  };

  const purityPresets = metal === 'SILVER' ? SILVER_PURITY_PRESETS : GOLD_PURITY_PRESETS;

  return (
    <div className="space-y-5">
      {/* Title & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            Gold & Silver Stock Inventory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Add Gold & Silver jewels with Purity/Tunch (Tonch), Wastage, Rate at Entry, and Karigar Hisab (Tunch + Wastage & Majuri).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowCategoryModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <FolderEdit className="w-4 h-4 text-amber-600" />
            Manage Categories ({categories.length})
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddModal('SILVER')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300/80 dark:hover:bg-slate-700 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            + Add Silver Jewel
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddModal('GOLD')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Gold / Silver Stock
          </button>
        </div>
      </div>

      {/* Gold & Silver Stock Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>Gold Stock (Available)</span>
            <span className="font-mono text-amber-600 font-semibold">{availableGold.length} pcs</span>
          </div>
          <div className="mt-1 text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {formatWeightGrams(totalGoldNetGrams)}
          </div>
          <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
            Fine (24K Equiv): {formatWeightGrams(totalGoldFineGrams)}
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>Silver Jewels & Utensils</span>
            <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">{availableSilver.length} pcs</span>
          </div>
          <div className="mt-1 text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {formatWeightGrams(totalSilverNetGrams)}
          </div>
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Fine Silver Equiv: {formatWeightGrams(totalSilverFineGrams)}
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>Live Board Rates</span>
            <span className="font-mono text-emerald-600">Active</span>
          </div>
          <div className="mt-1 text-xs font-mono tabular-nums text-slate-900 dark:text-white space-y-0.5">
            <div>Gold 22K: <strong className="text-amber-600">₹{metalRates.ratePerGram22K}/g</strong> · 24K: ₹{metalRates.ratePerGram24K}/g</div>
            <div>Silver 999: <strong>₹{metalRates.ratePerGramSilver999}/g</strong> · 925: ₹{metalRates.ratePerGramSilver925}/g</div>
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>Active Categories</span>
            <button
              type="button"
              onClick={() => setShowCategoryModal(true)}
              className="text-[11px] text-amber-600 hover:underline font-semibold"
            >
              Edit List
            </button>
          </div>
          <div className="mt-1 text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {categories.length} Categories
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            Gold, Silver Payal, Bichhiya, Utensils & Custom
          </div>
        </div>
      </div>

      {/* Search, Metal Tabs, and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {/* Metal Filter Tabs */}
        <div className="inline-flex p-1 bg-slate-200/70 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
          {(['ALL', 'GOLD', 'SILVER'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetalFilter(m)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                metalFilter === m
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {m === 'ALL' ? 'All Metals' : m === 'GOLD' ? 'Gold Jewels' : 'Silver Jewels'}
            </button>
          ))}
        </div>

        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Tag ID, Item Name, Category, Karigar/Labour Name, or HUID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Dynamic Category Filter */}
        <select
          aria-label="Filter Category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="py-2 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 font-medium"
        >
          <option value="ALL">All Categories ({categories.length})</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name} ({cat.metalType})
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          aria-label="Filter Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="py-2 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 font-medium font-mono"
        >
          <option value="ALL">All Statuses</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="SOLD">SOLD</option>
          <option value="RESERVED">RESERVED</option>
          <option value="IN_TRANSIT">IN_TRANSIT</option>
          <option value="REPAIR">REPAIR</option>
        </select>
      </div>

      {/* Inventory Articles Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-mono">
              <tr>
                <th className="py-2.5 px-3">Tag / Metal</th>
                <th className="py-2.5 px-3">Item & Category</th>
                <th className="py-2.5 px-3">Purity & Tunch</th>
                <th className="py-2.5 px-3 text-right">Net Wt (Fine)</th>
                <th className="py-2.5 px-3 text-right">Entry Rate</th>
                <th className="py-2.5 px-3 text-right">Wastage & Selling Labour</th>
                <th className="py-2.5 px-3">Karigar Hisab (Tunch + Majuri)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No matching jewellery articles found for this filter.
                  </td>
                </tr>
              ) : (
                filteredArticles.map((art) => {
                  const tunch = art.tounchPercent ?? roundDecimals(art.fineness / 10, 2);
                  const entryRate =
                    art.rateAtEntryPerGram ??
                    getApplicableRatePerGram(art, metalRates);
                  const kWst = art.labourDetails?.labourWastagePercent || 0;
                  const payableTunch =
                    art.labourDetails?.totalPayableTunchPercent ?? roundDecimals(tunch + kWst, 2);
                  const finePayable =
                    art.labourDetails?.fineMetalPayableGrams ??
                    roundDecimals((art.netWeightGrams * payableTunch) / 100, 3);
                  return (
                    <tr
                      key={art.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono">
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{art.tagId}</span>
                          <span
                            className={`px-1.5 py-0.5 text-[9px] rounded font-bold ${
                              art.metal === 'SILVER'
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                                : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            {art.metal}
                          </span>
                        </div>
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                          <ShieldCheck className="w-3 h-3" />
                          {art.huid ? `HUID: ${art.huid}` : 'Standard Stock'}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {art.title}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Cat: <strong className="text-slate-700 dark:text-slate-300">{art.category}</strong> · {art.location}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-mono tabular-nums whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {art.purity} ({tunch}% Tunch)
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Fineness: {art.fineness}/1000
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {formatWeightGrams(art.netWeightGrams)}
                        </div>
                        <div className="text-[10px] text-amber-600 dark:text-amber-400">
                          Fine: {formatWeightGrams(art.fineGoldEquivalentGrams)}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          ₹{entryRate}/g
                        </div>
                        <div className="text-[10px] text-slate-400">
                          At Entry
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                        <div className="text-slate-900 dark:text-white font-medium">
                          Wastage: {art.wastagePercent}%
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Sale Labour:{' '}
                          {art.makingChargeType === 'PER_GRAM'
                            ? `₹${art.makingChargeValue}/g`
                            : art.makingChargeType === 'PERCENTAGE'
                            ? `${art.makingChargeValue}%`
                            : `₹${art.makingChargeValue} Flat`}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        {art.labourDetails ? (
                          <div className="text-[11px] space-y-0.5">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                              <Hammer className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>{art.labourDetails.labourName}</span>
                            </div>
                            <div className="text-[10px] font-mono text-amber-700 dark:text-amber-400">
                              Hisab: {tunch}%+{kWst}% = <strong>{payableTunch}%</strong> ({formatWeightGrams(finePayable)} Fine)
                            </div>
                            <div className="text-[10px] font-mono text-slate-500">
                              {(art.labourDetails.compensationType === 'NONE_TOUCH_ONLY' ||
                                art.labourDetails.compensationType === 'METAL_GIVEN') &&
                                'Majuri: ₹0 (Tunch+Wastage Only)'}
                              {art.labourDetails.compensationType === 'RUPEES_FLAT' &&
                                `Majuri: ₹${art.labourDetails.compensationValue} Flat`}
                              {art.labourDetails.compensationType === 'RUPEES_PER_GRAM' &&
                                `Majuri: ₹${art.labourDetails.compensationValue}/g`}
                              {art.labourDetails.compensationType === 'WEIGHT_GRAMS' &&
                                `Extra Wt: +${art.labourDetails.compensationValue}g`}
                              {art.labourDetails.compensationType === 'PERCENTAGE' &&
                                `Majuri: ${art.labourDetails.compensationValue}%`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">In-house</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            art.status === 'AVAILABLE'
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : art.status === 'SOLD'
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {art.status}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            aria-label={`Edit ${art.tagId}`}
                            onClick={() => handleOpenEditModal(art)}
                            title="Edit Stock Tunch, Wastage & Karigar Hisab"
                            className="p-1.5 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Print tag for ${art.tagId}`}
                            onClick={() => setSelectedTagArticle(art)}
                            title="Print Jewellery Tag with Barcode & HUID"
                            className="p-1.5 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Barcode className="w-4 h-4" />
                          </button>
                          {art.status === 'AVAILABLE' && (
                            <button
                              type="button"
                              aria-label={`Transfer ${art.tagId}`}
                              onClick={() => setTransferArticleId(art.id)}
                              title="Transfer Stock to another branch"
                              className="p-1.5 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manage Editable Categories Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FolderEdit className="w-4 h-4 text-amber-600" />
                  Manage Editable Jewellery Categories (Gold & Silver)
                </h2>
                <p className="text-[11px] text-slate-500">
                  Add, rename, or update default Tunch (Tonch) %, Wastage %, and Labour Charges for any Gold or Silver category.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Add New Category Form */}
            <form
              onSubmit={handleAddCategoryInManager}
              className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs"
            >
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                + Add New Gold or Silver Category
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-slate-500 mb-1">Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Silver Kada / Gold Nosepin"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Metal</label>
                  <select
                    value={newCatMetal}
                    onChange={(e) => {
                      const m = e.target.value as 'GOLD' | 'SILVER' | 'BOTH';
                      setNewCatMetal(m);
                      if (m === 'SILVER') {
                        setNewCatPurity('80T');
                        setNewCatTounch(80.0);
                        setNewCatWastage(5.0);
                        setNewCatMakingVal(18);
                      } else {
                        setNewCatPurity('22K');
                        setNewCatTounch(91.6);
                        setNewCatWastage(2.5);
                        setNewCatMakingVal(480);
                      }
                    }}
                    className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="GOLD">GOLD</option>
                    <option value="SILVER">SILVER</option>
                    <option value="BOTH">BOTH</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Default Tunch %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newCatTounch}
                    onChange={(e) => setNewCatTounch(Number(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 font-mono border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Default Wastage %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newCatWastage}
                    onChange={(e) => setNewCatWastage(Number(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 font-mono border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded shadow-sm transition-colors"
                  >
                    Add Category
                  </button>
                </div>
              </div>
            </form>

            {/* Existing Categories Table */}
            <div className="max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-mono sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Category Name</th>
                    <th className="py-2 px-2">Metal</th>
                    <th className="py-2 px-2 text-right">Default Tunch</th>
                    <th className="py-2 px-2 text-right">Default Wastage</th>
                    <th className="py-2 px-2 text-right">Default Labour</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {categories.map((cat) => {
                    const isEditing = editingCatId === cat.id;
                    return (
                      <tr key={cat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2 px-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editCatName}
                              onChange={(e) => setEditCatName(e.target.value)}
                              className="w-full px-2 py-1 border border-amber-400 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            />
                          ) : (
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {cat.name}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 font-mono">
                          {isEditing ? (
                            <select
                              value={editCatMetal}
                              onChange={(e) =>
                                setEditCatMetal(e.target.value as 'GOLD' | 'SILVER' | 'BOTH')
                              }
                              className="px-1.5 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900"
                            >
                              <option value="GOLD">GOLD</option>
                              <option value="SILVER">SILVER</option>
                              <option value="BOTH">BOTH</option>
                            </select>
                          ) : (
                            <span
                              className={`px-1.5 py-0.5 text-[10px] rounded font-bold ${
                                cat.metalType === 'SILVER'
                                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                                  : cat.metalType === 'GOLD'
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                  : 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300'
                              }`}
                            >
                              {cat.metalType}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-right font-mono tabular-nums">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.1"
                              value={editCatTounch}
                              onChange={(e) => setEditCatTounch(Number(e.target.value) || 0)}
                              className="w-16 px-1.5 py-1 text-right border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900"
                            />
                          ) : (
                            `${cat.defaultTounch}%`
                          )}
                        </td>
                        <td className="py-2 px-2 text-right font-mono tabular-nums">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.1"
                              value={editCatWastage}
                              onChange={(e) => setEditCatWastage(Number(e.target.value) || 0)}
                              className="w-16 px-1.5 py-1 text-right border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900"
                            />
                          ) : (
                            `${cat.defaultWastagePercent}%`
                          )}
                        </td>
                        <td className="py-2 px-2 text-right font-mono tabular-nums">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editCatMakingVal}
                              onChange={(e) => setEditCatMakingVal(Number(e.target.value) || 0)}
                              className="w-20 px-1.5 py-1 text-right border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900"
                            />
                          ) : (
                            `₹${cat.defaultMakingChargeValue}${
                              cat.defaultMakingChargeType === 'PER_GRAM' ? '/g' : ''
                            }`
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {isEditing ? (
                            <button
                              type="button"
                              onClick={() => handleSaveEditedCategory(cat)}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold inline-flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Save
                            </button>
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCatId(cat.id);
                                  setEditCatName(cat.name);
                                  setEditCatMetal(cat.metalType);
                                  setEditCatPurity(cat.defaultPurity);
                                  setEditCatTounch(cat.defaultTounch);
                                  setEditCatWastage(cat.defaultWastagePercent);
                                  setEditCatMakingType(cat.defaultMakingChargeType);
                                  setEditCatMakingVal(cat.defaultMakingChargeValue);
                                }}
                                className="p-1 text-slate-500 hover:text-amber-600 rounded"
                                title="Rename / Edit Category"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Delete Category"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-900 dark:bg-slate-800 text-white rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Gold & Silver Stock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingArticle
                    ? `Edit Stock Item — ${editingArticle.tagId}`
                    : 'Add Gold / Silver Stock Item (Weight, Tunch/Tonch, Wastage & Karigar Hisab)'}
                </h2>
                <p className="text-[11px] text-slate-500">
                  Record physical weight, purity/Tunch (Tonch) %, metal rate at entry, wastage %, and authentic Karigar Hisab.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="space-y-4 text-xs">
              {/* Row 1: Metal Type Toggle & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    1. Select Metal Type:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectMetalInModal('GOLD')}
                      className={`py-2 px-3 rounded-lg font-bold border text-xs flex items-center justify-center gap-1.5 transition-colors ${
                        metal === 'GOLD'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5" />
                      Gold Jewel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectMetalInModal('SILVER')}
                      className={`py-2 px-3 rounded-lg font-bold border text-xs flex items-center justify-center gap-1.5 transition-colors ${
                        metal === 'SILVER'
                          ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-slate-800 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Silver Jewel
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 dark:text-slate-300 font-semibold">
                      2. Item Category:
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowQuickNewCategory(!showQuickNewCategory)}
                      className="text-[11px] text-amber-600 hover:underline font-semibold"
                    >
                      {showQuickNewCategory ? 'Cancel' : '+ New Category'}
                    </button>
                  </div>

                  {showQuickNewCategory ? (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Enter new category name..."
                        value={quickCategoryName}
                        onChange={(e) => setQuickCategoryName(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 border border-amber-400 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleQuickAddCategory}
                        className="px-3 py-1.5 bg-amber-600 text-white font-semibold rounded-lg"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <select
                      aria-label="Stock Category"
                      value={category}
                      onChange={(e) => handleSelectCategoryInModal(e.target.value)}
                      className="w-full px-2.5 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name} ({cat.metalType})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Row 2: Item Title & HUID */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Article Name / Jewel Description:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      metal === 'SILVER'
                        ? 'e.g. Silver Bridal Payal Pair (80% Tunch)'
                        : 'e.g. 22K Traditional Nakshi Gold Necklace'
                    }
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    BIS HUID / Lot Code (Optional):
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="e.g. AB1234"
                    value={huid}
                    onChange={(e) => setHuid(e.target.value)}
                    className="w-full px-2.5 py-1.5 uppercase font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Row 3: Purity Grade, Tunch % & Rate at Time of Entry */}
              <div className="p-3.5 bg-amber-50/50 dark:bg-slate-800/50 rounded-xl border border-amber-200/80 dark:border-slate-700 space-y-3">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>3. Purity, Tunch (Tonch %) & Price at Time of Entry</span>
                  <span className="font-mono text-[11px] text-amber-700 dark:text-amber-400">
                    Fine Wt = Net Wt × {tounchPercent}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      Purity Grade (24K / 22K / 18K / 14K / Silver):
                    </label>
                    <select
                      aria-label="Purity Preset"
                      value={purity}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPurity(val);
                        const preset = purityPresets.find((p) => p.code === val);
                        if (preset && preset.code !== 'CUSTOM') {
                          setTounchPercent(preset.tounch);
                          setFineness(preset.fineness);
                          setRateAtEntryPerGram(
                            computeDefaultRateForMetalAndTounch(metal, preset.tounch)
                          );
                        }
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                    >
                      {purityPresets.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      Tunch / Tonch Purity (%):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      max="100"
                      required
                      value={tounchPercent}
                      onChange={(e) => {
                        const nextTounch = Number(e.target.value) || 0;
                        setTounchPercent(nextTounch);
                        const nextFineness = Math.round(nextTounch * 10);
                        setFineness(nextFineness);
                        setRateAtEntryPerGram(
                          computeDefaultRateForMetalAndTounch(metal, nextTounch)
                        );
                      }}
                      className="w-full px-2.5 py-1.5 font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      Metal Rate at Time of Entry (₹/g):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={rateAtEntryPerGram}
                      onChange={(e) => setRateAtEntryPerGram(Number(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 font-mono font-semibold border border-amber-300 dark:border-amber-700 rounded-lg bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400"
                    />
                  </div>
                </div>

                {/* Weights Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      Gross Weight (Grams):
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      value={grossWeight}
                      onChange={(e) => setGrossWeight(Number(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      Less Stone / Tare Weight (Grams):
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={stoneWeight}
                      onChange={(e) => setStoneWeight(Number(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-center font-mono">
                    <div className="text-[10px] text-slate-500">
                      Net Wt: <strong className="text-slate-900 dark:text-white">{formatWeightGrams(modalNetWeight)}</strong>
                    </div>
                    <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      Fine Metal: {formatWeightGrams(modalFineWeight)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 4: Authentic Indian Sarafa Karigar Hisab (Tunch + Wastage Fine Liability & Majuri) */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Hammer className="w-3.5 h-3.5 text-amber-600" />
                    4. Karigar / Artisan Hisab (Tunch + Wastage & Majuri Settlement)
                  </span>
                  <span className="font-mono text-[11px] text-amber-700 dark:text-amber-400">
                    Payable Tunch: <strong>{tounchPercent}% + {labourWastagePercent}% = {karigarHisab.totalPayableTunchPercent}%</strong> ({formatWeightGrams(karigarHisab.totalFineMetalPayableGrams)} Fine)
                  </span>
                </div>

                {/* 4A & 4B: Karigar Selection, Karigar Wastage (Badti %), and Cash Majuri Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      Karigar / Artisan Name:
                    </label>
                    <input
                      type="text"
                      list="karigar-names-list"
                      placeholder="Select or type Karigar..."
                      value={labourName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLabourName(val);
                        const match = karigars.find(
                          (k) => k.name.toLowerCase() === val.trim().toLowerCase()
                        );
                        if (match) {
                          if (match.defaultWastagePercent !== undefined) {
                            setLabourWastagePercent(match.defaultWastagePercent);
                          }
                          if (
                            match.defaultMajuriPerGram !== undefined &&
                            labourCompensationType === 'RUPEES_PER_GRAM'
                          ) {
                            setLabourCompensationValue(match.defaultMajuriPerGram);
                          }
                        }
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                    <datalist id="karigar-names-list">
                      {karigars.map((k) => (
                        <option key={k.id} value={k.name} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      Karigar Wastage / Badti (%):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={labourWastagePercent}
                      onChange={(e) => setLabourWastagePercent(Number(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      Karigar Majuri (Making) Mode:
                    </label>
                    <select
                      aria-label="Labour Charge Mode"
                      value={labourCompensationType}
                      onChange={(e) => {
                        const nextMode = e.target.value as LabourCompensationType;
                        setLabourCompensationType(nextMode);
                        if (nextMode === 'NONE_TOUCH_ONLY') {
                          setLabourCompensationValue(0);
                        }
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="NONE_TOUCH_ONLY">
                        Tunch + Wastage Only (₹0 Cash Majuri)
                      </option>
                      <option value="RUPEES_PER_GRAM">
                        Per Gram in Rupees (₹/g)
                      </option>
                      <option value="RUPEES_FLAT">
                        Flat / Per Piece / Jodi in Rupees (₹)
                      </option>
                      <option value="PERCENTAGE">
                        Percentage of Metal Value (%)
                      </option>
                      <option value="WEIGHT_GRAMS">
                        Extra Fine Metal Weight (Grams)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      {labourCompensationType === 'NONE_TOUCH_ONLY' && 'Cash Majuri (₹0 Tunch-Only):'}
                      {labourCompensationType === 'RUPEES_PER_GRAM' && 'Majuri Rate (₹/gram):'}
                      {labourCompensationType === 'RUPEES_FLAT' && 'Majuri Amount (Flat ₹):'}
                      {labourCompensationType === 'WEIGHT_GRAMS' && 'Extra Labour Wt (Grams):'}
                      {labourCompensationType === 'PERCENTAGE' && 'Majuri Percentage (%):'}
                      {labourCompensationType === 'METAL_GIVEN' && 'Majuri Value:'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={labourCompensationType === 'NONE_TOUCH_ONLY'}
                      value={
                        labourCompensationType === 'NONE_TOUCH_ONLY'
                          ? 0
                          : labourCompensationValue
                      }
                      onChange={(e) => {
                        setLabourCompensationValue(Number(e.target.value) || 0);
                      }}
                      className="w-full px-2.5 py-1.5 font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* 4C: Immediate Settlement Given to Karigar at Entry (Metal Given Now & Cash Paid Now) */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      Metal Given to Karigar Now:
                    </label>
                    <select
                      aria-label="Metal Given to Labour"
                      value={metalGivenType}
                      onChange={(e) => {
                        const nextType = e.target.value as 'NONE' | 'GOLD' | 'SILVER';
                        setMetalGivenType(nextType);
                        if (nextType !== 'NONE' && metalGivenWeightGrams === 0) {
                          setMetalGivenWeightGrams(karigarHisab.totalFineMetalPayableGrams);
                        }
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      <option value="NONE">No Metal Given Now (Keep on Khata)</option>
                      <option value="GOLD">Gold Given Now (g)</option>
                      <option value="SILVER">Silver Given Now (g)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      Metal Given Wt (g):
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      disabled={metalGivenType === 'NONE'}
                      value={metalGivenType === 'NONE' ? 0 : metalGivenWeightGrams}
                      onChange={(e) => setMetalGivenWeightGrams(Number(e.target.value) || 0)}
                      placeholder="0.000"
                      className="w-full px-2.5 py-1.5 font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      Given Metal Tunch (%):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      disabled={metalGivenType === 'NONE'}
                      value={metalGivenTounch}
                      onChange={(e) => setMetalGivenTounch(Number(e.target.value) || 99.9)}
                      className="w-full px-2.5 py-1.5 font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      Cash Majuri Paid Now (₹):
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={cashPaidNowINR}
                      onChange={(e) => setCashPaidNowINR(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Live Karigar Jama / Naam Hisab Summary Box */}
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500 block">Fine Metal Payable:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {formatWeightGrams(karigarHisab.totalFineMetalPayableGrams)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Fine Metal Given Now:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      {formatWeightGrams(karigarHisab.fineMetalGivenGrams)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Net Fine Balance Due:</span>
                    <strong className="text-amber-600 dark:text-amber-400">
                      {formatWeightGrams(karigarHisab.netFineMetalDueGrams)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Net Cash Majuri Due:</span>
                    <strong className="text-rose-600 dark:text-rose-400">
                      {formatCurrencyINR(karigarHisab.netCashDueINR)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Row 5: Retail Selling Wastage & Selling Labour Charge (Applied on POS Sale) */}
              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  5. Default Selling Wastage & Selling Labour (For Customer Sale Bill)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      Selling Wastage (%) (+{formatWeightGrams(modalWastageGrams)}):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={wastagePercent}
                      onChange={(e) => setWastagePercent(Number(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      Selling Labour Mode:
                    </label>
                    <select
                      value={makingChargeType}
                      onChange={(e) => setMakingChargeType(e.target.value as MakingChargeType)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="PER_GRAM">Per Gram (₹/g)</option>
                      <option value="FIXED">Flat Rupees (₹)</option>
                      <option value="PERCENTAGE">Percentage of Metal (%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      Selling Labour Charge ({makingChargeType === 'PERCENTAGE' ? '%' : '₹'}):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={makingChargeValue}
                      onChange={(e) => setMakingChargeValue(Number(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Acquisition Valuation Summary Banner */}
              <div className="p-3 bg-amber-50/70 dark:bg-slate-800/80 rounded-lg border border-amber-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-slate-700 dark:text-slate-300 font-mono text-xs">
                <span>
                  Entry Metal Val: <strong>{formatCurrencyINR(modalMetalCostAtEntry)}</strong>
                </span>
                <span>
                  Karigar Wastage + Majuri: <strong>{formatCurrencyINR(karigarHisab.totalAcquisitionLabourAndWastageINR)}</strong>
                </span>
                <span className="font-bold text-amber-700 dark:text-amber-400">
                  Total Stock Cost: {formatCurrencyINR(computedTotalAcquisitionCost)}
                </span>
              </div>

              <div className="sticky bottom-0 bg-white dark:bg-slate-900 flex justify-end gap-2 pt-2.5 pb-1 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm"
                >
                  {editingArticle ? 'Update Stock Item' : 'Save Stock & Generate Tag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Tag Preview Modal */}
      {selectedTagArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Barcode className="w-4 h-4 text-amber-600" />
                Jewellery Tag Preview
              </span>
              <button
                type="button"
                onClick={() => setSelectedTagArticle(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-amber-50/40 dark:bg-slate-950 border border-amber-200 dark:border-amber-800/40 rounded-lg text-slate-900 dark:text-white font-mono text-[11px] space-y-2">
              <div className="text-center font-bold text-xs font-sans tracking-wider border-b border-dashed border-amber-200 dark:border-slate-800 pb-1">
                AURIC JEWELS · {selectedTagArticle.metal}
              </div>
              <div className="flex justify-between items-center">
                <span>Tag: {selectedTagArticle.tagId}</span>
                <span className="font-bold">
                  {selectedTagArticle.purity} (
                  {selectedTagArticle.tounchPercent ?? roundDecimals(selectedTagArticle.fineness / 10, 1)}% Tunch)
                </span>
              </div>
              <div className="text-amber-700 dark:text-amber-400 font-bold flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  HUID: {selectedTagArticle.huid || 'STD'}
                </span>
                <span>Wst: {selectedTagArticle.wastagePercent}%</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>Gr Wt: {formatWeightGrams(selectedTagArticle.grossWeightGrams)}</span>
                <span>Net Wt: {formatWeightGrams(selectedTagArticle.netWeightGrams)}</span>
              </div>
              <div className="pt-2 text-center">
                <div className="h-8 bg-slate-900 dark:bg-slate-200 mx-auto w-48 flex items-center justify-center text-[9px] text-white dark:text-slate-900 font-bold tracking-widest">
                  ||| | |||| | ||| || |||
                </div>
                <div className="text-[9px] text-slate-500 mt-1">{selectedTagArticle.sku}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" /> Print Tag
              </button>
              <button
                type="button"
                onClick={() => setSelectedTagArticle(null)}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Stock Modal */}
      {transferArticleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <ArrowRightLeft className="w-4 h-4 text-sky-600" />
              Transfer Article Between Branches
            </h3>
            <p className="text-xs text-slate-500">
              Transfer piece to destination showroom. Conservation of gross and fine metal weight is enforced (Invariant 7).
            </p>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Destination Showroom:
              </label>
              <select
                aria-label="Destination Branch"
                value={destinationBranchId}
                onChange={(e) => setDestinationBranchId(e.target.value)}
                className="w-full py-1.5 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {branches
                  .filter((b) => b.id !== activeBranch.id)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTransferArticleId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onTransferArticle(transferArticleId, destinationBranchId);
                  setTransferArticleId(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-lg"
              >
                Authorize Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

