import React from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const StatusBadge = ({ status, showIcon = true }) => {
  const statusConfig = {
    pendiente: {
      label: 'Pendiente',
      icon: Clock,
      className: 'status-pendiente'
    },
    confirmada: {
      label: 'Confirmada',
      icon: CheckCircle,
      className: 'status-confirmada'
    },
    completada: {
      label: 'Completada',
      icon: CheckCircle,
      className: 'status-completada'
    },
    cancelada: {
      label: 'Cancelada',
      icon: XCircle,
      className: 'status-cancelada'
    }
  };

  const config = statusConfig[status] || {
    label: status,
    icon: AlertCircle,
    className: 'status-pendiente'
  };

  const Icon = config.icon;

  return (
    <span className={`status ${config.className}`}>
      {showIcon && <Icon className="w-3 h-3" />}
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
