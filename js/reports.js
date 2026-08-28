// ============================================================
//  ДОДО ПИЦЦА 2.0 — ОТЧЕТЫ С ЭКСПОРТОМ В PDF
//  Работает с русским языком через html2pdf
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

// ============================================================
//  ЭКСПОРТ В PDF
// ============================================================
function exportReportToPDF(reportId, title) {
  const element = document.getElementById(reportId);
  if (!element) {
    alert('❌ Отчет не найден');
    return;
  }

  // Клонируем
  const clone = element.cloneNode(true);
  
  // Убираем все кнопки из клона
  const buttons = clone.querySelectorAll('button');
  buttons.forEach(btn => btn.remove());

  // Убираем лишние стили, которые ломают PDF
  const style = document.createElement('style');
  style.textContent = `
    body { font-family: 'Roboto', sans-serif; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #F37321; color: #fff; }
    tr:nth-child(even) { background: #f9f9f9; }
    .status-badge { padding: 3px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-block; }
    .status-new { background: #fff3cd; color: #856404; }
    .status-cooking { background: #ffe0b2; color: #e65100; }
    .status-ready { background: #c8e6c9; color: #1e7e34; }
    .status-done { background: #e0e0e0; color: #555; }
    h3 { color: #1a1a1a; }
    .reports__section { padding: 16px; background: #fff; border-radius: 8px; margin-bottom: 16px; }
  `;
  clone.prepend(style);

  // Настройки PDF
  const opt = {
    margin: [10, 10, 10, 10],
    filename: title + '.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'landscape'
    }
  };

  // Меняем текст кнопки
  const btn = event?.target;
  if (btn) {
    btn.textContent = '⏳ Генерация...';
    btn.disabled = true;
  }

  html2pdf()
    .set(opt)
    .from(clone)
    .save()
    .then(() => {
      if (btn) {
        btn.textContent = '📄 PDF';
        btn.disabled = false;
      }
    })
    .catch((err) => {
      console.error('❌ Ошибка PDF:', err);
      alert('❌ Ошибка генерации PDF: ' + err.message);
      if (btn) {
        btn.textContent = '📄 PDF';
        btn.disabled = false;
      }
    });
}

