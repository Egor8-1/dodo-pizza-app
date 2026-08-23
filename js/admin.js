// ============================================================
//  ДОДО ПИЦЦА 2.0 — АДМИН-ПАНЕЛЬ
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

// ===== ПРОВЕРКА ДОСТУПА =====
function checkAdminAccess() {
  const user = getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "kitchen")) {
    alert(
      "⛔ Доступ запрещен. Требуются права администратора или сотрудника кухни.",
    );
    window.location.href = "index.html";
    return false;
  }
  return true;
}

// ============================================================
//  ИНИЦИАЛИЗАЦИЯ АДМИНКИ
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  if (!checkAdminAccess()) return;

  const user = getCurrentUser();
  const adminUserEl = document.getElementById("adminUser");
  if (adminUserEl) adminUserEl.textContent = user.name || user.login;

  // Навигация
  document.querySelectorAll(".admin-sidebar__link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const page = link.dataset.page;

      document
        .querySelectorAll(".admin-sidebar__link")
        .forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      switch (page) {
        case "dashboard":
          renderDashboard();
          break;
        case "kitchen":
          renderKitchenMode();
          break;
        case "orders":
          renderAllOrders();
          break;
        case "reports":
          renderReports();
          break;
        case "products":
          renderProductsManagement();
          break;
        case "points":
          renderPointsManagement();
          break;
        case "users":
          renderUsersManagement();
          break;
        default:
          renderDashboard();
      }
    });
  });

  // Выход
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  // По умолчанию — дашборд
  renderDashboard();
});

// ============================================================
//  DASHBOARD
// ============================================================

