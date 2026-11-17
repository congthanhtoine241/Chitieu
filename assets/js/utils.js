/**
 * ============================================================================
 * FINANCIAL ARITHMETIC, VALIDATION, SANITIZATION & UI HELPERS (assets/js/utils.js)
 * ============================================================================
 * Rules applied:
 * 1. Exact integer/BigInt arithmetic for VND currency — never float addition.
 * 2. Strict HTML escaping to prevent XSS when rendering user content.
 * 3. Comprehensive input validation returning structured field errors.
 * ============================================================================
 */

import { PAYMENT_METHODS, APP_CONFIG } from './config.js';

/**
 * Escapes untrusted strings before inserting into HTML templates.
 * Prevents Stored & Reflected XSS attacks.
 */
export const escapeHtml = (rawValue) => {
  if (rawValue === null || rawValue === undefined) return '';
  return String(rawValue)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Parses and validates an amount into an exact integer (VND).
 * Rejects NaN, floats with fractional cents, negative numbers, zero, or unsafe integers.
 */
export const parseExactAmount = (rawInput) => {
  if (typeof rawInput === 'bigint') {
    const num = Number(rawInput);
    return Number.isSafeInteger(num) && num > 0 ? num : null;
  }

  if (typeof rawInput === 'number') {
    if (!Number.isFinite(rawInput) || !Number.isInteger(rawInput) || rawInput <= 0) {
      return null;
    }
    return Number.isSafeInteger(rawInput) ? rawInput : null;
  }

  if (typeof rawInput === 'string') {
    const cleaned = rawInput.trim().replace(/[,\s.]/g, '');
    if (!/^\d+$/.test(cleaned)) {
      return null;
    }
    const parsed = Number(cleaned);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
      return null;
    }
    return parsed;
  }

  return null;
};

/**
 * Exact integer addition using BigInt intermediate accumulation to eliminate
 * IEEE-754 floating-point precision drift across large transaction sets.
 */
export const sumExactAmounts = (items, selector = (x) => x) => {
  if (!Array.isArray(items) || items.length === 0) return 0;
  let total = 0n;
  for (const item of items) {
    const raw = selector(item);
    const val = typeof raw === 'number' ? Math.trunc(raw) : parseInt(String(raw || '0'), 10);
    if (!Number.isNaN(val)) {
      total += BigInt(val);
    }
  }
  return Number(total);
};

/**
 * Calculates exact percentage with 1 decimal place using integer scaling (x1000).
 */
export const calculateUsagePercent = (spentAmount, budgetAmount) => {
  const spent = BigInt(Math.max(0, Math.trunc(Number(spentAmount) || 0)));
  const budget = BigInt(Math.max(0, Math.trunc(Number(budgetAmount) || 0)));
  if (budget <= 0n) return 0;
  const permille = Number((spent * 1000n) / budget);
  return permille / 10;
};

/**
 * Determines budget status level ('safe' | 'warning' | 'danger') based on thresholds.
 */
export const getBudgetStatus = (spentAmount, budgetAmount) => {
  const percent = calculateUsagePercent(spentAmount, budgetAmount);
  if (percent >= APP_CONFIG.BUDGET_THRESHOLDS.DANGER) {
    return {
      level: 'danger',
      percent,
      label: 'Vượt ngân sách (≥ 100%)',
      message: `Cảnh báo đỏ: Đã chi ${percent.toFixed(1)}% ngân sách!`
    };
  }
  if (percent >= APP_CONFIG.BUDGET_THRESHOLDS.WARNING) {
    return {
      level: 'warning',
      percent,
      label: 'Sắp chạm trần (≥ 80%)',
      message: `Cảnh báo: Đã sử dụng ${percent.toFixed(1)}% ngân sách.`
    };
  }
  return {
    level: 'safe',
    percent,
    label: 'Trong hạn mức',
    message: `An toàn (${percent.toFixed(1)}%)`
  };
};

