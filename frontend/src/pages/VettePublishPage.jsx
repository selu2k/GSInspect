import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import { get, patch } from '../api/client';


const API_BASE = '/api';

// const capitalizeFieldName = (str) => {
//   return str
//     .split('_')
//     .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//     .join(' ');
// };

const fetchData = async (setLoading, setBolts, setTests) => {
  setLoading(true);
  try {
    const [boltsData, testsData] = await Promise.all([
      get(`${API_BASE}/admin/bolts/?is_published=false`),
      get(`${API_BASE}/admin/tests/?is_published=false`),
    ]);
    setBolts((boltsData.results || boltsData));
    setTests((testsData.results || testsData));
  } catch (err) {
    console.error('Failed to fetch data', err);
  }
  setLoading(false);
};

export default function VettePublishPage() {
  const [bolts, setBolts] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchData(setLoading, setBolts, setTests);
  }, []);

  const handlePublishBolt = async (id) => {
    try {
      await patch(`${API_BASE}/admin/bolts/${id}/publish/`, { is_published: true });
      fetchData(setLoading, setBolts, setTests);
    } catch (err) {
      console.error('Failed to publish bolt', err);
    }
  };
  
  const handlePublishTest = async (id) => {
    try {
      await patch(`${API_BASE}/admin/tests/${id}/publish/`, { is_published: true });
      fetchData(setLoading, setBolts, setTests);
    } catch (err) {
      console.error('Failed to publish test', err);
    }
  };

  const openBoltDetail = async (id) => {
    setLoadingDetail(true);
    setDetailModal('bolt');
    try {
      const data = await get(`${API_BASE}/admin/bolts/${id}/`);
      setDetailData(data);
    } catch (err) {
      console.error('Failed to fetch bolt detail', err);
    }
    setLoadingDetail(false);
  };
  
  const openTestDetail = async (id) => {
    setLoadingDetail(true);
    setDetailModal('test');
    try {
      const data = await get(`${API_BASE}/admin/tests/${id}/`);
      setDetailData(data);
    } catch (err) {
      console.error('Failed to fetch test detail', err);
    }
    setLoadingDetail(false);
  };

  const capitalizeFieldName = (str) => {
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) return <p className="text-sm text-slate-500 p-4">Loading...</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-0 space-y-6 md:space-y-8">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 mb-1">Vette & Publish Data</h1>
        <p className="text-slate-500 text-xs md:text-sm mb-4 md:mb-6">
          Review unpublished data before making it available on the public dashboard.
        </p>
      </div>
  
      {/* Bolts Table */}
      <div>
        <h2 className="text-base md:text-lg font-semibold text-slate-700 mb-3">Unpublished Products ({bolts.length})</h2>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-xs md:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-3 md:px-6 py-2 md:py-3 font-semibold text-slate-600">ID</th>
                <th className="text-left px-3 md:px-6 py-2 md:py-3 font-semibold text-slate-600 whitespace-nowrap">Product Name</th>
                <th className="text-left px-3 md:px-6 py-2 md:py-3 font-semibold text-slate-600 whitespace-nowrap hidden sm:table-cell">Supplier</th>
                <th className="text-left px-3 md:px-6 py-2 md:py-3 font-semibold text-slate-600 whitespace-nowrap hidden md:table-cell">Category</th>
                <th className="text-left px-3 md:px-6 py-2 md:py-3 font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bolts.length === 0 ? (
                <tr><td colSpan={5} className="px-3 md:px-6 py-3 md:py-4 text-slate-400 text-center text-xs md:text-sm">No unpublished products</td></tr>
              ) : bolts.map(b => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-3 md:px-6 py-2 md:py-4 text-slate-500 text-xs md:text-sm">{b.id}</td>
                  <td className="px-3 md:px-6 py-2 md:py-4 font-medium text-slate-700 text-xs md:text-sm max-w-xs truncate">{b.name}</td>
                  <td className="px-3 md:px-6 py-2 md:py-4 text-slate-500 text-xs md:text-sm hidden sm:table-cell truncate">{b.supplier?.name || b.supplier}</td>
                  <td className="px-3 md:px-6 py-2 md:py-4 hidden md:table-cell">
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium inline-block">{b.category}</span>
                  </td>
                  <td className="px-3 md:px-6 py-2 md:py-4 text-right space-x-1 md:space-x-2">
                    <button onClick={() => openBoltDetail(b.id)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 px-2 md:px-3 py-1 md:py-1.5 rounded-lg hover:bg-indigo-50 whitespace-nowrap inline-block">
                      Details
                    </button>
                    <button onClick={() => handlePublishBolt(b.id)}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-800 border border-emerald-200 px-2 md:px-3 py-1 md:py-1.5 rounded-lg hover:bg-emerald-50 whitespace-nowrap inline-block">
                      <CheckCircle className="w-3 h-3 inline mr-0.5" /> Publish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
  
      {/* Tests Table */}
      <div>
        <h2 className="text-base md:text-lg font-semibold text-slate-700 mb-3">Unpublished Tests ({tests.length})</h2>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-xs md:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-3 md:px-6 py-2 md:py-3 font-semibold text-slate-600">ID</th>
                <th className="text-left px-3 md:px-6 py-2 md:py-3 font-semibold text-slate-600 whitespace-nowrap">Product</th>
                <th className="text-left px-3 md:px-6 py-2 md:py-3 font-semibold text-slate-600 whitespace-nowrap hidden sm:table-cell">Methodology</th>
                <th className="text-left px-3 md:px-6 py-2 md:py-3 font-semibold text-slate-600 whitespace-nowrap hidden md:table-cell">Facility</th>
                <th className="text-left px-3 md:px-6 py-2 md:py-3 font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tests.length === 0 ? (
                <tr><td colSpan={5} className="px-3 md:px-6 py-3 md:py-4 text-slate-400 text-center text-xs md:text-sm">No unpublished tests</td></tr>
              ) : tests.map(t => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-3 md:px-6 py-2 md:py-4 text-slate-500 text-xs md:text-sm">{t.id}</td>
                  <td className="px-3 md:px-6 py-2 md:py-4 font-medium text-slate-700 text-xs md:text-sm max-w-xs truncate">{t.bolt?.name || t.bolt}</td>
                  <td className="px-3 md:px-6 py-2 md:py-4 hidden sm:table-cell">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium inline-block ${t.methodology === 'dynamic' ? 'bg-amber-50 text-amber-700' : 'bg-teal-50 text-teal-700'}`}>
                      {t.methodology}
                    </span>
                  </td>
                  <td className="px-3 md:px-6 py-2 md:py-4 text-slate-500 text-xs md:text-sm hidden md:table-cell">{t.facility || '-'}</td>
                  <td className="px-3 md:px-6 py-2 md:py-4 text-right space-x-1 md:space-x-2">
                    <button onClick={() => openTestDetail(t.id)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 px-2 md:px-3 py-1 md:py-1.5 rounded-lg hover:bg-indigo-50 whitespace-nowrap inline-block">
                      Details
                    </button>
                    <button onClick={() => handlePublishTest(t.id)}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-800 border border-emerald-200 px-2 md:px-3 py-1 md:py-1.5 rounded-lg hover:bg-emerald-50 whitespace-nowrap inline-block">
                      <CheckCircle className="w-3 h-3 inline mr-0.5" /> Publish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 bg-slate-800/20 flex items-center justify-center z-50 px-4" onClick={() => { setDetailModal(null); setDetailData(null); }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-4 md:p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <h2 className="text-sm md:text-base font-semibold text-slate-800">
                {detailModal === 'bolt' ? 'Product Details' : 'Test Details'}
              </h2>
              <button onClick={() => { setDetailModal(null); setDetailData(null); }}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold flex-shrink-0">✕</button>
            </div>
            {loadingDetail ? (
              <p className="text-xs md:text-sm text-slate-500">Loading...</p>
            ) : detailData && (
              <div className="border border-slate-200 rounded-lg bg-slate-50 p-2.5 md:p-3.5 space-y-2">
                {Object.entries(detailData).map(([key, value]) => {
                  // Handle curve data with scrollable table
                  if (key === 'curve' && value && value.curve_pair && Array.isArray(value.curve_pair) && value.curve_pair.length > 0) {
                    return (
                      <div key={key} className="border-b border-slate-200 last:border-b-0 pb-2 md:pb-3 last:pb-0">
                        <span className="font-medium text-slate-700 text-xs md:text-sm block mb-2">Curve Data:</span>
                        <div className="overflow-x-auto border border-slate-300 rounded bg-white max-h-48 overflow-y-auto">
                          <table className="w-full text-xs md:text-sm">
                            <thead className="sticky top-0 bg-slate-100 border-b border-slate-200">
                              <tr>
                                <th className="px-2 md:px-3 py-1 md:py-2 text-left font-semibold text-slate-700">Displacement (mm)</th>
                                <th className="px-2 md:px-3 py-1 md:py-2 text-left font-semibold text-slate-700">Load (kN)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {value.curve_pair.map((point, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="px-2 md:px-3 py-1 text-slate-700 text-xs md:text-sm">{point.displacement !== null ? point.displacement.toFixed(2) : '-'}</td>
                                  <td className="px-2 md:px-3 py-1 text-slate-700 text-xs md:text-sm">{point.load !== null ? point.load.toFixed(2) : '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div key={key} className="border-b border-slate-200 last:border-b-0 pb-2 md:pb-3 last:pb-0 flex flex-col sm:flex-row sm:items-start gap-1 md:gap-2 text-xs md:text-sm">
                      <span className="font-medium text-slate-700 sm:w-32 md:w-40 shrink-0">{capitalizeFieldName(key)}:</span>
                      <span className="text-slate-700 break-words flex-1">
                        {key === 'curve' ? (value ? 'Has curve data' : 'No curve data') :
                        value === null ? '-' : 
                        typeof value === 'object' && value.name ? value.name :
                        Array.isArray(value) ? value.join(', ') :
                        typeof value === 'object' ? JSON.stringify(value) : 
                        String(value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
