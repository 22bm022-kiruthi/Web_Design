import React, { useRef, useState, useCallback } from 'react';
import { useDrop } from 'react-dnd';
import CanvasWidget from './CanvasWidget';
import ConnectionLine from './ConnectionLine';
import ConfigModal from './ConfigModal';
import { Widget, Connection, Theme } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface CanvasProps {
  widgets: Widget[];
  connections: Connection[];
  onUpdateWidget: (id: string, changes: Partial<Widget>) => void;
  onDeleteWidget: (id: string) => void;
  onOpenConfig: (widget: Widget) => void;
  onAddConnection: (fromId: string, toId: string) => void; // <-- must be present
  onAddWidget: (type: string, position: { x: number; y: number }) => void; // <-- must be present
}

const Canvas: React.FC<CanvasProps> = ({
  widgets,
  connections,
  onUpdateWidget,
  onDeleteWidget,
  onOpenConfig,
  onAddConnection,
  onAddWidget,
}) => {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [connectionPreview, setConnectionPreview] = useState<{
    from: { x: number; y: number };
    to: { x: number; y: number };
  } | null>(null);
  const { theme } = useTheme();

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ['widget', 'canvas-widget'], // Accept both new and existing widgets
    drop: (item: any, monitor) => {
      if (!canvasRef.current) return;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const position = {
        x: clientOffset.x - canvasRect.left - 40,
        y: clientOffset.y - canvasRect.top - 40,
      };

      // If dragging from sidebar, add new widget
      if (item.type && typeof item.type === 'string' && !item.id) {
        onAddWidget(item.type, position);
      }

      // If dragging an existing widget, update its position
      if (item.id) {
        onUpdateWidget(item.id, { position });
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const setCanvasRef = useCallback(
    (node: HTMLDivElement | null) => {
      canvasRef.current = node;
      if (node) {
        drop(node);
      }
    },
    [drop]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (connectingFrom && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const fromWidget = widgets.find((w) => w.id === connectingFrom);
        if (fromWidget) {
          setConnectionPreview({
            from: {
              x: fromWidget.position.x + 40,
              y: fromWidget.position.y + 40,
            },
            to: {
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
            },
          });
        }
      }
    },
    [connectingFrom, widgets]
  );

  const handleStartConnection = useCallback((widgetId: string) => {
    setConnectingFrom(widgetId);
  }, []);

  const handleEndConnection = useCallback(
    (widgetId: string) => {
      if (connectingFrom && connectingFrom !== widgetId) {
        onAddConnection(connectingFrom, widgetId);
      }
      setConnectingFrom(null);
      setConnectionPreview(null);
    },
    [connectingFrom, onAddConnection]
  );

  const handleCancelConnection = useCallback(() => {
    setConnectingFrom(null);
    setConnectionPreview(null);
  }, []);

  return (
    <div
      ref={setCanvasRef}
      className={`relative w-full h-full overflow-hidden transition-all duration-300 ${
        isOver ? (theme === 'dark' ? 'bg-gray-800/50' : 'bg-blue-50/50') : ''
      }`}
      onMouseMove={handleMouseMove}
      onClick={handleCancelConnection}
      // To prevent canvas from losing drag events by stopping propagation on inner elements:
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Grid Background */}
      <div
        className={`absolute inset-0 opacity-30 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}
        style={{
          backgroundImage:
            theme === 'dark'
              ? `radial-gradient(circle, rgba(148, 163, 184, 0.3) 1px, transparent 1px)`
              : `radial-gradient(circle, rgba(59, 130, 246, 0.3) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Connection Lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        style={{ overflow: 'visible' }} // Ensure lines are not clipped
      >
        {connections.map((connection) => {
          const fromWidget = widgets.find((w) => w.id === connection.fromId);
          const toWidget = widgets.find((w) => w.id === connection.toId);

          if (!fromWidget || !toWidget) return null;

          return (
            <ConnectionLine
              key={connection.id}
              from={{ x: fromWidget.position.x + 40, y: fromWidget.position.y + 40 }}
              to={{ x: toWidget.position.x + 40, y: toWidget.position.y + 40 }}
              theme={theme}
            />
          );
        })}

        {/* Preview Connection */}
        {connectionPreview && (
          <ConnectionLine
            from={connectionPreview.from}
            to={connectionPreview.to}
            isPreview
            theme={theme}
          />
        )}
      </svg>

      {/* Widgets */}
      {widgets.map((widget) => (
        <CanvasWidget
          key={widget.id}
          widget={widget}
          isConnecting={connectingFrom !== null}
          isConnectingFrom={connectingFrom === widget.id}
          onUpdatePosition={(position) => onUpdateWidget(widget.id, { position })}
          onDelete={() => onDeleteWidget(widget.id)}
          onOpenConfig={() => onOpenConfig(widget)} 
          onStartConnection={() => handleStartConnection(widget.id)}
          onEndConnection={() => handleEndConnection(widget.id)}
        />
      ))}

      {/* Empty canvas instructions */}
      {widgets.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className="text-6xl mb-4">🌊</div>
            <h3 className="text-xl font-semibold mb-2">Welcome to DeepSpectrum</h3>
            <p className="text-lg mb-4">
              Drag widgets from the sidebar to start building your analysis workflow
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <span className={`px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-blue-100'}`}>
                Upload Data
              </span>
              <span className={`px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-blue-100'}`}>
                Process
              </span>
              <span className={`px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-blue-100'}`}>
                Visualize
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;
