import React from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface ScatterPlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Record<string, any>[];
  columns: string[];
}

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'
];

const ScatterPlotModal: React.FC<ScatterPlotModalProps> = ({
  isOpen,
  onClose,
  data,
  columns,
}) => {
  if (!isOpen) return null;
  if (!data || data.length === 0 || columns.length < 1) return <div>No data</div>;

  // Use row index as X, plot all columns as series
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[600px] max-w-[90vw]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Scatter Plot</h2>
          <button
            className="text-gray-500 hover:text-red-500 text-xl font-bold"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <ScatterChart>
              <CartesianGrid />
              <XAxis dataKey="x" name="Index" type="number" domain={['auto', 'auto']} label={{ value: "Index", position: "insideBottom", offset: -5 }} />
              <YAxis dataKey="y" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              {columns.map((col, idx) => (
                <Scatter
                  key={col}
                  name={col}
                  data={data.map((row, i) => ({
                    x: i,
                    y: Number(row[col]),
                  }))}
                  fill={COLORS[idx % COLORS.length]}
                  line
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ScatterPlotModal;