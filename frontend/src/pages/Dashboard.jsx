import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Layers, Gauge, Building2, TrendingUp } from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { useAppContext } from '../context/AppContext';
import MultiSelect from '../components/filters/MultiSelect';

export default function Dashboard() {
  const { 
    filteredProductsList, filteredTests, filteredCurves, productColorMap, apiStats,
    selectedProductIds, setSelectedProductIds, toggleProductSelection, showAverage, setShowAverage,
    methodology, setMethodology, selectedFacilities, setSelectedFacilities, facilities
  } = useAppContext();

  const [selectedProperty, setSelectedProperty] = useState('peak_strength');
  const [colorBy, setColorBy] = useState('product'); // 'product' or 'facility'
  const [selectedTestId, setSelectedTestId] = useState(null); // Track selected test for highlighting

  const tableRef = useRef(null); // Ref for detecting clicks outside table

  // Handle click outside table to deselect
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tableRef.current && !tableRef.current.contains(event.target)) {
        setSelectedTestId(null);
      }
    };

    if (selectedTestId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [selectedTestId]);
  const facilityColorPalette = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
    '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'
  ];
  const facilityColorMap = useMemo(() => {
    const map = {};
    if (facilities) {
      facilities.forEach((facility, index) => {
        map[facility] = facilityColorPalette[index % facilityColorPalette.length];
      });
    }
    return map;
  }, [facilities]);

  const plottedTests = useMemo(() => {
    if (!filteredTests || selectedProductIds.length === 0) return [];
    return filteredTests.filter((test) => selectedProductIds.includes(test.product_id));
  }, [filteredTests, selectedProductIds]);

  const chartSeries = useMemo(() => {
    if (!plottedTests || plottedTests.length === 0 || !filteredProductsList || !productColorMap) return [];
    const seenItems = new Set();
    return plottedTests
      .map((test) => {
        const product = filteredProductsList.find((item) => item.id === test.product_id);
        const productName = product ? product.product_name : 'Unknown Product';
        
        let label, color, key;
        if (colorBy === 'facility') {
          label = test.test_facility || 'Unknown Facility';
          const isFirst = !seenItems.has(label);
          if (isFirst) seenItems.add(label);
          color = facilityColorMap[label] || '#64748b';
          return {
            testId: test.test_id,
            dataKey: `test_${test.test_id}`,
            productId: test.product_id,
            facility: label,
            label: label,
            color: color,
            showInLegend: isFirst
          };
        } else {
          const isFirst = !seenItems.has(test.product_id);
          if (isFirst) seenItems.add(test.product_id);
          color = productColorMap[test.product_id]?.hex || '#64748b';
          return {
            testId: test.test_id,
            dataKey: `test_${test.test_id}`,
            productId: test.product_id,
            label: productName,
            color: color,
            showInLegend: isFirst
          };
        }
      });
  }, [plottedTests, filteredProductsList, productColorMap, colorBy, facilityColorMap]);

  const chartSeriesData = useMemo(() => {
    if (!selectedProductIds || !filteredProductsList || !productColorMap) return [];
    if (showAverage) {
      // Show average curves per product
      return selectedProductIds.map((productId) => {
        const product = filteredProductsList.find((p) => p.id === productId);
        const productName = product ? product.product_name : 'Unknown Product';
        return {
          testId: `avg_${productId}`,
          dataKey: `avg_${productId}`,
          productId: productId,
          label: `${productName} (Avg)`,
          color: productColorMap[productId]?.hex || '#64748b',
          showInLegend: true,
          isAverage: true
        };
      });
    }
    return chartSeries;
  }, [showAverage, selectedProductIds, chartSeries, filteredProductsList, productColorMap]);

  const chartData = useMemo(() => {
    if (!plottedTests || plottedTests.length === 0 || !filteredCurves) return [];

    const selectedTestIds = new Set(plottedTests.map((test) => test.test_id));
    const relevantCurves = filteredCurves.filter((point) => selectedTestIds.has(point.test_id));
    const uniqueDisplacements = [...new Set(relevantCurves.map((point) => point.disp))].sort((a, b) => a - b);
    const groupedByTest = relevantCurves.reduce((acc, point) => {
      if (!acc[point.test_id]) acc[point.test_id] = new Map();
      acc[point.test_id].set(point.disp, point.load);
      return acc;
    }, {});

    const baseData = uniqueDisplacements.map((disp) => {
      const row = { disp };
      plottedTests.forEach((test) => {
        const key = `test_${test.test_id}`;
        row[key] = groupedByTest[test.test_id]?.get(disp) ?? null;
      });
      return row;
    });

    if (!showAverage) return baseData;

    // Calculate average per product
    return baseData.map((row) => {
      const newRow = { ...row };
      const productTests = new Map();
      
      plottedTests.forEach((test) => {
        if (!productTests.has(test.product_id)) {
          productTests.set(test.product_id, []);
        }
        const key = `test_${test.test_id}`;
        if (row[key] != null) {
          productTests.get(test.product_id).push(row[key]);
        }
      });

      productTests.forEach((values, productId) => {
        if (values.length > 0) {
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          newRow[`avg_${productId}`] = avg;
        }
      });
      
      return newRow;
    });
  }, [plottedTests, filteredCurves, showAverage]);

  const productStats = useMemo(() => {
    if (!selectedProductIds || selectedProductIds.length === 0 || !filteredProductsList || !apiStats) return [];

    return selectedProductIds.map(productId => {
      const product = filteredProductsList.find(p => p.id === productId);
      const stats = apiStats?.[productId] || {};
      
      return {
        product,
        stats
      };
    });
  }, [selectedProductIds, apiStats, filteredProductsList]);

  const scatterData = useMemo(() => {
    if (!plottedTests || plottedTests.length === 0 || !selectedProperty) return [];
    
    return plottedTests
      .map((test) => {
        const product = filteredProductsList.find(p => p.id === test.product_id);
        const propertyValue = test[selectedProperty];
        
        if (propertyValue == null || isNaN(propertyValue)) return null;
        
        if (colorBy === 'facility') {
          const facilityList = facilities.filter(f => f !== 'All');
          const facilityIndex = facilityList.indexOf(test.test_facility || 'Unknown Facility');
          const color = facilityColorMap[test.test_facility] || '#cbd5e1';
          
          return {
            x: propertyValue,
            y: facilityIndex,
            productName: product?.product_name || 'Unknown',
            facility: test.test_facility || 'Unknown Facility',
            testId: test.test_id,
            color: color,
            productId: test.product_id,
            yLabel: test.test_facility || 'Unknown Facility'
          };
        } else {
          const productIndex = selectedProductIds.indexOf(test.product_id);
          const color = productColorMap[test.product_id]?.hex || '#cbd5e1';
          
          return {
            x: propertyValue,
            y: productIndex,
            productName: product?.product_name || 'Unknown',
            testId: test.test_id,
            color: color,
            productId: test.product_id
          };
        }
      })
      .filter(Boolean);
  }, [plottedTests, selectedProperty, filteredProductsList, selectedProductIds, productColorMap, colorBy, facilityColorMap, facilities]);

  // Binning function for histogram
  const createHistogramData = (data, binSize = 10) => {
    if (!data || data.length === 0) return [];

    const minVal = Math.floor(Math.min(...data.map(d => d.x)) / binSize) * binSize;
    const maxVal = Math.ceil(Math.max(...data.map(d => d.x)) / binSize) * binSize;
    
    const bins = {};
    for (let i = minVal; i < maxVal; i += binSize) {
      const binLabel = `${i}-${i + binSize}`;
      bins[binLabel] = {};
      bins[binLabel]._testIds = [];
      if (colorBy === 'facility') {
        facilities.filter(f => f !== 'All').forEach(facility => {
          bins[binLabel][facility] = 0;
        });
      } else {
        selectedProductIds.forEach(productId => {
          const product = filteredProductsList.find(p => p.id === productId);
          const productName = product?.product_name || 'Unknown';
          bins[binLabel][productName] = 0;
        });
      }
    }

    // Populate bins
    data.forEach(point => {
      const binIndex = Math.floor(point.x / binSize) * binSize;
      const binLabel = `${binIndex}-${binIndex + binSize}`;
      if (bins[binLabel]) {
        bins[binLabel]._testIds.push(point.testId);
        if (colorBy === 'facility') {
          bins[binLabel][point.facility] = (bins[binLabel][point.facility] || 0) + 1;
        } else {
          bins[binLabel][point.productName] = (bins[binLabel][point.productName] || 0) + 1;
        }
      }
    });

    return Object.entries(bins).map(([binLabel, counts]) => ({
      name: binLabel,
      ...counts
    }));
  };

  const histogramData = useMemo(() => {
    return createHistogramData(scatterData);
  }, [scatterData, colorBy]);

  // Guard against null/undefined API data
  if (!filteredProductsList || !filteredTests || !filteredCurves || !productColorMap || !apiStats) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500 italic">Loading data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pb-6">
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 shrink-0">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Products Matching Filters</h2>
          </div>
          {selectedProductIds.length > 0 && (
            <button
              onClick={() => setSelectedProductIds([])}
              className="text-xs text-slate-500 hover:text-slate-700 underline"
            >
              Clear selection
            </button>
          )}
        </div>

        {filteredProductsList.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No products currently match the selected filters.</p>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {filteredProductsList.map((product) => {
              const isSelected = selectedProductIds.includes(product.id);
              const color = productColorMap[product.id]?.hex || '#3b82f6';
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => toggleProductSelection(product.id)}
                  style={
                    isSelected
                      ? {
                          borderColor: color,
                          backgroundColor: `${color}15`,
                          color: color,
                        }
                      : {}
                  }
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors ${
                    !isSelected ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100' : 'font-medium'
                  }`}
                >
                  {product.product_name}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 shrink-0">
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2 rounded-lg shadow-md">
            <Gauge className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Test Filters</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-widest flex items-center gap-1.5 px-0.5">
              <Gauge className="w-3.5 h-3.5 text-slate-400" />
              Methodology
            </label>
            <div className="flex bg-slate-100 p-1.5 rounded-lg gap-1">
              <button 
                onClick={() => setMethodology('static')}
                className={`flex-1 text-xs py-1.5 px-2 rounded-md font-semibold transition-all ${
                  methodology === 'static' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200'
                }`}
              >
                Static
              </button>
              <button 
                onClick={() => setMethodology('dynamic')}
                className={`flex-1 text-xs py-1.5 px-2 rounded-md font-semibold transition-all ${
                  methodology === 'dynamic' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200'
                }`}
              >
                Dynamic
              </button>
            </div>
          </div>

          <MultiSelect
            label="Facility"
            options={facilities.filter(f => f !== 'All')}
            selectedValues={selectedFacilities}
            onChange={setSelectedFacilities}
            placeholder="Select facilities..."
            icon={Building2}
          />
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-5 flex-1 min-h-[400px] flex flex-col shrink-0">
        <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Force-Displacement Chart</h3>
            <span className="text-xs text-slate-500">{selectedProductIds.length} product(s) plotted</span>
          </div>
          {selectedProductIds.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                <button
                  onClick={() => setColorBy('product')}
                  className={`text-xs py-1.5 px-2.5 rounded-md font-semibold transition-all ${
                    colorBy === 'product'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  By Product
                </button>
                <button
                  onClick={() => setColorBy('facility')}
                  className={`text-xs py-1.5 px-2.5 rounded-md font-semibold transition-all ${
                    colorBy === 'facility'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  By Facility
                </button>
              </div>
              <button
                onClick={() => setShowAverage(!showAverage)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  showAverage
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                {showAverage ? 'Average On' : 'Show Average'}
              </button>
            </div>
          )}
        </div>

        {chartData.length === 0 ? (
          <div className="flex-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
            <p className="text-sm text-slate-500">
              {filteredProductsList.length === 0
                ? 'No curve data available for the selected filters.'
                : 'Click a product name above to add it to the graph.'}
            </p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 12, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="disp"
                  type="number"
                  domain={[0, 'auto']}
                  tick={{ fill: '#475569', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#94a3b8' }}
                  label={{ value: 'Displacement (mm)', position: 'insideBottom', offset: -4, fill: '#334155' }}
                />
                <YAxis
                  type="number"
                  domain={[0, 'auto']}
                  tick={{ fill: '#475569', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#94a3b8' }}
                  label={{ value: 'Load (kN)', angle: -90, position: 'insideLeft', fill: '#334155' }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '0.75rem', borderColor: '#cbd5e1' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length > 0) {
                      // Sort payload by test ID numerically
                      const sortedPayload = [...payload].sort((a, b) => {
                        const aTestId = parseInt(a.dataKey.replace('test_', '').replace('avg_', ''), 10) || 0;
                        const bTestId = parseInt(b.dataKey.replace('test_', '').replace('avg_', ''), 10) || 0;
                        return aTestId - bTestId;
                      });

                      return (
                        <div className="bg-white p-3 border border-slate-300 rounded-md shadow-lg text-xs">
                          <p className="font-semibold text-slate-700 mb-2">Disp: {Number(label).toFixed(2)} mm</p>
                          <div className="space-y-1">
                            {sortedPayload.map((entry, idx) => {
                              const isAverage = entry.dataKey.startsWith('avg_');
                              let testLabel = entry.name;
                              
                              if (!isAverage) {
                                const testId = parseInt(entry.dataKey.replace('test_', ''), 10);
                                const test = plottedTests.find(t => t.test_id === testId);
                                if (test) {
                                  testLabel = `Test ${test.test_id} (${test.test_facility || 'Unknown'})`;
                                }
                              }
                              
                              return (
                                <div key={idx} style={{ color: entry.color || '#cbd5e1' }} className="font-medium">
                                  {testLabel}: {entry.value == null ? '-' : Number(entry.value).toFixed(1)} kN
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} /> */}

                {chartSeriesData.map((series) => {
                  const strokeDasharray = series.isAverage ? '5 5' : 'none';
                  const baseStrokeWidth = series.isAverage ? 3 : 2.25;
                  const isSelectedLine = selectedTestId && series.testId === selectedTestId;
                  
                  const strokeWidth = isSelectedLine ? 4 : baseStrokeWidth;
                  const strokeOpacity = selectedTestId ? (isSelectedLine ? 1 : 0.15) : 1;
                  
                  return (
                    <Line
                      key={series.testId}
                      type="monotone"
                      dataKey={series.dataKey}
                      name={series.label}
                      legendType={series.showInLegend ? 'line' : 'none'}
                      stroke={series.color}
                      strokeWidth={strokeWidth}
                      strokeOpacity={strokeOpacity}
                      strokeDasharray={strokeDasharray}
                      dot={false}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Tests Table Section */}
      {plottedTests.length > 0 && (
        <section ref={tableRef} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-5 shrink-0 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Plotted Tests Data</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600">
                  <th className="px-4 py-3 font-medium">Test ID</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Peak Strength (kN)</th>
                  <th className="px-4 py-3 font-medium">Yield Strength (kN)</th>
                  <th className="px-4 py-3 font-medium">Ultimate Def. (mm)</th>
                  <th className="px-4 py-3 font-medium">Energy Abs. (kJ)</th>
                  <th className="px-4 py-3 font-medium">Bond Strength</th>
                  <th className="px-4 py-3 font-medium">Stiffness</th>
                  <th className="px-4 py-3 font-medium">Install Method</th>
                  <th className="px-4 py-3 font-medium">Encap. Method</th>
                  <th className="px-4 py-3 font-medium">Loading Rate</th>
                  <th className="px-4 py-3 font-medium">Drops</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plottedTests.map((test) => {
                  const product = filteredProductsList.find((p) => p.id === test.product_id);
                  const colorMap = productColorMap[test.product_id];
                  const isSelected = selectedTestId === test.test_id;
                  return (
                    <tr 
                      key={test.test_id} 
                      onClick={() => setSelectedTestId(isSelected ? null : test.test_id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-blue-200 font-semibold' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-slate-700 border-l-4" style={{ borderLeftColor: colorMap?.hex || '#cbd5e1' }}>
                        {test.test_id}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{product?.product_name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-slate-600">{test.peak_strength ? Number(test.peak_strength).toFixed(2) : '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{test.yield_strength ?? '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{test.ultimate_deformation ?? '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{test.energy_absorption ?? '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{test.bond_strength ?? '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{test.stiffness ?? '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{test.installation_method || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{test.encapsulation_method || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{test.loading_rate || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{test.number_of_drops ?? '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tests Summary Stats Section */}
      {plottedTests.length > 0 && productStats.length > 0 && (
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-5 shrink-0 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Summary Statistics</h3>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-56 bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent p-2 transition-all hover:border-slate-400"
            >
              <option value="peak_strength">Peak Strength (kN)</option>
              <option value="yield_strength">Yield Strength (kN)</option>
              <option value="ultimate_deformation">Ultimate Deformation (mm)</option>
              <option value="energy_absorption">Energy Absorption (kJ)</option>
              <option value="bond_strength">Bond Strength</option>
              <option value="stiffness">Stiffness</option>
              <option value="number_of_drops">Number of Drops</option>
              <option value="loading_rate">Loading Rate</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Count</th>
                  <th className="px-4 py-3 font-medium">Min</th>
                  <th className="px-4 py-3 font-medium">Max</th>
                  <th className="px-4 py-3 font-medium">Mean</th>
                  <th className="px-4 py-3 font-medium">Median</th>
                  <th className="px-4 py-3 font-medium">Q25</th>
                  <th className="px-4 py-3 font-medium">Q75</th>
                  <th className="px-4 py-3 font-medium">Std Dev</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productStats.map(({ product, stats }) => {
                  const colorMap = productColorMap[product?.id];
                  const propertyStats = stats[selectedProperty];
                  
                  return (
                    <tr key={product?.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-700 border-l-4" style={{ borderLeftColor: colorMap?.hex || '#cbd5e1' }}>
                        {product?.product_name}
                      </td>
                      <td className="px-4 py-2 text-slate-600">{propertyStats?.count ?? '-'}</td>
                      <td className="px-4 py-2 text-slate-600">{propertyStats?.min != null ? propertyStats.min.toFixed(2) : '-'}</td>
                      <td className="px-4 py-2 text-slate-600">{propertyStats?.max != null ? propertyStats.max.toFixed(2) : '-'}</td>
                      <td className="px-4 py-2 text-slate-600">{propertyStats?.mean != null ? propertyStats.mean.toFixed(2) : '-'}</td>
                      <td className="px-4 py-2 text-slate-600">{propertyStats?.median != null ? propertyStats.median.toFixed(2) : '-'}</td>
                      <td className="px-4 py-2 text-slate-600">{propertyStats?.q25 != null ? propertyStats.q25.toFixed(2) : '-'}</td>
                      <td className="px-4 py-2 text-slate-600">{propertyStats?.q75 != null ? propertyStats.q75.toFixed(2) : '-'}</td>
                      <td className="px-4 py-2 text-slate-600">{propertyStats?.std_dev != null ? propertyStats.std_dev.toFixed(2) : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Distribution Histogram Section */}
      {plottedTests.length > 0 && histogramData.length > 0 && (
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-5 shrink-0 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Distribution Analysis</h3>
            <div className="flex bg-slate-100 p-1 rounded-lg gap-2">
              <button
                onClick={() => setColorBy('product')}
                className={`text-xs py-1.5 px-2.5 rounded-md font-semibold transition-all ${
                  colorBy === 'product'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                By Product
              </button>
              <button
                onClick={() => setColorBy('facility')}
                className={`text-xs py-1.5 px-2.5 rounded-md font-semibold transition-all ${
                  colorBy === 'facility'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                By Facility
              </button>
            </div>
          </div>
          
          <div className="flex-1 min-h-0 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData} margin={{ top: 24, right: 24, left: 40, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#475569', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#94a3b8' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  label={{ value: selectedProperty.replace(/_/g, ' ').toUpperCase(), position: 'insideBottomRight', offset: -20, fill: '#334155' }}
                />
                <YAxis
                  tick={{ fill: '#475569', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#94a3b8' }}
                  label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: '#334155' }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '0.75rem', borderColor: '#cbd5e1', backgroundColor: '#ffffff' }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  wrapperStyle={{ paddingBottom: '12px' }}
                />
                {colorBy === 'facility' ? (
                  facilities.filter(f => f !== 'All').map((facility, idx) => (
                    <Bar
                      key={`facility-${facility}`}
                      dataKey={facility}
                      fill={facilityColorMap[facility] || '#cbd5e1'}
                      stackId="distribution"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={false}
                    >
                      {selectedTestId && histogramData.map((entry, index) => {
                        const containsSelectedTest = entry._testIds && entry._testIds.includes(selectedTestId);
                        return (
                          <Cell
                            key={`cell-facility-${facility}-${index}`}
                            fillOpacity={containsSelectedTest ? 1 : 0.3}
                          />
                        );
                      })}
                    </Bar>
                  ))
                ) : (
                  selectedProductIds.map((productId, idx) => {
                    const product = filteredProductsList.find(p => p.id === productId);
                    const productName = product?.product_name || 'Unknown';
                    return (
                      <Bar
                        key={`product-${productId}`}
                        dataKey={productName}
                        fill={productColorMap[productId]?.hex || '#cbd5e1'}
                        stackId="distribution"
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={false}
                      >
                        {selectedTestId && histogramData.map((entry, index) => {
                          const containsSelectedTest = entry._testIds && entry._testIds.includes(selectedTestId);
                          return (
                            <Cell
                              key={`cell-product-${productId}-${index}`}
                              fillOpacity={containsSelectedTest ? 1 : 0.3}
                            />
                          );
                        })}
                      </Bar>
                    );
                  })
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}