async function renderDashboard() {
  const container = document.getElementById("adminContent");
  if (!container) return;

  try {
    const orders = await getOrders();
    const products = await getProducts();
    const users = await getUsers();

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const newOrders = orders.filter((o) => o.status === "Новый").length;
    const readyOrders = orders.filter(
      (o) => o.status === "Готов к выдаче",
    ).length;

    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    let recentHtml = recentOrders
      .map((o) => {
        const user = users.find((u) => u.id === o.userId);
        const status = getStatusLabel(o.status);
        return `
        <tr>
          <td style="padding:8px 12px; color:#fff;">#${o.id}</td>
          <td style="padding:8px 12px; color:#ccc;">${user ? user.name : "Неизвестно"}</td>
          <td style="padding:8px 12px; color:#F37321;">${o.total} ₽</td>
          <td style="padding:8px 12px;"><span class="status-badge ${status.class}">${status.label}</span></td>
        </tr>
      `;
      })
      .join("");

    container.innerHTML = `
      <div class="dashboard">
        <h1 style="font-size:24px; font-weight:700; color:#fff; margin-bottom:20px;">📊 Главная</h1>

        <div class="dashboard__stats">
          <div class="stat-card">
            <div class="stat-card__label">Всего заказов</div>
            <div class="stat-card__value">${totalOrders}</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__label">Выручка</div>
            <div class="stat-card__value orange">${totalRevenue} ₽</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__label">Новых заказов</div>
            <div class="stat-card__value" style="color:#e65100;">${newOrders}</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__label">Готовы к выдаче</div>
            <div class="stat-card__value green">${readyOrders}</div>
          </div>
        </div>

        <div style="background:#1a1a1a; border:1px solid #2a2a2a; padding:20px 24px; border-radius:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
            <h3 style="font-size:16px; font-weight:700; color:#fff;">📋 Последние заказы</h3>
            <button class="btn btn--outline btn--small" onclick="window.print()">🖨️ Печать</button>
          </div>
          ${
            recentOrders.length === 0
              ? '<p style="color:#666;">Нет заказов</p>'
              : `
            <div class="admin-table-wrap">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Клиент</th>
                    <th>Сумма</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>${recentHtml}</tbody>
              </table>
            </div>
          `
          }
        </div>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `<p style="color:#dc3545;">❌ Ошибка: ${error.message}</p>`;
  }
}

// ============================================================
//  KITCHEN MODE
// ============================================================

let kitchenFilter = "Все";

async function renderKitchenMode(filterStatus = null) {
  if (filterStatus !== null) kitchenFilter = filterStatus;
  const container = document.getElementById("adminContent");
  if (!container) return;

  try {
    const orders = await getOrders();
    const products = await getProducts();
    const points = await getPickupPoints();

    const statuses = ["Все", "Новый", "Готовится", "Готов к выдаче", "Выдан"];

    let filtered = orders;
    if (kitchenFilter !== "Все") {
      filtered = orders.filter((o) => o.status === kitchenFilter);
    }

    const priority = { Новый: 0, Готовится: 1, "Готов к выдаче": 2, Выдан: 3 };
    filtered.sort((a, b) => priority[a.status] - priority[b.status]);

    const counts = {};
    statuses.forEach((s) => {
      if (s === "Все") counts[s] = orders.length;
      else counts[s] = orders.filter((o) => o.status === s).length;
    });

    let html = `
      <div class="kitchen">
        <h1 style="font-size:24px; font-weight:700; color:#fff; margin-bottom:8px;">👨‍🍳 Режим кухни</h1>
        <p style="color:#888; margin-bottom:20px;">Управление статусами заказов в реальном времени</p>

        <div class="kitchen__tabs">
    `;

    statuses.forEach((s) => {
      const active = s === kitchenFilter ? "active" : "";
      const count = counts[s] || 0;
      html += `
        <button class="kitchen__tab ${active}" onclick="renderKitchenMode('${s}')">
          ${s} <span class="count">${count}</span>
        </button>
      `;
    });

    html += `
        </div>
    `;

    if (filtered.length === 0) {
      html += `<p style="color:#666; padding:20px 0;">Нет заказов с выбранным статусом</p>`;
    } else {
      for (const order of filtered) {
        const status = getStatusLabel(order.status);
        const point = points.find((p) => p.id === order.pickupPointId);

        const itemsHtml = order.items
          .map((item) => {
            const product = products.find((p) => p.id === item.productId);
            return `${product ? product.name : "Товар"} × ${item.quantity}`;
          })
          .join(", ");

        html += `
          <div class="kitchen__order">
            <div class="kitchen__order-info">
              <div class="kitchen__order-id">Заказ #${order.id}</div>
              <div class="kitchen__order-items">${itemsHtml}</div>
              <div class="kitchen__order-meta">
                📍 ${point ? point.name : "Неизвестный пункт"}
                ${order.comment ? `💬 ${order.comment}` : ""}
              </div>
              <div class="kitchen__order-meta">
                📅 ${new Date(order.createdAt).toLocaleString()}
              </div>
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
              <span class="status-badge ${status.class}" style="font-size:14px;">${status.label}</span>
              <div class="kitchen__order-actions">
                ${order.status === "Новый" ? `<button class="btn btn--warning" onclick="updateOrderStatus(${order.id}, 'Готовится')">👨‍🍳 Взять в работу</button>` : ""}
                ${order.status === "Готовится" ? `<button class="btn btn--success" onclick="updateOrderStatus(${order.id}, 'Готов к выдаче')">✅ Приготовлено</button>` : ""}
                ${order.status === "Готов к выдаче" ? `<button class="btn btn--primary" onclick="updateOrderStatus(${order.id}, 'Выдан')">📦 Выдать</button>` : ""}
              </div>
            </div>
          </div>
        `;
      }
    }

    html += `
        <div style="margin-top:16px; display:flex; gap:12px; flex-wrap:wrap;">
          <button class="btn btn--secondary" onclick="renderDashboard()">← На главную</button>
          <button class="btn btn--outline" onclick="window.print()">🖨️ Печать</button>
        </div>
      </div>
    `;

    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = `<p style="color:#dc3545;">❌ Ошибка: ${error.message}</p>`;
  }
}

// ===== ОБНОВЛЕНИЕ СТАТУСА =====
async function updateOrderStatus(orderId, newStatus) {
  try {
    const order = await getOrder(orderId);
    order.status = newStatus;
    order.updatedAt = new Date().toISOString();
    await updateOrder(orderId, order);
    renderKitchenMode();
  } catch (error) {
    alert("❌ Ошибка обновления статуса: " + error.message);
  }
}

// ============================================================
//  ALL ORDERS
// ============================================================

async function renderAllOrders() {
  const container = document.getElementById("adminContent");
  if (!container) return;

  try {
    const orders = await getOrders();
    const users = await getUsers();
    const points = await getPickupPoints();

    let html = `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:20px;">
          <h1 style="font-size:24px; font-weight:700; color:#fff;">📋 Все заказы</h1>
          <button class="btn btn--outline" onclick="window.print()">🖨️ Печать</button>
        </div>

        <div class="filter-bar">
          <div class="form-group">
            <label>Поиск</label>
            <input type="text" id="orderSearch" placeholder="ID или клиент..." oninput="filterOrdersTable()" />
          </div>
          <div class="form-group">
            <label>Статус</label>
            <select id="orderStatusFilter" onchange="filterOrdersTable()">
              <option value="Все">Все</option>
              <option value="Новый">Новый</option>
              <option value="Готовится">Готовится</option>
              <option value="Готов к выдаче">Готов к выдаче</option>
              <option value="Выдан">Выдан</option>
            </select>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:13px; color:#888;">Всего: ${orders.length}</span>
          </div>
        </div>

        <div class="admin-table-wrap">
          <table class="admin-table" id="ordersTable">
            <thead>
              <tr>
                <th>ID</th>
                <th>Клиент</th>
                <th>Сумма</th>
                <th>Пункт</th>
                <th>Статус</th>
                <th>Дата</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
    `;

    for (const order of orders) {
      const user = users.find((u) => u.id === order.userId);
      const point = points.find((p) => p.id === order.pickupPointId);
      const status = getStatusLabel(order.status);

      html += `
        <tr data-status="${order.status}" data-search="${order.id} ${user ? user.name : ""} ${user ? user.login : ""}">
          <td style="color:#fff;">#${order.id}</td>
          <td style="color:#ccc;">${user ? user.name : "Неизвестно"}</td>
          <td style="color:#F37321;">${order.total} ₽</td>
          <td style="color:#888;">${point ? point.name.substring(0, 20) + "..." : "Неизвестно"}</td>
          <td><span class="status-badge ${status.class}">${status.label}</span></td>
          <td style="color:#666;">${new Date(order.createdAt).toLocaleDateString()}</td>
          <td>
            <button class="btn btn--danger btn--small" onclick="deleteOrderItem(${order.id})">🗑️</button>
          </td>
        </tr>
      `;
    }

    html += `
            </tbody>
          </table>
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

// ===== ФИЛЬТР =====
function filterOrdersTable() {
  const search =
    document.getElementById("orderSearch")?.value?.toLowerCase() || "";
  const statusFilter =
    document.getElementById("orderStatusFilter")?.value || "Все";

  const rows = document.querySelectorAll("#ordersTable tbody tr");
  rows.forEach((row) => {
    const status = row.dataset.status || "";
    const searchData = row.dataset.search || "";

    const matchStatus = statusFilter === "Все" || status === statusFilter;
    const matchSearch =
      search === "" || searchData.toLowerCase().includes(search);

    row.style.display = matchStatus && matchSearch ? "" : "none";
  });
}

// ===== УДАЛИТЬ ЗАКАЗ =====
async function deleteOrderItem(orderId) {
  if (!confirm(`Удалить заказ #${orderId}?`)) return;
  try {
    await deleteOrder(orderId);
    renderAllOrders();
  } catch (error) {
    alert("❌ Ошибка удаления: " + error.message);
  }
}

// ============================================================
//  PRODUCTS MANAGEMENT
// ============================================================

async function renderProductsManagement() {
  const container = document.getElementById("adminContent");
  if (!container) return;

  try {
    const products = await getProducts();

    let html = `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:20px;">
          <h1 style="font-size:24px; font-weight:700; color:#fff;">📦 Управление товарами</h1>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button class="btn btn--primary" onclick="showAddProduct()">➕ Добавить товар</button>
            <button class="btn btn--outline" onclick="window.print()">🖨️ Печать</button>
          </div>
        </div>

        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Название</th>
                <th>Категория</th>
                <th>Цена</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
    `;

    products.forEach((p) => {
      html += `
        <tr>
          <td style="color:#fff;">${p.id}</td>
          <td style="color:#ccc;">${p.image || "🍕"} ${p.name}</td>
          <td style="color:#888;">${p.category}</td>
          <td style="color:#F37321;">${p.price} ₽</td>
          <td>
            <button class="btn btn--warning btn--small" onclick="showEditProduct(${p.id})">✏️</button>
            <button class="btn btn--danger btn--small" onclick="deleteProductItem(${p.id})">🗑️</button>
          </td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
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

// ===== SHOW ADD PRODUCT =====
function showAddProduct() {
  document.getElementById("productModalTitle").textContent =
    "➕ Добавление товара";
  document.getElementById("productId").value = "";
  document.getElementById("prodName").value = "";
  document.getElementById("prodCategory").value = "Пицца";
  document.getElementById("prodPrice").value = "";
  document.getElementById("prodDesc").value = "";
  document.getElementById("prodImage").value = "🍕";
  document.getElementById("productModal").classList.add("active");
}

// ===== SHOW EDIT PRODUCT =====
async function showEditProduct(id) {
  try {
    const product = await getProduct(id);
    document.getElementById("productModalTitle").textContent =
      "✏️ Редактирование товара";
    document.getElementById("productId").value = product.id;
    document.getElementById("prodName").value = product.name;
    document.getElementById("prodCategory").value = product.category;
    document.getElementById("prodPrice").value = product.price;
    document.getElementById("prodDesc").value = product.description || "";
    document.getElementById("prodImage").value = product.image || "🍕";
    document.getElementById("productModal").classList.add("active");
  } catch (error) {
    alert("❌ Ошибка загрузки товара: " + error.message);
  }
}

// ===== SAVE PRODUCT =====
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("productForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("productId").value;
      const data = {
        name: document.getElementById("prodName").value.trim(),
        category: document.getElementById("prodCategory").value,
        price: parseInt(document.getElementById("prodPrice").value),
        description: document.getElementById("prodDesc").value.trim(),
        image: document.getElementById("prodImage").value.trim() || "🍕",
      };

      try {
        if (id) {
          await updateProduct(parseInt(id), data);
        } else {
          await createProduct(data);
        }
        document.getElementById("productModal").classList.remove("active");
        renderProductsManagement();
      } catch (error) {
        alert("❌ Ошибка сохранения: " + error.message);
      }
    });
  }

  const closeProduct = document.getElementById("closeProductModal");
  if (closeProduct) {
    closeProduct.onclick = () =>
      document.getElementById("productModal").classList.remove("active");
  }
});

// ===== DELETE PRODUCT =====
async function deleteProductItem(id) {
  if (!confirm("Удалить товар?")) return;
  try {
    await deleteProduct(id);
    renderProductsManagement();
  } catch (error) {
    alert("❌ Ошибка удаления: " + error.message);
  }
}

// ============================================================
//  POINTS MANAGEMENT
// ============================================================

async function renderPointsManagement() {
  const container = document.getElementById("adminContent");
  if (!container) return;

  try {
    const points = await getPickupPoints();

    let html = `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:20px;">
          <h1 style="font-size:24px; font-weight:700; color:#fff;">📍 Пункты выдачи</h1>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button class="btn btn--primary" onclick="showAddPoint()">➕ Добавить пункт</button>
            <button class="btn btn--outline" onclick="window.print()">🖨️ Печать</button>
          </div>
        </div>

        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Название</th>
                <th>Адрес</th>
                <th>Телефон</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
    `;

    points.forEach((p) => {
      html += `
        <tr>
          <td style="color:#fff;">${p.id}</td>
          <td style="color:#ccc;">${p.name}</td>
          <td style="color:#888;">${p.address}</td>
          <td style="color:#888;">${p.phone || "-"}</td>
          <td>
            <button class="btn btn--warning btn--small" onclick="showEditPoint(${p.id})">✏️</button>
            <button class="btn btn--danger btn--small" onclick="deletePointItem(${p.id})">🗑️</button>
          </td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
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

// ===== SHOW ADD POINT =====
function showAddPoint() {
  document.getElementById("pointModalTitle").textContent =
    "➕ Добавление пункта";
  document.getElementById("pointId").value = "";
  document.getElementById("pointName").value = "";
  document.getElementById("pointAddress").value = "";
  document.getElementById("pointPhone").value = "";
  document.getElementById("pointModal").classList.add("active");
}

// ===== SHOW EDIT POINT =====
async function showEditPoint(id) {
  try {
    const point = await getPickupPoint(id);
    document.getElementById("pointModalTitle").textContent =
      "✏️ Редактирование пункта";
    document.getElementById("pointId").value = point.id;
    document.getElementById("pointName").value = point.name;
    document.getElementById("pointAddress").value = point.address;
    document.getElementById("pointPhone").value = point.phone || "";
    document.getElementById("pointModal").classList.add("active");
  } catch (error) {
    alert("❌ Ошибка загрузки пункта: " + error.message);
  }
}

// ===== SAVE POINT =====
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("pointForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("pointId").value;
      const data = {
        name: document.getElementById("pointName").value.trim(),
        address: document.getElementById("pointAddress").value.trim(),
        phone: document.getElementById("pointPhone").value.trim(),
      };

      try {
        if (id) {
          await updatePickupPoint(parseInt(id), data);
        } else {
          await createPickupPoint(data);
        }
        document.getElementById("pointModal").classList.remove("active");
        renderPointsManagement();
      } catch (error) {
        alert("❌ Ошибка сохранения: " + error.message);
      }
    });
  }

  const closePoint = document.getElementById("closePointModal");
  if (closePoint) {
    closePoint.onclick = () =>
      document.getElementById("pointModal").classList.remove("active");
  }
});

// ===== DELETE POINT =====
async function deletePointItem(id) {
  if (!confirm("Удалить пункт выдачи?")) return;
  try {
    await deletePickupPoint(id);
    renderPointsManagement();
  } catch (error) {
    alert("❌ Ошибка удаления: " + error.message);
  }
}

// ============================================================
//  USERS MANAGEMENT
// ============================================================

async function renderUsersManagement() {
  const container = document.getElementById("adminContent");
  if (!container) return;

  try {
    const users = await getUsers();

    let html = `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:20px;">
          <h1 style="font-size:24px; font-weight:700; color:#fff;">👥 Управление пользователями</h1>
          <button class="btn btn--outline" onclick="window.print()">🖨️ Печать</button>
        </div>

        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Имя</th>
                <th>Логин</th>
                <th>Роль</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
    `;

    const roleEmoji = {
      admin: "🛡️",
      kitchen: "👨‍🍳",
      client: "👤",
    };

    const roleName = {
      admin: "Администратор",
      kitchen: "Кухня",
      client: "Клиент",
    };

    users.forEach((u) => {
      html += `
        <tr>
          <td style="color:#fff;">${u.id}</td>
          <td style="color:#ccc;">${u.name || u.login}</td>
          <td style="color:#888;">${u.login}</td>
          <td style="color:#888;">${roleEmoji[u.role] || ""} ${roleName[u.role] || u.role}</td>
          <td>
            <button class="btn btn--danger btn--small" onclick="deleteUserItem(${u.id})">🗑️</button>
          </td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
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

// ===== DELETE USER =====
async function deleteUserItem(id) {
  const user = getCurrentUser();
  if (user && user.id === id) {
    alert("⛔ Нельзя удалить самого себя!");
    return;
  }
  if (!confirm("Удалить пользователя?")) return;
  try {
    const response = await fetch(`${getApiUrl()}/users/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Ошибка удаления");
    renderUsersManagement();
  } catch (error) {
    alert("❌ Ошибка удаления: " + error.message);
  }
}

// ===== ЭКСПОРТ =====
window.renderDashboard = renderDashboard;
window.renderKitchenMode = renderKitchenMode;
window.renderAllOrders = renderAllOrders;
window.renderProductsManagement = renderProductsManagement;
window.renderPointsManagement = renderPointsManagement;
window.renderUsersManagement = renderUsersManagement;
window.updateOrderStatus = updateOrderStatus;
window.deleteOrderItem = deleteOrderItem;
window.deleteProductItem = deleteProductItem;
window.deletePointItem = deletePointItem;
window.deleteUserItem = deleteUserItem;
window.showAddProduct = showAddProduct;
window.showEditProduct = showEditProduct;
window.showAddPoint = showAddPoint;
window.showEditPoint = showEditPoint;
window.filterOrdersTable = filterOrdersTable;
