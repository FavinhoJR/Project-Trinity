import React from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';

const Alert = ({ 
  type = 'info', 
  message, 
  onClose, 
  className = '' 
}) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  };

  const Icon = icons[type];

  return (
    <div className={`alert alert-${type} ${className}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 hover:bg-black hover:bg-opacity-10 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
