import React from 'react';
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
        <div className="space-y-8">
          <div>
            <h3 className="text-sm font-medium mb-4 uppercase tracking-wide text-gray-600">
              Data Input
            </h3>
            <div className="space-y-4">
              {categories.input.map((widget) => (
                <div
                  key={widget.id}
                  draggable
                  onDragStart={handleDragStart(widget.id)}
                  className="cursor-move px-4 py-2 rounded bg-white shadow hover:bg-blue-100 transition flex flex-col items-center"
                >
                  <DraggableWidget widgetType={widget} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-4 uppercase tracking-wide text-gray-600">
              Processing
            </h3>
            <div className="space-y-4">
              {categories.processing.map((widget) => (
                <div
                  key={widget.id}
                  draggable
                  onDragStart={handleDragStart(widget.id)}
                  className="cursor-move px-4 py-2 rounded bg-white shadow hover:bg-blue-100 transition flex flex-col items-center"
                >
                  <DraggableWidget widgetType={widget} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-4 uppercase tracking-wide text-gray-600">
              Visualization
            </h3>
            <div className="space-y-4">
              {categories.visualization.map((widget) => (
                <div
                  key={widget.id}
                  draggable
                  onDragStart={handleDragStart(widget.id)}
                  className="cursor-move px-4 py-2 rounded bg-white shadow hover:bg-blue-100 transition flex flex-col items-center"
                >
                  <DraggableWidget widgetType={widget} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;