// ============================================================
//  ОСНОВНОЙ ОТЧЕТ
// ============================================================
async function renderReports() {
  const container = document.getElementById('adminContent');
  if (!container) return;

  try {
    const orders = await getOrders();
    const products = await getProducts();
    const points = await getPickupPoints();
    const users = await getUsers();

    // ===== 1. ФИНАНСЫ =====
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const avgCheck = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // ===== 2. СТАТУСЫ =====
    const statusStats = {};
    orders.forEach(o => {
      statusStats[o.status] = (statusStats[o.status] || 0) + 1;
    });

    // ===== 3. ПУНКТЫ =====
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

    // ===== 4. ТОП-10 ТОВАРОВ =====
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

    // ===== 5. ПЕРИОДЫ =====
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const revenueToday = orders.filter(o => new Date(o.createdAt) >= today).reduce((sum, o) => sum + o.total, 0);
    const revenueWeek = orders.filter(o => new Date(o.createdAt) >= weekAgo).reduce((sum, o) => sum + o.total, 0);
    const revenueMonth = orders.filter(o => new Date(o.createdAt) >= monthAgo).reduce((sum, o) => sum + o.total, 0);
    const ordersToday = orders.filter(o => new Date(o.createdAt) >= today).length;
    const ordersWeek = orders.filter(o => new Date(o.createdAt) >= weekAgo).length;
    const ordersMonth = orders.filter(o => new Date(o.createdAt) >= monthAgo).length;

    // ===== 6. СОТРУДНИКИ =====
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

    // ============================================================
    //  СТРОИМ HTML
    // ============================================================
    let html = `
      <div class="reports">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:20px;">
          <h1 style="color:#fff; font-size:24px; font-weight:700;">📈 Отчеты</h1>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button class="btn btn--primary" onclick="exportAllReports()">📄 Все отчеты PDF</button>
            <button class="btn btn--outline" onclick="window.print()">🖨️ Печать</button>
          </div>
        </div>

        <!-- 1. ФИНАНСЫ -->
        <div class="reports__section" id="report-finance">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
            <h3 style="color:#fff;">💰 Финансовый отчет</h3>
            <button class="btn btn--outline btn--small" onclick="exportReportToPDF('report-finance', 'Финансовый_отчет')">📄 PDF</button>
          </div>
          <table>
            <thead><tr><th>Показатель</th><th>Значение</th></tr></thead>
            <tbody>
              <tr><td>Всего заказов</td><td>${totalOrders}</td></tr>
              <tr><td>Общая выручка</td><td><strong>${totalRevenue} ₽</strong></td></tr>
              <tr><td>Средний чек</td><td>${avgCheck} ₽</td></tr>
            </tbody>
          </table>
        </div>

        <!-- 2. СТАТУСЫ -->
        <div class="reports__section" id="report-status">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
            <h3 style="color:#fff;">📊 Заказы по статусам</h3>
            <button class="btn btn--outline btn--small" onclick="exportReportToPDF('report-status', 'Отчет_по_статусам')">📄 PDF</button>
          </div>
          <table>
            <thead><tr><th>Статус</th><th>Количество</th></tr></thead>
            <tbody>
              ${Object.entries(statusStats).map(([status, count]) => {
                const s = getStatusLabel(status);
                return `<tr><td><span class="status-badge ${s.class}">${s.label}</span></td><td>${count}</td></tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- 3. ПУНКТЫ -->
        <div class="reports__section" id="report-points">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
            <h3 style="color:#fff;">📍 Заказы по пунктам выдачи</h3>
            <button class="btn btn--outline btn--small" onclick="exportReportToPDF('report-points', 'Отчет_по_пунктам')">📄 PDF</button>
          </div>
          ${pointEntries.length === 0 ? '<p style="color:#666;">Нет данных</p>' : `
            <table>
              <thead><tr><th>Пункт выдачи</th><th>Заказов</th><th>Выручка</th></tr></thead>
              <tbody>
                ${pointEntries.map(([name, stats]) => `
                  <tr><td>${name}</td><td>${stats.orders}</td><td><strong>${stats.revenue} ₽</strong></td></tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>

        <!-- 4. ТОП-10 ТОВАРОВ -->
        <div class="reports__section" id="report-products">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
            <h3 style="color:#fff;">🏆 Топ-10 популярных товаров</h3>
            <button class="btn btn--outline btn--small" onclick="exportReportToPDF('report-products', 'Отчет_по_товарам')">📄 PDF</button>
          </div>
          ${topProducts.length === 0 ? '<p style="color:#666;">Нет данных</p>' : `
            <table>
              <thead><tr><th>#</th><th>Товар</th><th>Кол-во</th><th>Выручка</th></tr></thead>
              <tbody>
                ${topProducts.map(([name, stats], index) => `
                  <tr><td>${index + 1}</td><td>${name}</td><td>${stats.quantity}</td><td><strong>${stats.revenue} ₽</strong></td></tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>

        <!-- 5. ПЕРИОДЫ -->
        <div class="reports__section" id="report-periods">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
            <h3 style="color:#fff;">📅 Выручка по периодам</h3>
            <button class="btn btn--outline btn--small" onclick="exportReportToPDF('report-periods', 'Отчет_по_периодам')">📄 PDF</button>
          </div>
          <table>
            <thead><tr><th>Период</th><th>Заказов</th><th>Выручка</th></tr></thead>
            <tbody>
              <tr><td>Сегодня</td><td>${ordersToday}</td><td><strong>${revenueToday} ₽</strong></td></tr>
              <tr><td>Неделя</td><td>${ordersWeek}</td><td><strong>${revenueWeek} ₽</strong></td></tr>
              <tr><td>Месяц</td><td>${ordersMonth}</td><td><strong>${revenueMonth} ₽</strong></td></tr>
            </tbody>
          </table>
        </div>

        <!-- 6. СОТРУДНИКИ -->
        <div class="reports__section" id="report-users">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
            <h3 style="color:#fff;">👥 Заказы по сотрудникам</h3>
            <button class="btn btn--outline btn--small" onclick="exportReportToPDF('report-users', 'Отчет_по_сотрудникам')">📄 PDF</button>
          </div>
          ${userEntries.length === 0 ? '<p style="color:#666;">Нет данных</p>' : `
            <table>
              <thead><tr><th>Сотрудник</th><th>Заказов</th><th>Выручка</th></tr></thead>
              <tbody>
                ${userEntries.map(([name, stats]) => `
                  <tr><td>${name}</td><td>${stats.orders}</td><td><strong>${stats.revenue} ₽</strong></td></tr>
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

  } catch (error) {
    container.innerHTML = `<p style="color:#dc3545;">❌ Ошибка: ${error.message}</p>`;
  }
}

// ============================================================
//  ВСЕ ОТЧЕТЫ СРАЗУ
// ============================================================
function exportAllReports() {
  const reports = [
    { id: 'report-finance', name: 'Финансовый_отчет' },
    { id: 'report-status', name: 'Отчет_по_статусам' },
    { id: 'report-points', name: 'Отчет_по_пунктам' },
    { id: 'report-products', name: 'Отчет_по_товарам' },
    { id: 'report-periods', name: 'Отчет_по_периодам' },
    { id: 'report-users', name: 'Отчет_по_сотрудникам' }
  ];

  let delay = 0;
  reports.forEach(r => {
    setTimeout(() => {
      exportReportToPDF(r.id, r.name);
    }, delay);
    delay += 500;
  });
}

// ===== ЭКСПОРТ =====
window.renderReports = renderReports;
window.exportReportToPDF = exportReportToPDF;
window.exportAllReports = exportAllReports;
window.getStatusLabel = getStatusLabel;
// ===== ЭКСПОРТ =====
window.renderReports = renderReports;
