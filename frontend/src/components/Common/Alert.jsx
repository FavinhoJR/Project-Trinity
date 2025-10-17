import React from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';

const Alert = ({ type = 'info', message, onClose, className = '' }) => {
  const getAlertConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          backgroundColor: 'var(--success)',
          color: 'white',
          borderColor: 'var(--success)'
        };
      case 'error':
        return {
          icon: XCircle,
          backgroundColor: 'var(--error)',
          color: 'white',
          borderColor: 'var(--error)'
        };
      case 'warning':
        return {
          icon: AlertCircle,
          backgroundColor: 'var(--warning)',
          color: 'white',
          borderColor: 'var(--warning)'
        };
      default:
        return {
          icon: Info,
          backgroundColor: 'var(--primary)',
          color: 'white',
          borderColor: 'var(--primary)'
        };
    }
  };

  const config = getAlertConfig();
  const Icon = config.icon;

  return (
    <div 
      className={`flex items-start p-4 rounded-lg border ${className}`}
      style={{ 
        backgroundColor: config.backgroundColor,
        borderColor: config.borderColor,
        color: config.color
      }}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5 mr-3" />
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: config.color
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;