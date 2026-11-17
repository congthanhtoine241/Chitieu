/**
 * ============================================================================
 * USER SETTINGS & LOCAL BACKUP MODULE (assets/js/settings.js)
 * ============================================================================
 */

import { dbService, normalizeError } from './storage.js';
import { APP_CONFIG } from './config.js';
import { showToast, getTodayISO } from './utils.js';

export class SettingsController {
  constructor(onPreferencesChanged) {
    this.onPreferencesChanged = onPreferencesChanged;
    this.profile = null;
  }

  init() {
    const savedTheme =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem(APP_CONFIG.STORAGE_KEYS.THEME)
        : null;
    if (savedTheme === 'dark' || savedTheme === 'light') {
      this.applyTheme(savedTheme);
    }

    this._bindEvents();
  }

  _bindEvents() {
    document.getElementById('settings-profile-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSaveProfile();
    });

    document.getElementById('btn-toggle-theme')?.addEventListener('click', () => {
      const current =
        document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      this.applyTheme(next);
      showToast(
        `Đã chuyển sang giao diện ${next === 'dark' ? 'Tối (Dark)' : 'Sáng (Light)'}.`,
        'info'
      );
    });

    document.getElementById('btn-backup-export')?.addEventListener('click', () => {
      this.handleExportBackup();
    });

    const fileInput = document.getElementById('input-backup-import');
    document.getElementById('btn-backup-import')?.addEventListener('click', () => {
      fileInput?.click();
    });
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        this.handleImportBackup(file);
        fileInput.value = '';
      }
    });

    document.getElementById('btn-reset-all-data')?.addEventListener('click', () => {
      this.handleConfirmResetAll();
    });
  }

  applyTheme(theme) {
    const cleanTheme = theme === 'dark' ? 'dark' : 'light';
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', cleanTheme);
      const selectEl = document.getElementById('settings-theme');
      if (selectEl) selectEl.value = cleanTheme;
    }
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.THEME, cleanTheme);
      } catch (_e) {
        // Ignore
      }
    }
  }

  async loadProfile() {
    const { data } = await dbService.getProfile();
    this.profile = data;

    const nameEl = document.getElementById('settings-display-name');
    const currencyEl = document.getElementById('settings-currency');
    const themeEl = document.getElementById('settings-theme');
    const sidebarName = document.getElementById('sidebar-user-name');
    const sidebarAvatar = document.getElementById('sidebar-user-avatar');

    const displayName = data?.display_name || APP_CONFIG.DEFAULT_PROFILE.display_name;
    if (nameEl) nameEl.value = displayName;
    if (sidebarName) sidebarName.textContent = displayName;
    if (sidebarAvatar) sidebarAvatar.textContent = displayName.charAt(0).toUpperCase();

    if (currencyEl && data?.currency) {
      currencyEl.value = data.currency;
    }
    if (themeEl && data?.theme) {
      themeEl.value = data.theme;
      this.applyTheme(data.theme);
    }

    if (typeof this.onPreferencesChanged === 'function' && data) {
      this.onPreferencesChanged({
        currency: data.currency || 'VND',
        theme: data.theme || 'light',
        displayName
      });
    }
  }

  async handleSaveProfile() {
    const displayName = document.getElementById('settings-display-name')?.value?.trim() || '';
    const currency = document.getElementById('settings-currency')?.value || 'VND';
    const theme = document.getElementById('settings-theme')?.value || 'light';

    if (!displayName) {
      showToast('Tên sổ thu chi không được để trống.', 'error');
      return;
    }

    const { data, error } = await dbService.updateProfile({
      display_name: displayName,
      currency,
      theme
    });

    if (error) {
      showToast(normalizeError(error), 'error');
      return;
    }

    this.applyTheme(theme);
    const sidebarName = document.getElementById('sidebar-user-name');
    const sidebarAvatar = document.getElementById('sidebar-user-avatar');
    if (sidebarName) sidebarName.textContent = displayName;
    if (sidebarAvatar) sidebarAvatar.textContent = displayName.charAt(0).toUpperCase();

    if (typeof this.onPreferencesChanged === 'function') {
      this.onPreferencesChanged({
        currency: data?.currency || currency,
        theme: data?.theme || theme,
        displayName
      });
    }

    showToast('Đã lưu cài đặt thành công!', 'success');
  }

  handleExportBackup() {
    try {
      const jsonStr = dbService.exportBackupData();
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `sao-luu-so-thu-chi-${getTodayISO()}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      showToast('Đã tải tệp sao lưu dữ liệu (.json) về thiết bị!', 'success');
    } catch (err) {
      showToast(normalizeError(err), 'error');
    }
  }

  handleImportBackup(file) {
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const content = String(evt.target?.result || '');
        const stats = dbService.importBackupData(content);
        await this.loadProfile();
        if (typeof this.onPreferencesChanged === 'function') {
          this.onPreferencesChanged({
            currency: this.profile?.currency || 'VND',
            theme: this.profile?.theme || 'light',
            displayName: this.profile?.display_name || 'Sổ Thu Chi'
          });
        }
        showToast(
          `Khôi phục thành công ${stats.transactionsCount} giao dịch và ${stats.categoriesCount} danh mục!`,
          'success'
        );
      } catch (err) {
        showToast(normalizeError(err), 'error');
      }
    };
    reader.readAsText(file, 'utf-8');
  }

  handleConfirmResetAll() {
    const dialog = document.getElementById('confirm-modal');
    const msgEl = document.getElementById('confirm-modal-message');
    const confirmBtn = document.getElementById('btn-confirm-accept');
    const cancelBtn = document.getElementById('btn-confirm-cancel');

    if (!dialog || !confirmBtn) return;

    if (msgEl) {
      msgEl.textContent =
        'Bạn có chắc chắn muốn xóa toàn bộ giao dịch và ngân sách đã lưu trên thiết bị này để làm lại từ đầu không?';
    }

    const cleanup = () => {
      if (dialog.open) dialog.close();
      confirmBtn.onclick = null;
      cancelBtn.onclick = null;
    };

    cancelBtn.onclick = cleanup;
    confirmBtn.onclick = async () => {
      dbService.resetAllData();
      cleanup();
      await this.loadProfile();
      showToast('Đã đặt lại toàn bộ dữ liệu về mặc định.', 'info');
    };

    dialog.showModal();
  }
}
