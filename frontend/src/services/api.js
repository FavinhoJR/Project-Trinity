const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, item));
      return;
    }

    searchParams.append(key, value);
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers
      },
      ...options
    });

    let data = null;
    const responseText = await response.text();

    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { error: responseText };
      }
    }

    if (!response.ok) {
      const errorMessage = data?.error || `HTTP error ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  }

  login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  getCustomers(params = {}) {
    return this.request(`/customers${buildQueryString(params)}`);
  }

  getCustomer(id) {
    return this.request(`/customers/${id}`);
  }

  createCustomer(customerData) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData)
    });
  }

  updateCustomer(id, customerData) {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData)
    });
  }

  deleteCustomer(id) {
    return this.request(`/customers/${id}`, { method: 'DELETE' });
  }

  getAppointments(params = {}) {
    return this.request(`/appointments${buildQueryString(params)}`);
  }

  getAppointment(id) {
    return this.request(`/appointments/${id}`);
  }

  createAppointment(appointmentData) {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData)
    });
  }

  updateAppointment(id, appointmentData) {
    return this.request(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointmentData)
    });
  }

  deleteAppointment(id, force = false) {
    return this.request(`/appointments/${id}${force ? '?force=true' : ''}`, {
      method: 'DELETE'
    });
  }

  getCalendarAppointments(year, month, estilistaId = null) {
    return this.request(
      `/appointments/calendar/${year}/${month}${buildQueryString(estilistaId ? { estilista_id: estilistaId } : {})}`
    );
  }

  getServices(params = {}) {
    return this.request(`/services${buildQueryString(params)}`);
  }

  getService(id) {
    return this.request(`/services/${id}`);
  }

  createService(serviceData) {
    return this.request('/services', {
      method: 'POST',
      body: JSON.stringify(serviceData)
    });
  }

  updateService(id, serviceData) {
    return this.request(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData)
    });
  }

  deleteService(id) {
    return this.request(`/services/${id}`, { method: 'DELETE' });
  }

  getServiceCategories() {
    return this.request('/services/categories/list');
  }

  getUsers(params = {}) {
    return this.request(`/users${buildQueryString(params)}`);
  }

  getUser(id) {
    return this.request(`/users/${id}`);
  }

  getStylists() {
    return this.request('/users/stylists');
  }

  createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  updateUser(id, userData) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  deleteUser(id) {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }

  toggleUserStatus(id) {
    return this.request(`/users/${id}/toggle-status`, { method: 'PUT' });
  }

  updateUserPassword(id, newPassword) {
    return this.request(`/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ password: newPassword })
    });
  }

  getDashboardStats(periodo = 30) {
    return this.request(`/reports/dashboard${buildQueryString({ periodo })}`);
  }

  getRevenueReport(params = {}) {
    return this.request(`/reports/revenue${buildQueryString(params)}`);
  }

  getAppointmentsReport(params = {}) {
    return this.request(`/reports/appointments${buildQueryString(params)}`);
  }

  getClientsReport(params = {}) {
    return this.request(`/reports/clients${buildQueryString(params)}`);
  }

  healthCheck() {
    return this.request('/health');
  }
}

export default new ApiService();
