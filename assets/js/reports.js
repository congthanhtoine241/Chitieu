/**
 * ============================================================================
 * FINANCIAL REPORTS & ANALYTICS MODULE (assets/js/reports.js)
 * ============================================================================
 * Features:
 * - Monthly income & expense breakdown across a 12-month year
 * - Savings trends chart
 * - Top spending categories ranking with percentage share
 * - Export transactions / report to UTF-8 CSV
 * ============================================================================
 */

import { dbService, normalizeError } from './storage.js';
import {
  escapeHtml,
  formatCurrency,
  formatDateVN,
  sumExactAmounts,
  calculateUsagePercent,
  showToast
} from './utils.js';

export class ReportsController {
  constructor() {
    this.selectedYear = new Date().getFullYear();
    this.selectedMonth = 0; // 0 = All 12 months in year, 1..12 = Specific month
    this.currency = 'VND';
    this.monthlyBarChart = null;
    this.savingsLineChart = null;
    this.lastLoadedTransactions = [];
  }

  init() {
    const yearSelect = document.getElementById('report-filter-year');
    if (yearSelect) yearSelect.value = String(this.selectedYear);
    this._bindEvents();
  }

  setCurrency(currency) {
    this.currency = currency || 'VND';
  }

  _bindEvents() {
    document.getElementById('report-filter-year')?.addEventListener('change', (e) => {
      this.selectedYear = Number(e.target.value);
      this.loadReports();
    });

    document.getElementById('report-filter-month')?.addEventListener('change', (e) => {
      this.selectedMonth = Number(e.target.value);
      this.loadReports();
    });

    document.getElementById('btn-export-csv')?.addEventListener('click', () => {
      this.exportToCSV();
    });
  }

  async loadReports() {
    const fromDate = `${this.selectedYear}-01-01`;
    const toDate = `${this.selectedYear}-12-31`;

    const { data, error } = await dbService.getTransactions({
      fromDate,
      toDate,
      limit: 10000
    });

    if (error) {
      showToast(normalizeError(error), 'error');
      return;
    }

    const yearTransactions = data || [];
    this.lastLoadedTransactions =
      this.selectedMonth > 0
        ? yearTransactions.filter((tx) => {
            const m = Number(String(tx.transaction_date).split('-')[1]);
            return m === this.selectedMonth;
          })
        : yearTransactions;

    this._renderMonthlyComparison(yearTransactions);
    this._renderTopSpendingCategories(this.lastLoadedTransactions);
  }

  _renderMonthlyComparison(yearTransactions) {
    const months = Array.from({ length: 12 }, (_, idx) => ({
      month: idx + 1,
      income: 0,
      expense: 0,
      net: 0
    }));

    for (const tx of yearTransactions) {
      const mIndex = Number(String(tx.transaction_date).split('-')[1]) - 1;
      if (mIndex >= 0 && mIndex < 12) {
        if (tx.type === 'INCOME') {
          months[mIndex].income = sumExactAmounts([months[mIndex].income, tx.amount]);
        } else {
          months[mIndex].expense = sumExactAmounts([months[mIndex].expense, tx.amount]);
        }
      }
    }

    months.forEach((m) => {
      m.net = m.income - m.expense;
    });

    // Render 12-month table
    const tbody = document.getElementById('report-monthly-table-body');
    if (tbody) {
      tbody.innerHTML = months
        .map((m) => {
          const rate = m.income > 0 ? ((m.net / m.income) * 100).toFixed(1) : '0.0';
          return `
            <tr>
              <td>Tháng ${m.month}/${this.selectedYear}</td>
              <td class="text-right mono-value" style="color:var(--income)">${formatCurrency(m.income, this.currency)}</td>
              <td class="text-right mono-value" style="color:var(--expense)">${formatCurrency(m.expense, this.currency)}</td>
              <td class="text-right mono-value" style="color:${m.net >= 0 ? 'var(--income)' : 'var(--expense)'}">
                ${formatCurrency(m.net, this.currency)}
              </td>
              <td class="text-right mono-value">${rate}%</td>
            </tr>
          `;
        })
        .join('');
    }

    // Render Charts if Chart.js is available
    if (typeof window !== 'undefined' && window.Chart) {
      const barCanvas = document.getElementById('report-monthly-bar-chart');
      const lineCanvas = document.getElementById('report-savings-line-chart');
      const labels = months.map((m) => `T${m.month}`);

      if (barCanvas) {
        if (this.monthlyBarChart) this.monthlyBarChart.destroy();
        this.monthlyBarChart = new window.Chart(barCanvas, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Thu nhập',
                data: months.map((m) => m.income),
                backgroundColor: '#1b6b4c',
                borderRadius: 5
              },
              {
                label: 'Chi tiêu',
                data: months.map((m) => m.expense),
                backgroundColor: '#b42318',
                borderRadius: 5
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false
          }
        });
      }

