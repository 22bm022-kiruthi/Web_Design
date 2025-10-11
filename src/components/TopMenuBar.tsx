import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const MenuButton: React.FC<{
  label: string;
  items: string[];
}> = ({ label, items }) => {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={`px-3 py-1 rounded-sm text-sm focus:outline-none ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}
      >
        {label}
      </button>
      {open && (
        <div className={`absolute left-0 mt-1 w-40 rounded shadow-lg z-50 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
          {items.map((it) => (
            <button key={it} className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-gray-700">
              {it}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const TopMenuBar: React.FC = () => {
  return (
    <div className="w-full border-b bg-white dark:bg-gray-900">
      <div className="max-w-full mx-auto px-4 py-1 flex items-center gap-2 select-none">
        <MenuButton label="File" items={["New", "Open", "Save", "Save As...", "Exit"]} />
        <MenuButton label="Edit" items={["Undo", "Redo", "Copy", "Paste", "Delete"]} />
        <MenuButton label="View" items={["Zoom In", "Zoom Out", "Reset Zoom", "Full Screen"]} />
        <MenuButton label="Widget" items={["Add Widget", "Remove Widget", "Configure"]} />
        <MenuButton label="Window" items={["Minimize", "Maximize", "Close"]} />
        <MenuButton label="Options" items={["Preferences", "Settings"]} />
        <MenuButton label="Help" items={["Documentation", "About"]} />
      </div>
    </div>
  );
};

export default TopMenuBar;
