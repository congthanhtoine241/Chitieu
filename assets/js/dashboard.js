/**
 * ============================================================================
 * DASHBOARD & ANALYTICS OVERVIEW MODULE (assets/js/dashboard.js)
 * ============================================================================
 * Features:
 * - Calculates Total Income, Total Expenses, Net Balance, and Savings Rate
 *   from actual database transactions.
 * - Supports 6 date filters: Today, This Week, This Month, Last Month,
 *   This Year, and Custom Date Range.
 * - Renders Chart.js Income vs Expenses trend and Category Expense distribution.
 * - Displays Recent Transactions and Active Budget Alerts.
 * ============================================================================
 */

import { dbService, normalizeError } from './storage.js';
import {
  escapeHtml,
  formatCurrency,
  formatDateVN,
  sumExactAmounts,
  getDateRangeForFilter,
  getBudgetStatus,
  showToast
} from './utils.js';

export class DashboardController {
  constructor() {
    this.filterType = 'month';
    this.customFrom = '';
    this.customTo = '';
    this.currency = 'VND';
    this.trendChart = null;
    this.categoryChart = null;
  }

  init() {
    this._bindEvents();
  }

  setCurrency(currency) {
    this.currency = currency || 'VND';
  }

  _bindEvents() {
    const pills = document.querySelectorAll('[data-dash-period]');
    pills.forEach((btn) => {
      btn.addEventListener('click', () => {
        const period = btn.getAttribute('data-dash-period');
        this.filterType = period;
        pills.forEach((p) => p.classList.toggle('active', p === btn));

        const customBox = document.getElementById('dash-custom-range-box');
        if (customBox) {
          customBox.classList.toggle('hidden', period !== 'custom');
        }

        if (period !== 'custom') {
          this.loadDashboard();
        }
      });
    });

    document.getElementById('btn-dash-apply-custom')?.addEventListener('click', () => {
      this.customFrom = document.getElementById('dash-custom-from')?.value || '';
      this.customTo = document.getElementById('dash-custom-to')?.value || '';
      this.loadDashboard();
    });
  }

  async loadDashboard() {
    const range = getDateRangeForFilter(this.filterType, this.customFrom, this.customTo);
    const labelEl = document.getElementById('dash-period-label');
    if (labelEl) labelEl.textContent = range.label;

    const { data: txList, error } = await dbService.getTransactions({
      fromDate: range.fromDate,
      toDate: range.toDate,
      limit: 5000
    });

    if (error) {
      showToast(normalizeError(error), 'error');
      return;
    }

    const transactions = txList || [];
    const incomes = transactions.filter((t) => t.type === 'INCOME');
    const expenses = transactions.filter((t) => t.type === 'EXPENSE');

    const totalIncome = sumExactAmounts(incomes, (t) => t.amount);
    const totalExpense = sumExactAmounts(expenses, (t) => t.amount);
    const balance = totalIncome - totalExpense;
    const savingsRate =
      totalIncome > 0 ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100) : 0;

