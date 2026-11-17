/**
 * ============================================================================
 * TRANSACTION MANAGEMENT MODULE - CRUD, FILTER, SORT, PAGINATION (transactions.js)
 * ============================================================================
 */

import { dbService, normalizeError } from './storage.js';
import { APP_CONFIG, PAYMENT_METHODS } from './config.js';
import {
  escapeHtml,
  formatCurrency,
  formatDateVN,
  getTodayISO,
  getPaymentMethodLabel,
  validateTransactionInput,
  showToast
} from './utils.js';

export class TransactionsController {
  constructor(onDataChanged) {
    this.onDataChanged = onDataChanged;
    this.categories = [];
    this.currency = 'VND';
    this.filters = {
      search: '',
      type: '',
      category_id: '',
      payment_method: '',
      fromDate: '',
      toDate: '',
      sortBy: 'transaction_date',
      ascending: false,
      page: 1,
      limit: APP_CONFIG.PAGE_SIZE
    };
    this.totalCount = 0;
    this.currentRows = [];
    this.editingId = null;
    this.isSubmitting = false;
  }

  init() {
    this._bindEvents();
  }

  setCurrency(currency) {
    this.currency = currency || 'VND';
  }

  _bindEvents() {
    // Open "Add Transaction" modal buttons
    document.getElementById('btn-open-tx-modal')?.addEventListener('click', () => {
      this.openModal(null);
    });
    document.getElementById('btn-topbar-quick-tx')?.addEventListener('click', () => {
      this.openModal(null);
    });

    // Modal close buttons
    document.getElementById('btn-close-tx-modal')?.addEventListener('click', () => {
      this.closeModal();
    });
    document.getElementById('btn-cancel-tx-modal')?.addEventListener('click', () => {
      this.closeModal();
    });

    // When transaction type changes in modal, filter category dropdown
    document.getElementById('tx-type')?.addEventListener('change', (e) => {
      this._populateModalCategoryOptions(e.target.value);
    });

    // Submit Transaction Form
    document.getElementById('tx-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSaveTransaction();
    });

