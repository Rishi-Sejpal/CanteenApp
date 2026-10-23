/* ==========================================================================
   SymbiEat — vanilla JS front-end
   Talks to the Express API when it is available and falls back to a
   localStorage demo mode when it is not.
   ========================================================================== */

(() => {
  "use strict";

  const app = document.getElementById("app");
  const toastRegion = document.getElementById("toast-region");

  const CATEGORIES = ["South Indian", "North Indian", "Rice & bowls", "Quick bites"];
  const ALL_CATEGORIES = "All dishes";

  const ROLE_LABEL = { student: "Customer", staff: "Chef", admin: "Admin" };

  const STATUS_META = {
    placed: { label: "Received", cls: "received" },
    confirmed: { label: "Accepted", cls: "accepted" },
    preparing: { label: "Preparing", cls: "preparing" },
    ready: { label: "Ready for pickup", cls: "ready" },
    completed: { label: "Collected", cls: "ready" },
    cancelled: { label: "Cancelled", cls: "cancelled" }
  };

  const TRACK_STEPS = [
    { key: "placed", title: "Received", copy: "We have your order and the kitchen can see it." },
    { key: "confirmed", title: "Accepted", copy: "The kitchen has accepted your order." },
    { key: "preparing", title: "Preparing", copy: "Your food is on the line right now." },
    { key: "ready", title: "Ready", copy: "Collect it at the pickup counter with your token." }
  ];

  const FALLBACK_DISHES = [
    { id: "f1", name: "Amritsari Chole Kulche", category: "North Indian", price: 105, description: "Tangy chole with soft kulche, onion, lemon and green chutney.", image: "https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=900", isAvailable: false, isVegetarian: true, label: "" },
    { id: "f2", name: "Veg Thali", category: "North Indian", price: 120, description: "A traditional vegetarian meal with roti, rice, dal, seasonal sabzi, and salad.", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=80", isAvailable: true, isVegetarian: true, label: "Lunch special" },
    { id: "f3", name: "Anda Bhurji Pav", category: "Quick bites", price: 85, description: "Street-style masala eggs with two buttered pav and chilli.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Spicy_egg_bhurji_%40_the_eggfactory.jpg/500px-Spicy_egg_bhurji_%40_the_eggfactory.jpg", isAvailable: true, isVegetarian: false, label: "" },
    { id: "f4", name: "Tandoori Paneer Roll", category: "Quick bites", price: 125, description: "Smoky paneer, crunchy kachumber and mint yoghurt in a rumali roti.", image: "https://images.pexels.com/photos/4958792/pexels-photo-4958792.jpeg?auto=compress&cs=tinysrgb&w=900", isAvailable: true, isVegetarian: true, label: "Ready in 8 min" },
    { id: "f5", name: "Veg Hakka Noodles", category: "Quick bites", price: 110, description: "Stir-fried noodles with mixed vegetables and Chinese-style seasoning.", image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80", isAvailable: true, isVegetarian: true, label: "" },
    { id: "f6", name: "Chicken Dum Biryani", category: "Rice & bowls", price: 165, description: "Fragrant dum-cooked basmati, tender chicken and cooling raita.", image: "https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg?auto=compress&cs=tinysrgb&w=900", isAvailable: true, isVegetarian: false, label: "Lunch special" },
    { id: "f7", name: "Lemon Rice & Papad", category: "Rice & bowls", price: 75, description: "Tempered rice with curry leaves, peanuts and a crisp papad.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Chitranna_and_Payasa.jpg/500px-Chitranna_and_Payasa.jpg", isAvailable: true, isVegetarian: true, label: "" },
    { id: "f8", name: "Rajma Chawal Bowl", category: "Rice & bowls", price: 110, description: "Slow-simmered kidney beans, steamed basmati and a little achaar.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Rajma_Masala_%2832081557778%29.jpg/500px-Rajma_Masala_%2832081557778%29.jpg", isAvailable: true, isVegetarian: true, label: "" },
    { id: "f9", name: "Veg Manchurian with Fried Rice", category: "Rice & bowls", price: 140, description: "Vegetable Manchurian balls served with vegetable fried rice.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Gobi_Manchurian.jpg/500px-Gobi_Manchurian.jpg", isAvailable: true, isVegetarian: true, label: "New on menu" },
    { id: "f10", name: "Idli Sambar", category: "South Indian", price: 65, description: "Four pillowy idlis, ladled sambar and house-made podi.", image: "https://images.pexels.com/photos/4331489/pexels-photo-4331489.jpeg?auto=compress&cs=tinysrgb&w=900", isAvailable: true, isVegetarian: true, label: "" },
    { id: "f11", name: "Mysore Masala Dosa", category: "South Indian", price: 95, description: "Crisp rice crepe, spiced potato, coconut chutney & sambar.", image: "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=900", isAvailable: true, isVegetarian: true, label: "Canteen favourite" }
  ];

  const FALLBACK_INVENTORY = [
    { id: "i1", name: "Dosa batter", area: "South Indian station", lowStockAt: 3, quantity: 2.4, unit: "kg" },
    { id: "i2", name: "Fresh paneer", area: "Cold storage", lowStockAt: 4, quantity: 8, unit: "kg" },
    { id: "i3", name: "Basmati rice", area: "Dry store", lowStockAt: 4, quantity: 5.2, unit: "kg" },
    { id: "i4", name: "Chicken", area: "Cold storage", lowStockAt: 3, quantity: 1.8, unit: "kg" },
    { id: "i5", name: "Coconut chutney", area: "South Indian station", lowStockAt: 1.5, quantity: 1.2, unit: "L" },
    { id: "i6", name: "Idli batter", area: "South Indian station", lowStockAt: 3, quantity: 6, unit: "kg" },
    { id: "i7", name: "Eggs", area: "Cold storage", lowStockAt: 24, quantity: 36, unit: "pcs" },
    { id: "i8", name: "Seasonal produce", area: "Prep counter", lowStockAt: 2, quantity: 4.1, unit: "kg" }
  ];

  const state = {
    user: null,
    offline: false,
    dishes: [],
    cart: { items: [], total: 0 },
    orders: [],
    inventory: [],
    search: "",
    category: ALL_CATEGORIES,
    adminMenuSearch: "",
    editingId: null,
    addOpen: false,
    busy: false
  };

  let renderSeq = 0;
  let pollTimer = null;

  /* ------------------------------------------------------------------------
     Small helpers
     ------------------------------------------------------------------------ */
  const esc = (value) => String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  const money = (value) => {
    const n = Number(value) || 0;
    return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: n % 1 ? 2 : 0 });
  };

  const num = (value) => Number(value).toLocaleString("en-IN", { maximumFractionDigits: 1 });
  const timeOf = (iso) => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  const dateOf = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const initials = (name) => String(name || "S").trim().charAt(0).toUpperCase();
  const isStaff = () => ["staff", "admin"].includes(state.user && state.user.role);
  const isAdmin = () => state.user && state.user.role === "admin";

  function roleKey() {
    const role = state.user && state.user.role;
    return role === "admin" ? "admin" : role === "staff" ? "chef" : "customer";
  }

  function getPath() {
    const hash = window.location.hash || "#/";
    const raw = hash.startsWith("#") ? hash.slice(1) : hash;
    return raw.startsWith("/") ? raw : "/" + raw;
  }

  function navigate(hash, scroll = true) {
    if (window.location.hash === hash) {
      renderRoute({ scroll });
    } else {
      window.location.hash = hash;
    }
  }

  function moneyNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0;
  }

  /* ------------------------------------------------------------------------
     Icons (inline lucide-style paths)
     ------------------------------------------------------------------------ */
  const ICONS = {
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    package: '<path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    dashboard: '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>',
    utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    boxes: '<path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"/><path d="m7 16.5-4.74-2.85"/><path d="m7 16.5 5-3"/><path d="M7 16.5v5.17"/><path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z"/><path d="m17 16.5-5-3"/><path d="m17 16.5 4.74-2.85"/><path d="M17 16.5v5.17"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/>',
    location: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    sparkle: '<path d="m12 3-1.9 5.8L4 10.7l6.1 1.9L12 18.4l1.9-5.8 6.1-1.9-6.1-1.9Z"/>'
  };

  function icon(name, size = 18) {
    const body = ICONS[name] || ICONS.sparkle;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  }

  /* ------------------------------------------------------------------------
     API + localStorage adapters
     ------------------------------------------------------------------------ */
  async function api(path, { method = "GET", body } = {}) {
    const options = { method, credentials: "same-origin", headers: {} };
    if (body !== undefined) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }
    const response = await fetch(path, options);
    let data = null;
    try { data = await response.json(); } catch { /* empty body */ }
    if (!response.ok) {
      const err = new Error((data && data.message) || `Request failed (${response.status})`);
      err.status = response.status;
      throw err;
    }
    return data;
  }

  function normaliseDish(dish) {
    return {
      id: String(dish.id || dish._id),
      name: dish.name,
      category: dish.category || "Quick bites",
      price: Number(dish.price) || 0,
      description: dish.description || "",
      image: dish.image || "",
      isAvailable: dish.isAvailable !== false,
      isVegetarian: dish.isVegetarian !== false,
      label: dish.label || ""
    };
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  }

  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage may be blocked */ }
  }

  function localCartData() {
    const lines = readJSON("symbieat-cart-v1", []);
    const items = [];
    let total = 0;
    for (const line of Array.isArray(lines) ? lines : []) {
      const dish = state.dishes.find((d) => String(d.id) === String(line.id));
      if (!dish) continue;
      const quantity = Math.max(1, Math.min(50, Number(line.quantity) || 1));
      const subtotal = dish.price * quantity;
      total += subtotal;
      items.push({
        cartItemId: String(line.id),
        menuItemId: String(dish.id),
        name: dish.name,
        price: dish.price,
        quantity,
        subtotal,
        isAvailable: dish.isAvailable
      });
    }
    return { items, total };
  }

  function setLocalLine(dishId, quantity) {
    const lines = readJSON("symbieat-cart-v1", []);
    const next = (Array.isArray(lines) ? lines : []).filter((line) => String(line.id) !== String(dishId));
    if (quantity > 0) next.push({ id: String(dishId), quantity });
    writeJSON("symbieat-cart-v1", next);
    state.cart = localCartData();
  }

  function localOrders() {
    const orders = readJSON("symbieat-orders-v1", []);
    return Array.isArray(orders) ? orders : [];
  }

  function saveLocalOrders(orders) {
    writeJSON("symbieat-orders-v1", orders);
    state.orders = orders;
  }

  function updateLocalOrder(id, status) {
    const orders = localOrders().map((order) => {
      if (String(order._id) !== String(id)) return order;
      return { ...order, status, cancelledAt: status === "cancelled" ? new Date().toISOString() : order.cancelledAt };
    });
    saveLocalOrders(orders);
  }

  function syntheticUser(role) {
    if (role === "staff") {
      return { id: "demo-staff", name: "Canteen Staff", prn: "STAFF2026001", email: "canteen.staff@sitpune.edu.in", role: "staff" };
    }
    if (role === "admin") {
      return { id: "demo-admin", name: "Canteen Admin", prn: "ADMIN2026001", email: "admin@sitpune.edu.in", role: "admin" };
    }
    return { id: "demo-student", name: "Aarav Sharma", prn: "20240101001", email: "aarav.sharma@sitpune.edu.in", role: "student" };
  }

  function randomToken() {
    const existing = new Set([
      ...state.orders.map((o) => String(o.token).toUpperCase()),
      ...localOrders().map((o) => String(o.token).toUpperCase())
    ]);
    for (let i = 0; i < 50; i += 1) {
      const token = "SE-" + Math.floor(1000 + Math.random() * 9000);
      if (!existing.has(token)) return token;
    }
    return "SE-" + Math.floor(1000 + Math.random() * 9000);
  }

  /* ------------------------------------------------------------------------
     Data loading
     ------------------------------------------------------------------------ */
  async function ensureSession() {
    try {
      const data = await api("/api/auth/me");
      state.user = data.user;
      state.offline = false;
      return;
    } catch {
      // fall through to login
    }
    state.user = null;
    state.offline = true;
  }

  async function loadMenu() {
    try {
      const data = await api("/api/menu");
      state.dishes = (Array.isArray(data) ? data : data.items || []).map(normaliseDish);
    } catch {
      if (!state.dishes.length) state.dishes = FALLBACK_DISHES.map(normaliseDish);
    }
  }

  async function loadCart() {
    if (!state.user || state.user.role !== "student") {
      state.cart = { items: [], total: 0 };
      return;
    }
    if (state.offline) {
      state.cart = localCartData();
      return;
    }
    try {
      const cart = await api("/api/cart");
      state.cart = {
        items: Array.isArray(cart.items) ? cart.items : [],
        total: Number(cart.total) || 0
      };
    } catch {
      state.cart = localCartData();
    }
  }

  async function loadOrders() {
    if (!state.user) { state.orders = []; return; }
    if (state.offline) {
      state.orders = localOrders();
      return;
    }
    try {
      const data = await api("/api/orders");
      state.orders = Array.isArray(data.orders) ? data.orders : [];
    } catch {
      state.orders = localOrders();
    }
  }

  async function loadInventory() {
    if (!isStaff()) { state.inventory = []; return; }
    if (state.offline) {
      if (!state.inventory.length) state.inventory = FALLBACK_INVENTORY.map((i) => ({ ...i, _id: i.id }));
      return;
    }
    try {
      const data = await api("/api/inventory");
      state.inventory = (Array.isArray(data) ? data : []).map((i) => ({ ...i, id: String(i._id || i.id) }));
    } catch {
      state.inventory = FALLBACK_INVENTORY.map((i) => ({ ...i, _id: i.id }));
    }
  }

  async function loadAll() {
    await loadMenu();
    await Promise.all([loadCart(), loadOrders()]);
    if (isStaff()) await loadInventory();
  }

  /* ------------------------------------------------------------------------
     Toast
     ------------------------------------------------------------------------ */
  function toast(message, type = "success") {
    if (!toastRegion) return;
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.innerHTML = `${icon(type === "error" ? "alert" : "check", 15)}<span>${esc(message)}</span>`;
    toastRegion.appendChild(el);
    setTimeout(() => {
      el.classList.add("leaving");
      setTimeout(() => el.remove(), 220);
    }, 2400);
  }

  /* ------------------------------------------------------------------------
     Shared layout
     ------------------------------------------------------------------------ */
  function demoBar() {
    return "";
  }

  function navItems() {
    if (isAdmin()) {
      return [
        ["#/admin", "Overview"],
        ["#/admin/menu", "Menu"],
        ["#/admin/inventory", "Inventory"],
        ["#/admin/orders", "Orders"]
      ];
    }
    if (isStaff()) return [["#/chef", "Kitchen board"]];
    return [["#/", "Menu"], ["#/orders", "My orders"]];
  }

  function siteHeader() {
    const path = getPath();
    const theme = document.documentElement.dataset.theme || "light";
    const count = cartCount();
    const nav = navItems().map(([href, label]) => {
      const current = href === "#/" ? path === "/" : path === href.slice(1);
      return `<a href="${href}" ${current ? 'aria-current="page"' : ""}>${label}</a>`;
    }).join("");

    return `
      <header class="site-header">
        <div class="shell site-header-inner">
          <a class="brand" href="#/" aria-label="SymbiEat home">
            <span class="brand-mark">${icon("leaf", 18)}</span>
            <span>SymbiEat</span>
          </a>
          <nav class="main-nav" aria-label="Primary">${nav}</nav>
          <div class="header-actions">
            <span class="account-chip" title="${esc(state.user ? state.user.email : "")}">
              <span class="avatar">${esc(initials(state.user && state.user.name))}</span>
              <span class="account-name">
                <b>${esc(state.user ? state.user.name : "Guest")}</b>
                <small>${esc(ROLE_LABEL[state.user ? state.user.role : "student"] || "Customer")}${state.user && state.user.prn ? " · " + esc(state.user.prn) : ""}</small>
              </span>
            </span>
            <button class="icon-btn" type="button" data-action="logout" aria-label="Sign out" title="Sign out"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></button>
            <button class="icon-btn" type="button" data-action="toggle-theme"
              aria-label="Switch to ${theme === "dark" ? "light" : "dark"} mode" title="Toggle theme">
              ${icon(theme === "dark" ? "sun" : "moon", 17)}
            </button>
            ${!isStaff() && state.user && state.user.role === "student" ? `
              <a class="icon-btn cart-btn" href="#/cart" data-cart-link
                aria-label="Cart, ${count} item${count === 1 ? "" : "s"}">
                ${icon("cart", 18)}
                <span class="cart-badge" data-cart-count ${count ? "" : "hidden"}>${count}</span>
              </a>` : ""}
          </div>
        </div>
      </header>`;
  }

  function siteFooter() {
    return `
      <footer class="site-footer">
        <div class="shell">
          <span><strong>SymbiEat</strong> · North Campus canteen</span>
          <span>Order ahead · Skip the queue · Collect with a token</span>
          <span>© ${new Date().getFullYear()} SymbiEat demo</span>
        </div>
      </footer>`;
  }

  function customerShell(inner) {
    return `${siteHeader()}<main id="main">${inner}</main>${siteFooter()}`;
  }

  function chefShell(inner) {
    return `${siteHeader()}<main id="main" class="chef-page"><div class="chef-inner">${inner}</div></main>`;
  }

  function adminShell(inner) {
    const path = getPath();
    const links = [
      ["#/admin", "Overview", "dashboard"],
      ["#/admin/menu", "Menu items", "utensils"],
      ["#/admin/inventory", "Inventory", "boxes"],
      ["#/admin/orders", "Orders", "clipboard"]
    ];
    const nav = links.map(([href, label, ic]) => {
      const current = href === "#/admin" ? path === "/admin" : path === href.slice(1);
      return `<a href="${href}" ${current ? 'aria-current="page"' : ""}>${icon(ic, 17)}${label}</a>`;
    }).join("");
    return `
      ${siteHeader()}
      <div class="admin-shell">
        <aside class="admin-sidebar">
          <div class="admin-brand">
            <span class="brand"><span class="brand-mark">${icon("leaf", 17)}</span>SymbiEat</span>
            <small>Operations</small>
          </div>
          <nav class="admin-nav" aria-label="Admin sections">${nav}</nav>
          <div class="admin-sidebar-foot">
            Kitchen desk · North Campus<br />
            Signed in as ${esc(state.user ? state.user.name : "Admin")}
          </div>
        </aside>
        <main class="admin-content" id="main">${inner}</main>
      </div>`;
  }

  /* ------------------------------------------------------------------------
     Cart helpers
     ------------------------------------------------------------------------ */
  function cartCount() {
    return (state.cart.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }

  function cartLineFor(menuItemId) {
    return (state.cart.items || []).find((line) => String(line.menuItemId) === String(menuItemId));
  }

  function dishImageFor(menuItemId) {
    const dish = state.dishes.find((d) => String(d.id) === String(menuItemId));
    return dish ? dish.image : "";
  }

  function syncCartBadge() {
    const count = cartCount();
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      el.textContent = count;
      el.hidden = count === 0;
    });
    document.querySelectorAll("[data-cart-link]").forEach((el) => {
      el.setAttribute("aria-label", `Cart, ${count} item${count === 1 ? "" : "s"}`);
    });
  }

  /* ------------------------------------------------------------------------
     Customer — home
     ------------------------------------------------------------------------ */
  function filteredDishes() {
    const query = state.search.trim().toLowerCase();
    return state.dishes.filter((dish) => {
      const inCategory = state.category === ALL_CATEGORIES || dish.category === state.category;
      const inSearch = !query ||
        dish.name.toLowerCase().includes(query) ||
        dish.description.toLowerCase().includes(query) ||
        dish.category.toLowerCase().includes(query);
      return inCategory && inSearch;
    });
  }

  function qtyControl(dish) {
    const line = cartLineFor(dish.id);
    if (!dish.isAvailable) return `<span class="sold-out">Sold out</span>`;
    if (!line) {
      return `<button class="btn btn-primary btn-sm" type="button" data-action="add-item" data-id="${esc(dish.id)}">
        Add ${icon("plus", 14)}
      </button>`;
    }
    return `
      <div class="qty-stepper" aria-label="Quantity for ${esc(dish.name)}">
        <button class="qty-btn" type="button" data-action="menu-dec" data-id="${esc(dish.id)}" aria-label="Remove one ${esc(dish.name)}">${icon("minus", 13)}</button>
        <span class="qty-value" aria-live="polite">${line.quantity}</span>
        <button class="qty-btn" type="button" data-action="menu-inc" data-id="${esc(dish.id)}" aria-label="Add one ${esc(dish.name)}">${icon("plus", 13)}</button>
      </div>`;
  }

  function dishCard(dish) {
    return `
      <article class="dish-card" data-dish-id="${esc(dish.id)}">
        <div class="dish-photo">
          ${dish.image ? `<img src="${esc(dish.image)}" alt="${esc(dish.name)}" loading="lazy" onerror="this.style.display='none'" />` : ""}
          <span class="avail-badge ${dish.isAvailable ? "ok" : "out"}">${dish.isAvailable ? "Available" : "Sold out"}</span>
          ${dish.label ? `<span class="dish-label">${esc(dish.label)}</span>` : ""}
        </div>
        <div class="dish-body">
          <div class="dish-title-row">
            <span class="veg-mark ${dish.isVegetarian ? "" : "nonveg"}"
              role="img" aria-label="${dish.isVegetarian ? "Vegetarian" : "Non-vegetarian"}"></span>
            <h3>${esc(dish.name)}</h3>
          </div>
          <p class="dish-desc">${esc(dish.description)}</p>
          <div class="dish-foot">
            <div>
              <span class="price">${money(dish.price)}</span>
              <span class="dish-cat">${esc(dish.category)}</span>
            </div>
            ${qtyControl(dish)}
          </div>
        </div>
      </article>`;
  }

  function dishGridHTML() {
    const dishes = filteredDishes();
    if (!dishes.length) {
      return `
        <div class="empty-state">
          <span class="empty-plate">${icon("search", 22)}</span>
          <h3>Nothing on the pass</h3>
          <p>No dishes match that search or filter. Try a different craving.</p>
          <button class="btn btn-outline btn-sm" type="button" data-action="reset-filters">Show all dishes</button>
        </div>`;
    }
    return dishes.map(dishCard).join("");
  }

  function renderHome() {
    const featured = state.dishes.find((dish) => dish.isAvailable && dish.image) || FALLBACK_DISHES[10];
    const filtered = filteredDishes();
    return `
      <section class="hero">
        <div class="shell hero-grid">
          <div class="hero-copy fade-in">
            <span class="eyebrow">North Campus canteen</span>
            <h1>Your campus cravings, sorted.</h1>
            <p class="lead hero-lead">Order your lunch before the rush, pay in a tap and pick it up with a
              four-digit token. The queue is for people who didn't plan ahead.</p>
            <div class="hero-actions">
              <button class="btn btn-primary" type="button" data-action="scroll-menu">
                Explore menu ${icon("arrow", 16)}
              </button>
              <a class="btn btn-outline" href="#/orders">Track an order</a>
            </div>
            <div class="meta-chips">
              <span class="meta-chip">${icon("clock", 14)} Ready in 10–15 min</span>
              <span class="meta-chip">${icon("location", 14)} North Campus canteen</span>
            </div>
          </div>
          <div class="hero-visual fade-in">
            <div class="hero-photo">
              <img src="${esc(featured.image)}" alt="A fresh campus lunch spread" onerror="this.style.display='none'" />
            </div>
            <div class="hero-note">
              <span>Today's note</span>
              <strong>Lunch break,<br />reclaimed.</strong>
            </div>
          </div>
        </div>
      </section>

      <section class="menu-section" id="menu" aria-labelledby="menu-title">
        <div class="shell">
          <div class="section-head">
            <div>
              <span class="eyebrow">Fresh from the kitchen</span>
              <h2 class="section-title" id="menu-title">The canteen edit</h2>
              <p class="lead">South Indian staples, north Indian comfort and quick bites between lectures.</p>
            </div>
          </div>

          <div class="menu-toolbar">
            <div class="search-box">
              ${icon("search", 16)}
              <label class="sr-only" for="menu-search">Search dishes</label>
              <input class="input" id="menu-search" type="search" placeholder="Search dishes…"
                value="${esc(state.search)}" autocomplete="off" />
            </div>
            <div class="filter-pills" role="group" aria-label="Filter by category">
              ${[ALL_CATEGORIES, ...CATEGORIES].map((category) => `
                <button class="filter-pill" type="button" data-action="filter-category"
                  data-category="${esc(category)}" aria-pressed="${state.category === category}">${esc(category)}</button>
              `).join("")}
            </div>
          </div>

          <div class="result-count">
            <span id="menu-count">${filtered.length} dish${filtered.length === 1 ? "" : "es"} on the pass</span>
            <span>${state.offline ? "Local demo data" : "Live canteen menu"}</span>
          </div>

          <div class="dish-grid" id="dish-grid">${dishGridHTML()}</div>
        </div>
      </section>

      <section class="pickup-band" aria-labelledby="pickup-title">
        <div class="shell pickup-grid">
          <div>
            <span class="eyebrow">Order ahead</span>
            <h2 id="pickup-title">Skip the 1 pm scramble.</h2>
            <p>Place your order from the library, the lab or the last row of class. The kitchen starts
              when you confirm, and your token is ready the moment your food hits the counter.</p>
          </div>
          <div class="steps">
            <div class="step"><span class="step-num">01</span><b>Pick</b><span>Build your plate from today's menu.</span></div>
            <div class="step"><span class="step-num">02</span><b>Token</b><span>Check out and get an SE-XXXX pickup token.</span></div>
            <div class="step"><span class="step-num">03</span><b>Collect</b><span>Show the token and walk away with lunch.</span></div>
          </div>
        </div>
      </section>`;
  }

  function updateMenuGrid() {
    const grid = document.getElementById("dish-grid");
    if (!grid) return;
    grid.innerHTML = dishGridHTML();
    const count = filteredDishes().length;
    const countEl = document.getElementById("menu-count");
    if (countEl) countEl.textContent = `${count} dish${count === 1 ? "" : "es"} on the pass`;
    document.querySelectorAll('[data-action="filter-category"]').forEach((pill) => {
      pill.setAttribute("aria-pressed", String(pill.dataset.category === state.category));
    });
  }

  /* ------------------------------------------------------------------------
     Customer — cart
     ------------------------------------------------------------------------ */
  function renderCart() {
    if (!state.cart.items.length) {
      return `
        <div class="shell page-shell">
          <div class="cart-empty">
            <span class="empty-plate">${icon("cart", 24)}</span>
            <h2>Your bag is empty.</h2>
            <p>Good things happen when you add a dosa. Or two.</p>
            <a class="btn btn-primary" href="#/">Explore today's menu ${icon("arrow", 15)}</a>
          </div>
        </div>`;
    }

    const rows = state.cart.items.map((line) => {
      const image = dishImageFor(line.menuItemId);
      return `
        <div class="cart-row" data-cart-row="${esc(line.cartItemId)}">
          <div class="cart-thumb">
            ${image ? `<img src="${esc(image)}" alt="${esc(line.name)}" onerror="this.style.display='none'" />` : ""}
          </div>
          <div class="cart-info">
            <h3>${esc(line.name)}</h3>
            <div class="cart-unit">${money(line.price)} each${line.isAvailable === false ? " · currently unavailable" : ""}</div>
          </div>
          <div class="cart-controls">
            <div class="qty-stepper" aria-label="Quantity for ${esc(line.name)}">
              <button class="qty-btn" type="button" data-action="cart-dec"
                data-cart-id="${esc(line.cartItemId)}" data-id="${esc(line.menuItemId)}"
                aria-label="Remove one ${esc(line.name)}">${icon("minus", 13)}</button>
              <span class="qty-value">${line.quantity}</span>
              <button class="qty-btn" type="button" data-action="cart-inc"
                data-cart-id="${esc(line.cartItemId)}" data-id="${esc(line.menuItemId)}"
                aria-label="Add one ${esc(line.name)}">${icon("plus", 13)}</button>
            </div>
            <span class="cart-line-total">${money(line.subtotal)}</span>
            <button class="remove-btn" type="button" data-action="cart-remove"
              data-cart-id="${esc(line.cartItemId)}" aria-label="Remove ${esc(line.name)}">
              ${icon("trash", 15)}
            </button>
          </div>
        </div>`;
    }).join("");

    const total = state.cart.total || state.cart.items.reduce((sum, line) => sum + Number(line.subtotal || 0), 0);

    return `
      <div class="shell page-shell">
        <div class="page-head">
          <span class="eyebrow">Your bag</span>
          <h1>Almost lunch.</h1>
          <p class="page-sub">Review your plate, then check out. Pickup is free and the kitchen starts
            as soon as your order lands.</p>
        </div>
        ${state.offline ? `<div class="offline-note">${icon("alert", 15)} Backend unavailable — this order is stored locally in your browser.</div>` : ""}
        <div class="cart-layout">
          <div class="cart-list">${rows}</div>
          <aside class="summary" aria-label="Order summary">
            <h2>Order summary</h2>
            <div class="summary-rows">
              <div class="summary-row"><span>Subtotal · ${cartCount()} item${cartCount() === 1 ? "" : "s"}</span><span>${money(total)}</span></div>
              <div class="summary-row"><span>Campus pickup</span><span>Free</span></div>
              <div class="summary-row"><span>Payment</span><span>Simulated UPI</span></div>
            </div>
            <div class="summary-total"><span>Total</span><strong>${money(total)}</strong></div>
            <button class="btn btn-primary btn-block" type="button" data-action="checkout">
              ${icon("check", 16)} Pay ${money(total)} &amp; place order
            </button>
            <p class="checkout-note">Simulated checkout — no real payment is taken.</p>
          </aside>
        </div>
      </div>`;
  }

  /* ------------------------------------------------------------------------
     Customer — order tracking
     ------------------------------------------------------------------------ */
  function trackerHTML(order) {
    if (order.status === "cancelled") {
      return `<div class="cancelled-banner">${icon("alert", 17)} This order was cancelled. No payment was taken.</div>`;
    }
    const index = order.status === "placed" ? 0
      : order.status === "confirmed" ? 1
      : order.status === "preparing" ? 2
      : 3;

    return `
      <div class="tracker" aria-label="Order progress">
        ${TRACK_STEPS.map((step, i) => {
          const done = i < index;
          const current = i === index;
          return `
            <div class="track-step ${done ? "done" : ""} ${current ? "current" : ""}">
              <span class="track-dot">${done ? icon("check", 13) : i + 1}</span>
              <div class="track-copy">
                <b>${step.title}</b>
                <span>${step.copy}</span>
              </div>
            </div>`;
        }).join("")}
      </div>`;
  }

  function orderDetailHTML(order) {
    return `
      <div class="order-detail">
        <h2>On your tray</h2>
        ${(order.items || []).map((item) => `
          <div class="order-item">
            <span>${item.quantity} × ${esc(item.name)}</span>
            <span>${money(item.subtotal != null ? item.subtotal : item.price * item.quantity)}</span>
          </div>
        `).join("")}
        <div class="order-total-row"><span>Total paid</span><strong>${money(order.total)}</strong></div>
      </div>`;
  }

  function renderOrder(order) {
    if (!order) {
      return `
        <div class="shell order-wrap">
          <div class="empty-state">
            <span class="empty-plate">${icon("search", 22)}</span>
            <h2>Token not found</h2>
            <p>We couldn't find an order for that pickup token. Check the number and try again.</p>
            <a class="btn btn-primary" href="#/">Back to the menu</a>
          </div>
        </div>`;
    }

    const meta = STATUS_META[order.status] || STATUS_META.placed;
    const placed = order.createdAt ? new Date(order.createdAt) : new Date();
    const canCancel = ["placed", "confirmed"].includes(order.status);

    return `
      <div class="shell order-wrap">
        <div class="check-circle">${icon("check", 24)}</div>
        <span class="status-pill ${meta.cls}" style="margin-bottom:10px">${meta.label}</span>
        <h1>${order.status === "cancelled" ? "This order was cancelled." : "Your lunch is in good hands."}</h1>
        <p>${order.status === "ready" || order.status === "completed"
          ? "It's waiting at the pickup counter. Show your token and grab it hot."
          : "Keep this token handy. We'll update the status as the kitchen moves."}</p>

        <div class="token-card">
          <span>Your pickup token</span>
          <strong class="token-code">${esc(order.token)}</strong>
          <small>Show this number at the pickup counter</small>
        </div>

        ${trackerHTML(order)}
        ${orderDetailHTML(order)}

        <div class="order-actions">
          ${canCancel ? `<button class="btn btn-outline" type="button" data-action="cancel-order" data-id="${esc(order._id)}">Cancel order</button>` : ""}
          <a class="btn btn-primary" href="#/">Back to the menu ${icon("arrow", 15)}</a>
        </div>
        <p class="muted" style="margin-top:16px;font-size:10.5px;letter-spacing:.6px;text-transform:uppercase">
          Placed ${dateOf(placed)} · ${timeOf(placed)}
        </p>
      </div>`;
  }

  async function orderForToken(token) {
    const wanted = String(token || "").toUpperCase();
    let order = state.orders.find((item) => String(item.token).toUpperCase() === wanted);
    if (!order && !state.offline) {
      try {
        const data = await api(`/api/orders/token/${encodeURIComponent(wanted)}`);
        order = data.order;
      } catch { /* fall through */ }
    }
    return order;
  }

  /* ------------------------------------------------------------------------
     Customer — order history
     ------------------------------------------------------------------------ */
  function renderOrders() {
    const orders = [...state.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (!orders.length) {
      return `
        <div class="shell page-shell">
          <div class="cart-empty">
            <span class="empty-plate">${icon("clipboard", 24)}</span>
            <h2>No orders yet.</h2>
            <p>Your first token is one lunch away.</p>
            <a class="btn btn-primary" href="#/">Explore today's menu ${icon("arrow", 15)}</a>
          </div>
        </div>`;
    }
    return `
      <div class="shell page-shell">
        <div class="page-head">
          <span class="eyebrow">Your history</span>
          <h1>Orders.</h1>
          <p class="page-sub">Every token, total and status from your campus lunches.</p>
        </div>
        <div class="ledger-grid">
          ${orders.map((order) => {
            const meta = STATUS_META[order.status] || STATUS_META.placed;
            return `
              <a class="order-card" href="#/order/${esc(order.token)}" aria-label="Track order ${esc(order.token)}">
                <div class="order-card-top">
                  <div>
                    <span class="order-token-label">Token</span>
                    <span class="order-token">${esc(order.token)}</span>
                    <div class="order-time">${icon("clock", 12)} ${dateOf(order.createdAt)} · ${timeOf(order.createdAt)}</div>
                  </div>
                  <span class="status-pill ${meta.cls}">${meta.label}</span>
                </div>
                <div class="order-card-total" style="margin:10px 0 0"><span>${(order.items || []).length} item${(order.items || []).length === 1 ? "" : "s"}</span><b>${money(order.total)}</b></div>
              </a>`;
          }).join("")}
        </div>
      </div>`;
  }

  /* ------------------------------------------------------------------------
     Chef dashboard
     ------------------------------------------------------------------------ */
  function customerOf(order) {
    const user = order.user;
    if (user && typeof user === "object") {
      return { name: user.name || "Student", prn: user.prn || "" };
    }
    return { name: "Student", prn: "" };
  }

  function chefCard(order) {
    const meta = STATUS_META[order.status] || STATUS_META.placed;
    const customer = customerOf(order);
    const action = order.status === "placed"
      ? { label: "Accept order", next: "confirmed", cls: "incoming" }
      : order.status === "confirmed"
        ? { label: "Start preparing", next: "preparing", cls: "accepted" }
        : order.status === "preparing"
          ? { label: "Mark ready for pickup", next: "ready", cls: "preparing" }
          : order.status === "ready"
            ? { label: "Waiting at pickup", next: null, cls: "waiting" }
            : order.status === "completed"
              ? { label: "Collected", next: null, cls: "waiting" }
              : { label: "Cancelled", next: null, cls: "waiting" };

    return `
      <article class="order-card" data-order-id="${esc(order._id)}">
        <div class="order-card-top">
          <div>
            <span class="order-token-label">Token</span>
            <span class="order-token">${esc(order.token)}</span>
            <div class="order-customer"><b>${esc(customer.name)}</b>${customer.prn ? " · " + esc(customer.prn) : ""}</div>
          </div>
          <span class="status-pill ${meta.cls}">${meta.label}</span>
        </div>
        <div class="order-time">${icon("clock", 12)} ${dateOf(order.createdAt)} · ${timeOf(order.createdAt)}</div>
        <ul class="order-card-items">
          ${(order.items || []).map((item) => `
            <li><span>${esc(item.name)}</span><span class="qty">× ${item.quantity}</span></li>
          `).join("")}
        </ul>
        <div class="order-card-total"><span>Total</span><b>${money(order.total)}</b></div>
        <div class="order-actions-stack">
          <button class="btn chef-action ${action.cls}" type="button"
            ${action.next ? `data-action="advance-order" data-id="${esc(order._id)}" data-next="${action.next}"` : "disabled"}>
            ${action.next ? "" : icon("check", 14)} ${action.label}
          </button>
          ${["placed", "confirmed"].includes(order.status) ? `
            <button class="cancel-link" type="button" data-action="chef-cancel" data-id="${esc(order._id)}">Cancel order</button>
          ` : ""}
        </div>
      </article>`;
  }

  function laneEmpty(label) {
    return `<div class="lane-empty"><span class="empty-plate">${icon("check", 16)}</span>${label}</div>`;
  }

  function renderChef() {
    const orders = [...state.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const incoming = orders.filter((o) => o.status === "placed");
    const accepted = orders.filter((o) => o.status === "confirmed");
    const preparing = orders.filter((o) => o.status === "preparing");
    const ready = orders.filter((o) => ["ready", "completed"].includes(o.status));
    const cancelled = orders.filter((o) => o.status === "cancelled");
    const active = orders.filter((o) => ["placed", "confirmed", "preparing"].includes(o.status)).length;

    return `
      <div class="chef-head">
        <div>
          <span class="eyebrow">North Campus canteen</span>
          <h1>Kitchen <span class="dot">board.</span></h1>
          <p>Every order on the pass, from the first token to the last pickup.</p>
        </div>
        <div class="shift-pill"><span class="pulse"></span> Service live · ${active} active order${active === 1 ? "" : "s"}</div>
      </div>

      <div class="kanban">
        <section class="lane" data-lane="incoming" aria-labelledby="lane-incoming">
          <div class="lane-head">
            <span class="lane-title" id="lane-incoming">${icon("clock", 15)} Incoming</span>
            <span class="lane-count">${incoming.length}</span>
          </div>
          <div class="lane-stack">
            ${incoming.length ? incoming.map(chefCard).join("") : laneEmpty("All clear for now")}
          </div>
        </section>

        <section class="lane" data-lane="preparing" aria-labelledby="lane-preparing">
          <div class="lane-head">
            <span class="lane-title" id="lane-preparing">${icon("flame", 15)} On the line</span>
            <span class="lane-count">${accepted.length + preparing.length}</span>
          </div>
          <div class="lane-stack">
            ${accepted.length ? `<div class="lane-subhead">Accepted</div>${accepted.map(chefCard).join("")}` : ""}
            ${preparing.length ? `<div class="lane-subhead">Preparing</div>${preparing.map(chefCard).join("")}` : ""}
            ${!accepted.length && !preparing.length ? laneEmpty("Nothing cooking yet") : ""}
          </div>
        </section>

        <section class="lane" data-lane="ready" aria-labelledby="lane-ready">
          <div class="lane-head">
            <span class="lane-title" id="lane-ready">${icon("package", 15)} Ready for pickup</span>
            <span class="lane-count">${ready.length}</span>
          </div>
          <div class="lane-stack">
            ${ready.length ? ready.map(chefCard).join("") : laneEmpty("No orders waiting")}
          </div>
        </section>
      </div>

      ${cancelled.length ? `
        <section class="lane cancelled-lane" aria-labelledby="lane-cancelled">
          <div class="lane-head">
            <span class="lane-title" id="lane-cancelled">${icon("x", 15)} Cancelled</span>
            <span class="lane-count">${cancelled.length}</span>
          </div>
          <div class="lane-stack">${cancelled.slice(0, 8).map(chefCard).join("")}</div>
        </section>` : ""}

      <div class="chef-foot">
        <span>Kitchen view</span>
        <span>Orders are sorted by newest first · refreshes every 4 seconds</span>
      </div>`;
  }

  /* ------------------------------------------------------------------------
     Admin — overview
     ------------------------------------------------------------------------ */
  function lowStockItems() {
    return state.inventory.filter((item) => Number(item.quantity) <= Number(item.lowStockAt));
  }

  function renderAdminOverview() {
    const orders = [...state.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const pending = orders.filter((o) => ["placed", "confirmed", "preparing"].includes(o.status)).length;
    const completed = orders.filter((o) => ["ready", "completed"].includes(o.status)).length;
    const low = lowStockItems();
    const metrics = [
      { icon: "clipboard", cls: "", value: orders.length, label: "Total orders" },
      { icon: "clock", cls: "apricot", value: pending, label: "Pending orders" },
      { icon: "check", cls: "green", value: completed, label: "Completed orders" },
      { icon: "alert", cls: "rose", value: low.length, label: "Low-stock items" }
    ];
    const recent = orders.slice(0, 5);
    const watch = [...low, ...state.inventory.filter((i) => !low.includes(i))].slice(0, 4);

    return `
      <div class="admin-page-head">
        <div class="page-head" style="margin:0">
          <span class="eyebrow">Daily operations</span>
          <h1>Good service starts here.</h1>
          <p class="page-sub">A live read on the canteen — orders moving, stock levels and the menu your
            students see right now.</p>
        </div>
        <div class="shift-pill"><span class="pulse"></span> North Campus · Kitchen desk</div>
      </div>

      <div class="metrics">
        ${metrics.map((metric) => `
          <div class="metric">
            <span class="metric-icon ${metric.cls}">${icon(metric.icon, 18)}</span>
            <span class="metric-value">${metric.value}</span>
            <span class="metric-label">${metric.label}</span>
          </div>
        `).join("")}
      </div>

      <div class="panels">
        <section class="panel" aria-labelledby="recent-title">
          <div class="panel-head">
            <h2 class="panel-title" id="recent-title">Recent orders</h2>
            <a href="#/admin/orders">View ledger</a>
          </div>
          <div class="recent-list">
            ${recent.length ? recent.map((order) => {
              const meta = STATUS_META[order.status] || STATUS_META.placed;
              return `
                <div class="recent-row">
                  <span class="status-dot ${meta.cls}"></span>
                  <span class="recent-token">${esc(order.token)}</span>
                  <span class="recent-items">${(order.items || []).map((i) => `${i.quantity}× ${i.name}`).join(", ")}</span>
                  <span class="recent-time">${timeOf(order.createdAt)}</span>
                </div>`;
            }).join("") : `<p class="muted" style="font-size:12px">No orders yet today.</p>`}
          </div>
        </section>

        <section class="panel" aria-labelledby="stock-title">
          <div class="panel-head">
            <h2 class="panel-title" id="stock-title">Stock to watch</h2>
            <a href="#/admin/inventory">Inventory</a>
          </div>
          <div class="stock-list">
            ${watch.length ? watch.map((item) => `
              <div class="stock-row">
                <span class="stock-name">${icon(item.quantity <= item.lowStockAt ? "alert" : "package", 15)}
                  <span>${esc(item.name)}<small>${esc(item.area)}</small></span>
                </span>
                <span class="stock-qty"><b>${num(item.quantity)} ${esc(item.unit)}</b><small>restock at ${num(item.lowStockAt)}</small></span>
              </div>
            `).join("") : `<p class="muted" style="font-size:12px">Stock records will appear here.</p>`}
          </div>
        </section>
      </div>

      <div class="quick-strip">
        <div class="quick-strip-copy">
          <span class="metric-icon">${icon("package", 18)}</span>
          <span><b>${state.dishes.length} dishes on the menu</b><small>Keep prices and availability current for students.</small></span>
        </div>
        <a class="btn btn-primary btn-sm" href="#/admin/menu">Manage menu ${icon("arrow", 14)}</a>
      </div>`;
  }

  /* ------------------------------------------------------------------------
     Admin — menu management
     ------------------------------------------------------------------------ */
  function adminMenuRows() {
    const query = state.adminMenuSearch.trim().toLowerCase();
    const dishes = state.dishes.filter((dish) =>
      !query ||
      dish.name.toLowerCase().includes(query) ||
      dish.category.toLowerCase().includes(query)
    );
    if (!dishes.length) {
      return `<div class="empty-state" style="padding:40px 18px">
        <span class="empty-plate">${icon("search", 20)}</span>
        <h3>No menu items match</h3>
        <p>Try a different name or category.</p>
      </div>`;
    }
    return dishes.map((dish) => {
      const editing = state.editingId === dish.id;
      return `
        <div class="menu-row-wrap">
          <div class="menu-row">
            <span class="menu-avatar">${esc(initials(dish.name))}</span>
            <div class="menu-meta">
              <b>${esc(dish.name)}</b>
              <small>${esc(dish.category)} · ${dish.isVegetarian ? "Veg" : "Non-veg"}</small>
            </div>
            <span class="menu-price">${money(dish.price)}</span>
            <div class="menu-actions">
              <span class="status-pill ${dish.isAvailable ? "ok" : "low"}">${dish.isAvailable ? "Available" : "Hidden"}</span>
              <button class="icon-btn" type="button" data-action="edit-dish" data-id="${esc(dish.id)}"
                aria-label="Edit ${esc(dish.name)}" title="Edit">${icon("edit", 14)}</button>
              <button class="icon-btn" type="button" data-action="toggle-availability" data-id="${esc(dish.id)}"
                aria-label="${dish.isAvailable ? "Mark unavailable" : "Mark available"} ${esc(dish.name)}" title="Toggle availability">
                ${icon(dish.isAvailable ? "check" : "x", 14)}
              </button>
              <button class="icon-btn danger" type="button" data-action="delete-dish" data-id="${esc(dish.id)}"
                aria-label="Delete ${esc(dish.name)}" title="Delete">${icon("trash", 14)}</button>
            </div>
          </div>
          ${editing ? `
            <form class="inline-editor" data-form="edit-menu" data-id="${esc(dish.id)}">
              <div class="form-grid">
                <div class="field"><label for="edit-name-${esc(dish.id)}">Name</label>
                  <input class="input" id="edit-name-${esc(dish.id)}" name="name" value="${esc(dish.name)}" required maxlength="80" />
                </div>
                <div class="field"><label for="edit-price-${esc(dish.id)}">Price (₹)</label>
                  <input class="input" id="edit-price-${esc(dish.id)}" name="price" type="number" min="0" step="1" value="${esc(dish.price)}" required />
                </div>
                <div class="field"><label for="edit-category-${esc(dish.id)}">Category</label>
                  <select class="select" id="edit-category-${esc(dish.id)}" name="category">
                    ${CATEGORIES.map((c) => `<option ${c === dish.category ? "selected" : ""}>${esc(c)}</option>`).join("")}
                  </select>
                </div>
              </div>
              <div class="form-actions">
                <button class="btn btn-primary btn-sm" type="submit">Save changes</button>
                <button class="btn btn-outline btn-sm" type="button" data-action="cancel-edit">Cancel</button>
              </div>
            </form>` : ""}
        </div>`;
    }).join("");
  }

  function renderAdminMenu() {
    return `
      <div class="admin-page-head">
        <div class="page-head" style="margin:0">
          <span class="eyebrow">Canteen catalogue</span>
          <h1>Menu items.</h1>
          <p class="page-sub">Add dishes, adjust prices and hide anything the kitchen has run out of.</p>
        </div>
        <button class="btn btn-primary" type="button" data-action="toggle-add">
          ${state.addOpen ? icon("x", 15) + " Close" : icon("plus", 15) + " Add menu item"}
        </button>
      </div>

      ${state.addOpen ? `
        <form class="add-panel" data-form="add-menu">
          <div class="form-grid">
            <div class="field span-2"><label for="new-name">Dish name</label>
              <input class="input" id="new-name" name="name" placeholder="e.g. Paneer Butter Masala" required maxlength="80" />
            </div>
            <div class="field"><label for="new-price">Price (₹)</label>
              <input class="input" id="new-price" name="price" type="number" min="1" step="1" placeholder="120" required />
            </div>
            <div class="field"><label for="new-category">Category</label>
              <select class="select" id="new-category" name="category">
                ${CATEGORIES.map((c) => `<option>${esc(c)}</option>`).join("")}
              </select>
            </div>
            <div class="field span-2"><label for="new-description">Description</label>
              <input class="input" id="new-description" name="description" placeholder="A short, appetising description" maxlength="180" />
            </div>
            <div class="field check-row" style="align-self:end">
              <input id="new-veg" name="isVegetarian" type="checkbox" checked />
              <label for="new-veg" style="font-size:12px;letter-spacing:0;text-transform:none;color:inherit">Vegetarian</label>
            </div>
            <div class="field check-row" style="align-self:end">
              <input id="new-available" name="isAvailable" type="checkbox" checked />
              <label for="new-available" style="font-size:12px;letter-spacing:0;text-transform:none;color:inherit">Available now</label>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary btn-sm" type="submit">Add item</button>
            <button class="btn btn-outline btn-sm" type="button" data-action="toggle-add">Cancel</button>
          </div>
        </form>` : ""}

      <div class="toolbar">
        <span class="count-label" id="admin-menu-count">${state.dishes.length} item${state.dishes.length === 1 ? "" : "s"} on the menu</span>
        <div class="search-box">
          ${icon("search", 16)}
          <label class="sr-only" for="admin-menu-search">Search menu items</label>
          <input class="input" id="admin-menu-search" type="search" placeholder="Search menu…"
            value="${esc(state.adminMenuSearch)}" autocomplete="off" />
        </div>
      </div>

      <div class="menu-list" id="admin-menu-list">${adminMenuRows()}</div>`;
  }

  /* ------------------------------------------------------------------------
     Admin — inventory
     ------------------------------------------------------------------------ */
  function renderAdminInventory() {
    const low = lowStockItems();
    return `
      <div class="admin-page-head">
        <div class="page-head" style="margin:0">
          <span class="eyebrow">Kitchen stockroom</span>
          <h1>Inventory.</h1>
          <p class="page-sub">Live quantities from the dry store, cold storage and prep counters.</p>
        </div>
        <span class="status-pill ${low.length ? "low" : "ok"}">${low.length ? icon("alert", 12) + " " + low.length + " low" : "All healthy"}</span>
      </div>

      ${low.length ? `
        <div class="low-callout">
          ${icon("alert", 17)}
          <span><b>Restock attention needed.</b> ${low.map((i) => esc(i.name)).join(", ")} ${low.length === 1 ? "is" : "are"} at or below the restock threshold.</span>
        </div>` : ""}

      <div class="inventory-table-wrap">
        <table class="inventory-table">
          <thead>
            <tr><th>Ingredient</th><th>On hand</th><th>Area</th><th>Restock at</th><th>Condition</th></tr>
          </thead>
          <tbody>
            ${state.inventory.length ? state.inventory.map((item) => {
              const isLow = Number(item.quantity) <= Number(item.lowStockAt);
              return `
                <tr>
                  <td><b>${esc(item.name)}</b></td>
                  <td>
                    <label class="sr-only" for="stock-${esc(item.id || item._id)}">Quantity for ${esc(item.name)}</label>
                    <input class="stock-input" id="stock-${esc(item.id || item._id)}" type="number"
                      min="0" step="0.1" value="${esc(item.quantity)}"
                      data-stock-input data-id="${esc(item.id || item._id)}" data-unit="${esc(item.unit)}" />
                    <span class="stock-area"> ${esc(item.unit)}</span>
                  </td>
                  <td class="stock-area">${esc(item.area)}</td>
                  <td class="stock-area">${num(item.lowStockAt)} ${esc(item.unit)}</td>
                  <td><span class="status-pill ${isLow ? "low" : "ok"}">${isLow ? "Low stock" : "Healthy"}</span></td>
                </tr>`;
            }).join("") : `<tr><td colspan="5" class="stock-area">No inventory records found.</td></tr>`}
          </tbody>
        </table>
      </div>`;
  }

  /* ------------------------------------------------------------------------
     Admin — order ledger
     ------------------------------------------------------------------------ */
  function renderAdminOrders() {
    const orders = [...state.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const inProgress = orders.filter((o) => ["placed", "confirmed", "preparing"].includes(o.status)).length;
    const ready = orders.filter((o) => ["ready", "completed"].includes(o.status)).length;

    return `
      <div class="admin-page-head">
        <div class="page-head" style="margin:0">
          <span class="eyebrow">Order ledger</span>
          <h1>Orders.</h1>
          <p class="page-sub">Every token, customer, item and total recorded by the canteen.</p>
        </div>
        <span class="count-label">${orders.length} recorded</span>
      </div>

      <div class="ledger-summary">
        <span><span class="status-dot" style="background:var(--st-received)"></span> ${inProgress} in progress</span>
        <span><span class="status-dot" style="background:var(--st-ready)"></span> ${ready} ready for pickup</span>
      </div>

      <div class="ledger-grid">
        ${orders.length ? orders.map((order) => {
          const meta = STATUS_META[order.status] || STATUS_META.placed;
          const customer = customerOf(order);
          return `
            <article class="order-card">
              <div class="order-card-top">
                <div>
                  <span class="order-token-label">Token</span>
                  <span class="order-token">${esc(order.token)}</span>
                  <div class="order-customer"><b>${esc(customer.name)}</b>${customer.prn ? " · " + esc(customer.prn) : ""}</div>
                </div>
                <span class="status-pill ${meta.cls}">${meta.label}</span>
              </div>
              <div class="order-time">${icon("clock", 12)} ${dateOf(order.createdAt)} · ${timeOf(order.createdAt)}</div>
              <ul class="order-card-items">
                ${(order.items || []).map((item) => `
                  <li><span>${esc(item.name)}</span><span class="qty">× ${item.quantity}</span></li>
                `).join("")}
              </ul>
              <div class="order-card-total"><span>Total · ${esc(order.paymentStatus || "demo")}</span><b>${money(order.total)}</b></div>
            </article>`;
        }).join("") : `<div class="empty-state"><span class="empty-plate">${icon("clipboard", 20)}</span><h3>No orders recorded</h3><p>The ledger fills up as students order.</p></div>`}
      </div>`;
  }

  /* ------------------------------------------------------------------------
     Router
     ------------------------------------------------------------------------ */
  async function doLogin(form) {
    const data = new FormData(form);
    const prn = String(data.get("prn") || "").trim();
    const password = String(data.get("password") || "");
    if (!prn || !password) { toast("PRN and password are required", "error"); return; }
    const button = form.querySelector('button[type="submit"]');
    if (button) { button.disabled = true; button.textContent = "Signing in…"; }
    try {
      const result = await api("/api/auth/login", { method: "POST", body: { prn, password } });
      state.user = result.user;
      state.offline = false;
      toast("Login successful");
      await loadAll();
      const target = state.user.role === "admin" ? "#/admin" : state.user.role === "staff" ? "#/chef" : "#/";
      if (window.location.hash === target) await renderRoute({ scroll: true });
      else window.location.hash = target;
    } catch (error) {
      toast(error.message || "Invalid PRN or password", "error");
      if (button) { button.disabled = false; button.textContent = "Sign in"; }
    }
  }

  async function doLogout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch { /* ignore */ }
    state.user = null;
    state.cart = { items: [], total: 0 };
    state.orders = [];
    window.location.hash = "#/login";
    await renderRoute({ scroll: true });
  }

  async function renderRoute({ scroll = false } = {}) {
    const seq = ++renderSeq;
    const path = getPath();
    if (!state.user) {
      if (path !== "/login") {
        window.location.hash = "#/login";
        return;
      }
      app.innerHTML = renderLogin();
      document.title = "Sign in · SymbiEat";
      return;
    }
    let html = "";
    let title = "SymbiEat";

    try {
      if (path === "/") {
        html = customerShell(renderHome());
        title = "SymbiEat · Campus food, sorted";
      } else if (path === "/cart") {
        html = customerShell(renderCart());
        title = "Your bag · SymbiEat";
      } else if (path === "/orders") {
        html = customerShell(renderOrders());
        title = "Your orders · SymbiEat";
      } else if (path.startsWith("/order/")) {
        const token = decodeURIComponent(path.slice("/order/".length).split("/")[0]);
        const order = await orderForToken(token);
        if (seq !== renderSeq) return;
        html = customerShell(renderOrder(order));
        title = order ? `Order ${order.token} · SymbiEat` : "Order not found · SymbiEat";
      } else if (path === "/chef") {
        html = chefShell(renderChef());
        title = "Kitchen board · SymbiEat";
      } else if (path === "/admin") {
        html = adminShell(renderAdminOverview());
        title = "Overview · SymbiEat admin";
        if (!state.inventory.length && isStaff()) { await loadInventory(); }
        if (seq !== renderSeq) return;
        html = adminShell(renderAdminOverview());
      } else if (path === "/admin/menu") {
        html = adminShell(renderAdminMenu());
        title = "Menu items · SymbiEat admin";
      } else if (path === "/admin/inventory") {
        if (!state.inventory.length && isStaff()) await loadInventory();
        if (seq !== renderSeq) return;
        html = adminShell(renderAdminInventory());
        title = "Inventory · SymbiEat admin";
      } else if (path === "/admin/orders") {
        html = adminShell(renderAdminOrders());
        title = "Orders · SymbiEat admin";
      } else {
        html = customerShell(`
          <div class="shell page-shell">
            <div class="cart-empty">
              <span class="empty-plate">${icon("search", 22)}</span>
              <h2>That page went off-menu.</h2>
              <p>The link doesn't match anything in the canteen.</p>
              <a class="btn btn-primary" href="#/">Back to the menu</a>
            </div>
          </div>`);
        title = "Page not found · SymbiEat";
      }
    } catch (error) {
      console.error(error);
      html = customerShell(`
        <div class="shell page-shell">
          <div class="cart-empty">
            <span class="empty-plate">${icon("alert", 22)}</span>
            <h2>Something burned in the kitchen.</h2>
            <p>${esc(error.message || "Please try again.")}</p>
            <a class="btn btn-primary" href="#/">Back to the menu</a>
          </div>
        </div>`);
    }

    if (seq !== renderSeq) return;
    app.innerHTML = html;
    document.title = title;
    if (scroll) window.scrollTo(0, 0);
  }

  /* ------------------------------------------------------------------------
     Actions
     ------------------------------------------------------------------------ */
  function replaceThemeIcons() {
    document.querySelectorAll('[data-action="toggle-theme"]').forEach((button) => {
      const theme = document.documentElement.dataset.theme || "light";
      button.innerHTML = icon(theme === "dark" ? "sun" : "moon", 17);
      button.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} mode`);
    });
  }

  async function addToCart(dishId) {
    const dish = state.dishes.find((d) => String(d.id) === String(dishId));
    if (!dish || !dish.isAvailable) {
      toast("That dish is sold out", "error");
      return;
    }
    try {
      if (state.offline) {
        const existing = localCartData().items.find((line) => String(line.menuItemId) === String(dishId));
        setLocalLine(dishId, (existing ? existing.quantity : 0) + 1);
      } else {
        const data = await api("/api/cart/items", {
          method: "POST",
          body: { menuItemId: dishId, quantity: 1 }
        });
        state.cart = { items: data.cart.items || [], total: data.cart.total || 0 };
      }
      toast(`${dish.name} added to your bag`);
      syncCartBadge();
      if (getPath() === "/") updateMenuGrid();
      else await renderRoute();
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function changeMenuQuantity(dishId, delta) {
    const line = cartLineFor(dishId);
    try {
      if (state.offline) {
        const current = line ? line.quantity : 0;
        setLocalLine(dishId, current + delta);
      } else if (!line) {
        if (delta <= 0) return;
        const data = await api("/api/cart/items", {
          method: "POST", body: { menuItemId: dishId, quantity: 1 }
        });
        state.cart = { items: data.cart.items || [], total: data.cart.total || 0 };
      } else {
        const next = line.quantity + delta;
        const data = next <= 0
          ? await api(`/api/cart/items/${encodeURIComponent(line.cartItemId)}`, { method: "DELETE" })
          : await api(`/api/cart/items/${encodeURIComponent(line.cartItemId)}`, {
              method: "PUT", body: { quantity: next }
            });
        state.cart = { items: data.cart.items || [], total: data.cart.total || 0 };
      }
      syncCartBadge();
      if (getPath() === "/") updateMenuGrid();
      else await renderRoute();
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function changeCartQuantity(cartItemId, menuItemId, delta) {
    const line = state.cart.items.find((item) => String(item.cartItemId) === String(cartItemId));
    if (!line) return;
    try {
      if (state.offline) {
        setLocalLine(menuItemId, line.quantity + delta);
      } else {
        const next = line.quantity + delta;
        const data = next <= 0
          ? await api(`/api/cart/items/${encodeURIComponent(cartItemId)}`, { method: "DELETE" })
          : await api(`/api/cart/items/${encodeURIComponent(cartItemId)}`, {
              method: "PUT", body: { quantity: next }
            });
        state.cart = { items: data.cart.items || [], total: data.cart.total || 0 };
      }
      await renderRoute();
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function removeCartItem(cartItemId, menuItemId) {
    try {
      if (state.offline) {
        setLocalLine(menuItemId, 0);
      } else {
        const data = await api(`/api/cart/items/${encodeURIComponent(cartItemId)}`, { method: "DELETE" });
        state.cart = { items: data.cart.items || [], total: data.cart.total || 0 };
      }
      toast("Item removed from your bag");
      await renderRoute();
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function checkout(button) {
    if (!state.cart.items.length || button.disabled) return;
    button.disabled = true;
    const original = button.innerHTML;
    button.innerHTML = "Talking to the kitchen…";
    await sleep(650);
    try {
      let order;
      if (state.offline) {
        order = {
          _id: "local-" + Date.now(),
          token: randomToken(),
          items: state.cart.items.map((line) => ({
            name: line.name, price: line.price, quantity: line.quantity, subtotal: line.subtotal
          })),
          total: state.cart.total,
          status: "placed",
          paymentStatus: "paid",
          paymentMethod: "demo_upi",
          createdAt: new Date().toISOString(),
          user: { name: state.user.name, prn: state.user.prn }
        };
        saveLocalOrders([order, ...localOrders()]);
        writeJSON("symbieat-cart-v1", []);
        state.cart = { items: [], total: 0 };
      } else {
        const data = await api("/api/orders", { method: "POST", body: {} });
        order = data.order;
        await Promise.all([loadCart(), loadOrders()]);
      }
      syncCartBadge();
      toast(`Order ${order.token} placed`);
      navigate(`#/order/${order.token}`);
    } catch (error) {
      toast(error.message, "error");
      button.disabled = false;
      button.innerHTML = original;
    }
  }

  async function cancelOrder(orderId, chef = false) {
    const order = state.orders.find((item) => String(item._id) === String(orderId));
    if (!order) return;
    if (chef && !window.confirm(`Cancel order ${order.token}?`)) return;
    try {
      if (state.offline) {
        updateLocalOrder(orderId, "cancelled");
      } else if (chef) {
        await api(`/api/orders/${encodeURIComponent(orderId)}/status`, {
          method: "PATCH", body: { status: "cancelled" }
        });
        await loadOrders();
      } else {
        await api(`/api/orders/${encodeURIComponent(orderId)}/cancel`, { method: "POST" });
        await loadOrders();
      }
      toast(`Order ${order.token} cancelled`);
      await renderRoute();
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function advanceOrder(orderId, nextStatus) {
    const order = state.orders.find((item) => String(item._id) === String(orderId));
    if (!order) return;
    try {
      if (state.offline) {
        updateLocalOrder(orderId, nextStatus);
      } else {
        await api(`/api/orders/${encodeURIComponent(orderId)}/status`, {
          method: "PATCH", body: { status: nextStatus }
        });
        await loadOrders();
      }
      toast(`${order.token} · ${(STATUS_META[nextStatus] || {}).label || nextStatus}`);
      await renderRoute();
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function addMenuItem(form) {
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const price = moneyNumber(data.get("price"));
    const category = String(data.get("category") || "");
    if (!name || !price) { toast("A name and a price above zero are required", "error"); return; }
    try {
      if (!state.offline) {
        await api("/api/menu", {
          method: "POST",
          body: {
            name, price, category,
            description: String(data.get("description") || "").trim(),
            isVegetarian: data.get("isVegetarian") === "on",
            isAvailable: data.get("isAvailable") === "on"
          }
        });
        await loadMenu();
      } else {
        state.dishes.unshift(normaliseDish({
          id: "local-" + Date.now(), name, price, category,
          description: String(data.get("description") || "").trim(),
          isVegetarian: data.get("isVegetarian") === "on",
          isAvailable: data.get("isAvailable") === "on"
        }));
      }
      state.addOpen = false;
      toast(`${name} added to the menu`);
      await renderRoute();
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function editMenuItem(id, form) {
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const price = moneyNumber(data.get("price"));
    const category = String(data.get("category") || "");
    if (!name || !price) { toast("A name and a price above zero are required", "error"); return; }
    try {
      if (!state.offline) {
        await api(`/api/menu/${encodeURIComponent(id)}`, {
          method: "PUT", body: { name, price, category }
        });
        await loadMenu();
      } else {
        state.dishes = state.dishes.map((dish) =>
          String(dish.id) === String(id) ? { ...dish, name, price, category } : dish
        );
      }
      state.editingId = null;
      toast(`${name} updated`);
      await renderRoute();
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function toggleAvailability(id) {
    const dish = state.dishes.find((d) => String(d.id) === String(id));
    if (!dish) return;
    try {
      if (!state.offline) {
        await api(`/api/menu/${encodeURIComponent(id)}`, {
          method: "PUT", body: { isAvailable: !dish.isAvailable }
        });
        await loadMenu();
      } else {
        state.dishes = state.dishes.map((d) =>
          String(d.id) === String(id) ? { ...d, isAvailable: !d.isAvailable } : d
        );
      }
      toast(`${dish.name} marked ${dish.isAvailable ? "unavailable" : "available"}`);
      await renderRoute();
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function deleteMenuItem(id) {
    const dish = state.dishes.find((d) => String(d.id) === String(id));
    if (!dish) return;
    if (!window.confirm(`Delete ${dish.name} from the menu? This cannot be undone.`)) return;
    try {
      if (!state.offline) {
        await api(`/api/menu/${encodeURIComponent(id)}`, { method: "DELETE" });
        await loadMenu();
      } else {
        state.dishes = state.dishes.filter((d) => String(d.id) !== String(id));
      }
      state.editingId = null;
      toast(`${dish.name} removed`);
      await renderRoute();
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function updateStock(id, value) {
    const quantity = moneyNumber(value);
    try {
      if (state.offline) {
        state.inventory = state.inventory.map((item) =>
          String(item.id || item._id) === String(id) ? { ...item, quantity } : item
        );
        toast("Stock updated locally");
      } else {
        await api(`/api/inventory/${encodeURIComponent(id)}`, {
          method: "PATCH", body: { quantity }
        });
        await loadInventory();
        toast("Stock updated");
      }
      await renderRoute();
    } catch (error) {
      toast(error.message, "error");
    }
  }

  /* ------------------------------------------------------------------------
     Event wiring
     ------------------------------------------------------------------------ */
  app.addEventListener("click", async (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;

    switch (action) {
      case "switch-role":
        event.preventDefault();
        
        break;
      case "toggle-theme": {
        const html = document.documentElement;
        const next = html.dataset.theme === "dark" ? "light" : "dark";
        html.dataset.theme = next;
        try { localStorage.setItem("symbieat-theme", next); } catch { /* noop */ }
        replaceThemeIcons();
        break;
      }
      case "scroll-menu":
        event.preventDefault();
        if (getPath() !== "/") {
          navigate("#/");
          setTimeout(() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" }), 80);
        } else {
          document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
        }
        break;
      case "filter-category":
        state.category = target.dataset.category || ALL_CATEGORIES;
        updateMenuGrid();
        break;
      case "reset-filters":
        state.search = "";
        state.category = ALL_CATEGORIES;
        await renderRoute();
        break;
      case "add-item":
        await addToCart(target.dataset.id);
        break;
      case "menu-inc":
        await changeMenuQuantity(target.dataset.id, 1);
        break;
      case "menu-dec":
        await changeMenuQuantity(target.dataset.id, -1);
        break;
      case "cart-inc":
        await changeCartQuantity(target.dataset.cartId, target.dataset.id, 1);
        break;
      case "cart-dec":
        await changeCartQuantity(target.dataset.cartId, target.dataset.id, -1);
        break;
      case "cart-remove":
        await removeCartItem(target.dataset.cartId, target.dataset.id);
        break;
      case "checkout":
        await checkout(target);
        break;
      case "cancel-order":
        await cancelOrder(target.dataset.id, false);
        break;
      case "chef-cancel":
        await cancelOrder(target.dataset.id, true);
        break;
      case "advance-order":
        await advanceOrder(target.dataset.id, target.dataset.next);
        break;
      case "toggle-add":
        state.addOpen = !state.addOpen;
        state.editingId = null;
        await renderRoute();
        break;
      case "edit-dish":
        state.editingId = state.editingId === target.dataset.id ? null : target.dataset.id;
        await renderRoute();
        break;
      case "cancel-edit":
        state.editingId = null;
        await renderRoute();
        break;
      case "toggle-availability":
        await toggleAvailability(target.dataset.id);
        break;
      case "delete-dish":
        await deleteMenuItem(target.dataset.id);
        break;
      default:
        break;
    }
  });

  app.addEventListener("input", (event) => {
    const target = event.target;
    if (target.id === "menu-search") {
      state.search = target.value;
      updateMenuGrid();
    }
    if (target.id === "admin-menu-search") {
      state.adminMenuSearch = target.value;
      const list = document.getElementById("admin-menu-list");
      const count = document.getElementById("admin-menu-count");
      if (list) list.innerHTML = adminMenuRows();
      if (count) {
        const shown = state.dishes.filter((dish) =>
          !state.adminMenuSearch.trim() ||
          dish.name.toLowerCase().includes(state.adminMenuSearch.trim().toLowerCase()) ||
          dish.category.toLowerCase().includes(state.adminMenuSearch.trim().toLowerCase())
        ).length;
        count.textContent = `${shown} item${shown === 1 ? "" : "s"} shown`;
      }
    }
  });

  app.addEventListener("change", async (event) => {
    const target = event.target;
    if (target.matches("[data-stock-input]")) {
      await updateStock(target.dataset.id, target.value);
    }
  });

  app.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-form]");
    if (!form) return;
    event.preventDefault();
    if (form.dataset.form === "login") await doLogin(form);
    if (form.dataset.form === "add-menu") await addMenuItem(form);
    if (form.dataset.form === "edit-menu") await editMenuItem(form.dataset.id, form);
  });

  /* ------------------------------------------------------------------------
     Polling
     ------------------------------------------------------------------------ */
  function orderSignature() {
    return state.orders.map((order) => `${order._id}:${order.status}`).join("|");
  }

  async function poll() {
    if (document.hidden || state.busy) return;
    const path = getPath();
    if (!path.startsWith("/chef") && !path.startsWith("/order/")) return;
    const before = orderSignature();
    await loadOrders();
    if (orderSignature() !== before && (getPath().startsWith("/chef") || getPath().startsWith("/order/"))) {
      await renderRoute();
    }
  }

  /* ------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */
  function applyStoredTheme() {
    let theme = "light";
    try {
      theme = localStorage.getItem("symbieat-theme") || "light";
    } catch { /* noop */ }
    document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
  }

  function renderLogin() {
    return `
      <header class="site-header">
        <div class="shell site-header-inner">
          <a class="brand" href="#/login" aria-label="SymbiEat home">
            <span class="brand-mark">${icon("leaf", 18)}</span>
            <span>SymbiEat</span>
          </a>
        </div>
      </header>
      <main id="main">
        <div class="shell page-shell" style="max-width:420px">
          <div class="page-head" style="text-align:center">
            <span class="eyebrow">Authentication</span>
            <h1>Sign in</h1>
            <p class="page-sub" style="margin-inline:auto">Use your PRN and password to access SymbiEat.</p>
          </div>
          <form class="panel" data-form="login" style="display:grid;gap:14px">
            <div class="field">
              <label for="login-prn">PRN</label>
              <input class="input" id="login-prn" name="prn" placeholder="20240101001" required autocomplete="username" />
            </div>
            <div class="field">
              <label for="login-password">Password</label>
              <input class="input" id="login-password" name="password" type="password" placeholder="Enter password" required autocomplete="current-password" />
            </div>
            <button class="btn btn-primary btn-block" type="submit">Sign in</button>
            <p class="muted" style="text-align:center;font-size:11px">Test users: 20240101001 / 20240101001 · STAFF2026001 / STAFF2026001 · ADMIN2026001 / ADMIN2026001</p>
          </form>
        </div>
      </main>
      ${siteFooter()}
    `;
  }

  function bootShell() {
    app.innerHTML = renderLogin();
  }

  async function boot() {
    applyStoredTheme();
    bootShell();
    try {
      await ensureSession();
      await loadAll();
    } catch (error) {
      console.error(error);
      toast("Could not reach the backend — starting local demo mode", "error");
    }
    await renderRoute({ scroll: true });

    window.addEventListener("hashchange", () => renderRoute({ scroll: true }));
    window.addEventListener("storage", (event) => {
      if (state.offline && ["symbieat-cart-v1", "symbieat-orders-v1", "symbieat-menu-v1"].includes(event.key)) {
        loadAll().then(() => renderRoute());
      }
    });

    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(poll, 4000);
  }

  boot();
})();
