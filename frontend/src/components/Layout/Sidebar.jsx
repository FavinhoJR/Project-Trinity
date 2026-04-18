import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  Calendar,
  Scissors,
  UserCog,
  BarChart3,
  LogOut,
  Sparkles,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const menuItems = [
  { path: '/', icon: Home, label: 'Dashboard', roles: ['admin', 'recepcion', 'estilista'] },
  { path: '/appointments', icon: Calendar, label: 'Citas', roles: ['admin', 'recepcion', 'estilista'] },
  { path: '/customers', icon: Users, label: 'Clientes', roles: ['admin', 'recepcion'] },
  { path: '/services', icon: Scissors, label: 'Servicios', roles: ['admin', 'recepcion'] },
  { path: '/users', icon: UserCog, label: 'Usuarios', roles: ['admin'] },
  { path: '/reports', icon: BarChart3, label: 'Reportes', roles: ['admin', 'recepcion'] }
];

const Sidebar = ({ isOpen, onToggle }) => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const filteredMenuItems = menuItems.filter((item) => hasRole(item.roles));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onToggle} />}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar__brand">
          <div className="brand-mark">
            <Sparkles size={18} />
          </div>
          <div>
            <strong>TRINITY</strong>
            <span>Beauty management suite</span>
          </div>
          <button type="button" className="icon-button sidebar__close" onClick={onToggle}>
            <X size={18} />
          </button>
        </div>

        <div className="sidebar__user-card">
          <div className="sidebar__user-avatar">{(user?.nombre || user?.email || 'U').charAt(0).toUpperCase()}</div>
          <div>
            <strong>{user?.nombre || user?.email}</strong>
            <span>{user?.role}</span>
          </div>
        </div>

        <nav className="sidebar__nav">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    onToggle();
                  }
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar-note">
            <strong>Enfoque académico</strong>
            <span>Diseñado para demo, control interno y crecimiento ordenado.</span>
          </div>
          <button type="button" onClick={handleLogout} className="nav-item nav-item--danger">
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
