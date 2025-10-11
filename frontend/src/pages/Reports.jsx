import React from 'react';
import Layout from '../components/Layout/Layout';

const Reports = () => {
  return (
    <Layout title="Reportes y Estadísticas">
      <div className="card">
        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Reportes y Estadísticas</h2>
          <p className="text-gray-600 mb-4">
            Aquí podrás ver reportes detallados y estadísticas del salón.
          </p>
          <p className="text-sm text-gray-500">
            Funcionalidad en desarrollo...
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
