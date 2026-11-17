/**
 * ============================================================================
 * CATEGORY MANAGEMENT MODULE (assets/js/categories.js)
 * ============================================================================
 * Features:
 * - Separate views for Income and Expense categories
 * - Create, Edit, Delete categories with custom color & icon
 * - Protects referential integrity: prevents deletion of categories referenced
 *   by transactions unless reassigned to another category of the same type.
 * ============================================================================
 */

import { dbService, normalizeError } from './storage.js';
import { CATEGORY_ICONS } from './config.js';
import { escapeHtml, validateCategoryInput, showToast } from './utils.js';

export class CategoriesController {
  constructor(onDataChanged) {
    this.onDataChanged = onDataChanged;
    this.categories = [];
    this.editingId = null;
    this.isSubmitting = false;
  }

  init() {
    this._populateIconSelect();
    this._bindEvents();
  }

  _populateIconSelect() {
    const select = document.getElementById('cat-icon');
    if (!select) return;
    select.innerHTML = CATEGORY_ICONS.map(
      (ic) => `<option value="${escapeHtml(ic)}">${escapeHtml(ic)}</option>`
    ).join('');
  }

  _bindEvents() {
    document.getElementById('btn-open-cat-modal')?.addEventListener('click', () => {
      this.openModal(null);
    });

    document.getElementById('btn-close-cat-modal')?.addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('btn-cancel-cat-modal')?.addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('cat-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSaveCategory();
    });

    const handleContainerClick = (e) => {
      const editBtn = e.target.closest('[data-cat-edit]');
      if (editBtn) {
        const id = editBtn.getAttribute('data-cat-edit');
        const cat = this.categories.find((c) => c.id === id);
        if (cat) this.openModal(cat);
        return;
      }

      const delBtn = e.target.closest('[data-cat-delete]');
      if (delBtn) {
        const id = delBtn.getAttribute('data-cat-delete');
        const cat = this.categories.find((c) => c.id === id);
        if (cat) this.handleDeleteCategory(cat);
      }
    };

