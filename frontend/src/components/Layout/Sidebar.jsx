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
  Menu
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ isOpen, onToggle }) => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      path: '/',
      icon: Home,
      label: 'Dashboard',
      roles: ['admin', 'recepcion', 'estilista']
    },
    {
      path: '/appointments',
      icon: Calendar,
      label: 'Citas',
      roles: ['admin', 'recepcion', 'estilista']
    },
    {
      path: '/customers',
      icon: Users,
      label: 'Clientes',
      roles: ['admin', 'recepcion']
    },
    {
      path: '/services',
      icon: Scissors,
      label: 'Servicios',
      roles: ['admin', 'recepcion']
    },
    {
      path: '/users',
      icon: UserCog,
      label: 'Usuarios',
      roles: ['admin']
    },
    {
      path: '/reports',
      icon: BarChart3,
      label: 'Reportes',
      roles: ['admin', 'recepcion']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    hasRole(item.roles)
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'open' : ''} z-50`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-lg">TRINITY</h1>
                <p className="text-sm text-gray-500">Salón de Belleza</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `nav-item ${isActive ? 'active' : ''}`
                    }
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        onToggle();
                      }
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="nav-item w-full text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
