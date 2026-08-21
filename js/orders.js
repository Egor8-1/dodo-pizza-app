// ============================================================
//  ДОДО ПИЦЦА 2.0 — ЗАКАЗЫ КЛИЕНТА
//  Чёрный фон + оранжевый акцент
// ============================================================

// ===== ПОЛУЧИТЬ СТАТУС =====
function getStatusLabel(status) {
  const map = {
    Новый: { label: "Новый", class: "status-new" },
    Готовится: { label: "Готовится", class: "status-cooking" },
    "Готов к выдаче": { label: "Готов к выдаче", class: "status-ready" },
    Выдан: { label: "Выдан", class: "status-done" },
  };
  return map[status] || { label: status, class: "" };
}

function getStatusEmoji(status) {
  const map = {
    Новый: "🟡",
    Готовится: "🟠",
    "Готов к выдаче": "🟢",
    Выдан: "✅",
  };
  return map[status] || "⚪";
}

// ===== ОТРИСОВАТЬ ЗАКАЗЫ =====
async function renderOrders() {
  const container = document.getElementById("content");
  if (!container) return;

  const user = getCurrentUser();
  if (!user) {
    container.innerHTML = `
      <div class="orders">
        <h1 class="orders__title">📋 Мои заказы</h1>
        <div style="text-align:center; padding:40px 0; color:#666;">
          <p style="font-size:20px; margin-bottom:8px;">🔒</p>
          <p>Для просмотра заказов авторизуйтесь</p>
          <button class="btn btn--primary" onclick="document.getElementById('authModal').classList.add('active')" style="margin-top:12px;">
            🔑 Войти
          </button>
        </div>
      </div>
    `;
    return;
  }

  try {
    const allOrders = await getOrders();
    const userOrders = allOrders
      .filter((o) => o.userId === user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (userOrders.length === 0) {
      container.innerHTML = `
        <div class="orders">
          <h1 class="orders__title">📋 Мои заказы</h1>
          <div style="text-align:center; padding:40px 0; color:#666;">
            <p style="font-size:40px; margin-bottom:12px;">📭</p>
            <p>У вас пока нет заказов</p>
            <button class="btn btn--primary" onclick="navigateTo('catalog')" style="margin-top:12px;">
              🍕 Перейти в каталог
            </button>
          </div>
        </div>
      `;
      return;
    }

    const products = await getProducts();
    const points = await getPickupPoints();

    let html = `
      <div class="orders">
        <h1 class="orders__title">📋 Мои заказы</h1>
    `;

    for (const order of userOrders) {
      const status = getStatusLabel(order.status);
      const emoji = getStatusEmoji(order.status);
      const point = points.find((p) => p.id === order.pickupPointId);

      const itemsHtml = order.items
        .map((item) => {
          const product = products.find((p) => p.id === item.productId);
          return `${product ? product.name : "Товар"} × ${item.quantity}`;
        })
        .join("; ");

      html += `
        <div class="order-card" onclick="showOrderTracking(${order.id})">
          <div class="order-card__header">
            <span class="order-card__id">${emoji} Заказ #${order.id}</span>
            <span class="status-badge ${status.class}">${status.label}</span>
          </div>
          <div class="order-card__items">${itemsHtml}</div>
          <div class="order-card__meta">
            📍 ${point ? point.name : "Неизвестный пункт"}
            ${order.comment ? `💬 ${order.comment}` : ""}
          </div>
          <div class="order-card__total">${order.total} ₽</div>
          <div class="order-card__meta" style="margin-top:4px;">
            📅 ${new Date(order.createdAt).toLocaleString()}
            ${order.status === "Выдан" ? `✅ Выдан: ${new Date(order.updatedAt).toLocaleString()}` : ""}
          </div>
        </div>
      `;
    }

    html += `
        <div style="text-align:center; margin-top:16px;">
          <button class="btn btn--secondary" onclick="navigateTo('catalog')">← Вернуться в каталог</button>
        </div>
      </div>
    `;

    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = `<p style="color:#dc3545;">❌ Ошибка загрузки заказов: ${error.message}</p>`;
  }
}

// ===== ОТСЛЕЖИВАНИЕ ЗАКАЗА =====
async function showOrderTracking(orderId) {
  try {
    const order = await getOrder(orderId);
    const products = await getProducts();
    const points = await getPickupPoints();

    const status = getStatusLabel(order.status);
    const emoji = getStatusEmoji(order.status);
    const point = points.find((p) => p.id === order.pickupPointId);

    const statuses = ["Новый", "Готовится", "Готов к выдаче", "Выдан"];
    const currentIndex = statuses.indexOf(order.status);

    let stepsHtml = statuses
      .map((s, index) => {
        let cls = "dot";
        if (index < currentIndex) cls += " done";
        else if (index === currentIndex) cls += " active";

        let labelCls = "label";
        if (index <= currentIndex) labelCls += " active";

        const emojiMap = {
          Новый: "🟡",
          Готовится: "🟠",
          "Готов к выдаче": "🟢",
          Выдан: "✅",
        };

        return `
        <div class="tracking__step">
          <div class="${cls}"></div>
          <span class="${labelCls}">${emojiMap[s]} ${s}</span>
        </div>
      `;
      })
      .join("");

    const itemsHtml = order.items
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return `
        <div class="detail-row">
          <span>${product ? product.name : "Товар"} × ${item.quantity}</span>
          <span>${item.price * item.quantity} ₽</span>
        </div>
      `;
      })
      .join("");

    const container = document.getElementById("content");
    container.innerHTML = `
      <div class="tracking">
        <h1>📦 Заказ #${order.id}</h1>
        <p style="color:#888; margin-bottom:16px;">Отслеживание статуса</p>

        <div class="tracking__bar">
          ${stepsHtml}
        </div>

        <div style="margin:20px 0; padding:12px 16px; background:#1a1a1a; border:1px solid #2a2a2a; border-radius:8px; max-width:500px;">
          <strong style="color:#fff;">Текущий статус:</strong>
          <span class="status-badge ${status.class}" style="font-size:16px; padding:4px 18px;">
            ${emoji} ${status.label}
          </span>
          ${order.status === "Готов к выдаче" ? '<div style="margin-top:8px; color:#28a745; font-weight:500;">✅ Заказ готов! Заберите в пункте выдачи.</div>' : ""}
          ${order.status === "Выдан" ? '<div style="margin-top:8px; color:#888;">✅ Заказ выдан. Спасибо, что выбрали Додо Пиццу!</div>' : ""}
        </div>

        <div class="tracking__order-details">
          <h3 style="color:#fff; margin-bottom:8px;">📋 Детали заказа</h3>
          ${itemsHtml}
          <div class="detail-row" style="border-top:2px solid #2a2a2a; padding-top:8px; margin-top:8px; font-weight:700; font-size:16px;">
            <span style="color:#fff;">Итого</span>
            <span style="color:#F37321;">${order.total} ₽</span>
          </div>
          <div class="detail-row" style="margin-top:8px; font-size:13px; color:#666;">
            <span>📍 ${point ? point.name : "Неизвестный пункт"}</span>
            <span>${point ? point.address : ""}</span>
          </div>
          ${order.comment ? `<div class="detail-row" style="font-size:13px; color:#666;"><span>💬 ${order.comment}</span></div>` : ""}
          <div class="detail-row" style="font-size:12px; color:#444;">
            <span>📅 ${new Date(order.createdAt).toLocaleString()}</span>
          </div>
        </div>

        <div style="margin-top:20px; display:flex; gap:12px; flex-wrap:wrap;">
          <button class="btn btn--secondary" onclick="navigateTo('orders')">← Вернуться к заказам</button>
          <button class="btn btn--primary" onclick="navigateTo('catalog')">🍕 В каталог</button>
          <button class="btn btn--outline" onclick="window.print()">🖨️ Распечатать</button>
        </div>
      </div>
    `;
  } catch (error) {
    alert("❌ Ошибка загрузки заказа: " + error.message);
  }
}

// ===== ЭКСПОРТ =====
window.renderOrders = renderOrders;
window.showOrderTracking = showOrderTracking;