/**
 * Formats integer amount into Vietnamese Dong (VND) or USD string.
 */
export const formatCurrency = (amount, currency = 'VND') => {
  const safeInt = Math.trunc(Number(amount) || 0);
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(safeInt);
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(safeInt);
};

/**
 * Formats YYYY-MM-DD date string into Vietnamese DD/MM/YYYY.
 */
export const formatDateVN = (isoDateStr) => {
  if (!isoDateStr) return '';
  const parts = String(isoDateStr).slice(0, 10).split('-');
  if (parts.length !== 3) return escapeHtml(isoDateStr);
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

/**
 * Returns today's date in YYYY-MM-DD local format.
 */
export const getTodayISO = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Computes { fromDate, toDate, label } for Dashboard and Reports date filters.
 */
export const getDateRangeForFilter = (filterType, customFrom = '', customTo = '', referenceDate = new Date()) => {
  const ref = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const toISO = (dt) => {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  switch (filterType) {
    case 'today': {
      const today = toISO(ref);
      return { fromDate: today, toDate: today, label: `Hôm nay (${formatDateVN(today)})` };
    }
    case 'week': {
      const dayOfWeek = ref.getDay(); // 0 (Sun) .. 6 (Sat)
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(ref);
      monday.setDate(ref.getDate() + diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return {
        fromDate: toISO(monday),
        toDate: toISO(sunday),
        label: `Tuần này (${formatDateVN(toISO(monday))} - ${formatDateVN(toISO(sunday))})`
      };
    }
    case 'last_month': {
      const firstDay = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
      const lastDay = new Date(ref.getFullYear(), ref.getMonth(), 0);
      return {
        fromDate: toISO(firstDay),
        toDate: toISO(lastDay),
        label: `Tháng trước (${firstDay.getMonth() + 1}/${firstDay.getFullYear()})`
      };
    }
    case 'year': {
      const firstDay = new Date(ref.getFullYear(), 0, 1);
      const lastDay = new Date(ref.getFullYear(), 11, 31);
      return {
        fromDate: toISO(firstDay),
        toDate: toISO(lastDay),
        label: `Năm nay (${ref.getFullYear()})`
      };
    }
    case 'custom': {
      const from = customFrom || toISO(new Date(ref.getFullYear(), ref.getMonth(), 1));
      const to = customTo || toISO(ref);
      return {
        fromDate: from <= to ? from : to,
        toDate: from <= to ? to : from,
        label: `Tùy chỉnh (${formatDateVN(from)} - ${formatDateVN(to)})`
      };
    }
    case 'month':
    default: {
      const firstDay = new Date(ref.getFullYear(), ref.getMonth(), 1);
      const lastDay = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
      return {
        fromDate: toISO(firstDay),
        toDate: toISO(lastDay),
        label: `Tháng này (${ref.getMonth() + 1}/${ref.getFullYear()})`
      };
    }
  }
};

export const getPaymentMethodLabel = (methodValue) => {
  const found = PAYMENT_METHODS.find((m) => m.value === methodValue);
  return found ? found.label : methodValue;
};

/**
 * Validates transaction creation/update payload.
 */
export const validateTransactionInput = (payload) => {
  const errors = {};
  const validTypes = ['INCOME', 'EXPENSE'];
  const validMethods = PAYMENT_METHODS.map((m) => m.value);

  if (!payload || !validTypes.includes(payload.type)) {
    errors.type = 'Loại giao dịch phải là Thu nhập (INCOME) hoặc Chi tiêu (EXPENSE).';
  }

  const parsedAmount = parseExactAmount(payload?.amount);
  if (parsedAmount === null) {
    errors.amount = 'Số tiền phải là số nguyên dương hợp lệ (lớn hơn 0 VND).';
  } else if (parsedAmount > 100_000_000_000_000) {
    errors.amount = 'Số tiền vượt quá giới hạn cho phép.';
  }

  if (!payload?.category_id || String(payload.category_id).trim() === '') {
    errors.category_id = 'Vui lòng chọn danh mục cho giao dịch.';
  }

  if (!payload?.transaction_date || !/^\d{4}-\d{2}-\d{2}$/.test(String(payload.transaction_date))) {
    errors.transaction_date = 'Ngày giao dịch không hợp lệ (định dạng YYYY-MM-DD).';
  }

  if (!payload?.payment_method || !validMethods.includes(payload.payment_method)) {
    errors.payment_method = 'Phương thức thanh toán không hợp lệ.';
  }

  const desc = String(payload?.description ?? '').trim();
  if (desc.length > 500) {
    errors.description = 'Mô tả giao dịch không được vượt quá 500 ký tự.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      type: payload?.type,
      amount: parsedAmount,
      category_id: String(payload?.category_id || '').trim(),
      transaction_date: String(payload?.transaction_date || '').trim(),
      payment_method: payload?.payment_method || 'CASH',
      description: desc
    }
  };
};

/**
 * Validates category creation/update payload.
 */
export const validateCategoryInput = (payload) => {
  const errors = {};
  const name = String(payload?.name ?? '').trim();
  if (!name) {
    errors.name = 'Tên danh mục không được để trống.';
  } else if (name.length > 80) {
    errors.name = 'Tên danh mục không được vượt quá 80 ký tự.';
  }

  if (!['INCOME', 'EXPENSE'].includes(payload?.type)) {
    errors.type = 'Loại danh mục phải là Thu nhập (INCOME) hoặc Chi tiêu (EXPENSE).';
  }

  const color = String(payload?.color ?? '#a86632').trim();
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
    errors.color = 'Màu sắc phải ở định dạng mã HEX hợp lệ (ví dụ: #a86632).';
  }

  const icon = String(payload?.icon ?? 'tag').trim() || 'tag';

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      name,
      type: payload?.type,
      color,
      icon
    }
  };
};

