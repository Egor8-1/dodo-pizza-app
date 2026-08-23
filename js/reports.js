
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

// ===== ГЛАВНЫЙ ОТЧЁТ =====
async function renderReports() {
  const container = document.getElementById("adminContent");
  if (!container) return;

  try {
    const orders = await getOrders();
    const products = await getProducts();
    const points = await getPickupPoints();

    // ===== ОСНОВНЫЕ ПОКАЗАТЕЛИ =====
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const avgCheck =
      totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // ===== СТАТУСЫ =====
    const statusStats = {};
    orders.forEach((o) => {
      statusStats[o.status] = (statusStats[o.status] || 0) + 1;
    });

    // ===== ПУНКТЫ ВЫДАЧИ =====
    const pointStats = {};
    orders.forEach((o) => {
      const point = points.find((p) => p.id === o.pickupPointId);
      const name = point ? point.name : "Неизвестно";
      if (!pointStats[name]) {
        pointStats[name] = { orders: 0, revenue: 0 };
      }
      pointStats[name].orders += 1;
      pointStats[name].revenue += o.total;
    });
    const pointEntries = Object.entries(pointStats).sort(
      (a, b) => b[1].orders - a[1].orders,
    );

    // ===== ТОП ТОВАРОВ =====
    const productStats = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        const name = product ? product.name : "Товар #" + item.productId;
        if (!productStats[name]) {
          productStats[name] = { quantity: 0, revenue: 0 };
        }
        productStats[name].quantity += item.quantity;
        productStats[name].revenue += item.price * item.quantity;
      });
    });

    const topProducts = Object.entries(productStats)
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .slice(0, 5);

    const maxQuantity = topProducts.length > 0 ? topProducts[0][1].quantity : 1;

    // ===== ВЫРУЧКА ПО ПЕРИОДАМ =====
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const revenueToday = orders
      .filter((o) => new Date(o.createdAt) >= today)
      .reduce((sum, o) => sum + o.total, 0);

    const revenueWeek = orders
      .filter((o) => new Date(o.createdAt) >= weekAgo)
      .reduce((sum, o) => sum + o.total, 0);

    const revenueMonth = orders
      .filter((o) => new Date(o.createdAt) >= monthAgo)
      .reduce((sum, o) => sum + o.total, 0);

    // ===== СТРОИМ HTML =====
    let html = `
      <div class="reports">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:20px;">
          <h1>📈 Отчёты</h1>
          <button class="btn btn--outline" onclick="window.print()">🖨️ Печать</button>
        </div>

        <!-- Основные показатели -->
        <div class="dashboard__stats">
          <div class="stat-card">
            <div class="stat-card__label">Всего заказов</div>
            <div class="stat-card__value">${totalOrders}</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__label">Общая выручка</div>
            <div class="stat-card__value orange">${totalRevenue} ₽</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__label">Средний чек</div>
            <div class="stat-card__value">${avgCheck} ₽</div>
          </div>
        </div>

        <!-- Статусы заказов -->
        <div class="reports__section">
          <h3>📊 Статусы заказов</h3>
          <div style="display:flex; gap:16px; flex-wrap:wrap; margin-top:8px;">
    `;

    const statusColors = {
      Новый: "#ffc107",
      Готовится: "#F37321",
      "Готов к выдаче": "#28a745",
      Выдан: "#9e9e9e",
    };

    Object.entries(statusStats).forEach(([status, count]) => {
      const color = statusColors[status] || "#6c757d";
      html += `
        <div style="padding:12px 20px; background:#0d0d0d; border:1px solid #2a2a2a; border-radius:8px; border-left:4px solid ${color}; min-width:100px;">
          <div style="font-size:12px; color:#888;">${status}</div>
          <div style="font-size:24px; font-weight:700; color:#fff;">${count}</div>
        </div>
      `;
    });

    html += `
          </div>
        </div>

        <!-- Топ товаров -->
        <div class="reports__section">
          <h3>🏆 Топ-5 популярных товаров</h3>
    `;

    if (topProducts.length === 0) {
      html += `<p style="color:#666; margin-top:8px;">Нет данных о продажах</p>`;
    } else {
      topProducts.forEach(([name, stats], index) => {
        const percent = Math.round((stats.quantity / maxQuantity) * 100);
        html += `
          <div class="top-product">
            <span class="rank">#${index + 1}</span>
            <span class="name">${name}</span>
            <span class="count">${stats.quantity} шт</span>
            <div class="bar">
              <div class="fill" style="width:${percent}%;"></div>
            </div>
            <span class="revenue">${stats.revenue} ₽</span>
          </div>
        `;
      });
    }

    html += `
        </div>

        <!-- Пункты выдачи -->
        <div class="reports__section">
          <h3>📍 Статистика по пунктам выдачи</h3>
    `;

    if (pointEntries.length === 0) {
      html += `<p style="color:#666; margin-top:8px;">Нет данных по пунктам</p>`;
    } else {
      html += `
        <table style="width:100%; border-collapse:collapse; margin-top:8px;">
          <thead>
            <tr style="border-bottom:2px solid #2a2a2a;">
              <th style="text-align:left; padding:8px 0; font-size:13px; color:#888;">Пункт</th>
              <th style="text-align:left; padding:8px 0; font-size:13px; color:#888;">Заказов</th>
              <th style="text-align:left; padding:8px 0; font-size:13px; color:#888;">Выручка</th>
            </tr>
          </thead>
          <tbody>
      `;

      pointEntries.forEach(([name, stats]) => {
        html += `
          <tr style="border-bottom:1px solid #2a2a2a;">
            <td style="padding:8px 0; color:#ccc;">${name}</td>
            <td style="padding:8px 0; color:#888;">${stats.orders}</td>
            <td style="padding:8px 0; color:#F37321; font-weight:600;">${stats.revenue} ₽</td>
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
      `;
    }

    html += `
        </div>

        <!-- Выручка по периодам -->
        <div class="reports__section">
          <h3>📅 Выручка по периодам</h3>
          <div style="display:flex; gap:20px; flex-wrap:wrap; margin-top:8px;">
            <div style="padding:12px 20px; background:#0d0d0d; border:1px solid #2a2a2a; border-radius:8px; min-width:120px;">
              <div style="font-size:12px; color:#888;">Сегодня</div>
              <div style="font-size:20px; font-weight:700; color:#F37321;">${revenueToday} ₽</div>
            </div>
            <div style="padding:12px 20px; background:#0d0d0d; border:1px solid #2a2a2a; border-radius:8px; min-width:120px;">
              <div style="font-size:12px; color:#888;">Неделя</div>
              <div style="font-size:20px; font-weight:700; color:#F37321;">${revenueWeek} ₽</div>
            </div>
            <div style="padding:12px 20px; background:#0d0d0d; border:1px solid #2a2a2a; border-radius:8px; min-width:120px;">
              <div style="font-size:12px; color:#888;">Месяц</div>
              <div style="font-size:20px; font-weight:700; color:#F37321;">${revenueMonth} ₽</div>
            </div>
          </div>
        </div>

        <div style="margin-top:16px;">
          <button class="btn btn--secondary" onclick="renderDashboard()">← На главную</button>
        </div>
      </div>
    `;

    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = `<p style="color:#dc3545;">❌ Ошибка загрузки отчётов: ${error.message}</p>`;
  }
}

// ===== ЭКСПОРТ =====
window.renderReports = renderReports;
