import React from 'react';
import { Theme } from '../types';

interface ConnectionLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  isPreview?: boolean;
  theme: Theme;
  createdAt?: number;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({
  from,
  to,
  isPreview = false,
  theme,
  createdAt,
}) => {
  // Calculate control points for smooth cubic bezier curve - Orange Data Mining style
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  
  // Horizontal bezier curve with smooth transitions
  const controlOffset = Math.min(Math.abs(dx) * 0.5, 150);
  const controlPoint1 = { x: from.x + controlOffset, y: from.y };
  const controlPoint2 = { x: to.x - controlOffset, y: to.y };

  const pathData = `M ${from.x} ${from.y} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${to.x} ${to.y}`;

  // Orange Data Mining style - simple gray lines
  const lineColor = theme === 'dark' ? '#78716C' : '#A8A29E'; // Stone gray
  const previewColor = theme === 'dark' ? '#60A5FA' : '#3B82F6';
  const markerId = `arrow-${isPreview ? 'preview' : 'normal'}-${theme}`;

  return (
    <g className="connection-line-group">
      {/* Main connection line - Orange style: solid, thin, gray */}
      <path
        d={pathData}
        fill="none"
        stroke={isPreview ? previewColor : lineColor}
        strokeWidth={isPreview ? 2.5 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={isPreview ? "5,5" : "none"}
        className={`transition-all duration-200 ${
          isPreview ? 'opacity-70' : 'opacity-60 hover:opacity-80'
        }`}
        style={{
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
        }}
      />

      {/* Animated data flow indicator - small circle moving along path */}
      {!isPreview && (
        <circle 
          r={2.5} 
          fill={theme === 'dark' ? '#FFF' : '#FF9800'}
          className="opacity-60"
        >
          <animateMotion 
            dur="4s" 
            repeatCount="indefinite" 
            path={pathData}
            keyPoints="0;1"
            keyTimes="0;1"
          />
        </circle>
      )}

      {/* Arrow marker definition */}
      <defs>
        <marker
          id={markerId}
          markerWidth={6}
          markerHeight={6}
          refX={5}
          refY={3}
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M 0 0 L 6 3 L 0 6 z"
            fill={isPreview ? previewColor : lineColor}
          />
        </marker>
      </defs>

      {/* Arrow at end of line */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth={1}
        markerEnd={`url(#${markerId})`}
      />
    </g>
  );
};

export default ConnectionLine;
