// ===== ПРОВЕРКА ЗАГРУЗКИ auth.js =====
if (typeof login === 'undefined') {
  console.log('⏳ Ожидаем загрузку auth.js...');
  setTimeout(function() {
    location.reload(true);
  }, 500);
}

// ===== НАВИГАЦИЯ =====
function navigateTo(page) {
  var links = document.querySelectorAll('.header__link[data-page]');
  links.forEach(function(link) { link.classList.remove('active'); });
  var activeLink = document.querySelector('.header__link[data-page="' + page + '"]');
  if (activeLink) activeLink.classList.add('active');
  switch (page) {
    case 'catalog': renderCatalog(); break;
    case 'cart': renderCart(); break;
    case 'orders': renderOrders(); break;
    default: renderCatalog();
  }
}

// ===== КАТАЛОГ =====
async function renderCatalog(category) {
  if (typeof category === 'undefined') category = 'Все';
  var container = document.getElementById('content');
  if (!container) return;
  try {
    var products = await getProducts();
    var categories = ['Все'];
    for (var i = 0; i < products.length; i++) {
      if (categories.indexOf(products[i].category) === -1) {
        categories.push(products[i].category);
      }
    }
    var filtered = products;
    if (category !== 'Все') {
      filtered = products.filter(function(p) { return p.category === category; });
    }
    var html = '<div class="catalog"><h1 class="catalog__title">🍕 Меню</h1><div class="catalog__categories">';
    for (var j = 0; j < categories.length; j++) {
      var active = categories[j] === category ? 'active' : '';
      html += '<button class="catalog__category ' + active + '" onclick="renderCatalog(\'' + categories[j] + '\')">' + categories[j] + '</button>';
    }
    html += '</div><div class="catalog__grid">';
    if (filtered.length === 0) {
      html += '<p style="grid-column:1/-1;text-align:center;color:#666;padding:40px 0;">Товаров нет</p>';
    }
    for (var k = 0; k < filtered.length; k++) {
      var p = filtered[k];
      html += '<div class="product-card"><div class="product-card__image">' + (p.image || '🍕') + '</div><div class="product-card__body"><div class="product-card__name">' + p.name + '</div><div class="product-card__description">' + (p.description || '') + '</div><div class="product-card__bottom"><span class="product-card__price">' + p.price + ' ₽</span><button class="product-card__add" onclick="addToCart(' + p.id + ');updateCartCount();">+ В корзину</button></div></div></div>';
    }
    html += '</div></div>';
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = '<p style="color:#dc3545;">⚠️ Ошибка: ' + error.message + '</p>';
  }
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {
  loadCart();
  updateCartCount();
  var links = document.querySelectorAll('.header__link[data-page]');
  for (var i = 0; i < links.length; i++) {
    links[i].addEventListener('click', function(e) {
      e.preventDefault();
      navigateTo(this.dataset.page);
    });
  }
  renderCatalog();
  initAuthUI();
  console.log('🍕 Додо Пицца 2.0 загружена');
});

// ===== ЭКСПОРТ =====
window.navigateTo = navigateTo;
window.renderCatalog = renderCatalog;
// ===== ДУБЛЕР ДЛЯ БЕЗОПАСНОСТИ =====
window.handleLogin = window.handleLogin || function() {
  alert('⚠️ handleLogin ещё не загружен, попробуйте обновить страницу (Ctrl+F5)');
};
