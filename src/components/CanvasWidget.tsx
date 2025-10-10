import React, { useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import {
  Upload,
  BarChart3,
  ScatterChart as Scatter3D,
  Box,
  Calculator,
  Filter,
  Database,
  LineChart,
  Trash2,
  Settings,
  GripVertical,
} from 'lucide-react';
import { Widget } from '../types';
import DataTableModal from './DataTableModal';
import MeanAverageModal from './MeanAverageModal';
import LineChartModal from './LineChModal';
import ScatterPlotModal from './ScatterPlotModal';
import BoxPlotModal from './BoxPlotModal';
import BarChartModal from './BarChartModal';
import { useTheme } from '../contexts/ThemeContext';

const iconMap: Record<string, React.ComponentType<any>> = {
  'file-upload': Upload,
  'data-table': Database,
  'line-chart': LineChart,
  'scatter-plot': Scatter3D,
  'box-plot': Box,
  'bar-chart': BarChart3,
  'mean-average': Calculator,
  'blank-remover': Filter,
};

interface CanvasWidgetProps {
  widget: Widget;
  isConnecting: boolean;
  isConnectingFrom: boolean;
  onUpdatePosition: (position: { x: number; y: number }) => void;
  onDelete: () => void;
  onOpenConfig: () => void;
  onStartConnection: () => void;
  onEndConnection: () => void;
  onCreateConnection?: (fromId: string, toId: string) => void;
  onRemoveConnection?: (fromId: string, toId: string) => void;
  isConnectedTo?: (toId: string) => boolean;
  uploadStatus?: 'uploading' | 'success' | 'error' | null;
}

const CanvasWidget: React.FC<CanvasWidgetProps> = ({
  widget,
  isConnecting,
  isConnectingFrom,
  onUpdatePosition,
  onDelete,
  onOpenConfig,
  onStartConnection,
  onEndConnection,
  uploadStatus = null,
  onCreateConnection,
}) => {
  const { theme } = useTheme();
  const [showControls, setShowControls] = useState(false);
  const [connectingTarget, setConnectingTarget] = useState<string | null>(null);
  const [showTableModal, setShowTableModal] = useState(false);

  // --- Mean Average Widget State ---
  const [mode, setMode] = useState<'row' | 'column'>('row');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [selectedCols, setSelectedCols] = useState<number[]>([]);
  const [showMeanModal, setShowMeanModal] = useState(false);
  const [showLineChartModal, setShowLineChartModal] = useState(false);
  const [showScatterModal, setShowScatterModal] = useState(false);
  const [showBoxPlotModal, setShowBoxPlotModal] = useState(false);
  const [showBarChartModal, setShowBarChartModal] = useState(false);

  const data: Record<string, any>[] = widget.data?.tableData || [];
  const columns: string[] = data.length > 0 ? Object.keys(data[0]) : [];

  // Reset selections when mode or data changes
  useEffect(() => {
    setSelectedRows([]);
    setSelectedCols([]);
  }, [mode, data.length, columns.join(',')]);

  const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
    type: 'canvas-widget',
    item: { id: widget.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const IconComponent = iconMap[widget.type] || Upload;
  const showUploadStatus = widget.type === 'file-upload';

  const handleStartConnection = () => {
    onStartConnection();
    setConnectingTarget(widget.id);
  };

  const handleEndConnection = () => {
    if (connectingTarget && onCreateConnection) {
      if (connectingTarget !== widget.id) {
        onCreateConnection(connectingTarget, widget.id);
      }
    }
    setConnectingTarget(null);
    onEndConnection();
  };

  // Prepare mean/average modal data
  let selectedData: Record<string, any>[] = [];
  let rowAverages: (number | string)[] = [];
  let modalColumns: string[] = [];

  if (widget.type === 'mean-average') {
    if (mode === 'row' && selectedRows.length > 0) {
      selectedData = selectedRows.map((rowIdx: number) => data[rowIdx]);
      modalColumns = columns;
      rowAverages = selectedData.map((row: Record<string, any>) => {
        const vals = columns.slice(1).map((col: string) => Number(row[col])).filter((v: number) => !isNaN(v));
        return vals.length ? (vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(2) : '';
      });
    } else if (mode === 'column' && selectedCols.length > 0) {
      modalColumns = selectedCols.map((idx: number) => columns[idx]);
      selectedData = data.map((row: Record<string, any>) =>
        Object.fromEntries(selectedCols.map((idx: number) => [columns[idx], row[columns[idx]]]))
      );
      rowAverages = selectedCols.map((colIdx: number) => {
        const vals = data.slice(1).map((row: Record<string, any>) => Number(row[columns[colIdx]])).filter((v: number) => !isNaN(v));
        return vals.length ? (vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(2) : '';
      });
    }
  }

  const renderWidgetContent = () => {
    if (widget.type === 'data-table') {
      return (
        <button
          type="button"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 20,
            pointerEvents: 'auto',
            background: 'transparent',
          }}
          className="flex flex-col items-center justify-center w-full h-full focus:outline-none"
          onClick={(e) => {
            e.stopPropagation();
            setShowTableModal(true);
          }}
        >
          <Database
            className={`h-8 w-8 mb-2 transition-colors duration-300 ${
              theme === 'dark'
                ? 'text-gray-300 group-hover:text-blue-400'
                : 'text-blue-600 group-hover:text-blue-700'
            }`}
          />
          <span className="text-xs">Show Table</span>
        </button>
      );
    }
    if (widget.type === 'file-upload') {
      return (
        <div
          className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onOpenConfig();
          }}
        >
          <IconComponent
            className={`h-8 w-8 mb-2 transition-colors duration-300 ${
              theme === 'dark'
                ? 'text-gray-300 group-hover:text-blue-400'
                : 'text-blue-600 group-hover:text-blue-700'
            }`}
          />
          <span className="text-xs">Upload File</span>
        </div>
      );
    }
    if (widget.type === 'mean-average') {
      // Handle selection
      const toggleRow = (idx: number) => {
        setSelectedRows((prev) =>
          prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
        );
        if (!selectedRows.includes(idx)) setSelectedCols([]);
      };
      const toggleCol = (idx: number) => {
        setSelectedCols((prev) =>
          prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
        );
        if (!selectedCols.includes(idx)) setSelectedRows([]);
      };

      return (
        <div className="flex flex-col items-center w-full">
          <div className="mb-2 flex gap-2">
            <label className="font-medium">Mode:</label>
            <select
              value={mode}
              onChange={e => setMode(e.target.value as 'row' | 'column')}
              className="border rounded px-2 py-1"
            >
              <option value="row">Row</option>
              <option value="column">Column</option>
            </select>
          </div>
          <div className="mb-2 flex flex-wrap gap-2">
            {mode === 'row' && data.map((row: Record<string, any>, idx: number) => (
              <button
                key={idx}
                className={`px-2 py-1 rounded border ${selectedRows.includes(idx) ? 'bg-blue-500 text-white' : 'bg-white'}`}
                onClick={() => toggleRow(idx)}
                type="button"
              >
                {columns.length > 0 && row && typeof row === 'object'
                  ? String(row[columns[0]] ?? '')
                  : ''}
              </button>
            ))}
            {mode === 'column' && columns.map((col: string, idx: number) => (
              <button
                key={col}
                className={`px-2 py-1 rounded border ${idx === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : selectedCols.includes(idx) ? 'bg-blue-500 text-white' : 'bg-white'}`}
                onClick={() => idx !== 0 && toggleCol(idx)}
                type="button"
                disabled={idx === 0}
              >
                {col}
              </button>
            ))}
          </div>
          <button
            className="mt-2 px-4 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
            onClick={() => setShowMeanModal(true)}
            disabled={selectedRows.length === 0 && selectedCols.length === 0}
          >
            Show Mean/Average
          </button>
        </div>
      );
    }
    if (widget.type === 'line-chart') {
      return (
        <div className="flex flex-col items-center w-full">
          <button
            className="mt-2 px-4 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
            onClick={() => setShowLineChartModal(true)}
            disabled={!widget.data?.tableData || widget.data.tableData.length === 0}
          >
            Show Line Chart
          </button>
        </div>
      );
    }
    if (widget.type === 'scatter-plot') {
      return (
        <div className="flex flex-col items-center w-full">
          <button
            className="mt-2 px-4 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
            onClick={() => setShowScatterModal(true)}
          >
            Show Scatter Plot
          </button>
        </div>
      );
    }
    if (widget.type === 'box-plot') {
      return (
        <div className="flex flex-col items-center w-full">
          <button
            className="mt-2 px-4 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
            onClick={() => setShowBoxPlotModal(true)}
          >
            Show Box Plot
          </button>
        </div>
      );
    }
    if (widget.type === 'bar-chart') {
      return (
        <div className="flex flex-col items-center w-full">
          <button
            className="mt-2 px-4 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
            onClick={() => setShowBarChartModal(true)}
          >
            Show Bar Chart
          </button>
        </div>
      );
    }
    // Default: just show icon
    return (
      <div className="flex flex-col items-center justify-center w-full h-full">
        <IconComponent
          className={`h-8 w-8 mb-2 transition-colors duration-300 ${
            theme === 'dark'
              ? 'text-gray-300 group-hover:text-blue-400'
              : 'text-blue-600 group-hover:text-blue-700'
          }`}
        />
      </div>
    );
  };

  return (
    <>
      <div
        ref={dragPreview}
        className={`absolute transition-all duration-300 ${
          isDragging ? 'opacity-50 scale-95' : ''
        } ${isConnectingFrom ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}`}
        style={{
          left: widget.position.x,
          top: widget.position.y,
          zIndex: showControls ? 50 : 20,
        }}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <div
          className={`relative w-32 h-32 rounded-full transition-all duration-300 group border-2 flex flex-col items-center justify-center ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600 hover:border-blue-400'
              : 'bg-gradient-to-br from-white to-blue-50 border-blue-200 hover:border-blue-400 shadow-lg hover:shadow-xl'
          }`}
        >
          {/* Controls inside the circle: drag (left), settings (center), delete (right) */}
          <div
            className={`absolute top-2 left-1/2 -translate-x-1/2 z-30 transition-opacity duration-200 ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex items-center gap-2 w-24 justify-between">
              {/* Drag */}
              <button
                ref={drag}
                title="Drag"
                className={`w-7 h-7 rounded-full flex items-center justify-center cursor-move transition-all duration-150 ${
                  theme === 'dark' ? 'bg-gray-700 border border-gray-600' : 'bg-blue-100 border border-blue-200'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-3 w-3 opacity-70" />
              </button>

              {/* Settings */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenConfig();
                }}
                title="Settings"
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                  theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-white text-gray-700 shadow-sm'
                }`}
              >
                <Settings className="h-3 w-3" />
              </button>

              {/* Delete */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                title="Delete"
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                  theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-red-500 text-white shadow-sm'
                }`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="flex-1 w-full relative flex items-center justify-center">
            {renderWidgetContent()}
          </div>

          {/* Connection Points */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Input */}
            <button
              className={`absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 shadow-sm transition-all duration-200 pointer-events-auto ${
                isConnecting
                  ? theme === 'dark'
                    ? 'bg-pink-500 border-pink-300 opacity-100 scale-125'
                    : 'bg-pink-500 border-pink-300 opacity-100 scale-125'
                  : theme === 'dark'
                  ? 'bg-transparent border-pink-400 opacity-80 hover:opacity-100 hover:scale-110'
                  : 'bg-transparent border-pink-300 opacity-80 hover:opacity-100 hover:scale-110'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleEndConnection();
              }}
              aria-label="input-connector"
            />

            {/* Output */}
            <button
              className={`absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-3 h-3 rounded-full border-2 shadow-sm transition-all duration-200 pointer-events-auto ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-500 border-transparent opacity-0 hover:opacity-100 hover:scale-110'
                  : 'bg-gradient-to-br from-cyan-400 to-blue-500 border-transparent opacity-0 hover:opacity-100 hover:scale-110'
              } ${showControls ? 'opacity-100' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleStartConnection();
              }}
              aria-label="output-connector"
            />
          </div>
        </div>

        {/* Widget Label */}
        <div
          className={`absolute top-full left-1/2 transform -translate-x-1/2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-all duration-300 ${
            theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700 shadow-sm'
          } ${showControls ? 'opacity-100' : 'opacity-0'}`}
        >
          {widget.type
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')}
        </div>

        {/* Show upload status for file-upload widgets */}
        {showControls && showUploadStatus && (
          <div
            className={`absolute top-full left-1/2 transform -translate-x-1/2 px-3 py-1 rounded text-xs font-semibold whitespace-nowrap ${
              uploadStatus === 'uploading'
                ? 'bg-yellow-200 text-yellow-800'
                : uploadStatus === 'success'
                ? 'bg-green-200 text-green-800'
                : uploadStatus === 'error'
                ? 'bg-red-200 text-red-800'
                : 'bg-gray-200 text-gray-700'
            } shadow`}
          >
            {uploadStatus === 'uploading' && 'Uploading...'}
            {uploadStatus === 'success' && 'Upload Successful'}
            {uploadStatus === 'error' && 'Upload Failed'}
            {!uploadStatus && 'Idle'}
          </div>
        )}

        {/* Processing Indicator */}
        {widget.data && (
          <div
            className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
              theme === 'dark' ? 'bg-green-500' : 'bg-green-500'
            }`}
          >
            <div
              className={`w-full h-full rounded-full animate-pulse ${
                theme === 'dark' ? 'bg-green-400' : 'bg-green-400'
              }`}
            />
          </div>
        )}

        {/* Data Table Modal */}
        {widget.type === 'data-table' && (
          <DataTableModal
            isOpen={showTableModal}
            data={widget.data?.tableData || []}
            onClose={() => setShowTableModal(false)}
          />
        )}
      </div>

      {/* Mean/Average Modal */}
      {widget.type === 'mean-average' && (
        <MeanAverageModal
          isOpen={showMeanModal}
          onClose={() => setShowMeanModal(false)}
          columns={modalColumns}
          selectedData={selectedData}
          rowAverages={rowAverages}
        />
      )}

      {/* Line Chart Modal */}
      {widget.type === 'line-chart' && (
        <LineChartModal
          isOpen={showLineChartModal}
          onClose={() => setShowLineChartModal(false)}
          data={widget.data?.tableData || []}
          columns={widget.data?.tableData && widget.data.tableData.length > 0 ? Object.keys(widget.data.tableData[0]) : []}
        />
      )}

      {/* Scatter Plot Modal */}
      {widget.type === 'scatter-plot' && (
        <ScatterPlotModal
          isOpen={showScatterModal}
          onClose={() => setShowScatterModal(false)}
          data={widget.data?.tableData || []}
          columns={widget.data?.tableData && widget.data.tableData.length > 0 ? Object.keys(widget.data.tableData[0]) : []}
        />
      )}

      {/* Box Plot Modal */}
      {widget.type === 'box-plot' && (
        <BoxPlotModal
          isOpen={showBoxPlotModal}
          onClose={() => setShowBoxPlotModal(false)}
          data={widget.data?.tableData || []}
          columns={widget.data?.tableData && widget.data.tableData.length > 0 ? Object.keys(widget.data.tableData[0]) : []}
        />
      )}

      {/* Bar Chart Modal */}
      {widget.type === 'bar-chart' && (
        <BarChartModal
          isOpen={showBarChartModal}
          onClose={() => setShowBarChartModal(false)}
          data={widget.data?.tableData || []}
          columns={widget.data?.tableData && widget.data.tableData.length > 0 ? Object.keys(widget.data.tableData[0]) : []}
        />
      )}
    </>
  );
};

export default CanvasWidget;