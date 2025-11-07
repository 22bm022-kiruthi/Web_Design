import React, { useState, useEffect, useRef } from 'react';
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
  Settings,
  GripVertical,
  Code,
  Table,
} from 'lucide-react';
import { Widget } from '../types';
import WidgetSelectorModal from './WidgetSelectorModal';
import widgetRegistry from '../utils/widgetRegistry';
import DataTableModal from './DataTableModal';
import MeanAverageModal from './MeanAverageModal';
import LineChartModal from './LineChModal';
import ScatterPlotModal from './ScatterPlotModal';
import BoxPlotModal from './BoxPlotModal';
import BarChartModal from './BarChartModal';
import { useTheme } from '../contexts/ThemeContext';
import OrangeStyleWidget from './OrangeStyleWidget';
import { getWidgetColors, getWidgetLabel } from '../config/orangeColors';

const iconMap: Record<string, React.ComponentType<any>> = {
  'file-upload': Upload,
  'supabase': Database,
  'data-table': Table,
  'line-chart': LineChart,
  'scatter-plot': Scatter3D,
  'box-plot': Box,
  'bar-chart': BarChart3,
  'mean-average': Calculator,
  'blank-remover': Filter,
  'noise-filter': Filter,
  'baseline-correction': Filter,
  'smoothing': Filter,
  'normalization': Filter,
  'custom-code': Code,
};

