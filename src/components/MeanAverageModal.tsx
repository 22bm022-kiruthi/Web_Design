import React from 'react';

interface MeanAverageModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: string[];
  selectedData: Record<string, any>[];
  rowAverages: (number | string)[];
}

const MeanAverageModal: React.FC<MeanAverageModalProps> = ({
  isOpen,
  onClose,
  columns,
  selectedData,
  rowAverages,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[300px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Mean/Average</h2>
          <button
            className="text-gray-500 hover:text-red-500 text-xl font-bold"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <table className="min-w-full text-xs border mb-2">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="border px-2 py-1 bg-gray-100">{col}</th>
              ))}
              <th className="border px-2 py-1 bg-gray-100">Average</th>
            </tr>
          </thead>
          <tbody>
            {selectedData.map((row, i) => (
              <tr key={i}>
                {columns.map((col, j) => (
                  <td key={j} className="border px-2 py-1">{row[col]}</td>
                ))}
                <td className="border px-2 py-1 font-bold text-blue-700">{rowAverages[i]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MeanAverageModal;