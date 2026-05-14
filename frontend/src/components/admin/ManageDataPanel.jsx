import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Check, Database, Package, Building2 } from 'lucide-react';
import { get, post, put, del, patch } from '../../api/client';

const API_BASE = '/api';




// --- Reusable Modal ---
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col relative">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// --- Suppliers Tab (connected to real API) ---
function SuppliersTab({ suppliers, loading, onRefresh, currentPage, totalCount, nextUrl, prevUrl, onNextPage, onPrevPage }) {
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '' });
  const [deleteId, setDeleteId] = useState(null);

  const openAdd = () => { setForm({ name: '' }); setModal('add'); };
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name }); setModal('edit'); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (modal === 'add') {
        await post(`${API_BASE}/admin/suppliers/`, { name: form.name });
      } else {
        await put(`${API_BASE}/admin/suppliers/${editing.id}/`, { name: form.name });
      }
      setModal(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to save supplier:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await del(`${API_BASE}/admin/suppliers/${deleteId}/`);
      setDeleteId(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete supplier:', err);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading suppliers...</p>;

  const itemsPerPage = 10;
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalCount);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{startIndex}-{endIndex} of {totalCount} supplier(s)</p>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3 font-semibold text-slate-600">Name</th>
              <th className="px-5 py-3 font-semibold text-slate-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suppliers.map(s => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-800">{s.name}</td>
                <td className="px-5 py-3 text-right space-x-2">
                  <button onClick={() => openEdit(s)} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1">
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => setDeleteId(s.id)} className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center">
        <button 
          onClick={onPrevPage} 
          disabled={!prevUrl}
          className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          ← Previous
        </button>
        <p className="text-sm text-slate-600 font-medium">Page {currentPage}</p>
        <button 
          onClick={onNextPage} 
          disabled={!nextUrl}
          className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          Next →
        </button>
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Supplier' : 'Edit Supplier'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Supplier C" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1">
                <Check className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title="Confirm Delete" onClose={() => setDeleteId(null)}>
          <p className="text-sm text-slate-600 mb-4">Are you sure you want to delete this supplier?</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// --- Products Tab ---