      if (lineCanvas) {
        if (this.savingsLineChart) this.savingsLineChart.destroy();
        this.savingsLineChart = new window.Chart(lineCanvas, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: 'Tiết kiệm ròng (Thu - Chi)',
                data: months.map((m) => m.net),
                borderColor: '#a86632',
                backgroundColor: 'rgba(168, 102, 50, 0.15)',
                fill: true,
                tension: 0.25
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false
          }
        });
      }
    }
  }

  _renderTopSpendingCategories(transactions) {
    const tbody = document.getElementById('report-top-categories-body');
    if (!tbody) return;

    const expenses = transactions.filter((t) => t.type === 'EXPENSE');
    const totalExpense = sumExactAmounts(expenses, (t) => t.amount);

    if (expenses.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="empty-state">Chưa có dữ liệu chi tiêu trong kỳ báo cáo này.</td>
        </tr>
      `;
      return;
    }

    const grouped = new Map();
    for (const tx of expenses) {
      const catName = tx.category?.name || 'Khác';
      const color = tx.category?.color || '#a86632';
      const cur = grouped.get(catName) || { amount: 0, count: 0, color };
      grouped.set(catName, {
        amount: sumExactAmounts([cur.amount, tx.amount]),
        count: cur.count + 1,
        color
      });
    }

    const sorted = Array.from(grouped.entries()).sort((a, b) => b[1].amount - a[1].amount);
    tbody.innerHTML = sorted
      .map(([name, info], idx) => {
        const share = calculateUsagePercent(info.amount, totalExpense);
        return `
          <tr>
            <td>#${idx + 1}</td>
            <td>
              <span class="category-chip">
                <span class="category-dot" style="background:${escapeHtml(info.color)}"></span>
                ${escapeHtml(name)}
              </span>
            </td>
            <td class="mono-value">${info.count} giao dịch</td>
            <td class="text-right mono-value" style="color:var(--expense)">
              ${formatCurrency(info.amount, this.currency)} (${share.toFixed(1)}%)
            </td>
          </tr>
        `;
      })
      .join('');
  }

  exportToCSV() {
    if (!this.lastLoadedTransactions || this.lastLoadedTransactions.length === 0) {
      showToast('Không có dữ liệu giao dịch để xuất CSV.', 'warning');
      return;
    }

    const headers = ['Ngày', 'Loại', 'Danh mục', 'Số tiền', 'Phương thức', 'Mô tả'];
    const rows = this.lastLoadedTransactions.map((tx) => [
      formatDateVN(tx.transaction_date),
      tx.type === 'INCOME' ? 'Thu nhập' : 'Chi tiêu',
      `"${String(tx.category?.name || '').replace(/"/g, '""')}"`,
      tx.amount,
      tx.payment_method,
      `"${String(tx.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `bao-cao-tai-chinh-${this.selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    showToast('Đã xuất báo cáo CSV thành công!', 'success');
  }
}
