import React from 'react';
import Layout from '../components/Layout/Layout';

const Users = () => {
  return (
    <Layout title="Gestión de Usuarios">
      <div className="card">
        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Gestión de Usuarios</h2>
          <p className="text-gray-600 mb-4">
            Aquí podrás gestionar todos los usuarios del sistema.
          </p>
          <p className="text-sm text-gray-500">
            Funcionalidad en desarrollo...
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Users;
