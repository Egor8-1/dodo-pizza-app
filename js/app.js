// ============================================================
//  ДОДО ПИЦЦА 2.0 — ГЛАВНОЕ ПРИЛОЖЕНИЕ
//  Чёрный фон + оранжевый акцент
// ============================================================

// ===== ОЖИДАНИЕ ЗАГРУЗКИ AUTH =====
function waitForAuth(callback) {
  if (typeof login !== "undefined" && typeof getCurrentUser !== "undefined") {
    callback();
  } else {
    setTimeout(() => waitForAuth(callback), 50);
  }
}

// ===== НАВИГАЦИЯ =====
function navigateTo(page) {
  // Обновляем активную ссылку
  const links = document.querySelectorAll(".header__link[data-page]");
  links.forEach((link) => link.classList.remove("active"));

  const activeLink = document.querySelector(
    `.header__link[data-page="${page}"]`,
  );
  if (activeLink) activeLink.classList.add("active");

  // Рендерим страницу
  switch (page) {
    case "catalog":
      renderCatalog();
      break;
    case "cart":
      renderCart();
      break;
    case "orders":
      renderOrders();
      break;
    default:
      renderCatalog();
  }
}

// ===== КАТАЛОГ =====
async function renderCatalog(category = "Все") {
  const container = document.getElementById("content");
  if (!container) return;

  try {
    const products = await getProducts();

    const categories = ["Все", ...new Set(products.map((p) => p.category))];

    let filtered = products;
    if (category !== "Все") {
      filtered = products.filter((p) => p.category === category);
    }

    let html = `
      <div class="catalog">
        <h1 class="catalog__title">🍕 Меню</h1>

        <div class="catalog__categories">
    `;

    categories.forEach((cat) => {
      const active = cat === category ? "active" : "";
      html += `
        <button class="catalog__category ${active}" onclick="renderCatalog('${cat}')">
          ${cat}
        </button>
      `;
    });

    html += `
        </div>

        <div class="catalog__grid">
    `;

    if (filtered.length === 0) {
      html += `
        <p style="grid-column:1/-1; text-align:center; color:#666; padding:40px 0;">
          Товаров в этой категории нет
        </p>
      `;
    }

    filtered.forEach((product) => {
      html += `
        <div class="product-card">
          <div class="product-card__image">
            ${product.image || "🍕"}
          </div>
          <div class="product-card__body">
            <div class="product-card__name">${product.name}</div>
            <div class="product-card__description">${product.description || ""}</div>
            <div class="product-card__bottom">
              <span class="product-card__price">${product.price} ₽</span>
              <button class="product-card__add" onclick="addToCart(${product.id}); updateCartCount();">
                + В корзину
              </button>
            </div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px 0;">
        <p style="color:#dc3545;">⚠️ Ошибка загрузки каталога: ${error.message}</p>
        <button class="btn btn--primary" onclick="renderCatalog()" style="margin-top:16px;">
          🔄 Повторить
        </button>
      </div>
    `;
  }
}

// ============================================================
//  ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  waitForAuth(() => {
    // Загружаем корзину
    loadCart();
    updateCartCount();

    // Обработчики навигации
    document.querySelectorAll(".header__link[data-page]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        navigateTo(page);
      });
    });

    // Показываем каталог по умолчанию
    renderCatalog();

    // Инициализируем UI авторизации
    initAuthUI();

    // Автообновление корзины (на случай, если данные изменились)
    setInterval(() => {
      loadCart();
      updateCartCount();
    }, 5000);

    // Логирование
    console.log("🍕 Додо Пицца 2.0 — приложение загружено");
    console.log("📦 Корзина:", cart);
    console.log("👤 Пользователь:", getCurrentUser());

    // Сообщение в консоль для проверки
    console.log("✅ Если видите это сообщение — всё работает!");
  });
});

// ============================================================
//  ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ
// ============================================================

window.navigateTo = navigateTo;
window.renderCatalog = renderCatalog;
window.renderOrders = renderOrders;
window.renderCart = renderCart;
