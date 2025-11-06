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
  // Calculate control points for a smooth cubic bezier curve (Orange-style)
  const dx = to.x - from.x;
  const controlOffset = Math.abs(dx) * 0.6; // Smoother curves like Orange

  const controlPoint1 = { x: from.x + controlOffset, y: from.y };
  const controlPoint2 = { x: to.x - controlOffset, y: to.y };

  const pathData = `M ${from.x} ${from.y} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${to.x} ${to.y}`;

  // Orange Data Mining style colors - gray/neutral connections
  const lineColor = theme === 'dark' ? '#6B7280' : '#9CA3AF'; // Gray color
  const previewColor = theme === 'dark' ? '#60A5FA' : '#3B82F6'; // Blue for preview
  const markerId = `arrowhead-${isPreview ? 'preview' : 'normal'}-orange`;

  return (
    <>
      {/* Main dashed line - Orange Data Mining style */}
      <path
        d={pathData}
        fill="none"
        stroke={isPreview ? previewColor : lineColor}
        strokeWidth={isPreview ? 2.5 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="8,6"
        className={`transition-all duration-300 ${
          isPreview ? 'animate-pulse' : ''
        } ${
          createdAt && Date.now() - createdAt < 1500 ? 'connection-pop' : ''
        }`}
        opacity={isPreview ? 0.8 : 0.6}
      />

      {/* Small animated dot moving along connection (optional) */}
      {!isPreview && (
        <circle r={3} fill={lineColor} className="opacity-50">
          <animateMotion dur="3s" repeatCount="indefinite" path={pathData} />
        </circle>
      )}

      {/* Define arrowhead marker - Orange style */}
      <defs>
        <marker
          id={markerId}
          markerWidth={8}
          markerHeight={6}
          refX={7}
          refY={3}
          orient="auto"
        >
          <polygon
            points="0 0, 8 3, 0 6"
            fill={isPreview ? previewColor : lineColor}
          />
        </marker>
      </defs>

      {/* Transparent path to show arrowhead at end */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth={1}
        markerEnd={`url(#${markerId})`}
      />
    </>
  );
};

export default ConnectionLine;
