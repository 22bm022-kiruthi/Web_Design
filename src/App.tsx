import React, { useCallback, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ReactFlowProvider } from 'reactflow';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import FilesModal from './components/FilesModal';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import WorkflowCanvas from './components/WorkflowCanvas';
import ConfigModal from './components/ConfigModal';
import TopMenuBar from './components/TopMenuBar';
import { Widget, Connection, Theme } from './types';
import LoginPage from './LoginPage';

const App: React.FC = () => {
  const [loggedIn, setLoggedIn] = useState<boolean>(() => {
    try {
      // Dev override: append ?showLogin=1 to force showing the login page regardless of localStorage
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      if (params && params.get('showLogin') === '1') return false;
      // support direct link to /login
      if (pathname === '/login' || pathname.endsWith('/login')) return false;
      return localStorage.getItem('loggedIn') === 'true';
    } catch (err) {
      return false;
    }
  });
  
  const handleLogin = () => {
    setLoggedIn(true);
    try {
      localStorage.setItem('loggedIn', 'true');
    } catch (err) {
      // ignore
    }
  };

  // If login was triggered via a dedicated /login path, remove it after successful login
  React.useEffect(() => {
    if (loggedIn) {
      try {
        if (typeof window !== 'undefined' && (window.location.pathname === '/login' || window.location.pathname.endsWith('/login'))) {
          window.history.replaceState({}, '', '/');
        }
      } catch (err) {
        // ignore
      }
    }
  }, [loggedIn]);

  // app state: theme, widgets, connections, selection
  const [theme, setTheme] = useState<Theme>('light' as Theme);
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? ('light' as Theme) : ('dark' as Theme)));

  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);

  // Add test widgets on first load to verify display
  React.useEffect(() => {
    if (widgets.length === 0) {
      console.log('[App] Adding test widgets');
      setWidgets([
        {
          id: 'test-file-upload',
          type: 'file-upload',
          position: { x: 100, y: 100 },
          data: {},
          label: 'File Upload'
        },
        {
          id: 'test-supabase',
          type: 'supabase',
          position: { x: 100, y: 250 },
          data: {},
          label: 'Supabase'
        },
        {
          id: 'test-noise-filter',
          type: 'noise-filter',
          position: { x: 300, y: 100 },
          data: {},
          label: 'Noise Filter'
        },
        {
          id: 'test-line-chart',
          type: 'line-chart',
          position: { x: 500, y: 100 },
          data: {},
          label: 'Line Chart'
        }
      ]);
    }
  }, []);
  // allow other components to open the Files modal for a specific widget by dispatching
  // window.dispatchEvent(new CustomEvent('openFilesModal', { detail: { widgetId } }))
  React.useEffect(() => {
    const handler = (ev: any) => {
      const id = ev?.detail?.widgetId;
      if (id) {
        const w = widgets.find((x) => x.id === id) || null;
        setSelectedWidget(w);
      }
      setFilesModalOpen(true);
    };
    window.addEventListener('openFilesModal', handler as EventListener);
    return () => window.removeEventListener('openFilesModal', handler as EventListener);
  }, [widgets]);

  const updateWidget = (id: string, changes: Partial<Widget>) =>
    setWidgets((prev: Widget[]) => prev.map((w: Widget) => (w.id === id ? { ...w, ...changes } : w)));

  const onAddWidget = (type: string, position: { x: number; y: number }, initialData?: any) => {
    const id = `widget-${Date.now()}`;
    setWidgets((prev: Widget[]) => [...prev, { id, type, position, data: initialData || {}, label: initialData?.widgetName || '' }]);
    return id;
  };

  const onOpenConfig = (widget: Widget) => setSelectedWidget(widget);
  const [filesModalOpen, setFilesModalOpen] = useState(false);
  const onDeleteWidget = (id: string) => {
    setWidgets((prev: Widget[]) => prev.filter((w: Widget) => w.id !== id));
    setConnections((prev: Connection[]) => prev.filter((c: Connection) => c.fromId !== id && c.toId !== id));
  };
  const onUpdateWidget = (id: string, changes: Partial<Widget>) => {
    updateWidget(id, changes);

    // If the widget's data contains tableData, propagate it to downstream widgets
    // support both tableData (explicit) and parsedData (from uploads) so downstream widgets get updated
    const newTable = (changes as any).data?.tableData || (changes as any).data?.parsedData;
    if (newTable && Array.isArray(newTable) && newTable.length > 0) {
      setWidgets((prevWidgets: Widget[]) => {
        // find connections from this widget
        const targets = connections.filter((c) => c.fromId === id).map((c) => c.toId);
        if (targets.length === 0) return prevWidgets;

        return prevWidgets.map((w) =>
          targets.includes(w.id)
            ? { ...w, data: { ...(w.data || {}), tableData: newTable } }
            : w
        );
      });
    }
  };

  const onRemoveConnections = (widgetId: string) => {
    setConnections((prev) => prev.filter((c) => c.fromId !== widgetId && c.toId !== widgetId));
  };

  const handleUseFile = (file: any) => {
    // assign file to selected widget if it is a file-upload
    if (!selectedWidget) {
      alert('No widget selected to receive the file. Please select a File Upload widget.');
      return;
    }
    if (selectedWidget.type !== 'file-upload') {
      alert('Selected widget is not a File Upload widget. Please select a File Upload widget to use this file.');
      return;
    }
    // update the selected widget with the file data
    onUpdateWidget(selectedWidget.id, { data: { filename: file.filename, fileId: file._id, parsedData: file.parsedData } });
    setFilesModalOpen(false);
  };

  const addConnection = useCallback(
    (fromId: string, toId: string) => {
      const newConnection: Connection = { id: `conn-${Date.now()}`, fromId, toId, createdAt: Date.now() };
  setConnections((prev: Connection[]) => [...prev, newConnection]);

  const fromWidget = widgets.find((w: Widget) => w.id === fromId);
  const toWidget = widgets.find((w: Widget) => w.id === toId);

      if (!fromWidget || !toWidget) return;

      // File Upload/Blank Remover -> Mean Average
      if (
        (fromWidget.type === 'file-upload' || fromWidget.type === 'supabase' || fromWidget.type === 'blank-remover') &&
        toWidget.type === 'mean-average'
      ) {
        const tableData = fromWidget.data?.tableData || fromWidget.data?.parsedData || [];
        setWidgets((prev: Widget[]) =>
          prev.map((widget: Widget) =>
            widget.id === toId
              ? {
                  ...widget,
                  data: {
                    ...widget.data,
                    tableData,
                    meanType: 'row', // default selection
                    meanResult: [],  // will be calculated in the widget
                  },
                }
              : widget
          )
        );
      }

      // Mean Average -> Data Table
      if (fromWidget.type === 'mean-average' && toWidget.type === 'data-table') {
        setWidgets((prev: Widget[]) =>
          prev.map((widget: Widget) =>
            widget.id === toId
              ? {
                  ...widget,
                  data: {
                    ...widget.data,
                    tableData: fromWidget.data?.meanResult || [],
                  },
                }
              : widget
          )
        );
      }

      // File Upload/Supabase -> Blank Remover: fill blanks with "NIL"
      if ((fromWidget.type === 'file-upload' || fromWidget.type === 'supabase') && toWidget.type === 'blank-remover') {
        const tableData = fromWidget.data?.tableData || fromWidget.data?.parsedData || [];
        // Replace all blank/empty/null/undefined cells with "NIL"
        const processed = tableData.map((row: Record<string, any>) => {
          const newRow: Record<string, any> = {};
          Object.entries(row).forEach(([key, val]) => {
            newRow[key] =
              val === null ||
              val === undefined ||
              (typeof val === 'string' && val.trim() === '')
                ? 'NIL'
                : val;
          });
          return newRow;
        });
        setWidgets((prev: Widget[]) =>
          prev.map((widget: Widget) =>
            widget.id === toId
              ? {
                  ...widget,
                  data: { ...widget.data, tableData: processed },
                }
              : widget
          )
        );
      }

      // Blank Remover -> Data Table
      if (fromWidget.type === 'blank-remover' && toWidget.type === 'data-table') {
        setWidgets((prev: Widget[]) =>
          prev.map((widget: Widget) =>
            widget.id === toId
              ? {
                  ...widget,
                  data: {
                    ...widget.data,
                    tableData: fromWidget.data?.tableData || [],
                  },
                }
              : widget
          )
        );
      }

          // File Upload/Supabase -> Data Table (use tableData from source if present)
          if ((fromWidget.type === 'file-upload' || fromWidget.type === 'supabase') && toWidget.type === 'data-table') {
            const tableData = fromWidget.data?.tableData || fromWidget.data?.parsedData || [];
            setWidgets((prev: Widget[]) =>
              prev.map((widget: Widget) =>
                widget.id === toId
                  ? {
                      ...widget,
                      data: {
                        ...widget.data,
                        tableData,
                      },
                    }
                  : widget
              )
            );
          }

          // File Upload/Supabase -> Line Chart
          if ((fromWidget.type === 'file-upload' || fromWidget.type === 'supabase') && toWidget.type === 'line-chart') {
            const tableData = fromWidget.data?.tableData || fromWidget.data?.parsedData || [];
            setWidgets((prev: Widget[]) =>
              prev.map((widget: Widget) =>
                widget.id === toId
                  ? {
                      ...widget,
                      data: {
                        ...widget.data,
                        tableData,
                      },
                    }
                  : widget
              )
            );
          }

          // File Upload/Supabase -> Baseline Correction
          if ((fromWidget.type === 'file-upload' || fromWidget.type === 'supabase') && toWidget.type === 'baseline-correction') {
            const tableData = fromWidget.data?.tableData || fromWidget.data?.parsedData || [];
            setWidgets((prev: Widget[]) =>
              prev.map((widget: Widget) =>
                widget.id === toId
                  ? {
                      ...widget,
                      data: {
                        ...(widget.data || {}),
                        tableData,
                      },
                    }
                  : widget
              )
            );
          }

      // File Upload / Supabase -> Noise Filter
      if ((fromWidget.type === 'file-upload' || fromWidget.type === 'supabase') && toWidget.type === 'noise-filter') {
        const tableData = fromWidget.data?.tableData || fromWidget.data?.parsedData || [];
        setWidgets((prev: Widget[]) =>
          prev.map((widget: Widget) =>
            widget.id === toId
              ? {
                  ...widget,
                  data: { ...(widget.data || {}), tableData },
                }
              : widget
          )
        );
      }

      // Baseline Correction -> Noise Filter (NEW: allows preprocessing chain)
      if (fromWidget.type === 'baseline-correction' && toWidget.type === 'noise-filter') {
        const tableData = fromWidget.data?.tableDataProcessed || fromWidget.data?.tableData || [];
        setWidgets((prev: Widget[]) =>
          prev.map((widget: Widget) =>
            widget.id === toId
              ? {
                  ...widget,
                  data: { ...(widget.data || {}), tableData },
                }
              : widget
          )
        );
      }

      // Noise Filter -> Data Table / Visualizations: prefer processed tableDataProcessed
      if (fromWidget.type === 'noise-filter' && (toWidget.type === 'data-table' || toWidget.type === 'line-chart' || toWidget.type === 'scatter-plot' || toWidget.type === 'box-plot' || toWidget.type === 'bar-chart')) {
        const processed = fromWidget.data?.tableDataProcessed || fromWidget.data?.tableData || [];
        setWidgets((prev: Widget[]) =>
          prev.map((widget: Widget) =>
            widget.id === toId
              ? {
                  ...widget,
                  data: { ...(widget.data || {}), tableData: processed },
                }
              : widget
          )
        );
      }

      // Baseline Correction -> Data Table / Visualizations: prefer processed tableDataProcessed
      if (fromWidget.type === 'baseline-correction' && (toWidget.type === 'data-table' || toWidget.type === 'line-chart' || toWidget.type === 'scatter-plot' || toWidget.type === 'box-plot' || toWidget.type === 'bar-chart')) {
        const processed = fromWidget.data?.tableDataProcessed || fromWidget.data?.tableData || [];
        setWidgets((prev: Widget[]) =>
          prev.map((widget: Widget) =>
            widget.id === toId
              ? {
                  ...widget,
                  data: { ...(widget.data || {}), tableData: processed },
                }
              : widget
          )
        );
      }

          // File Upload/Supabase -> Scatter Plot
          if ((fromWidget.type === 'file-upload' || fromWidget.type === 'supabase') && toWidget.type === 'scatter-plot') {
            const tableData = fromWidget.data?.tableData || fromWidget.data?.parsedData || [];
            setWidgets((prev: Widget[]) =>
              prev.map((widget: Widget) =>
                widget.id === toId
                  ? {
                      ...widget,
                      data: {
                        ...widget.data,
                        tableData,
                      },
                    }
                  : widget
              )
            );
          }

          // File Upload/Supabase -> Box Plot
          if ((fromWidget.type === 'file-upload' || fromWidget.type === 'supabase') && toWidget.type === 'box-plot') {
            const tableData = fromWidget.data?.tableData || fromWidget.data?.parsedData || [];
            setWidgets((prev: Widget[]) =>
              prev.map((widget: Widget) =>
                widget.id === toId
                  ? {
                      ...widget,
                      data: {
                        ...widget.data,
                        tableData,
                      },
                    }
                  : widget
              )
            );
          }

          // File Upload/Supabase -> Bar Chart
          if ((fromWidget.type === 'file-upload' || fromWidget.type === 'supabase') && toWidget.type === 'bar-chart') {
            const tableData = fromWidget.data?.tableData || fromWidget.data?.parsedData || [];
            setWidgets((prev: Widget[]) =>
              prev.map((widget: Widget) =>
                widget.id === toId
                  ? {
                      ...widget,
                      data: {
                        ...widget.data,
                        tableData,
                      },
                    }
                  : widget
              )
            );
          }

          // Generic fallback: if the source widget has tableData (e.g., Supabase fetch)
          // forward it to the target if the target doesn't already have tableData.
          try {
            const forwardTable = fromWidget.data?.tableData || fromWidget.data?.parsedData || [];
            if (forwardTable && forwardTable.length > 0) {
              setWidgets((prev: Widget[]) =>
                prev.map((widget: Widget) =>
                  widget.id === toId
                    ? {
                        ...widget,
                        data: { ...(widget.data || {}), tableData: forwardTable },
                      }
                    : widget
                )
              );
            }
          } catch (err) {
            console.error('Error forwarding tableData on connection:', err);
          }
    },
    [widgets]
  );

  if (!loggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }
  return (
    <ThemeProvider theme={theme} toggleTheme={toggleTheme}>
      <ReactFlowProvider>
        <DndProvider backend={HTML5Backend}>
          <ErrorBoundary>
            <div className="flex flex-col h-screen">
              <Header onToggleTheme={toggleTheme} theme={theme} onOpenFiles={() => setFilesModalOpen(true)} />
              <TopMenuBar />
              <div className="flex flex-1">
                <Sidebar onAddWidget={onAddWidget} />
                <WorkflowCanvas
                  widgets={widgets}
                  connections={connections}
                  onUpdateWidget={onUpdateWidget}
                  onDeleteWidget={onDeleteWidget}
                  onAddConnection={addConnection}
                  onAddWidget={onAddWidget}
                  onRemoveConnection={(fromId, toId) => {
                    setConnections((prev) => prev.filter((c) => !(c.fromId === fromId && c.toId === toId)));
                  }}
                />
              </div>
              {selectedWidget && (
                <ConfigModal
                  isOpen={!!selectedWidget}
                  widget={selectedWidget}
                  onClose={() => setSelectedWidget(null)}
                  onUpdate={onUpdateWidget}
                  theme={theme}
                />
              )}
              <FilesModal isOpen={filesModalOpen} onClose={() => setFilesModalOpen(false)} onUseFile={(f) => handleUseFile(f)} />
            </div>
          </ErrorBoundary>
        </DndProvider>
      </ReactFlowProvider>
    </ThemeProvider>
  );
};

export default App;