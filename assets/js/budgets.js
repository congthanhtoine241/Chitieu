/**
 * ============================================================================
 * BUDGET MANAGEMENT MODULE (assets/js/budgets.js)
 * ============================================================================
 * Implements:
 * - Overall monthly budget (`category_id = null`) and category-specific budgets
 * - Real-time spending vs budget comparison using actual database transactions
 * - Remaining budget & percentage consumed
 * - Automatic 80% Warning and 100% Exceeded Alerts
 * ============================================================================
 */

import { dbService, normalizeError } from './storage.js';
import {
  escapeHtml,
  formatCurrency,
  sumExactAmounts,
  getBudgetStatus,
  validateBudgetInput,
  showToast
} from './utils.js';

export class BudgetsController {
  constructor(onDataChanged) {
    this.onDataChanged = onDataChanged;
    const now = new Date();
    this.selectedMonth = now.getMonth() + 1;
    this.selectedYear = now.getFullYear();
    this.currency = 'VND';
    this.budgets = [];
    this.expenseCategories = [];
    this.editingId = null;
    this.isSubmitting = false;
  }

  init() {
    this._initPeriodSelectors();
    this._bindEvents();
  }

  setCurrency(currency) {
    this.currency = currency || 'VND';
  }

  _initPeriodSelectors() {
    const monthEl = document.getElementById('budget-filter-month');
    const yearEl = document.getElementById('budget-filter-year');
    if (monthEl) monthEl.value = String(this.selectedMonth);
    if (yearEl) yearEl.value = String(this.selectedYear);
  }

  _bindEvents() {
    document.getElementById('budget-filter-month')?.addEventListener('change', (e) => {
      this.selectedMonth = Number(e.target.value);
      this.loadBudgets();
    });

    document.getElementById('budget-filter-year')?.addEventListener('change', (e) => {
      this.selectedYear = Number(e.target.value);
      this.loadBudgets();
    });

    document.getElementById('btn-open-budget-modal')?.addEventListener('click', () => {
      this.openModal(null);
    });

    document.getElementById('btn-close-budget-modal')?.addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('btn-cancel-budget-modal')?.addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('budget-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSaveBudget();
    });

