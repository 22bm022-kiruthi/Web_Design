import React, { useCallback, useMemo, useState, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Panel,
  useReactFlow,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import '../workflow.css';
import dagre from 'dagre';
import WorkflowNode, { WorkflowNodeData } from './WorkflowNode';
import { Widget, Connection as AppConnection } from '../types';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface WorkflowCanvasProps {
  widgets: Widget[];
  connections: AppConnection[];
  onUpdateWidget: (id: string, changes: Partial<Widget>) => void;
  onDeleteWidget: (id: string) => void;
  onAddConnection: (fromId: string, toId: string) => void;
  onRemoveConnection?: (fromId: string, toId: string) => void;
  onAddWidget?: (type: string, position: { x: number; y: number }) => void;
}

const nodeTypes = {
  workflow: WorkflowNode,
};

// Auto-layout using Dagre
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, ranksep: 150, nodesep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 140, height: 90 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 70, // Center the node
        y: nodeWithPosition.y - 45,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  widgets,
  connections,
  onUpdateWidget,
  onDeleteWidget,
  onAddConnection,
  onRemoveConnection,
  onAddWidget,
}) => {
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowBounds, setReactFlowBounds] = useState<DOMRect | null>(null);

  // Update bounds when wrapper changes
  React.useEffect(() => {
    if (reactFlowWrapper.current) {
      setReactFlowBounds(reactFlowWrapper.current.getBoundingClientRect());
    }
  }, []);

  // Handle drop from sidebar
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const type = event.dataTransfer.getData('application/reactflow');
      
      console.log('[WorkflowCanvas] Drop event fired!', { type, clientX: event.clientX, clientY: event.clientY });
      
      if (!type) {
        console.log('[WorkflowCanvas] No widget type in drag data');
        return;
      }

      if (!onAddWidget) {
        console.log('[WorkflowCanvas] onAddWidget not provided');
        return;
      }

      // Calculate position relative to React Flow viewport
      let position;
      const flowInstance = rfInstance || reactFlowInstance;
      
      if (flowInstance && flowInstance.screenToFlowPosition) {
        position = flowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        console.log('[WorkflowCanvas] Using React Flow position:', position);
      } else if (reactFlowWrapper.current) {
        const bounds = reactFlowWrapper.current.getBoundingClientRect();
        position = {
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        };
        console.log('[WorkflowCanvas] Using wrapper bounds position:', position);
      } else {
        position = {
          x: event.clientX - 100,
          y: event.clientY - 100,
        };
        console.log('[WorkflowCanvas] Using fallback position:', position);
      }

      console.log('[WorkflowCanvas] Dropping widget:', type, 'at position:', position);
      onAddWidget(type, position);
    },
    [rfInstance, reactFlowInstance, onAddWidget]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
    // Only log occasionally to avoid spam
    if (Math.random() < 0.01) {
      console.log('[WorkflowCanvas] Drag over canvas');
    }
  }, []);

  // Convert widgets to React Flow nodes
  const initialNodes: Node<WorkflowNodeData>[] = useMemo(
    () =>
      widgets.map((widget) => ({
        id: widget.id,
        type: 'workflow',
        position: widget.position,
        data: {
          type: widget.type,
          label: widget.label,
          status: widget.data?.fetchStatus === 'success' || widget.data?.tableDataProcessed ? 'success' : 'idle',
          hasData: !!(widget.data?.tableData || widget.data?.parsedData),
        },
      })),
    [widgets]
  );

  // Convert connections to React Flow edges
  const initialEdges: Edge[] = useMemo(
    () =>
      connections.map((conn) => ({
        id: conn.id || `${conn.fromId}-${conn.toId}`,
        source: conn.fromId,
        target: conn.toId,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#64B5F6', strokeWidth: 2 },
      })),
    [connections]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Store React Flow instance when initialized
  const [rfInstance, setRfInstance] = React.useState<any>(null);

  // Update nodes when widgets change
  React.useEffect(() => {
    setNodes(initialNodes);
  }, [widgets, setNodes]);

  // Update edges when connections change
  React.useEffect(() => {
    setEdges(initialEdges);
  }, [connections, setEdges]);

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        onAddConnection(params.source, params.target);
        setEdges((eds) => addEdge({ ...params, animated: true, type: 'smoothstep' }, eds));
      }
    },
    [onAddConnection, setEdges]
  );

  // Handle node position changes
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onUpdateWidget(node.id, {
        position: {
          x: Math.round(node.position.x / 20) * 20, // Snap to 20px grid
          y: Math.round(node.position.y / 20) * 20,
        },
      });
    },
    [onUpdateWidget]
  );

  // Handle node deletion
  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      deleted.forEach((node) => onDeleteWidget(node.id));
    },
    [onDeleteWidget]
  );

  // Handle edge deletion
  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      if (onRemoveConnection) {
        deleted.forEach((edge) => {
          onRemoveConnection(edge.source, edge.target);
        });
      }
    },
    [onRemoveConnection]
  );

  // Auto-layout function
  const handleAutoLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    
    // Update widget positions in parent state
    layoutedNodes.forEach((node) => {
      onUpdateWidget(node.id, { position: node.position });
    });

    // Fit view after layout
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 400 });
    }, 50);
  }, [nodes, edges, setNodes, setEdges, onUpdateWidget, reactFlowInstance]);

  // Zoom controls
  const handleZoomIn = () => reactFlowInstance.zoomIn({ duration: 300 });
  const handleZoomOut = () => reactFlowInstance.zoomOut({ duration: 300 });
  const handleFitView = () => reactFlowInstance.fitView({ padding: 0.2, duration: 400 });

  return (
    <div 
      ref={reactFlowWrapper}
      style={{ width: '100%', height: '100%', position: 'relative' }}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onInit={setRfInstance}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#90A4AE', strokeWidth: 2 },
        }}
        connectionLineStyle={{ stroke: '#64B5F6', strokeWidth: 2 }}
        minZoom={0.25}
        maxZoom={2}
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e0e0e0" />
        
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as WorkflowNodeData;
            const category = data.type;
            const colorMap: Record<string, string> = {
              'file-upload': '#FF9800',
              'supabase': '#FF9800',
              'noise-filter': '#4CAF50',
              'baseline-correction': '#4CAF50',
              'smoothing': '#4CAF50',
              'normalization': '#4CAF50',
              'mean-average': '#9C27B0',
              'custom-code': '#9C27B0',
              'line-chart': '#2196F3',
              'bar-chart': '#2196F3',
              'scatter-plot': '#2196F3',
              'box-plot': '#2196F3',
              'data-table': '#2196F3',
            };
            return colorMap[category] || '#9E9E9E';
          }}
          style={{
            backgroundColor: '#f5f5f5',
            border: '2px solid #e0e0e0',
          }}
        />
        
        <Controls showInteractive={false} />
        
        {/* Custom Control Panel */}
        <Panel position="top-right" style={{ margin: '10px' }}>
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              padding: '8px',
              display: 'flex',
              gap: '8px',
            }}
          >
            <button
              onClick={handleZoomIn}
              style={{
                width: '32px',
                height: '32px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                background: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={handleZoomOut}
              style={{
                width: '32px',
                height: '32px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                background: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <button
              onClick={handleFitView}
              style={{
                width: '32px',
                height: '32px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                background: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Fit to Screen"
            >
              <Maximize2 size={16} />
            </button>
            <button
              onClick={handleAutoLayout}
              style={{
                height: '32px',
                padding: '0 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                color: '#2196F3',
              }}
              title="Auto Layout"
            >
              Auto Layout
            </button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default WorkflowCanvas;
