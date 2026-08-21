// ============================================================
//  ДОДО ПИЦЦА 2.0 — API С ПОДДЕРЖКОЙ RENDER.COM
//  Данные общие для всех пользователей
// ============================================================

// ===== НАСТРОЙКА =====
// Если на Render.com — используй ссылку на твой сервис
// Если локально — http://localhost:3000
// Для мок-данных — используй встроенную БД (режим офлайн)

const RENDER_URL = 'https://dodo-pizza-app-marinenko-eg-ecpd.onreza.ru';
const USE_RENDER = false;
const LOCAL_URL = "http://localhost:3000";

// Автоматически выбираем URL
function getApiUrl() {
  if (USE_RENDER) {
    return RENDER_URL;
  }
  return LOCAL_URL;
}

// ===== МОК-ДАННЫЕ (резерв, если сервер недоступен) =====
const MOCK_DATA = {
  users: [
    {
      id: 1,
      login: "admin",
      password: "admin123",
      role: "admin",
      name: "Администратор",
    },
    {
      id: 2,
      login: "kitchen",
      password: "kitchen123",
      role: "kitchen",
      name: "Повар",
    },
    {
      id: 3,
      login: "client",
      password: "client123",
      role: "client",
      name: "Клиент",
    },
  ],
  products: [
    {
      id: 1,
      name: "Маргарита",
      price: 499,
      category: "Пицца",
      image: "🍕",
      description: "Томатный соус, моцарелла, базилик",
    },
    {
      id: 2,
      name: "Пепперони",
      price: 599,
      category: "Пицца",
      image: "🍕",
      description: "Томатный соус, моцарелла, пепперони",
    },
    {
      id: 3,
      name: "Гавайская",
      price: 649,
      category: "Пицца",
      image: "🍕",
      description: "Томатный соус, моцарелла, курица, ананас",
    },
    {
      id: 4,
      name: "Четыре сыра",
      price: 699,
      category: "Пицца",
      image: "🧀",
      description: "Сливочный соус, моцарелла, пармезан, горгонзола, фета",
    },
    {
      id: 5,
      name: "Кола",
      price: 150,
      category: "Напитки",
      image: "🥤",
      description: "Классическая кола 0.5л",
    },
    {
      id: 6,
      name: "Лимонад",
      price: 180,
      category: "Напитки",
      image: "🍋",
      description: "Домашний лимонад 0.5л",
    },
    {
      id: 7,
      name: "Сок апельсиновый",
      price: 160,
      category: "Напитки",
      image: "🧃",
      description: "Свежевыжатый сок 0.3л",
    },
    {
      id: 8,
      name: "Картофель фри",
      price: 220,
      category: "Закуски",
      image: "🍟",
      description: "Хрустящий картофель фри с солью",
    },
    {
      id: 9,
      name: "Куриные крылья",
      price: 350,
      category: "Закуски",
      image: "🍗",
      description: "Куриные крылья в остром соусе",
    },
    {
      id: 10,
      name: "Овощная нарезка",
      price: 250,
      category: "Закуски",
      image: "🥗",
      description: "Свежие овощи с соусом",
    },
    {
      id: 11,
      name: "Чизкейк",
      price: 280,
      category: "Десерты",
      image: "🍰",
      description: "Классический нью-йоркский чизкейк",
    },
    {
      id: 12,
      name: "Тирамису",
      price: 320,
      category: "Десерты",
      image: "🍫",
      description: "Итальянский десерт с маскарпоне",
    },
  ],
  pickupPoints: [
    {
      id: 1,
      name: "Додо Пицца на Ленина",
      address: "ул. Ленина, 15",
      phone: "+7 (383) 123-45-67",
    },
    {
      id: 2,
      name: "Додо Пицца на Мира",
      address: "ул. Мира, 42",
      phone: "+7 (383) 234-56-78",
    },
    {
      id: 3,
      name: "Додо Пицца на Кирова",
      address: "ул. Кирова, 88",
      phone: "+7 (383) 345-67-89",
    },
  ],
  orders: [
    {
      id: 1,
      userId: 3,
      items: [
        { productId: 1, quantity: 2, price: 499 },
        { productId: 5, quantity: 1, price: 150 },
      ],
      total: 1148,
      pickupPointId: 1,
      status: "Выдан",
      createdAt: "2026-08-17T10:30:00Z",
      updatedAt: "2026-08-17T11:15:00Z",
      comment: "Оставить у входа",
    },
    {
      id: 2,
      userId: 3,
      items: [
        { productId: 2, quantity: 1, price: 599 },
        { productId: 8, quantity: 2, price: 220 },
      ],
      total: 1039,
      pickupPointId: 2,
      status: "Готов к выдаче",
      createdAt: "2026-08-17T12:00:00Z",
      updatedAt: "2026-08-17T12:30:00Z",
      comment: "",
    },
    {
      id: 3,
      userId: 3,
      items: [
        { productId: 3, quantity: 1, price: 649 },
        { productId: 9, quantity: 1, price: 350 },
        { productId: 11, quantity: 1, price: 280 },
      ],
      total: 1279,
      pickupPointId: 1,
      status: "Готовится",
      createdAt: "2026-08-17T13:00:00Z",
      updatedAt: "2026-08-17T13:15:00Z",
      comment: "Без лука",
    },
  ],
};

