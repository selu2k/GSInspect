import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import { get, post } from '../api/client';


const API_BASE = '/api';

export default function VettePublishPage() {
  const [bolts, setBolts] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [boltsData, testsData] = await Promise.all([
        get(`${API_BASE}/admin/bolts/`),
        get(`${API_BASE}/admin/tests/`),
      ]);
      setBolts((boltsData.results || boltsData).filter(b => !b.is_published));
      setTests((testsData.results || testsData).filter(t => !t.is_published));
    } catch (err) {
      console.error('Failed to fetch data', err);
    }
    setLoading(false);
  };

  const handlePublishBolt = async (id) => {
    try {
      await post(`${API_BASE}/admin/bolts/${id}/publish/`);
      fetchData();
    } catch (err) {
      console.error('Failed to publish bolt', err);
    }
  };

  const handlePublishTest = async (id) => {
    try {
      await post(`${API_BASE}/admin/tests/${id}/publish/`);
      fetchData();
    } catch (err) {
      console.error('Failed to publish test', err);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Vette & Publish Data</h1>
      <p className="text-slate-500 text-sm mb-6">
        Review newly uploaded test data before making it available on the public dashboard.
      </p>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-3 font-semibold text-slate-600">File / Source</th>
              <th className="text-left px-6 py-3 font-semibold text-slate-600">Date Uploaded</th>
              <th className="text-left px-6 py-3 font-semibold text-slate-600">Matched Product</th>
              <th className="text-left px-6 py-3 font-semibold text-slate-600">Status</th>
              <th className="text-left px-6 py-3 font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 flex items-center gap-2 font-medium text-slate-700">
                  <FileText className="w-4 h-4 text-slate-400" />
                  {item.filename}
                </td>
                <td className="px-6 py-4 text-slate-500">{item.date}</td>
                <td className="px-6 py-4">
                  <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">
                    {item.product}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {item.status === 'Published' ? (
                    <span className="flex items-center gap-1.5 text-emerald-600 font-medium text-xs">
                      <CheckCircle className="w-4 h-4" /> Published
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-medium">
                      <Clock className="w-3.5 h-3.5" /> Pending Review
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {item.status !== 'Published' && (
                    <div className="flex gap-2">
                      <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
                        Review Data
                      </button>
                      <button
                        onClick={() => handlePublish(item.id)}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                      >
                        Publish
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}