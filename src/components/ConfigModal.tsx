import React, { useRef, useState } from 'react';
import { X, Upload, Save, Settings } from 'lucide-react';
import { Widget, Theme } from '../types';

interface ConfigModalProps {
  isOpen: boolean;
  widget: Widget | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Widget>) => void;
  theme: Theme;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, widget, onClose, onUpdate, theme }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen || !widget) return null;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Use VITE_API_URL if available
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const uploadUrl = apiUrl ? `${apiUrl}/upload` : '/api/upload';
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();

      onUpdate(widget.id, {
        data: {
          filename: file.name,
          fileId: result.fileId,
          type: file.type,
          parsedData: result.parsedData,
        },
      });
    } catch (error: any) {
      setUploadError(error?.message || 'File upload failed');
      alert('File upload failed');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    onClose();
  };

  const renderWidgetConfig = () => {
    switch (widget.type) {
      case 'file-upload':
        return (
          <div className="space-y-4">
            <label
              className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Upload File
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
                theme === 'dark'
                  ? 'border-gray-600 hover:border-blue-400 bg-gray-800 hover:bg-gray-700'
                  : 'border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-blue-50'
              }`}
            >
              <Upload
                className={`h-8 w-8 mx-auto mb-2 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}
              />
              <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                {widget.data && widget.data.filename
                  ? widget.data.filename
                  : 'Click to upload CSV/XLS file'}
              </p>
              {uploading && (
                <p className="text-sm mt-1 text-blue-500">Uploading...</p>
              )}
              {uploadError && (
                <p className="text-sm mt-1 text-red-500">{uploadError}</p>
              )}
              {widget.data && widget.data.filename && !uploading && !uploadError && (
                <p
                  className={`text-sm mt-1 ${
                    theme === 'dark' ? 'text-green-400' : 'text-green-600'
                  }`}
                >
                  File uploaded successfully
                </p>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        );
      default:
        return <p>Configuration options will appear here.</p>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 text-center">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        <div
          className={`inline-block align-bottom rounded-lg text-left bg-white shadow-xl transform transition-all sm:max-w-lg sm:w-full ${
            theme === 'dark' ? 'bg-gray-800 text-white' : ''
          }`}
        >
          <div className="px-6 pt-6 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Settings className={`h-5 w-5 ${theme === 'dark' ? 'text-white' : 'text-blue-600'}`} />
              <h3 className="text-lg font-medium">
                Configure {widget.type.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
              </h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-200">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-6 py-4">{renderWidgetConfig()}</div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="inline h-4 w-4 mr-1" />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigModal;