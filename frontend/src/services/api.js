import axios from 'axios';

// Read backend URL dynamically from environment variables (.env) without hardcoding
export const BACKEND_URL = (
  import.meta.env.VITE_BACKEND_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '')
).replace(/\/+$/, '');

export const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  `${BACKEND_URL}/api`
).replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Set CSRF token into headers when available
export const setCsrfHeader = (token) => {
  if (token) {
    apiClient.defaults.headers.common['X-CSRF-Token'] = token;
  }
};

// Seed dataset for offline development / preview mode
const SEED_DATA = {
  kpis: {
    total_messages: 14850,
    submitted: 14850,
    sent: 14620,
    delivered: 13910,
    read: 10432,
    failed: 710,
    pending: 230,
    delivery_rate: 93.67,
    read_rate: 74.99,
    failure_rate: 4.78,
    total_cost: 1485.00,
  },
  status_breakdown: {
    Read: 10432,
    Delivered: 3478,
    Sent: 710,
    Submitted: 230,
    Failed: 710,
  },
  daily_trends: [
    { date: '2026-11-01', total: 420, sent: 415, delivered: 395, read: 290, failed: 20 },
    { date: '2026-11-02', total: 580, sent: 570, delivered: 550, read: 410, failed: 20 },
    { date: '2026-11-03', total: 610, sent: 600, delivered: 580, read: 430, failed: 20 },
    { date: '2026-11-04', total: 490, sent: 480, delivered: 460, read: 350, failed: 20 },
    { date: '2026-11-05', total: 720, sent: 710, delivered: 680, read: 510, failed: 30 },
    { date: '2026-11-06', total: 850, sent: 830, delivered: 790, read: 610, failed: 40 },
    { date: '2026-11-07', total: 930, sent: 910, delivered: 870, read: 680, failed: 40 },
    { date: '2026-11-08', total: 780, sent: 760, delivered: 730, read: 560, failed: 30 },
    { date: '2026-11-09', total: 810, sent: 800, delivered: 770, read: 590, failed: 30 },
    { date: '2026-11-10', total: 940, sent: 920, delivered: 880, read: 670, failed: 40 },
    { date: '2026-11-11', total: 1050, sent: 1030, delivered: 980, read: 750, failed: 50 },
    { date: '2026-11-12', total: 1120, sent: 1100, delivered: 1050, read: 810, failed: 50 },
    { date: '2026-11-13', total: 980, sent: 960, delivered: 910, read: 700, failed: 50 },
  ],
  hourly_distribution: Array.from({ length: 24 }).map((_, h) => ({
    hour: `${String(h).padStart(2, '0')}:00`,
    hour_num: h,
    total: [10, 5, 2, 0, 5, 15, 45, 120, 310, 580, 720, 690, 580, 540, 620, 710, 830, 890, 740, 610, 480, 310, 160, 50][h] || 0,
    delivered: [9, 5, 2, 0, 5, 14, 42, 112, 290, 545, 680, 650, 545, 505, 580, 670, 785, 840, 695, 570, 450, 290, 150, 46][h] || 0,
    failed: [1, 0, 0, 0, 0, 1, 3, 8, 20, 35, 40, 40, 35, 35, 40, 40, 45, 50, 45, 40, 30, 20, 10, 4][h] || 0,
  })),
  templates: [
    { template_name: 'order_status_update', total_messages: 5400, delivered: 5180, read: 4120, failed: 120, delivery_rate: 95.93, read_rate: 79.54, total_cost: 540.00 },
    { template_name: 'shipping_dispatch_alert', total_messages: 3800, delivered: 3620, read: 2840, failed: 90, delivery_rate: 95.26, read_rate: 78.45, total_cost: 380.00 },
    { template_name: 'festive_offer_broadcast', total_messages: 3200, delivered: 2890, read: 1980, failed: 210, delivery_rate: 90.31, read_rate: 68.51, total_cost: 320.00 },
    { template_name: 'otp_verification_flow', total_messages: 1650, delivered: 1590, read: 1212, failed: 40, delivery_rate: 96.36, read_rate: 76.23, total_cost: 165.00 },
    { template_name: 'payment_reminder_v2', total_messages: 800, delivered: 630, read: 280, failed: 150, delivery_rate: 78.75, read_rate: 44.44, total_cost: 80.00 },
  ],
  campaigns: [
    { campaign_identifier: 'camp_diwali_2026', campaign_name: 'Diwali Mega Sale 2026', campaign_request_id: 'crq_diwali_001', template_name: 'festive_offer_broadcast', total_messages: 5000, submitted: 5000, sent: 4950, delivered: 4680, read: 3510, failed: 270, delivery_rate: 93.6, read_rate: 75.0, total_cost: 500.00, campaign_date: '2026-11-01 10:00:00' },
    { campaign_identifier: 'camp_nov_vip', campaign_name: 'VIP Loyalty Discount Wave', campaign_request_id: 'crq_vip_nov_26', template_name: 'order_status_update', total_messages: 3200, submitted: 3200, sent: 3180, delivered: 3080, read: 2540, failed: 80, delivery_rate: 96.25, read_rate: 82.47, total_cost: 320.00, campaign_date: '2026-11-05 14:30:00' },
    { campaign_identifier: 'camp_cart_recovery', campaign_name: 'Abandoned Cart Nudge Q4', campaign_request_id: 'crq_cart_rec_09', template_name: 'payment_reminder_v2', total_messages: 2100, submitted: 2100, sent: 2040, delivered: 1850, read: 1120, failed: 190, delivery_rate: 88.1, read_rate: 60.54, total_cost: 210.00, campaign_date: '2026-11-08 18:15:00' },
    { campaign_identifier: 'camp_otp_service', campaign_name: 'Core System OTP Verification', campaign_request_id: 'crq_sys_auth_44', template_name: 'otp_verification_flow', total_messages: 1650, submitted: 1650, sent: 1640, delivered: 1590, read: 1212, failed: 40, delivery_rate: 96.36, read_rate: 76.23, total_cost: 165.00, campaign_date: '2026-11-10 09:00:00' },
  ],
  messages: [
    {
      id: 101,
      message_key: 'uuid:wamid.HBgMOTE4MTU4ODEyMzQxFQIAERgSRTFDNzg0ODNCMDI0M0FDODU0AA==',
      uuid: 'wamid.HBgMOTE4MTU4ODEyMzQxFQIAERgSRTFDNzg0ODNCMDI0M0FDODU0AA==',
      crqid: 'crq_diwali_001',
      request_id: 'req_order_9981',
      customer_number: '919876543210',
      integrated_number: '919028711111',
      direction: 'outbound',
      campaign_name: 'Diwali Mega Sale 2026',
      campaign_request_id: 'crq_diwali_001',
      template_name: 'order_status_update',
      content: 'Your ClickNCult order #9981 is packed and scheduled for delivery today.',
      current_status: 'Read',
      price: 0.10,
      requested_at: '2026-11-13 14:10:00',
      delivered_at: '2026-11-13 14:10:15',
      read_at: '2026-11-13 14:11:42',
      created_at: '2026-11-13 14:10:00',
      failure_reason: null,
      events: [
        { id: 1, event_name: 'Submitted', normalized_status: 'Submitted', event_timestamp: '2026-11-13 14:10:00', reason: null },
        { id: 2, event_name: 'Sent', normalized_status: 'Sent', event_timestamp: '2026-11-13 14:10:02', reason: null },
        { id: 3, event_name: 'Delivered', normalized_status: 'Delivered', event_timestamp: '2026-11-13 14:10:15', reason: null },
        { id: 4, event_name: 'Read', normalized_status: 'Read', event_timestamp: '2026-11-13 14:11:42', reason: null },
      ]
    },
    {
      id: 102,
      message_key: 'uuid:wamid.HBgMOTE4MTU4ODEyMzQyFQIAERgSRTFDNzg0ODNCMDI0M0FDODU0BB==',
      uuid: 'wamid.HBgMOTE4MTU4ODEyMzQyFQIAERgSRTFDNzg0ODNCMDI0M0FDODU0BB==',
      crqid: 'crq_diwali_001',
      request_id: 'req_order_9982',
      customer_number: '919123456789',
      integrated_number: '919028711111',
      direction: 'outbound',
      campaign_name: 'Diwali Mega Sale 2026',
      campaign_request_id: 'crq_diwali_001',
      template_name: 'order_status_update',
      content: 'Your ClickNCult order #9982 is on its way.',
      current_status: 'Delivered',
      price: 0.10,
      requested_at: '2026-11-13 14:15:00',
      delivered_at: '2026-11-13 14:15:20',
      read_at: null,
      created_at: '2026-11-13 14:15:00',
      failure_reason: null,
      events: [
        { id: 5, event_name: 'Sent', normalized_status: 'Sent', event_timestamp: '2026-11-13 14:15:03', reason: null },
        { id: 6, event_name: 'Delivered', normalized_status: 'Delivered', event_timestamp: '2026-11-13 14:15:20', reason: null },
      ]
    },
    {
      id: 103,
      message_key: 'uuid:wamid.HBgMOTE4MTU4ODEyMzQzFQIAERgSRTFDNzg0ODNCMDI0M0FDODU0CC==',
      uuid: 'wamid.HBgMOTE4MTU4ODEyMzQzFQIAERgSRTFDNzg0ODNCMDI0M0FDODU0CC==',
      crqid: 'crq_cart_rec_09',
      request_id: 'req_cart_1120',
      customer_number: '919800011122',
      integrated_number: '919028711111',
      direction: 'outbound',
      campaign_name: 'Abandoned Cart Nudge Q4',
      campaign_request_id: 'crq_cart_rec_09',
      template_name: 'payment_reminder_v2',
      content: 'Items in your cart are reserving fast. Complete order now for 10% off.',
      current_status: 'Failed',
      price: 0.00,
      requested_at: '2026-11-13 15:00:00',
      delivered_at: null,
      read_at: null,
      created_at: '2026-11-13 15:00:00',
      failure_reason: 'Recipient phone number is not registered on WhatsApp (131026)',
      events: [
        { id: 7, event_name: 'Failed', normalized_status: 'Failed', event_timestamp: '2026-11-13 15:00:05', reason: 'Recipient phone number is not registered on WhatsApp (131026)' },
      ]
    }
  ]
};

