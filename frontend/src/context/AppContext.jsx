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
        // Ensure data has expected structure with defaults
        const lengthRangeData = data?.length_range;
        const normalizedData = {
          categories: data?.categories || [],
          suppliers: data?.suppliers || [],
          facilities: data?.facilities || [],
          methodologies: data?.methodologies || [],
          length_range: (lengthRangeData && lengthRangeData.min != null && lengthRangeData.max != null) 
            ? lengthRangeData 
            : { min: 0, max: 10 }
        };
        setFilterOptions(normalizedData);
      })
      .catch(err => {
        console.error("Error fetching filter options:", err);
        // Set safe defaults on error
        setFilterOptions({
          categories: [],
          suppliers: [],
          facilities: [],
          methodologies: [],
          length_range: { min: 0, max: 10 }
        });
      });
  }, []);

  // Filter State
  const [supportType] = useState('rockbolt');
  const [methodology, setMethodology] = useState('dynamic');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [selectedLengthRange, setSelectedLengthRange] = useState(null);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [showAverage, setShowAverage] = useState(false);

  const triggerSearch = (filters) => {
    setSelectedCategories(filters.categories || []);
    setSelectedSuppliers(filters.suppliers || []);
    setSelectedLengthRange(filters.lengthRange || null);

    const params = new URLSearchParams({ limit: 100 });
    
    // Add categories (multi-select - comma-separated)
    if (filters.categories && filters.categories.length > 0) {
      params.append('categories', filters.categories.join(','));
    }
    
    // Add suppliers (multi-select - use supplier IDs, comma-separated)
    if (filters.suppliers && filters.suppliers.length > 0) {
      const supplierIds = filters.suppliers
        .map(supplier => supplierNameToIdMap[supplier])
        .filter(id => id !== undefined);
      if (supplierIds.length > 0) {
        params.append('suppliers', supplierIds.join(','));
      }
    }
    
    // Add length range (min/max)
    if (filters.lengthRange) {
      if (filters.lengthRange.min !== undefined && filters.lengthRange.min !== null) {
        params.append('min_length', filters.lengthRange.min);
      }
      if (filters.lengthRange.max !== undefined && filters.lengthRange.max !== null) {
        params.append('max_length', filters.lengthRange.max);
      }
    }

    fetch(`/api/public/bolts/?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        const bolts = (data?.results || []).map(b => ({
          id: b?.id,
          supplier: b?.supplier?.name || 'Unknown',
          product_name: b?.name || 'Unknown Product',
          bolt_length: String(b?.length || 0),
          bolt_category: b?.category || 'Unknown'
        }));
        setProducts(bolts);
        setSelectedProductIds([]); // Do not auto-select products
      })
      .catch(err => {
        console.error("Error fetching bolts:", err);
        setProducts([]); // Set empty array on error
      });
  };

  // Categories derived from API data for dropdowns
  const categories = useMemo(() => ['All', ...filterOptions.categories], [filterOptions.categories]);
  const suppliers = useMemo(() => ['All', ...filterOptions.suppliers.map(s => s.name || s)], [filterOptions.suppliers]);
  const supplierNameToIdMap = useMemo(() => {
    const map = {};
    filterOptions.suppliers.forEach(s => {
      map[s.name] = s.id;
    });
    return map;
  }, [filterOptions.suppliers]);
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
    let testsUrl = `/api/public/tests/?bolt_ids=${idsParams}&methodology=${methodology}`;
    
    // Add facilities filter if any are selected
    if (selectedFacilities && selectedFacilities.length > 0) {
      const facilitiesParam = selectedFacilities.join(',');
      testsUrl += `&facilities=${encodeURIComponent(facilitiesParam)}`;
    }
    
    fetch(testsUrl)
      .then(res => res.json())
      .then(data => {
        if (!data || typeof data !== 'object') {
          console.warn("Invalid data structure from tests API");
          setApiTests([]);
          setApiCurves([]);
          setApiStats({});
          return;
        }
        
        const nextTests = [];
        const nextCurves = [];
        const nextStats = {};
        
        Object.entries(data).forEach(([boltId, boltData]) => {
          if (!boltData) return;
          
          const numBoltId = isNaN(boltId) ? boltId : Number(boltId);
          const tests = boltData?.tests || [];
          
          tests.forEach(t => {
            if (!t?.id) return;
            
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
            
            if (t.curve?.curve_pair && Array.isArray(t.curve.curve_pair)) {
              t.curve.curve_pair.forEach(pt => {
                if (pt?.displacement != null && pt?.load != null) {
                  nextCurves.push({ test_id: t.id, disp: pt.displacement, load: pt.load });
                }
              });
            }
          });
          
          nextStats[numBoltId] = boltData.stats || {};
        });
        
        setApiTests(nextTests);
        setApiCurves(nextCurves);
        setApiStats(nextStats);
      })
      .catch(err => {
        console.error("Error fetching tests:", err);
        setApiTests([]);
        setApiCurves([]);
        setApiStats({});
      });
  }, [selectedProductIds, methodology, selectedFacilities]);

  const filteredTests = useMemo(() => {
    if (!apiTests || !Array.isArray(apiTests)) return [];
    // If no facilities selected, show all tests
    if (selectedFacilities.length === 0) return apiTests;
    // Otherwise, filter to only include tests from selected facilities
    return apiTests.filter(t => selectedFacilities.includes(t?.test_facility));
  }, [apiTests, selectedFacilities]);

  // When facility filter is applied, we only want curves from the filtered tests
  const filteredCurves = useMemo(() => {
    if (!filteredTests || !Array.isArray(filteredTests) || !apiCurves || !Array.isArray(apiCurves)) return [];
    const testIds = new Set(filteredTests.map(t => t?.test_id));
    return apiCurves.filter(c => testIds.has(c?.test_id));
  }, [filteredTests, apiCurves]);

  const toggleProductSelection = (productId) => {
    setSelectedProductIds(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedSuppliers([]);
    setSelectedLengthRange(null);
    setSelectedFacilities([]);
    setSelectedProductIds([]);
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
    selectedCategories, setSelectedCategories,
    selectedSuppliers, setSelectedSuppliers,
    selectedLengthRange, setSelectedLengthRange,
    selectedFacilities, setSelectedFacilities,
    showAverage, setShowAverage,
    selectedProductIds, setSelectedProductIds,
    categories, suppliers, lengthRange, facilities,
    filteredProductsList, productColorMap,
    filteredTests, filteredCurves,
    toggleProductSelection, triggerSearch, resetFilters
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
