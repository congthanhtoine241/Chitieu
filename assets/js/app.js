/**
 * ============================================================================
 * APPLICATION BOOTSTRAP & ROUTER COORDINATOR (assets/js/app.js)
 * ============================================================================
 */

import { dbService } from './storage.js';
import { DashboardController } from './dashboard.js';
import { TransactionsController } from './transactions.js';
import { CategoriesController } from './categories.js';
import { BudgetsController } from './budgets.js';
import { ReportsController } from './reports.js';
import { SettingsController } from './settings.js';

class PersonalFinanceApp {
  constructor() {
    this.activeView = 'dashboard';

    const refreshAllModules = async () => {
      await this.refreshDataAcrossViews();
    };

    this.dashboard = new DashboardController();
    this.transactions = new TransactionsController(refreshAllModules);
    this.categories = new CategoriesController(refreshAllModules);
    this.budgets = new BudgetsController(refreshAllModules);
    this.reports = new ReportsController();
    this.settings = new SettingsController(({ currency }) => {
      this.dashboard.setCurrency(currency);
      this.transactions.setCurrency(currency);
      this.budgets.setCurrency(currency);
      this.reports.setCurrency(currency);
      this.refreshDataAcrossViews();
    });
  }

  async start() {
    await dbService.init();

    this._bindNavigation();
    this.settings.init();
    this.dashboard.init();
    this.transactions.init();
    this.categories.init();
    this.budgets.init();
    this.reports.init();

    await this.settings.loadProfile();
    await this.refreshDataAcrossViews();
  }

  _bindNavigation() {
    const navButtons = document.querySelectorAll('[data-nav-view]');
    navButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetView = btn.getAttribute('data-nav-view');
        this.switchView(targetView);
        this._closeMobileSidebar();
      });
    });

    const mobileBtn = document.getElementById('btn-mobile-menu');
    const backdrop = document.getElementById('sidebar-backdrop');
    mobileBtn?.addEventListener('click', () => {
      document.getElementById('app-sidebar')?.classList.toggle('open');
      backdrop?.classList.toggle('open');
    });
    backdrop?.addEventListener('click', () => {
      this._closeMobileSidebar();
    });
  }

  _closeMobileSidebar() {
    document.getElementById('app-sidebar')?.classList.remove('open');
    document.getElementById('sidebar-backdrop')?.classList.remove('open');
  }

  switchView(viewName) {
    this.activeView = viewName;

    document.querySelectorAll('[data-nav-view]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-nav-view') === viewName);
    });

    document.querySelectorAll('.view-section').forEach((sec) => {
      sec.classList.toggle('active', sec.id === `view-${viewName}`);
    });

    const viewTitles = {
      dashboard: 'Bảng điều khiển tài chính',
      transactions: 'Quản lý giao dịch Thu Chi',
      categories: 'Danh mục Thu & Chi',
      budgets: 'Quản lý Ngân sách tháng',
      reports: 'Báo cáo & Phân tích chuyên sâu',
      settings: 'Cài đặt & Sao lưu dữ liệu'
    };
    const topTitle = document.getElementById('topbar-view-title');
    if (topTitle && viewTitles[viewName]) {
      topTitle.textContent = viewTitles[viewName];
    }
  }

  async refreshDataAcrossViews() {
    await Promise.all([
      this.categories.loadCategories(),
      this.transactions.refreshCategoriesAndLoad(),
      this.budgets.loadBudgets(),
      this.dashboard.loadDashboard(),
      this.reports.loadReports()
    ]);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new PersonalFinanceApp();
  app.start();
});
