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
      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || `Upload failed (status ${response.status})`);
      }
      let result: any = {};
      try {
        result = text ? JSON.parse(text) : {};
      } catch (e) {
        throw new Error('Upload succeeded but returned invalid JSON: ' + text);
      }

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
      
      case 'supabase':
        return (
          <div className="space-y-4">
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Table Name
            </label>
            <input
              type="text"
              placeholder="raman_data"
              defaultValue={(widget.data && widget.data.supabaseTable) || 'raman_data'}
              onChange={(e) => onUpdate(widget.id, { data: { ...(widget.data || {}), supabaseTable: e.target.value } })}
              className="w-full px-3 py-2 border rounded"
            />
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Supabase Credentials (optional)
            </label>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="SUPABASE_URL"
                defaultValue={(widget.data && widget.data.supabaseUrl) || import.meta.env.VITE_SUPABASE_URL || ''}
                onChange={(e) => onUpdate(widget.id, { data: { ...(widget.data || {}), supabaseUrl: e.target.value } })}
                className="w-full px-3 py-2 border rounded"
              />
              <input
                type="text"
                placeholder="SUPABASE_KEY"
                defaultValue={(widget.data && widget.data.supabaseKey) || import.meta.env.VITE_SUPABASE_KEY || ''}
                onChange={(e) => onUpdate(widget.id, { data: { ...(widget.data || {}), supabaseKey: e.target.value } })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div className="text-sm text-gray-500">
              You can leave these blank to use app-level Vite env values or the built-in demo project values. Credentials will be stored in the widget data only for this workspace.
            </div>
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
            <button onClick={onClose} className="px-4 py-2 rounded-lg btn-outline">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg btn-primary">
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