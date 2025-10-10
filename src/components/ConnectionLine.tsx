import React from 'react';
import { Theme } from '../types';

interface ConnectionLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  isPreview?: boolean;
  theme: Theme;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({
  from,
  to,
  isPreview = false,
  theme,
}) => {
  // Calculate control points for a smooth cubic bezier curve
  const dx = to.x - from.x;
  const controlOffset = Math.abs(dx) * 0.5;

  const controlPoint1 = { x: from.x + controlOffset, y: from.y };
  const controlPoint2 = { x: to.x - controlOffset, y: to.y };

  const pathData = `M ${from.x} ${from.y} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${to.x} ${to.y}`;

  // Define arrow marker ids dynamically based on theme and isPreview
  const markerId = `arrowhead-${isPreview ? 'preview' : 'normal'}-${theme}`;

  return (
    <>
      {/* Shadow/Background line */}
      <path
        d={pathData}
        fill="none"
        stroke={theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)'}
        strokeWidth={isPreview ? 4 : 6}
        className="drop-shadow-sm"
      />

      {/* Main line */}
      <path
        d={pathData}
        fill="none"
        stroke={
          isPreview
            ? theme === 'dark'
              ? '#60a5fa'
              : '#3b82f6'
            : theme === 'dark'
            ? '#06b6d4'
            : '#0891b2'
        }
        strokeWidth={isPreview ? 2 : 3}
        strokeDasharray={isPreview ? '8,4' : 'none'}
        className={`transition-all duration-300 ${
          isPreview ? 'animate-pulse' : ''
        }`}
      />

      {/* Animated data flow circles (only when not preview) */}
      {!isPreview && (
        <>
          <circle r={4} fill={theme === 'dark' ? '#06b6d4' : '#0891b2'} className="opacity-80">
            <animateMotion dur="2s" repeatCount="indefinite" path={pathData} />
          </circle>

          <circle
            r={2}
            fill={theme === 'dark' ? '#67e8f9' : '#22d3ee'}
            className="opacity-60"
          >
            <animateMotion dur="2s" repeatCount="indefinite" path={pathData} begin="0.5s" />
          </circle>
        </>
      )}

      {/* Define arrowhead marker */}
      <defs>
        <marker
          id={markerId}
          markerWidth={10}
          markerHeight={7}
          refX={9}
          refY={3.5}
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill={
              isPreview
                ? theme === 'dark'
                  ? '#60a5fa'
                  : '#3b82f6'
                : theme === 'dark'
                ? '#06b6d4'
                : '#0891b2'
            }
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