    document.getElementById('income-categories-list')?.addEventListener('click', handleContainerClick);
    document.getElementById('expense-categories-list')?.addEventListener('click', handleContainerClick);
  }

  async loadCategories() {
    const { data, error } = await dbService.getCategories();
    if (error) {
      showToast(normalizeError(error), 'error');
      return;
    }
    this.categories = data || [];
    this._renderLists();
  }

  _renderLists() {
    const incomeContainer = document.getElementById('income-categories-list');
    const expenseContainer = document.getElementById('expense-categories-list');

    const incomeCats = this.categories.filter((c) => c.type === 'INCOME');
    const expenseCats = this.categories.filter((c) => c.type === 'EXPENSE');

    if (incomeContainer) {
      incomeContainer.innerHTML = this._renderCategoryTable(incomeCats, 'INCOME');
    }
    if (expenseContainer) {
      expenseContainer.innerHTML = this._renderCategoryTable(expenseCats, 'EXPENSE');
    }
  }

  _renderCategoryTable(items, type) {
    if (items.length === 0) {
      return `<div class="empty-state">Chưa có danh mục ${type === 'INCOME' ? 'thu nhập' : 'chi tiêu'} nào.</div>`;
    }

    const rows = items
      .map(
        (c) => `
        <tr>
          <td>
            <span class="category-chip">
              <span class="category-dot" style="background:${escapeHtml(c.color)}"></span>
              ${escapeHtml(c.name)}
            </span>
          </td>
          <td><code>${escapeHtml(c.icon)}</code></td>
          <td><code>${escapeHtml(c.color)}</code></td>
          <td>
            ${c.is_default ? '<span class="badge badge-neutral">Mặc định</span>' : '<span class="badge badge-income">Tùy chỉnh</span>'}
          </td>
          <td class="text-right">
            <button type="button" class="btn btn-secondary btn-sm" data-cat-edit="${escapeHtml(c.id)}">Sửa</button>
            <button type="button" class="btn btn-danger btn-sm" data-cat-delete="${escapeHtml(c.id)}">Xóa</button>
          </td>
        </tr>
      `
      )
      .join('');

    return `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Tên danh mục</th>
              <th>Biểu tượng</th>
              <th>Mã màu</th>
              <th>Phân loại</th>
              <th class="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  openModal(cat = null) {
    this.editingId = cat ? cat.id : null;
    const modal = document.getElementById('cat-modal');
    const title = document.getElementById('cat-modal-title');
    const nameEl = document.getElementById('cat-name');
    const typeEl = document.getElementById('cat-type');
    const colorEl = document.getElementById('cat-color');
    const iconEl = document.getElementById('cat-icon');
    const errSummary = document.getElementById('cat-error-summary');

    if (errSummary) {
      errSummary.classList.add('hidden');
      errSummary.textContent = '';
    }

    if (title) title.textContent = cat ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới';
    if (nameEl) nameEl.value = cat ? cat.name : '';
    if (typeEl) typeEl.value = cat ? cat.type : 'EXPENSE';
    if (colorEl) colorEl.value = cat ? cat.color : '#a86632';
    if (iconEl) iconEl.value = cat ? cat.icon : 'utensils';

    if (modal && typeof modal.showModal === 'function') {
      modal.showModal();
    }
  }

  closeModal() {
    const modal = document.getElementById('cat-modal');
    if (modal && modal.open) modal.close();
  }

  async handleSaveCategory() {
    if (this.isSubmitting) return;
    const payload = {
      name: document.getElementById('cat-name')?.value || '',
      type: document.getElementById('cat-type')?.value || 'EXPENSE',
      color: document.getElementById('cat-color')?.value || '#a86632',
      icon: document.getElementById('cat-icon')?.value || 'tag'
    };

    const validation = validateCategoryInput(payload);
    if (!validation.isValid) {
      const errSummary = document.getElementById('cat-error-summary');
      if (errSummary) {
        errSummary.textContent = Object.values(validation.errors)[0];
        errSummary.classList.remove('hidden');
      }
      return;
    }

    this.isSubmitting = true;
    const saveBtn = document.getElementById('btn-save-cat');
    if (saveBtn) saveBtn.disabled = true;

    try {
      let res;
      if (this.editingId) {
        res = await dbService.updateCategory(this.editingId, validation.sanitized);
      } else {
        res = await dbService.createCategory(validation.sanitized);
      }
      if (res.error) throw res.error;

      showToast(this.editingId ? 'Đã cập nhật danh mục!' : 'Đã tạo danh mục mới!', 'success');
      this.closeModal();
      await this.loadCategories();
      if (typeof this.onDataChanged === 'function') {
        await this.onDataChanged();
      }
    } catch (err) {
      const msg = normalizeError(err);
      const errSummary = document.getElementById('cat-error-summary');
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

  async handleDeleteCategory(cat) {
    // Check if any transactions reference this category
    const { count } = await dbService.getTransactions({ category_id: cat.id, limit: 1 });
    const dialog = document.getElementById('confirm-modal');
    const msgEl = document.getElementById('confirm-modal-message');
    const confirmBtn = document.getElementById('btn-confirm-accept');
    const cancelBtn = document.getElementById('btn-confirm-cancel');

    if (!dialog || !confirmBtn) return;

    if (count > 0) {
      // Find alternative category of the same type for safe reassignment
      const alternatives = this.categories.filter((c) => c.type === cat.type && c.id !== cat.id);
      if (alternatives.length === 0) {
        showToast(
          `Không thể xóa danh mục "${cat.name}" vì đang có ${count} giao dịch tham chiếu và không có danh mục thay thế cùng loại.`,
          'error'
        );
        return;
      }

      const fallbackCat = alternatives[0];
      if (msgEl) {
        msgEl.textContent = `Danh mục "${cat.name}" đang được tham chiếu bởi ${count} giao dịch. Để bảo toàn dữ liệu (ON DELETE RESTRICT), hệ thống sẽ chuyển ${count} giao dịch này sang danh mục "${fallbackCat.name}" trước khi xóa. Bạn có đồng ý không?`;
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
          const { error } = await dbService.deleteCategory(cat.id, fallbackCat.id);
          if (error) throw error;
          showToast(`Đã chuyển giao dịch sang "${fallbackCat.name}" và xóa danh mục "${cat.name}".`, 'success');
          cleanup();
          await this.loadCategories();
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
      return;
    }

    if (msgEl) {
      msgEl.textContent = `Bạn có chắc chắn muốn xóa danh mục "${cat.name}" không?`;
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
        const { error } = await dbService.deleteCategory(cat.id);
        if (error) throw error;
        showToast(`Đã xóa danh mục "${cat.name}".`, 'success');
        cleanup();
        await this.loadCategories();
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
