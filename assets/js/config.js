/**
 * ============================================================================
 * CẤU HÌNH ỨNG DỤNG SỔ THU CHI (assets/js/config.js)
 * ============================================================================
 */

export const APP_CONFIG = {
  STORAGE_KEYS: {
    DATA_STORE: 'chitieu_local_data_v1',
    THEME: 'chitieu_theme'
  },

  DEFAULT_PROFILE: {
    display_name: 'Sổ Thu Chi Của Tôi',
    currency: 'VND',
    theme: 'light'
  },

  DEFAULT_CURRENCY: 'VND',
  DEFAULT_THEME: 'light',
  PAGE_SIZE: 10,

  BUDGET_THRESHOLDS: {
    WARNING: 80, // Cảnh báo vàng khi đạt 80% ngân sách
    DANGER: 100  // Cảnh báo đỏ khi đạt hoặc vượt 100% ngân sách
  }
};

export const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Tiền mặt' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng' },
  { value: 'CARD', label: 'Thẻ tín dụng / Ghi nợ' },
  { value: 'E_WALLET', label: 'Ví điện tử (MoMo, ZaloPay...)' },
  { value: 'OTHER', label: 'Phương thức khác' }
];

export const DEFAULT_CATEGORIES = [
  // 5 Danh mục Thu nhập mặc định
  { name: 'Lương (Salary)', type: 'INCOME', icon: 'briefcase', color: '#1b6b4c', is_default: true },
  { name: 'Thưởng (Bonus)', type: 'INCOME', icon: 'award', color: '#2d8a65', is_default: true },
  { name: 'Kinh doanh (Business)', type: 'INCOME', icon: 'store', color: '#3b7a57', is_default: true },
  { name: 'Đầu tư (Investment)', type: 'INCOME', icon: 'trending-up', color: '#0f766e', is_default: true },
  { name: 'Thu nhập khác (Other)', type: 'INCOME', icon: 'plus-circle', color: '#4d7c0f', is_default: true },

  // 10 Danh mục Chi tiêu mặc định
  { name: 'Ăn uống (Food & Drinks)', type: 'EXPENSE', icon: 'utensils', color: '#a86632', is_default: true },
  { name: 'Di chuyển (Transport)', type: 'EXPENSE', icon: 'car', color: '#b45309', is_default: true },
  { name: 'Mua sắm (Shopping)', type: 'EXPENSE', icon: 'shopping-bag', color: '#9a3412', is_default: true },
  { name: 'Giải trí (Entertainment)', type: 'EXPENSE', icon: 'film', color: '#7c2d12', is_default: true },
  { name: 'Giáo dục (Education)', type: 'EXPENSE', icon: 'book-open', color: '#1d4ed8', is_default: true },
  { name: 'Y tế (Healthcare)', type: 'EXPENSE', icon: 'heart-pulse', color: '#be123c', is_default: true },
  { name: 'Nhà ở (Housing)', type: 'EXPENSE', icon: 'home', color: '#6d4c41', is_default: true },
  { name: 'Hóa đơn (Bills)', type: 'EXPENSE', icon: 'receipt', color: '#c2410c', is_default: true },
  { name: 'Chi tiêu cá nhân', type: 'EXPENSE', icon: 'user', color: '#7e22ce', is_default: true },
  { name: 'Chi tiêu khác (Other)', type: 'EXPENSE', icon: 'more-horizontal', color: '#57534e', is_default: true }
];

export const CATEGORY_ICONS = [
  'utensils', 'car', 'shopping-bag', 'film', 'book-open',
  'heart-pulse', 'home', 'receipt', 'user', 'briefcase',
  'award', 'store', 'trending-up', 'plus-circle', 'coffee',
  'gift', 'plane', 'smartphone', 'shield', 'more-horizontal'
];
