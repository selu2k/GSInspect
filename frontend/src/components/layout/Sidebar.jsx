import React, { useEffect, useState } from 'react';
import { Activity, Filter, Layers, Search, ShieldAlert } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function Sidebar() {
  const {
    supportType,
    methodology, setMethodology,
    selectedCategory, setSelectedCategory,
    selectedSupplier, setSelectedSupplier,
    selectedLength, setSelectedLength,
    selectedFacility, setSelectedFacility,
    showAverage, setShowAverage,
    categories, suppliers, lengths, facilities,
    filteredProductsList, filteredTests, filteredCurves
  } = useAppContext();

  const [draftMethodology, setDraftMethodology] = useState(methodology);
  const [draftCategory, setDraftCategory] = useState(selectedCategory);
  const [draftSupplier, setDraftSupplier] = useState(selectedSupplier);
  const [draftLength, setDraftLength] = useState(selectedLength);
  const [draftFacility, setDraftFacility] = useState(selectedFacility);

  useEffect(() => {
    setDraftMethodology(methodology);
    setDraftCategory(selectedCategory);
    setDraftSupplier(selectedSupplier);
    setDraftLength(selectedLength);
    setDraftFacility(selectedFacility);
  }, [methodology, selectedCategory, selectedSupplier, selectedLength, selectedFacility]);

  const applyFilters = () => {
    setMethodology(draftMethodology);
    setSelectedCategory(draftCategory);
    setSelectedSupplier(draftSupplier);
    setSelectedLength(draftLength);
    setSelectedFacility(draftFacility);
  };

  return (
    <aside className="w-80 bg-white shadow-xl flex flex-col z-10 border-r border-slate-200 flex-shrink-0">
      <div className="p-5 flex-1 overflow-y-auto space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
          <Filter className="w-5 h-5 text-slate-400" />
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Test Filters</h2>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Support Type</h3>
          <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 p-2.5 rounded-lg cursor-not-allowed">
            <ShieldAlert className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-500 capitalize">{supportType} (Locked for MVP)</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Test Methodology
            </label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setDraftMethodology('static')}
                className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${draftMethodology === 'static' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Static
              </button>
              <button 
                onClick={() => setDraftMethodology('dynamic')}
                className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${draftMethodology === 'dynamic' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Dynamic
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bolt Category</label>
            <select 
              value={draftCategory}
              onChange={(e) => setDraftCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Supplier</label>
            <select 
              value={draftSupplier}
              onChange={(e) => setDraftSupplier(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            >
              {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Length (m)</label>
            <select 
              value={draftLength}
              onChange={(e) => setDraftLength(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            >
              {lengths.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Test Facility</label>
            <select 
              value={draftFacility}
              onChange={(e) => setDraftFacility(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            >
              {facilities.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <button
            onClick={applyFilters}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Search className="w-4 h-4" /> Search / Show Results
          </button>

        </div>

        {/* <div className="pt-4 border-t border-slate-100 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input type="checkbox" className="sr-only" checked={showAverage} onChange={(e) => setShowAverage(e.target.checked)} />
              <div className={`w-10 h-5 bg-slate-200 rounded-full transition-colors ${showAverage ? 'bg-blue-500' : ''}`}></div>
              <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${showAverage ? 'translate-x-5' : ''}`}></div>
            </div>
            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800">Show Average Overlay</span>
          </label>
        </div> */}
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-200 border-b">
        <div className="flex items-start gap-3">
          <div className="bg-slate-200 p-2 rounded-lg mt-0.5"><Layers className="w-4 h-4 text-slate-500" /></div>
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Data Summary</h3>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span className="font-semibold text-blue-600">{filteredProductsList.length}</span> Products
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span className="font-semibold text-emerald-600">{filteredTests.length}</span> Tests Selected
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span className="font-semibold text-amber-600">{filteredCurves.length}</span> Data Points
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
