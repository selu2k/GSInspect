import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, X } from 'lucide-react';

const MOCK_PRODUCTS = [
  { id: 'p1', name: 'Hollow Core Bolt D28 x 2.4 m' },
  { id: 'p2', name: 'Yielding Bolt B D20 mm x 3.0 m' },
  { id: 'p3', name: 'Resin Bolt A D20 mm x 2.4 m' },
  { id: 'p4', name: 'Cable Bolt 6.0 m' },
];

export default function CSVUploadPage() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [productId, setProductId] = useState('');
  const [methodology, setMethodology] = useState('Dynamic');
  const [facility, setFacility] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.name.endsWith('.csv')) setFile(dropped);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.name.endsWith('.csv')) setFile(selected);
  };

  const handleSubmit = () => {
    if (!file || !productId || !facility) return;
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFile(null);
    setProductId('');
    setFacility('');
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Upload & Link Test Data</h1>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex flex-col gap-6">

        {/* Step 1: File Upload */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">
            1. Select CSV File (Displacement/Load Arrays)
          </p>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current.click()}
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${
              dragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
            }`}
          >
            {file ? (
              <div className="flex items-center gap-3 text-slate-700">
                <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
                <span className="font-medium">{file.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-600">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-400 mt-1">.csv only. Headers must include Displacement (mm) and Load (kN)</p>
              </>
            )}
            <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          </div>
        </div>

        {/* Step 2: Link to Product */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">2. Link to Product</p>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-400"
          >
            <option value="">-- Select a product to link these curves to --</option>
            {MOCK_PRODUCTS.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Step 3: Methodology & Facility */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Test Methodology</p>
            <select
              value={methodology}
              onChange={(e) => setMethodology(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-400"
            >
              <option>Dynamic</option>
              <option>Static</option>
            </select>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Test Facility</p>
            <input
              type="text"
              placeholder="e.g. Facility D"
              value={facility}
              onChange={(e) => setFacility(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        {/* Submit */}
        {submitted && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-lg">
            ✓ File uploaded and linked successfully!
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={!file || !productId || !facility}
          className="self-end flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          <UploadCloud className="w-4 h-4" />
          Upload & Save to Database
        </button>
      </div>
    </div>
  );
}