/**
 * Validates monthly budget payload.
 */
export const validateBudgetInput = (payload) => {
  const errors = {};
  const parsedAmount = parseExactAmount(payload?.amount);
  if (parsedAmount === null) {
    errors.amount = 'Hạn mức ngân sách phải là số nguyên dương lớn hơn 0 VND.';
  }

  const month = Number(payload?.month);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    errors.month = 'Tháng ngân sách phải từ 1 đến 12.';
  }

  const year = Number(payload?.year);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    errors.year = 'Năm ngân sách phải từ 2000 đến 2100.';
  }

  const categoryId = payload?.category_id ? String(payload.category_id).trim() : null;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      amount: parsedAmount,
      month,
      year,
      category_id: categoryId || null
    }
  };
};

/**
 * Validates authentication input (login / register / reset).
 */
export const validateAuthInput = ({ email, password, displayName, mode = 'login' }) => {
  const errors = {};
  const cleanEmail = String(email ?? '').trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    errors.email = 'Vui lòng nhập địa chỉ email hợp lệ.';
  }

  if (mode !== 'reset') {
    const rawPass = String(password ?? '');
    if (rawPass.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
    }
  }

  if (mode === 'register') {
    const cleanName = String(displayName ?? '').trim();
    if (!cleanName) {
      errors.displayName = 'Vui lòng nhập tên hiển thị của bạn.';
    } else if (cleanName.length > 100) {
      errors.displayName = 'Tên hiển thị không quá 100 ký tự.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      email: cleanEmail,
      password: String(password ?? ''),
      displayName: String(displayName ?? '').trim()
    }
  };
};

/**
 * Displays a non-blocking Toast notification in the browser UI.
 */
export const showToast = (message, type = 'info') => {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

  const textSpan = document.createElement('span');
  textSpan.textContent = message;

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'btn-ghost btn-sm';
  closeBtn.setAttribute('aria-label', 'Đóng thông báo');
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', () => toast.remove());

  toast.appendChild(textSpan);
  toast.appendChild(closeBtn);
  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 4200);
};
