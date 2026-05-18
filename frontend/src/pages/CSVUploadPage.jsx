import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileSpreadsheet, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiCall } from '../api/client';

const API_BASE = '/api';

export default function CSVUploadPage() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [boltId, setBoltId] = useState('');
  const [methodology, setMethodology] = useState('dynamic');
  const [facility, setFacility] = useState('');

  const [bolts, setBolts] = useState([]);
  const [loadingBolts, setLoadingBolts] = useState(true);
  const [boltsError, setBoltsError] = useState(null);

  const [status, setStatus] = useState(null); // null | 'uploading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const inputRef = useRef(null);

  // Fetch bolt list on mount
  useEffect(() => {
    async function fetchBolts() {
      try {
        const res = await apiCall(`${API_BASE}/admin/bolts/`);
        const data = await res.json();
        setBolts(Array.isArray(data) ? data : (data.results ?? []));
      } catch (err) {
        setBoltsError('Failed to load products. Please refresh.');
      } finally {
        setLoadingBolts(false);
      }
    }
    fetchBolts();
  }, []);

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
    if (!file || !boltId || !facility) return;

    setStatus('uploading');
    setErrorMsg('');

    try {
      // Step 1: Create Test record → get test_id
      const testRes = await apiCall(`${API_BASE}/admin/tests/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bolt: parseInt(boltId),
          methodology,           // 'static' or 'dynamic'
          facility,
        }),
      });
      const testData = await testRes.json();
      const testId = testData.id;

      // Step 2: Upload CSV with test_id injected per row
      // Parse CSV client-side, inject test_id, re-serialize as FormData
      const csvText = await file.text();
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());

      // Build new CSV with test_id column
      const newHeaders = ['test_id', ...headers];
      const newRows = lines.slice(1).map(line => `${testId},${line}`);
      const newCsv = [newHeaders.join(','), ...newRows].join('\n');
      const csvBlob = new Blob([newCsv], { type: 'text/csv' });

      const formData = new FormData();
      formData.append('file', csvBlob, file.name);

      await apiCall(`${API_BASE}/admin/test-curves/`, {
        method: 'POST',
        headers: {},   // let browser set multipart/form-data + boundary
        body: formData,
      });

      setStatus('success');
      setFile(null);
      setBoltId('');
      setFacility('');
      setMethodology('dynamic');
      setTimeout(() => setStatus(null), 4000);

    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Upload failed. Please try again.');
    }
  };

  const isReady = file && boltId && facility && status !== 'uploading';

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Upload & Link Test Data</h1>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex flex-col gap-6">

        {/* Step 1: File Upload */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">
            1. Select CSV File
          </p>
          <p className="text-xs text-slate-400 mb-3">
            Required columns: <code className="bg-slate-100 px-1 rounded">displacement</code>, <code className="bg-slate-100 px-1 rounded">load</code>, <code className="bg-slate-100 px-1 rounded">energy_absorbed</code>
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
                <p className="text-xs text-slate-400 mt-1">.csv files only</p>
              </>
            )}
            <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          </div>
        </div>

        {/* Step 2: Link to Bolt */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">2. Link to Product (Bolt)</p>
          {boltsError ? (
            <p className="text-sm text-red-500">{boltsError}</p>
          ) : (
            <select
              value={boltId}
              onChange={(e) => setBoltId(e.target.value)}
              disabled={loadingBolts}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">
                {loadingBolts ? 'Loading products...' : '-- Select a product --'}
              </option>
              {bolts.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Step 3: Methodology & Facility */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">3. Test Methodology</p>
            <select
              value={methodology}
              onChange={(e) => setMethodology(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-400"
            >
              <option value="dynamic">Dynamic</option>
              <option value="static">Static</option>
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

        {/* Feedback */}
        {status === 'success' && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-lg">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Test record created and CSV uploaded successfully!
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
          disabled={!isReady}
          className="self-end flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          {status === 'uploading'
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
            : <><UploadCloud className="w-4 h-4" /> Upload & Save to Database</>
          }
        </button>

      </div>
    </div>
  );
}