// ============================================================
//  ДОДО ПИЦЦА 2.0 — АВТОРИЗАЦИЯ
//  Чёрный фон + оранжевый акцент
// ============================================================

// ===== СОСТОЯНИЕ =====
let currentUser = null;

// ===== ПОЛУЧИТЬ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ =====
function getCurrentUser() {
  if (currentUser) return currentUser;
  const saved = localStorage.getItem("dodoUser");
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
  localStorage.setItem("dodoUser", JSON.stringify(user));
}

// ===== ВЫХОД =====
function logout() {
  currentUser = null;
  localStorage.removeItem("dodoUser");
  if (window.location.pathname.includes("admin.html")) {
    window.location.href = "index.html";
  } else {
    location.reload();
  }
}

// ===== ПРОВЕРКИ =====
function isAuthenticated() {
  return getCurrentUser() !== null;
}

function hasRole(role) {
  const user = getCurrentUser();
  return user && user.role === role;
}

// ===== ЛОГИН =====
async function login(login, password, role) {
  const users = await getUsers();
  const user = users.find(
    (u) => u.login === login && u.password === password && u.role === role,
  );

  if (!user) {
    throw new Error("❌ Неверный логин, пароль или роль");
  }

  saveUser(user);
  return user;
}

// ===== РЕГИСТРАЦИЯ =====
async function register(name, login, password) {
  const users = await getUsers();
  if (users.find((u) => u.login === login)) {
    throw new Error("❌ Пользователь с таким логином уже существует");
  }

  const newUser = {
    name: name,
    login: login,
    password: password,
    role: "client",
  };

  return createUser(newUser);
}

// ===== UI АВТОРИЗАЦИИ =====
function initAuthUI() {
  const user = getCurrentUser();
  const nameEl = document.getElementById("userName");
  const authBtn = document.getElementById("authBtn");

  if (user) {
    if (nameEl) nameEl.textContent = user.name || user.login;
    if (authBtn) {
      authBtn.textContent = "🚪 Выйти";
      authBtn.className = "btn btn--secondary";
      authBtn.onclick = logout;
    }

    // Ссылка на админку для админов и кухни
    if (user.role === "admin" || user.role === "kitchen") {
      const nav = document.querySelector(".header__nav");
      if (nav && !document.querySelector('.header__link[data-page="admin"]')) {
        const adminLink = document.createElement("a");
        adminLink.href = "admin.html";
        adminLink.className = "header__link";
        adminLink.textContent = "⚙️ Админ-панель";
        nav.appendChild(adminLink);
      }
    }
  } else {
    if (nameEl) nameEl.textContent = "👤 Гость";
    if (authBtn) {
      authBtn.textContent = "🔑 Войти";
      authBtn.className = "btn btn--primary";
      authBtn.onclick = () => {
        document.getElementById("authModal").classList.add("active");
      };
    }
  }
}

// ============================================================
//  DOM EVENTS
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // ===== ФОРМА ЛОГИНА =====
  const authForm = document.getElementById("authForm");
  if (authForm) {
    authForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const login = document.getElementById("loginInput").value.trim();
      const password = document.getElementById("passwordInput").value.trim();
      const role = document.getElementById("roleSelect").value;

      if (!login || !password) {
        alert("⚠️ Заполните все поля");
        return;
      }

      try {
        const user = await login(login, password, role);
        alert(`✅ Добро пожаловать, ${user.name || user.login}!`);
        document.getElementById("authModal").classList.remove("active");
        location.reload();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // ===== ФОРМА РЕГИСТРАЦИИ =====
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("regName").value.trim();
      const login = document.getElementById("regLogin").value.trim();
      const password = document.getElementById("regPassword").value.trim();

      if (!name || !login || !password) {
        alert("⚠️ Заполните все поля");
        return;
      }

      try {
        await register(name, login, password);
        alert("✅ Регистрация успешна! Теперь войдите.");
        document.getElementById("registerModal").classList.remove("active");
        document.getElementById("authModal").classList.add("active");
        document.getElementById("loginInput").value = login;
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // ===== МОДАЛКИ =====
  const closeAuth = document.getElementById("closeAuth");
  if (closeAuth) {
    closeAuth.onclick = () =>
      document.getElementById("authModal").classList.remove("active");
  }

  const closeRegister = document.getElementById("closeRegister");
  if (closeRegister) {
    closeRegister.onclick = () =>
      document.getElementById("registerModal").classList.remove("active");
  }

  const showRegister = document.getElementById("showRegister");
  if (showRegister) {
    showRegister.onclick = (e) => {
      e.preventDefault();
      document.getElementById("authModal").classList.remove("active");
      document.getElementById("registerModal").classList.add("active");
    };
  }

  const showAuth = document.getElementById("showAuth");
  if (showAuth) {
    showAuth.onclick = (e) => {
      e.preventDefault();
      document.getElementById("registerModal").classList.remove("active");
      document.getElementById("authModal").classList.add("active");
    };
  }

  // Закрытие по клику вне модалки
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("active");
    });
  });

  // ===== ИНИЦИАЛИЗАЦИЯ =====
  initAuthUI();
});

// ============================================================
//  ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ
// ============================================================

window.login = login;
window.register = register;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.isAuthenticated = isAuthenticated;
window.hasRole = hasRole;
window.initAuthUI = initAuthUI;
