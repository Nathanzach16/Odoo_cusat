/**
 * Brightloop API Client
 * Centralized API integration layer for Member 2 tasks (Catalog, Plans, Taxes, Quotes, Subscriptions, Discounts)
 */

const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://localhost:8000';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token') || '';
    this.role = localStorage.getItem('user_role') || 'ADMIN';
  }

  setRole(role) {
    this.role = role;
    localStorage.setItem('user_role', role);
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-User-Role': this.role,
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...(options.headers || {}),
    };

    const config = {
      ...options,
      headers,
    };

    if (config.body && typeof config.body !== 'string') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);

      if (response.status === 204) {
        return null;
      }

      const contentType = response.headers.get('content-type');
      let data = null;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        let errorMsg = response.statusText;
        if (data && typeof data === 'object') {
          if (typeof data.detail === 'string') {
            errorMsg = data.detail;
          } else if (Array.isArray(data.detail)) {
            errorMsg = data.detail.map(d => `${d.loc?.slice(-1)[0] || 'field'}: ${d.msg}`).join(', ');
          }
        }
        throw new Error(errorMsg || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, err);
      throw err;
    }
  }

  // ==========================================
  // PRODUCTS & VARIANTS (T10, T11)
  // ==========================================
  async getProducts(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/catalog/products${q ? '?' + q : ''}`);
  }

  async getProduct(id) {
    return this.request(`/catalog/products/${id}`);
  }

  async createProduct(data) {
    return this.request('/catalog/products', { method: 'POST', body: data });
  }

  async updateProduct(id, data) {
    return this.request(`/catalog/products/${id}`, { method: 'PUT', body: data });
  }

  async deleteProduct(id) {
    return this.request(`/catalog/products/${id}`, { method: 'DELETE' });
  }

  async getVariants(productId) {
    return this.request(`/catalog/products/${productId}/variants`);
  }

  async createVariant(productId, data) {
    return this.request(`/catalog/products/${productId}/variants`, { method: 'POST', body: data });
  }

  async updateVariant(variantId, data) {
    return this.request(`/catalog/variants/${variantId}`, { method: 'PUT', body: data });
  }

  async deleteVariant(variantId) {
    return this.request(`/catalog/variants/${variantId}`, { method: 'DELETE' });
  }

  // ==========================================
  // SUBSCRIPTION PLANS (T12)
  // ==========================================
  async getPlans(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/catalog/plans${q ? '?' + q : ''}`);
  }

  async getPlan(id) {
    return this.request(`/catalog/plans/${id}`);
  }

  async createPlan(data) {
    return this.request('/catalog/plans', { method: 'POST', body: data });
  }

  async updatePlan(id, data) {
    return this.request(`/catalog/plans/${id}`, { method: 'PUT', body: data });
  }

  async deletePlan(id) {
    return this.request(`/catalog/plans/${id}`, { method: 'DELETE' });
  }

  // ==========================================
  // TAX RULES (T13)
  // ==========================================
  async getTaxes(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/catalog/taxes${q ? '?' + q : ''}`);
  }

  async getTax(id) {
    return this.request(`/catalog/taxes/${id}`);
  }

  async createTax(data) {
    return this.request('/catalog/taxes', { method: 'POST', body: data });
  }

  async updateTax(id, data) {
    return this.request(`/catalog/taxes/${id}`, { method: 'PUT', body: data });
  }

  async deleteTax(id) {
    return this.request(`/catalog/taxes/${id}`, { method: 'DELETE' });
  }

  // ==========================================
  // QUOTE TEMPLATES & CONVERSION (T14)
  // ==========================================
  async getQuoteTemplates() {
    return this.request('/quotes/templates');
  }

  async getQuoteTemplate(id) {
    return this.request(`/quotes/templates/${id}`);
  }

  async createQuoteTemplate(data) {
    return this.request('/quotes/templates', { method: 'POST', body: data });
  }

  async updateQuoteTemplate(id, data) {
    return this.request(`/quotes/templates/${id}`, { method: 'PUT', body: data });
  }

  async deleteQuoteTemplate(id) {
    return this.request(`/quotes/templates/${id}`, { method: 'DELETE' });
  }

  async convertTemplateToSubscription(templateId, data) {
    return this.request(`/quotes/templates/${templateId}/convert`, { method: 'POST', body: data });
  }

  // ==========================================
  // SUBSCRIPTIONS & LIFECYCLE (T15)
  // ==========================================
  async getSubscriptions(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/quotes/subscriptions${q ? '?' + q : ''}`);
  }

  async getSubscription(id) {
    return this.request(`/quotes/subscriptions/${id}`);
  }

  async createSubscription(data) {
    return this.request('/quotes/subscriptions', { method: 'POST', body: data });
  }

  async updateSubscription(id, data) {
    return this.request(`/quotes/subscriptions/${id}`, { method: 'PUT', body: data });
  }

  async transitionSubscriptionStatus(id, status) {
    return this.request(`/quotes/subscriptions/${id}/transition`, { method: 'POST', body: { status } });
  }

  async deleteSubscription(id) {
    return this.request(`/quotes/subscriptions/${id}`, { method: 'DELETE' });
  }

  // ==========================================
  // DISCOUNTS & BILLING LOOKUP (T16)
  // ==========================================
  async getDiscounts(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/discounts${q ? '?' + q : ''}`);
  }

  async getDiscount(id) {
    return this.request(`/discounts/${id}`);
  }

  async createDiscount(data) {
    return this.request('/discounts', { method: 'POST', body: data });
  }

  async updateDiscount(id, data) {
    return this.request(`/discounts/${id}`, { method: 'PUT', body: data });
  }

  async deleteDiscount(id) {
    return this.request(`/discounts/${id}`, { method: 'DELETE' });
  }

  async lookupDiscounts(data) {
    return this.request('/discounts/lookup', { method: 'POST', body: data });
  }

  async redeemDiscount(id) {
    return this.request(`/discounts/${id}/redeem`, { method: 'POST' });
  }
}

export const api = new ApiClient();
export default api;