function ProductsTab({ products, suppliers, filterOptions, loading, onRefresh, currentPage, totalCount, nextUrl, prevUrl, onNextPage, onPrevPage }) {
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [detailedProduct, setDetailedProduct] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [customCategory, setCustomCategory] = useState('');
  const [customEquipment, setCustomEquipment] = useState('');
  const emptyForm = { supplier: '', name: '', length: '', diameter: '', category: 'Encapsulated', equipment_compatibility: [], is_published: false };
  const [form, setForm] = useState(emptyForm);

  const authHeader = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };

  const openAdd = () => { 
    setForm(emptyForm); 
    setDetailedProduct(null); 
    setCustomCategory('');
    setCustomEquipment('');
    setModal('add'); 
  };
  
  const openEdit = async (p) => {
    setEditing(p);
    setLoadingDetails(true);
    setModal('edit');
    setCustomCategory('');
    setCustomEquipment('');
    try {
      const data = await get(`${API_BASE}/admin/bolts/${p.id}/`);
      setDetailedProduct(data);
      setForm({ 
        supplier: data.supplier?.id || data.supplier, 
        name: data.name, 
        length: data.length, 
        diameter: data.diameter, 
        category: data.category, 
        equipment_compatibility: data.equipment_compatibility || [],
        is_published: data.is_published || false
      });
    } catch (err) {
      console.error('Failed to fetch product details', err);
    }
    setLoadingDetails(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      const payload = {
        ...form,
        length: parseFloat(form.length),
        diameter: parseFloat(form.diameter),
        supplier: parseInt(form.supplier),
      };
      if (modal === 'add') {
        await post(`${API_BASE}/admin/bolts/`, payload);
      } else {
        await put(`${API_BASE}/admin/bolts/${editing.id}/`, payload);
      }
      setModal(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to save product', err);
    }
  };

  const handleDelete = async () => {
    try {
      await del(`${API_BASE}/admin/bolts/${deleteId}/`);
      setDeleteId(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete product', err);
    }
  };

  const handlePublishToggle = async (boltId, currentStatus) => {
    try {
      await patch(`${API_BASE}/admin/bolts/${boltId}/publish/`, { is_published: !currentStatus });
      setDetailedProduct({ ...detailedProduct, is_published: !currentStatus });
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle publish status', err);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading products...</p>;

  const itemsPerPage = 10;
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalCount);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{startIndex}-{endIndex} of {totalCount} product(s)</p>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3 font-semibold text-slate-600">Product Name</th>
              <th className="px-5 py-3 font-semibold text-slate-600">Supplier</th>
              <th className="px-5 py-3 font-semibold text-slate-600">Category</th>
              <th className="px-5 py-3 font-semibold text-slate-600">Length (m)</th>
              <th className="px-5 py-3 font-semibold text-slate-600">Diameter (mm)</th>
              <th className="px-5 py-3 font-semibold text-slate-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-800 max-w-[200px] truncate">{p.name}</td>
                <td className="px-5 py-3 text-slate-500">{p.supplier?.name || p.supplier}</td>
                <td className="px-5 py-3">
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium">{p.category}</span>
                </td>
                <td className="px-5 py-3 text-slate-500">{p.length}</td>
                <td className="px-5 py-3 text-slate-500">{p.diameter}</td>
                <td className="px-5 py-3 text-right space-x-2">
                  <button onClick={() => openEdit(p)} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1">
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => setDeleteId(p.id)} className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center">
        <button 
          onClick={onPrevPage} 
          disabled={!prevUrl}
          className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          ← Previous
        </button>
        <p className="text-sm text-slate-600 font-medium">Page {currentPage}</p>
        <button 
          onClick={onNextPage} 
          disabled={!nextUrl}
          className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          Next →
        </button>
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Product' : 'Edit Product'} onClose={() => setModal(null)}>
          {loadingDetails && modal === 'edit' ? (
            <p className="text-sm text-slate-500">Loading product details...</p>
          ) : (
            <div className="space-y-4">
              {/* Product ID Display (Edit Mode) */}
              {modal === 'edit' && detailedProduct && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                  <p className="text-sm text-slate-600"><span className="font-medium">Product ID:</span> {detailedProduct.id}</p>
                </div>
              )}

              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Resin Bolt D20 x 2.4 m" />
              </div>

              {/* Supplier & Category - Side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Supplier *</label>
                  <select value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select supplier...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select category...</option>
                    {filterOptions.categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <input value={customCategory} onChange={e => {setCustomCategory(e.target.value); setForm({ ...form, category: e.target.value });}}
                    placeholder="Or custom" className="w-full mt-2 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              {/* Length & Diameter */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Length (m) *</label>
                  <input type="number" step="0.1" value={form.length} onChange={e => setForm({ ...form, length: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 2.4" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Diameter (mm) *</label>
                  <input type="number" step="1" value={form.diameter} onChange={e => setForm({ ...form, diameter: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 20" />
                </div>
              </div>

              {/* Equipment Compatibility */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Equipment Compatibility</label>
                <div className="space-y-2 mb-3">
                  {form.equipment_compatibility.length > 0 ? (
                    form.equipment_compatibility.map(eq => (
                      <label key={eq} className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={() => setForm({ ...form, equipment_compatibility: form.equipment_compatibility.filter(x => x !== eq) })}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span>{eq}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 italic">No equipment added yet</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <input value={customEquipment} onChange={e => setCustomEquipment(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (customEquipment.trim() && !form.equipment_compatibility.includes(customEquipment)) {
                          setForm({ ...form, equipment_compatibility: [...form.equipment_compatibility, customEquipment] });
                          setCustomEquipment('');
                        }
                      }
                    }}
                    placeholder="Enter equipment type" className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button onClick={() => {
                    if (customEquipment.trim() && !form.equipment_compatibility.includes(customEquipment)) {
                      setForm({ ...form, equipment_compatibility: [...form.equipment_compatibility, customEquipment] });
                      setCustomEquipment('');
                    }
                  }} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                    Add
                  </button>
                </div>
              </div>

              {/* Published Status - Only in Edit Mode */}
              {modal === 'edit' && detailedProduct && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Status:</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${detailedProduct.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {detailedProduct.is_published ? '✓ Published' : '○ Draft'}
                      </span>
                    </div>
                    <button 
                      onClick={() => handlePublishToggle(detailedProduct.id, detailedProduct.is_published)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium text-white ${detailedProduct.is_published ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      {detailedProduct.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 font-medium">
                  Cancel
                </button>
                <button onClick={handleSave} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1 font-medium">
                  <Check className="w-4 h-4" /> {modal === 'add' ? 'Create' : 'Update'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {deleteId && (
        <Modal title="Confirm Delete" onClose={() => setDeleteId(null)}>
          <p className="text-sm text-slate-600 mb-4">Are you sure you want to delete this product?</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// --- Tests Tab ---
function TestsTab({ tests, products, filterOptions, loading, onRefresh, currentPage, totalCount, nextUrl, prevUrl, onNextPage, onPrevPage }) {
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [detailedTest, setDetailedTest] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [customFacility, setCustomFacility] = useState('');
  const emptyForm = { bolt: '', methodology: 'dynamic', facility: 'Custom', installation_method: '', encapsulation_method: '', peak_strength: '', bond_strength: '', yield_strength: '', ultimate_deformation: '', stiffness: '', loading_rate: '', energy_absorption: '', number_of_drops: '' };
  const [form, setForm] = useState(emptyForm);

  const authHeader = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };

  const openAdd = () => { 
    setForm(emptyForm); 
    setDetailedTest(null);
    setCustomFacility('');
    setModal('add'); 
  };
  
  const openEdit = async (t) => {
    setEditing(t);
    setLoadingDetails(true);
    setModal('edit');
    setCustomFacility('');
    try {
      const data = await get(`${API_BASE}/admin/tests/${t.id}/`);
      setDetailedTest(data);
      setForm({
        bolt: data.bolt?.id || data.bolt,
        methodology: data.methodology,
        facility: data.facility,
        installation_method: data.installation_method || '',
        encapsulation_method: data.encapsulation_method || '',
        peak_strength: data.peak_strength || '',
        bond_strength: data.bond_strength || '',
        yield_strength: data.yield_strength || '',
        ultimate_deformation: data.ultimate_deformation || '',
        stiffness: data.stiffness || '',
        loading_rate: data.loading_rate || '',
        energy_absorption: data.energy_absorption || '',
        number_of_drops: data.number_of_drops || '',
      });
    } catch (err) {
      console.error('Failed to fetch test details', err);
    }
    setLoadingDetails(false);
  };

  const handleSave = async () => {
    if (!form.bolt) return;
    try {
      const payload = {
        bolt: parseInt(form.bolt),
        methodology: form.methodology,
        facility: form.facility,
        installation_method: form.installation_method,
        encapsulation_method: form.encapsulation_method,
        peak_strength: form.peak_strength ? parseFloat(form.peak_strength) : null,
        bond_strength: form.bond_strength ? parseFloat(form.bond_strength) : null,
        yield_strength: form.yield_strength ? parseFloat(form.yield_strength) : null,
        ultimate_deformation: form.ultimate_deformation ? parseFloat(form.ultimate_deformation) : null,
        stiffness: form.stiffness ? parseFloat(form.stiffness) : null,
        loading_rate: form.loading_rate ? parseFloat(form.loading_rate) : null,
        energy_absorption: form.energy_absorption ? parseFloat(form.energy_absorption) : null,
        number_of_drops: form.number_of_drops ? parseInt(form.number_of_drops) : null,
      };
      if (modal === 'add') {
        await post(`${API_BASE}/admin/tests/`, payload);
      } else {
        await put(`${API_BASE}/admin/tests/${editing.id}/`, payload);
      }
      setModal(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to save test', err);
    }
  };

  const handleDelete = async () => {
    try {
      await del(`${API_BASE}/admin/tests/${deleteId}/`);
      setDeleteId(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete test', err);
    }
  };

  const handlePublishToggle = async (testId, currentStatus) => {
    try {
      await patch(`${API_BASE}/admin/tests/${testId}/publish/`, { is_published: !currentStatus });
      setDetailedTest({ ...detailedTest, is_published: !currentStatus });
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle publish status', err);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading tests...</p>;

  const itemsPerPage = 10;
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalCount);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{startIndex}-{endIndex} of {totalCount} test(s)</p>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Test
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3 font-semibold text-slate-600">Product</th>
              <th className="px-5 py-3 font-semibold text-slate-600">Methodology</th>
              <th className="px-5 py-3 font-semibold text-slate-600">Facility</th>
              <th className="px-5 py-3 font-semibold text-slate-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tests.map(t => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-800 max-w-[200px] truncate">{t.bolt?.name || t.bolt}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.methodology === 'dynamic' ? 'bg-amber-50 text-amber-700' : 'bg-teal-50 text-teal-700'}`}>
                    {t.methodology}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-500">{t.facility}</td>
                <td className="px-5 py-3 text-right space-x-2">
                  <button onClick={() => openEdit(t)} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1">
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => setDeleteId(t.id)} className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center">
        <button 
          onClick={onPrevPage} 
          disabled={!prevUrl}
          className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          ← Previous
        </button>
        <p className="text-sm text-slate-600 font-medium">Page {currentPage}</p>
        <button 
          onClick={onNextPage} 
          disabled={!nextUrl}
          className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          Next →
        </button>
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Test' : `Edit Test #${editing?.id}`} onClose={() => setModal(null)}>
          {loadingDetails && modal === 'edit' ? (
            <p className="text-sm text-slate-500">Loading test details...</p>
          ) : (
            <div className="space-y-4">
              {/* Test ID Display (Edit Mode) */}
              {modal === 'edit' && detailedTest && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                  <p className="text-sm text-slate-600"><span className="font-medium">Test ID:</span> {detailedTest.id}</p>
                </div>
              )}

              {/* Product & Bolt ID */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                  <div className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-600">
                    {modal === 'edit' && detailedTest ? detailedTest.bolt?.name || detailedTest.bolt : 'Select a product'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bolt ID *</label>
                  <input type="number" value={form.bolt} onChange={e => setForm({ ...form, bolt: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 1" />
                </div>
              </div>

              {/* Basic Test Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Methodology *</label>
                  <select value={form.methodology} onChange={e => setForm({ ...form, methodology: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="dynamic">Dynamic</option>
                    <option value="static">Static</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Facility *</label>
                  <select value={form.facility} onChange={e => {setForm({ ...form, facility: e.target.value }); setCustomFacility('');}}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select facility...</option>
                    {filterOptions.facilities?.map(f => <option key={f}>{f}</option>)}
                    <option value="Custom">Custom...</option>
                  </select>
                  {form.facility === 'Custom' && (
                    <input value={customFacility} onChange={e => {setCustomFacility(e.target.value); setForm({ ...form, facility: e.target.value });}}
                      placeholder="Enter custom facility" className="w-full mt-2 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  )}
                </div>
              </div>

              {/* Installation & Encapsulation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Installation Method</label>
                  <input value={form.installation_method} onChange={e => setForm({ ...form, installation_method: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Grouted" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Encapsulation Method</label>
                  <input value={form.encapsulation_method} onChange={e => setForm({ ...form, encapsulation_method: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Resin" />
                </div>
              </div>

              {/* Strength Values */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Peak Strength (kN)</label>
                  <input type="number" step="0.01" value={form.peak_strength} onChange={e => setForm({ ...form, peak_strength: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 36.03" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bond Strength (MPa)</label>
                  <input type="number" step="0.01" value={form.bond_strength} onChange={e => setForm({ ...form, bond_strength: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 5.2" />
                </div>
              </div>

              {/* Yield & Deformation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Yield Strength (kN)</label>
                  <input type="number" step="0.01" value={form.yield_strength} onChange={e => setForm({ ...form, yield_strength: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 28.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ultimate Deformation (mm)</label>
                  <input type="number" step="0.01" value={form.ultimate_deformation} onChange={e => setForm({ ...form, ultimate_deformation: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 12.3" />
                </div>
              </div>

              {/* Loading & Energy */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stiffness (N/mm)</label>
                  <input type="number" step="0.01" value={form.stiffness} onChange={e => setForm({ ...form, stiffness: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 450" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Loading Rate (mm/min)</label>
                  <input type="number" step="0.01" value={form.loading_rate} onChange={e => setForm({ ...form, loading_rate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 2.5" />
                </div>
              </div>

              {/* Energy & Drops */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Energy Absorption (J)</label>
                  <input type="number" step="0.01" value={form.energy_absorption} onChange={e => setForm({ ...form, energy_absorption: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 156.8" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Number of Drops</label>
                  <input type="number" step="1" value={form.number_of_drops} onChange={e => setForm({ ...form, number_of_drops: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 5" />
                </div>
              </div>

              {/* Published Status - Only in Edit Mode */}
              {modal === 'edit' && detailedTest && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Status:</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${detailedTest.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {detailedTest.is_published ? '✓ Published' : '○ Draft'}
                      </span>
                    </div>
                    <button 
                      onClick={() => handlePublishToggle(detailedTest.id, detailedTest.is_published)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium text-white ${detailedTest.is_published ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      {detailedTest.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 font-medium">
                  Cancel
                </button>
                <button onClick={handleSave} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1 font-medium">
                  <Check className="w-4 h-4" /> {modal === 'add' ? 'Create' : 'Update'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {deleteId && (
        <Modal title="Confirm Delete" onClose={() => setDeleteId(null)}>
          <p className="text-sm text-slate-600 mb-4">Are you sure you want to delete this test record?</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// --- Main Export ---
export default function ManageDataPanel() {
  const [tab, setTab] = useState('products');
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [tests, setTests] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ categories: [], facilities: [] });
  
  // Pagination state for products
  const [productsPagination, setProductsPagination] = useState({
    currentPage: 1,
    totalCount: 0,
    nextUrl: null,
    prevUrl: null,
  });

  // Pagination state for suppliers
  const [suppliersPagination, setSuppliersPagination] = useState({
    currentPage: 1,
    totalCount: 0,
    nextUrl: null,
    prevUrl: null,
  });

  // Pagination state for tests
  const [testsPagination, setTestsPagination] = useState({
    currentPage: 1,
    totalCount: 0,
    nextUrl: null,
    prevUrl: null,
  });

  const authHeader = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [suppliersData, productsData, testsData, filterData] = await Promise.all([
        get(`${API_BASE}/admin/suppliers/?page=1`),
        get(`${API_BASE}/admin/bolts/?page=1`),
        get(`${API_BASE}/admin/tests/?page=1`),
        get(`${API_BASE}/public/filter-options/`)
      ]);

      setSuppliers(suppliersData.results || suppliersData);
      setSuppliersPagination({
        currentPage: 1,
        totalCount: suppliersData.count || 0,
        nextUrl: suppliersData.next || null,
        prevUrl: suppliersData.previous || null,
      });

      setProducts(productsData.results || productsData);
      setProductsPagination({
        currentPage: 1,
        totalCount: productsData.count || 0,
        nextUrl: productsData.next || null,
        prevUrl: productsData.previous || null,
      });

      setTests(testsData.results || testsData);
      setTestsPagination({
        currentPage: 1,
        totalCount: testsData.count || 0,
        nextUrl: testsData.next || null,
        prevUrl: testsData.previous || null,
      });

      setFilterOptions({
        categories: filterData.categories || [],
        facilities: filterData.facilities || [],
      });
    } catch (err) {
      console.error('Failed to fetch data', err);
    }
    setLoading(false);
  };

  const handleNextPage = async (paginationState, setPaginationState, dataSetFn) => {
    if (!paginationState.nextUrl) return;
    setLoading(true);
    try {
      const url = new URL(paginationState.nextUrl);
      const pathAndQuery = url.pathname + url.search;
      const data = await get(pathAndQuery);
      dataSetFn(data.results || data);
      setPaginationState({
        currentPage: paginationState.currentPage + 1,
        totalCount: data.count || 0,
        nextUrl: data.next || null,
        prevUrl: data.previous || null,
      });
    } catch (err) {
      console.error('Failed to fetch next page', err);
    }
    setLoading(false);
  };

  const handlePrevPage = async (paginationState, setPaginationState, dataSetFn) => {
    if (!paginationState.prevUrl) return;
    setLoading(true);
    try {
      const url = new URL(paginationState.prevUrl);
      const pathAndQuery = url.pathname + url.search;
      const data = await get(pathAndQuery);
      dataSetFn(data.results || data);
      setPaginationState({
        currentPage: paginationState.currentPage - 1,
        totalCount: data.count || 0,
        nextUrl: data.next || null,
        prevUrl: data.previous || null,
      });
    } catch (err) {
      console.error('Failed to fetch previous page', err);
    }
    setLoading(false);
  };

  const tabs = [
    { id: 'suppliers', label: 'Suppliers', icon: Building2 },
    { id: 'products', label: 'Products (Bolts)', icon: Package },
    { id: 'tests', label: 'Tests', icon: Database },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h3 className="text-2xl font-bold text-slate-800">Manage Data</h3>
        <p className="text-sm text-slate-500 mt-1">View, add, edit, or delete records in the database.</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'suppliers' && (
        <SuppliersTab 
          suppliers={suppliers} 
          loading={loading} 
          onRefresh={fetchAllData}
          currentPage={suppliersPagination.currentPage}
          totalCount={suppliersPagination.totalCount}
          nextUrl={suppliersPagination.nextUrl}
          prevUrl={suppliersPagination.prevUrl}
          onNextPage={() => handleNextPage(suppliersPagination, setSuppliersPagination, setSuppliers)}
          onPrevPage={() => handlePrevPage(suppliersPagination, setSuppliersPagination, setSuppliers)}
        />
      )}
      {tab === 'products' && (
        <ProductsTab 
          products={products} 
          suppliers={suppliers} 
          filterOptions={filterOptions} 
          loading={loading} 
          onRefresh={fetchAllData}
          currentPage={productsPagination.currentPage}
          totalCount={productsPagination.totalCount}
          nextUrl={productsPagination.nextUrl}
          prevUrl={productsPagination.prevUrl}
          onNextPage={() => handleNextPage(productsPagination, setProductsPagination, setProducts)}
          onPrevPage={() => handlePrevPage(productsPagination, setProductsPagination, setProducts)}
        />
      )}
      {tab === 'tests' && (
        <TestsTab 
          tests={tests} 
          products={products} 
          filterOptions={filterOptions}
          loading={loading} 
          onRefresh={fetchAllData}
          currentPage={testsPagination.currentPage}
          totalCount={testsPagination.totalCount}
          nextUrl={testsPagination.nextUrl}
          prevUrl={testsPagination.prevUrl}
          onNextPage={() => handleNextPage(testsPagination, setTestsPagination, setTests)}
          onPrevPage={() => handlePrevPage(testsPagination, setTestsPagination, setTests)}
        />
      )}
    </div>
  );
}