import React from 'react';
import Layout from '../components/Layout/Layout';

const Customers = () => {
  return (
    <Layout title="Gestión de Clientes">
      <div className="card">
        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Gestión de Clientes</h2>
          <p className="text-gray-600 mb-4">
            Aquí podrás gestionar todos los clientes del salón.
          </p>
          <p className="text-sm text-gray-500">
            Funcionalidad en desarrollo...
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Customers;
