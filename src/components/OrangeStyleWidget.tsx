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
      {/* Main icon circle - Orange Data Mining style (clean, no dashed border) */}
      <div className="flex flex-col items-center gap-2 mb-2">
        {/* Single solid circle with icon - cleaner Orange style */}
        <div 
          className="rounded-full flex items-center justify-center"
          style={{
            width: 56,
            height: 56,
            background: mainColor,
            boxShadow: `0 2px 6px ${mainColor}30`
          }}
        >
          <Icon className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>
        
        {/* Label below icon - Orange style */}
        <div className="text-center">
          <div className="text-[11px] font-semibold text-gray-800">{label}</div>
          {statusText && (
            <div className={`text-[9px] mt-0.5 ${statusColors[statusColor]}`}>
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
