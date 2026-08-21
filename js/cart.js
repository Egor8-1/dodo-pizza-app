// ============================================================
//  ДОДО ПИЦЦА 2.0 — КОРЗИНА
//  Чёрный фон + оранжевый акцент
// ============================================================

// ===== СОСТОЯНИЕ =====
let cart = [];

// ===== ЗАГРУЗИТЬ КОРЗИНУ =====
function loadCart() {
  const saved = localStorage.getItem("dodoCart");
  if (saved) {
    try {
      cart = JSON.parse(saved);
      return cart;
    } catch (e) {
      cart = [];
    }
  }
  return cart;
}

// ===== СОХРАНИТЬ КОРЗИНУ =====
function saveCart() {
  localStorage.setItem("dodoCart", JSON.stringify(cart));
  updateCartCount();
}

// ===== ОБНОВИТЬ СЧЁТЧИК =====
function updateCartCount() {
  const total = cart.reduce((sum, item) => sum + item.quantity, 0);
  const el = document.getElementById("cartCount");
  if (el) el.textContent = total;
}

// ===== ДОБАВИТЬ В КОРЗИНУ =====
function addToCart(productId, quantity = 1) {
  const existing = cart.find((item) => item.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }
  saveCart();

  // Визуальный фидбек
  const btn = event?.target;
  if (btn) {
    const origText = btn.textContent;
    btn.textContent = "✅ Добавлено!";
    btn.style.background = "#28a745";
    setTimeout(() => {
      btn.textContent = origText;
      btn.style.background = "#F37321";
    }, 1000);
  }
}

// ===== УДАЛИТЬ ИЗ КОРЗИНЫ =====
function removeFromCart(productId) {
  cart = cart.filter((item) => item.productId !== productId);
  saveCart();
}

// ===== ИЗМЕНИТЬ КОЛИЧЕСТВО =====
function updateQuantity(productId, quantity) {
  if (quantity <= 0) {
    removeFromCart(productId);
    return;
  }
  const item = cart.find((item) => item.productId === productId);
  if (item) {
    item.quantity = quantity;
    saveCart();
  }
}

// ===== ОЧИСТИТЬ КОРЗИНУ =====
function clearCart() {
  cart = [];
  saveCart();
}

// ===== ПОЛУЧИТЬ ДЕТАЛИ КОРЗИНЫ =====
async function getCartDetails() {
  const products = await getProducts();
  const details = [];

  for (const item of cart) {
    const product = products.find((p) => p.id === item.productId);
    if (product) {
      details.push({
        ...item,
        name: product.name,
        price: product.price,
        image: product.image || "🍕",
        total: item.quantity * product.price,
      });
    }
  }

  return details;
}

// ===== ПОСЧИТАТЬ ИТОГО =====
function calculateTotal(details) {
  return details.reduce((sum, item) => sum + item.total, 0);
}

