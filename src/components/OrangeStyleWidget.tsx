import React from 'react';
import { LucideIcon } from 'lucide-react';

interface OrangeStyleWidgetProps {
  icon: LucideIcon;
  label: string;
  statusText?: string;
  statusColor?: 'blue' | 'green' | 'gray' | 'orange';
  mainColor: string; // e.g., '#FF9800'
  lightColor: string; // e.g., '#FFE4CC'
  bgColor: string; // e.g., '#FFF8F0'
  children?: React.ReactNode; // Controls section
}

/**
 * Reusable Orange Data Mining style widget container
 * Features:
 * - Clean icon circle with connection ports
 * - Label below icon
 * - Status indicator
 * - Hover-to-show controls
 */
const OrangeStyleWidget: React.FC<OrangeStyleWidgetProps> = ({
  icon: Icon,
  label,
  statusText,
  statusColor = 'gray',
  mainColor,
  lightColor,
  bgColor,
  children
}) => {
  const statusColors = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    gray: 'text-gray-400',
    orange: 'text-orange-500'
  };

  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full cursor-default p-3 bg-white"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Main icon circle - Orange Data Mining style */}
      <div className="flex flex-col items-center gap-2 mb-3">
        {/* Outer circle with connection ports */}
        <div 
          className="rounded-full flex items-center justify-center relative"
          style={{
            width: 90,
            height: 90,
            background: bgColor
          }}
        >
          {/* Left connection port (INPUT) */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2">
            <div 
              className="w-4 h-8 rounded-l-full border-2 bg-white"
              style={{
                borderColor: mainColor,
                borderRight: 'none',
                clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)'
              }}
            ></div>
          </div>
          
          {/* Right connection port (OUTPUT) */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
            <div 
              className="w-4 h-8 rounded-r-full border-2 bg-white"
              style={{
                borderColor: mainColor,
                borderLeft: 'none',
                clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)'
              }}
            ></div>
          </div>
          
          {/* Dashed border circle */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              border: `2px dashed ${lightColor}`
            }}
          ></div>
          
          {/* Inner solid circle with icon */}
          <div 
            className="rounded-full flex items-center justify-center relative z-10"
            style={{
              width: 65,
              height: 65,
              background: mainColor,
              boxShadow: `0 2px 8px ${mainColor}40`
            }}
          >
            <Icon className="h-7 w-7 text-white" strokeWidth={2} />
          </div>
        </div>
        
        {/* Label below icon - Orange style */}
        <div className="text-center">
          <div className="text-xs font-semibold text-gray-800">{label}</div>
          {statusText && (
            <div className={`text-[10px] mt-0.5 ${statusColors[statusColor]}`}>
              {statusText}
            </div>
          )}
        </div>
      </div>

      {/* Compact controls - hidden until hover */}
      {children && (
        <div className="w-full flex flex-col gap-1.5 opacity-0 hover:opacity-100 transition-opacity duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

export default OrangeStyleWidget;
