// Centralized API Configuration for separate frontend & backend hosting
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
export const API_BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  ME: `${API_BASE_URL}/api/auth/me`,
  PROFILE: `${API_BASE_URL}/api/auth/profile`,
  CHANGE_PASSWORD: `${API_BASE_URL}/api/auth/change-password`,
  CATEGORIES: `${API_BASE_URL}/api/categories`,
  CATEGORY_BY_ID: (id) => `${API_BASE_URL}/api/categories/${id}`,
  MATERIALS: `${API_BASE_URL}/api/materials`,
  MATERIAL_BY_ID: (id) => `${API_BASE_URL}/api/materials/${id}`,
  MATERIAL_BULK_DELETE: `${API_BASE_URL}/api/materials/bulk-delete`,
  SETTINGS: `${API_BASE_URL}/api/settings`,
  EMAIL_CONFIG: `${API_BASE_URL}/api/email-config`,
  EMAIL_TEST: `${API_BASE_URL}/api/email-config/test`,
  EMAIL_SEND_BILL: (billId) => `${API_BASE_URL}/api/email-config/send-bill/${billId}`,
  BILLS: `${API_BASE_URL}/api/bills`,
  BILL_BY_ID: (id) => `${API_BASE_URL}/api/bills/${id}`,
  BILL_PAYMENT_UPDATE: (id) => `${API_BASE_URL}/api/bills/${id}/payment`,
  BILL_SEND_RECEIPT: (id) => `${API_BASE_URL}/api/bills/${id}/send-receipt`,
  NEXT_INVOICE_NUMBER: `${API_BASE_URL}/api/bills/meta/next-number`,
  NEXT_RECEIPT_NUMBER: `${API_BASE_URL}/api/bills/meta/next-receipt-number`,

  INWARDS: `${API_BASE_URL}/api/inwards`,
  INWARD_BY_ID: (id) => `${API_BASE_URL}/api/inwards/${id}`,
  NEXT_INWARD_NUMBER: `${API_BASE_URL}/api/inwards/meta/next-number`,
  CLOUDINARY_CONFIG: `${API_BASE_URL}/api/cloudinary/config`,
  CLOUDINARY_TEST: `${API_BASE_URL}/api/cloudinary/test`,
  CLOUDINARY_UPLOAD: `${API_BASE_URL}/api/cloudinary/upload`,
  VERIFY_SERIAL: (serial) => `${API_BASE_URL}/api/materials/verify-serial/${encodeURIComponent(serial)}`,
  INVENTORY: `${API_BASE_URL}/api/inventory`,
  INVENTORY_LEDGER: `${API_BASE_URL}/api/inventory/ledger`,
  INVENTORY_ADJUST: `${API_BASE_URL}/api/inventory/adjust`,
  INVENTORY_REORDER_LEVEL: `${API_BASE_URL}/api/inventory/reorder-level`,
  INVENTORY_UPDATE_STOCK_THRESHOLD: `${API_BASE_URL}/api/inventory/update-stock-threshold`,
  INVENTORY_MATERIAL_SERIALS: (id, status) => `${API_BASE_URL}/api/inventory/serials/${id}${status ? `?status=${status}` : ''}`,
  SERVICES: `${API_BASE_URL}/api/services`,
  NEXT_SERVICE_NUMBER: `${API_BASE_URL}/api/services/next-number`,
  SERVICE_BY_ID: (id) => `${API_BASE_URL}/api/services/${id}`,
  SERVICE_STATUS_UPDATE: (id) => `${API_BASE_URL}/api/services/${id}/status`,
  SERVICE_SEND_RECEIPT: (id) => `${API_BASE_URL}/api/services/${id}/send-receipt`,
  HEALTH: `${API_BASE_URL}/api/health`
}

