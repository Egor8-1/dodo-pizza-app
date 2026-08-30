// ============================================================
//  BERDSK_PIZZA — АВТОРИЗАЦИЯ
// ============================================================

// ===== СОСТОЯНИЕ =====
let currentUser = null;

// ===== ПОЛУЧИТЬ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ =====
function getCurrentUser() {
  if (currentUser) return currentUser;
  const saved = localStorage.getItem('berdskUser');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      return currentUser;
    } catch (e) {
      return null;
    }
  }
  return null;
}

// ===== СОХРАНИТЬ ПОЛЬЗОВАТЕЛЯ =====
function saveUser(user) {
  currentUser = user;
  localStorage.setItem('berdskUser', JSON.stringify(user));
}

// ===== ВЫХОД =====
function logout() {
  currentUser = null;
  localStorage.removeItem('berdskUser');
  window.location.href = 'index.html';
}

// ===== ПРОВЕРКИ =====
function isAuthenticated() {
  return getCurrentUser() !== null;
}

function hasRole(role) {
  const user = getCurrentUser();
  return user && user.role === role;
}

// ============================================================
//  API ФУНКЦИИ
// ============================================================

async function loginUser(login, password) {
  const users = await getUsers();
  const user = users.find(u => u.login === login && u.password === password);
  if (!user) {
    throw new Error('❌ Неверный логин или пароль');
  }
  saveUser(user);
  return user;
}

async function registerUser(name, login, password) {
  const users = await getUsers();
  if (users.find(u => u.login === login)) {
    throw new Error('❌ Пользователь с таким логином уже существует');
  }
  const newUser = {
    name: name,
    login: login,
    password: password,
    role: 'client'
  };
  return createUser(newUser);
}

// ============================================================
//  ОБРАБОТЧИКИ КНОПОК (вызываются из HTML)
// ============================================================

function handleLogin() {
  const login = document.getElementById('loginInput').value.trim();
  const password = document.getElementById('passwordInput').value.trim();

  if (!login || !password) {
    alert('⚠️ Введите логин и пароль');
    return;
  }

  loginUser(login, password)
    .then(function(user) {
      alert('✅ Добро пожаловать, ' + (user.name || user.login) + '!');
      document.getElementById('authModal').classList.remove('active');

      // Перенаправление по роли
      if (user.role === 'admin') {
        window.location.href = 'admin.html';
      } else if (user.role === 'kitchen') {
        window.location.href = 'kitchen.html';
      } else if (user.role === 'operator') {
        window.location.href = 'operator.html';
      } else if (user.role === 'courier') {
        window.location.href = 'courier.html';
      } else {
        location.reload();
      }
    })
    .catch(function(err) {
      alert('❌ ' + err.message);
    });
}

function handleRegister() {
  const name = document.getElementById('regName').value.trim();
  const login = document.getElementById('regLogin').value.trim();
  const password = document.getElementById('regPassword').value.trim();

  if (!name || !login || !password) {
    alert('⚠️ Заполните все поля');
    return;
  }

  registerUser(name, login, password)
    .then(function() {
      alert('✅ Регистрация успешна! Теперь войдите.');
      document.getElementById('registerModal').classList.remove('active');
      document.getElementById('authModal').classList.add('active');
      document.getElementById('loginInput').value = login;
    })
    .catch(function(err) {
      alert('❌ ' + err.message);
    });
}

// ============================================================
//  UI ОБНОВЛЕНИЕ (имя пользователя в хедере)
// ============================================================

function initAuthUI() {
  const user = getCurrentUser();
  const nameEl = document.getElementById('userName');
  const authBtn = document.getElementById('authBtn');

  if (user) {
    if (nameEl) nameEl.textContent = user.name || user.login;
    if (authBtn) {
      authBtn.textContent = '🚪 Выйти';
      authBtn.className = 'btn btn--secondary';
      authBtn.onclick = logout;
    }

    // Показываем ссылку на админку, если роль admin
    if (user.role === 'admin' || user.role === 'kitchen' || user.role === 'operator' || user.role === 'courier') {
      const nav = document.querySelector('.header__nav');
      if (nav && !document.querySelector('.header__link[data-page="admin"]')) {
        const roleLink = document.createElement('a');
        roleLink.href = user.role === 'admin' ? 'admin.html' : 
                        user.role === 'kitchen' ? 'kitchen.html' :
                        user.role === 'operator' ? 'operator.html' : 'courier.html';
        roleLink.className = 'header__link';
        const roleNames = {
          'admin': '⚙️ Админ-панель',
          'kitchen': '👨‍🍳 Кухня',
          'operator': '📞 Оператор',
          'courier': '🚚 Доставка'
        };
        roleLink.textContent = roleNames[user.role] || '📊 Панель';
        nav.appendChild(roleLink);
      }
    }
  } else {
    if (nameEl) nameEl.textContent = '👤 Гость';
    if (authBtn) {
      authBtn.textContent = '🔑 Войти';
      authBtn.className = 'btn btn--primary';
      authBtn.onclick = function() {
        document.getElementById('authModal').classList.add('active');
      };
    }
  }
}

// ============================================================
//  ЗАКРЫТИЕ МОДАЛОК (клик по фону)
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
  // Закрытие модалок по клику на фон
  document.querySelectorAll('.modal').forEach(function(modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) modal.classList.remove('active');
    });
  });

  // Кнопки закрытия
  const closeAuth = document.getElementById('closeAuth');
  if (closeAuth) {
    closeAuth.addEventListener('click', function() {
      document.getElementById('authModal').classList.remove('active');
    });
  }

  const closeRegister = document.getElementById('closeRegister');
  if (closeRegister) {
    closeRegister.addEventListener('click', function() {
      document.getElementById('registerModal').classList.remove('active');
    });
  }

  // Переключение между модалками
  const showRegister = document.getElementById('showRegister');
  if (showRegister) {
    showRegister.addEventListener('click', function(e) {
      e.preventDefault();
      document.getElementById('authModal').classList.remove('active');
      document.getElementById('registerModal').classList.add('active');
    });
  }

  const showAuth = document.getElementById('showAuth');
  if (showAuth) {
    showAuth.addEventListener('click', function(e) {
      e.preventDefault();
      document.getElementById('registerModal').classList.remove('active');
      document.getElementById('authModal').classList.add('active');
    });
  }

  // Инициализация UI
  initAuthUI();
});

// ============================================================
//  ЭКСПОРТ В ГЛОБАЛКУ (для вызова из HTML)
// ============================================================

window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.isAuthenticated = isAuthenticated;
window.hasRole = hasRole;
window.initAuthUI = initAuthUI;