interface CanvasWidgetProps {
  widget: Widget;
  isConnecting: boolean;
  isConnectingFrom: boolean;
  onUpdatePosition: (position: { x: number; y: number }) => void;
  onDelete: () => void;
  onOpenConfig: () => void;
  onUpdateWidget?: (updates: Partial<Widget>) => void;
  // can pass a port string or an object with clientX/clientY to start from an exact point
  onStartConnection: (portOrPoint?: 'top' | 'left' | 'right' | 'bottom' | { clientX: number; clientY: number }) => void;
  highlightAngle?: number | null;
  onEndConnection: () => void;
  isHighlighted?: boolean;
  onRemoveConnections?: () => void;
  // onCreateConnection removed - Canvas manages final creation
  onRemoveConnection?: (fromId: string, toId: string) => void;
  isConnectedTo?: (toId: string) => boolean;
  uploadStatus?: 'uploading' | 'success' | 'error' | null;
  onCreateLinkedNode?: (sourceId: string, widgetTypeId: string) => void;
  onAddWidget?: (type: string, position: { x: number; y: number }, initialData?: any) => string | void;
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
  onUpdateWidget,
  onCreateLinkedNode,
  isHighlighted = false,
  highlightAngle = null,
  onRemoveConnections,
  onAddWidget,
}) => {
  // avoid unused variable lint when highlightAngle not used in this file
  void highlightAngle;
  // mark isConnecting as used to avoid unused variable lint
  void isConnecting;
  const { theme } = useTheme();
  const [showControls, setShowControls] = useState(false);
  // Note: context controls are toggled via the main hover controls (setShowControls)
  // local connectingTarget removed; connection lifecycle is managed by Canvas
  const [showTableModal, setShowTableModal] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextPos, setContextPos] = useState<{ x: number; y: number } | null>(null);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [iconLoadFailed, setIconLoadFailed] = useState(false);

  useEffect(() => {
    const onGlobalClick = () => {
      setShowContextMenu(false);
      setContextPos(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowContextMenu(false);
        setEditingLabel(null);
      }
    };
    window.addEventListener('click', onGlobalClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('click', onGlobalClick);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  // Helper to try multiple backend endpoints (relative -> 127.0.0.1:5003 -> localhost:5003)
  const fetchToBackend = async (path: string, options?: RequestInit) => {
    const candidates = [path, `http://127.0.0.1:5003${path}`, `http://localhost:5003${path}`];
    let lastError: any = null;
    for (const url of candidates) {
      try {
        const resp = await fetch(url, options);
        return resp; // return whatever the server returned (caller will parse JSON)
      } catch (err) {
        lastError = err;
        // try next candidate
        console.debug('[CanvasWidget] fetchToBackend candidate failed:', url, err);
      }
    }
    // all attempts failed
    throw lastError || new Error('Failed to reach backend');
  };

  // --- Mean Average Widget State ---
  // keep per-widget mode so each Mean/Average instance can independently use row/column
  const [widgetModes, setWidgetModes] = useState<Record<string, 'row' | 'column'>>({});
  const mode = widgetModes[widget.id] || 'row';
  const setMode = (val: 'row' | 'column') => setWidgetModes((prev) => ({ ...(prev || {}), [widget.id]: val }));
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [selectedCols, setSelectedCols] = useState<number[]>([]);
  const [showMeanModal, setShowMeanModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingLocal, setUploadingLocal] = useState(false);
  const [uploadErrorLocal, setUploadErrorLocal] = useState<string | null>(null);
  // Local file upload handler (moved here to avoid JSX parsing issues)
  const handleLocalFile = async (file: any) => {
    if (!file) return;
    setUploadingLocal(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const uploadUrl = apiUrl ? `${apiUrl}/upload` : '/api/upload';
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(uploadUrl, { method: 'POST', body: fd });
      if (!res.ok) {
        setUploadErrorLocal(`Upload failed (status ${res.status})`);
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (onUpdateWidget) onUpdateWidget({ data: { filename: file.name, fileId: body.fileId, type: file.type, parsedData: body.parsedData } });
    } catch (err: any) {
      setUploadErrorLocal(String(err?.message || err));
      console.error('handleLocalFile error:', err);
    } finally {
      setUploadingLocal(false);
    }
  };
  const [showLineChartModal, setShowLineChartModal] = useState(false);
  const [modalPreviewData, setModalPreviewData] = useState<Record<string, any>[] | null>(null);
  const [showScatterModal, setShowScatterModal] = useState(false);
  const [showBoxPlotModal, setShowBoxPlotModal] = useState(false);
  const [showBarChartModal, setShowBarChartModal] = useState(false);
  const [isSupabaseHover, setIsSupabaseHover] = useState(false);
  // referenced to avoid unused-variable lint when hover state is not consumed yet
  void isSupabaseHover;
  void setIsSupabaseHover;
  // Local baseline params (keep as component-local editable copy and sync to widget.data)
  const [localBaselineParams, setLocalBaselineParams] = useState<Record<string, any>>(widget.data?.baselineParams || { method: 'min_subtract', window: 5, degree: 2 });
  useEffect(() => {
    // sync from external widget.data when it changes
    if (widget.data && widget.data.baselineParams) setLocalBaselineParams(widget.data.baselineParams);
  }, [widget.data?.baselineParams]);

  // Noise filter window size (used by noise-filter widget). Keep synced with widget.data.noiseParams if present.
  const [noiseWindow, setNoiseWindow] = useState<number>(widget.data?.noiseParams?.window || 5);
  const [noiseMethod, setNoiseMethod] = useState<string>(widget.data?.noiseParams?.method || 'moving_average');
  const [noiseSigma, setNoiseSigma] = useState<number>(widget.data?.noiseParams?.sigma || 1.0);
  const [noiseOrder, setNoiseOrder] = useState<number>(widget.data?.noiseParams?.order || 2);
  const [localNoiseParams, setLocalNoiseParams] = useState({
    window: widget.data?.noiseParams?.window || 5,
    method: widget.data?.noiseParams?.method || 'moving_average',
    sigma: widget.data?.noiseParams?.sigma || 1.0,
    order: widget.data?.noiseParams?.order || 2
  });
  void localNoiseParams;
  void setLocalNoiseParams;

  useEffect(() => {
    if (widget.data && widget.data.noiseParams) {
      if (typeof widget.data.noiseParams.window === 'number') setNoiseWindow(widget.data.noiseParams.window);
      if (widget.data.noiseParams.method) setNoiseMethod(widget.data.noiseParams.method);
      if (typeof widget.data.noiseParams.sigma === 'number') setNoiseSigma(widget.data.noiseParams.sigma);
      if (typeof widget.data.noiseParams.order === 'number') setNoiseOrder(widget.data.noiseParams.order);
      setLocalNoiseParams(widget.data.noiseParams);
    }
  }, [widget.data?.noiseParams]);

  const data: Record<string, any>[] = widget.data?.tableData || [];
  const columns: string[] = data.length > 0 ? Object.keys(data[0]) : [];

  // Reset selections when mode or data changes
  useEffect(() => {
    setSelectedRows([]);
    setSelectedCols([]);
  }, [mode, data.length, columns.join(',')]);

  // Auto-open Data Table modal when this data-table widget receives data (transition from empty->non-empty)
  useEffect(() => {
    if (widget.type !== 'data-table') return;
    const hasData = (widget.data?.tableData && widget.data.tableData.length > 0) || (widget.data?.parsedData && widget.data.parsedData.length > 0);
    if (hasData) {
      setShowTableModal(true);
    }
    // Only depend on widget.data to trigger when rows arrive
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widget.data]);

  const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
    type: 'canvas-widget',
    item: { id: widget.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));
  // Dragging is only available via the in-circle drag handle (attach `drag` to the handle).

  const IconComponent = iconMap[widget.type] || Upload;
  const showUploadStatus = widget.type === 'supabase';
  const customIconPath = `/${widget.type}.svg`;
  const isSupabase = widget.type === 'supabase';

  // Supabase widget state for manual fetch
  const [sbTableName, setSbTableName] = useState<string>(widget.data?.supabaseTable || 'raman_data');
  const [sbSampleFilter, setSbSampleFilter] = useState<string>(widget.data?.sampleFilter || '');
  const [sbFetching, setSbFetching] = useState(false);

  // Manual fetch function for Supabase widget (uses server-side credentials from backend/.env)
  const fetchSupabaseData = async () => {
    if (!isSupabase) return;
    setSbFetching(true);
    try {
      onUpdateWidget?.({ data: { ...(widget.data || {}), fetchStatus: 'fetching', fetchError: null, supabaseTable: sbTableName, sampleFilter: sbSampleFilter } });
      
      // Build query with optional sample name filter (use fetchToBackend helper)
      let path = `/api/supabase/fetch?table=${encodeURIComponent(sbTableName)}&limit=200`;
      if (sbSampleFilter && sbSampleFilter.trim()) {
        path += `&filter=Sample name.eq.${encodeURIComponent(sbSampleFilter.trim())}`;
      }

      const res = await fetchToBackend(path, { method: 'GET' });
      if (!res.ok) {
        const txt = await res.text();
        onUpdateWidget?.({ data: { ...(widget.data || {}), fetchStatus: 'error', fetchError: txt } });
        return;
      }
      const body = await res.json();
      let rows = body?.data || body || [];
      
      // CLIENT-SIDE FILTER: If backend filter didn't work, filter here
      if (sbSampleFilter && sbSampleFilter.trim()) {
        const filterValue = sbSampleFilter.trim();
        const beforeFilter = rows.length;
        rows = rows.filter((row: any) => row['Sample name'] === filterValue);
        console.log(`[Supabase] Client-side filter: ${beforeFilter} rows → ${rows.length} rows (Sample name = "${filterValue}")`);
      }
      
      // Auto-map to plotting format
      const sample = rows && rows.length ? rows[0] : {};
      const keys = Object.keys(sample || {});
      const lower = keys.map((k: string) => k.toLowerCase());
      const xCandidates = ['shift','x','wavenumber','wavenumber_cm','raman_shift'];
      const yCandidates = ['intensity','y','counts','value'];
      const pickCol = (cands: string[]) => {
        for (const c of cands) {
          const idx = lower.indexOf(c.toLowerCase());
          if (idx >= 0) return keys[idx];
        }
        return keys[0] || null;
      };
      const xCol = pickCol(xCandidates);
      const yCol = pickCol(yCandidates) || (keys[1] || keys[0]);
      
      const mapped = rows.map((r: Record<string, any>) => {
        const x = xCol ? Number(r[xCol]) : null;
        const y = yCol ? Number(r[yCol]) : null;
        return { shift: Number.isFinite(x) ? x : null, intensity: Number.isFinite(y) ? y : null, __raw: r };
      }).filter((d: any) => d.shift !== null && d.intensity !== null);
      
      onUpdateWidget?.({ data: { ...(widget.data || {}), tableData: rows, tableDataProcessed: mapped, fetchStatus: 'success', supabaseTable: sbTableName } });
    } catch (err: any) {
      onUpdateWidget?.({ data: { ...(widget.data || {}), fetchStatus: 'error', fetchError: String(err) } });
    } finally {
      setSbFetching(false);
    }
  };

  // Connection handlers are provided by Canvas via props (onStartConnection/onEndConnection)

  // Dragging is available only via the drag handle (react-dnd `drag` ref).
  // Keep onUpdatePosition reference to avoid unused variable lint.
  void onUpdatePosition;
  // Mark onEndConnection as used to satisfy linter (actual handling is in Canvas)
  void onEndConnection;

  // Mean/Average modal data and selection are handled inside the modal.

  const renderWidgetContent = () => {
    if (widget.type === 'data-table') {
      const hasData = (widget.data?.tableData && widget.data.tableData.length > 0) || 
                      (widget.data?.parsedData && widget.data.parsedData.length > 0);
      
      const colors = getWidgetColors('data-table');
      
      return (
        <OrangeStyleWidget
          icon={Table}
          label={getWidgetLabel('data-table')}
          statusText={hasData ? 'Data loaded' : 'No data'}
          statusColor={hasData ? 'green' : 'gray'}
          mainColor={colors.main}
          lightColor={colors.light}
          bgColor={colors.bg}
        >
          {/* Controls section - shown on hover */}
          <div className="mt-2 flex flex-col items-center gap-2">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setShowTableModal(true); 
              }} 
              className="px-3 py-1.5 text-xs font-medium rounded transition-colors"
              style={{
                backgroundColor: colors.light,
                color: colors.main,
              }}
            >
              Open table
            </button>
          </div>
        </OrangeStyleWidget>
      );
    }

    if (widget.type === 'file-upload') {
      // Render the upload icon inside the standard connection circle so it matches other widgets
      return (
        <div className="flex flex-col items-center justify-center w-full h-full cursor-default px-2" onClick={(e) => e.stopPropagation()}>
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); (fileInputRef.current as HTMLInputElement | null)?.click(); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (fileInputRef.current as HTMLInputElement | null)?.click(); } }}
            className="rounded-full flex items-center justify-center focus:outline-none"
            style={{ borderRadius: 999, width: 80, height: 80 }}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center icon-outer`} style={{ width: 64, height: 64 }}>
              <Upload className={`h-6 w-6 transition-transform duration-200 icon ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
            </div>
          </div>

          <div className="mt-2 text-[12px] font-medium text-center">File Upload</div>

          {/* hidden native input used to open file explorer */}
          <input
            ref={fileInputRef as any}
            type="file"
            accept=".csv,.xls,.xlsx"
            className="hidden"
            onChange={(ev) => handleLocalFile(ev.target.files ? ev.target.files[0] : null)}
          />
          {uploadingLocal && <div className="mt-2 text-xs text-yellow-600">Uploading...</div>}
          {uploadErrorLocal && <div className="mt-2 text-xs text-red-600">{uploadErrorLocal}</div>}
        </div>
      );
      }
    
    if (widget.type === 'normalization') {
      const [method, setMethod] = useState<'minmax' | 'zscore'>('minmax');
      const [targetMin, setTargetMin] = useState<number>(0);
      const [targetMax, setTargetMax] = useState<number>(1);
      const [hasNormalized, setHasNormalized] = useState<boolean>(false);

      const runNormalization = () => {
        // Use processed data from previous widget (Noise Filter, Baseline, etc.)
        // Priority: tableDataProcessed (filtered/processed) > tableData (raw) > parsedData
        const tableData: Record<string, any>[] = 
          widget.data?.tableDataProcessed || 
          widget.data?.tableData || 
          widget.data?.parsedData || 
          [];
        
        if (!tableData || tableData.length === 0) {
          alert('⚠️ No input data!\n\nPlease connect a data source (File Upload, Supabase, Baseline, or Noise Filter) to this Normalization widget first.');
          return;
        }

        console.log(`[Normalization] ========== START NORMALIZATION ==========`);
        console.log(`[Normalization] Starting ${method} normalization on ${tableData.length} rows`);
        console.log(`[Normalization] Data source:`, widget.data?.tableDataProcessed ? 'tableDataProcessed (filtered/processed)' : widget.data?.tableData ? 'tableData (raw)' : 'parsedData (fallback)');
        console.log(`[Normalization] First row BEFORE normalization:`, tableData[0]);

        const columns = Object.keys(tableData[0]);
        const numericCols = columns.filter((c) => tableData.some((r) => !isNaN(Number(r[c]))));

        // FIXED LOGIC: Only exclude columns that are clearly X-axis (shift, wavenumber)
        // BUT if column name contains "intensity", always include it (even if it also contains "raman" or "shift")
        const xCandidates = ['shift', 'x', 'wavenumber', 'index', 'time', 'label', 's.no', 'id'];
        
        console.log(`[Normalization] 🔍 DEBUGGING COLUMN EXCLUSION:`);
        numericCols.forEach(col => {
          const lowerCol = col.toLowerCase();
          const hasIntensity = lowerCol.includes('intensity') || lowerCol.includes('int');
          const matchedCandidate = xCandidates.find(x => lowerCol.includes(x));
          console.log(`  - Column "${col}" (lowercase: "${lowerCol}")`);
          if (hasIntensity) {
            console.log(`    ✅ Will normalize! (contains "intensity")`);
          } else if (matchedCandidate) {
            console.log(`    ❌ Excluded (matched: "${matchedCandidate}")`);
          } else {
            console.log(`    ✅ Will normalize! (no exclusion match)`);
          }
        });
        
        // Include column if:
        // 1. It contains "intensity" OR
        // 2. It doesn't match any X-axis candidates
        const yCols = numericCols.filter((c) => {
          const lowerCol = c.toLowerCase();
          const hasIntensity = lowerCol.includes('intensity') || lowerCol.includes('int');
          const matchesXAxis = xCandidates.some((x) => lowerCol.includes(x));
          return hasIntensity || !matchesXAxis;
        });
        
        console.log(`[Normalization] All columns in data:`, columns);
        console.log(`[Normalization] All numeric columns:`, numericCols);
        console.log(`[Normalization] Columns to normalize (Y-axis only):`, yCols);
        console.log(`[Normalization] Excluded (X-axis):`, numericCols.filter(c => !yCols.includes(c)));
        
        if (yCols.length === 0) {
          alert('⚠️ ERROR: No intensity columns found to normalize!\n\nThe data might not have the expected column names.\n\nAvailable columns: ' + columns.join(', '));
          return;
        }

        let normalized: Record<string, any>[] = tableData.map((row) => ({ ...row }));

  if (method === 'minmax') {
          // compute min/max per column (only for Y columns)
          const mins: Record<string, number> = {};
          const maxs: Record<string, number> = {};
          yCols.forEach((col) => {
            const vals = tableData.map((r) => Number(r[col])).filter((v) => !isNaN(v));
            mins[col] = vals.length ? Math.min(...vals) : 0;
            maxs[col] = vals.length ? Math.max(...vals) : 0;
          });

          console.log(`[Normalization] Min-Max ranges:`, mins, maxs);
          console.log(`[Normalization] Target range: ${targetMin} → ${targetMax}`);

          // Do not round to fixed decimals so downstream charts show exact values
          // Only normalize Y columns, preserve X columns (Raman Shift, etc.)
          normalized = tableData.map((row, idx) => {
            const newRow: Record<string, any> = { ...row };
            yCols.forEach((col) => {
              const v = Number(row[col]);
              if (isNaN(v)) return;
              const min = mins[col];
              const max = maxs[col];
              if (max === min) {
                newRow[col] = (targetMin + targetMax) / 2;
              } else {
                const scaled = ((v - min) / (max - min)) * (targetMax - targetMin) + targetMin;
                newRow[col] = scaled;
                if (idx === 0) {
                  console.log(`[Normalization] First row ${col}: ${v} → ${scaled} (min=${min}, max=${max})`);
                }
              }
            });
            return newRow;
          });
          
          console.log(`[Normalization] First row AFTER normalization:`, normalized[0]);
        } else if (method === 'zscore') {
          // compute mean/std per column (only for Y columns)
          const means: Record<string, number> = {};
          const stds: Record<string, number> = {};
          yCols.forEach((col) => {
            const vals = tableData.map((r) => Number(r[col])).filter((v) => !isNaN(v));
            const mean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
            const variance = vals.length ? vals.reduce((a, b) => a + (b - mean) * (b - mean), 0) / vals.length : 0;
            means[col] = mean;
            stds[col] = Math.sqrt(variance);
          });

          console.log(`[Normalization] Z-score: means=`, means, 'stds=', stds);

          // Keep full precision for z-score as well
          // Only normalize Y columns, preserve X columns
          normalized = tableData.map((row) => {
            const newRow: Record<string, any> = { ...row };
            yCols.forEach((col) => {
              const v = Number(row[col]);
              if (isNaN(v)) return;
              const mean = means[col];
              const std = stds[col];
              newRow[col] = std === 0 ? 0 : (v - mean) / std;
            });
            return newRow;
          });
        }

        console.log(`[Normalization] ✅ Complete! Sample output (first 3 rows):`, normalized.slice(0, 3));

        // Calculate actual output range for verification
        const sampleIntensities = normalized.slice(0, 5).map(r => r['Raman intensity'] || r['Raman Intensity'] || r['intensity']);
        const outputMin = Math.min(...sampleIntensities.filter(v => v !== undefined));
        const outputMax = Math.max(...sampleIntensities.filter(v => v !== undefined));

        // CRITICAL: Set modal preview data FIRST before updating widget
        // This ensures the modal shows the normalized data immediately
        setModalPreviewData(normalized);
        setHasNormalized(true);
        console.log(`[Normalization] ✅ Saved to modalPreviewData: ${normalized.length} rows`);
        console.log(`[Normalization] ✅ Set hasNormalized flag to true`);

        if (onUpdateWidget) {
          onUpdateWidget({ data: { ...(widget.data || {}), tableDataProcessed: normalized, normalizationUsed: 'js', normalizationMethod: method, normalizationParams: { targetMin, targetMax } } });
        }

        // Show success message with actual output range
        alert(`✅ Normalization Applied!\n\nMethod: ${method === 'minmax' ? 'Min-Max' : 'Z-score'}\nRows processed: ${normalized.length}\n\n📊 OUTPUT PREVIEW:\nY-axis range: ${outputMin.toFixed(2)} to ${outputMax.toFixed(2)}\n${method === 'minmax' ? '(Should be 0-1)' : '(Z-score scaled)'}\n\n✅ NOW click green "View Data" button!`);
      };
      // compute overall range from available table data for display
      // Use processed data if available (from previous widget)
      const allTableData: Record<string, any>[] = 
        widget.data?.tableDataProcessed || 
        widget.data?.tableData || 
        widget.data?.parsedData || 
        [];
      let overallRangeText = '';
      if (allTableData && allTableData.length > 0) {
        const allCols = Object.keys(allTableData[0]);
        const allNumericCols = allCols.filter((c) => allTableData.some((r) => !isNaN(Number(r[c]))));
        const allVals: number[] = [];
        allNumericCols.forEach((col) => {
          allTableData.forEach((row) => {
            const v = Number(row[col]);
            if (!isNaN(v)) allVals.push(v);
          });
        });
        if (allVals.length) {
          const overallMin = Math.min(...allVals);
          const overallMax = Math.max(...allVals);
          overallRangeText = `${overallMin} → ${overallMax}`;
        }
      }

      // Function to preview normalization output
      const openNormalizationPreview = () => {
        console.log('[Normalization View] ============ START ============');
        console.log('[Normalization View] hasNormalized flag:', hasNormalized);
        console.log('[Normalization View] modalPreviewData:', modalPreviewData ? `${modalPreviewData.length} rows` : 'NONE');
        console.log('[Normalization View] widget.data.tableDataProcessed:', widget.data?.tableDataProcessed ? `${widget.data.tableDataProcessed.length} rows` : 'NONE');
        
        // First check: Has the user clicked "Apply" yet?
        if (!hasNormalized) {
          alert('⚠️ Normalization not applied yet!\n\nPlease click the blue "Apply" button first to normalize the data.\n\nThen click "View Data" to see the result.');
          console.log('[Normalization View] ❌ Blocked: hasNormalized is false');
          return;
        }
        
        // PRIORITY: Use modalPreviewData (set immediately after normalization)
        const processed = modalPreviewData;
        
        if (!processed || processed.length === 0) {
          alert('⚠️ No normalized data found!\n\nPlease click "Apply" button to run normalization.');
          console.log('[Normalization View] ❌ No data in modalPreviewData');
          return;
        }
        
        console.log('[Normalization View] ✅ Found normalized data:', processed.length, 'rows');
        
        // Check the actual values to verify normalization
        if (processed.length > 0) {
          const firstRow = processed[0];
          const cols = Object.keys(firstRow);
          const intensityCols = cols.filter(c => c.toLowerCase().includes('intensity'));
          
          if (intensityCols.length > 0) {
            const sampleValues = processed.slice(0, 5).map((r: any) => r[intensityCols[0]]);
            console.log('[Normalization View] Sample intensity values:', sampleValues);
            const minVal = Math.min(...sampleValues.map(Number));
            const maxVal = Math.max(...sampleValues.map(Number));
            console.log('[Normalization View] Min:', minVal);
            console.log('[Normalization View] Max:', maxVal);
            
            if (maxVal > 10) {
              console.log('[Normalization View] ❌ WARNING: Data not normalized!');
              alert(`⚠️ WARNING: Data appears NOT normalized!\n\nMax value found: ${maxVal.toFixed(2)}\nExpected: ~1.0\n\nTry clicking "Apply" button again.`);
              return;
            }
            
            console.log(`[Normalization View] ✅ Data is normalized! Range: ${minVal.toFixed(4)} to ${maxVal.toFixed(4)}`);
          }
        }
        
        console.log('[Normalization View] Opening modal with processed data...');
        setShowLineChartModal(true);
        console.log('[Normalization View] ============ END ============');
      };

      return (
        <div className="flex flex-col items-center justify-center w-full h-full cursor-default px-2" onClick={(e) => e.stopPropagation()}>
          <div className="mb-2 flex items-center gap-2 text-sm">
            <label className="text-xs">Method:</label>
            <select value={method} onChange={(e) => setMethod(e.target.value as any)} className="px-2 py-1 border rounded text-xs">
              <option value="minmax">Min-Max</option>
              <option value="zscore">Z-score</option>
            </select>
          </div>

          {method === 'minmax' && (
            <div className="mb-2 flex items-center gap-2 text-xs">
              <label className="text-xs">Range:</label>
              <input type="number" value={targetMin} onChange={(e) => setTargetMin(Number(e.target.value))} className="w-16 px-2 py-1 border rounded text-xs" />
              <span className="text-xs">→</span>
              <input type="number" value={targetMax} onChange={(e) => setTargetMax(Number(e.target.value))} className="w-16 px-2 py-1 border rounded text-xs" />
            </div>
          )}

          {/* Apply and View Data buttons */}
          <div className="mb-2 flex gap-2">
            <button 
              type="button" 
              onClick={() => runNormalization()} 
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700"
              title="Apply normalization to the data"
            >
              Apply
            </button>
            <button 
              type="button" 
              onClick={() => openNormalizationPreview()} 
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700"
              title="View normalized output in chart"
            >
              View Data
            </button>
          </div>

          {/* Outer connection circle */}
          <div className="rounded-full p-1 flex items-center justify-center" style={{ border: '2px dashed rgba(0,0,0,0.06)', borderRadius: 999 }}>
            {/* Inner icon circle */}
            <div
              className="rounded-full p-1 flex items-center justify-center"
              style={{ borderRadius: 999 }}
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center icon-outer`}
                style={{ width: 64, height: 64 }}
              >
                <Calculator className={`h-5 w-5 transition-transform duration-200 icon ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`} />
              </div>
            </div>
          </div>

          <div className="mt-2 text-[12px] font-medium text-center">Normalization</div>
          {overallRangeText && <div className="text-xs text-gray-500 mt-1">Overall: {overallRangeText}</div>}
        </div>
      );
    }
    if (widget.type === 'future-extraction') {
      const [method, setMethod] = useState<'naive' | 'linear' | 'moving_average' | 'exponential' | 'pattern' | 'peak_detection' | 'statistical_features' | 'spectral_fingerprint'>('linear');
      const [horizon, setHorizon] = useState<number>(10);
      const [lookback, setLookback] = useState<number>(20);
      const [alpha, setAlpha] = useState<number>(0.3);
      const [minDistance, setMinDistance] = useState<number>(5);
      const [threshold, setThreshold] = useState<number>(0.3);
      const [numPeaks, setNumPeaks] = useState<number>(5);

      const runForecast = () => {
        const tableData: Record<string, any>[] = widget.data?.tableDataProcessed || widget.data?.tableData || widget.data?.parsedData || [];
        if (!tableData || tableData.length === 0) {
          alert('⚠️ No data available for forecasting!\n\nPlease connect a data source first.');
          return;
        }

        console.log(`[Future Extraction] Starting ${method} with ${tableData.length} data points`);

        // Feature Extraction Methods (Peak Detection, Statistical Features, Spectral Fingerprinting)
        if (method === 'peak_detection' || method === 'statistical_features' || method === 'spectral_fingerprint') {
          // Try multiple possible column names for intensity and shift
          const intensityKeys = ['intensity', 'Raman intensity', 'Raman Intensity', 'raman intensity', 'Intensity', 'y', 'Y'];
          const shiftKeys = ['shift', 'Raman shift', 'Raman Shift', 'raman shift', 'Shift', 'x', 'X', 'wavenumber', 'Wavenumber'];
          
          let intensityKey = intensityKeys.find(key => tableData[0] && tableData[0][key] !== undefined);
          let shiftKey = shiftKeys.find(key => tableData[0] && tableData[0][key] !== undefined);
          
          if (!intensityKey) {
            // Fallback: find first numeric column
            const cols = Object.keys(tableData[0] || {});
            intensityKey = cols.find(col => !isNaN(Number(tableData[0][col])));
          }
          
          console.log(`[Future Extraction] Using columns: intensity="${intensityKey}", shift="${shiftKey}"`);
          
          const intensities = tableData.map(r => Number(r[intensityKey as string] || 0));
          const shifts = tableData.map((r, i) => shiftKey ? Number(r[shiftKey] || i) : i);
          
          // Validate data
          const validIntensities = intensities.filter(v => !isNaN(v) && v !== 0);
          console.log(`[Future Extraction] Data validation: ${validIntensities.length}/${intensities.length} valid intensity values`);
          console.log(`[Future Extraction] Intensity range: ${Math.min(...validIntensities)} to ${Math.max(...validIntensities)}`);
          
          if (validIntensities.length === 0) {
            alert(`⚠️ No valid intensity data found!\n\nPossible issues:\n1. Wrong data source\n2. Column names don't match\n3. Data not loaded\n\nAvailable columns: ${Object.keys(tableData[0] || {}).join(', ')}`);
            return;
          }
          
          let resultData: any[] = [];
          
          if (method === 'peak_detection') {
            // Peak Detection
            console.log('[Peak Detection] Starting peak detection...');
            console.log(`[Peak Detection] Parameters: threshold=${threshold}, minDistance=${minDistance}`);
            console.log(`[Peak Detection] Data points: ${intensities.length}`);
            console.log(`[Peak Detection] Intensity range: ${Math.min(...intensities)} to ${Math.max(...intensities)}`);
            console.log(`[Peak Detection] Sample intensities (first 10):`, intensities.slice(0, 10));
            
            const peaks: any[] = [];
            
            for (let i = minDistance; i < intensities.length - minDistance; i++) {
              let is_peak = true;
              
              if (intensities[i] <= threshold) continue;
              
              // Check left side
              for (let j = 1; j <= minDistance; j++) {
                if (intensities[i] <= intensities[i - j]) {
                  is_peak = false;
                  break;
                }
              }
              
              if (!is_peak) continue;
              
              // Check right side
              for (let j = 1; j <= minDistance; j++) {
                if (intensities[i] <= intensities[i + j]) {
                  is_peak = false;
                  break;
                }
              }
              
              if (is_peak) {
                peaks.push({
                  peak_number: peaks.length + 1,
                  position: shifts[i],
                  intensity: intensities[i],
                  index: i
                });
                console.log(`[Peak Detection] Found peak #${peaks.length}: intensity=${intensities[i]} at position=${shifts[i]}`);
              }
            }
            
            // Sort by intensity
            resultData = peaks.sort((a, b) => b.intensity - a.intensity);
            console.log(`[Peak Detection] Found ${resultData.length} peaks`);
            console.log('[Peak Detection] Final results:', resultData);
            
            if (resultData.length === 0) {
              const dataMax = Math.max(...intensities);
              const suggestedThreshold = dataMax > 10 ? (dataMax * 0.1).toFixed(2) : '0.3';
              alert(`⚠️ No peaks found!\n\n` +
                    `Current Settings:\n` +
                    `• Threshold: ${threshold}\n` +
                    `• Min Distance: ${minDistance}\n\n` +
                    `Data Info:\n` +
                    `• Range: ${Math.min(...intensities).toFixed(2)} to ${dataMax.toFixed(2)}\n` +
                    `• Data points: ${intensities.length}\n\n` +
                    `💡 SUGGESTIONS:\n` +
                    `${dataMax > 10 ? `• Your data appears to be raw (not normalized)\n• Try threshold: ${suggestedThreshold}` : '• Lower threshold or minDistance'}`);
              return;
            }
            
            alert(`✅ Peak Detection Complete!\n\n` +
                  `Found ${resultData.length} peaks\n\n` +
                  `Strongest peak:\n` +
                  `• Position: ${resultData[0].position.toFixed(2)}\n` +
                  `• Intensity: ${resultData[0].intensity.toFixed(4)}\n\n` +
                  `Check Data Table for all peaks!`);

            
          } else if (method === 'statistical_features') {
            // Statistical Features
            console.log('[Statistical Features] Calculating statistics...');
            const mean_intensity = intensities.reduce((a, b) => a + b, 0) / intensities.length;
            const sorted_intensities = [...intensities].sort((a, b) => a - b);
            const median_intensity = sorted_intensities[Math.floor(sorted_intensities.length / 2)];
            const variance = intensities.reduce((a, b) => a + Math.pow(b - mean_intensity, 2), 0) / intensities.length;
            const std_intensity = Math.sqrt(variance);
            const max_intensity = Math.max(...intensities);
            const min_intensity = Math.min(...intensities);
            const percentile_25 = sorted_intensities[Math.floor(sorted_intensities.length * 0.25)];
            const percentile_75 = sorted_intensities[Math.floor(sorted_intensities.length * 0.75)];
            const iqr = percentile_75 - percentile_25;
            const skewness = std_intensity > 0 ? intensities.reduce((a, b) => a + Math.pow((b - mean_intensity) / std_intensity, 3), 0) / intensities.length : 0;
            const kurtosis = std_intensity > 0 ? intensities.reduce((a, b) => a + Math.pow((b - mean_intensity) / std_intensity, 4), 0) / intensities.length : 0;
            
            // Calculate area using trapezoidal rule
            let total_area = 0;
            for (let i = 1; i < intensities.length; i++) {
              total_area += (shifts[i] - shifts[i-1]) * (intensities[i] + intensities[i-1]) / 2;
            }
            
            const features = {
              mean_intensity,
              median_intensity,
              std_intensity,
              variance,
              max_intensity,
              min_intensity,
              intensity_range: max_intensity - min_intensity,
              percentile_25,
              percentile_75,
              iqr,
              skewness,
              kurtosis,
              total_area,
              num_points: intensities.length,
              shift_range: `${shifts[0].toFixed(1)} - ${shifts[shifts.length-1].toFixed(1)}`
            };
            
            resultData = Object.entries(features).map(([key, value]) => ({
              feature: key,
              value: typeof value === 'number' ? parseFloat(value.toFixed(4)) : value,
              category: 'statistics'
            }));
            
            console.log(`[Statistical Features] Extracted ${resultData.length} features`);
            alert(`📊 Statistical Features Extracted!\n\nTotal features: ${resultData.length}\nMean: ${mean_intensity.toFixed(4)}\nStd Dev: ${std_intensity.toFixed(4)}\nRange: ${(max_intensity - min_intensity).toFixed(4)}`);
            
          } else if (method === 'spectral_fingerprint') {
            // Spectral Fingerprinting
            console.log('[Spectral Fingerprint] Creating fingerprint...');
            console.log(`[Spectral Fingerprint] Parameters: numPeaks=${numPeaks}, minDistance=${minDistance}`);
            console.log(`[Spectral Fingerprint] Data points: ${intensities.length}`);
            console.log(`[Spectral Fingerprint] Intensity range: ${Math.min(...intensities)} to ${Math.max(...intensities)}`);
            
            const peaks: any[] = [];
            
            // Find all peaks
            for (let i = minDistance; i < intensities.length - minDistance; i++) {
              let is_peak = true;
              
              for (let j = 1; j <= minDistance; j++) {
                if (intensities[i] <= intensities[i - j] || intensities[i] <= intensities[i + j]) {
                  is_peak = false;
                  break;
                }
              }
              
              const peakThreshold = Math.max(...intensities) > 10 ? Math.max(...intensities) * 0.01 : 0.1;
              if (is_peak && intensities[i] > peakThreshold) {
                peaks.push({
                  position: shifts[i],
                  intensity: intensities[i],
                  relative_intensity: 0
                });
                console.log(`[Spectral Fingerprint] Found peak: intensity=${intensities[i]} at position=${shifts[i]}`);
              }
            }
            
            console.log(`[Spectral Fingerprint] Total peaks found: ${peaks.length}`);
            
            // Sort and take top N
            const sorted_peaks = peaks.sort((a, b) => b.intensity - a.intensity);
            const fingerprint_peaks = sorted_peaks.slice(0, numPeaks);
            
            // Calculate relative intensities
            if (fingerprint_peaks.length > 0) {
              const max_int = fingerprint_peaks[0].intensity;
              fingerprint_peaks.forEach(p => {
                p.relative_intensity = max_int > 0 ? p.intensity / max_int : 0;
              });
            }
            
            // Sort by position
            fingerprint_peaks.sort((a, b) => a.position - b.position);
            
            resultData = fingerprint_peaks.map((p, i) => ({
              rank: i + 1,
              position: parseFloat(p.position.toFixed(1)),
              intensity: parseFloat(p.intensity.toFixed(4)),
              relative_intensity: parseFloat(p.relative_intensity.toFixed(3)),
              percentage: parseFloat((p.relative_intensity * 100).toFixed(1))
            }));
            
            const fingerprint_id = fingerprint_peaks.map(p => p.position.toFixed(0)).join('-');
            resultData.push({
              fingerprint_id,
              num_peaks: resultData.length,
              type: 'summary'
            });
            
            console.log(`[Spectral Fingerprint] Created fingerprint with ${fingerprint_peaks.length} peaks`);
            console.log('[Spectral Fingerprint] Final results:', resultData);
            
            if (fingerprint_peaks.length === 0) {
              alert(`⚠️ No peaks found for fingerprint!\n\n` +
                    `Total peaks detected: ${peaks.length}\n` +
                    `Requested top: ${numPeaks}\n` +
                    `Data range: ${Math.min(...intensities).toFixed(2)} to ${Math.max(...intensities).toFixed(2)}\n\n` +
                    `� Try lowering minDistance (currently ${minDistance})`);
              return;
            }
            
            alert(`✅ Spectral Fingerprint Created!\n\n` +
                  `Fingerprint ID: ${fingerprint_id}\n\n` +
                  `Characteristic peaks: ${fingerprint_peaks.length}\n` +
                  `Positions: ${fingerprint_peaks.map(p => p.position.toFixed(0)).join(', ')}\n\n` +
                  `Check Data Table for details!`);

          }
          
          if (onUpdateWidget) {
            onUpdateWidget({
              data: {
                ...(widget.data || {}),
                tableDataProcessed: resultData,
                featureExtractionMethod: method,
                featureExtractionParams: { threshold, minDistance, numPeaks }
              }
            });
          }
          
          return;
        }

        // Forecasting Methods (existing code)
        const columns = Object.keys(tableData[0]);
        const numericCols = columns.filter((c) => tableData.some((r) => !isNaN(Number(r[c]))));

        // Prepare forecasts per column
        const colForecasts: Record<string, number[]> = {};
        
        numericCols.forEach((col) => {
          const valsAll = tableData.map((r) => Number(r[col])).filter((v) => !isNaN(v));
          
          if (method === 'naive') {
            // Naive: Repeat last value
            const last = valsAll.length ? valsAll[valsAll.length - 1] : 0;
            colForecasts[col] = Array(horizon).fill(Number((last).toFixed(4)));
            
          } else if (method === 'moving_average') {
            // Moving Average: Average of last N points
            const windowSize = Math.min(5, valsAll.length);
            const recentValues = valsAll.slice(-windowSize);
            const avgValue = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
            colForecasts[col] = Array(horizon).fill(Number(avgValue.toFixed(4)));
            
          } else if (method === 'linear') {
            // Linear Regression: Fit trend line
            const lb = Math.max(2, Math.min(lookback, valsAll.length));
            const start = valsAll.length - lb;
            const xs: number[] = [];
            const ys: number[] = [];
            for (let i = 0; i < lb; i++) {
              xs.push(i);
              ys.push(valsAll[start + i]);
            }
            const xMean = xs.reduce((a, b) => a + b, 0) / xs.length;
            const yMean = ys.reduce((a, b) => a + b, 0) / ys.length;
            let num = 0;
            let den = 0;
            for (let i = 0; i < xs.length; i++) {
              num += (xs[i] - xMean) * (ys[i] - yMean);
              den += (xs[i] - xMean) * (xs[i] - xMean);
            }
            const slope = den === 0 ? 0 : num / den;
            const intercept = yMean - slope * xMean;
            const preds: number[] = [];
            for (let h = 0; h < horizon; h++) {
              const xi = lb + h;
              const pred = Math.max(0, slope * xi + intercept);
              preds.push(Number(pred.toFixed(4)));
            }
            colForecasts[col] = preds;
            
          } else if (method === 'exponential') {
            // Exponential Smoothing: Weighted average with trend
            const smoothed = [valsAll[0]];
            for (let i = 1; i < valsAll.length; i++) {
              const smoothedValue = alpha * valsAll[i] + (1 - alpha) * smoothed[i - 1];
              smoothed.push(smoothedValue);
            }
            
            const trendWindow = Math.min(10, smoothed.length);
            const trend = (smoothed[smoothed.length - 1] - smoothed[smoothed.length - trendWindow]) / trendWindow;
            
            const preds: number[] = [];
            let currentForecast = smoothed[smoothed.length - 1];
            for (let h = 0; h < horizon; h++) {
              currentForecast = Math.max(0, currentForecast + trend);
              preds.push(Number(currentForecast.toFixed(4)));
            }
            colForecasts[col] = preds;
            
          } else if (method === 'pattern') {
            // Pattern-Based: Detect periodicity and repeat pattern
            const patternLength = Math.min(30, valsAll.length);
            const recentData = valsAll.slice(-patternLength);
            
            // Detect peaks to find period
            const peaks: number[] = [];
            for (let i = 1; i < recentData.length - 1; i++) {
              if (recentData[i] > recentData[i - 1] && recentData[i] > recentData[i + 1]) {
                peaks.push(i);
              }
            }
            
            let isPeriodic = false;
            let avgPeriod = patternLength;
            
            if (peaks.length >= 2) {
              const periods: number[] = [];
              for (let i = 1; i < peaks.length; i++) {
                periods.push(peaks[i] - peaks[i - 1]);
              }
              avgPeriod = Math.round(periods.reduce((a, b) => a + b, 0) / periods.length);
              isPeriodic = true;
            }
            
            const preds: number[] = [];
            if (isPeriodic) {
              // Repeat pattern
              const pattern = valsAll.slice(-avgPeriod);
              for (let h = 0; h < horizon; h++) {
                const patternIndex = h % pattern.length;
                preds.push(Number(pattern[patternIndex].toFixed(4)));
              }
            } else {
              // Use polynomial fit
              const x = Array.from({ length: recentData.length }, (_, i) => i);
              // Simple quadratic approximation
              const xMean = x.reduce((a, b) => a + b, 0) / x.length;
              const yMean = recentData.reduce((a, b) => a + b, 0) / recentData.length;
              let slope = 0, denom = 0;
              for (let i = 0; i < x.length; i++) {
                slope += (x[i] - xMean) * (recentData[i] - yMean);
                denom += (x[i] - xMean) * (x[i] - xMean);
              }
              slope = denom !== 0 ? slope / denom : 0;
              const intercept = yMean - slope * xMean;
              
              for (let h = 0; h < horizon; h++) {
                const xFuture = recentData.length + h;
                const pred = Math.max(0, slope * xFuture + intercept);
                preds.push(Number(pred.toFixed(4)));
              }
            }
            colForecasts[col] = preds;
          }
        });

        // Build forecast rows
        const lastRow = tableData[tableData.length - 1] || {};
        const forecastRows: Record<string, any>[] = [];
        
        for (let h = 0; h < horizon; h++) {
          const newRow: Record<string, any> = { ...lastRow };
          newRow._forecast = true;
          newRow._forecastStep = h + 1;
          newRow._forecastMethod = method;
          
          numericCols.forEach((col) => {
            const preds = colForecasts[col] || [];
            newRow[col] = preds[h] !== undefined ? preds[h] : newRow[col];
          });
          
          forecastRows.push(newRow);
        }

        const appended = [...tableData, ...forecastRows];
        
        if (onUpdateWidget) {
          onUpdateWidget({ 
            data: { 
              ...(widget.data || {}), 
              tableDataForecast: forecastRows, 
              tableDataProcessed: appended,
              forecastMethod: method,
              forecastParams: { horizon, lookback, alpha }
            } 
          });
        }

        console.log(`[Future Extraction] Generated ${forecastRows.length} forecast points using ${method} method`);
        alert(`✅ Forecast Complete!\n\nMethod: ${method}\nGenerated: ${forecastRows.length} future points\n\nConnect to Line Chart to visualize!`);
      };

      return (
        <div className="flex flex-col items-center justify-center w-full h-full cursor-default px-2" onClick={(e) => e.stopPropagation()}>
          {/* Method selector */}
          <div className="w-full px-2 mb-2 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <label className="text-xs font-semibold">Method:</label>
              <select 
                value={method} 
                onChange={(e) => setMethod(e.target.value as any)} 
                className="flex-1 px-2 py-1 border rounded text-xs"
              >
                <optgroup label="📈 Forecasting">
                  <option value="naive">Naive (Last Value)</option>
                  <option value="moving_average">Moving Average</option>
                  <option value="linear">Linear Trend</option>
                  <option value="exponential">Exponential Smoothing</option>
                  <option value="pattern">Pattern Detection</option>
                </optgroup>
                <optgroup label="🔍 Feature Extraction">
                  <option value="peak_detection">Peak Detection</option>
                  <option value="statistical_features">Statistical Features</option>
                  <option value="spectral_fingerprint">Spectral Fingerprinting</option>
                </optgroup>
              </select>
            </div>

            {/* Forecasting parameters */}
            {['naive', 'moving_average', 'linear', 'exponential', 'pattern'].includes(method) && (
              <>
                {/* Horizon parameter */}
                <div className="flex items-center gap-2 text-xs">
                  <label className="text-xs">Horizon:</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={50}
                    value={horizon} 
                    onChange={(e) => setHorizon(Number(e.target.value))} 
                    className="w-20 px-2 py-1 border rounded text-xs" 
                  />
                  <span className="text-[10px] text-gray-500">steps</span>
                </div>

                {/* Lookback (for linear, exponential, pattern) */}
                {(method === 'linear' || method === 'exponential' || method === 'pattern') && (
                  <div className="flex items-center gap-2 text-xs">
                    <label className="text-xs">Lookback:</label>
                    <input 
                      type="number" 
                      min={2} 
                      max={100}
                      value={lookback} 
                      onChange={(e) => setLookback(Number(e.target.value))} 
                      className="w-20 px-2 py-1 border rounded text-xs" 
                    />
                    <span className="text-[10px] text-gray-500">points</span>
                  </div>
                )}

                {/* Alpha (for exponential smoothing) */}
                {method === 'exponential' && (
                  <div className="flex items-center gap-2 text-xs">
                    <label className="text-xs">Alpha (α):</label>
                    <input 
                      type="number" 
                      min={0.1} 
                      max={1}
                      step={0.1}
                      value={alpha} 
                      onChange={(e) => setAlpha(Number(e.target.value))} 
                      className="w-20 px-2 py-1 border rounded text-xs" 
                    />
                    <span className="text-[10px] text-gray-500">(0.1-1.0)</span>
                  </div>
                )}
              </>
            )}

            {/* Feature Extraction parameters */}
            {method === 'peak_detection' && (
              <>
                <div className="flex items-center gap-2 text-xs">
                  <label className="text-xs">Threshold:</label>
                  <input 
                    type="number" 
                    min={0}
                    max={1}
                    step={0.1}
                    value={threshold} 
                    onChange={(e) => setThreshold(Number(e.target.value))} 
                    className="w-20 px-2 py-1 border rounded text-xs" 
                  />
                  <span className="text-[10px] text-gray-500">intensity</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <label className="text-xs">Min Distance:</label>
                  <input 
                    type="number" 
                    min={1}
                    max={20}
                    value={minDistance} 
                    onChange={(e) => setMinDistance(Number(e.target.value))} 
                    className="w-20 px-2 py-1 border rounded text-xs" 
                  />
                  <span className="text-[10px] text-gray-500">points</span>
                </div>
              </>
            )}

            {method === 'spectral_fingerprint' && (
              <>
                <div className="flex items-center gap-2 text-xs">
                  <label className="text-xs">Top Peaks:</label>
                  <input 
                    type="number" 
                    min={1}
                    max={10}
                    value={numPeaks} 
                    onChange={(e) => setNumPeaks(Number(e.target.value))} 
                    className="w-20 px-2 py-1 border rounded text-xs" 
                  />
                  <span className="text-[10px] text-gray-500">peaks</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <label className="text-xs">Min Distance:</label>
                  <input 
                    type="number" 
                    min={1}
                    max={20}
                    value={minDistance} 
                    onChange={(e) => setMinDistance(Number(e.target.value))} 
                    className="w-20 px-2 py-1 border rounded text-xs" 
                  />
                  <span className="text-[10px] text-gray-500">points</span>
                </div>
              </>
            )}

            {/* Apply button */}
            <button 
              type="button" 
              onClick={() => runForecast()} 
              className={`w-full px-3 py-2 text-white rounded text-xs font-semibold ${
                ['peak_detection', 'statistical_features', 'spectral_fingerprint'].includes(method)
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
              title={['peak_detection', 'statistical_features', 'spectral_fingerprint'].includes(method) ? 'Extract features' : 'Generate forecast'}
            >
              {['peak_detection', 'statistical_features', 'spectral_fingerprint'].includes(method) ? 'Extract Features' : 'Generate Forecast'}
            </button>
          </div>

          {/* Outer connection circle with icon */}
          <div className="rounded-full p-1 flex items-center justify-center" style={{ border: '2px dashed rgba(0,0,0,0.06)', borderRadius: 999 }}>
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); runForecast(); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); runForecast(); } }}
              className="rounded-full p-1 flex items-center justify-center focus:outline-none"
              style={{ borderRadius: 999 }}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center icon-outer`} style={{ width: 64, height: 64 }}>
                <LineChart className={`h-5 w-5 transition-transform duration-200 icon ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`} />
              </div>
            </div>
          </div>

          <div className="mt-2 text-[12px] font-medium text-center">Future Extraction</div>
        </div>
      );
    }
    if (widget.type === 'spectral-segmentation') {
      const [method, setMethod] = useState<'threshold' | 'kmeans'>('kmeans');
      const [threshold, setThreshold] = useState<number>(0);
      const [k, setK] = useState<number>(3);
      const [selectedCols, setSelectedCols] = useState<string[]>([]);

      const toggleCol = (col: string) => {
        setSelectedCols((prev) => (prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]));
      };
      // keep a reference to avoid unused-variable lint in some widget variants
      void toggleCol;

      const runSegmentation = () => {
        const tableData: Record<string, any>[] = widget.data?.tableData || widget.data?.parsedData || [];
        if (!tableData || tableData.length === 0) return;

        const allCols = Object.keys(tableData[0]);
        const cols = selectedCols.length ? selectedCols : allCols.filter((c) => tableData.some((r) => !isNaN(Number(r[c]))));
        if (cols.length === 0) return;

        const numericData = tableData.map((r) => cols.map((c) => Number(r[c]) || 0));

        let labels: number[] = [];

        if (method === 'threshold') {
          // simple threshold on the first selected column
          const col = cols[0];
          labels = tableData.map((r) => (Number(r[col]) >= threshold ? 1 : 0));
        } else {
          // simple k-means (Lloyd) on numericData
          const maxIters = 50;
          const n = numericData.length;
          const dims = numericData[0].length;
          // initialize centers by picking first k points (or random)
          const centers: number[][] = [];
          for (let i = 0; i < k; i++) {
            centers.push(numericData[i % n].slice());
          }

          labels = new Array(n).fill(0);
          for (let iter = 0; iter < maxIters; iter++) {
            let changed = false;
            // assign
            for (let i = 0; i < n; i++) {
              let best = 0;
              let bestDist = Infinity;
              for (let ci = 0; ci < centers.length; ci++) {
                const center = centers[ci];
                let dist = 0;
                for (let d = 0; d < dims; d++) {
                  const diff = numericData[i][d] - center[d];
                  dist += diff * diff;
                }
                if (dist < bestDist) {
                  bestDist = dist;
                  best = ci;
                }
              }
              if (labels[i] !== best) {
                labels[i] = best;
                changed = true;
              }
            }
            // update centers
            const sums: number[][] = Array(centers.length).fill(0).map(() => Array(dims).fill(0));
            const counts: number[] = Array(centers.length).fill(0);
            for (let i = 0; i < n; i++) {
              const lab = labels[i];
              counts[lab] += 1;
              for (let d = 0; d < dims; d++) sums[lab][d] += numericData[i][d];
            }
            for (let ci = 0; ci < centers.length; ci++) {
              if (counts[ci] === 0) continue;
              for (let d = 0; d < dims; d++) centers[ci][d] = sums[ci][d] / counts[ci];
            }
            if (!changed) break;
          }
        }

        // attach labels and summary
        const processed = tableData.map((r, i) => ({ ...r, _segment: labels[i] }));
        const segmentsSummary: Record<string, any> = {};
        labels.forEach((lab) => {
          segmentsSummary[lab] = (segmentsSummary[lab] || 0) + 1;
        });

        if (onUpdateWidget) {
          onUpdateWidget({ data: { ...(widget.data || {}), tableDataProcessed: processed, segments: segmentsSummary } });
        }
      };

      const availableCols = widget.data?.tableData && widget.data.tableData.length > 0 ? Object.keys(widget.data.tableData[0]) : [];
  // referenced to prevent unused variable lint in some builds
  void availableCols;

      return (
        <div className="flex flex-col items-center w-full" onClick={(e) => e.stopPropagation()}>
          {/* Outer connection circle with inner segmentation icon */}
          <div className="rounded-full p-1 flex items-center justify-center" style={{ border: '2px dashed rgba(0,0,0,0.06)', borderRadius: 999 }}>
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); runSegmentation(); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); runSegmentation(); } }}
              className="rounded-full p-1 flex items-center justify-center focus:outline-none"
              style={{ borderRadius: 999 }}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center icon-outer`} style={{ width: 56, height: 56 }}>
                <Box className={`h-5 w-5 transition-transform duration-200 icon ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`} />
              </div>
            </div>
          </div>

          <div className="mt-2 text-[12px] font-medium text-center">Segmentation</div>

          <div className="mt-2 w-full flex flex-col items-center gap-2 text-xs">
            <div className="flex items-center gap-2">
              <label className="text-xs">Method:</label>
              <select value={method} onChange={(e) => setMethod(e.target.value as any)} className="px-2 py-1 border rounded text-xs">
                <option value="kmeans">K-means</option>
                <option value="threshold">Threshold</option>
              </select>
            </div>

            {method === 'threshold' && (
              <div className="flex items-center gap-2">
                <label className="text-xs">Threshold:</label>
                <input type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-20 px-2 py-1 border rounded text-xs" />
              </div>
            )}

            {method === 'kmeans' && (
              <div className="flex items-center gap-2">
                <label className="text-xs">K:</label>
                <input type="number" min={2} value={k} onChange={(e) => setK(Number(e.target.value))} className="w-16 px-2 py-1 border rounded text-xs" />
              </div>
            )}
          </div>
        </div>
      );
    }
    if (widget.type === 'supabase') {
      // Orange Data Mining style: Simple icon in circle, clean label below
      const tableData: Record<string, any>[] = widget.data?.tableData || [];
      const hasData = tableData && tableData.length > 0;

      return (
        <div
          className="flex flex-col items-center justify-center w-full h-full cursor-default p-3 bg-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Main icon circle - Orange Data Mining style */}
          <div className="flex flex-col items-center gap-2 mb-3">
            {/* Outer circle with connection ports - Orange style */}
            <div 
              className="rounded-full flex items-center justify-center relative"
              style={{
                width: 90,
                height: 90,
                background: '#FFF8F0'
              }}
            >
              {/* Connection ports on left side (input) */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2">
                <div 
                  className="w-4 h-8 rounded-l-full border-2 border-orange-400 bg-white"
                  style={{
                    borderRight: 'none',
                    clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)'
                  }}
                ></div>
              </div>
              
              {/* Connection ports on right side (output) */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
                <div 
                  className="w-4 h-8 rounded-r-full border-2 border-orange-400 bg-white"
                  style={{
                    borderLeft: 'none',
                    clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)'
                  }}
                ></div>
              </div>
              
              {/* Dashed border circle */}
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  border: '2px dashed #FFE4CC'
                }}
              ></div>
              
              {/* Inner solid circle with icon */}
              <div 
                className="rounded-full flex items-center justify-center relative z-10"
                style={{
                  width: 65,
                  height: 65,
                  background: '#FF9800',
                  boxShadow: '0 2px 8px rgba(255, 152, 0, 0.3)'
                }}
              >
                <Database className="h-7 w-7 text-white" strokeWidth={2} />
              </div>
            </div>
            
            {/* Label below icon - Orange style */}
            <div className="text-center">
              <div className="text-xs font-semibold text-gray-800">Datasets</div>
              {hasData && (
                <div className="text-[10px] text-gray-500 mt-0.5">{tableData.length} instances</div>
              )}
              {!hasData && widget.data?.fetchStatus !== 'fetching' && (
                <div className="text-[10px] text-gray-400 mt-0.5">No data</div>
              )}
              {widget.data?.fetchStatus === 'fetching' && (
                <div className="text-[10px] text-blue-500 mt-0.5">Loading...</div>
              )}
            </div>
          </div>

          {/* Compact controls - hidden until hover for clean look */}
          <div className="w-full flex flex-col gap-1.5 opacity-0 hover:opacity-100 transition-opacity duration-200">
            {!hasData && (
              <>
                <input 
                  className="w-full rounded px-2 py-1.5 text-xs border border-gray-200 focus:border-orange-400 focus:outline-none text-center bg-white text-gray-700 placeholder-gray-400" 
                  value={sbTableName} 
                  onChange={(e) => setSbTableName(e.target.value)} 
                  placeholder="raman_data" 
                />
                <input 
                  className="w-full rounded px-2 py-1.5 text-xs border border-gray-200 focus:border-orange-400 focus:outline-none text-center bg-white text-gray-700 placeholder-gray-400" 
                  value={sbSampleFilter} 
                  onChange={(e) => setSbSampleFilter(e.target.value)} 
                  placeholder="Sample" 
                />
                <button 
                  className="w-full px-2 py-1.5 rounded bg-orange-500 text-white text-xs font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors" 
                  onClick={(e) => { e.stopPropagation(); fetchSupabaseData(); }} 
                  disabled={sbFetching || !sbTableName}
                >
                  {sbFetching ? 'Loading...' : 'Load'}
                </button>
              </>
            )}
            
            {hasData && (
              <button 
                className="w-full px-2 py-1.5 rounded bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setModalPreviewData(widget.data?.tableDataProcessed || []); 
                  setShowLineChartModal(true); 
                }}
              >
                Open table
              </button>
            )}
          </div>
        </div>
      );
    }
    if (widget.type === 'mean-average') {
      // Mean/Average widget: selection UI above, icon inside a larger connection-style circle, label below.
      const toggleRow = (idx: number) => {
        setSelectedRows((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]));
        if (!selectedRows.includes(idx)) setSelectedCols([]);
      };
      const toggleCol = (idx: number) => {
        setSelectedCols((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]));
        if (!selectedCols.includes(idx)) setSelectedRows([]);
      };
      void toggleRow;
      void toggleCol;

      return (
        <div className="flex flex-col items-center justify-center w-full h-full cursor-default px-2" onClick={(e) => e.stopPropagation()}>
          {/* Selection handled in modal; widget shows only the icon */}

          {/* Outer connection circle */}
          <div className="rounded-full p-1 flex items-center justify-center" style={{ border: '2px dashed rgba(0,0,0,0.06)', borderRadius: 999 }}>
            {/* Inner icon circle (clickable) */}
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); setShowMeanModal(true); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowMeanModal(true); } }}
              className="rounded-full p-1 flex items-center justify-center focus:outline-none"
              style={{ borderRadius: 999 }}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center icon-outer`} style={{ width: 64, height: 64 }}>
                <IconComponent className={`h-6 w-6 transition-transform duration-200 icon`} />
              </div>
            </div>
          </div>

          <div className="mt-2 text-[12px] font-medium text-center">Mean Average</div>
        </div>
      );
    }
    if (widget.type === 'line-chart') {
      return (
        <div className="flex flex-col items-center w-full" onClick={(e) => e.stopPropagation()}>
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); setShowLineChartModal(true); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowLineChartModal(true); } }}
            className="rounded-full flex items-center justify-center focus:outline-none"
            style={{ borderRadius: 999, width: 80, height: 80 }}
          >
            <LineChart className={`h-7 w-7 transition-transform duration-200 icon ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
          </div>

          <div className="mt-2 text-[12px] font-medium text-center">Line Chart</div>
        </div>
      );
    }
    if (widget.type === 'scatter-plot') {
      return (
        <div className="flex flex-col items-center w-full" onClick={(e) => e.stopPropagation()}>
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); setShowScatterModal(true); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowScatterModal(true); } }}
            className="rounded-full flex items-center justify-center focus:outline-none"
            style={{ borderRadius: 999, width: 80, height: 80 }}
          >
            <Scatter3D className={`h-7 w-7 transition-transform duration-200 icon ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
          </div>

          <div className="mt-2 text-[12px] font-medium text-center">Scatter Plot</div>
        </div>
      );
    }
    if (widget.type === 'box-plot') {
      return (
        <div className="flex flex-col items-center w-full" onClick={(e) => e.stopPropagation()}>
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); setShowBoxPlotModal(true); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowBoxPlotModal(true); } }}
            className="rounded-full flex items-center justify-center focus:outline-none"
            style={{ borderRadius: 999, width: 80, height: 80 }}
          >
            <Box className={`h-7 w-7 transition-transform duration-200 icon ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
          </div>

          <div className="mt-2 text-[12px] font-medium text-center">Box Plot</div>
        </div>
      );
    }
    if (widget.type === 'bar-chart') {
      return (
        <div className="flex flex-col items-center w-full" onClick={(e) => e.stopPropagation()}>
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); setShowBarChartModal(true); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowBarChartModal(true); } }}
            className="rounded-full flex items-center justify-center focus:outline-none"
            style={{ borderRadius: 999, width: 80, height: 80 }}
          >
            <BarChart3 className={`h-7 w-7 transition-transform duration-200 icon ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
          </div>

          <div className="mt-2 text-[12px] font-medium text-center">Bar Chart</div>
        </div>
      );
    }
    if (widget.type === 'noise-filter') {
      const runNoiseFilter = async () => {
        const tableData: Record<string, any>[] = widget.data?.tableData || widget.data?.parsedData || [];
        
        if (!tableData || tableData.length === 0) {
          alert('⚠️ No input data!\n\nPlease connect a data source first:\n• Supabase Source → Noise Filter\n• OR Baseline Correction → Noise Filter');
          return;
        }

        console.log('[noise] Processing', tableData.length, 'rows with method:', noiseMethod);

        let smoothed = tableData;
        const params = {
          window: noiseWindow,
          sigma: noiseSigma,
          order: noiseOrder
        };

        // Try backend API first
        try {
          const res = await fetchToBackend('/api/noise-filter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tableData,
              method: noiseMethod,
              params: {
                window: noiseWindow,
                windowSize: noiseWindow,
                sigma: noiseSigma,
                order: noiseOrder
              }
            })
          });
          
          if (res.ok) {
            const json = await res.json();
            smoothed = json.data || tableData;
            console.log('[noise] Backend processed successfully');
          } else {
            console.warn('[noise] Backend failed, using client-side fallback');
            smoothed = clientSideNoiseFilter(tableData, params);
          }
        } catch (err) {
          console.warn('[noise] Backend unavailable, using client-side fallback:', err);
          smoothed = clientSideNoiseFilter(tableData, params);
        }

        // Write processed data back to widget via callback if available and save params
        if (onUpdateWidget) {
          onUpdateWidget({ 
            data: { 
              ...(widget.data || {}), 
              tableDataProcessed: smoothed, 
              noiseParams: params 
            } 
          });
        }

        // Keep a local preview copy
        const cols = Object.keys(smoothed[0] || {});
        const xCandidates = ['shift', 'x', 'wavenumber', 'raman', 'index', 'time', 'label', 'raman_shift', 'raman shift'];
        const yCandidates = ['intensity', 'int', 'y', 'signal', 'counts', 'intensity_counts', 'raman intensity', 'raman_intensity'];
        let xKey: string | null = null;
        let yKey: string | null = null;
        
        for (const c of cols) {
          const low = c.toLowerCase();
          if (!xKey && xCandidates.some(x => low.includes(x))) xKey = c;
          if (!yKey && yCandidates.some(y => low.includes(y))) yKey = c;
        }
        
        // Fallback: pick first numeric column for Y
        if (!yKey) {
          for (const c of cols) {
            if (!isNaN(Number(smoothed[0][c])) && c !== xKey) { yKey = c; break; }
          }
        }
        
        let preview = smoothed;
        if (xKey && yKey) {
          preview = smoothed.map((r) => ({ shift: r[xKey], intensity: Number(r[yKey]) }));
        }
        setModalPreviewData(preview);
        
        console.log('[noise] Processing complete!');
        console.log('[noise] Original data length:', tableData.length);
        console.log('[noise] Smoothed data length:', smoothed.length);
        console.log('[noise] Preview data length:', preview.length);
        console.log('[noise] ✅ Click "View Data" to see the result!');
      };

      // Client-side fallback (moving average only)
      const clientSideNoiseFilter = (tableData: Record<string, any>[], params: any) => {
        const w = Math.max(1, Math.floor(params.window) || 5);
        const radius = Math.floor(w / 2);
        const columns = Object.keys(tableData[0]);
        const numericCols = columns.filter((c) => tableData.some((r) => !isNaN(Number(r[c]))));

        return tableData.map((row, i) => {
          const newRow: Record<string, any> = { ...row };
          numericCols.forEach((col) => {
            const vals: number[] = [];
            for (let k = i - radius; k <= i + radius; k++) {
              if (k >= 0 && k < tableData.length) {
                const v = Number(tableData[k][col]);
                if (!isNaN(v)) vals.push(v);
              }
            }
            newRow[col] = vals.length ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(4)) : row[col];
          });
          return newRow;
        });
      };

      const openNoisePreview = () => {
        const processed = modalPreviewData || widget.data?.tableDataProcessed || widget.data?.tableData || widget.data?.parsedData || [];
        console.log('[noise] Opening preview, data length:', processed.length);
        console.log('[noise] Data sample:', processed[0]);
        
        if (!processed || processed.length === 0) {
          alert('⚠️ No data to display!\n\nPlease:\n1. Connect a data source (Supabase or Baseline Correction)\n2. Click "Apply" to process the data\n3. Then click "View Data"');
          return;
        }
        
        setModalPreviewData(processed);
        setShowLineChartModal(true);
      };

      return (
        <div className="flex flex-col items-center justify-center w-full h-full cursor-default px-2" onClick={(e) => e.stopPropagation()}>
          {/* Method selector and parameters above the circle */}
          <div className="w-full px-2 mb-2 space-y-2">
            {/* Method Selector */}
            <div className="flex items-center gap-2 text-xs">
              <label className="text-xs font-semibold">Method:</label>
              <select 
                value={noiseMethod} 
                onChange={(e) => setNoiseMethod(e.target.value)}
                className="flex-1 px-2 py-1 border rounded text-xs"
              >
                <option value="moving_average">Moving Average</option>
                <option value="savitzky_golay">Savitzky-Golay</option>
                <option value="median">Median Filter</option>
                <option value="gaussian">Gaussian</option>
              </select>
            </div>

            {/* Window Size (for all methods) */}
            <div className="flex items-center gap-2 text-xs">
              <label className="text-xs">Window:</label>
              <input 
                type="number" 
                min={3} 
                max={51}
                step={2}
                value={noiseWindow} 
                onChange={(e) => setNoiseWindow(Number(e.target.value))} 
                className="w-20 px-2 py-1 border rounded text-xs" 
              />
              <span className="text-[10px] text-gray-500">({noiseWindow} points)</span>
            </div>

            {/* Conditional parameters based on method */}
            {noiseMethod === 'savitzky_golay' && (
              <div className="flex items-center gap-2 text-xs">
                <label className="text-xs">Order:</label>
                <input 
                  type="number" 
                  min={1} 
                  max={5}
                  value={noiseOrder} 
                  onChange={(e) => setNoiseOrder(Number(e.target.value))} 
                  className="w-20 px-2 py-1 border rounded text-xs" 
                />
                <span className="text-[10px] text-gray-500">(polynomial)</span>
              </div>
            )}

            {noiseMethod === 'gaussian' && (
              <div className="flex items-center gap-2 text-xs">
                <label className="text-xs">Sigma:</label>
                <input 
                  type="number" 
                  min={0.1} 
                  max={5}
                  step={0.1}
                  value={noiseSigma} 
                  onChange={(e) => setNoiseSigma(Number(e.target.value))} 
                  className="w-20 px-2 py-1 border rounded text-xs" 
                />
                <span className="text-[10px] text-gray-500">(spread)</span>
              </div>
            )}

            {/* Apply and Open buttons */}
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => runNoiseFilter()} 
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700"
                title="Apply noise filtering to the data"
              >
                Apply
              </button>
              <button 
                type="button" 
                onClick={() => openNoisePreview()} 
                className={`flex-1 px-3 py-2 rounded text-xs font-semibold ${
                  (modalPreviewData && modalPreviewData.length > 0) || widget.data?.tableDataProcessed
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
                title={
                  (modalPreviewData && modalPreviewData.length > 0) || widget.data?.tableDataProcessed
                    ? 'View the smoothed data'
                    : 'Click Apply first to process data'
                }
              >
                {(modalPreviewData && modalPreviewData.length > 0) || widget.data?.tableDataProcessed ? '✓ View Data' : 'View Data'}
              </button>
            </div>
          </div>

          {/* Outer connection circle with icon inside */}
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); runNoiseFilter(); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); runNoiseFilter(); } }}
            className="rounded-full flex items-center justify-center focus:outline-none"
            style={{ borderRadius: 999, width: 80, height: 80 }}
          >
            <IconComponent className={`h-7 w-7 transition-transform duration-200 icon ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
          </div>

          <div className="mt-2 text-[12px] font-medium text-center">Noise Filter</div>
        </div>
      );
    }
      if (widget.type === 'smoothing') {
        // Gaussian smoothing with configurable sigma
        const [sigma, setSigma] = useState<number>(1);

        const gaussianKernel = (sigmaVal: number) => {
    const radius = Math.max(1, Math.ceil(sigmaVal * 3));
          const kernel: number[] = [];
          const twoSigmaSq = 2 * sigmaVal * sigmaVal;
          let sum = 0;
          for (let i = -radius; i <= radius; i++) {
            const v = Math.exp(-(i * i) / twoSigmaSq);
            kernel.push(v);
            sum += v;
          }
          return kernel.map((k) => k / sum);
        };

        const runSmoothing = () => {
          const tableData: Record<string, any>[] = widget.data?.tableData || widget.data?.parsedData || [];
          if (!tableData || tableData.length === 0) {
            console.debug('[Baseline] no input tableData - nothing to process', tableData && tableData.length);
            return;
          }

          console.debug('[Baseline] runBaselineCorrection input rows=', tableData.length, 'sample=', tableData[0]);

          const columns = Object.keys(tableData[0]);
          const numericCols = columns.filter((c) => tableData.some((r) => !isNaN(Number(r[c]))));

          const kernel = gaussianKernel(Math.max(0.1, sigma));
          const radius = Math.floor(kernel.length / 2);

          const smoothed = tableData.map((row, i) => {
            const newRow: Record<string, any> = { ...row };
            numericCols.forEach((col) => {
              let acc = 0;
              for (let k = -radius; k <= radius; k++) {
                const idx = i + k;
                if (idx >= 0 && idx < tableData.length) {
                  const v = Number(tableData[idx][col]);
                  if (!isNaN(v)) acc += v * kernel[k + radius];
                }
              }
              newRow[col] = Number(acc.toFixed(4));
            });
            return newRow;
          });

          if (onUpdateWidget) {
            onUpdateWidget({ data: { ...(widget.data || {}), tableDataProcessed: smoothed } });
          }
        };

        return (
          <div className="flex flex-col items-center justify-center w-full h-full cursor-default px-2" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center gap-2">
              <label className="text-xs">Sigma:</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={sigma}
                onChange={(e) => setSigma(Number(e.target.value))}
                className="w-16 px-2 py-1 border rounded"
              />
            </div>

            {/* Outer connection circle */}
            <div className="rounded-full p-1 flex items-center justify-center" style={{ border: '2px dashed rgba(0,0,0,0.06)', borderRadius: 999 }}>
              {/* Inner icon circle (clickable) */}
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); runSmoothing(); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); runSmoothing(); } }}
                className="rounded-full p-1 flex items-center justify-center focus:outline-none"
                style={{ borderRadius: 999 }}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center icon-outer`} style={{ width: 64, height: 64 }}>
                  <Filter className={`h-6 w-6 transition-transform duration-200 icon`} />
                </div>
              </div>
            </div>

            <div className="mt-2 text-[12px] font-medium text-center">Smoothing</div>
          </div>
        );
      }
      if (widget.type === 'baseline-correction') {
        const runBaselineCorrection = async () => {
          const tableData: Record<string, any>[] = widget.data?.tableData || widget.data?.parsedData || [];
          if (!tableData || tableData.length === 0) return;

          // use local editable params (UI writes to localBaselineParams)
          const params = localBaselineParams || (widget.data && widget.data.baselineParams) || { method: 'min_subtract' };
          console.log('[Baseline] ========== RUNNING BASELINE CORRECTION ==========');
          console.log('[Baseline] Input: running with params=', params, 'rows=', tableData.length);
          console.log('[Baseline] Input columns:', Object.keys(tableData[0] || {}));
          console.log('[Baseline] Input sample row (first 3):', tableData.slice(0, 3));
          console.log('[Baseline] Data source:', widget.data?.tableDataProcessed ? 'tableDataProcessed' : widget.data?.tableData ? 'tableData' : 'parsedData');

          // Try server-side baseline correction via backend proxy -> python service
          try {
            const res = await fetch('/api/baseline-correction', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tableData, params }),
            });
            if (!res.ok) {
              const txt = await res.text();
              throw new Error(txt || `status ${res.status}`);
            }
            const body = await res.json();
            console.debug('[Baseline] server response', body);
            const corrected = body?.tableData || [];
            // record that we used the server-side baseline (python) and which method
            onUpdateWidget?.({ data: { ...(widget.data || {}), tableDataProcessed: corrected, baselineUsed: 'python', baselineMethod: params?.method || 'min_subtract', baselineParams: params } });
            // build a graph-friendly preview: try to detect X/Y columns and map to {shift,intensity}
            const buildPreview = (rows: Record<string, any>[]) => {
              if (!rows || rows.length === 0) return rows;
              const cols = Object.keys(rows[0] || {});
              
              // Find X-axis column (Raman Shift prioritized)
              const xCandidates = ['raman shift', 'shift', 'x', 'wavenumber', 'raman_shift', 'shift x axis'];
              let xKey = null;
              for (const c of cols) {
                const lc = c.toLowerCase().replace(/[^a-z0-9]/g, ''); // remove spaces/special chars
                if (xCandidates.some(cand => lc.includes(cand.replace(/[^a-z0-9]/g, '')))) {
                  xKey = c;
                  console.log('[Baseline] buildPreview: X-axis selected:', c);
                  break;
                }
              }
              
              // Find Y-axis column (intensity prioritized)
              const yCandidates = ['raman intensity', 'intensity', 'int', 'y', 'signal', 'counts', 'intensity_y_axis'];
              let yKey = null;
              for (const c of cols) {
                const lc = c.toLowerCase().replace(/[^a-z0-9]/g, '');
                if (yCandidates.some(cand => lc.includes(cand.replace(/[^a-z0-9]/g, '')))) {
                  yKey = c;
                  console.log('[Baseline] buildPreview: Y-axis selected:', c);
                  break;
                }
              }
              
              // Fallback: find first numeric column for Y
              if (!yKey) {
                for (const c of cols) {
                  if (!isNaN(Number(rows[0][c])) && c !== xKey) { 
                    yKey = c;
                    console.log('[Baseline] buildPreview: Y-axis fallback:', c);
                    break; 
                  }
                }
              }
              
              // Fallback: find first numeric column for X
              if (!xKey) {
                for (const c of cols) {
                  if (!isNaN(Number(rows[0][c]))) { 
                    xKey = c;
                    console.log('[Baseline] buildPreview: X-axis fallback (numeric):', c);
                    break; 
                  }
                }
              }
              
              console.log('[Baseline] buildPreview: Final selection - X:', xKey, 'Y:', yKey);
              
              if (xKey && yKey) {
                const preview = rows.map((r) => ({ shift: r[xKey], intensity: Number(r[yKey]) }));
                console.log('[Baseline] buildPreview: Sample output:', preview.slice(0, 2));
                return preview;
              }
              return rows;
            };
            const preview = buildPreview(corrected);
            setModalPreviewData(preview);
            console.debug('[Baseline] modalPreviewData set (server)', corrected && corrected.slice(0,3));
            setShowLineChartModal(true);
            return;
          } catch (err) {
            console.warn('Server baseline correction failed, falling back to client-side:', err);
          }

          // Fallback: simple client-side min-subtract but do NOT alter x-axis columns
          const columns = Object.keys(tableData[0]);
          const numericCols = columns.filter((c) => tableData.some((r) => !isNaN(Number(r[c]))));
          const xCandidates = ['x', 'shift', 'wavenumber', 'raman', 'index', 'time', 'label', 'raman_shift'];
          let yCols = numericCols.filter((c) => !xCandidates.some((x) => c.toLowerCase().includes(x)));
          if (yCols.length === 0) yCols = numericCols.slice();
          const minima: Record<string, number> = {};
          yCols.forEach((col) => {
            const vals = tableData.map((r) => Number(r[col])).filter((v) => !isNaN(v));
            minima[col] = vals.length ? Math.min(...vals) : 0;
          });
          const corrected = tableData.map((row) => {
            const newRow: Record<string, any> = { ...row };
            yCols.forEach((col) => {
              const v = Number(row[col]);
              newRow[col] = !isNaN(v) ? Number((v - minima[col]).toFixed(4)) : row[col];
            });
            return newRow;
          });
          console.debug('[Baseline] client-side fallback corrected sample=', corrected && corrected.slice(0,3));
          if (onUpdateWidget) onUpdateWidget({ data: { ...(widget.data || {}), tableDataProcessed: corrected, baselineUsed: 'js', baselineMethod: params?.method || 'min_subtract', baselineParams: params } });
          // build graph-friendly preview for modal
          const cols = Object.keys(corrected[0] || {});
          const xCandidatesPreview = ['shift', 'x', 'wavenumber', 'raman', 'index', 'time', 'label', 'raman_shift'];
          const yCandidatesPreview = ['intensity', 'int', 'y', 'signal', 'counts', 'intensity_counts'];
          let xKey = null;
          let yKey = null;
          for (const c of cols) {
            const lc = c.toLowerCase();
            if (!xKey && xCandidatesPreview.includes(lc)) xKey = c;
            if (!yKey && yCandidatesPreview.includes(lc)) yKey = c;
          }
          if (!yKey) {
            for (const c of cols) {
              if (!isNaN(Number(corrected[0][c])) && c !== xKey) { yKey = c; break; }
            }
          }
          if (!xKey) {
            for (const c of cols) {
              if (isNaN(Number(corrected[0][c]))) { xKey = c; break; }
            }
          }
          const preview = (xKey && yKey) ? corrected.map((r) => ({ shift: r[xKey], intensity: Number(r[yKey]) })) : corrected;
          setModalPreviewData(preview);
          console.debug('[Baseline] modalPreviewData set (js)', corrected && corrected.slice(0,3));
          setShowLineChartModal(true);
        };

        return (
          <div className="flex flex-col items-center justify-center w-full h-full cursor-default px-2" onClick={(e) => e.stopPropagation()}>
            {/* param controls above the icon so users can tweak before applying */}
            <div className="mb-2 flex items-center gap-2 text-sm">
              <label className="text-xs">Method:</label>
              <select value={localBaselineParams?.method || 'min_subtract'} onChange={(e) => setLocalBaselineParams({ ...(localBaselineParams || {}), method: e.target.value })} className="px-2 py-1 border rounded text-xs">
                <option value="min_subtract">Min Subtract</option>
                <option value="rolling_min">Rolling Min</option>
                <option value="polynomial">Polynomial</option>
              </select>
              {(localBaselineParams?.method === 'rolling_min' || localBaselineParams?.method === 'polynomial') && (
                <>
                  <label className="text-xs">Window:</label>
                  <input type="number" min={1} value={localBaselineParams?.window || 5} onChange={(e) => setLocalBaselineParams({ ...(localBaselineParams || {}), window: Number(e.target.value) })} className="w-16 px-2 py-1 border rounded text-xs" />
                </>
              )}
              {localBaselineParams?.method === 'polynomial' && (
                <>
                  <label className="text-xs">Degree:</label>
                  <input type="number" min={0} value={localBaselineParams?.degree || 2} onChange={(e) => setLocalBaselineParams({ ...(localBaselineParams || {}), degree: Number(e.target.value) })} className="w-12 px-2 py-1 border rounded text-xs" />
                </>
              )}
              <button type="button" onClick={() => runBaselineCorrection()} className="px-2 py-1 bg-blue-600 text-white rounded text-xs">Apply</button>
            </div>

            {/* Outer connection circle */}
            <div className="rounded-full p-1 flex items-center justify-center" style={{ border: '2px dashed rgba(0,0,0,0.06)', borderRadius: 999 }}>
              {/* Inner icon circle (clickable) */}
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); runBaselineCorrection(); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); runBaselineCorrection(); } }}
                className="rounded-full p-1 flex items-center justify-center focus:outline-none"
                style={{ borderRadius: 999 }}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center icon-outer`} style={{ width: 64, height: 64 }}>
                  <Calculator className={`h-6 w-6 transition-transform duration-200 icon`} />
                </div>
              </div>
            </div>

            {/* render a tiny sparkline preview when processed data exists */}
            {(() => {
              const processed = widget.data?.tableDataProcessed || widget.data?.tableData || widget.data?.parsedData || [];
              if (processed && processed.length > 0) {
                // find first numeric column
                const cols = Object.keys(processed[0] || {});
                let colName: string | null = null;
                for (const c of cols) {
                  const v = Number(processed[0][c]);
                  if (!isNaN(v)) { colName = c; break; }
                }
                if (colName) {
                  const vals = processed.map((r: any) => Number(r[colName])).filter((v: number) => !isNaN(v));
                  if (vals.length > 0) {
                    const w = 120;
                    const h = 36;
                    const min = Math.min(...vals);
                    const max = Math.max(...vals);
                    const range = max - min || 1;
                    const step = w / Math.max(1, vals.length - 1);
                    const points = vals.map((v: number, i: number) => `${i * step},${h - ((v - min) / range) * h}`);
                    const path = points.length ? `M${points.join(' L')}` : '';
                    return (
                      <div className="mt-2 flex items-center justify-center w-full">
                        <svg width={w} height={h} className="block">
                          <path d={path} fill="none" stroke="#3b82f6" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    );
                  }
                }
              }
              return <div className="mt-2 text-[12px] font-medium text-center">Baseline Correction</div>;
            })()}
          </div>
        );
      }

      // Custom Code Widget
      if (widget.type === 'custom-code') {
        const defaultCode = `# Peak Detector - Finds peaks in Raman spectroscopy data
import numpy as np
from scipy.signal import find_peaks

if input_data and len(input_data) > 0:
    # Get column names from first row
    first_row = input_data[0]
    columns = list(first_row.keys())
    
    # Try to find the intensity/y-axis column
    intensity_col = None
    for col in columns:
        col_lower = col.lower()
        if any(keyword in col_lower for keyword in ['intensity', 'count', 'signal', 'value', 'y']):
            intensity_col = col
            break
    
    # If not found, use second column (assuming first is wavenumber/x)
    if not intensity_col and len(columns) > 1:
        intensity_col = columns[1]
    
    if intensity_col:
        # Extract intensity values
        intensities = np.array([float(row.get(intensity_col, 0)) for row in input_data])
        
        # Find peaks using scipy
        # prominence: minimum height difference from surrounding baseline
        # distance: minimum distance between peaks (in data points)
        peaks, properties = find_peaks(intensities, prominence=np.std(intensities) * 0.5, distance=5)
        
        # Create summary output
        output_data = [{
            'Result': 'Peak Detection Summary',
            'Total Peaks Found': len(peaks),
            'Data Points': len(intensities),
            'Intensity Column Used': intensity_col,
            'Max Intensity': float(np.max(intensities)),
            'Mean Intensity': float(np.mean(intensities))
        }]
        
        # Add details for each peak (first 20)
        for i, peak_idx in enumerate(peaks[:20]):
            peak_data = {
                'Peak Number': i + 1,
                'Position (index)': int(peak_idx),
                'Intensity': float(intensities[peak_idx]),
                'Prominence': float(properties['prominences'][i])
            }
            output_data.append(peak_data)
            
        if len(peaks) > 20:
            output_data.append({'Note': f'Showing first 20 of {len(peaks)} total peaks'})
    else:
        output_data = [{
            'Error': 'Could not identify intensity column',
            'Available Columns': ', '.join(columns),
            'Suggestion': 'Check your data structure or edit code to specify column name'
        }]
else:
    output_data = [{'status': 'No input data', 'message': 'Connect this widget to a data source'}]
`;
        
        const [customCode, setCustomCode] = useState<string>(widget.data?.customCode || defaultCode);
        const [widgetName, setWidgetName] = useState<string>(widget.data?.widgetName || '');
        const [widgetDescription, setWidgetDescription] = useState<string>(widget.data?.widgetDescription || '');
        const [isExecuting, setIsExecuting] = useState(false);
        const [executionOutput, setExecutionOutput] = useState<string>('');
        const [showCommunityModal, setShowCommunityModal] = useState(false);
        const [communityWidgets, setCommunityWidgets] = useState<any[]>([]);
        const [initialized, setInitialized] = useState(false);
        const [showCodeEditor, setShowCodeEditor] = useState(false);
        const [showTableModal, setShowTableModal] = useState(false);
        const [showOutputInWidget, setShowOutputInWidget] = useState(false);

        // Update state when widget data changes (for newly created widgets)
        useEffect(() => {
          // Only sync once when widget has data but state is not yet initialized
          if (!initialized && (widget.data?.widgetName || widget.data?.widgetDescription || widget.data?.customCode)) {
            if (widget.data?.widgetName) setWidgetName(widget.data.widgetName);
            if (widget.data?.widgetDescription) setWidgetDescription(widget.data.widgetDescription);
            if (widget.data?.customCode) setCustomCode(widget.data.customCode);
            setInitialized(true);
          }
        }, [widget.id, initialized]);

        // Auto-execute when this is a created widget (has widgetName) and receives new data
        useEffect(() => {
          const hasWidgetName = widget.data?.widgetName;
          const hasCustomCode = widget.data?.customCode;
          const hasInputData = widget.data?.tableData && widget.data.tableData.length > 0;
          
          console.log('Auto-execute check:', { hasWidgetName, hasCustomCode, hasInputData, isExecuting });
          
          // Only auto-execute if this is a created widget (not the editor) and has input data
          if (hasWidgetName && hasCustomCode && hasInputData && !isExecuting) {
            console.log('Auto-executing code for widget:', widget.data.widgetName);
            // Auto-execute the code
            handleExecuteCode();
          }
        }, [widget.data?.tableData, widget.id]);

        // Auto-show output when new processed data arrives
        useEffect(() => {
          if (widget.data?.tableDataProcessed && widget.data.tableDataProcessed.length > 0 && widget.data?.widgetName) {
            setShowOutputInWidget(true);
          }
        }, [widget.data?.tableDataProcessed?.length, widget.id]);

        const handleExecuteCode = async () => {
          setIsExecuting(true);
          setExecutionOutput('Executing...');
          
          try {
            const inputData = widget.data?.tableData || [];
            // Use code from widget.data if available (for created widgets), otherwise use state (for editor)
            const codeToExecute = widget.data?.customCode || customCode;
            
            const response = await fetchToBackend('/api/custom-code/execute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                code: codeToExecute,
                input_data: inputData
              })
            });

            // Better error handling for JSON parsing
            let result: any;
            const responseText = await response.text();
            console.log('Backend response status:', response.status);
            console.log('Backend response text:', responseText);
            
            if (!response.ok) {
              throw new Error(`Backend returned status ${response.status}: ${responseText || 'No response body'}`);
            }
            
            try {
              result = responseText ? JSON.parse(responseText) : {};
            } catch (parseError: any) {
              console.error('JSON parse error:', parseError);
              throw new Error(`Backend returned invalid JSON. Status: ${response.status}. Response: ${responseText.substring(0, 200)}`);
            }
            
            if (result.success) {
              // Don't show text output - focus on widget creation
              setExecutionOutput('');

              console.log('Execution result:', result);
              console.log('Output data:', result.output_data);

              const isEditor = !widget.data?.widgetName; // true when this instance is the editor (not a created widget)
              
              console.log('Widget creation check:', {
                isEditor,
                widgetName,
                hasOnAddWidget: !!onAddWidget,
                widgetDataName: widget.data?.widgetName
              });

              // Update current widget with output data only if this widget is already a created/processing widget
              if (!isEditor && onUpdateWidget && result.output_data) {
                console.log('Updating widget with output data, length:', result.output_data.length);
                onUpdateWidget({
                  data: {
                    ...(widget.data || {}),
                    tableDataProcessed: result.output_data,
                    customCode: codeToExecute, // Use the code that was executed
                    lastExecuted: new Date().toISOString()
                  }
                });
              }

              // CREATE A NEW WIDGET when Execute Code is clicked from the editor and a widget name is provided
              if (isEditor) {
                if (!widgetName || widgetName.trim() === '') {
                  // If we're in the editor and the user didn't provide a name, ask for it
                  setExecutionOutput('⚠️ Please enter a Widget Name to create a new widget on the canvas.');
                  console.log('❌ Widget name is required but not provided');
                  return;
                }

                if (!onAddWidget) {
                  console.error('❌ onAddWidget function is not available');
                  setExecutionOutput('❌ Error: Cannot create widget (onAddWidget not available)');
                  return;
                }

                console.log('✅ Creating new widget...');
                // Position new widget to the right of current widget
                const newPosition = {
                  x: widget.position.x + 350,
                  y: widget.position.y
                };

                // Prepare initial data for the new widget - include both input and output data
                const initialData = {
                  widgetName: widgetName.trim(),
                  widgetDescription: widgetDescription.trim(),
                  customCode: customCode,
                  tableData: inputData, // Include input data
                  tableDataProcessed: result.output_data, // Include output data
                  lastExecuted: new Date().toISOString()
                };

                console.log('Creating new widget with data:', initialData);
                console.log('Position:', newPosition);

                try {
                  // Create a new custom-code widget with the executed code (silent creation)
                  const newWidgetId = onAddWidget('custom-code', newPosition, initialData);
                  console.log('✅ New widget created with ID:', newWidgetId);

                  // Show success message
                  setExecutionOutput(`✅ Widget "${widgetName}" created successfully!\n\nLook to the right of this widget on the canvas.\nConnect it to data sources to see it in action.`);
                } catch (error: any) {
                  console.error('❌ Error creating widget:', error);
                  setExecutionOutput(`❌ Error creating widget: ${error.message}`);
                }
              }
            } else {
              setExecutionOutput(`❌ Error:\n\n${result.error}`);
              alert('Execution failed. Check the output below.');
            }
          } catch (error: any) {
            setExecutionOutput(`❌ Connection Error:\n\n${error.message}`);
            console.error('Failed to connect to backend service:', error);
          } finally {
            setIsExecuting(false);
          }
        };

        const handleSaveWidget = async () => {
          if (!widgetName || !customCode) {
            alert('Please provide a widget name and code before saving.');
            return;
          }

          try {
            const response = await fetchToBackend('/api/custom-code/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: widgetName,
                description: widgetDescription,
                python_code: customCode,
                author: 'user-' + Date.now(), // In real app, use actual user ID
                category: 'processing',
                tags: ['custom', 'user-created']
              })
            });

            const result = await response.json();
            
            if (result.success) {
              alert(`✅ Widget "${widgetName}" saved to community library!\n\nOther users can now use your widget.`);
            } else {
              alert(`Failed to save widget: ${result.error}`);
            }
          } catch (error: any) {
            alert(`Failed to save: ${error.message}`);
          }
        };

        const handleLoadCommunityWidget = async (widgetId: string) => {
          try {
            const response = await fetchToBackend(`/api/custom-code/${widgetId}`);
            const result = await response.json();
            
            if (result.success) {
              setCustomCode(result.widget.python_code);
              setWidgetName(result.widget.name);
              setWidgetDescription(result.widget.description);
              setShowCommunityModal(false);
              alert(`Loaded widget: ${result.widget.name}`);
            }
          } catch (error: any) {
            alert(`Failed to load widget: ${error.message}`);
          }
        };

        const handleBrowseCommunity = async () => {
          try {
            const response = await fetchToBackend('/api/custom-code/list?limit=50');
            const result = await response.json();
            
            if (result.success) {
              setCommunityWidgets(result.widgets);
              setShowCommunityModal(true);
            }
          } catch (error: any) {
            alert(`Failed to load community widgets: ${error.message}`);
          }
        };

        return (
          <>
            {/* Collapsed Widget View - Extra Wide, Expands when showing output */}
            <div className="flex flex-col w-full h-full p-3 gap-2" onClick={(e) => e.stopPropagation()} style={{ minWidth: '280px', minHeight: showOutputInWidget ? '350px' : '120px' }}>
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-2">
                  <Code className={`h-4 w-4 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
                  <span className="text-xs font-bold">Custom Code Widget</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Show "Edit Code" if this is a created widget */}
                  {widget.data?.widgetName && (
                    <button
                      onClick={() => setShowCodeEditor(true)}
                      className="px-3 py-1 text-xs font-semibold text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors"
                      title="Edit the Python code"
                    >
                      Edit Code
                    </button>
                  )}
                  {/* Show "Re-run" if widget has code and input data */}
                  {widget.data?.widgetName && widget.data?.customCode && widget.data?.tableData && (
                    <button
                      onClick={() => handleExecuteCode()}
                      disabled={isExecuting}
                      className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                      title="Re-execute the code with current input data"
                    >
                      {isExecuting ? '⏳ Running...' : '🔄 Re-run'}
                    </button>
                  )}
                  {/* Show "View Output" if widget has processed data */}
                  {widget.data?.tableDataProcessed && widget.data.tableDataProcessed.length > 0 && widget.data?.widgetName && (
                    <button
                      onClick={() => {
                        console.log('Toggle output display');
                        setShowOutputInWidget(!showOutputInWidget);
                      }}
                      className={`px-3 py-1 text-xs font-semibold text-white ${showOutputInWidget ? 'bg-gray-600' : 'bg-green-600'} rounded hover:bg-green-700 transition-colors flex items-center gap-1`}
                      title="Toggle output data display"
                    >
                      <span>{showOutputInWidget ? '📊 Hide' : '📊 Show'}</span> Output
                    </button>
                  )}
                  {/* Show "Open" only if this is a new/empty widget (no widgetName means it's the editor widget) */}
                  {!widget.data?.widgetName && (
                    <button
                      onClick={() => setShowCodeEditor(true)}
                      className="px-3 py-1 text-xs font-semibold text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors"
                    >
                      Open
                    </button>
                  )}
                </div>
              </div>

              {/* Widget Summary - Horizontal Layout */}
              <div className="flex-1 flex items-center gap-3 px-2">
                <Code className="h-10 w-10 text-purple-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {widgetName || widget.data?.widgetName ? (
                    <>
                      <p className="text-sm font-semibold truncate">{widget.data?.widgetName || widgetName}</p>
                      <p className="text-xs text-gray-500 truncate">{widget.data?.widgetDescription || widgetDescription || 'Custom code widget'}</p>
                      {/* Show output data summary */}
                      {widget.data?.tableDataProcessed && widget.data.tableDataProcessed.length > 0 && (
                        <p className="text-xs text-green-600 font-medium mt-1">
                          ✓ {widget.data.tableDataProcessed.length} rows | {Object.keys(widget.data.tableDataProcessed[0] || {}).length} columns
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-gray-500">Click "Open" to configure</p>
                  )}
                </div>
              </div>

              {/* Output Data Display - Inside Widget */}
              {showOutputInWidget && widget.data?.tableDataProcessed && widget.data.tableDataProcessed.length > 0 && (
                <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200 max-h-64 overflow-auto">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-700">Output Data</h4>
                    <span className="text-xs text-gray-500">
                      {widget.data.tableDataProcessed.length} rows
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          {Object.keys(widget.data.tableDataProcessed[0] || {}).map((key) => (
                            <th key={key} className="px-2 py-1 text-left font-semibold text-gray-700 border-b">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {widget.data.tableDataProcessed.slice(0, 10).map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-100">
                            {Object.keys(widget.data.tableDataProcessed[0] || {}).map((key) => (
                              <td key={key} className="px-2 py-1 border-b text-gray-600">
                                {(() => {
                                  const value = row[key];
                                  if (typeof value === 'number') {
                                    // Smart number formatting
                                    if (Math.abs(value) >= 1000) {
                                      return value.toFixed(0); // Large numbers: no decimals
                                    } else if (Math.abs(value) >= 1) {
                                      return value.toFixed(2); // Regular numbers: 2 decimals
                                    } else if (Math.abs(value) >= 0.01) {
                                      return value.toFixed(4); // Small numbers: 4 decimals
                                    } else if (value === 0) {
                                      return '0';
                                    } else {
                                      return value.toExponential(2); // Very small: scientific notation
                                    }
                                  } else if (value === null || value === undefined) {
                                    return '-';
                                  } else if (typeof value === 'boolean') {
                                    return value ? '✓' : '✗';
                                  }
                                  return String(value);
                                })()}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {widget.data.tableDataProcessed.length > 10 && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Showing first 10 of {widget.data.tableDataProcessed.length} rows
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Floating Code Editor Modal */}
            {showCodeEditor && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowCodeEditor(false)}>
                <div className="bg-white rounded-lg shadow-2xl w-[800px] h-[700px] flex flex-col" onClick={(e) => e.stopPropagation()}>
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-4 border-b bg-purple-600 text-white flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      <span className="text-lg font-bold">Custom Code Editor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowCodeEditor(false)}
                        className="px-4 py-1.5 text-sm font-semibold bg-white text-purple-600 rounded hover:bg-gray-100 transition-colors"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => setShowCodeEditor(false)}
                        className="w-8 h-8 flex items-center justify-center bg-white text-purple-600 rounded hover:bg-gray-100 transition-colors font-bold text-lg"
                        title="Close"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {/* Modal Content */}
                  <div className="flex-1 p-6 overflow-y-auto">
                    <div className="space-y-4">
                      {/* Widget Metadata Section */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Widget Name</label>
                          <input
                            type="text"
                            placeholder="e.g., 'Peak Detector'"
                            value={widgetName}
                            onChange={(e) => {
                              setWidgetName(e.target.value);
                            }}
                            className="w-full px-4 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Description</label>
                          <input
                            type="text"
                            placeholder="Describe what your widget does"
                            value={widgetDescription}
                            onChange={(e) => {
                              setWidgetDescription(e.target.value);
                            }}
                            className="w-full px-4 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      {/* Code Editor Section */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Python Code</label>
                        <textarea
                          value={customCode}
                          onChange={(e) => {
                            setCustomCode(e.target.value);
                          }}
                          placeholder="# Write your Python code here&#10;# Input: input_data&#10;# Output: output_data"
                          className="w-full h-48 px-4 py-3 text-sm font-mono border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                          onClick={(e) => e.stopPropagation()}
                          style={{ fontFamily: 'Consolas, Monaco, monospace' }}
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={handleExecuteCode}
                          disabled={isExecuting}
                          className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                        >
                          {isExecuting ? 'Executing...' : 'Execute Code'}
                        </button>
                        <button
                          onClick={handleSaveWidget}
                          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                        >
                          Save to Library
                        </button>
                        <button
                          onClick={handleBrowseCommunity}
                          className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors"
                        >
                          Browse Widgets
                        </button>
                      </div>

                      {/* Output Display */}
                      {executionOutput && (
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Output</label>
                          <div className="w-full p-4 text-sm font-mono bg-gray-100 border rounded max-h-32 overflow-auto">
                            <pre className="whitespace-pre-wrap">{executionOutput}</pre>
                          </div>
                        </div>
                      )}

                      {/* Bottom Close Button */}
                      <div className="pt-2 border-t">
                        <button
                          onClick={() => setShowCodeEditor(false)}
                          className="w-full px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                        >
                          Close Editor
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Community Widgets Modal */}
            {showCommunityModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowCommunityModal(false)}>
                <div className="bg-white rounded-lg p-4 max-w-2xl w-full max-h-96 overflow-auto" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-lg font-bold mb-3">Community Widgets</h3>
                  {communityWidgets.length === 0 ? (
                    <p className="text-sm text-gray-500">No community widgets found. Be the first to create one!</p>
                  ) : (
                    <div className="space-y-2">
                      {communityWidgets.map((w) => (
                        <div key={w.id} className="border rounded p-3 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-sm">{w.name}</h4>
                              <p className="text-xs text-gray-600">{w.description}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                by {w.author} | Used {w.usage_count} times
                              </p>
                            </div>
                            <button
                              onClick={() => handleLoadCommunityWidget(w.id)}
                              className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                            >
                              Load
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => setShowCommunityModal(false)}
                    className="mt-4 w-full px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Data Table Modal for Viewing Output */}
            <DataTableModal
              isOpen={showTableModal}
              data={widget.data?.tableDataProcessed || widget.data?.tableData || []}
              onClose={() => setShowTableModal(false)}
            />
          </>
        );
      }

        if (widget.type === 'blank-remover') {
          // simple display: icon inside a circular control and label beneath
          return (
            <div className="flex flex-col items-center justify-center w-full h-full cursor-default px-2" onClick={(e) => e.stopPropagation()}>
              <div
                role="button"
                tabIndex={0}
                className="rounded-full flex items-center justify-center focus:outline-none"
                style={{ borderRadius: 999, width: 80, height: 80 }}
              >
                <Filter className={`h-7 w-7 transition-transform duration-200 icon ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
              </div>

              <div className="mt-2 text-[12px] font-medium text-center">Blank Remover</div>
            </div>
          );
        }
    // Default: just show icon
    return (
      <div
        className="flex flex-col items-center justify-center w-full h-full"
        onClick={(e) => {
          // open selector on widget click (but prevent when clicking controls)
          const t = e.target as HTMLElement;
          if (t.closest('button, input, textarea, select')) return;
          e.stopPropagation();
          setShowSelector(true);
        }}
      >
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center`} style={{ width: 80 }}>
            {/* Outer connection ring with centered inner icon */}
            <div className="rounded-full flex items-center justify-center" style={{ border: '2px dashed rgba(0,0,0,0.06)', borderRadius: 999, width: 80, height: 80 }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center">
                {!iconLoadFailed ? (
                  <img
                    src={customIconPath}
                    alt={widget.type}
                    className="h-5 w-5 icon"
                    onError={() => setIconLoadFailed(true)}
                  />
                ) : (
                  <IconComponent className={`h-5 w-5 transition-transform duration-200 ${theme === 'dark' ? 'text-emerald-300' : 'text-orange-500'} icon`} />
                )}
              </div>
            </div>

            {/* Label below the connection circle (keeps the inner circle icon-only) */}
            <div className="mt-2 text-[9px] text-center truncate max-w-[64px]" title={widget.label || widget.type}>
              {(widget.label && widget.label.length > 0)
                ? widget.label
                : widget.type
                    .split('-')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
            </div>
          </div>
      </div>
    );
  };

  return (
    <>
      <div
        // Attach only the dragPreview to the container so drag preview images work,
        // but the drag source itself is only the handle (ref={drag} on the handle button).
        ref={(node) => {
          try {
            if (node) {
              dragPreview(node);
            }
          } catch (err) {
            // swallow
          }
        }}
        className={`absolute transition-all duration-300 ${
          isDragging ? 'opacity-50 scale-95' : ''
  } ${isConnectingFrom ? 'ring-4 ring-gray-400 ring-opacity-50' : ''} ${isHighlighted ? 'ring-2 ring-yellow-300 ring-opacity-80' : ''}`}
        style={{
          left: widget.position.x,
          top: widget.position.y,
          zIndex: showControls ? 50 : 20,
        }}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        onContextMenu={(e) => {
          // Open custom context menu on right-click for every widget
          e.preventDefault();
          e.stopPropagation();
          setShowControls(true);
          setShowContextMenu(true);
          setContextPos({ x: e.clientX, y: e.clientY });
        }}
      >
        <div
          className={`relative w-20 h-20 rounded-full flex flex-col items-center justify-center border-2 group transition-shadow duration-200 ${
            theme === 'dark'
              ? (isSupabase ? 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600 hover:border-[var(--primary)] shadow-inner' : 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600 hover:border-[var(--primary)] shadow-md hover:shadow-2xl')
              : (isSupabase ? 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-[var(--primary)] shadow-inner' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-[var(--primary)] shadow-card hover:shadow-2xl')
            } ${isConnectingFrom ? 'ring-4 ring-gray-400 ring-opacity-50' : ''} ${isHighlighted ? 'ring-2 ring-yellow-300 ring-opacity-80' : ''}`}
          style={{ willChange: 'box-shadow, transform' }}
        >
          {/* Outer ring removed; connections will start from an inner interaction area */}
          {/* Controls inside the circle: drag (left), settings (center), delete (right) */}
          <div
            className={`absolute top-2 left-1/2 -translate-x-1/2 z-30 transition-opacity duration-200 ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex items-center gap-2 w-28 justify-between">
              {/* Settings (left) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // If this is a File Upload widget, clicking the settings icon should open the file picker
                  if (widget.type === 'file-upload') {
                    (fileInputRef.current as HTMLInputElement | null)?.click();
                    return;
                  }
                  onOpenConfig();
                }}
                title="Settings"
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                  theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-white text-gray-700 shadow-sm'
                }`}
              >
                <Settings className="h-3 w-3" />
              </button>

              {/* Drag handle (center) - drag source attached here so only this handle initiates drag */}
              <button
                ref={drag}
                title="Drag"
                aria-label="Drag widget"
                className={`w-7 h-7 rounded-full flex items-center justify-center cursor-move transition-all duration-150 ${
                  theme === 'dark' ? 'bg-gray-700 border border-gray-600' : 'bg-gray-100 border border-gray-200'
                }`}
              >
                <GripVertical className="h-3 w-3 opacity-70" />
              </button>

              {/* Delete (right) */}
              {/* Delete button removed per user request */}
            </div>
          </div>

          {/* outer ring removed per user request */}

          <div className="flex-1 w-full relative flex items-center justify-center" style={{ paddingTop: 6 }}>
            {renderWidgetContent()}
          </div>

          {/* file-upload uses the same top-row controls as other widgets; no duplicate bottom buttons */}
          {/* Outer ring overlay: single interaction area that starts connections by angle
              and a dashed semi-arc highlight that orients toward the pointer when highlighted */}
          <div className="absolute inset-0 pointer-events-auto flex items-center justify-center">
            {/* Interaction area: small inner circle to start connections (user requested inner-layer connections) */}
            <div
              className="absolute w-16 h-16 rounded-full"
              style={{ transform: 'translateZ(0)' }}
              onPointerDown={(e) => {
                // start connection from the exact client coordinates so Canvas can compute a perimeter anchor
                try {
                  e.preventDefault();
                  e.stopPropagation();
                  onStartConnection && onStartConnection({ clientX: e.clientX, clientY: e.clientY });
                } catch (err) {
                  // swallow
                }
              }}
            />
          </div>
        </div>

        {/* Widget Label: render only for non-supabase widgets (supabase renders its own label inside) */}
        {widget.type !== 'supabase' && (
          <div
            className={`absolute top-full left-1/2 transform -translate-x-1/2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-all duration-300 ${
              theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700 shadow-sm'
            } ${showControls ? 'opacity-100' : 'opacity-0'}`}
          >
            {editingLabel !== null ? (
              <input
                value={editingLabel}
                onChange={(e) => setEditingLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (onUpdateWidget) onUpdateWidget({ label: editingLabel });
                    setEditingLabel(null);
                  } else if (e.key === 'Escape') {
                    setEditingLabel(null);
                  }
                }}
                className="px-2 py-1 rounded border text-xs"
                autoFocus
              />
            ) : (
              (widget.label && widget.label.length > 0)
                ? widget.label
                : widget.type
                    .split('-')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')
            )}
          </div>
        )}

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
          </div>
        )}

        {/* Processing Indicator removed per user request */}

        {/* Data Table Modal */}
        {widget.type === 'data-table' && (
          <DataTableModal
            isOpen={showTableModal}
            data={widget.data?.tableData || []}
            onClose={() => setShowTableModal(false)}
          />
        )}

      {/* Widget Selector Modal */}
      <WidgetSelectorModal
        isOpen={showSelector}
        onClose={() => setShowSelector(false)}
        onSelect={(widgetTypeId) => {
          if (onUpdateWidget) onUpdateWidget({ type: widgetTypeId });
        }}
        registry={widgetRegistry}
        onCreateLinked={(widgetTypeId) => {
          if (onCreateLinkedNode) onCreateLinkedNode(widget.id, widgetTypeId);
        }}
      />
      </div>

      {/* Custom right-click context menu */}
      {showContextMenu && contextPos && (
        <div
          role="menu"
          aria-label="Widget context menu"
          onClick={(e) => {
            e.stopPropagation();
          }}
          style={{ position: 'fixed', left: contextPos.x, top: contextPos.y, zIndex: 60 }}
        >
          <div className="w-48 rounded bg-white shadow-lg dark:bg-gray-800 text-sm overflow-hidden">
            {[
              { key: 'open', label: 'Open', shortcut: 'Enter', action: () => {
                  // Open the appropriate modal depending on widget type
                  if (widget.type === 'data-table') {
                    setShowTableModal(true);
                  } else if (widget.type === 'line-chart') {
                    setShowLineChartModal(true);
                  } else if (widget.type === 'scatter-plot') {
                    setShowScatterModal(true);
                  } else if (widget.type === 'box-plot') {
                    setShowBoxPlotModal(true);
                  } else if (widget.type === 'bar-chart') {
                    setShowBarChartModal(true);
                  } else if (widget.type === 'mean-average') {
                    setShowMeanModal(true);
                  } else {
                    onOpenConfig();
                  }
                } },
              { key: 'rename', label: 'Rename', shortcut: 'F2', action: () => setEditingLabel(widget.label || '') },
              { key: 'delete', label: 'Delete', shortcut: 'Del', action: () => onDelete() },
              { key: 'removeAll', label: 'Remove All', shortcut: 'Ctrl+X', action: () => { onRemoveConnections && onRemoveConnections(); } },
              { key: 'duplicate', label: 'Duplicate', shortcut: 'Ctrl+D', action: () => {/* placeholder */} },
              { key: 'copy', label: 'Copy', shortcut: 'Ctrl+C', action: () => {/* placeholder */} },
              { key: 'help', label: 'Help', shortcut: 'F1', action: () => {/* placeholder */} },
            ].map((item, idx) => (
              <button
                key={item.key}
                onClick={() => {
                  item.action();
                  setShowContextMenu(false);
                }}
                className={`w-full text-left px-3 py-2 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 ${idx === 0 ? 'pt-3' : ''}`}
              >
                <span>{item.label}</span>
                <span className="text-xs text-gray-500">{item.shortcut}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mean/Average Modal */}
      {widget.type === 'mean-average' && (
        <MeanAverageModal
          isOpen={showMeanModal}
          onClose={() => setShowMeanModal(false)}
          columns={columns}
          data={data}
          mode={mode}
          setMode={setMode}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          selectedCols={selectedCols}
          setSelectedCols={setSelectedCols}
        />
      )}

      {/* Line Chart Modal (usable by line-chart and processing widgets like baseline) */}
      {showLineChartModal && (() => {
        const modalData: Record<string, any>[] = modalPreviewData || widget.data?.tableDataProcessed || widget.data?.tableData || widget.data?.parsedData || [];
        const modalCols: string[] = modalData && modalData.length > 0 ? Object.keys(modalData[0]) : [];
        return (
          <LineChartModal
            isOpen={showLineChartModal}
            onClose={() => {
              setShowLineChartModal(false);
              setModalPreviewData(null);
            }}
            data={modalData}
            columns={modalCols}
          />
        );
      })()}

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