    // Filter controls
    const searchInput = document.getElementById('tx-filter-search');
    let debounceTimer = null;
    searchInput?.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.filters.search = e.target.value;
        this.filters.page = 1;
        this.loadTransactions();
      }, 220);
    });

    document.getElementById('tx-filter-type')?.addEventListener('change', (e) => {
      this.filters.type = e.target.value;
      this.filters.page = 1;
      this.loadTransactions();
    });

    document.getElementById('tx-filter-category')?.addEventListener('change', (e) => {
      this.filters.category_id = e.target.value;
      this.filters.page = 1;
      this.loadTransactions();
    });

    document.getElementById('tx-filter-method')?.addEventListener('change', (e) => {
      this.filters.payment_method = e.target.value;
      this.filters.page = 1;
      this.loadTransactions();
    });

    document.getElementById('tx-filter-from')?.addEventListener('change', (e) => {
      this.filters.fromDate = e.target.value;
      this.filters.page = 1;
      this.loadTransactions();
    });

    document.getElementById('tx-filter-to')?.addEventListener('change', (e) => {
      this.filters.toDate = e.target.value;
      this.filters.page = 1;
      this.loadTransactions();
    });

    document.getElementById('tx-filter-sort')?.addEventListener('change', (e) => {
      const [col, dir] = e.target.value.split(':');
      this.filters.sortBy = col;
      this.filters.ascending = dir === 'asc';
      this.filters.page = 1;
      this.loadTransactions();
    });

    document.getElementById('btn-tx-reset-filters')?.addEventListener('click', () => {
      this.resetFilters();
    });

    // Pagination buttons
    document.getElementById('btn-tx-prev-page')?.addEventListener('click', () => {
      if (this.filters.page > 1) {
        this.filters.page -= 1;
        this.loadTransactions();
      }
    });

    document.getElementById('btn-tx-next-page')?.addEventListener('click', () => {
      const maxPage = Math.max(1, Math.ceil(this.totalCount / this.filters.limit));
      if (this.filters.page < maxPage) {
        this.filters.page += 1;
        this.loadTransactions();
      }
    });

    // Delegate Edit / Delete actions on transaction table
    document.getElementById('tx-table-body')?.addEventListener('click', (e) => {
      const editBtn = e.target.closest('[data-tx-edit]');
      if (editBtn) {
        const id = editBtn.getAttribute('data-tx-edit');
        const found = this.currentRows.find((r) => r.id === id);
        if (found) this.openModal(found);
        return;
      }

      const deleteBtn = e.target.closest('[data-tx-delete]');
      if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-tx-delete');
        const found = this.currentRows.find((r) => r.id === id);
        if (found) this.confirmDeleteTransaction(found);
      }
    });
  }

  async refreshCategoriesAndLoad() {
    const { data: cats } = await dbService.getCategories();
    this.categories = cats || [];
    this._populateFilterCategoryDropdown();
    await this.loadTransactions();
  }

  _populateFilterCategoryDropdown() {
    const select = document.getElementById('tx-filter-category');
    if (!select) return;
    const currentVal = select.value;
    const options = ['<option value="">Tất cả danh mục</option>'];
    for (const c of this.categories) {
      const prefix = c.type === 'INCOME' ? '[Thu]' : '[Chi]';
      options.push(
        `<option value="${escapeHtml(c.id)}">${prefix} ${escapeHtml(c.name)}</option>`
      );
    }
    select.innerHTML = options.join('');
    select.value = currentVal;
  }

  _populateModalCategoryOptions(type = 'EXPENSE', selectedId = '') {
    const select = document.getElementById('tx-category');
    if (!select) return;
    const filtered = this.categories.filter((c) => c.type === type);
    if (filtered.length === 0) {
      select.innerHTML = '<option value="">-- Chưa có danh mục --</option>';
      return;
    }
    select.innerHTML = filtered
      .map(
        (c) =>
          `<option value="${escapeHtml(c.id)}" ${c.id === selectedId ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
      )
      .join('');
  }

  resetFilters() {
    this.filters = {
      search: '',
      type: '',
      category_id: '',
      payment_method: '',
      fromDate: '',
      toDate: '',
      sortBy: 'transaction_date',
      ascending: false,
      page: 1,
      limit: APP_CONFIG.PAGE_SIZE
    };
    const ids = ['tx-filter-search', 'tx-filter-type', 'tx-filter-category', 'tx-filter-method', 'tx-filter-from', 'tx-filter-to'];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const sortEl = document.getElementById('tx-filter-sort');
    if (sortEl) sortEl.value = 'transaction_date:desc';
    this.loadTransactions();
  }

  async loadTransactions() {
    const tbody = document.getElementById('tx-table-body');
    if (!tbody) return;

    const { data, count, error } = await dbService.getTransactions(this.filters);
    if (error) {
      showToast(normalizeError(error), 'error');
      return;
    }

    this.currentRows = data || [];
    this.totalCount = count || 0;
    this._renderTable();
    this._renderPagination();
  }

  _renderTable() {
    const tbody = document.getElementById('tx-table-body');
    if (!tbody) return;

    if (this.currentRows.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">
            Không tìm thấy giao dịch nào khớp với bộ lọc hiện tại.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.currentRows
      .map((tx) => {
        const isIncome = tx.type === 'INCOME';
        const sign = isIncome ? '+' : '-';
        const amountClass = isIncome ? 'income' : 'expense';
        const badgeClass = isIncome ? 'badge-income' : 'badge-expense';
        const badgeLabel = isIncome ? 'Thu nhập' : 'Chi tiêu';
        const catName = tx.category?.name || 'Danh mục';
        const catColor = tx.category?.color || '#a86632';

        return `
          <tr>
            <td class="mono-value">${formatDateVN(tx.transaction_date)}</td>
            <td>
              <span class="badge ${badgeClass}">${badgeLabel}</span>
            </td>
            <td>
              <span class="category-chip">
                <span class="category-dot" style="background:${escapeHtml(catColor)}"></span>
                ${escapeHtml(catName)}
              </span>
            </td>
            <td>${escapeHtml(tx.description || '(Không có mô tả)')}</td>
            <td>${escapeHtml(getPaymentMethodLabel(tx.payment_method))}</td>
            <td class="text-right mono-value kpi-value ${amountClass}" style="font-size:0.98rem;">
              ${sign}${formatCurrency(tx.amount, this.currency)}
            </td>
            <td class="text-right">
              <button type="button" class="btn btn-secondary btn-sm" data-tx-edit="${escapeHtml(tx.id)}" aria-label="Sửa giao dịch">Sửa</button>
              <button type="button" class="btn btn-danger btn-sm" data-tx-delete="${escapeHtml(tx.id)}" aria-label="Xóa giao dịch">Xóa</button>
            </td>
          </tr>
        `;
      })
      .join('');
  }

  _renderPagination() {
    const infoEl = document.getElementById('tx-pagination-info');
    const prevBtn = document.getElementById('btn-tx-prev-page');
    const nextBtn = document.getElementById('btn-tx-next-page');

    const maxPage = Math.max(1, Math.ceil(this.totalCount / this.filters.limit));
    const startIdx = this.totalCount === 0 ? 0 : (this.filters.page - 1) * this.filters.limit + 1;
    const endIdx = Math.min(this.totalCount, this.filters.page * this.filters.limit);

    if (infoEl) {
      infoEl.textContent = `Hiển thị ${startIdx}–${endIdx} trên tổng số ${this.totalCount} giao dịch (Trang ${this.filters.page}/${maxPage})`;
    }
    if (prevBtn) prevBtn.disabled = this.filters.page <= 1;
    if (nextBtn) nextBtn.disabled = this.filters.page >= maxPage;
  }

  openModal(tx = null) {
    this.editingId = tx ? tx.id : null;
    this._clearModalErrors();

    const modal = document.getElementById('tx-modal');
    const title = document.getElementById('tx-modal-title');
    const typeEl = document.getElementById('tx-type');
    const amountEl = document.getElementById('tx-amount');
    const dateEl = document.getElementById('tx-date');
    const methodEl = document.getElementById('tx-method');
    const descEl = document.getElementById('tx-description');

    if (title) {
      title.textContent = tx ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch mới';
    }

    const typeVal = tx ? tx.type : 'EXPENSE';
    if (typeEl) typeEl.value = typeVal;
    this._populateModalCategoryOptions(typeVal, tx?.category_id || '');

    if (amountEl) amountEl.value = tx ? String(tx.amount) : '';
    if (dateEl) dateEl.value = tx ? tx.transaction_date : getTodayISO();
    if (methodEl) methodEl.value = tx ? tx.payment_method : 'CASH';
    if (descEl) descEl.value = tx ? tx.description : '';

    if (modal && typeof modal.showModal === 'function') {
      modal.showModal();
    }
  }

  closeModal() {
    const modal = document.getElementById('tx-modal');
    if (modal && modal.open) {
      modal.close();
    }
  }

  _clearModalErrors() {
    const summary = document.getElementById('tx-error-summary');
    if (summary) {
      summary.classList.add('hidden');
      summary.textContent = '';
    }
    ['amount', 'category_id', 'transaction_date', 'description'].forEach((f) => {
      const errEl = document.getElementById(`tx-${f}-error`);
      if (errEl) errEl.textContent = '';
    });
  }

  async handleSaveTransaction() {
    if (this.isSubmitting) return;
    this._clearModalErrors();

    const payload = {
      type: document.getElementById('tx-type')?.value || 'EXPENSE',
      amount: document.getElementById('tx-amount')?.value || '',
      category_id: document.getElementById('tx-category')?.value || '',
      transaction_date: document.getElementById('tx-date')?.value || '',
      payment_method: document.getElementById('tx-method')?.value || 'CASH',
      description: document.getElementById('tx-description')?.value || ''
    };

    const validation = validateTransactionInput(payload);
    if (!validation.isValid) {
      for (const [field, msg] of Object.entries(validation.errors)) {
        const errEl = document.getElementById(`tx-${field}-error`);
        if (errEl) errEl.textContent = msg;
      }
      const summary = document.getElementById('tx-error-summary');
      if (summary) {
        summary.textContent = Object.values(validation.errors)[0];
        summary.classList.remove('hidden');
      }
      return;
    }

    const submitBtn = document.getElementById('btn-save-tx');
    this.isSubmitting = true;
    if (submitBtn) submitBtn.disabled = true;

    try {
      let res;
      if (this.editingId) {
        res = await dbService.updateTransaction(this.editingId, validation.sanitized);
      } else {
        res = await dbService.createTransaction(validation.sanitized);
      }

      if (res.error) throw res.error;

      showToast(
        this.editingId ? 'Đã cập nhật giao dịch thành công!' : 'Đã thêm giao dịch mới!',
        'success'
      );
      this.closeModal();
      await this.loadTransactions();
      if (typeof this.onDataChanged === 'function') {
        await this.onDataChanged();
      }
    } catch (err) {
      const msg = normalizeError(err);
      const summary = document.getElementById('tx-error-summary');
      if (summary) {
        summary.textContent = msg;
        summary.classList.remove('hidden');
      }
      showToast(msg, 'error');
    } finally {
      this.isSubmitting = false;
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  confirmDeleteTransaction(tx) {
    const dialog = document.getElementById('confirm-modal');
    const msgEl = document.getElementById('confirm-modal-message');
    const confirmBtn = document.getElementById('btn-confirm-accept');
    const cancelBtn = document.getElementById('btn-confirm-cancel');

    if (!dialog || !confirmBtn) return;

    if (msgEl) {
      msgEl.textContent = `Bạn có chắc chắn muốn xóa giao dịch "${tx.description || formatCurrency(tx.amount, this.currency)}" ngày ${formatDateVN(tx.transaction_date)} không? Hành động này không thể hoàn tác.`;
    }

    const cleanup = () => {
      if (dialog.open) dialog.close();
      confirmBtn.onclick = null;
      cancelBtn.onclick = null;
    };

    cancelBtn.onclick = cleanup;
    confirmBtn.onclick = async () => {
      confirmBtn.disabled = true;
      try {
        const { error } = await dbService.deleteTransaction(tx.id);
        if (error) throw error;
        showToast('Đã xóa giao dịch.', 'success');
        cleanup();
        await this.loadTransactions();
        if (typeof this.onDataChanged === 'function') {
          await this.onDataChanged();
        }
      } catch (err) {
        showToast(normalizeError(err), 'error');
      } finally {
        confirmBtn.disabled = false;
      }
    };

    dialog.showModal();
  }
}
