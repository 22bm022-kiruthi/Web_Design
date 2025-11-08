import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
  Upload,
  Database,
  Filter,
  Calculator,
  LineChart,
  BarChart3,
  ScatterChart,
  Box,
  Table,
  Code,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<any>> = {
  'file-upload': Upload,
  'supabase': Database,
  'noise-filter': Filter,
  'baseline-correction': Filter,
  'smoothing': Filter,
  'normalization': Filter,
  'mean-average': Calculator,
  'line-chart': LineChart,
  'bar-chart': BarChart3,
  'scatter-plot': ScatterChart,
  'box-plot': Box,
  'data-table': Table,
  'custom-code': Code,
};

const categoryColors: Record<string, { main: string; light: string; bg: string }> = {
  'data': { main: '#FF9800', light: '#FFB74D', bg: '#FFF3E0' },
  'processing': { main: '#4CAF50', light: '#81C784', bg: '#E8F5E9' },
  'analysis': { main: '#9C27B0', light: '#BA68C8', bg: '#F3E5F5' },
  'visualization': { main: '#2196F3', light: '#64B5F6', bg: '#E3F2FD' },
};

const widgetCategories: Record<string, string> = {
  'file-upload': 'data',
  'supabase': 'data',
  'noise-filter': 'processing',
  'baseline-correction': 'processing',
  'smoothing': 'processing',
  'normalization': 'processing',
  'mean-average': 'analysis',
  'custom-code': 'analysis',
  'line-chart': 'visualization',
  'bar-chart': 'visualization',
  'scatter-plot': 'visualization',
  'box-plot': 'visualization',
  'data-table': 'visualization',
};

const getWidgetLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'file-upload': 'File Upload',
    'supabase': 'Supabase',
    'noise-filter': 'Noise Filter',
    'baseline-correction': 'Baseline',
    'smoothing': 'Smoothing',
    'normalization': 'Normalize',
    'mean-average': 'Mean/Average',
    'custom-code': 'Custom Code',
    'line-chart': 'Line Chart',
    'bar-chart': 'Bar Chart',
    'scatter-plot': 'Scatter Plot',
    'box-plot': 'Box Plot',
    'data-table': 'Data Table',
  };
  return labels[type] || type;
};

export interface WorkflowNodeData {
  type: string;
  label?: string;
  status?: 'idle' | 'processing' | 'success' | 'error';
  hasData?: boolean;
}

const WorkflowNode: React.FC<NodeProps<WorkflowNodeData>> = ({ data, selected }) => {
  const Icon = iconMap[data.type] || Upload;
  const category = widgetCategories[data.type] || 'data';
  const colors = categoryColors[category];
  const label = data.label || getWidgetLabel(data.type);

  return (
    <div
      className="workflow-node"
      style={{
        width: '140px',
        height: '90px',
        background: 'white',
        borderRadius: '8px',
        border: selected ? `2px solid ${colors.main}` : '2px solid #e0e0e0',
        boxShadow: selected 
          ? `0 4px 12px ${colors.main}40, 0 2px 8px rgba(0, 0, 0, 0.12)` 
          : '0 2px 8px rgba(0, 0, 0, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      {/* Input Port (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: '12px',
          height: '12px',
          background: colors.main,
          border: '2px solid white',
          left: '-6px',
        }}
      />

      {/* Icon Circle */}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: colors.main,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 2px 6px ${colors.main}40`,
        }}
      >
        <Icon className="h-5 w-5 text-white" strokeWidth={2.5} />
      </div>

      {/* Label */}
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: '#333',
          textAlign: 'center',
          maxWidth: '120px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>

      {/* Status Indicator */}
      {data.status && data.status !== 'idle' && (
        <div
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background:
              data.status === 'success'
                ? '#4CAF50'
                : data.status === 'processing'
                ? '#FF9800'
                : '#F44336',
          }}
        />
      )}

      {/* Output Port (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: '12px',
          height: '12px',
          background: colors.main,
          border: '2px solid white',
          right: '-6px',
        }}
      />
    </div>
  );
};

export default WorkflowNode;
