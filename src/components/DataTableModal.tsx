import React, { useEffect, useRef, useState } from 'react';

interface DataTableModalProps {
  isOpen: boolean;
  data: any[]; // array of objects or arrays
  onClose: () => void;
}

const DataTableModal: React.FC<DataTableModalProps> = ({ isOpen, data, onClose }) => {
  if (!isOpen) return null;
  if (!data || data.length === 0) return <div>No data to display</div>;

  // Drag state for making the modal movable
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const offsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Center modal on first open
  useEffect(() => {
    if (!modalRef.current) return;
    const rect = modalRef.current.getBoundingClientRect();
    setPos({ x: (window.innerWidth - rect.width) / 2, y: (window.innerHeight - rect.height) / 2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragging) return;
      setPos((prev) => {
        if (!prev) return prev;
        return { x: e.clientX - offsetRef.current.x, y: e.clientY - offsetRef.current.y };
      });
    }

    function onUp() {
      setDragging(false);
    }

    if (dragging) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging]);

  const onHeaderMouseDown = (e: React.MouseEvent) => {
    if (!modalRef.current) return;
    const rect = modalRef.current.getBoundingClientRect();
    offsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setDragging(true);
    e.preventDefault();
  };

  // If data is array of objects, get columns from keys
  const columns = typeof data[0] === 'object' && !Array.isArray(data[0])
    ? Object.keys(data[0])
    : data[0].map((_: any, i: number) => `Column ${i + 1}`);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50">
      {/* overlay; modal positioned absolutely so we can move it */}
      <div
        ref={modalRef}
        style={pos ? { position: 'absolute', left: pos.x, top: pos.y } : { position: 'absolute' }}
        className="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <div
            className="cursor-move font-semibold"
            onMouseDown={onHeaderMouseDown}
            title="Drag to move"
          >
            Data Table
          </div>
          <button onClick={onClose} className="ml-4">Close</button>
        </div>
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