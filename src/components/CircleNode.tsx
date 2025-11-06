import React from 'react';
import { Handle, Position } from 'reactflow';
import { GripVertical } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const handleStyle: React.CSSProperties = {
  width: 18,
  height: 18,
  borderRadius: '50%',
  background: 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const semiCircleStyle: React.CSSProperties = {
  width: 18,
  height: 18,
  overflow: 'hidden',
};

const leftSemi: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: '18px 0 0 18px',
  transform: 'translateX(-50%)',
};

const CircleNode: React.FC<any> = ({ data }) => {
  const { theme } = useTheme();

  return (
    <div className="relative">
      <div className={`rounded-full w-20 h-20 flex items-center justify-center border-2 transition-shadow duration-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 shadow-md hover:shadow-2xl' : 'bg-white border-blue-200 shadow-md hover:shadow-2xl'}`} style={{ willChange: 'box-shadow, transform' }}>
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
          <GripVertical className="w-4 h-4 opacity-70" />
        </div>

        <div className="text-xs text-center px-2">{(data.widgetType || '').split('-').map((w:any) => w[0].toUpperCase()+w.slice(1)).join(' ')}</div>

        <Handle type="target" position={Position.Top} style={{ ...handleStyle, top: -9, left: '50%', transform: 'translateX(-50%)' }} />
        <Handle type="target" position={Position.Left} style={{ ...handleStyle, left: -9, top: '50%', transform: 'translateY(-50%)' }} />

        <div style={{ position: 'absolute', right: -9, top: '50%', transform: 'translateY(-50%)' }}>
          <div style={semiCircleStyle}>
            <div style={{ ...leftSemi, background: 'linear-gradient(90deg,#06b6d4,#3b82f6)' }} />
          </div>
          <Handle type="source" id="right" position={Position.Right} style={{ ...handleStyle, opacity: 0 }} />
        </div>

        <Handle type="source" position={Position.Bottom} style={{ ...handleStyle, bottom: -9, left: '50%', transform: 'translateX(-50%)' }} />
      </div>
    </div>
  );
};

export default CircleNode;
