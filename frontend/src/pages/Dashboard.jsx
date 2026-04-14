import React, { useEffect, useMemo, useState } from 'react';
import { Layers } from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { useAppContext } from '../context/AppContext';

export default function Dashboard() {
  const { filteredProductsList, filteredTests, filteredCurves, productColorMap, apiStats } = useAppContext();

  const [chartProductIds, setChartProductIds] = useState([]);

  useEffect(() => {
    const allowedIds = new Set(filteredProductsList.map((product) => product.id));
    setChartProductIds((prev) => prev.filter((productId) => allowedIds.has(productId)));
  }, [filteredProductsList]);

  const toggleProductInChart = (productId) => {
    setChartProductIds((prev) => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const plottedTests = useMemo(() => {
    if (chartProductIds.length === 0) return [];
    return filteredTests.filter((test) => chartProductIds.includes(test.product_id));
  }, [filteredTests, chartProductIds]);

  const chartSeries = useMemo(() => {
    const seenProducts = new Set();
    return plottedTests
      .map((test) => {
        const product = filteredProductsList.find((item) => item.id === test.product_id);
        const productName = product ? product.product_name : 'Unknown Product';
        const isFirst = !seenProducts.has(test.product_id);
        if (isFirst) seenProducts.add(test.product_id);

        return {
          testId: test.test_id,
          dataKey: `test_${test.test_id}`,
          productId: test.product_id,
          label: productName,
          color: productColorMap[test.product_id]?.hex || '#64748b',
          showInLegend: isFirst
        };
      });
  }, [plottedTests, filteredProductsList, productColorMap]);

  const chartData = useMemo(() => {
    if (plottedTests.length === 0) return [];

    const selectedTestIds = new Set(plottedTests.map((test) => test.test_id));
    const relevantCurves = filteredCurves.filter((point) => selectedTestIds.has(point.test_id));
    const uniqueDisplacements = [...new Set(relevantCurves.map((point) => point.disp))].sort((a, b) => a - b);
    const groupedByTest = relevantCurves.reduce((acc, point) => {
      if (!acc[point.test_id]) acc[point.test_id] = new Map();
      acc[point.test_id].set(point.disp, point.load);
      return acc;
    }, {});

    return uniqueDisplacements.map((disp) => {
      const row = { disp };
      plottedTests.forEach((test) => {
        const key = `test_${test.test_id}`;
        row[key] = groupedByTest[test.test_id]?.get(disp) ?? null;
      });
      return row;
    });
  }, [plottedTests, filteredCurves]);

  const productStats = useMemo(() => {
    if (chartProductIds.length === 0) return [];

    return chartProductIds.map(productId => {
      const product = filteredProductsList.find(p => p.id === productId);
      const stats = apiStats?.[productId] || {};
      
      return {
        product,
        stats
      };
    });
  }, [chartProductIds, apiStats, filteredProductsList]);

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pb-6">
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 shrink-0">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Products Matching Filters</h2>
          </div>
          {chartProductIds.length > 0 && (
            <button
              onClick={() => setChartProductIds([])}
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
              const isSelected = chartProductIds.includes(product.id);
              const color = productColorMap[product.id]?.hex || '#3b82f6';
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => toggleProductInChart(product.id)}
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

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-5 flex-1 min-h-[400px] flex flex-col shrink-0">
        <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Force-Displacement Chart</h3>
          <span className="text-xs text-slate-500">{chartProductIds.length} product(s) plotted</span>
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
                  formatter={(value) => (value == null ? '-' : Number(value).toFixed(1))}
                  labelFormatter={(value) => `Disp: ${value} mm`}
                />
                {/* <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} /> */}

                {chartSeries.map((series) => (
                  <Line
                    key={series.testId}
                    type="monotone"
                    dataKey={series.dataKey}
                    name={series.label}
                    legendType={series.showInLegend ? 'line' : 'none'}
                    stroke={series.color}
                    strokeWidth={2.25}
                    dot={false}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Tests Table Section */}
      {plottedTests.length > 0 && (
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-5 shrink-0 overflow-hidden flex flex-col">
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
                  return (
                    <tr key={test.test_id} className="hover:bg-slate-50 transition-colors">
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
          <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Plotted Products Summary Stats</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600">
                  <th className="px-4 py-3 font-medium">Product / Metric</th>
                  <th className="px-4 py-3 font-medium">Peak Strength (kN)</th>
                  <th className="px-4 py-3 font-medium">Yield Strength (kN)</th>
                  <th className="px-4 py-3 font-medium">Ultimate Def. (mm)</th>
                  <th className="px-4 py-3 font-medium">Energy Abs. (kJ)</th>
                  <th className="px-4 py-3 font-medium">Bond Strength</th>
                  <th className="px-4 py-3 font-medium">Stiffness</th>
                  <th className="px-4 py-3 font-medium">Drops</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productStats.map(({ product, stats }) => {
                  const colorMap = productColorMap[product?.id];
                  const labels = [
                    { display: 'Count', key: 'count' },
                    { display: 'Min', key: 'min' },
                    { display: 'Max', key: 'max' },
                    { display: 'Mean', key: 'mean' },
                    { display: 'Median', key: 'median' },
                    { display: 'Q25', key: 'q25' },
                    { display: 'Q75', key: 'q75' },
                    { display: 'Std Dev', key: 'std_dev' }
                  ];
                  return labels.map(({ display, key }, idx) => (
                    <tr key={`${product?.id}-${key}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-700 border-l-4" style={{ borderLeftColor: colorMap?.hex || '#cbd5e1' }}>
                        {idx === 0 ? product?.product_name : ''} {idx === 0 && <span className="text-slate-400 font-normal pl-2">{display}</span>}
                        {idx !== 0 && <span className="text-slate-400 pl-4">{display}</span>}
                      </td>
                      <td className="px-4 py-2 text-slate-600">{stats.peak_strength && stats.peak_strength[key] != null ? (key === 'count' ? stats.peak_strength[key] : stats.peak_strength[key].toFixed(2)) : '-'}</td>
                      <td className="px-4 py-2 text-slate-600">{stats.yield_strength && stats.yield_strength[key] != null ? (key === 'count' ? stats.yield_strength[key] : stats.yield_strength[key].toFixed(2)) : '-'}</td>
                      <td className="px-4 py-2 text-slate-600">{stats.ultimate_deformation && stats.ultimate_deformation[key] != null ? (key === 'count' ? stats.ultimate_deformation[key] : stats.ultimate_deformation[key].toFixed(2)) : '-'}</td>
                      <td className="px-4 py-2 text-slate-600">{stats.energy_absorption && stats.energy_absorption[key] != null ? (key === 'count' ? stats.energy_absorption[key] : stats.energy_absorption[key].toFixed(2)) : '-'}</td>
                      <td className="px-4 py-2 text-slate-600">{stats.bond_strength && stats.bond_strength[key] != null ? (key === 'count' ? stats.bond_strength[key] : stats.bond_strength[key].toFixed(2)) : '-'}</td>
                      <td className="px-4 py-2 text-slate-600">{stats.stiffness && stats.stiffness[key] != null ? (key === 'count' ? stats.stiffness[key] : stats.stiffness[key].toFixed(2)) : '-'}</td>
                      <td className="px-4 py-2 text-slate-600">{stats.number_of_drops && stats.number_of_drops[key] != null ? (key === 'count' ? stats.number_of_drops[key] : stats.number_of_drops[key].toFixed(2)) : '-'}</td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
