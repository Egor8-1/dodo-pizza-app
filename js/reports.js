// ============================================================
//  ДОДО ПИЦЦА 2.0 — ОТЧЕТЫ С ЭКСПОРТОМ В PDF
//  Русский язык через встроенный шрифт
// ============================================================

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
//  ЭКСПОРТ В PDF — РАБОТАЕТ С РУССКИМ!
// ============================================================

function exportReportToPDF(reportId, title) {
  const element = document.getElementById(reportId);
  if (!element) {
    alert('❌ Отчет не найден');
    return;
  }

  // Собираем данные из таблицы
  const table = element.querySelector('table');
  if (!table) {
    alert('❌ Таблица не найдена');
    return;
  }

  // Получаем заголовки и строки
  const headers = [];
  const rows = [];

  // Заголовки
  const ths = table.querySelectorAll('thead th');
  ths.forEach(th => headers.push(th.textContent.trim()));

  // Строки
  const trs = table.querySelectorAll('tbody tr');
  trs.forEach(tr => {
    const row = [];
    const tds = tr.querySelectorAll('td');
    tds.forEach(td => {
      // Убираем вложенные HTML (статус-бейджи)
      let text = td.textContent.trim();
      // Если есть strong — берем его текст
      const strong = td.querySelector('strong');
      if (strong) text = strong.textContent.trim();
      row.push(text);
    });
    if (row.length > 0) rows.push(row);
  });

  if (headers.length === 0 || rows.length === 0) {
    alert('❌ Нет данных для экспорта');
    return;
  }

  // ===== СОЗДАЕМ PDF =====
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('landscape', 'mm', 'a4');

  // ===== РУССКИЙ ШРИФТ ЧЕРЕЗ UNICODE =====
  function ru(text) {
    return unescape(encodeURIComponent(text));
  }

  doc.setFont('helvetica', 'normal');

  // Заголовок
  doc.setFontSize(18);
  doc.text(ru(title), 14, 20);

  doc.setFontSize(10);
  doc.text(ru('Додо Пицца — автоматизированная система заказов'), 14, 28);
  doc.text(ru('Сгенерирован: ' + new Date().toLocaleString('ru-RU')), 14, 34);

  // Таблица
  doc.autoTable({
    head: [headers.map(ru)],
    body: rows.map(row => row.map(ru)),
    startY: 42,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      font: 'helvetica'
    },
    headStyles: {
      fillColor: [243, 115, 33],
      textColor: [255, 255, 255],
      fontSize: 9,
      font: 'helvetica'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    }
  });

  // Сохраняем
  doc.save(title + '.pdf');

  // Визуальный фидбек
  const btn = event?.target;
  if (btn) {
    btn.textContent = '✅ PDF готов';
    setTimeout(() => {
      btn.textContent = '📄 PDF';
    }, 2000);
  }
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

    // Финансы
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const avgCheck = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Статусы
    const statusStats = {};
    orders.forEach(o => {
      statusStats[o.status] = (statusStats[o.status] || 0) + 1;
    });

    // Пункты
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

    // Топ-10 товаров
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

    // Периоды
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

    // Сотрудники
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
        <div class="reports__section" id="report-finance" style="background:#1a1a1a; border:1px solid #2a2a2a; padding:20px; border-radius:12px; margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
            <h3 style="color:#fff;">💰 Финансовый отчет</h3>
            <button class="btn btn--outline btn--small" onclick="exportReportToPDF('report-finance', 'Финансовый_отчет')">📄 PDF</button>
          </div>
          <table style="width:100%; border-collapse:collapse; color:#ccc;">
            <thead>
              <tr style="border-bottom:2px solid #2a2a2a;">
                <th style="text-align:left; padding:8px 0; color:#888;">Показатель</th>
                <th style="text-align:right; padding:8px 0; color:#888;">Значение</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom:1px solid #2a2a2a;">
                <td style="padding:8px 0;">Всего заказов</td>
                <td style="padding:8px 0; text-align:right; color:#fff;">${totalOrders}</td>
              </tr>
              <tr style="border-bottom:1px solid #2a2a2a;">
                <td style="padding:8px 0;">Общая выручка</td>
                <td style="padding:8px 0; text-align:right; color:#F37321; font-weight:700;">${totalRevenue} ₽</td>
              </tr>
              <tr>
                <td style="padding:8px 0;">Средний чек</td>
                <td style="padding:8px 0; text-align:right; color:#fff;">${avgCheck} ₽</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 2. СТАТУСЫ -->
        <div class="reports__section" id="report-status" style="background:#1a1a1a; border:1px solid #2a2a2a; padding:20px; border-radius:12px; margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
            <h3 style="color:#fff;">📊 Заказы по статусам</h3>
            <button class="btn btn--outline btn--small" onclick="exportReportToPDF('report-status', 'Отчет_по_статусам')">📄 PDF</button>
          </div>
          <table style="width:100%; border-collapse:collapse; color:#ccc;">
            <thead>
              <tr style="border-bottom:2px solid #2a2a2a;">
                <th style="text-align:left; padding:8px 0; color:#888;">Статус</th>
                <th style="text-align:right; padding:8px 0; color:#888;">Количество</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(statusStats).map(([status, count]) => {
                const s = getStatusLabel(status);
                return `
                  <tr style="border-bottom:1px solid #2a2a2a;">
                    <td style="padding:8px 0;"><span class="status-badge ${s.class}">${s.label}</span></td>
                    <td style="padding:8px 0; text-align:right; color:#fff;">${count}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- 3. ПУНКТЫ -->
        <div class="reports__section" id="report-points" style="background:#1a1a1a; border:1px solid #2a2a2a; padding:20px; border-radius:12px; margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
            <h3 style="color:#fff;">📍 Заказы по пунктам выдачи</h3>
            <button class="btn btn--outline btn--small" onclick="exportReportToPDF('report-points', 'Отчет_по_пунктам')">📄 PDF</button>
          </div>
          ${pointEntries.length === 0 ? '<p style="color:#666;">Нет данных</p>' : `
            <table style="width:100%; border-collapse:collapse; color:#ccc;">
              <thead>
                <tr style="border-bottom:2px solid #2a2a2a;">
                  <th style="text-align:left; padding:8px 0; color:#888;">Пункт выдачи</th>
                  <th style="text-align:right; padding:8px 0; color:#888;">Заказов</th>
                  <th style="text-align:right; padding:8px 0; color:#888;">Выручка</th>
                </tr>
              </thead>
              <tbody>
                ${pointEntries.map(([name, stats]) => `
                  <tr style="border-bottom:1px solid #2a2a2a;">
                    <td style="padding:8px 0;">${name}</td>
                    <td style="padding:8px 0; text-align:right; color:#fff;">${stats.orders}</td>
                    <td style="padding:8px 0; text-align:right; color:#F37321; font-weight:600;">${stats.revenue} ₽</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>

        <!-- 4. ТОП-10 -->
        <div class="reports__section" id="report-products" style="background:#1a1a1a; border:1px solid #2a2a2a; padding:20px; border-radius:12px; margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
            <h3 style="color:#fff;">🏆 Топ-10 популярных товаров</h3>
            <button class="btn btn--outline btn--small" onclick="exportReportToPDF('report-products', 'Отчет_по_товарам')">📄 PDF</button>
          </div>
          ${topProducts.length === 0 ? '<p style="color:#666;">Нет данных</p>' : `
            <table style="width:100%; border-collapse:collapse; color:#ccc;">
              <thead>
                <tr style="border-bottom:2px solid #2a2a2a;">
                  <th style="text-align:left; padding:8px 0; color:#888;">#</th>
                  <th style="text-align:left; padding:8px 0; color:#888;">Товар</th>
                  <th style="text-align:right; padding:8px 0; color:#888;">Кол-во</th>
                  <th style="text-align:right; padding:8px 0; color:#888;">Выручка</th>
                </tr>
              </thead>
              <tbody>
                ${topProducts.map(([name, stats], index) => `
                  <tr style="border-bottom:1px solid #2a2a2a;">
                    <td style="padding:8px 0; color:#F37321; font-weight:700;">${index + 1}</td>
                    <td style="padding:8px 0;">${name}</td>
                    <td style="padding:8px 0; text-align:right; color:#fff;">${stats.quantity}</td>
                    <td style="padding:8px 0; text-align:right; color:#F37321; font-weight:600;">${stats.revenue} ₽</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>

        <!-- 5. ПЕРИОДЫ -->
        <div class="reports__section" id="report-periods" style="background:#1a1a1a; border:1px solid #2a2a2a; padding:20px; border-radius:12px; margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
            <h3 style="color:#fff;">📅 Выручка по периодам</h3>
            <button class="btn btn--outline btn--small" onclick="exportReportToPDF('report-periods', 'Отчет_по_периодам')">📄 PDF</button>
          </div>
          <table style="width:100%; border-collapse:collapse; color:#ccc;">
            <thead>
              <tr style="border-bottom:2px solid #2a2a2a;">
                <th style="text-align:left; padding:8px 0; color:#888;">Период</th>
                <th style="text-align:right; padding:8px 0; color:#888;">Заказов</th>
                <th style="text-align:right; padding:8px 0; color:#888;">Выручка</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom:1px solid #2a2a2a;">
                <td style="padding:8px 0;">Сегодня</td>
                <td style="padding:8px 0; text-align:right; color:#fff;">${ordersToday}</td>
                <td style="padding:8px 0; text-align:right; color:#F37321; font-weight:600;">${revenueToday} ₽</td>
              </tr>
              <tr style="border-bottom:1px solid #2a2a2a;">
                <td style="padding:8px 0;">Неделя</td>
                <td style="padding:8px 0; text-align:right; color:#fff;">${ordersWeek}</td>
                <td style="padding:8px 0; text-align:right; color:#F37321; font-weight:600;">${revenueWeek} ₽</td>
              </tr>
              <tr>
                <td style="padding:8px 0;">Месяц</td>
                <td style="padding:8px 0; text-align:right; color:#fff;">${ordersMonth}</td>
                <td style="padding:8px 0; text-align:right; color:#F37321; font-weight:600;">${revenueMonth} ₽</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 6. СОТРУДНИКИ -->
        <div class="reports__section" id="report-users" style="background:#1a1a1a; border:1px solid #2a2a2a; padding:20px; border-radius:12px; margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
            <h3 style="color:#fff;">👥 Заказы по сотрудникам</h3>
            <button class="btn btn--outline btn--small" onclick="exportReportToPDF('report-users', 'Отчет_по_сотрудникам')">📄 PDF</button>
          </div>
          ${userEntries.length === 0 ? '<p style="color:#666;">Нет данных</p>' : `
            <table style="width:100%; border-collapse:collapse; color:#ccc;">
              <thead>
                <tr style="border-bottom:2px solid #2a2a2a;">
                  <th style="text-align:left; padding:8px 0; color:#888;">Сотрудник</th>
                  <th style="text-align:right; padding:8px 0; color:#888;">Заказов</th>
                  <th style="text-align:right; padding:8px 0; color:#888;">Выручка</th>
                </tr>
              </thead>
              <tbody>
                ${userEntries.map(([name, stats]) => `
                  <tr style="border-bottom:1px solid #2a2a2a;">
                    <td style="padding:8px 0;">${name}</td>
                    <td style="padding:8px 0; text-align:right; color:#fff;">${stats.orders}</td>
                    <td style="padding:8px 0; text-align:right; color:#F37321; font-weight:600;">${stats.revenue} ₽</td>
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
