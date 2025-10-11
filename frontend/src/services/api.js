const API_BASE_URL = 'http://localhost:4000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Customers
  async getCustomers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/customers${queryString ? `?${queryString}` : ''}`);
  }

  async getCustomer(id) {
    return this.request(`/customers/${id}`);
  }

  async createCustomer(customerData) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  async updateCustomer(id, customerData) {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  }

  async deleteCustomer(id) {
    return this.request(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // Appointments
  async getAppointments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/appointments${queryString ? `?${queryString}` : ''}`);
  }

  async getAppointment(id) {
    return this.request(`/appointments/${id}`);
  }

  async createAppointment(appointmentData) {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  }

  async updateAppointment(id, appointmentData) {
    return this.request(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointmentData),
    });
  }

  async deleteAppointment(id, force = false) {
    return this.request(`/appointments/${id}${force ? '?force=true' : ''}`, {
      method: 'DELETE',
    });
  }

  async getCalendarAppointments(year, month, estilistaId = null) {
    const params = estilistaId ? `?estilista_id=${estilistaId}` : '';
    return this.request(`/appointments/calendar/${year}/${month}${params}`);
  }

  // Services
  async getServices(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/services${queryString ? `?${queryString}` : ''}`);
  }

  async getService(id) {
    return this.request(`/services/${id}`);
  }

  async createService(serviceData) {
    return this.request('/services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  }

  async updateService(id, serviceData) {
    return this.request(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData),
    });
  }

  async deleteService(id) {
    return this.request(`/services/${id}`, {
      method: 'DELETE',
    });
  }

  async getServiceCategories() {
    return this.request('/services/categories/list');
  }

  // Users
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/users${queryString ? `?${queryString}` : ''}`);
  }

  async getUser(id) {
    return this.request(`/users/${id}`);
  }

  async getStylists() {
    return this.request('/users/stylists');
  }

  async createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id, userData) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleUserStatus(id) {
    return this.request(`/users/${id}/toggle-status`, {
      method: 'PUT',
    });
  }

  // Reports
  async getDashboardStats(periodo = 30) {
    return this.request(`/reports/dashboard?periodo=${periodo}`);
  }

  async getRevenueReport(params) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/revenue?${queryString}`);
  }

  async getAppointmentsReport(params) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/appointments?${queryString}`);
  }

  async getClientsReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/clients${queryString ? `?${queryString}` : ''}`);
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export default new ApiService();