    this._renderKPIs({ totalIncome, totalExpense, balance, savingsRate, count: transactions.length });
    this._renderRecentTransactions(transactions.slice(0, 6));
    this._renderCharts(transactions, range);
    await this._renderMonthlyBudgetSummary();
  }

  _renderKPIs({ totalIncome, totalExpense, balance, savingsRate, count }) {
    const incEl = document.getElementById('kpi-total-income');
    const expEl = document.getElementById('kpi-total-expense');
    const balEl = document.getElementById('kpi-current-balance');
    const savEl = document.getElementById('kpi-monthly-savings');
    const savSubEl = document.getElementById('kpi-savings-rate');

    if (incEl) incEl.textContent = formatCurrency(totalIncome, this.currency);
    if (expEl) expEl.textContent = formatCurrency(totalExpense, this.currency);
    if (balEl) {
      balEl.textContent = formatCurrency(balance, this.currency);
      balEl.className = `kpi-value ${balance >= 0 ? 'income' : 'expense'}`;
    }
    if (savEl) {
      savEl.textContent = formatCurrency(Math.max(0, balance), this.currency);
    }
    if (savSubEl) {
      savSubEl.textContent = `Tỷ lệ tiết kiệm: ${savingsRate.toFixed(1)}% (${count} giao dịch)`;
    }
  }

  _renderRecentTransactions(recentRows) {
    const tbody = document.getElementById('dash-recent-tx-body');
    if (!tbody) return;

    if (recentRows.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-state">Chưa có giao dịch nào trong kỳ được chọn.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = recentRows
      .map((tx) => {
        const isInc = tx.type === 'INCOME';
        const sign = isInc ? '+' : '-';
        const cls = isInc ? 'income' : 'expense';
        return `
          <tr>
            <td class="mono-value">${formatDateVN(tx.transaction_date)}</td>
            <td>
              <span class="category-chip">
                <span class="category-dot" style="background:${escapeHtml(tx.category?.color || '#a86632')}"></span>
                ${escapeHtml(tx.category?.name || 'Danh mục')}
              </span>
            </td>
            <td>${escapeHtml(tx.description || '(Không có mô tả)')}</td>
            <td><span class="badge ${isInc ? 'badge-income' : 'badge-expense'}">${isInc ? 'Thu' : 'Chi'}</span></td>
            <td class="text-right mono-value kpi-value ${cls}" style="font-size:0.95rem;">
              ${sign}${formatCurrency(tx.amount, this.currency)}
            </td>
          </tr>
        `;
      })
      .join('');
  }

  async _renderMonthlyBudgetSummary() {
    const bannerEl = document.getElementById('dash-budget-status-banner');
    if (!bannerEl) return;

    const now = new Date();
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();

    const { data: budgets } = await dbService.getBudgets(curMonth, curYear);
    if (!budgets || budgets.length === 0) {
      bannerEl.innerHTML = '';
      return;
    }

    const firstDay = `${curYear}-${String(curMonth).padStart(2, '0')}-01`;
    const lastDayNum = new Date(curYear, curMonth, 0).getDate();
    const lastDay = `${curYear}-${String(curMonth).padStart(2, '0')}-${String(lastDayNum).padStart(2, '0')}`;

    const { data: monthExpenses } = await dbService.getTransactions({
      type: 'EXPENSE',
      fromDate: firstDay,
      toDate: lastDay,
      limit: 5000
    });

    const expenses = monthExpenses || [];
    const totalSpent = sumExactAmounts(expenses, (t) => t.amount);
    const byCat = new Map();
    for (const tx of expenses) {
      byCat.set(tx.category_id, sumExactAmounts([byCat.get(tx.category_id) || 0, tx.amount]));
    }

    const alerts = [];
    for (const b of budgets) {
      const spent = b.category_id ? byCat.get(b.category_id) || 0 : totalSpent;
      const status = getBudgetStatus(spent, b.amount);
      if (status.level === 'warning' || status.level === 'danger') {
        const name = b.category_id ? b.category?.name || 'Danh mục' : `Tổng ngân sách tháng ${curMonth}/${curYear}`;
        alerts.push({ name, status, spent, budget: b.amount });
      }
    }

    bannerEl.innerHTML = alerts
      .map(
        (a) => `
        <div class="callout ${a.status.level === 'danger' ? 'danger' : 'warning'}" role="alert">
          <strong>${a.status.level === 'danger' ? 'Vượt ngân sách:' : 'Sắp chạm trần ngân sách:'}</strong>
          ${escapeHtml(a.name)} đã dùng <strong>${a.status.percent.toFixed(1)}%</strong>
          (${formatCurrency(a.spent, this.currency)} / ${formatCurrency(a.budget, this.currency)}).
        </div>
      `
      )
      .join('');
  }

  _renderCharts(transactions, range) {
    if (typeof window === 'undefined' || !window.Chart) return;

    const trendCanvas = document.getElementById('dash-trend-chart');
    const catCanvas = document.getElementById('dash-category-chart');
    if (!trendCanvas || !catCanvas) return;

    // 1. Group by Date (or Month if filter is 'year')
    const groupByMonth = this.filterType === 'year';
    const buckets = new Map();

    for (const tx of transactions) {
      const key = groupByMonth
        ? String(tx.transaction_date).slice(0, 7) // YYYY-MM
        : String(tx.transaction_date).slice(0, 10); // YYYY-MM-DD
      if (!buckets.has(key)) {
        buckets.set(key, { income: 0, expense: 0 });
      }
      const entry = buckets.get(key);
      if (tx.type === 'INCOME') {
        entry.income = sumExactAmounts([entry.income, tx.amount]);
      } else {
        entry.expense = sumExactAmounts([entry.expense, tx.amount]);
      }
    }

    const sortedKeys = Array.from(buckets.keys()).sort();
    const labels = sortedKeys.length > 0
      ? sortedKeys.map((k) => (groupByMonth ? `Thg ${k.split('-')[1]}/${k.split('-')[0]}` : formatDateVN(k)))
      : [range.label];
    const incomeSeries = sortedKeys.length > 0 ? sortedKeys.map((k) => buckets.get(k).income) : [0];
    const expenseSeries = sortedKeys.length > 0 ? sortedKeys.map((k) => buckets.get(k).expense) : [0];

    if (this.trendChart) this.trendChart.destroy();
    this.trendChart = new window.Chart(trendCanvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Thu nhập',
            data: incomeSeries,
            backgroundColor: '#1b6b4c',
            borderRadius: 6
          },
          {
            label: 'Chi tiêu',
            data: expenseSeries,
            backgroundColor: '#b42318',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    // 2. Category Expense Distribution
    const expenses = transactions.filter((t) => t.type === 'EXPENSE');
    const catMap = new Map();
    for (const tx of expenses) {
      const name = tx.category?.name || 'Khác';
      const color = tx.category?.color || '#a86632';
      const prev = catMap.get(name) || { amount: 0, color };
      catMap.set(name, {
        amount: sumExactAmounts([prev.amount, tx.amount]),
        color
      });
    }

    const catEntries = Array.from(catMap.entries()).sort((a, b) => b[1].amount - a[1].amount);
    const catLabels = catEntries.length > 0 ? catEntries.map(([name]) => name) : ['Chưa có chi tiêu'];
    const catValues = catEntries.length > 0 ? catEntries.map(([, v]) => v.amount) : [1];
    const catColors = catEntries.length > 0 ? catEntries.map(([, v]) => v.color) : ['#cbd5e1'];

    if (this.categoryChart) this.categoryChart.destroy();
    this.categoryChart = new window.Chart(catCanvas, {
      type: 'doughnut',
      data: {
        labels: catLabels,
        datasets: [
          {
            data: catValues,
            backgroundColor: catColors,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right' }
        }
      }
    });
  }
}
