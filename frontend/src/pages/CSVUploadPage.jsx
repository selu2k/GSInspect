import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiCall } from '../api/client';

const API_BASE = '/api';

const CSV_TYPES = [
  {
    id: 'tests',
    label: 'Test Records',
    endpoint: `${API_BASE}/admin/tests/import-csv/`,
    description: 'Import test records linked to existing bolts',
    columns: 'product_id, supplier_id, client_product_id, client_test_id, methodology, facility, ...',
  },
  {
    id: 'test-curves',
    label: 'Test Curves',
    endpoint: `${API_BASE}/admin/test-curves/import-csv/`,
    description: 'Import displacement/load curve data for existing tests',
    columns: 'test_id, supplier_id, client_test_id, displacement, load',
  },
  {
    id: 'bolts',
    label: 'Bolts (Products)',
    endpoint: `${API_BASE}/admin/bolts/import-csv/`,
    description: 'Import new bolt products',
    columns: 'supplier_id, client_product_id, name, length, diameter, category, equipment_compatibility',
  },
];

export default function CSVUploadPage() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [csvType, setCsvType] = useState('tests');

  const [status, setStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [resultMsg, setResultMsg] = useState('');

  const inputRef = useRef(null);

  const selectedType = CSV_TYPES.find(t => t.id === csvType);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.endsWith('.csv')) setFile(dropped);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected?.name.endsWith('.csv')) setFile(selected);
  };

  const handleSubmit = async () => {
    if (!file) return;

    setStatus('uploading');
    setErrorMsg('');
    setResultMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiCall(selectedType.endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setStatus('success');
      setResultMsg(`Successfully imported ${data.created ?? ''} records.`);
      setFile(null);
      inputRef.current.value = '';
      setTimeout(() => setStatus(null), 5000);

    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Upload failed. Please check your CSV format and try again.');
      setFile(null);
      inputRef.current.value = '';
      setTimeout(() => setStatus(null), 5000);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Upload & Link Test Data</h1>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex flex-col gap-6">

        {/* Step 1: Select CSV Type */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">1. Select Data Type</p>
          <div className="grid grid-cols-3 gap-3">
            {CSV_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => { setCsvType(type.id); setFile(null); setStatus(null); }}
                className={`text-left p-3 rounded-lg border transition-colors ${
                  csvType === type.id
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <p className={`text-sm font-semibold ${csvType === type.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                  {type.label}
                </p>
                <p className="text-xs text-slate-400 mt-1">{type.description}</p>
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Required columns: <code className="bg-slate-100 px-1 rounded">{selectedType.columns}</code>
          </p>
        </div>

        {/* Step 2: File Upload */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">2. Select CSV File</p>
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
                <p className="text-xs text-slate-400 mt-1">.csv files only</p>
              </>
            )}
            <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          </div>
        </div>

        {/* Feedback */}
        {status === 'success' && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-lg">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {resultMsg}
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!file || status === 'uploading'}
          className="self-end flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          {status === 'uploading'
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
            : <><UploadCloud className="w-4 h-4" /> Upload & Import</>
          }
        </button>

      </div>
    </div>
  );
}