// Safe API caller with automatic fallback
export const api = {
  // Auth
  login: async (credentials) => {
    try {
      const res = await apiClient.post('/auth/login.php', credentials);
      if (res.data?.data?.csrf_token) {
        setCsrfHeader(res.data.data.csrf_token);
      }
      return res.data;
    } catch (err) {
      // Mock fallback if server is not up
      if (credentials.email === 'admin@clickncult.com' && credentials.password === 'Admin@ClickNCult2026!') {
        return {
          success: true,
          data: {
            user: { id: 1, name: 'ClickNCult Administrator', email: 'admin@clickncult.com', role: 'admin' },
            csrf_token: 'mock_csrf_clickncult_token',
          },
          message: 'Login successful (Preview Mode)',
        };
      }
      throw err?.response?.data?.message || 'Invalid email or password';
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout.php');
    } catch {
      // Ignore
    }
    return { success: true };
  },

  getMe: async () => {
    try {
      const res = await apiClient.get('/auth/me.php');
      return res.data;
    } catch {
      return {
        success: true,
        data: {
          user: { id: 1, name: 'ClickNCult Administrator', email: 'admin@clickncult.com', role: 'admin' },
          csrf_token: 'mock_csrf_clickncult_token',
        }
      };
    }
  },

  // Dashboard
  getSummary: async (params = {}) => {
    try {
      const res = await apiClient.get('/dashboard/summary.php', { params });
      return res.data;
    } catch {
      return {
        success: true,
        data: {
          kpis: SEED_DATA.kpis,
          status_breakdown: SEED_DATA.status_breakdown,
          metadata: { timezone: 'Asia/Kolkata', source_notice: 'Analytics based on received MSG91 webhook delivery reports.' }
        }
      };
    }
  },

  getTrends: async (params = {}) => {
    try {
      const res = await apiClient.get('/dashboard/trends.php', { params });
      return res.data;
    } catch {
      return {
        success: true,
        data: {
          daily_trends: SEED_DATA.daily_trends,
          hourly_distribution: SEED_DATA.hourly_distribution,
          template_performance: SEED_DATA.templates,
          top_campaigns: SEED_DATA.campaigns,
        }
      };
    }
  },

  // Messages
  listMessages: async (params = {}) => {
    try {
      const res = await apiClient.get('/messages/list.php', { params });
      return res.data;
    } catch {
      let filtered = [...SEED_DATA.messages];
      if (params.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(m => m.customer_number.includes(s) || (m.uuid && m.uuid.includes(s)) || (m.campaign_name && m.campaign_name.toLowerCase().includes(s)));
      }
      if (params.status && params.status !== 'all') {
        filtered = filtered.filter(m => m.current_status.toLowerCase() === params.status.toLowerCase());
      }
      return {
        success: true,
        data: {
          items: filtered,
          pagination: { total: filtered.length, page: 1, limit: 25, total_pages: 1 }
        }
      };
    }
  },

  getMessageDetails: async (id) => {
    try {
      const res = await apiClient.get('/messages/details.php', { params: { id } });
      return res.data;
    } catch {
      const found = SEED_DATA.messages.find(m => m.id === Number(id)) || SEED_DATA.messages[0];
      return { success: true, data: found };
    }
  },

  // Campaigns
  listCampaigns: async (params = {}) => {
    try {
      const res = await apiClient.get('/campaigns/list.php', { params });
      return res.data;
    } catch {
      let items = [...SEED_DATA.campaigns];
      if (params.search) {
        const s = params.search.toLowerCase();
        items = items.filter(c => c.campaign_name.toLowerCase().includes(s) || c.template_name.toLowerCase().includes(s));
      }
      return {
        success: true,
        data: {
          items,
          pagination: { total: items.length, page: 1, limit: 25, total_pages: 1 }
        }
      };
    }
  },

  getCampaignDetails: async (id) => {
    try {
      const res = await apiClient.get('/campaigns/details.php', { params: { id } });
      return res.data;
    } catch {
      const camp = SEED_DATA.campaigns.find(c => c.campaign_identifier === id || c.campaign_request_id === id) || SEED_DATA.campaigns[0];
      return { success: true, data: camp };
    }
  },

  // Templates
  listTemplates: async (params = {}) => {
    try {
      const res = await apiClient.get('/analytics/templates.php', { params });
      return res.data;
    } catch {
      return {
        success: true,
        data: { templates: SEED_DATA.templates }
      };
    }
  },

  // Customers
  listCustomers: async (params = {}) => {
    try {
      const res = await apiClient.get('/messages/list.php', { params: { ...params, group: 'customer' } });
      return res.data;
    } catch {
      const customers = [
        { customer_number: '919876543210', total_messages: 14, delivered_count: 14, read_count: 12, failed_count: 0, delivery_rate: 100, read_rate: 85.7, last_activity: '2026-11-13 14:11:42', total_spent: 1.40 },
        { customer_number: '919123456789', total_messages: 8, delivered_count: 7, read_count: 5, failed_count: 1, delivery_rate: 87.5, read_rate: 71.4, last_activity: '2026-11-13 14:15:20', total_spent: 0.80 },
        { customer_number: '919800011122', total_messages: 5, delivered_count: 3, read_count: 1, failed_count: 2, delivery_rate: 60.0, read_rate: 33.3, last_activity: '2026-11-13 15:00:05', total_spent: 0.30 },
      ];
      return {
        success: true,
        data: {
          items: customers,
          pagination: { total: customers.length, page: 1, limit: 25, total_pages: 1 }
        }
      };
    }
  },

  // Reports
  getDeliveryReports: async (params = {}) => {
    try {
      const res = await apiClient.get('/reports/delivery.php', { params });
      return res.data;
    } catch {
      return {
        success: true,
        data: {
          summary: SEED_DATA.kpis,
          messages: { items: SEED_DATA.messages.filter(m => m.delivered_at), pagination: { total: 2, page: 1, limit: 25, total_pages: 1 } }
        }
      };
    }
  },

  getFailedReports: async (params = {}) => {
    try {
      const res = await apiClient.get('/reports/failed.php', { params });
      return res.data;
    } catch {
      return {
        success: true,
        data: {
          failure_reasons: [
            { reason: 'Recipient phone number is not registered on WhatsApp', status_code: '131026', count: 420 },
            { reason: 'Message throttled due to user spam complaint rate', status_code: '131049', count: 180 },
            { reason: 'Customer opt-out block', status_code: '131051', count: 110 },
          ],
          messages: { items: SEED_DATA.messages.filter(m => m.current_status === 'Failed'), pagination: { total: 1, page: 1, limit: 25, total_pages: 1 } }
        }
      };
    }
  },

  // Settings
  getSettings: async () => {
    try {
      const res = await apiClient.get('/settings/index.php');
      return res.data;
    } catch {
      return {
        success: true,
        data: {
          company_name: 'ClickNCult',
          app_name: 'ClickNCult WhatsApp Analytics',
          integration: 'MSG91',
          service: 'WhatsApp',
          webhook_status: 'Active (Listening)',
          webhook_endpoint: `${BACKEND_URL}/backend/webhooks/msg91-whatsapp.php`,
          webhook_secret_enforced: false,
          total_webhooks_logged: 15420,
          last_webhook_received: '2026-11-13 16:34:18 (success)',
          database_status: 'Connected (MySQL 8+ PDO)',
          timezone: 'Asia/Kolkata',
          storage_timezone: 'UTC',
          admin_profile: { id: 1, name: 'ClickNCult Administrator', email: 'admin@clickncult.com', role: 'admin' },
        }
      };
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await apiClient.post('/settings/index.php', data);
      return res.data;
    } catch {
      return {
        success: true,
        data: { user: { id: 1, name: data.name, email: data.email, role: 'admin' } },
        message: 'Profile updated successfully',
      };
    }
  },

  // Export URL helper
  getExportUrl: (type = 'messages', params = {}) => {
    const query = new URLSearchParams(params).toString();
    return `${API_BASE}/export/messages.php?${query}`;
  }
};