// ===== ЛОКАЛЬНАЯ БАЗА (для мок-режима) =====
let localOrders = [...MOCK_DATA.orders];
let nextOrderId = 100;

// ===== ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ =====
async function apiRequest(endpoint, method = "GET", body = null) {
  // Если используем мок-данные — обрабатываем локально
  if (!USE_RENDER) {
    return mockRequest(endpoint, method, body);
  }

  // Иначе — отправляем запрос на Render
  const url = `${getApiUrl()}${endpoint}`;
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      // Если сервер недоступен — падаем на мок-данные
      console.warn("⚠️ Сервер недоступен, использую мок-данные");
      return mockRequest(endpoint, method, body);
    }
    if (method === "DELETE") return true;
    return response.json();
  } catch (error) {
    console.warn("⚠️ Ошибка соединения, использую мок-данные:", error.message);
    return mockRequest(endpoint, method, body);
  }
}

// ===== МОК-ОБРАБОТЧИК =====
function mockRequest(endpoint, method, body) {
  // Users
  if (endpoint === "/users" && method === "GET") return [...MOCK_DATA.users];
  if (endpoint.startsWith("/users/") && method === "GET") {
    const id = parseInt(endpoint.split("/")[2]);
    return MOCK_DATA.users.find((u) => u.id === id);
  }
  if (endpoint === "/users" && method === "POST") {
    const newUser = { id: MOCK_DATA.users.length + 1, ...body };
    MOCK_DATA.users.push(newUser);
    return newUser;
  }

  // Products
  if (endpoint === "/products" && method === "GET")
    return [...MOCK_DATA.products];
  if (endpoint.startsWith("/products/") && method === "GET") {
    const id = parseInt(endpoint.split("/")[2]);
    return MOCK_DATA.products.find((p) => p.id === id);
  }
  if (endpoint === "/products" && method === "POST") {
    const newProduct = { id: MOCK_DATA.products.length + 1, ...body };
    MOCK_DATA.products.push(newProduct);
    return newProduct;
  }
  if (endpoint.startsWith("/products/") && method === "PUT") {
    const id = parseInt(endpoint.split("/")[2]);
    const idx = MOCK_DATA.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Товар не найден");
    MOCK_DATA.products[idx] = { ...MOCK_DATA.products[idx], ...body };
    return MOCK_DATA.products[idx];
  }
  if (endpoint.startsWith("/products/") && method === "DELETE") {
    const id = parseInt(endpoint.split("/")[2]);
    const idx = MOCK_DATA.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Товар не найден");
    MOCK_DATA.products.splice(idx, 1);
    return true;
  }

  // Pickup Points
  if (endpoint === "/pickupPoints" && method === "GET")
    return [...MOCK_DATA.pickupPoints];
  if (endpoint.startsWith("/pickupPoints/") && method === "GET") {
    const id = parseInt(endpoint.split("/")[2]);
    return MOCK_DATA.pickupPoints.find((p) => p.id === id);
  }
  if (endpoint === "/pickupPoints" && method === "POST") {
    const newPoint = { id: MOCK_DATA.pickupPoints.length + 1, ...body };
    MOCK_DATA.pickupPoints.push(newPoint);
    return newPoint;
  }
  if (endpoint.startsWith("/pickupPoints/") && method === "PUT") {
    const id = parseInt(endpoint.split("/")[2]);
    const idx = MOCK_DATA.pickupPoints.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Пункт не найден");
    MOCK_DATA.pickupPoints[idx] = { ...MOCK_DATA.pickupPoints[idx], ...body };
    return MOCK_DATA.pickupPoints[idx];
  }
  if (endpoint.startsWith("/pickupPoints/") && method === "DELETE") {
    const id = parseInt(endpoint.split("/")[2]);
    const idx = MOCK_DATA.pickupPoints.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Пункт не найден");
    MOCK_DATA.pickupPoints.splice(idx, 1);
    return true;
  }

  // Orders
  if (endpoint === "/orders" && method === "GET") return [...localOrders];
  if (endpoint.startsWith("/orders/") && method === "GET") {
    const id = parseInt(endpoint.split("/")[2]);
    const order = localOrders.find((o) => o.id === id);
    if (!order) throw new Error("Заказ не найден");
    return order;
  }
  if (endpoint === "/orders" && method === "POST") {
    const newOrder = {
      id: nextOrderId++,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localOrders.push(newOrder);
    return newOrder;
  }
  if (endpoint.startsWith("/orders/") && method === "PUT") {
    const id = parseInt(endpoint.split("/")[2]);
    const idx = localOrders.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error("Заказ не найден");
    localOrders[idx] = {
      ...localOrders[idx],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    return localOrders[idx];
  }
  if (endpoint.startsWith("/orders/") && method === "PATCH") {
    const id = parseInt(endpoint.split("/")[2]);
    const idx = localOrders.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error("Заказ не найден");
    localOrders[idx] = {
      ...localOrders[idx],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    return localOrders[idx];
  }
  if (endpoint.startsWith("/orders/") && method === "DELETE") {
    const id = parseInt(endpoint.split("/")[2]);
    const idx = localOrders.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error("Заказ не найден");
    localOrders.splice(idx, 1);
    return true;
  }

  console.warn("⚠️ Неизвестный запрос:", endpoint, method);
  return null;
}

// ===== API ФУНКЦИИ =====

// USERS
async function getUsers() {
  return apiRequest("/users");
}
async function getUser(id) {
  return apiRequest(`/users/${id}`);
}
async function getUserByLogin(login) {
  const users = await getUsers();
  return users.find((u) => u.login === login);
}
async function createUser(data) {
  return apiRequest("/users", "POST", data);
}

// PRODUCTS
async function getProducts() {
  return apiRequest("/products");
}
async function getProduct(id) {
  return apiRequest(`/products/${id}`);
}
async function createProduct(data) {
  return apiRequest("/products", "POST", data);
}
async function updateProduct(id, data) {
  return apiRequest(`/products/${id}`, "PUT", data);
}
async function deleteProduct(id) {
  return apiRequest(`/products/${id}`, "DELETE");
}

// PICKUP POINTS
async function getPickupPoints() {
  return apiRequest("/pickupPoints");
}
async function getPickupPoint(id) {
  return apiRequest(`/pickupPoints/${id}`);
}
async function createPickupPoint(data) {
  return apiRequest("/pickupPoints", "POST", data);
}
async function updatePickupPoint(id, data) {
  return apiRequest(`/pickupPoints/${id}`, "PUT", data);
}
async function deletePickupPoint(id) {
  return apiRequest(`/pickupPoints/${id}`, "DELETE");
}

// ORDERS
async function getOrders() {
  return apiRequest("/orders");
}
async function getOrder(id) {
  return apiRequest(`/orders/${id}`);
}
async function createOrder(data) {
  return apiRequest("/orders", "POST", data);
}
async function updateOrder(id, data) {
  return apiRequest(`/orders/${id}`, "PUT", data);
}
async function patchOrder(id, data) {
  return apiRequest(`/orders/${id}`, "PATCH", data);
}
async function deleteOrder(id) {
  return apiRequest(`/orders/${id}`, "DELETE");
}

// HELPERS
async function getOrdersByUser(userId) {
  const orders = await getOrders();
  return orders.filter((o) => o.userId === userId);
}
async function getProductMap() {
  const products = await getProducts();
  const map = {};
  products.forEach((p) => (map[p.id] = p));
  return map;
}
async function getPointMap() {
  const points = await getPickupPoints();
  const map = {};
  points.forEach((p) => (map[p.id] = p));
  return map;
}
