import React from 'react';
import { Waves, Settings, User, Sun, Moon } from 'lucide-react';
import { Theme } from '../types';

interface HeaderProps {
  onToggleTheme: () => void;
  theme: Theme;
}

const Header: React.FC<HeaderProps> = ({ onToggleTheme, theme }) => {
  return (
    <header className={`h-16 border-b transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white/80 backdrop-blur-md border-blue-200'
    }`}>
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl transition-colors duration-300 ${
            theme === 'dark' ? 'bg-blue-600' : 'bg-gradient-to-r from-blue-500 to-cyan-500'
          }`}>
            <Waves className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              DeepSpectrum
            </h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Spectral Data Analysis
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-lg transition-all duration-300 hover:scale-105 ${
              theme === 'dark' 
                ? 'hover:bg-gray-700 text-gray-300 hover:text-white' 
                : 'hover:bg-blue-50 text-gray-600 hover:text-blue-600'
            }`}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          
          <button className={`p-2 rounded-lg transition-all duration-300 hover:scale-105 ${
            theme === 'dark' 
              ? 'hover:bg-gray-700 text-gray-300 hover:text-white' 
              : 'hover:bg-blue-50 text-gray-600 hover:text-blue-600'
          }`}>
            <Settings className="h-5 w-5" />
          </button>
          
          <button className={`p-2 rounded-lg transition-all duration-300 hover:scale-105 ${
            theme === 'dark' 
              ? 'hover:bg-gray-700 text-gray-300 hover:text-white' 
              : 'hover:bg-blue-50 text-gray-600 hover:text-blue-600'
          }`}>
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;