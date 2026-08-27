// ============================================================
//  ДОДО ПИЦЦА 2.0 — ОТЧЕТЫ С ТАБЛИЦАМИ И PDF
//  Чёрный фон + оранжевый акцент
// ============================================================

// ===== СТАТУСЫ =====
function getStatusLabel(status) {
  const map = {
    'Новый': { label: 'Новый', class: 'status-new' },
    'Готовится': { label: 'Готовится', class: 'status-cooking' },
    'Готов к выдаче': { label: 'Готов к выдаче', class: 'status-ready' },
    'Выдан': { label: 'Выдан', class: 'status-done' }
  };
  return map[status] || { label: status, class: '' };
}

// ===== ОСНОВНОЙ ОТЧЕТ =====
async function renderReports() {
  const container = document.getElementById('adminContent');
  if (!container) return;

  try {
    const orders = await getOrders();
    const products = await getProducts();
    const points = await getPickupPoints();
    const users = await getUsers();

    // ============================================
    // 1. ФИНАНСОВЫЙ ОТЧЕТ
    // ============================================
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const avgCheck = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // ============================================
    // 2. ПО СТАТУСАМ
    // ============================================
    const statusStats = {};
    orders.forEach(o => {
      statusStats[o.status] = (statusStats[o.status] || 0) + 1;
    });

    // ============================================
    // 3. ПО ПУНКТАМ ВЫДАЧИ
    // ============================================
    const pointStats = {};
    orders.forEach(o => {
      const point = points.find(p => p.id === o.pickupPointId);
      const name = point ? point.name : 'Неизвестно';
      if (!pointStats[name]) {
        pointStats[name] = { orders: 0, revenue: 0 };
      }
      pointStats[name].orders += 1;
      pointStats[name].revenue += o.total;
    });
    const pointEntries = Object.entries(pointStats).sort((a, b) => b[1].orders - a[1].orders);

    // ============================================
    // 4. ТОП-10 ТОВАРОВ
    // ============================================
    const productStats = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const name = product ? product.name : 'Товар #' + item.productId;
        if (!productStats[name]) {
          productStats[name] = { quantity: 0, revenue: 0 };
        }
        productStats[name].quantity += item.quantity;
        productStats[name].revenue += item.price * item.quantity;
      });
    });
    const topProducts = Object.entries(productStats)
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .slice(0, 10);
    const maxQuantity = topProducts.length > 0 ? topProducts[0][1].quantity : 1;

    // ============================================
    // 5. ПО ПЕРИОДАМ
    // ============================================
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const revenueToday = orders
      .filter(o => new Date(o.createdAt) >= today)
      .reduce((sum, o) => sum + o.total, 0);
    const revenueWeek = orders
      .filter(o => new Date(o.createdAt) >= weekAgo)
      .reduce((sum, o) => sum + o.total, 0);
    const revenueMonth = orders
      .filter(o => new Date(o.createdAt) >= monthAgo)
      .reduce((sum, o) => sum + o.total, 0);

    const ordersToday = orders.filter(o => new Date(o.createdAt) >= today).length;
    const ordersWeek = orders.filter(o => new Date(o.createdAt) >= weekAgo).length;
    const ordersMonth = orders.filter(o => new Date(o.createdAt) >= monthAgo).length;

    // ============================================
    // 6. ПО СОТРУДНИКАМ (кто оформил заказы)
    // ============================================
    const userStats = {};
    orders.forEach(o => {
      const user = users.find(u => u.id === o.userId);
      const name = user ? user.name : 'Неизвестно';
      if (!userStats[name]) {
        userStats[name] = { orders: 0, revenue: 0 };
      }
      userStats[name].orders += 1;
      userStats[name].revenue += o.total;
    });
    const userEntries = Object.entries(userStats).sort((a, b) => b[1].orders - a[1].orders);

    // ============================================
    // СТРОИМ HTML
    // ============================================
    let html = `
      <div class="reports">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:20px;">
          <h1 style="color:#fff; font-size:24px; font-weight:700;">📈 Отчеты</h1>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button class="btn btn--primary" onclick="exportAllPDF()">📄 Экспорт все PDF</button>
            <button class="btn btn--outline" onclick="window.print()">🖨️ Печать</button>
          </div>
        </div>

        <!-- 1. ФИНАНСОВЫЙ ОТЧЕТ -->
        <div class="reports__section" id="report-finance">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
            <h3>💰 Финансовый отчет</h3>
            <button class="btn btn--outline btn--small" onclick="exportPDFFinance()">📄 PDF</button>
          </div>
          <table style="width:100%; border-collapse:collapse; margin-top:8px;">
            <thead>
              <tr style="border-bottom:2px solid #2a2a2a;">
                <th style="text-align:left; padding:8px 0; font-size:13px; color:#888;">Показатель</th>
                <th style="text-align:right; padding:8px 0; font-size:13px; color:#888;">Значение</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom:1px solid #2a2a2a;">
                <td style="padding:8px 0; color:#ccc;">Всего заказов</td>
                <td style="padding:8px 0; color:#fff; text-align:right;">${totalOrders}</td>
              </tr>
              <tr style="border-bottom:1px solid #2a2a2a;">
                <td style="padding:8px 0; color:#ccc;">Общая выручка</td>
                <td style="padding:8px 0; color:#F37321; text-align:right; font-weight:700;">${totalRevenue} ₽</td>
              </tr>
              <tr style="border-bottom:1px solid #2a2a2a;">
                <td style="padding:8px 0; color:#ccc;">Средний чек</td>
                <td style="padding:8px 0; color:#fff; text-align:right;">${avgCheck} ₽</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 2. ПО СТАТУСАМ -->
        <div class="reports__section" id="report-status">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
            <h3>📊 Заказы по статусам</h3>
            <button class="btn btn--outline btn--small" onclick="exportPDFStatus()">📄 PDF</button>
          </div>
          <table style="width:100%; border-collapse:collapse; margin-top:8px;">
            <thead>
              <tr style="border-bottom:2px solid #2a2a2a;">
                <th style="text-align:left; padding:8px 0; font-size:13px; color:#888;">Статус</th>
                <th style="text-align:right; padding:8px 0; font-size:13px; color:#888;">Количество</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(statusStats).map(([status, count]) => {
                const statusObj = getStatusLabel(status);
                return `
                  <tr style="border-bottom:1px solid #2a2a2a;">
                    <td style="padding:8px 0; color:#ccc;"><span class="status-badge ${statusObj.class}">${statusObj.label}</span></td>
                    <td style="padding:8px 0; color:#fff; text-align:right;">${count}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- 3. ПО ПУНКТАМ ВЫДАЧИ -->
        <div class="reports__section" id="report-points">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
            <h3>📍 Заказы по пунктам выдачи</h3>
            <button class="btn btn--outline btn--small" onclick="exportPDFPoints()">📄 PDF</button>
          </div>
          ${pointEntries.length === 0 ? '<p style="color:#666;">Нет данных</p>' : `
            <table style="width:100%; border-collapse:collapse; margin-top:8px;">
              <thead>
                <tr style="border-bottom:2px solid #2a2a2a;">
                  <th style="text-align:left; padding:8px 0; font-size:13px; color:#888;">Пункт выдачи</th>
                  <th style="text-align:right; padding:8px 0; font-size:13px; color:#888;">Заказов</th>
                  <th style="text-align:right; padding:8px 0; font-size:13px; color:#888;">Выручка</th>
                </tr>
              </thead>
              <tbody>
                ${pointEntries.map(([name, stats]) => `
                  <tr style="border-bottom:1px solid #2a2a2a;">
                    <td style="padding:8px 0; color:#ccc;">${name}</td>
                    <td style="padding:8px 0; color:#fff; text-align:right;">${stats.orders}</td>
                    <td style="padding:8px 0; color:#F37321; text-align:right; font-weight:600;">${stats.revenue} ₽</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>

        <!-- 4. ТОП-10 ТОВАРОВ -->
        <div class="reports__section" id="report-products">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
            <h3>🏆 Топ-10 популярных товаров</h3>
            <button class="btn btn--outline btn--small" onclick="exportPDFProducts()">📄 PDF</button>
          </div>
          ${topProducts.length === 0 ? '<p style="color:#666;">Нет данных</p>' : `
            <table style="width:100%; border-collapse:collapse; margin-top:8px;">
              <thead>
                <tr style="border-bottom:2px solid #2a2a2a;">
                  <th style="text-align:left; padding:8px 0; font-size:13px; color:#888;">#</th>
                  <th style="text-align:left; padding:8px 0; font-size:13px; color:#888;">Товар</th>
                  <th style="text-align:right; padding:8px 0; font-size:13px; color:#888;">Кол-во</th>
                  <th style="text-align:right; padding:8px 0; font-size:13px; color:#888;">Выручка</th>
                  <th style="text-align:right; padding:8px 0; font-size:13px; color:#888;">%</th>
                </tr>
              </thead>
              <tbody>
                ${topProducts.map(([name, stats], index) => {
                  const percent = Math.round((stats.quantity / maxQuantity) * 100);
                  return `
                    <tr style="border-bottom:1px solid #2a2a2a;">
                      <td style="padding:8px 0; color:#F37321; font-weight:700;">${index + 1}</td>
                      <td style="padding:8px 0; color:#ccc;">${name}</td>
                      <td style="padding:8px 0; color:#fff; text-align:right;">${stats.quantity}</td>
                      <td style="padding:8px 0; color:#F37321; text-align:right; font-weight:600;">${stats.revenue} ₽</td>
                      <td style="padding:8px 0; color:#888; text-align:right;">
                        <div style="display:inline-block; width:60px; height:8px; background:#2a2a2a; border-radius:4px; overflow:hidden; vertical-align:middle;">
                          <div style="height:100%; width:${percent}%; background:#F37321; border-radius:4px;"></div>
                        </div>
                        <span style="margin-left:6px;">${percent}%</span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `}
        </div>

        <!-- 5. ПО ПЕРИОДАМ -->
        <div class="reports__section" id="report-periods">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
            <h3>📅 Выручка по периодам</h3>
            <button class="btn btn--outline btn--small" onclick="exportPDFPeriods()">📄 PDF</button>
          </div>
          <table style="width:100%; border-collapse:collapse; margin-top:8px;">
            <thead>
              <tr style="border-bottom:2px solid #2a2a2a;">
                <th style="text-align:left; padding:8px 0; font-size:13px; color:#888;">Период</th>
                <th style="text-align:right; padding:8px 0; font-size:13px; color:#888;">Заказов</th>
                <th style="text-align:right; padding:8px 0; font-size:13px; color:#888;">Выручка</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom:1px solid #2a2a2a;">
                <td style="padding:8px 0; color:#ccc;">Сегодня</td>
                <td style="padding:8px 0; color:#fff; text-align:right;">${ordersToday}</td>
                <td style="padding:8px 0; color:#F37321; text-align:right; font-weight:600;">${revenueToday} ₽</td>
              </tr>
              <tr style="border-bottom:1px solid #2a2a2a;">
                <td style="padding:8px 0; color:#ccc;">Неделя</td>
                <td style="padding:8px 0; color:#fff; text-align:right;">${ordersWeek}</td>
                <td style="padding:8px 0; color:#F37321; text-align:right; font-weight:600;">${revenueWeek} ₽</td>
              </tr>
              <tr style="border-bottom:1px solid #2a2a2a;">
                <td style="padding:8px 0; color:#ccc;">Месяц</td>
                <td style="padding:8px 0; color:#fff; text-align:right;">${ordersMonth}</td>
                <td style="padding:8px 0; color:#F37321; text-align:right; font-weight:600;">${revenueMonth} ₽</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 6. ПО СОТРУДНИКАМ -->
        <div class="reports__section" id="report-users">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
            <h3>👥 Заказы по сотрудникам</h3>
            <button class="btn btn--outline btn--small" onclick="exportPDFUsers()">📄 PDF</button>
          </div>
          ${userEntries.length === 0 ? '<p style="color:#666;">Нет данных</p>' : `
            <table style="width:100%; border-collapse:collapse; margin-top:8px;">
              <thead>
                <tr style="border-bottom:2px solid #2a2a2a;">
                  <th style="text-align:left; padding:8px 0; font-size:13px; color:#888;">Сотрудник</th>
                  <th style="text-align:right; padding:8px 0; font-size:13px; color:#888;">Заказов</th>
                  <th style="text-align:right; padding:8px 0; font-size:13px; color:#888;">Выручка</th>
                </tr>
              </thead>
              <tbody>
                ${userEntries.map(([name, stats]) => `
                  <tr style="border-bottom:1px solid #2a2a2a;">
                    <td style="padding:8px 0; color:#ccc;">${name}</td>
                    <td style="padding:8px 0; color:#fff; text-align:right;">${stats.orders}</td>
                    <td style="padding:8px 0; color:#F37321; text-align:right; font-weight:600;">${stats.revenue} ₽</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>

        <div style="margin-top:16px;">
          <button class="btn btn--secondary" onclick="renderDashboard()">← На главную</button>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // ===== СОХРАНЯЕМ ДАННЫЕ ДЛЯ PDF =====
    window._reportData = {
      orders, products, points, users,
      totalOrders, totalRevenue, avgCheck,
      statusStats, pointEntries, topProducts, maxQuantity,
      revenueToday, revenueWeek, revenueMonth,
      ordersToday, ordersWeek, ordersMonth,
      userEntries
    };

  } catch (error) {
    container.innerHTML = `<p style="color:#dc3545;">❌ Ошибка загрузки отчетов: ${error.message}</p>`;
  }
}

// ============================================================
//  ФУНКЦИИ ЭКСПОРТА PDF
// ============================================================

function getPDFData() {
  return window._reportData || {};
}

function generatePDF(title, headers, rows, filename) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('landscape', 'mm', 'a4');

  // ===== ИСПОЛЬЗУЕМ СТАНДАРТНЫЙ ШРИФТ С ПОДДЕРЖКОЙ КИРИЛЛИЦЫ =====
  doc.setFont('helvetica', 'normal');

  // Заголовок (русский через unicode)
  doc.setFontSize(18);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.text('Додо Пицца — автоматизированная система заказов', 14, 28);
  doc.text('Сгенерирован: ' + new Date().toLocaleString('ru-RU'), 14, 34);

  // Таблица
  doc.autoTable({
    head: [headers],
    body: rows,
    startY: 42,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [243, 115, 33], textColor: [255, 255, 255], fontSize: 9 },
    alternateRowStyles: { fillColor: [240, 240, 240] }
  });

  doc.save(filename + '.pdf');
}

// ===== 1. ФИНАНСЫ =====
function exportPDFFinance() {
  const d = getPDFData();
  if (!d.totalOrders) { alert('Нет данных для отчета'); return; }
  generatePDF(
    '💰 Финансовый отчет',
    ['Показатель', 'Значение'],
    [
      ['Всего заказов', d.totalOrders],
      ['Общая выручка', d.totalRevenue + ' ₽'],
      ['Средний чек', d.avgCheck + ' ₽']
    ],
    'Финансовый_отчет'
  );
}

// ===== 2. СТАТУСЫ =====
function exportPDFStatus() {
  const d = getPDFData();
  if (!d.statusStats || Object.keys(d.statusStats).length === 0) { alert('Нет данных'); return; }
  const rows = Object.entries(d.statusStats).map(([status, count]) => {
    const label = getStatusLabel(status).label;
    return [label, count];
  });
  generatePDF('📊 Заказы по статусам', ['Статус', 'Количество'], rows, 'Отчет_по_статусам');
}

// ===== 3. ПУНКТЫ =====
function exportPDFPoints() {
  const d = getPDFData();
  if (!d.pointEntries || d.pointEntries.length === 0) { alert('Нет данных'); return; }
  const rows = d.pointEntries.map(([name, stats]) => [name, stats.orders, stats.revenue + ' ₽']);
  generatePDF('📍 Заказы по пунктам выдачи', ['Пункт выдачи', 'Заказов', 'Выручка'], rows, 'Отчет_по_пунктам');
}

// ===== 4. ТОВАРЫ =====
function exportPDFProducts() {
  const d = getPDFData();
  if (!d.topProducts || d.topProducts.length === 0) { alert('Нет данных'); return; }
  const rows = d.topProducts.map(([name, stats], i) => [i + 1, name, stats.quantity, stats.revenue + ' ₽']);
  generatePDF('🏆 Топ-10 популярных товаров', ['#', 'Товар', 'Кол-во', 'Выручка'], rows, 'Отчет_по_товарам');
}

// ===== 5. ПЕРИОДЫ =====
function exportPDFPeriods() {
  const d = getPDFData();
  if (!d.revenueToday && !d.revenueWeek && !d.revenueMonth) { alert('Нет данных'); return; }
  const rows = [
    ['Сегодня', d.ordersToday || 0, d.revenueToday + ' ₽'],
    ['Неделя', d.ordersWeek || 0, d.revenueWeek + ' ₽'],
    ['Месяц', d.ordersMonth || 0, d.revenueMonth + ' ₽']
  ];
  generatePDF('📅 Выручка по периодам', ['Период', 'Заказов', 'Выручка'], rows, 'Отчет_по_периодам');
}

// ===== 6. СОТРУДНИКИ =====
function exportPDFUsers() {
  const d = getPDFData();
  if (!d.userEntries || d.userEntries.length === 0) { alert('Нет данных'); return; }
  const rows = d.userEntries.map(([name, stats]) => [name, stats.orders, stats.revenue + ' ₽']);
  generatePDF('👥 Заказы по сотрудникам', ['Сотрудник', 'Заказов', 'Выручка'], rows, 'Отчет_по_сотрудникам');
}

// ===== ВСЕ ОТЧЕТЫ =====
function exportAllPDF() {
  exportPDFFinance();
  setTimeout(exportPDFStatus, 300);
  setTimeout(exportPDFPoints, 600);
  setTimeout(exportPDFProducts, 900);
  setTimeout(exportPDFPeriods, 1200);
  setTimeout(exportPDFUsers, 1500);
}

// ===== ЭКСПОРТ =====
window.renderReports = renderReports;
window.exportPDFFinance = exportPDFFinance;
window.exportPDFStatus = exportPDFStatus;
window.exportPDFPoints = exportPDFPoints;
window.exportPDFProducts = exportPDFProducts;
window.exportPDFPeriods = exportPDFPeriods;
window.exportPDFUsers = exportPDFUsers;
window.exportAllPDF = exportAllPDF;
// ===== ЭКСПОРТ =====
window.renderReports = renderReports;
