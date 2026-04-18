import React from 'react';
import { Menu, Bell, CalendarDays } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ onMenuToggle, title = 'Dashboard' }) => {
  const { user } = useAuth();

  const todayLabel = new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date());

  return (
    <header className="topbar">
      <div className="topbar__main">
        <div className="topbar__title-group">
          <button type="button" onClick={onMenuToggle} className="icon-button topbar__menu">
            <Menu size={18} />
          </button>
          <div>
            <p className="eyebrow">Operación diaria</p>
            <h1 className="page-title">{title}</h1>
          </div>
        </div>

        <div className="topbar__actions">
          <div className="topbar-chip">
            <CalendarDays size={16} />
            <span>{todayLabel}</span>
          </div>
          <div className="topbar-chip">
            <Bell size={16} />
            <span>Base de notificaciones lista</span>
          </div>
          <div className="topbar-user">
            <div className="topbar-user__avatar">{(user?.nombre || user?.email || 'U').charAt(0).toUpperCase()}</div>
            <div>
              <strong>{user?.nombre || user?.email}</strong>
              <span>{user?.role}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
