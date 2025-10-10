import React from 'react';

interface DataTableModalProps {
  isOpen: boolean;
  data: any[]; // array of objects or arrays
  onClose: () => void;
}

const DataTableModal: React.FC<DataTableModalProps> = ({ isOpen, data, onClose }) => {
  if (!isOpen) return null;
  if (!data || data.length === 0) return <div>No data to display</div>;

  // If data is array of objects, get columns from keys
  const columns = typeof data[0] === 'object' && !Array.isArray(data[0])
    ? Object.keys(data[0])
    : data[0].map((_: any, i: number) => `Column ${i + 1}`);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full">
        <button onClick={onClose} className="mb-4 float-right">Close</button>
        <div className="overflow-auto max-h-[60vh]">
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr>
                {columns.map((col: string, idx: number) => (
                  <th key={idx} className="border px-2 py-1 bg-gray-100">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row: any, i: number) => (
                <tr key={i}>
                  {columns.map((col: string, idx: number) => (
                    <td key={idx} className="border px-2 py-1">
                      {typeof row === 'object' && !Array.isArray(row)
                        ? row[col]
                        : row[idx]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataTableModal;