import React, { useEffect, useState } from 'react';
import { Filter, ShieldAlert, Zap } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function Sidebar() {
  const {
    supportType,
    selectedCategory, setSelectedCategory,
    selectedSupplier, setSelectedSupplier,
    selectedLength, setSelectedLength,
    categories, suppliers, lengthRange,
    filteredProductsList, filteredTests, filteredCurves,
    triggerSearch
  } = useAppContext();

  const [draftCategory, setDraftCategory] = useState(selectedCategory);
  const [draftSupplier, setDraftSupplier] = useState(selectedSupplier);
  const [draftLengthValue, setDraftLengthValue] = useState(selectedLength === 'All' ? lengthRange.max : parseFloat(selectedLength) || lengthRange.min);

  useEffect(() => {
    setDraftCategory(selectedCategory);
    setDraftSupplier(selectedSupplier);
    setDraftLengthValue(selectedLength === 'All' ? lengthRange.max : parseFloat(selectedLength) || lengthRange.min);
  }, [selectedCategory, selectedSupplier, selectedLength, lengthRange]);

  const applyFilters = () => {
    triggerSearch({
      category: draftCategory,
      supplier: draftSupplier,
      length: draftLengthValue === lengthRange.max ? 'All' : String(draftLengthValue)
    });
  };

  return (
    <aside className="w-80 bg-gradient-to-b from-white to-slate-50 shadow-2xl flex flex-col z-10 border-r border-slate-200 flex-shrink-0">
      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-100">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg shadow-md">
            <Filter className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Filters</h2>
        </div>
        {/* Support Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2 px-0.5">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            Support Type
          </label>
          <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 p-2.5 rounded-lg cursor-not-allowed hover:bg-slate-100 transition-colors">
            <span className="text-sm font-medium text-slate-600 capitalize">{supportType}</span>
            <span className="text-xs text-slate-400 ml-auto">(Locked)</span>
          </div>
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-widest block">Bolt Category</label>
          <select 
            value={draftCategory}
            onChange={(e) => setDraftCategory(e.target.value)}
            className="w-full bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent block p-2.5 transition-all hover:border-slate-400"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Supplier */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-widest block">Supplier</label>
          <select 
            value={draftSupplier}
            onChange={(e) => setDraftSupplier(e.target.value)}
            className="w-full bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent block p-2.5 transition-all hover:border-slate-400"
          >
            {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Length Slider */}
        <div className="space-y-2 pt-1">
          <div className="flex items-baseline justify-between">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-widest">Bolt Length (m)</label>
            <div className="text-right">
              <span className="text-lg font-bold text-blue-600">{draftLengthValue.toFixed(2)}</span>
              <span className="text-xs text-slate-400 ml-1">m</span>
            </div>
          </div>
          <div className="relative px-1 py-1">
            <input 
              type="range"
              min={lengthRange.min}
              max={lengthRange.max}
              step="0.1"
              value={draftLengthValue}
              onChange={(e) => setDraftLengthValue(parseFloat(e.target.value))}
              className="w-full h-2 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-500"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((draftLengthValue - lengthRange.min) / (lengthRange.max - lengthRange.min)) * 100}%, #e2e8f0 ${((draftLengthValue - lengthRange.min) / (lengthRange.max - lengthRange.min)) * 100}%, #e2e8f0 100%)`
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 font-medium px-1">
            <span>{lengthRange.min.toFixed(1)}</span>
            <span>{lengthRange.max.toFixed(1)}</span>
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={applyFilters}
          className="w-full mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all hover:shadow-xl active:scale-95 duration-150"
        >
          <Zap className="w-4 h-4" />
          Apply Filters
        </button>
      </div>

    </aside>
  );
}
