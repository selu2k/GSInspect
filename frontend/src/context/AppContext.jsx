import React, { createContext, useState, useEffect, useMemo, useContext } from 'react';

const MOCK_PRODUCTS = [
  { id: 'p1', supplier: 'Supplier A', product_name: 'Hollow Core Bolt D28 x 2.4 m', bolt_length: '2.4', bolt_category: 'Encapsulated' },
  { id: 'p2', supplier: 'Supplier A', product_name: 'Yielding Bolt B D20 mm x 3.0 m', bolt_length: '3.0', bolt_category: 'Friction' },
  { id: 'p3', supplier: 'Supplier B', product_name: 'Resin Bolt A D20 mm x 2.4 m', bolt_length: '2.4', bolt_category: 'Encapsulated' },
  { id: 'p4', supplier: 'Supplier C', product_name: 'Cable Bolt 6.0 m', bolt_length: '6.0', bolt_category: 'Cable' },
];

const MOCK_TESTS = [
  { test_id: '10', product_id: 'p1', test_methodology: 'dynamic', test_facility: 'Facility A', peak_strength: 303.1, bond_strength: null, yield_strength: 180, ultimate_deformation: 216, stiffness: null, installation_method: "Manual or Handheld", loading_rate: null, encapsulation_method: "Capsule", energy_absorption: 25, number_of_drops: 1 },
  { test_id: '11', product_id: 'p1', test_methodology: 'dynamic', test_facility: 'Facility A', peak_strength: 295.4, bond_strength: null, yield_strength: 175, ultimate_deformation: 210, stiffness: null, installation_method: "Manual or Handheld", loading_rate: null, encapsulation_method: "Capsule", energy_absorption: 24, number_of_drops: 1 },
  { test_id: '17', product_id: 'p2', test_methodology: 'dynamic', test_facility: 'Facility B', peak_strength: 37.6, bond_strength: null, yield_strength: 30, ultimate_deformation: 158, stiffness: null, installation_method: "Jumbo", loading_rate: null, encapsulation_method: "Resin", energy_absorption: null, number_of_drops: 2 },
  { test_id: '18', product_id: 'p2', test_methodology: 'static', test_facility: 'Facility B', peak_strength: 40.0, bond_strength: 15.5, yield_strength: 32, ultimate_deformation: 160, stiffness: 200, installation_method: "Jumbo", loading_rate: '1mm/min', encapsulation_method: "Resin", energy_absorption: null, number_of_drops: null },
  { test_id: '19', product_id: 'p3', test_methodology: 'dynamic', test_facility: 'Facility C', peak_strength: 230.1, bond_strength: null, yield_strength: 150, ultimate_deformation: 180, stiffness: null, installation_method: "Manual", loading_rate: null, encapsulation_method: "Grout", energy_absorption: 18, number_of_drops: 1 },
  { test_id: '20', product_id: 'p3', test_methodology: 'dynamic', test_facility: 'Facility C', peak_strength: 242.6, bond_strength: null, yield_strength: 145, ultimate_deformation: 185, stiffness: null, installation_method: "Manual", loading_rate: null, encapsulation_method: "Grout", energy_absorption: 19, number_of_drops: 1 }
];

const MOCK_CURVES = [
  { test_id: '10', disp: 0, load: 0 }, { test_id: '10', disp: 0.5, load: 186.8 }, { test_id: '10', disp: 2.0, load: 269.3 }, { test_id: '10', disp: 4.0, load: 303.1 },
  { test_id: '11', disp: 0, load: 0 }, { test_id: '11', disp: 0.5, load: 180.0 }, { test_id: '11', disp: 2.0, load: 260.0 }, { test_id: '11', disp: 3.5, load: 295.4 },
  { test_id: '17', disp: 0, load: 0 }, { test_id: '17', disp: 50, load: 30.0 }, { test_id: '17', disp: 100, load: 35.0 }, { test_id: '17', disp: 158, load: 37.6 },
  { test_id: '19', disp: 0, load: 0 }, { test_id: '19', disp: 1.0, load: 150.0 }, { test_id: '19', disp: 3.0, load: 225.5 }, { test_id: '19', disp: 3.8, load: 230.1 },
  { test_id: '20', disp: 0, load: 0 }, { test_id: '20', disp: 1.2, load: 145.0 }, { test_id: '20', disp: 2.8, load: 218.0 }, { test_id: '20', disp: 4.1, load: 242.6 }
];

// 
const TAILWIND_COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-pink-500', 'bg-teal-500', 'bg-rose-500', 'bg-yellow-500'];
const HEX_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#eab308'];

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [userRole, setUserRole] = useState('admin');

  // Filter State
  const [supportType] = useState('rockbolt');
  const [methodology, setMethodology] = useState('dynamic');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSupplier, setSelectedSupplier] = useState('All');
  const [selectedLength, setSelectedLength] = useState('All');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState('All');
  const [showAverage, setShowAverage] = useState(false);

  // Categories derived
  const categories = ['All', ...new Set(MOCK_PRODUCTS.map(p => p.bolt_category))];
  const suppliers = ['All', ...new Set(MOCK_PRODUCTS.map(p => p.supplier))];
  const lengths = ['All', ...new Set(MOCK_PRODUCTS.map(p => p.bolt_length))];
  const facilities = ['All', ...new Set(MOCK_TESTS.map(t => t.test_facility))];

  const filteredProductsList = useMemo(() => {
    return MOCK_PRODUCTS.filter(p => 
      (selectedCategory === 'All' || p.bolt_category === selectedCategory) &&
      (selectedSupplier === 'All' || p.supplier === selectedSupplier) &&
      (selectedLength === 'All' || p.bolt_length === selectedLength)
    );
  }, [selectedCategory, selectedSupplier, selectedLength]);

  const productColorMap = useMemo(() => {
    const map = {};
    filteredProductsList.forEach((p, index) => {
      map[p.id] = { tailwind: TAILWIND_COLORS[index % 8], hex: HEX_COLORS[index % 8] };
    });
    return map;
  }, [filteredProductsList]);

  useEffect(() => {
    setSelectedProductIds(filteredProductsList.map(p => p.id));
  }, [filteredProductsList]);

  const filteredTests = useMemo(() => {
    return MOCK_TESTS.filter(t => 
      t.test_methodology === methodology &&
      selectedProductIds.includes(t.product_id) &&
      (selectedFacility === 'All' || t.test_facility === selectedFacility)
    );
  }, [methodology, selectedProductIds, selectedFacility]);

  const filteredCurves = useMemo(() => {
    const testIds = filteredTests.map(t => t.test_id);
    return MOCK_CURVES.filter(c => testIds.includes(c.test_id));
  }, [filteredTests]);

  const toggleProductSelection = (productId) => {
    setSelectedProductIds(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const value = {
    userRole,
    setUserRole,
    MOCK_PRODUCTS,
    MOCK_TESTS,
    MOCK_CURVES,
    supportType,
    methodology, setMethodology,
    selectedCategory, setSelectedCategory,
    selectedSupplier, setSelectedSupplier,
    selectedLength, setSelectedLength,
    selectedFacility, setSelectedFacility,
    showAverage, setShowAverage,
    selectedProductIds, setSelectedProductIds,
    categories, suppliers, lengths, facilities,
    filteredProductsList, productColorMap,
    filteredTests, filteredCurves,
    toggleProductSelection
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
