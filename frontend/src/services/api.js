const API_BASE = '/api';

export const api = {
  // Stores & Products
  async getStores() {
    const res = await fetch(`${API_BASE}/stores`);
    return res.json();
  },

  async getStoreProducts(storeId) {
    const res = await fetch(`${API_BASE}/stores/${storeId}/products`);
    return res.json();
  },

  async toggleProductStock(storeId, productId, isInStock, stockQuantity) {
    const res = await fetch(`${API_BASE}/stores/${storeId}/products/${productId}/toggle-stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_in_stock: isInStock, stock_quantity: stockQuantity })
    });
    return res.json();
  },

  async toggleRushMode(storeId, rushMode) {
    const res = await fetch(`${API_BASE}/stores/${storeId}/rush-mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rush_mode: rushMode })
    });
    return res.json();
  },

  async aiVoiceSync(storeId, note) {
    const res = await fetch(`${API_BASE}/stores/${storeId}/ai-voice-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note })
    });
    return res.json();
  },

  // Bundles & Orders
  async getBundles() {
    const res = await fetch(`${API_BASE}/bundles`);
    return res.json();
  },

  async getOrders(customerName) {
    const url = customerName 
      ? `${API_BASE}/orders?customer_name=${encodeURIComponent(customerName)}`
      : `${API_BASE}/orders`;
    const res = await fetch(url);
    return res.json();
  },

  async getCustomerOrders(customerName = 'Kavita Iyer') {
    const res = await fetch(`${API_BASE}/orders?customer_name=${encodeURIComponent(customerName)}`);
    return res.json();
  },

  async getStoreOrders(storeId) {
    const res = await fetch(`${API_BASE}/stores/${storeId}/orders`);
    return res.json();
  },

  async updateOrderStatus(orderId, status) {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  async createOrder(orderPayload) {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    return res.json();
  },

  // Retention
  async getRetentionProfile(customerName = 'Kavita Iyer') {
    const res = await fetch(`${API_BASE}/retention/profile?customer_name=${encodeURIComponent(customerName)}`);
    return res.json();
  },

  async advanceRetention(customerName = 'Kavita Iyer') {
    const res = await fetch(`${API_BASE}/retention/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_name: customerName })
    });
    return res.json();
  },

  // Support & Dispute Resolution
  async getSupportTickets() {
    const res = await fetch(`${API_BASE}/support/tickets`);
    return res.json();
  },

  async fileSupportTicket(ticketPayload) {
    const res = await fetch(`${API_BASE}/support/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketPayload)
    });
    return res.json();
  },

  async instantResolve(ticketPayload) {
    const res = await fetch(`${API_BASE}/support/instant-resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketPayload)
    });
    return res.json();
  },

  // Analytics & Rescue Simulation
  async getRescueMetrics() {
    const res = await fetch(`${API_BASE}/analytics/rescue-metrics`);
    return res.json();
  },

  // AI Copilot & Gemini Engine
  async getAiStatus() {
    const res = await fetch(`${API_BASE}/ai/status`);
    return res.json();
  },

  async setGeminiKey(apiKey) {
    const res = await fetch(`${API_BASE}/ai/set-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey })
    });
    return res.json();
  },

  async testAiPrompt(prompt) {
    const res = await fetch(`${API_BASE}/ai/test-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    return res.json();
  }
};
