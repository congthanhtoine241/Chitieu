/**
 * ============================================================================
 * OOP CLASSES & ARRAY DATA STORE (assets/js/storage.js)
 * ============================================================================
 * Quản lý dữ liệu bằng các Class OOP (`Category`, `Transaction`, `Budget`)
 * và lưu trữ trên các mảng (`this.categories = []`, `this.transactions = []`,
 * `this.budgets = []`), đồng bộ tự động với LocalStorage của trình duyệt.
 * ============================================================================
 */

import { APP_CONFIG, DEFAULT_CATEGORIES } from './config.js';
import {
  validateTransactionInput,
  validateCategoryInput,
  validateBudgetInput
} from './utils.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const generateUuid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const normalizeError = (err) => {
  if (!err) return 'Đã xảy ra lỗi không xác định.';
  return err.userMessage || err.message || String(err);
};

// ============================================================================
// 1. OOP DOMAIN CLASSES (Category, Transaction, Budget)
// ============================================================================

export class Category {
  constructor({ id, name, type, icon = 'tag', color = '#a86632', is_default = false, created_at, updated_at }) {
    const now = new Date().toISOString();
    this.id = id && UUID_REGEX.test(id) ? id : generateUuid();
    this.name = String(name || '').trim();
    this.type = type === 'INCOME' ? 'INCOME' : 'EXPENSE';
    this.icon = icon;
    this.color = color;
    this.is_default = Boolean(is_default);
    this.created_at = created_at || now;
    this.updated_at = updated_at || now;
  }
}

export class Transaction {
  constructor({
    id,
    category_id,
    type,
    amount,
    description = '',
    payment_method = 'CASH',
    transaction_date,
    created_at,
    updated_at
  }) {
    const now = new Date().toISOString();
    this.id = id && UUID_REGEX.test(id) ? id : generateUuid();
    this.category_id = category_id;
    this.type = type === 'INCOME' ? 'INCOME' : 'EXPENSE';
    this.amount = Number(amount);
    this.description = String(description || '').trim();
    this.payment_method = payment_method;
    this.transaction_date = transaction_date;
    this.created_at = created_at || now;
    this.updated_at = updated_at || now;
  }
}

export class Budget {
  constructor({ id, category_id = null, amount, month, year, created_at, updated_at }) {
    const now = new Date().toISOString();
    this.id = id && UUID_REGEX.test(id) ? id : generateUuid();
    this.category_id = category_id || null;
    this.amount = Number(amount);
    this.month = Number(month);
    this.year = Number(year);
    this.created_at = created_at || now;
    this.updated_at = updated_at || now;
  }
}

// ============================================================================
// 2. MAIN FINANCE STORE CLASS (Array-based + LocalStorage Sync)
// ============================================================================

export class LocalFinanceStorage {
  constructor(useBrowserStorage = true) {
    this.useBrowserStorage = useBrowserStorage && typeof localStorage !== 'undefined';

    // Các mảng (Arrays) lưu trữ đối tượng trong bộ nhớ
    this.profile = { ...APP_CONFIG.DEFAULT_PROFILE };
    this.categories = [];
    this.transactions = [];
    this.budgets = [];
  }

  async init() {
    if (this.useBrowserStorage) {
      try {
        const rawData = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.DATA_STORE);
        if (rawData) {
          const parsed = JSON.parse(rawData);
          if (parsed && Array.isArray(parsed.categories) && Array.isArray(parsed.transactions)) {
            this.profile = parsed.profile || { ...APP_CONFIG.DEFAULT_PROFILE };
            this.categories = parsed.categories.map((c) => new Category(c));
            this.transactions = parsed.transactions.map((t) => new Transaction(t));
            this.budgets = Array.isArray(parsed.budgets)
              ? parsed.budgets.map((b) => new Budget(b))
              : [];
          }
        }
      } catch (_e) {
        // Bỏ qua lỗi đọc JSON, khởi tạo mảng mặc định bên dưới
      }
    }

