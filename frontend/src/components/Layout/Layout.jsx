import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((current) => !current)} />

      <div className="main-content">
        <Header title={title} onMenuToggle={() => setSidebarOpen((current) => !current)} />
        <main className="page-shell">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
