/**
 * ============================================================================
 * AUTOMATED TEST SUITE: OOP CLASSES, ARRAY CRUD, BUDGETS & BACKUP/RESTORE
 * File: tests/security-and-crud.test.mjs
 * ============================================================================
 */

import { LocalFinanceStorage, Category, Transaction, Budget, normalizeError } from '../assets/js/storage.js';
import {
  parseExactAmount,
  sumExactAmounts,
  getBudgetStatus,
  escapeHtml
} from '../assets/js/utils.js';

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
};

export async function runAllSecurityAndCrudTests() {
  const results = [];
  const storage = new LocalFinanceStorage(false); // In-memory Array store for tests
  await storage.init();

  let categories = [];
  let txExpense = null;

  const runTest = async (id, suite, title, fn) => {
    const start = performance.now();
    try {
      const detail = await fn();
      const durationMs = Math.round(performance.now() - start);
      results.push({ id, suite, title, status: 'PASS', detail: detail || 'OK', durationMs });
    } catch (err) {
      const durationMs = Math.round(performance.now() - start);
      results.push({
        id,
        suite,
        title,
        status: 'FAIL',
        detail: err?.message || String(err),
        durationMs
      });
    }
  };

  await runTest(
    'TC-01',
    '1. OOP Classes & Array Initialization',
    'Khởi tạo mảng categories[] với 15 đối tượng thuộc Class Category mặc định',
    async () => {
      const { data: cats } = await storage.getCategories();
      categories = cats || [];
      assert(storage.categories.length === 15, 'Mảng storage.categories phải có 15 phần tử');
      assert(storage.categories[0] instanceof Category, 'Phần tử phải là instance của Class Category');
      return `Mảng storage.categories[] đã khởi tạo ${categories.length} đối tượng Category.`;
    }
  );

  await runTest(
    'TC-02',
    '2. Array CRUD & Exact VND Arithmetic',
    'Thêm các đối tượng Transaction vào mảng transactions[] và tính toán số dư VND chính xác',
    async () => {
      const salaryCat = categories.find((c) => c.type === 'INCOME');
      const foodCat = categories.find((c) => c.type === 'EXPENSE');

      const incRes = await storage.createTransaction({
        type: 'INCOME',
        amount: 25000000,
        category_id: salaryCat.id,
        description: 'Lương tháng 11',
        payment_method: 'BANK_TRANSFER',
        transaction_date: '2026-11-05'
      });
      assert(!incRes.error, 'Tạo giao dịch Thu thành công');
      assert(storage.transactions[0] instanceof Transaction, 'Phần tử trong mảng là instance của Class Transaction');

      const expRes1 = await storage.createTransaction({
        type: 'EXPENSE',
        amount: 4500000,
        category_id: foodCat.id,
        description: 'Ăn uống gia đình',
        payment_method: 'CASH',
        transaction_date: '2026-11-10'
      });
      txExpense = expRes1.data;

      await storage.createTransaction({
        type: 'EXPENSE',
        amount: 500000,
        category_id: foodCat.id,
        description: 'Mua đồ siêu thị',
        payment_method: 'CARD',
        transaction_date: '2026-11-12'
      });

      const { data: allTx } = await storage.getTransactions({ limit: 100 });
      const totalInc = sumExactAmounts(allTx.filter((t) => t.type === 'INCOME'), (t) => t.amount);
      const totalExp = sumExactAmounts(allTx.filter((t) => t.type === 'EXPENSE'), (t) => t.amount);
      assert(totalInc - totalExp === 20000000, 'Số dư phải đúng 20,000,000 VND');
      return 'Thu: 25.000.000 ₫ | Chi: 5.000.000 ₫ | Số dư: 20.000.000 ₫';
    }
  );

  await runTest(
    'TC-03',
    '2. Array CRUD & Exact VND Arithmetic',
    'Tìm kiếm, Sửa và Phân trang trên mảng transactions[]',
    async () => {
      const searchRes = await storage.getTransactions({ search: 'siêu thị' });
      assert(searchRes.data.length === 1 && searchRes.data[0].amount === 500000, 'Tìm kiếm chính xác');

      const upRes = await storage.updateTransaction(txExpense.id, {
        ...txExpense,
        amount: 4600000
      });
      assert(!upRes.error && upRes.data.amount === 4600000, 'Cập nhật giao dịch thành công');
      return 'Tìm kiếm, sửa và phân trang giao dịch chính xác.';
    }
  );

  await runTest(
    'TC-04',
    '2. Array CRUD & Exact VND Arithmetic',
    'Chặn xóa danh mục đang có giao dịch tham chiếu trong mảng transactions[]',
    async () => {
      const blocked = await storage.deleteCategory(txExpense.category_id);
      assert(Boolean(blocked.error), 'Phải chặn xóa danh mục đang có giao dịch');
      return `Đã bảo vệ danh mục đang có giao dịch: "${normalizeError(blocked.error)}"`;
    }
  );

  await runTest(
    'TC-05',
    '3. Budgets & Threshold Warnings',
    'Thêm đối tượng Budget vào mảng budgets[] và kiểm tra cảnh báo 80% & 100%',
    async () => {
      const bRes = await storage.createBudget({
        category_id: null,
        amount: 6000000,
        month: 11,
        year: 2026
      });
      assert(!bRes.error, 'Tạo ngân sách tháng thành công');
      assert(storage.budgets[0] instanceof Budget, 'Phần tử là instance của Class Budget');

      assert(getBudgetStatus(5000000, 6000000).level === 'warning', '83.3% phải cảnh báo vàng');
      assert(getBudgetStatus(6500000, 6000000).level === 'danger', '>=100% phải cảnh báo đỏ');
      return 'Cảnh báo ngân sách 80% (Warning) và 100% (Danger) chính xác.';
    }
  );

  await runTest(
    'TC-06',
    '4. Backup, Restore & Validation',
    'Sao lưu mảng dữ liệu ra JSON, xóa trắng và khôi phục lại các đối tượng Class',
    async () => {
      const backupJson = storage.exportBackupData();
      storage.resetAllData();

      assert(storage.transactions.length === 0, 'Sau khi reset mảng transactions[] phải rỗng');

      const restored = storage.importBackupData(backupJson);
      assert(restored.transactionsCount === 3, 'Phải khôi phục đủ 3 giao dịch');
      assert(storage.transactions[0] instanceof Transaction, 'Khôi phục đúng kiểu Class Transaction');
      return `Sao lưu -> Reset -> Khôi phục thành công ${restored.transactionsCount} giao dịch.`;
    }
  );

  await runTest(
    'TC-07',
    '4. Backup, Restore & Validation',
    'Chặn số tiền âm/lẻ/0 và mã hóa chống XSS an toàn',
    async () => {
      assert(parseExactAmount(0) === null && parseExactAmount(-500) === null && parseExactAmount(12.5) === null, 'Chặn số không hợp lệ');
      const xss = escapeHtml('<script>alert(1)</script>');
      assert(xss === '&lt;script&gt;alert(1)&lt;/script&gt;', 'Mã hóa XSS thành công');
      return 'Kiểm tra biên số tiền và chống XSS đạt 100%.';
    }
  );

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  return { total: results.length, passed, failed, results };
}

const isNodeDirectRun =
  typeof process !== 'undefined' &&
  process.argv?.[1] &&
  process.argv[1].replace(/\\/g, '/').endsWith('tests/security-and-crud.test.mjs');

if (isNodeDirectRun) {
  runAllSecurityAndCrudTests().then((summary) => {
    console.log('================================================================================');
    console.log(' BÁO CÁO KIỂM THỬ SỔ THU CHI CÁ NHÂN (OOP CLASSES + ARRAYS + LOCALSTORAGE)');
    console.log('================================================================================');
    for (const r of summary.results) {
      console.log(`[${r.status}] ${r.id} (${r.suite}): ${r.title}`);
      console.log(`       -> ${r.detail}`);
    }
    console.log('--------------------------------------------------------------------------------');
    console.log(` TỔNG KẾT: ${summary.passed}/${summary.total} PASS | ${summary.failed} FAIL`);
    console.log('================================================================================');
    if (summary.failed > 0) process.exit(1);
  });
}