    if (this.categories.length === 0) {
      this._seedDefaultCategories();
    }
    this._saveToDisk();
    return { mode: 'array-class-storage' };
  }

  _seedDefaultCategories() {
    this.categories = DEFAULT_CATEGORIES.map((def) => new Category(def));
  }

  _saveToDisk() {
    if (!this.useBrowserStorage) return;
    try {
      const payload = {
        profile: this.profile,
        categories: this.categories,
        transactions: this.transactions,
        budgets: this.budgets
      };
      localStorage.setItem(APP_CONFIG.STORAGE_KEYS.DATA_STORE, JSON.stringify(payload));
    } catch (_e) {
      // Ignore quota errors
    }
  }

  // --------------------------------------------------------------------------
  // PROFILE & SETTINGS
  // --------------------------------------------------------------------------
  async getProfile() {
    return { data: { ...this.profile }, error: null };
  }

  async updateProfile(patch) {
    try {
      const cleanName = String(patch.display_name ?? this.profile.display_name).trim();
      if (!cleanName) throw new Error('Tên sổ thu chi không được để trống.');

      this.profile = {
        ...this.profile,
        display_name: cleanName,
        currency: patch.currency === 'USD' ? 'USD' : 'VND',
        theme: patch.theme === 'dark' ? 'dark' : 'light',
        updated_at: new Date().toISOString()
      };
      this._saveToDisk();
      return { data: { ...this.profile }, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // --------------------------------------------------------------------------
  // CATEGORIES (Array CRUD)
  // --------------------------------------------------------------------------
  async getCategories(type = null) {
    let rows = this.categories.map((c) => ({ ...c }));
    if (type) {
      rows = rows.filter((c) => c.type === type);
    }
    rows.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    return { data: rows, error: null };
  }

  async createCategory(payload) {
    try {
      const v = validateCategoryInput(payload);
      if (!v.isValid) {
        throw new Error(Object.values(v.errors)[0]);
      }

      const duplicate = this.categories.some(
        (c) =>
          c.type === v.sanitized.type &&
          c.name.trim().toLowerCase() === v.sanitized.name.trim().toLowerCase()
      );
      if (duplicate) {
        throw new Error('Tên danh mục này đã tồn tại trong cùng nhóm Thu/Chi.');
      }

      const newCat = new Category({
        id: payload.id,
        ...v.sanitized,
        is_default: false
      });

      this.categories.push(newCat);
      this._saveToDisk();
      return { data: { ...newCat }, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async updateCategory(categoryId, patch) {
    try {
      const idx = this.categories.findIndex((c) => c.id === categoryId);
      if (idx === -1) throw new Error('Không tìm thấy danh mục.');

      const merged = { ...this.categories[idx], ...patch };
      const v = validateCategoryInput(merged);
      if (!v.isValid) throw new Error(Object.values(v.errors)[0]);

      const duplicate = this.categories.some(
        (c) =>
          c.id !== categoryId &&
          c.type === v.sanitized.type &&
          c.name.trim().toLowerCase() === v.sanitized.name.trim().toLowerCase()
      );
      if (duplicate) {
        throw new Error('Tên danh mục này đã tồn tại.');
      }

      this.categories[idx] = new Category({
        ...this.categories[idx],
        ...v.sanitized,
        updated_at: new Date().toISOString()
      });
      this._saveToDisk();
      return { data: { ...this.categories[idx] }, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async deleteCategory(categoryId, reassignToCategoryId = null) {
    try {
      const idx = this.categories.findIndex((c) => c.id === categoryId);
      if (idx === -1) throw new Error('Không tìm thấy danh mục.');

      if (reassignToCategoryId) {
        const targetCat = this.categories.find((c) => c.id === reassignToCategoryId);
        if (!targetCat) throw new Error('Danh mục chuyển tiếp không tồn tại.');
        this.transactions.forEach((tx) => {
          if (tx.category_id === categoryId) {
            tx.category_id = reassignToCategoryId;
          }
        });
      }

      const referencedCount = this.transactions.filter((t) => t.category_id === categoryId).length;
      if (referencedCount > 0) {
        throw new Error(
          `Không thể xóa danh mục này vì đang có ${referencedCount} giao dịch tham chiếu. Vui lòng chuyển hoặc xóa các giao dịch liên quan trước.`
        );
      }

      this.budgets = this.budgets.filter((b) => b.category_id !== categoryId);
      const [deleted] = this.categories.splice(idx, 1);
      this._saveToDisk();
      return { data: deleted, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // --------------------------------------------------------------------------
  // TRANSACTIONS (Array CRUD)
  // --------------------------------------------------------------------------
  async getTransactions(options = {}) {
    const {
      type = '',
      category_id = '',
      payment_method = '',
      fromDate = '',
      toDate = '',
      search = '',
      sortBy = 'transaction_date',
      ascending = false,
      page = 1,
      limit = APP_CONFIG.PAGE_SIZE
    } = options;

    const catMap = new Map(this.categories.map((c) => [c.id, { ...c }]));
    let rows = this.transactions.map((tx) => ({
      ...tx,
      category: catMap.get(tx.category_id) || null
    }));

    if (type) rows = rows.filter((r) => r.type === type);
    if (category_id) rows = rows.filter((r) => r.category_id === category_id);
    if (payment_method) rows = rows.filter((r) => r.payment_method === payment_method);
    if (fromDate) rows = rows.filter((r) => r.transaction_date >= fromDate);
    if (toDate) rows = rows.filter((r) => r.transaction_date <= toDate);
    if (search) {
      const q = String(search).trim().toLowerCase();
      if (q) {
        rows = rows.filter((r) => String(r.description || '').toLowerCase().includes(q));
      }
    }

    rows.sort((a, b) => {
      if (a[sortBy] < b[sortBy]) return ascending ? -1 : 1;
      if (a[sortBy] > b[sortBy]) return ascending ? 1 : -1;
      return String(b.created_at).localeCompare(String(a.created_at));
    });

    const totalCount = rows.length;
    const offset = Math.max(0, (page - 1) * limit);
    const paged = rows.slice(offset, offset + limit);

    return { data: paged, count: totalCount, error: null };
  }

  async createTransaction(payload) {
    try {
      const v = validateTransactionInput(payload);
      if (!v.isValid) {
        throw new Error(Object.values(v.errors)[0]);
      }

      const cat = this.categories.find((c) => c.id === v.sanitized.category_id);
      if (!cat) {
        throw new Error('Danh mục đã chọn không tồn tại.');
      }
      if (cat.type !== v.sanitized.type) {
        throw new Error('Loại giao dịch (Thu/Chi) không khớp với loại danh mục đã chọn.');
      }

      const newTx = new Transaction({
        id: payload.id,
        ...v.sanitized
      });

      this.transactions.push(newTx);
      this._saveToDisk();
      return { data: { ...newTx, category: { ...cat } }, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async updateTransaction(transactionId, patch) {
    try {
      const idx = this.transactions.findIndex((t) => t.id === transactionId);
      if (idx === -1) throw new Error('Không tìm thấy giao dịch cần sửa.');

      const merged = { ...this.transactions[idx], ...patch };
      const v = validateTransactionInput(merged);
      if (!v.isValid) throw new Error(Object.values(v.errors)[0]);

      const cat = this.categories.find((c) => c.id === v.sanitized.category_id);
      if (!cat) throw new Error('Danh mục đã chọn không tồn tại.');
      if (cat.type !== v.sanitized.type) {
        throw new Error('Loại giao dịch (Thu/Chi) không khớp với loại danh mục đã chọn.');
      }

      this.transactions[idx] = new Transaction({
        ...this.transactions[idx],
        ...v.sanitized,
        updated_at: new Date().toISOString()
      });
      this._saveToDisk();
      return {
        data: { ...this.transactions[idx], category: { ...cat } },
        error: null
      };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async deleteTransaction(transactionId) {
    try {
      const idx = this.transactions.findIndex((t) => t.id === transactionId);
      if (idx === -1) throw new Error('Không tìm thấy giao dịch cần xóa.');

      const [deleted] = this.transactions.splice(idx, 1);
      this._saveToDisk();
      return { data: deleted, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // --------------------------------------------------------------------------
  // BUDGETS (Array CRUD)
  // --------------------------------------------------------------------------
  async getBudgets(month, year) {
    const catMap = new Map(this.categories.map((c) => [c.id, { ...c }]));
    let rows = this.budgets.map((b) => ({
      ...b,
      category: b.category_id ? catMap.get(b.category_id) || null : null
    }));

    if (month) rows = rows.filter((b) => b.month === Number(month));
    if (year) rows = rows.filter((b) => b.year === Number(year));

    return { data: rows, error: null };
  }

  async createBudget(payload) {
    try {
      const v = validateBudgetInput(payload);
      if (!v.isValid) throw new Error(Object.values(v.errors)[0]);

      if (v.sanitized.category_id !== null) {
        const cat = this.categories.find((c) => c.id === v.sanitized.category_id);
        if (!cat || cat.type !== 'EXPENSE') {
          throw new Error('Ngân sách chi tiêu chỉ áp dụng cho danh mục loại Chi tiêu (EXPENSE).');
        }
      }

      const duplicate = this.budgets.some(
        (b) =>
          b.month === v.sanitized.month &&
          b.year === v.sanitized.year &&
          (b.category_id || null) === v.sanitized.category_id
      );
      if (duplicate) {
        throw new Error('Ngân sách cho hạng mục này trong tháng đã tồn tại.');
      }

      const newBudget = new Budget({
        id: payload.id,
        ...v.sanitized
      });

      this.budgets.push(newBudget);
      this._saveToDisk();
      return { data: { ...newBudget }, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async updateBudget(budgetId, patch) {
    try {
      const idx = this.budgets.findIndex((b) => b.id === budgetId);
      if (idx === -1) throw new Error('Không tìm thấy ngân sách cần sửa.');

      const merged = { ...this.budgets[idx], ...patch };
      const v = validateBudgetInput(merged);
      if (!v.isValid) throw new Error(Object.values(v.errors)[0]);

      const duplicate = this.budgets.some(
        (b) =>
          b.id !== budgetId &&
          b.month === v.sanitized.month &&
          b.year === v.sanitized.year &&
          (b.category_id || null) === v.sanitized.category_id
      );
      if (duplicate) {
        throw new Error('Ngân sách cho hạng mục này trong tháng đã tồn tại.');
      }

      this.budgets[idx] = new Budget({
        ...this.budgets[idx],
        ...v.sanitized,
        updated_at: new Date().toISOString()
      });
      this._saveToDisk();
      return { data: { ...this.budgets[idx] }, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async deleteBudget(budgetId) {
    try {
      const idx = this.budgets.findIndex((b) => b.id === budgetId);
      if (idx === -1) throw new Error('Không tìm thấy ngân sách cần xóa.');

      const [deleted] = this.budgets.splice(idx, 1);
      this._saveToDisk();
      return { data: deleted, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // --------------------------------------------------------------------------
  // BACKUP (EXPORT JSON) & RESTORE (IMPORT JSON)
  // --------------------------------------------------------------------------
  exportBackupData() {
    return JSON.stringify(
      {
        app: 'SoThuChiCaNhan',
        version: 1,
        exported_at: new Date().toISOString(),
        data: {
          profile: this.profile,
          categories: this.categories,
          transactions: this.transactions,
          budgets: this.budgets
        }
      },
      null,
      2
    );
  }

  importBackupData(jsonString) {
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (_e) {
      throw new Error('Tệp sao lưu không đúng định dạng JSON.');
    }

    const dataObj = parsed?.data || parsed;
    if (!dataObj || !Array.isArray(dataObj.categories) || !Array.isArray(dataObj.transactions)) {
      throw new Error('Tệp sao lưu thiếu mảng danh mục hoặc giao dịch.');
    }

    this.profile = dataObj.profile || this.profile;
    this.categories = dataObj.categories.map((c) => new Category(c));
    this.transactions = dataObj.transactions.map((t) => new Transaction(t));
    this.budgets = Array.isArray(dataObj.budgets)
      ? dataObj.budgets.map((b) => new Budget(b))
      : [];
    this._saveToDisk();

    return {
      categoriesCount: this.categories.length,
      transactionsCount: this.transactions.length,
      budgetsCount: this.budgets.length
    };
  }

  resetAllData() {
    this.profile = { ...APP_CONFIG.DEFAULT_PROFILE };
    this._seedDefaultCategories();
    this.transactions = [];
    this.budgets = [];
    this._saveToDisk();
    return true;
  }
}

export const dbService = new LocalFinanceStorage(true);
