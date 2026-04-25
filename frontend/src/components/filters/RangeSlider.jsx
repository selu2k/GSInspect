import React, { useState, useEffect } from 'react';

const rangeSliderStyles = `
  .range-slider-input {
    pointer-events: all !important;
    position: absolute;
    width: 100%;
    height: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
  }

  .range-slider-input::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #2563eb;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  .range-slider-input::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #2563eb;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  .range-slider-input::-webkit-slider-runnable-track {
    background: transparent;
    height: 4px;
    border-radius: 2px;
  }

  .range-slider-input::-moz-range-track {
    background: transparent;
    border: none;
  }
`;

export default function RangeSlider({ 
  label, 
  min, 
  max, 
  step = 0.1,
  selectedMin,
  selectedMax,
  onChange,
  unit = '',
  icon: Icon = null
}) {
  const [localMin, setLocalMin] = useState(selectedMin ?? min);
  const [localMax, setLocalMax] = useState(selectedMax ?? max);

  useEffect(() => {
    setLocalMin(selectedMin ?? min);
    setLocalMax(selectedMax ?? max);
  }, [selectedMin, selectedMax, min, max]);

  const handleMinChange = (e) => {
    const newMin = parseFloat(e.target.value);
    if (newMin <= localMax) {
      setLocalMin(newMin);
      onChange({ min: newMin, max: localMax });
    }
  };

  const handleMaxChange = (e) => {
    const newMax = parseFloat(e.target.value);
    if (newMax >= localMin) {
      setLocalMax(newMax);
      onChange({ min: localMin, max: newMax });
    }
  };

  const percentMin = ((localMin - min) / (max - min)) * 100;
  const percentMax = ((localMax - min) / (max - min)) * 100;

  return (
    <>
      <style>{rangeSliderStyles}</style>
      <div className="space-y-2 pt-1">
        {label && (
          <div className="flex items-baseline justify-between">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-widest flex items-center gap-2">
              {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
              {label} {unit && `(${unit})`}
            </label>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-medium">{localMin.toFixed(2)}</span>
              <span className="text-slate-400">−</span>
              <span className="font-medium">{localMax.toFixed(2)}</span>
              {unit && <span className="text-slate-400">{unit}</span>}
            </div>
          </div>
        )}

        {/* Range Sliders */}
        <div className="relative px-1 py-3">
          {/* Track Background */}
          <div className="absolute top-0 left-1 right-1 h-2 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg pointer-events-none">
            <div
              className="absolute h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg"
              style={{
                left: `${percentMin}%`,
                right: `${100 - percentMax}%`
              }}
            />
          </div>

          {/* Min Slider - Higher z-index */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={localMin}
            onChange={handleMinChange}
            className="range-slider-input"
            style={{ zIndex: localMin > max - (max - min) / 2 ? 6 : 4 }}
          />

          {/* Max Slider - Lower z-index by default */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={localMax}
            onChange={handleMaxChange}
            className="range-slider-input"
            style={{ zIndex: localMax < min + (max - min) / 2 ? 5 : 3 }}
          />
        </div>

        {/* Range Labels */}
        <div className="flex justify-between text-xs text-slate-400 font-medium px-1 mt-2">
          <span>{min.toFixed(1)}</span>
          <span>{max.toFixed(1)}</span>
        </div>
      </div>
    </>
  );
}
