import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { Upload, BarChart3, ScatterChart as Scatter3D, Box, Calculator, Filter, Database, LineChart } from 'lucide-react';
import { WidgetType } from '../types';
import { useTheme } from '../contexts/ThemeContext';

const widgetTypes: WidgetType[] = [
  {
    id: 'file-upload',
    name: 'File Upload',
    icon: 'Upload',
    description: 'Upload CSV/XLS files',
    category: 'input'
  },
  {
    id: 'data-table',
    name: 'Data Table',
    icon: 'Database',
    description: 'View and edit data',
    category: 'input'
  },
  {
    id: 'line-chart',
    name: 'Line Chart',
    icon: 'LineChart',
    description: 'Spectral line visualization',
    category: 'visualization'
  },
  {
    id: 'scatter-plot',
    name: 'Scatter Plot',
    icon: 'Scatter3D',
    description: 'Correlation analysis',
    category: 'visualization'
  },
  {
    id: 'box-plot',
    name: 'Box Plot',
    icon: 'Box',
    description: 'Distribution analysis',
    category: 'visualization'
  },
  {
    id: 'bar-chart',
    name: 'Bar Chart',
    icon: 'BarChart3',
    description: 'Categorical visualization',
    category: 'visualization'
  },
  {
    id: 'mean-average',
    name: 'Mean Average',
    icon: 'Calculator',
    description: 'Statistical processing',
    category: 'processing'
  },
  {
    id: 'blank-remover',
    name: 'Blank Remover',
    icon: 'Filter',
    description: 'Data cleaning',
    category: 'processing'
  }
];

const iconMap: Record<string, React.ComponentType<any>> = {
  Upload,
  Database,
  LineChart,
  Scatter3D,
  Box,
  BarChart3,
  Calculator,
  Filter
};

interface DraggableWidgetProps {
  widgetType: WidgetType;
}

const DraggableWidget: React.FC<DraggableWidgetProps> = ({ widgetType }) => {
  const { theme } = useTheme();
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'widget',
    item: { type: widgetType.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const IconComponent = iconMap[widgetType.icon];

  return (
    <div
      ref={drag}
      className={`group relative cursor-move transition-all duration-300 flex flex-col items-center ${
        isDragging ? 'opacity-50 scale-95' : 'hover:scale-105'
      }`}
    >
      <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
        ${theme === 'dark'
          ? 'bg-gray-200 border-2 border-blue-200'
          : 'bg-white border-2 border-blue-200'}
      `}>
        <IconComponent className={`h-6 w-6 transition-colors duration-300 ${
          theme === 'dark' ? 'text-blue-700' : 'text-blue-600'
        }`} />
      </div>
      {/* Always show widget name below icon */}
      <span className={`mt-2 text-sm font-medium text-center ${
        theme === 'dark' ? 'text-blue-900' : 'text-blue-700'
      }`}>
        {widgetType.name}
      </span>
    </div>
  );
};

interface SidebarProps {
  onAddWidget: (type: string, position: { x: number; y: number }) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onAddWidget }) => {
  const { theme } = useTheme();
  // ensure onAddWidget is referenced to avoid unused var linting
  void onAddWidget;
  // Start collapsed after login; user must click section headers to open
  const [showInputOpen, setShowInputOpen] = useState<boolean>(false);
  const [showProcessingOpen, setShowProcessingOpen] = useState<boolean>(false);
  const [showVisualizationOpen, setShowVisualizationOpen] = useState<boolean>(false);

  const categories = {
    input: widgetTypes.filter(w => w.category === 'input'),
    processing: widgetTypes.filter(w => w.category === 'processing'),
    visualization: widgetTypes.filter(w => w.category === 'visualization')
  };

  const handleDragStart = (type: string) => (e: React.DragEvent) => {
    e.dataTransfer.setData('application/widget-type', type);
  };

  return (
    <aside className={`w-64 border-r transition-colors duration-300 ${
      theme === 'dark'
        ? 'bg-white border-blue-100' // force white for both themes
        : 'bg-white border-blue-100'
    }`}>
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-6 text-gray-800">
          Widget Toolbox
        </h2>
        {/* Quick category boxes (stacked vertically) */}
        <div className="flex flex-col gap-3 mb-4">
          <div>
            <button
              type="button"
              aria-label="Open Data Input section"
              onClick={() => {
                setShowInputOpen((prev) => {
                  const next = !prev;
                  if (next) {
                    setShowProcessingOpen(false);
                    setShowVisualizationOpen(false);
                  }
                  return next;
                });
              }}
              className={`w-full p-3 rounded-lg transition-colors duration-200 text-left border ${theme === 'dark' ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-700">📤</div>
                <div>
                  <div className="text-sm font-medium">Data Input</div>
                  <div className="text-xs text-gray-500">{categories.input.length} widgets</div>
                </div>
              </div>
            </button>

            {showInputOpen && (
              <div className="mt-3">
                <div className="flex flex-col gap-3">
                  {categories.input.map((widget) => (
                    <div
                      key={widget.id}
                      draggable
                      onDragStart={handleDragStart(widget.id)}
                      className="cursor-move p-2 rounded bg-white shadow hover:bg-blue-50 transition flex items-center gap-3"
                    >
                      <DraggableWidget widgetType={widget} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              aria-label="Open Processing section"
              onClick={() => {
                setShowProcessingOpen((prev) => {
                  const next = !prev;
                  if (next) {
                    setShowInputOpen(false);
                    setShowVisualizationOpen(false);
                  }
                  return next;
                });
              }}
              className={`w-full p-3 rounded-lg transition-colors duration-200 text-left border ${theme === 'dark' ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-pink-100 text-pink-700">🧹</div>
                <div>
                  <div className="text-sm font-medium">Processing</div>
                  <div className="text-xs text-gray-500">{categories.processing.length} widgets</div>
                </div>
              </div>
            </button>

            {showProcessingOpen && (
              <div className="mt-3">
                <div className="flex flex-col gap-3">
                  {categories.processing.map((widget) => (
                    <div
                      key={widget.id}
                      draggable
                      onDragStart={handleDragStart(widget.id)}
                      className="cursor-move p-2 rounded bg-white shadow hover:bg-blue-50 transition flex items-center gap-3"
                    >
                      <DraggableWidget widgetType={widget} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              aria-label="Open Visualization section"
              onClick={() => {
                setShowVisualizationOpen((prev) => {
                  const next = !prev;
                  if (next) {
                    setShowInputOpen(false);
                    setShowProcessingOpen(false);
                  }
                  return next;
                });
              }}
              className={`w-full p-3 rounded-lg transition-colors duration-200 text-left border ${theme === 'dark' ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 text-green-700">📈</div>
                <div>
                  <div className="text-sm font-medium">Visualization</div>
                  <div className="text-xs text-gray-500">{categories.visualization.length} widgets</div>
                </div>
              </div>
            </button>

            {showVisualizationOpen && (
              <div className="mt-3">
                <div className="flex flex-col gap-3">
                  {categories.visualization.map((widget) => (
                    <div
                      key={widget.id}
                      draggable
                      onDragStart={handleDragStart(widget.id)}
                      className="cursor-move p-2 rounded bg-white shadow hover:bg-blue-50 transition flex items-center gap-3"
                    >
                      <DraggableWidget widgetType={widget} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* The lower grid sections have been replaced by inline expansions under the top buttons. */}
      </div>
    </aside>
  );
};

export default Sidebar;