import React, { useEffect, useState } from 'react';
import { Filter, ShieldAlert, Zap, Package, Building2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import MultiSelect from '../filters/MultiSelect';
<<<<<<< HEAD
import RangeSlider from '../filters/RangeSlider';
=======
>>>>>>> 9c20791a5d36c0fefc7ea167d384c3dafe701ecc

export default function Sidebar() {
  const {
    supportType,
    selectedCategories, setSelectedCategories,
    selectedSuppliers, setSelectedSuppliers,
    selectedLengthRange, setSelectedLengthRange,
    categories, suppliers, lengthRange,
    filteredProductsList, filteredTests, filteredCurves,
    triggerSearch
  } = useAppContext();

  // Guard against null/undefined API data
  if (!categories || !suppliers || !lengthRange) {
    return (
      <aside className="w-80 bg-gradient-to-b from-white to-slate-50 shadow-2xl flex flex-col z-10 border-r border-slate-200 flex-shrink-0">
        <div className="p-4 flex items-center justify-center h-full">
          <p className="text-slate-500 italic">Loading filters...</p>
        </div>
      </aside>
    );
  }

  const [draftCategories, setDraftCategories] = useState(selectedCategories || []);
  const [draftSuppliers, setDraftSuppliers] = useState(selectedSuppliers || []);
  const [draftLengthRange, setDraftLengthRange] = useState(
    selectedLengthRange || { min: lengthRange.min, max: lengthRange.max }
  );

  useEffect(() => {
    setDraftCategories(selectedCategories || []);
    setDraftSuppliers(selectedSuppliers || []);
    setDraftLengthRange(
      selectedLengthRange || { min: lengthRange.min, max: lengthRange.max }
    );
  }, [selectedCategories, selectedSuppliers, selectedLengthRange, lengthRange]);
<<<<<<< HEAD
=======

  const handleLengthMinChange = (e) => {
    const val = e.target.value;
    // Allow empty string or valid numbers with up to 2 decimal places
    if (val === '' || /^(\d+\.?\d{0,2}|\d*)$/.test(val)) {
      setDraftLengthRange({ ...draftLengthRange, min: val });
    }
  };

  const handleLengthMaxChange = (e) => {
    const val = e.target.value;
    // Allow empty string or valid numbers with up to 2 decimal places
    if (val === '' || /^(\d+\.?\d{0,2}|\d*)$/.test(val)) {
      setDraftLengthRange({ ...draftLengthRange, max: val });
    }
  };

  const handleLengthMinBlur = () => {
    let numVal = parseFloat(draftLengthRange.min);
    if (isNaN(numVal) || numVal < lengthRange.min || numVal > draftLengthRange.max) {
      numVal = lengthRange.min;
    }
    setDraftLengthRange({ ...draftLengthRange, min: Math.round(numVal * 100) / 100 });
  };

  const handleLengthMaxBlur = () => {
    let numVal = parseFloat(draftLengthRange.max);
    if (isNaN(numVal) || numVal > lengthRange.max || numVal < draftLengthRange.min) {
      numVal = lengthRange.max;
    }
    setDraftLengthRange({ ...draftLengthRange, max: Math.round(numVal * 100) / 100 });
  };
>>>>>>> 9c20791a5d36c0fefc7ea167d384c3dafe701ecc

  const applyFilters = () => {
    triggerSearch({
      categories: draftCategories,
      suppliers: draftSuppliers,
      lengthRange: draftLengthRange
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
            <span className="text-sm font-medium text-slate-600 capitalize">{supportType || 'Loading...'}</span>
            <span className="text-xs text-slate-400 ml-auto">(Locked)</span>
          </div>
        </div>

        {/* Category */}
        <MultiSelect
          label="Bolt Category"
          options={categories.filter(c => c !== 'All')}
          selectedValues={draftCategories}
          onChange={setDraftCategories}
          placeholder="Select categories..."
          icon={Package}
        />

        {/* Supplier */}
        <MultiSelect
          label="Supplier"
          options={suppliers.filter(s => s !== 'All')}
          selectedValues={draftSuppliers}
          onChange={setDraftSuppliers}
          placeholder="Select suppliers..."
          icon={Building2}
        />

<<<<<<< HEAD
        {/* Length Range Slider */}
        <RangeSlider
          label="Bolt Length"
          min={lengthRange.min}
          max={lengthRange.max}
          step={0.1}
          selectedMin={draftLengthRange.min}
          selectedMax={draftLengthRange.max}
          onChange={setDraftLengthRange}
          unit="m"
          icon={Package}
        />
=======
        {/* Length Range */}
        <div className="space-y-2 pt-1">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-widest flex items-center gap-2">
            <Package className="w-3.5 h-3.5 text-slate-400" />
            Bolt Length (m)
          </label>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs text-slate-500 font-medium mb-1 block">Min</label>
              <input
                type="text"
                value={draftLengthRange.min}
                onChange={handleLengthMinChange}
                onBlur={handleLengthMinBlur}
                placeholder={lengthRange.min.toFixed(2)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500 font-medium mb-1 block">Max</label>
              <input
                type="text"
                value={draftLengthRange.max}
                onChange={handleLengthMaxChange}
                onBlur={handleLengthMaxBlur}
                placeholder={lengthRange.max.toFixed(2)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex justify-between text-xs text-slate-400 font-medium px-1 mt-2">
            <span>{lengthRange.min.toFixed(1)}</span>
            <span>{lengthRange.max.toFixed(1)}</span>
          </div>
        </div>
>>>>>>> 9c20791a5d36c0fefc7ea167d384c3dafe701ecc

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
