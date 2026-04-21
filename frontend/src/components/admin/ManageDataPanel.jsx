import React, { useState } from 'react';
import { Plus, Edit, Trash2, X, Check, Database, Package, Building2 } from 'lucide-react';

// --- Mock Data ---
const INIT_SUPPLIERS = [
  { id: 's1', name: 'Supplier A', contact: 'supplier_a@example.com' },
  { id: 's2', name: 'Supplier B', contact: 'supplier_b@example.com' },
];

const INIT_PRODUCTS = [
  { id: 'p1', supplier: 'Supplier A', product_name: 'Hollow Core Bolt D28 x 2.4 m', bolt_length: '2.4', bolt_diameter: '28', bolt_category: 'Encapsulated' },
  { id: 'p2', supplier: 'Supplier A', product_name: 'Yielding Bolt B D20 mm x 3.0 m', bolt_length: '3.0', bolt_diameter: '20', bolt_category: 'Friction' },
  { id: 'p3', supplier: 'Supplier B', product_name: 'Resin Bolt A D20 mm x 2.4 m', bolt_length: '2.4', bolt_diameter: '20', bolt_category: 'Encapsulated' },
];

const INIT_TESTS = [
  { id: 't1', product_name: 'Hollow Core Bolt D28 x 2.4 m', test_methodology: 'dynamic', test_facility: 'Facility A', peak_strength: '36.03' },
  { id: 't2', product_name: 'Hollow Core Bolt D28 x 2.4 m', test_methodology: 'dynamic', test_facility: 'Facility A', peak_strength: '45.08' },
  { id: 't3', product_name: 'Resin Bolt A D20 mm x 2.4 m', test_methodology: 'static', test_facility: 'Facility B', peak_strength: '28.86' },
];

// --- Reusable Modal ---
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// --- Suppliers Tab ---
function SuppliersTab() {
  const [suppliers, setSuppliers] = useState(INIT_SUPPLIERS);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', contact: '' });
  const [deleteId, setDeleteId] = useState(null);

  const openAdd = () => { setForm({ name: '', contact: '' }); setModal('add'); };
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, contact: s.contact }); setModal('edit'); };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (modal === 'add') {
      setSuppliers([...suppliers, { id: 's' + Date.now(), ...form }]);
    } else {
      setSuppliers(suppliers.map(s => s.id === editing.id ? { ...s, ...form } : s));
    }
    setModal(null);
  };

  const handleDelete = () => {
    setSuppliers(suppliers.filter(s => s.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{suppliers.length} supplier(s) in database</p>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3 font-semibold text-slate-600">Name</th>
              <th className="px-5 py-3 font-semibold text-slate-600">Contact</th>
              <th className="px-5 py-3 font-semibold text-slate-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suppliers.map(s => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-800">{s.name}</td>
                <td className="px-5 py-3 text-slate-500">{s.contact}</td>
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

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Supplier' : 'Edit Supplier'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Supplier C" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
              <input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. contact@supplier.com" />
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
          <p className="text-sm text-slate-600 mb-4">Are you sure you want to delete this supplier? This action cannot be undone.</p>
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
function ProductsTab() {
  const [products, setProducts] = useState(INIT_PRODUCTS);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const emptyForm = { supplier: '', product_name: '', bolt_length: '', bolt_diameter: '', bolt_category: 'Encapsulated' };
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => { setForm(emptyForm); setModal('add'); };
  const openEdit = (p) => { setEditing(p); setForm({ supplier: p.supplier, product_name: p.product_name, bolt_length: p.bolt_length, bolt_diameter: p.bolt_diameter, bolt_category: p.bolt_category }); setModal('edit'); };

  const handleSave = () => {
    if (!form.product_name.trim()) return;
    if (modal === 'add') {
      setProducts([...products, { id: 'p' + Date.now(), ...form }]);
    } else {
      setProducts(products.map(p => p.id === editing.id ? { ...p, ...form } : p));
    }
    setModal(null);
  };

  const handleDelete = () => {
    setProducts(products.filter(p => p.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{products.length} product(s) in database</p>
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
                <td className="px-5 py-3 font-medium text-slate-800 max-w-[200px] truncate">{p.product_name}</td>
                <td className="px-5 py-3 text-slate-500">{p.supplier}</td>
                <td className="px-5 py-3">
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium">{p.bolt_category}</span>
                </td>
                <td className="px-5 py-3 text-slate-500">{p.bolt_length}</td>
                <td className="px-5 py-3 text-slate-500">{p.bolt_diameter}</td>
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

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Product' : 'Edit Product'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
              <input value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Resin Bolt D20 x 2.4 m" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
                <input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Supplier A" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select value={form.bolt_category} onChange={e => setForm({ ...form, bolt_category: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {['Encapsulated', 'Friction', 'Hybrid', 'Cable'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Length (m)</label>
                <input value={form.bolt_length} onChange={e => setForm({ ...form, bolt_length: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 2.4" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Diameter (mm)</label>
                <input value={form.bolt_diameter} onChange={e => setForm({ ...form, bolt_diameter: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 20" />
              </div>
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
function TestsTab() {
  const [tests, setTests] = useState(INIT_TESTS);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const emptyForm = { product_name: '', test_methodology: 'dynamic', test_facility: '', peak_strength: '' };
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => { setForm(emptyForm); setModal('add'); };
  const openEdit = (t) => { setEditing(t); setForm({ product_name: t.product_name, test_methodology: t.test_methodology, test_facility: t.test_facility, peak_strength: t.peak_strength }); setModal('edit'); };

  const handleSave = () => {
    if (!form.product_name.trim()) return;
    if (modal === 'add') {
      setTests([...tests, { id: 't' + Date.now(), ...form }]);
    } else {
      setTests(tests.map(t => t.id === editing.id ? { ...t, ...form } : t));
    }
    setModal(null);
  };

  const handleDelete = () => {
    setTests(tests.filter(t => t.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{tests.length} test(s) in database</p>
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
              <th className="px-5 py-3 font-semibold text-slate-600">Peak Strength (kN)</th>
              <th className="px-5 py-3 font-semibold text-slate-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tests.map(t => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-800 max-w-[200px] truncate">{t.product_name}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.test_methodology === 'dynamic' ? 'bg-amber-50 text-amber-700' : 'bg-teal-50 text-teal-700'}`}>
                    {t.test_methodology}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-500">{t.test_facility}</td>
                <td className="px-5 py-3 text-slate-500 font-mono">{t.peak_strength}</td>
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

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Test' : 'Edit Test'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
              <input value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Hollow Core Bolt D28 x 2.4 m" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Methodology</label>
                <select value={form.test_methodology} onChange={e => setForm({ ...form, test_methodology: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="dynamic">Dynamic</option>
                  <option value="static">Static</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Test Facility</label>
                <input value={form.test_facility} onChange={e => setForm({ ...form, test_facility: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Facility A" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Peak Strength (kN)</label>
              <input value={form.peak_strength} onChange={e => setForm({ ...form, peak_strength: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 36.03" />
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

      {tab === 'suppliers' && <SuppliersTab />}
      {tab === 'products' && <ProductsTab />}
      {tab === 'tests' && <TestsTab />}
    </div>
  );
}