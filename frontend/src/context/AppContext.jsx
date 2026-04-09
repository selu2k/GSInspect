import React, { createContext, useState, useEffect, useMemo, useContext } from 'react';

// 
const TAILWIND_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 
  'bg-pink-500', 'bg-teal-500', 'bg-rose-500', 'bg-yellow-500',
  'bg-indigo-500', 'bg-cyan-500', 'bg-lime-500', 'bg-fuchsia-500',
  'bg-red-500', 'bg-orange-500', 'bg-green-500', 'bg-sky-500'
];
const HEX_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#14b8a6', '#f43f5e', '#eab308',
  '#6366f1', '#06b6d4', '#84cc16', '#d946ef',
  '#ef4444', '#f97316', '#22c55e', '#0ea5e9'
];

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [userRole, setUserRole] = useState('admin');

  const [products, setProducts] = useState([]);
  const [apiTests, setApiTests] = useState([]);
  const [apiCurves, setApiCurves] = useState([]);
  const [apiStats, setApiStats] = useState({});

  // Filter Options Data from API
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    suppliers: [],
    facilities: [],
    methodologies: [],
    length_range: { min: 0, max: 10 }
  });

  useEffect(() => {
    fetch('/api/public/filter-options/')
      .then(res => res.json())
      .then(data => {
        setFilterOptions(data);
      })
      .catch(err => console.error("Error fetching filter options:", err));
  }, []);

  // Filter State
  const [supportType] = useState('rockbolt');
  const [methodology, setMethodology] = useState('dynamic');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSupplier, setSelectedSupplier] = useState('All');
  const [selectedLength, setSelectedLength] = useState('All');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState('All');
  const [showAverage, setShowAverage] = useState(false);

  const triggerSearch = (filters) => {
    setSelectedCategory(filters.category);
    setSelectedSupplier(filters.supplier);
    setSelectedLength(filters.length);

    const params = new URLSearchParams({ limit: 100 });
    if (filters.category !== 'All') params.append('category', filters.category);
    if (filters.supplier !== 'All') params.append('supplier', filters.supplier);
    if (filters.length !== 'All') params.append('length', filters.length);

    fetch(`/api/public/bolts/?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        const bolts = (data.results || []).map(b => ({
          id: b.id,
          supplier: b.supplier.name,
          product_name: b.name,
          bolt_length: String(b.length),
          bolt_category: b.category
        }));
        setProducts(bolts);
        setSelectedProductIds([]); // Do not auto-select products
      })
      .catch(err => console.error("Error fetching bolts:", err));
  };

  // Categories derived from API data for dropdowns
  const categories = useMemo(() => ['All', ...filterOptions.categories], [filterOptions.categories]);
  const suppliers = useMemo(() => ['All', ...filterOptions.suppliers.map(s => s.name || s)], [filterOptions.suppliers]);
  const facilities = useMemo(() => ['All', ...filterOptions.facilities], [filterOptions.facilities]);
  const lengthRange = useMemo(() => filterOptions.length_range, [filterOptions.length_range]);
  
  const filteredProductsList = products;

  const productColorMap = useMemo(() => {
    const map = {};
    // Assign colors based on the order of selected products, not filter position
    selectedProductIds.forEach((productId, index) => {
      map[productId] = { tailwind: TAILWIND_COLORS[index % 16], hex: HEX_COLORS[index % 16] };
    });
    return map;
  }, [selectedProductIds]);

  useEffect(() => {
    if (selectedProductIds.length === 0) {
      setApiTests([]);
      setApiCurves([]);
      setApiStats({});
      return;
    }
    const idsParams = selectedProductIds.join(',');
    fetch(`/api/public/tests/?bolt_ids=${idsParams}&methodology=${methodology}`)
      .then(res => res.json())
      .then(data => {
        const nextTests = [];
         const nextCurves = [];
         const nextStats = {};
         Object.entries(data).forEach(([boltId, boltData]) => {
            const numBoltId = isNaN(boltId) ? boltId : Number(boltId);
            boltData.tests.forEach(t => {
               nextTests.push({
                  test_id: t.id,
                  product_id: numBoltId,
                  test_methodology: t.methodology,
                  test_facility: t.facility,
                  peak_strength: t.peak_strength,
                  yield_strength: t.yield_strength,
                  ultimate_deformation: t.ultimate_deformation,
                  energy_absorption: t.energy_absorption,
                  bond_strength: t.bond_strength,
                  stiffness: t.stiffness,
                  installation_method: t.installation_method,
                  encapsulation_method: t.encapsulation_method,
                  loading_rate: t.loading_rate,
                  number_of_drops: t.number_of_drops,
               });
               if (t.curve && t.curve.curve_pair) {
                  t.curve.curve_pair.forEach(pt => {
                     nextCurves.push({ test_id: t.id, disp: pt.displacement, load: pt.load });
                  });
               }
            });
            nextStats[numBoltId] = boltData.stats;
         });
         setApiTests(nextTests);
         setApiCurves(nextCurves);
         setApiStats(nextStats);
      })
      .catch(err => console.error("Error fetching tests:", err));
  }, [selectedProductIds, methodology]);

  const filteredTests = useMemo(() => {
    return apiTests.filter(t => 
      (selectedFacility === 'All' || t.test_facility === selectedFacility)
    );
  }, [apiTests, selectedFacility]);

  // When facility filter is applied, we only want curves from the filtered tests
  const filteredCurves = useMemo(() => {
    const testIds = new Set(filteredTests.map(t => t.test_id));
    return apiCurves.filter(c => testIds.has(c.test_id));
  }, [filteredTests, apiCurves]);

  const toggleProductSelection = (productId) => {
    setSelectedProductIds(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const value = {
    userRole,
    setUserRole,
    products,
    apiTests,
    apiCurves,
    apiStats,
    supportType,
    methodology, setMethodology,
    selectedCategory, setSelectedCategory,
    selectedSupplier, setSelectedSupplier,
    selectedLength, setSelectedLength,
    selectedFacility, setSelectedFacility,
    showAverage, setShowAverage,
    selectedProductIds, setSelectedProductIds,
    categories, suppliers, lengthRange, facilities,
    filteredProductsList, productColorMap,
    filteredTests, filteredCurves,
    toggleProductSelection, triggerSearch
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
