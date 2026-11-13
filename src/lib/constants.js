export const PERMISSIONS = {
  PRODUCTS_MANAGE: "products.manage",
  INVENTORY_MANAGE: "inventory.manage",
  ORDERS_MANAGE: "orders.manage",
  PAYMENTS_MANAGE: "payments.manage",
  REPAIRS_MANAGE: "repairs.manage",
  SERVICES_MANAGE: "services.manage",
  CUSTOMERS_MANAGE: "customers.manage",
  REPORTS_VIEW: "reports.view",
  STAFF_MANAGE: "staff.manage",
  SETTINGS_MANAGE: "settings.manage",
};

export const PERMISSION_LABELS = {
  [PERMISSIONS.PRODUCTS_MANAGE]: "Manage products and categories",
  [PERMISSIONS.INVENTORY_MANAGE]: "Manage inventory and stock movements",
  [PERMISSIONS.ORDERS_MANAGE]: "Manage orders and fulfilment",
  [PERMISSIONS.PAYMENTS_MANAGE]: "View and reconcile payments",
  [PERMISSIONS.REPAIRS_MANAGE]: "Manage repair requests",
  [PERMISSIONS.SERVICES_MANAGE]: "Manage digital services and requests",
  [PERMISSIONS.CUSTOMERS_MANAGE]: "View and manage customers",
  [PERMISSIONS.REPORTS_VIEW]: "View reports and analytics",
  [PERMISSIONS.STAFF_MANAGE]: "Manage staff and permissions",
  [PERMISSIONS.SETTINGS_MANAGE]: "Manage business settings",
};

export const ROLE_DEFAULTS = {
  ADMIN: Object.values(PERMISSIONS),
  STAFF: [
    PERMISSIONS.PRODUCTS_MANAGE,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.ORDERS_MANAGE,
    PERMISSIONS.REPAIRS_MANAGE,
    PERMISSIONS.SERVICES_MANAGE,
    PERMISSIONS.CUSTOMERS_MANAGE,
  ],
  TECHNICIAN: [PERMISSIONS.REPAIRS_MANAGE],
  CUSTOMER: [],
};

export const ORDER_STATUS = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  CONFIRMED: "CONFIRMED",
  PROCESSING: "PROCESSING",
  READY_FOR_COLLECTION: "READY_FOR_COLLECTION",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

export const ORDER_STATUS_LABELS = {
  PENDING_PAYMENT: "Pending payment",
  PAYMENT_FAILED: "Payment failed",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  READY_FOR_COLLECTION: "Ready for collection",
  OUT_FOR_DELIVERY: "Out for delivery",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const ORDER_STATUS_TONES = {
  PENDING_PAYMENT: "amber",
  PAYMENT_FAILED: "red",
  CONFIRMED: "blue",
  PROCESSING: "blue",
  READY_FOR_COLLECTION: "green",
  OUT_FOR_DELIVERY: "blue",
  COMPLETED: "green",
  CANCELLED: "slate",
};

export const PAYMENT_STATUS_LABELS = {
  PENDING: "Pending",
  SUCCESS: "Paid",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const PAYMENT_STATUS_TONES = {
  PENDING: "amber",
  SUCCESS: "green",
  FAILED: "red",
  CANCELLED: "slate",
  REFUNDED: "slate",
};

export const REPAIR_STATUS_LABELS = {
  SUBMITTED: "Submitted",
  DIAGNOSING: "Diagnosing",
  AWAITING_CUSTOMER_APPROVAL: "Awaiting approval",
  APPROVED: "Approved",
  IN_REPAIR: "In repair",
  READY_FOR_COLLECTION: "Ready for collection",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const REPAIR_STATUS_TONES = {
  SUBMITTED: "blue",
  DIAGNOSING: "amber",
  AWAITING_CUSTOMER_APPROVAL: "amber",
  APPROVED: "blue",
  IN_REPAIR: "blue",
  READY_FOR_COLLECTION: "green",
  COMPLETED: "green",
  CANCELLED: "slate",
};

export const SERVICE_STATUS_LABELS = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  AWAITING_CUSTOMER_INFORMATION: "Awaiting information",
  QUOTED: "Quoted",
  APPROVED: "Approved",
  PROCESSING: "Processing",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const SERVICE_STATUS_TONES = {
  SUBMITTED: "blue",
  UNDER_REVIEW: "amber",
  AWAITING_CUSTOMER_INFORMATION: "amber",
  QUOTED: "amber",
  APPROVED: "blue",
  PROCESSING: "blue",
  READY: "green",
  COMPLETED: "green",
  CANCELLED: "slate",
};

export const FULFILMENT_LABELS = {
  COLLECTION: "Shop collection",
  DELIVERY: "Delivery",
};

export const REPAIR_DEVICE_TYPES = [
  "Smartphone",
  "Tablet",
  "Laptop",
  "Smart watch",
  "Other",
];

export const ALLOWED_REPAIR_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

export const MAX_REPAIR_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
