import React from 'react';
import { Menu, Bell, Search } from 'lucide-react';

const Header = ({ onMenuToggle, title = 'Dashboard' }) => {
  return (
    <header className="header">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 rounded-lg"
            style={{ 
              backgroundColor: 'transparent',
              color: 'var(--text)'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--surface)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>{title}</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--surface)' }}>
            <Search className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar..."
              className="bg-transparent border-none outline-none text-sm w-64"
              style={{ color: 'var(--text)' }}
            />
          </div>

          {/* Notifications */}
          <button 
            className="relative p-2 rounded-lg"
            style={{ 
              backgroundColor: 'transparent',
              color: 'var(--text-muted)'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--surface)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--error)' }}></span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