    document.getElementById('budgets-list-container')?.addEventListener('click', (e) => {
      const editBtn = e.target.closest('[data-budget-edit]');
      if (editBtn) {
        const id = editBtn.getAttribute('data-budget-edit');
        const found = this.budgets.find((b) => b.id === id);
        if (found) this.openModal(found);
        return;
      }

      const delBtn = e.target.closest('[data-budget-delete]');
      if (delBtn) {
        const id = delBtn.getAttribute('data-budget-delete');
        const found = this.budgets.find((b) => b.id === id);
        if (found) this.handleDeleteBudget(found);
      }
    });
  }

  async loadBudgets() {
    const { data: cats } = await dbService.getCategories('EXPENSE');
    this.expenseCategories = cats || [];
    this._populateModalCategorySelect();

    const { data: budgets, error: bErr } = await dbService.getBudgets(
      this.selectedMonth,
      this.selectedYear
    );
    if (bErr) {
      showToast(normalizeError(bErr), 'error');
      return;
    }
    this.budgets = budgets || [];

    // Fetch all EXPENSE transactions in the selected month & year
    const firstDay = `${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}-01`;
    const lastDayDate = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    const lastDay = `${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}-${String(lastDayDate).padStart(2, '0')}`;

    const { data: monthExpenses } = await dbService.getTransactions({
      type: 'EXPENSE',
      fromDate: firstDay,
      toDate: lastDay,
      limit: 5000
    });

    this._renderBudgetsView(monthExpenses || []);
  }

  _populateModalCategorySelect(selectedId = '') {
    const select = document.getElementById('budget-category');
    if (!select) return;
    const options = [
      '<option value="">-- Ngân sách Tổng toàn tháng (Overall Budget) --</option>'
    ];
    for (const c of this.expenseCategories) {
      options.push(
        `<option value="${escapeHtml(c.id)}" ${c.id === selectedId ? 'selected' : ''}>Danh mục: ${escapeHtml(c.name)}</option>`
      );
    }
    select.innerHTML = options.join('');
  }

  _renderBudgetsView(monthExpenses) {
    const container = document.getElementById('budgets-list-container');
    const alertsContainer = document.getElementById('budget-alerts-banner');
    if (!container) return;

    const totalMonthlySpent = sumExactAmounts(monthExpenses, (t) => t.amount);
    const spentByCategory = new Map();
    for (const tx of monthExpenses) {
      const prev = spentByCategory.get(tx.category_id) || 0;
      spentByCategory.set(tx.category_id, sumExactAmounts([prev, tx.amount]));
    }

    if (this.budgets.length === 0) {
      if (alertsContainer) alertsContainer.innerHTML = '';
      container.innerHTML = `
        <div class="card empty-state">
          <p>Chưa có hạn mức ngân sách nào được thiết lập cho Tháng ${this.selectedMonth}/${this.selectedYear}.</p>
          <p style="font-size:0.86rem;margin-top:6px;">Nhấn nút <strong>"Thiết lập ngân sách"</strong> để đặt hạn mức tổng tháng hoặc từng danh mục chi tiêu.</p>
        </div>
      `;
      return;
    }

    const warnings = [];
    const cardsHtml = this.budgets
      .map((b) => {
        const isOverall = !b.category_id;
        const title = isOverall
          ? `Ngân sách Tổng Tháng ${b.month}/${b.year}`
          : b.category?.name || 'Danh mục chi tiêu';
        const spent = isOverall
          ? totalMonthlySpent
          : spentByCategory.get(b.category_id) || 0;
        const remaining = b.amount - spent;
        const status = getBudgetStatus(spent, b.amount);
        const barWidth = Math.min(100, Math.max(0, status.percent));

        if (status.level === 'danger' || status.level === 'warning') {
          warnings.push({
            title,
            level: status.level,
            percent: status.percent,
            spent,
            budget: b.amount
          });
        }

        const badgeClass =
          status.level === 'danger'
            ? 'badge-expense'
            : status.level === 'warning'
              ? 'badge-warning'
              : 'badge-income';

        return `
          <div class="card" style="margin-bottom:var(--space-4);">
            <div class="card-header" style="margin-bottom:var(--space-2);">
              <div>
                <span class="eyebrow">${isOverall ? 'HẠN MỨC TỔNG THÁNG' : 'HẠN MỨC DANH MỤC'}</span>
                <h3 class="card-title">${escapeHtml(title)}</h3>
              </div>
              <div style="display:flex;align-items:center;gap:8px;">
                <span class="badge ${badgeClass}">${escapeHtml(status.label)} (${status.percent.toFixed(1)}%)</span>
                <button type="button" class="btn btn-secondary btn-sm" data-budget-edit="${escapeHtml(b.id)}">Sửa</button>
                <button type="button" class="btn btn-danger btn-sm" data-budget-delete="${escapeHtml(b.id)}">Xóa</button>
              </div>
            </div>

            <div class="budget-progress-track" role="progressbar" aria-valuenow="${status.percent}" aria-valuemin="0" aria-valuemax="100">
              <div class="budget-progress-fill ${status.level}" style="width:${barWidth}%"></div>
            </div>

            <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-top:var(--space-3);font-size:0.9rem;">
              <div>Đã chi: <strong class="mono-value" style="color:var(--expense)">${formatCurrency(spent, this.currency)}</strong></div>
              <div>Hạn mức: <strong class="mono-value">${formatCurrency(b.amount, this.currency)}</strong></div>
              <div>
                ${
                  remaining >= 0
                    ? `Còn lại: <strong class="mono-value" style="color:var(--income)">${formatCurrency(remaining, this.currency)}</strong>`
                    : `Vượt mức: <strong class="mono-value" style="color:var(--expense)">${formatCurrency(Math.abs(remaining), this.currency)}</strong>`
                }
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    if (alertsContainer) {
      alertsContainer.innerHTML = warnings
        .map(
          (w) => `
          <div class="callout ${w.level === 'danger' ? 'danger' : 'warning'}" role="alert">
            <strong>${w.level === 'danger' ? 'CẢNH BÁO VƯỢT NGÂN SÁCH (≥ 100%):' : 'CẢNH BÁO NGÂN SÁCH (≥ 80%):'}</strong>
            Hạng mục <strong>${escapeHtml(w.title)}</strong> đã tiêu dùng <strong>${w.percent.toFixed(1)}%</strong>
            (${formatCurrency(w.spent, this.currency)} / ${formatCurrency(w.budget, this.currency)}).
          </div>
        `
        )
        .join('');
    }

    container.innerHTML = cardsHtml;
  }

  openModal(budget = null) {
    this.editingId = budget ? budget.id : null;
    const modal = document.getElementById('budget-modal');
    const title = document.getElementById('budget-modal-title');
    const amountEl = document.getElementById('budget-amount');
    const monthEl = document.getElementById('budget-month');
    const yearEl = document.getElementById('budget-year');
    const errSummary = document.getElementById('budget-error-summary');

    if (errSummary) {
      errSummary.classList.add('hidden');
      errSummary.textContent = '';
    }

    if (title) {
      title.textContent = budget ? 'Cập nhật hạn mức ngân sách' : 'Thiết lập ngân sách mới';
    }
    this._populateModalCategorySelect(budget?.category_id || '');
    if (amountEl) amountEl.value = budget ? String(budget.amount) : '';
    if (monthEl) monthEl.value = String(budget ? budget.month : this.selectedMonth);
    if (yearEl) yearEl.value = String(budget ? budget.year : this.selectedYear);

    if (modal && typeof modal.showModal === 'function') {
      modal.showModal();
    }
  }

  closeModal() {
    const modal = document.getElementById('budget-modal');
    if (modal && modal.open) modal.close();
  }

  async handleSaveBudget() {
    if (this.isSubmitting) return;
    const payload = {
      category_id: document.getElementById('budget-category')?.value || null,
      amount: document.getElementById('budget-amount')?.value || '',
      month: document.getElementById('budget-month')?.value || this.selectedMonth,
      year: document.getElementById('budget-year')?.value || this.selectedYear
    };

    const validation = validateBudgetInput(payload);
    if (!validation.isValid) {
      const errSummary = document.getElementById('budget-error-summary');
      if (errSummary) {
        errSummary.textContent = Object.values(validation.errors)[0];
        errSummary.classList.remove('hidden');
      }
      return;
    }

    this.isSubmitting = true;
    const saveBtn = document.getElementById('btn-save-budget');
    if (saveBtn) saveBtn.disabled = true;

    try {
      let res;
      if (this.editingId) {
        res = await dbService.updateBudget(this.editingId, validation.sanitized);
      } else {
        res = await dbService.createBudget(validation.sanitized);
      }
      if (res.error) throw res.error;

      showToast(this.editingId ? 'Đã cập nhật ngân sách!' : 'Đã lưu hạn mức ngân sách!', 'success');
      this.closeModal();
      await this.loadBudgets();
      if (typeof this.onDataChanged === 'function') {
        await this.onDataChanged();
      }
    } catch (err) {
      const msg = normalizeError(err);
      const errSummary = document.getElementById('budget-error-summary');
      if (errSummary) {
        errSummary.textContent = msg;
        errSummary.classList.remove('hidden');
      }
      showToast(msg, 'error');
    } finally {
      this.isSubmitting = false;
      if (saveBtn) saveBtn.disabled = false;
    }
  }

  async handleDeleteBudget(budget) {
    const { error } = await dbService.deleteBudget(budget.id);
    if (error) {
      showToast(normalizeError(error), 'error');
      return;
    }
    showToast('Đã xóa hạn mức ngân sách.', 'success');
    await this.loadBudgets();
    if (typeof this.onDataChanged === 'function') {
      await this.onDataChanged();
    }
  }
}
