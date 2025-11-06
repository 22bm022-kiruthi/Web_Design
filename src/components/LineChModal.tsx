import React, { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface LineChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Record<string, any>[];
  columns: string[];
}

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'
];

const LineChartModal: React.FC<LineChartModalProps> = ({
  isOpen,
  onClose,
  data,
  columns,
}) => {
  if (!isOpen) return null;
  if (!data || data.length === 0 || columns.length < 1) return <div>No data</div>;

  console.log('[LineChart] ========== MODAL OPENED ==========');
  console.log('[LineChart] Available columns:', columns);
  console.log('[LineChart] Data sample:', data[0]);

  // Prefer an explicit "x"-like column if present
  // For Raman spectroscopy, prioritize shift/wavenumber columns
  const lowerCols = columns.map((c) => (c || '').toLowerCase());
  let xKey: string | null = null;
  
  // First priority: Raman-specific x-axis columns
  const ramanXNames = ['raman shift', 'shift', 'wavenumber', 'shift x axis', 'raman_shift', 'wavenumber_cm'];
  console.log('[LineChart] Searching for X-axis column in priority order...');
  for (const name of ramanXNames) {
    // More robust matching: remove all non-alphanumeric characters for comparison
    const cleanName = name.replace(/[^a-z0-9]/g, '');
    console.log(`[LineChart]   Trying "${name}" (clean: "${cleanName}")...`);
    const matchCol = columns.find(c => {
      const cleanCol = c.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matches = cleanCol.includes(cleanName) || cleanName.includes(cleanCol);
      if (matches) console.log(`[LineChart]     ✅ MATCHED: "${c}" (clean: "${cleanCol}")`);
      return matches;
    });
    if (matchCol) {
      xKey = matchCol;
      console.log(`[LineChart] ✅ X-axis auto-selected: "${matchCol}" (matched "${name}")`);
      break;
    }
  }
  
  // Second priority: generic x-axis names
  if (!xKey) {
    const preferNames = ['x', 'index', 'time', 'label', 'idx'];
    for (const name of preferNames) {
      const i = lowerCols.indexOf(name);
      if (i >= 0) {
        xKey = columns[i];
        console.log(`[LineChart] X-axis auto-selected: "${xKey}" (generic match)`);
        break;
      }
    }
  }

  // If no explicit x-like column, pick the first NUMERIC column as x
  // Avoid text columns like "Sample name"
  if (!xKey) {
    const firstRow = data[0] || {};
    for (const col of columns) {
      const v = firstRow[col];
      // Skip if undefined, null, or non-numeric (like "Sample name")
      if (v === undefined || v === null || isNaN(Number(v))) continue;
      xKey = col;
      console.log(`[LineChart] X-axis auto-selected: "${xKey}" (first numeric)`);
      break;
    }
  }
  // final fallback
  if (!xKey) {
    xKey = '___index___';
    console.log(`[LineChart] X-axis fallback to row index`);
  }

  // Choose a single Y column to plot (prefer Raman intensity names first, then common intensity names)
  const lowerColsMap = columns.reduce<Record<string, string>>((acc, c) => { acc[c.toLowerCase()] = c; return acc; }, {} as Record<string, string>);
  
  // First priority: Raman-specific intensity columns
  const ramanYNames = ['raman intensity', 'intensity y axis', 'raman_intensity', 'intensity_y_axis', 'intensity'];
  let yKey: string | null = null;
  for (const name of ramanYNames) {
    // More robust matching: remove all non-alphanumeric characters for comparison
    const cleanName = name.replace(/[^a-z0-9]/g, '');
    const matchCol = columns.find(c => {
      const cleanCol = c.toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleanCol.includes(cleanName) || cleanName.includes(cleanCol);
    });
    if (matchCol && matchCol !== xKey) {
      yKey = matchCol;
      console.log(`[LineChart] Y-axis auto-selected: "${matchCol}" (matched "${name}")`);
      break;
    }
  }
  
  // Second priority: generic intensity columns
  if (!yKey) {
    const preferYNames = ['intensity', 'int', 'y', 'signal', 'counts', 'intensity_counts'];
    for (const name of preferYNames) {
      // match exact lower-case keys or substring
      const exact = lowerColsMap[name];
      if (exact) { yKey = exact; break; }
    }
    if (!yKey) {
      // try substring match
      for (const col of columns) {
        const lc = col.toLowerCase();
        if (preferYNames.some((p) => lc.includes(p))) { yKey = col; break; }
      }
    }
  }
  if (!yKey) {
    // fallback: pick first numeric column (excluding xKey)
    for (const col of columns) {
      if (col === xKey) continue;
      const v = data[0][col];
      if (v !== undefined && v !== null && !isNaN(Number(v))) { yKey = col; break; }
    }
  }
  // final fallback: use the first non-x column
  if (!yKey) {
    const others = columns.filter((c) => c !== xKey);
    yKey = others.length ? others[0] : null;
  }
  const yKeys = yKey ? [yKey] : [];

  // allow the user to override which columns are used for X and Y in the modal
  const [selectedX, setSelectedX] = useState<string>(xKey as string);
  const [selectedY, setSelectedY] = useState<string | null>(yKey);

  // recompute chartData when selection changes
  const chartData = useMemo(() => {
    const sx = selectedX || '___index___';
    const sy = selectedY || (yKeys.length ? yKeys[0] : null);
    const rows = data.map((row: Record<string, any>, idx: number) => {
      const xVal = sx === '___index___' ? idx : (row[sx] !== undefined ? row[sx] : idx);
      const out: Record<string, any> = { [sx]: xVal };
      if (sy) {
        const raw = row[sy];
        const num = Number(raw);
        out[sy] = Number.isFinite(num) ? num : (raw === null || raw === undefined ? null : raw);
      }
      return out;
    });
    const isXNumeric = rows.length > 0 && typeof rows[0][sx] === 'number';
    if (isXNumeric) rows.sort((a, b) => (a[sx] as number) - (b[sx] as number));
    return rows;
  }, [data, selectedX, selectedY]);

  // (chartData is computed via useMemo above)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[600px] max-w-[90vw]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Line Chart</h2>
          <button
            className="text-gray-500 hover:text-red-500 text-xl font-bold"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="mb-3 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs">X axis:</label>
            <select value={selectedX} onChange={(e) => setSelectedX(e.target.value)} className="border rounded px-2 py-1 text-sm">
              {/* include index fallback as option */}
              <option value={xKey as string}>{`Auto: ${xKey}`}</option>
              {columns.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value={'___index___'}>index</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs">Y axis:</label>
            <select value={selectedY || ''} onChange={(e) => setSelectedY(e.target.value || null)} className="border rounded px-2 py-1 text-sm">
              <option value={yKeys.length ? yKeys[0] : ''}>{`Auto: ${yKeys.length ? yKeys[0] : 'none'}`}</option>
              {columns.filter((c) => c !== selectedX).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={selectedX as string} type={chartData.length > 0 && typeof chartData[0][selectedX as string] === 'number' ? 'number' : 'category'} />
              <YAxis />
              <Tooltip />
              <Legend />
              {selectedY && (
                <Line
                  key={selectedY}
                  type="monotone"
                  dataKey={selectedY}
                  stroke={COLORS[0]}
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default LineChartModal;