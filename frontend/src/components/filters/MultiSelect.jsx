import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function MultiSelect({ 
  label, 
  options, 
  selectedValues, 
  onChange,
  placeholder = "Select options...",
  icon: Icon = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleOption = (option) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter(v => v !== option));
    } else {
      onChange([...selectedValues, option]);
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      // All selected, so deselect all
      onChange([]);
    } else {
      // Not all selected, so select all
      onChange([...options]);
    }
  };

  const displayText = selectedValues.length === 0 
    ? placeholder 
    : selectedValues.length === 1 
    ? selectedValues[0] 
    : `${selectedValues.length} selected`;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-widest flex items-center gap-2 px-0.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
          {label}
        </label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent p-2.5 transition-all hover:border-slate-400 flex items-center justify-between ${
            isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''
          }`}
        >
          <span className={selectedValues.length === 0 ? 'text-slate-400' : ''}>
            {displayText}
          </span>
          <ChevronDown 
            className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-50 max-h-56 overflow-y-auto">
            <div className="p-2 border-b border-slate-100 sticky top-0 bg-white flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-600">
                {selectedValues.length > 0 ? `${selectedValues.length} selected` : 'None selected'}
              </span>
              {selectedValues.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold underline"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="p-1">
              {options && options.length > 0 ? (
                <>
                  <label
                    className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 rounded cursor-pointer transition-colors bg-blue-50 border-b border-blue-100"
                  >
                    <input
                      type="checkbox"
                      checked={selectedValues.length === options.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-slate-700">Select All</span>
                  </label>
                  {options.map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedValues.includes(option)}
                        onChange={() => handleToggleOption(option)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm text-slate-700">{option}</span>
                    </label>
                  ))}
                </>
              ) : (
                <div className="px-3 py-2 text-sm text-slate-500 italic">
                  No options available
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