// ===== ОТРИСОВАТЬ КОРЗИНУ =====
async function renderCart() {
  const container = document.getElementById("content");
  if (!container) return;

  const cartItems = await getCartDetails();

  if (cartItems.length === 0) {
    container.innerHTML = `
      <div class="cart">
        <h1 class="cart__title">🛒 Корзина</h1>
        <div class="cart__empty">
          <span class="cart__empty-icon">🛒</span>
          <h2>Корзина пуста</h2>
          <p style="color:#666;">Добавьте товары из каталога</p>
          <button class="btn btn--primary" onclick="navigateTo('catalog')" style="margin-top:16px;">
            🍕 Перейти в каталог
          </button>
        </div>
      </div>
    `;
    return;
  }

  const total = calculateTotal(cartItems);

  let html = `
    <div class="cart">
      <h1 class="cart__title">🛒 Корзина</h1>
  `;

  cartItems.forEach((item) => {
    html += `
      <div class="cart__item">
        <div class="cart__item-info">
          <span style="font-size:28px;">${item.image}</span>
          <span class="cart__item-name">${item.name}</span>
          <div class="cart__item-quantity">
            <button onclick="updateQuantity(${item.productId}, ${item.quantity - 1}); renderCart();">−</button>
            <span>${item.quantity}</span>
            <button onclick="updateQuantity(${item.productId}, ${item.quantity + 1}); renderCart();">+</button>
          </div>
          <span style="color:#888;">${item.price} ₽</span>
        </div>
        <div class="cart__item-total">${item.total} ₽</div>
        <button class="cart__item-remove" onclick="removeFromCart(${item.productId}); renderCart();">✕</button>
      </div>
    `;
  });

  html += `
      <div class="cart__summary">
        <div class="cart__summary-row">
          <span>Товаров: ${cartItems.length}</span>
          <span>${total} ₽</span>
        </div>
        <div class="cart__summary-row total">
          <span>Итого</span>
          <span>${total} ₽</span>
        </div>
        <div class="cart__summary-actions">
          <button class="btn btn--primary" onclick="checkout()">📦 Оформить заказ</button>
          <button class="btn btn--danger" onclick="clearCart(); renderCart();">🧹 Очистить</button>
          <button class="btn btn--secondary" onclick="navigateTo('catalog')">← Продолжить покупки</button>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

// ===== ОФОРМЛЕНИЕ ЗАКАЗА =====
async function checkout() {
  const user = getCurrentUser();
  if (!user) {
    alert("⚠️ Для оформления заказа необходимо авторизоваться");
    document.getElementById("authModal").classList.add("active");
    return;
  }

  const points = await getPickupPoints();
  if (points.length === 0) {
    alert("❌ Нет доступных пунктов выдачи");
    return;
  }

  const cartItems = await getCartDetails();
  if (cartItems.length === 0) {
    alert("❌ Корзина пуста");
    return;
  }

  const total = calculateTotal(cartItems);

  let itemsHtml = cartItems
    .map(
      (item) => `
    <div class="item">
      <span>${item.image} ${item.name} × ${item.quantity}</span>
      <span>${item.total} ₽</span>
    </div>
  `,
    )
    .join("");

  const container = document.getElementById("content");
  container.innerHTML = `
    <div class="checkout">
      <h1>📦 Оформление заказа</h1>
      <div class="checkout__form">
        <div class="checkout__order-summary">
          <h4 style="color:#fff; margin-bottom:8px;">📋 Состав заказа</h4>
          ${itemsHtml}
          <div class="checkout__total">Итого: ${total} ₽</div>
        </div>

        <div class="form-group">
          <label>📍 Выберите пункт выдачи</label>
          <select id="pickupPoint">
            ${points.map((p) => `<option value="${p.id}">${p.name} — ${p.address}</option>`).join("")}
          </select>
        </div>

        <div class="form-group">
          <label>💬 Комментарий к заказу</label>
          <input type="text" id="orderComment" placeholder="Например: без лука" />
        </div>

        <div style="background:#0d0d0d; padding:12px 16px; border-radius:8px; margin:12px 0; border:1px solid #2a2a2a;">
          💳 Сумма к оплате: <strong style="color:#F37321; font-size:20px;">${total} ₽</strong>
        </div>

        <button class="btn btn--success btn--full" onclick="submitOrder()">✅ Подтвердить заказ и оплатить</button>
        <button class="btn btn--secondary btn--full" style="margin-top:8px;" onclick="renderCart()">← Вернуться</button>
      </div>
    </div>
  `;
}

// ===== ОТПРАВИТЬ ЗАКАЗ =====
async function submitOrder() {
  const user = getCurrentUser();
  const pickupPointId = parseInt(document.getElementById("pickupPoint").value);
  const comment = document.getElementById("orderComment").value.trim() || "";
  const cartItems = await getCartDetails();
  const total = calculateTotal(cartItems);

  if (cartItems.length === 0) {
    alert("❌ Корзина пуста");
    return;
  }

  const orderData = {
    userId: user.id,
    items: cartItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    })),
    total: total,
    pickupPointId: pickupPointId,
    status: "Новый",
    comment: comment,
  };

  try {
    const order = await createOrder(orderData);
    clearCart();

    const container = document.getElementById("content");
    container.innerHTML = `
      <div style="display:flex; justify-content:center; align-items:center; min-height:400px;">
        <div style="background:#1a1a1a; border:1px solid #2a2a2a; padding:40px; border-radius:16px; text-align:center; max-width:440px;">
          <div style="font-size:64px; margin-bottom:12px;">✅</div>
          <h2 style="font-size:24px; color:#fff; margin-bottom:4px;">Заказ оформлен!</h2>
          <p style="color:#888; font-size:14px; margin-bottom:12px;">Номер заказа: #${order.id}</p>
          <p style="font-size:20px; font-weight:700; color:#F37321; margin-bottom:8px;">${total} ₽</p>
          <p style="color:#aaa; font-size:14px;">📍 Пункт выдачи выбран</p>
          <p style="color:#888; font-size:13px; margin-top:8px;">
            Статус: <span class="status-badge status-new">Новый</span>
          </p>
          <div style="margin-top:20px; display:flex; gap:10px; flex-direction:column;">
            <button class="btn btn--primary btn--full" onclick="navigateTo('orders')">📋 Отслеживать заказ</button>
            <button class="btn btn--secondary btn--full" onclick="navigateTo('catalog')">🍕 Вернуться в каталог</button>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    alert("❌ Ошибка при оформлении заказа: " + error.message);
  }
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
loadCart();
updateCartCount();

// ===== ЭКСПОРТ =====
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.clearCart = clearCart;
window.renderCart = renderCart;
window.checkout = checkout;
window.submitOrder = submitOrder;
