
if (typeof login === 'undefined') {
  alert('Ошибка: auth.js не загружен!');
  console.error('❌ auth.js не загружен!');
}
// ============================================================
//  ДОДО ПИЦЦА 2.0 — ГЛАВНОЕ ПРИЛОЖЕНИЕ
// ============================================================

// ===== ЖДЁМ ЗАГРУЗКУ AUTH =====
function waitForAuth(callback) {
  if (typeof login !== 'undefined') {
    callback();
  } else {
    setTimeout(() => waitForAuth(callback), 50);
  }
}

// ===== НАВИГАЦИЯ =====
function navigateTo(page) {
  const links = document.querySelectorAll('.header__link[data-page]');
  links.forEach(link => link.classList.remove('active'));

  const activeLink = document.querySelector(`.header__link[data-page="${page}"]`);
  if (activeLink) activeLink.classList.add('active');

  switch (page) {
    case 'catalog': renderCatalog(); break;
    case 'cart': renderCart(); break;
    case 'orders': renderOrders(); break;
    default: renderCatalog();
  }
}

// ===== КАТАЛОГ =====
async function renderCatalog(category = 'Все') {
  const container = document.getElementById('content');
  if (!container) return;

  try {
    const products = await getProducts();
    const categories = ['Все', ...new Set(products.map(p => p.category))];

    let filtered = products;
    if (category !== 'Все') {
      filtered = products.filter(p => p.category === category);
    }

    let html = `
      <div class="catalog">
        <h1 class="catalog__title">🍕 Меню</h1>
        <div class="catalog__categories">
    `;

    categories.forEach(cat => {
      const active = cat === category ? 'active' : '';
      html += `<button class="catalog__category ${active}" onclick="renderCatalog('${cat}')">${cat}</button>`;
    });

    html += `</div><div class="catalog__grid">`;

    if (filtered.length === 0) {
      html += `<p style="grid-column:1/-1; text-align:center; color:#666; padding:40px 0;">Товаров нет</p>`;
    }

    filtered.forEach(product => {
      html += `
        <div class="product-card">
          <div class="product-card__image">${product.image || '🍕'}</div>
          <div class="product-card__body">
            <div class="product-card__name">${product.name}</div>
            <div class="product-card__description">${product.description || ''}</div>
            <div class="product-card__bottom">
              <span class="product-card__price">${product.price} ₽</span>
              <button class="product-card__add" onclick="addToCart(${product.id}); updateCartCount();">+ В корзину</button>
            </div>
          </div>
        </div>
      `;
    });

    html += `</div></div>`;
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = `<p style="color:#dc3545;">⚠️ Ошибка: ${error.message}</p>`;
  }
}

// ============================================================
//  ИНИЦИАЛИЗАЦИЯ
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
  waitForAuth(function() {
    loadCart();
    updateCartCount();

    document.querySelectorAll('.header__link[data-page]').forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        navigateTo(link.dataset.page);
      });
    });

    renderCatalog();
    initAuthUI();

    console.log('🍕 Додо Пицца 2.0 загружена');
  });
});

// ===== ЭКСПОРТ =====
window.navigateTo = navigateTo;
window.renderCatalog = renderCatalog;
window.renderCart = renderCart;
