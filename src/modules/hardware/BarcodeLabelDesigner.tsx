import React, { useState } from 'react';
import { 
  Barcode, 
  Printer, 
  Copy, 
  Check, 
  Sliders, 
  Layers, 
  Tag, 
  Eye, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  Scale,
  RefreshCw
} from 'lucide-react';
import { Article, Branch, ThermalLabelConfig } from '../../core/types';
import { formatCurrencyINR, formatWeightGrams } from '../../core/math';

interface BarcodeLabelDesignerProps {
  articles: Article[];
  activeBranch: Branch;
}

export const BarcodeLabelDesigner: React.FC<BarcodeLabelDesignerProps> = ({
  articles,
  activeBranch,
}) => {
  const [selectedArticleId, setSelectedArticleId] = useState<string>(articles[0]?.id || '');
  const [copiedZpl, setCopiedZpl] = useState(false);

  // Label configuration state
  const [labelConfig, setLabelConfig] = useState<ThermalLabelConfig>({
    tagWidthMm: 50,
    tagHeightMm: 12,
    tagStyle: 'BUTTERFLY',
    includeBarcode: true,
    includeQrCode: false,
    includeHuid: true,
    includeGrossNetWeight: true,
    includePurity: true,
    includeSecretPriceCode: true,
    secretCodeKey: 'BHARATGOLD', // 1=B, 2=H, 3=A, 4=R, 5=A, 6=T, 7=G, 8=O, 9=L, 0=D
  });

  const selectedArticle = articles.find((a) => a.id === selectedArticleId) || articles[0];

  // Helper to encode making charge into secret keyword cipher
  const encodeSecretPrice = (costOrMaking: number, keyStr: string): string => {
    const key = keyStr.toUpperCase().padEnd(10, 'X');
    const digits = Math.round(costOrMaking).toString();
    return digits
      .split('')
      .map((d) => {
        const num = parseInt(d);
        const idx = num === 0 ? 9 : num - 1;
        return key[idx] || d;
      })
      .join('');
  };

  const secretCode = selectedArticle
    ? encodeSecretPrice(selectedArticle.makingChargeValue, labelConfig.secretCodeKey)
    : 'BHA';

  // Generate Zebra ZPL code
  const generateZpl = (): string => {
    if (!selectedArticle) return '^XA^XZ';
    return `^XA
^PW400
^LL096
^LH0,0
^FO20,10^A0N,18,18^FD${activeBranch.name.slice(0, 16)}^FS
^FO20,30^BY1,2,30^BCN,30,N,N,N^FD${selectedArticle.tagId}^FS
^FO20,65^A0N,14,14^FD${selectedArticle.tagId} HUID:${selectedArticle.huid || 'BIS'}^FS
^FO230,10^A0N,16,16^FD${selectedArticle.purity} ${selectedArticle.fineness}^FS
^FO230,30^A0N,14,14^FDGr:${selectedArticle.grossWeightGrams.toFixed(3)}g^FS
^FO230,48^A0N,14,14^FDNt:${selectedArticle.netWeightGrams.toFixed(3)}g^FS
^FO230,68^A0N,16,16^FD*${secretCode}*^FS
^XZ`;
  };

  const handleCopyZpl = () => {
    navigator.clipboard.writeText(generateZpl());
    setCopiedZpl(true);
    setTimeout(() => setCopiedZpl(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Barcode className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              Jewellery Thermal Barcode & Barbell Label Studio
            </h1>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            WYSIWYG thermal label formatting for Indian jewellery barbell/butterfly tags: 6-digit BIS HUID, dual weight scales, secret making charge ciphers, and raw ZPL printer output.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-medium shadow-sm transition-colors text-sm shrink-0"
          >
            <Printer className="w-4 h-4" />
            <span>Direct Thermal Print</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Label Controls (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <Sliders className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
              Tag Hardware Configuration
            </h2>
          </div>

          {/* Select Article */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Test Article from Showroom Stock:
            </label>
            <select
              value={selectedArticleId}
              onChange={(e) => setSelectedArticleId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
            >
              {articles.map((art) => (
                <option key={art.id} value={art.id}>
                  {art.tagId} — {art.title} ({art.purity}, {formatWeightGrams(art.grossWeightGrams)})
                </option>
              ))}
            </select>
          </div>

          {/* Tag Geometry & Template */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Jewellery Tag Template:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'BUTTERFLY', name: 'Butterfly / Barbell', desc: '50 × 12 mm' },
                { id: 'DUMBBELL', name: 'Dumbbell Tag', desc: '40 × 10 mm' },
                { id: 'RATCHET', name: 'Box / Pouch Label', desc: '70 × 25 mm' },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => setLabelConfig({ ...labelConfig, tagStyle: style.id as any })}
                  className={`p-2.5 rounded-xl border text-left transition-colors ${
                    labelConfig.tagStyle === style.id
                      ? 'border-amber-600 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <div className="text-xs font-bold leading-tight">{style.name}</div>
                  <div className="text-[10px] text-neutral-400 font-mono mt-0.5">{style.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Fields Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Printable Fields on Flap:
            </label>
            
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={labelConfig.includeHuid}
                  onChange={(e) => setLabelConfig({ ...labelConfig, includeHuid: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Mandatory BIS 6-Digit HUID ({selectedArticle?.huid || 'AB9218'})</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={labelConfig.includeGrossNetWeight}
                  onChange={(e) => setLabelConfig({ ...labelConfig, includeGrossNetWeight: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Gross Weight & Net Weight (0.001g precision)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={labelConfig.includeSecretPriceCode}
                  onChange={(e) => setLabelConfig({ ...labelConfig, includeSecretPriceCode: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Encoded Making Charge / Cost Cipher</span>
              </label>
            </div>
          </div>

          {/* Cipher Keyword Configuration */}
          {labelConfig.includeSecretPriceCode && (
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-700/60 space-y-2">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Showroom Secret Cipher Keyword (10 letters for 1-0):
              </label>
              <input
                type="text"
                maxLength={10}
                value={labelConfig.secretCodeKey}
                onChange={(e) => setLabelConfig({ ...labelConfig, secretCodeKey: e.target.value.toUpperCase() })}
                className="w-full text-xs px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono tracking-widest uppercase font-bold"
              />
              <div className="text-[10px] text-neutral-500 flex justify-between font-mono">
                <span>1 2 3 4 5 6 7 8 9 0</span>
                <span>Encoded: <strong className="text-amber-600">{secretCode}</strong> (₹{selectedArticle?.makingChargeValue})</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: WYSIWYG Tag Visualizer & Raw ZPL (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Visual Barbell Tag Card */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                  WYSIWYG Barbell Tag Preview (Scale 1:1)
                </h3>
              </div>
              <span className="text-xs text-neutral-400 font-mono">
                {labelConfig.tagWidthMm}mm × {labelConfig.tagHeightMm}mm Synthetic Thermal Tag
              </span>
            </div>

            {/* Simulated Foldover Barbell / Butterfly Tag */}
            <div className="flex items-center justify-center p-8 bg-neutral-100 dark:bg-neutral-950 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 overflow-x-auto">
              {/* Folded Barbell Structure */}
              <div className="flex items-center shadow-lg rounded-sm bg-white text-neutral-900 border border-neutral-400 font-sans">
                {/* Left Flap (50mm x 12mm equivalent) */}
                <div className="w-56 h-28 p-2 border-r border-dashed border-neutral-300 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black tracking-wider uppercase text-neutral-800">
                      AURIC JEWELS
                    </span>
                    <span className="text-[8px] font-mono px-1 rounded bg-neutral-100 font-bold">
                      {selectedArticle?.purity} 916
                    </span>
                  </div>

                  {/* Barcode Strip */}
                  <div className="my-auto text-center">
                    <div className="font-mono text-xs tracking-widest font-black leading-none py-1">
                      ||| | |||| | ||| |||| |
                    </div>
                    <div className="text-[9px] font-mono font-bold tracking-wider text-neutral-700">
                      {selectedArticle?.tagId}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[8px] font-mono text-neutral-600 border-t border-neutral-200 pt-0.5">
                    <span>HUID: <strong>{selectedArticle?.huid || 'AB9218'}</strong></span>
                    <span className="font-bold text-neutral-900">*{secretCode}*</span>
                  </div>
                </div>

                {/* String Bridge (Clear plastic loop between rings) */}
                <div className="w-8 h-2 bg-neutral-300/80 mx-1 flex items-center justify-center">
                  <span className="text-[6px] text-neutral-500 uppercase tracking-tighter">Loop</span>
                </div>

                {/* Right Flap (Folded Back) */}
                <div className="w-56 h-28 p-2 flex flex-col justify-between bg-neutral-50/50">
                  <div className="text-[9px] font-bold text-neutral-800 truncate">
                    {selectedArticle?.title}
                  </div>

                  <div className="space-y-0.5 font-mono text-[9px] text-neutral-700">
                    <div className="flex justify-between">
                      <span>Gross Wt:</span>
                      <strong className="font-bold">{formatWeightGrams(selectedArticle?.grossWeightGrams || 0)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Net Wt:</span>
                      <strong className="font-bold">{formatWeightGrams(selectedArticle?.netWeightGrams || 0)}</strong>
                    </div>
                    {selectedArticle && selectedArticle.stoneWeightGrams > 0 && (
                      <div className="flex justify-between text-[8px] text-neutral-500">
                        <span>Stones:</span>
                        <span>{formatWeightGrams(selectedArticle.stoneWeightGrams)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[8px] text-neutral-500 border-t border-neutral-200 pt-0.5">
                    <span>{activeBranch.code}</span>
                    <span className="font-bold font-mono">₹{formatCurrencyINR(selectedArticle?.costPrice || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
              Tailored for Zebra ZD220, Citizen CL-S321, and TSC TE244 industrial thermal transfer printers with wax-resin ribbon for scratch resistance.
            </p>
          </div>

          {/* Raw ZPL Output Box */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                  Raw Zebra ZPL II Printer Command Stream
                </h3>
              </div>

              <button
                onClick={handleCopyZpl}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
              >
                {copiedZpl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedZpl ? 'Copied ZPL!' : 'Copy ZPL Stream'}</span>
              </button>
            </div>

            <pre className="p-3 rounded-lg bg-neutral-900 text-neutral-200 font-mono text-xs overflow-x-auto leading-relaxed border border-neutral-800">
              {generateZpl()}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
