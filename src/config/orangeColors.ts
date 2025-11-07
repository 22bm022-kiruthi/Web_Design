/**
 * Orange Data Mining Style - Widget Color Schemes
 * Each widget type has consistent colors matching Orange software
 */

export interface WidgetColors {
  main: string;      // Primary color for icon circle
  light: string;     // Light color for dashed border
  bg: string;        // Background color
  accent: string;    // Accent color for highlights
}

export const WIDGET_COLORS: Record<string, WidgetColors> = {
  // DATA SOURCES - Blue
  'supabase': {
    main: '#2196F3',
    light: '#BBDEFB',
    bg: '#E3F2FD',
    accent: '#2196F3'
  },
  'file-upload': {
    main: '#FF9800',
    light: '#FFE4CC',
    bg: '#FFF8F0',
    accent: '#FF9800'
  },
  
  // PROCESSING - Green
  'noise-filter': {
    main: '#4CAF50',
    light: '#C8E6C9',
    bg: '#E8F5E9',
    accent: '#4CAF50'
  },
  'baseline-correction': {
    main: '#4CAF50',
    light: '#C8E6C9',
    bg: '#E8F5E9',
    accent: '#4CAF50'
  },
  'smoothing': {
    main: '#4CAF50',
    light: '#C8E6C9',
    bg: '#E8F5E9',
    accent: '#4CAF50'
  },
  'normalization': {
    main: '#4CAF50',
    light: '#C8E6C9',
    bg: '#E8F5E9',
    accent: '#4CAF50'
  },
  'blank-remover': {
    main: '#4CAF50',
    light: '#C8E6C9',
    bg: '#E8F5E9',
    accent: '#4CAF50'
  },
  
  // VISUALIZATION - Blue
  'line-chart': {
    main: '#2196F3',
    light: '#BBDEFB',
    bg: '#E3F2FD',
    accent: '#2196F3'
  },
  'scatter-plot': {
    main: '#2196F3',
    light: '#BBDEFB',
    bg: '#E3F2FD',
    accent: '#2196F3'
  },
  'bar-chart': {
    main: '#2196F3',
    light: '#BBDEFB',
    bg: '#E3F2FD',
    accent: '#2196F3'
  },
  'box-plot': {
    main: '#2196F3',
    light: '#BBDEFB',
    bg: '#E3F2FD',
    accent: '#2196F3'
  },
  'data-table': {
    main: '#2196F3',
    light: '#BBDEFB',
    bg: '#E3F2FD',
    accent: '#2196F3'
  },
  
  // ANALYSIS - Purple
  'custom-code': {
    main: '#9C27B0',
    light: '#E1BEE7',
    bg: '#F3E5F5',
    accent: '#9C27B0'
  },
  'mean-average': {
    main: '#9C27B0',
    light: '#E1BEE7',
    bg: '#F3E5F5',
    accent: '#9C27B0'
  },
  'peak-detection': {
    main: '#9C27B0',
    light: '#E1BEE7',
    bg: '#F3E5F5',
    accent: '#9C27B0'
  },
  
  // SPECIAL - Cyan
  'spectral-segmentation': {
    main: '#00BCD4',
    light: '#B2EBF2',
    bg: '#E0F7FA',
    accent: '#00BCD4'
  },
  'future-extraction': {
    main: '#00BCD4',
    light: '#B2EBF2',
    bg: '#E0F7FA',
    accent: '#00BCD4'
  }
};

/**
 * Get colors for a widget type
 * Falls back to gray if type not found
 */
export function getWidgetColors(widgetType: string): WidgetColors {
  return WIDGET_COLORS[widgetType] || {
    main: '#607D8B',
    light: '#CFD8DC',
    bg: '#ECEFF1',
    accent: '#607D8B'
  };
}

/**
 * Widget labels matching Orange Data Mining naming
 */
export const WIDGET_LABELS: Record<string, string> = {
  'supabase': 'Datasets',
  'file-upload': 'File',
  'noise-filter': 'Preprocess',
  'baseline-correction': 'Baseline',
  'smoothing': 'Smooth',
  'normalization': 'Normalize',
  'blank-remover': 'Select',
  'line-chart': 'Line Plot',
  'scatter-plot': 'Scatter',
  'bar-chart': 'Bar Plot',
  'box-plot': 'Box Plot',
  'data-table': 'Data Table',
  'custom-code': 'Python Script',
  'mean-average': 'Aggregate',
  'peak-detection': 'Peaks',
  'spectral-segmentation': 'Segment',
  'future-extraction': 'Extract'
};

export function getWidgetLabel(widgetType: string): string {
  return WIDGET_LABELS[widgetType] || widgetType;
}
