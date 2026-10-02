const API_BASE = '/api';

/**
 * Standardized safe request wrapper that handles network errors,
 * non-2xx HTTP responses, and JSON parse exceptions.
 */
async function request(url, options = {}) {
  try {
    const res = await fetch(url, options);
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      const errMsg = data?.error || `HTTP ${res.status}: ${res.statusText || 'Request failed'}`;
      return { success: false, error: errMsg, status: res.status, ...(data || {}) };
    }

    return data || { success: true };
  } catch (err) {
    console.error(`API Error on ${url}:`, err);
    return { success: false, error: err.message || 'Network communication failure' };
  }
}

export const api = {
  // Stores & Products
  async getStores() {
    return request(`${API_BASE}/stores`);
  },

  async getStoreProducts(storeId) {
    return request(`${API_BASE}/stores/${storeId}/products`);
  },

  async toggleProductStock(storeId, productId, isInStock, stockQuantity) {
    return request(`${API_BASE}/stores/${storeId}/products/${productId}/toggle-stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_in_stock: isInStock, stock_quantity: stockQuantity })
    });
  },

  async toggleRushMode(storeId, rushMode) {
    return request(`${API_BASE}/stores/${storeId}/rush-mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rush_mode: rushMode })
    });
  },

  async aiVoiceSync(storeId, note) {
    return request(`${API_BASE}/stores/${storeId}/ai-voice-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note })
    });
  },

  // Bundles & Orders
  async getBundles() {
    return request(`${API_BASE}/bundles`);
  },

  async getOrders(customerName) {
    const url = customerName 
      ? `${API_BASE}/orders?customer_name=${encodeURIComponent(customerName)}`
      : `${API_BASE}/orders`;
    return request(url);
  },

  async getCustomerOrders(customerName = 'Kavita Iyer') {
    return request(`${API_BASE}/orders?customer_name=${encodeURIComponent(customerName)}`);
  },

  async getStoreOrders(storeId) {
    return request(`${API_BASE}/stores/${storeId}/orders`);
  },

  async updateOrderStatus(orderId, status, storeId = null) {
    const payload = { status };
    if (storeId !== null && storeId !== undefined) {
      payload.store_id = storeId;
    }
    return request(`${API_BASE}/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  async createOrder(orderPayload) {
    return request(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
  },

  // Retention
  async getRetentionProfile(customerName = 'Kavita Iyer') {
    return request(`${API_BASE}/retention/profile?customer_name=${encodeURIComponent(customerName)}`);
  },

  async advanceRetention(customerName = 'Kavita Iyer') {
    return request(`${API_BASE}/retention/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_name: customerName })
    });
  },

  // Support & Dispute Resolution
  async getSupportTickets() {
    return request(`${API_BASE}/support/tickets`);
  },

  async fileSupportTicket(ticketPayload) {
    return request(`${API_BASE}/support/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketPayload)
    });
  },

  async instantResolve(ticketPayload) {
    return request(`${API_BASE}/support/instant-resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketPayload)
    });
  },

  // Analytics & Rescue Simulation
  async getRescueMetrics() {
    return request(`${API_BASE}/analytics/rescue-metrics`);
  },

  // AI Copilot & Gemini Engine
  async getAiStatus() {
    return request(`${API_BASE}/ai/status`);
  },

  async setGeminiKey(apiKey) {
    return request(`${API_BASE}/ai/set-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey })
    });
  },

  async testAiPrompt(prompt) {
    return request(`${API_BASE}/ai/test-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
  }
};
