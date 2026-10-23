# SymbiEat — Complete System Description

> A comprehensive reference covering the backend, frontend, architecture, design choices, internals and routes. Intended to answer anything that might be asked during a presentation or review.

---

## 1. Project Overview

**SymbiEat** is a full-stack campus canteen ordering system. Students browse a seeded menu, pay through a simulated checkout, and collect food using a four-digit pickup token. The kitchen (chef) gets a live Kanban board, and canteen admins get an operations console for menu, inventory and orders.

- **Project name:** SymbiEat ("Campus food ordering")
- **Working directory:** `/home/rishis/Projects/fcc_project`
- **Backend:** `backend/` — Node.js + Express 5 + Mongoose 9 + MongoDB
- **Frontend:** `backend/public/` — vanilla HTML/CSS/JavaScript (static, no bundler)
- **Backend port:** `5000` (configurable via `PORT`)
- **Database:** MongoDB (`symbieat` database)
- **Session store:** `connect-mongo` (`sessions` collection)
.
> Note: the repository's `README.md` describes a React/TypeScript/Vite frontend, but the actual implemented frontend is a single vanilla-JS file (`backend/public/app.js`) with a tiny copy-based build (`backend/public/build.js`). This document describes the real implementation.

---

## 2. Repository Layout

```
fcc_project/
├── backend/
│   ├── server.js              # Express app, middleware, static host, Mongo connect
│   ├── seed.js                # Demo accounts, menu, inventory, sample orders
│   ├── seedMenu.js            # Legacy small menu seeder (unused by main seed)
│   ├── createStaff.js         # One-off staff account creator
│   ├── .env                   # PORT, NODE_ENV, MONGO_URI, SESSION_SECRET, STAFF_TEMP_PASSWORD
│   ├── package.json
│   ├── models/
│   │   ├── User.js
│   │   ├── MenuItem.js
│   │   ├── Cart.js
│   │   ├── Order.js
│   │   ├── Payment.js
│   │   └── Inventory.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── menuRoutes.js
│   │   ├── cartRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── paymentRoutes.js
│   │   └── inventoryRoutes.js
│   └── middleware/
│       └── authMiddleware.js  # requireLogin, requireStaff
│   ├── public/                # Frontend (vanilla HTML/CSS/JS)
│   │   ├── index.html         # Shell, fonts, styles, #app mount
│   │   ├── styles.css         # Design tokens + component styles (~1100 lines)
│   │   ├── app.js             # Entire SPA (~1971 lines, IIFE)
│   │   ├── build.js           # Copies 3 files into dist/
│   │   ├── package.json       # Only build/dev scripts, no deps
│   │   └── dist/              # Production copy served by Express
├── description.md             # This file
└── README.md
```

---

## 3. Tech Stack

| Layer | Choice |
| --- | --- |
| Backend runtime | Node.js (CommonJS, type commonjs) |
| Web framework | Express 5.3 |
| ODM | Mongoose 9.11 |
| Database | MongoDB |
| Sessions | express-session 1.19 + connect-mongo 6 (Mongo-backed store) |
| Password hashing | Salted SHA-256 (server-side, crypto) |
| CORS | cors 2.8, origin true, credentials true |
| Env loading | dotenv |
| Frontend | Vanilla HTML/CSS/JS, no framework, no bundler |
| Fonts | DM Sans (body) + Playfair Display (display) via Google Fonts |
| Icons | Inline SVG (hand-written lucide-style paths) |
| Build | node build.js (in backend/public) copies 3 static files into backend/public/dist |

---

## 4. System Architecture

### 4.1 High-level

```
Browser (SPA)
  app.js  --fetch (credentials: same-origin)--> Express (port 5000)
Express
  cors -> json body -> session (MongoStore) -> routes
  static backend/public/dist + SPA fallback (GET /*)
MongoDB (symbieat)
  collections: users, menuitems, carts, orders, payments, inventories, sessions
```

### 4.2 Request lifecycle

1. Browser sends fetch(path, { credentials: "same-origin" }).
2. Express cors echoes origin + allows credentials.
3. express.json() parses body.
4. express-session reads symbieat.sid cookie, loads session from Mongo store.
5. Route handler runs, uses req.session.user for identity.
6. Response JSON; cookie re-set as needed.

### 4.3 Frontend hosting modes

- Dev mode: the backend/public/dev script just builds and prints a message. In practice developers run npm run build then npm start in backend. The API base is relative (/api/...), so the frontend must be served from the same origin as the backend for cookies to work — hence the built dist/ is served by Express.
- Production mode: NODE_ENV=production. Express serves backend/public/dist as static + SPA fallback.

### 4.4 Offline / demo fallback

The frontend is designed to keep working when the backend is unreachable:
- ensureSession() tries /api/auth/me (now removed -> 404), then falls back to state.user = null so the router shows the login page.
- loadMenu/loadCart/loadOrders/loadInventory each try/catch and fall back to hardcoded FALLBACK_* data and localStorage.
- Mutations (add to cart, place order, admin edits) branch on state.offline and write to localStorage keys symbieat-cart-v1, symbieat-orders-v1, symbieat-menu-v1.
- A storage event listener re-syncs when another tab changes local data (offline only).

---

## 5. Backend

### 5.1 server.js — bootstrap

- Loads .env.
- Creates Express app, PORT = process.env.PORT || 5000.
- Middleware: cors({ origin: true, credentials: true }), express.json().
- Session: name symbieat.sid, secret from env, resave false, saveUninitialized false, MongoStore (sessions collection), cookie httpOnly, secure only in production, sameSite lax, maxAge 2h.
- Home route GET /: serves backend/public/dist/index.html if built, else JSON status (incl. Mongo readiness).
- GET /test: "SybiEat API is working!".
- Mounts routers at /api/menu, /api/auth, /api/cart, /api/orders, /api/payments, /api/inventory.
- If backend/public/dist/index.html exists: express.static(frontendDist) + SPA fallback for non-API GETs.
- 404 handler returns JSON { message, path }.
- startServer(): validates MONGO_URI and SESSION_SECRET, connects Mongoose, listens. Exits on failure.

### 5.2 Authentication & authorization

Models — User (models/User.js):
- prn (String, required, unique, trimmed) — used as login ID.
- name (String, required, trimmed).
- email (String, required, unique, lowercased, trimmed).
- passwordHash (String, required, select: false — never returned by default). Now stores a salted SHA-256 hex digest (no bcrypt).
- role (enum student | staff | admin, default student).
- timestamps.

Middleware — middleware/authMiddleware.js:
- requireLogin: 401 if no req.session.user.
- requireStaff: 401 if not logged in; 403 if role not staff/admin.

Auth routes — routes/authRoutes.js:

College email regex: /^[a-zA-Z0-9._%+-]+@sitpune\.edu\.in$/i.

Demo accounts map (env-overridable PRNs): student 20240101001, staff STAFF2026001, admin ADMIN2026001.

Server-side cryptography: `saltedSha256(password)` derives a 16-char salt from `SHA256(password)` and returns `SHA256(salt + password)` as a hex digest. `hashPassword()` wraps it. Registration stores `hashPassword(password)`; login computes `hashPassword(password)` and compares it with the stored digest (`stored !== candidate`). No bcrypt is used anymore.

startSession(req, res, user, successMessage):
- req.session.regenerate() (fixation protection).
- Stores req.session.user = { id, prn, name, email, role }.
- req.session.save() then responds 200 with { message, user }.

Routes (only these two remain):
- `POST /api/auth/register` — body `{ prn, name, email, password }`. Validates all strings present/non-empty, college email, password length 8-72. Checks uniqueness of PRN or email (409). Hashes password with salted SHA-256. Creates user with role `student` (role cannot be chosen). Returns 201. Duplicate-key (11000) -> 409.
- `POST /api/auth/login` — body `{ prn, email, password }`. Requires either `prn` or `email` plus password. If `prn` given: `User.findOne({ prn })`. Else validates college email regex, then `User.findOne({ email })`. Uses `.select("+passwordHash")`. Compares `hashPassword(password)` with the stored digest. On match calls `startSession`. Failure -> 401 "Invalid PRN or password".

Removed endpoints: `/api/auth/demo-login`, `/api/auth/logout` and `/api/auth/me` are no longer implemented. (The frontend still calls `/api/auth/logout` and `/api/auth/me` opportunistically; `/me` 404s so the app falls through to the login page, and logout failures are swallowed while local state is cleared.)

### 5.3 Menu

Model — MenuItem (models/MenuItem.js):
- name (String, required, trimmed, max 100)
- description (String, default "", trimmed, max 500)
- price (Number, required, min 0)
- category (String, required, trimmed, max 50)
- image (String, default "")
- label (String, default "", trimmed, max 50)
- isAvailable (Boolean, default true)
- isVegetarian (Boolean, default true)
- timestamps.

Routes — routes/menuRoutes.js:
- GET /api/menu — all items, sorted { category: 1, name: 1 }. Reads are public (no router.use(requireLogin); only write endpoints use requireStaff inline).
- GET /api/menu/available — isAvailable: true, sorted.
- GET /api/menu/search?q= — case-insensitive regex on name, available only. 400 if empty/too long (>100).
- GET /api/menu/category/:category — exact (case-insensitive) category match, available only.
- GET /api/menu/:id — by ObjectId. 400 if invalid id, 404 if missing.
- POST /api/menu — requireStaff. Validates name/category strings, price finite number >=0, optional booleans. Creates item. 201.
- PUT /api/menu/:id — requireStaff. Allow-listed fields: name, description, price, category, image, label, isVegetarian, isAvailable. Validates price and booleans. 404 if not found.
- DELETE /api/menu/:id — requireStaff. Deletes. 404 if not found.

### 5.4 Cart

Model — Cart (models/Cart.js):
- user (ObjectId ref User, required, unique) — one cart per user.
- items (array of { menuItem: ObjectId ref MenuItem (required), quantity: Number (required, min 1) }, _id: true).
- timestamps.

Routes — routes/cartRoutes.js (all requireLogin):
- GET /api/cart — returns { items: [{cartItemId, menuItemId, name, price, quantity, subtotal, isAvailable}], total }. Populates menuItem; skips missing.
- POST /api/cart/items — body { menuItemId, quantity }. Validates ObjectId, quantity integer 1-50. Checks item exists & available. If already in cart, increments (max 50 combined). Else pushes. Returns updated cart.
- PUT /api/cart/items/:id — sets quantity 1-50 for a cart line (by cart item _id). Validates availability.
- DELETE /api/cart/items/:id — removes one line.
- DELETE /api/cart — clears cart.

### 5.5 Orders

Model — Order (models/Order.js):
- user (ObjectId ref User, required, indexed)
- token (String, required, unique, indexed, trimmed, uppercased) — SE-XXXX (4 digits).
- items (array of { menuItem: ObjectId ref MenuItem (required), name (required), price (required, min0), quantity (required, min1), subtotal (required, min0) }, _id: false). Must be non-empty.
- total (Number, required, min0).
- status (enum placed | confirmed | preparing | ready | completed | cancelled, default placed).
- paymentStatus (enum pending | paid | failed | refunded, default pending).
- paymentMethod (enum demo_upi | cash, default demo_upi).
- estimatedReadyAt (Date, default null).
- cancelledAt (Date, default null).
- timestamps.

Routes — routes/orderRoutes.js (all requireLogin; staff actions requireStaff):
- POST /api/orders — builds order from logged-in user's cart. Validates cart non-empty and each item still available. Snapshots price/name into order items. Calls createOrderWithToken (allocates SE-XXXX with up to 8 retries on collision). Clears cart. Returns 201 { message, order }. Payment status starts pending.
- GET /api/orders — student sees own; staff/admin sees all (populated user name/prn/email/role), sorted newest first. Returns { orders }.
- GET /api/orders/token/:token — lookup by pickup token (validated SE-\d{4}). Staff can look up any; students only their own. Returns { order }.
- GET /api/orders/:id/tracking — returns { orderId, status, createdAt, estimatedReadyAt, cancelledAt }. Ownership enforced for students.
- POST /api/orders/:id/cancel — student only. Only placed/confirmed can be cancelled. Sets status cancelled, cancelledAt.
- GET /api/orders/:id — full order (populated user). Ownership enforced.
- PATCH /api/orders/:id/status — requireStaff. Body { status }. Allowed: confirmed, preparing, ready, completed, cancelled. Validates against transition map:
  - placed -> confirmed | cancelled
  - confirmed -> preparing | cancelled
  - preparing -> ready
  - ready -> completed
  - completed -> (none)
  - cancelled -> (none)
  On preparing: sets estimatedReadyAt = now + 15 min. On cancelled: sets cancelledAt. Returns updated order. Invalid transition -> 400.

Token allocation: crypto.randomInt(1000, 10000) -> 4 digits (1000-9999), prefixed SE-. Unique index handles collisions; retried up to 8 times.

### 5.6 Payments

Model — Payment (models/Payment.js):
- order (ObjectId ref Order, required, unique) — one payment per order.
- user (ObjectId ref User, required).
- amount (Number, required, min0).
- method (enum demo_upi, default demo_upi).
- qrCode (String, default null) — placeholder image URL.
- status (enum pending | paid | failed, default pending).
- transactionId (String, unique, sparse, default undefined).
- paidAt (Date, default null).
- timestamps.

Routes — routes/paymentRoutes.js (all requireLogin):
- POST /api/payments — body { orderId } (valid 24-hex). Finds order; ownership check (student own or staff/admin). Rejects cancelled orders and already-paid orders. Reuses existing payment if present; else creates one with amount = order.total, method = demo_upi, status = pending, qrCode = DEMO_QR_CODE (placehold.co URL). Returns { message, demoOnly: true, payment: { id, orderId, amount, method, status, qrCode, qrPlaceholder, instructions } }.
- GET /api/payments/order/:orderId — returns payment for an order (ownership enforced). Uses placeholder QR if missing.
- POST /api/payments/:paymentId/demo-result — disabled in production. Body { result: "success" | "failure" }. Validates ownership. Rejects if already paid or cancelled or amount mismatch. On failure: sets payment.status = failed, saves. On success: sets payment.status = paid, paidAt = now, transactionId = "DEMO-" + uuid; sets order.paymentStatus = "paid"; saves both. Returns { demoOnly, paymentStatus, transactionId?, orderPaymentStatus? }.

### 5.7 Inventory

Model — Inventory (models/Inventory.js):
- name (String, required, unique, trimmed, max 100).
- quantity (Number, required, min0).
- unit (enum kg | L | pcs, required).
- lowStockAt (Number, required, min0).
- area (String, required, trimmed, max 100).
- timestamps.

Routes — routes/inventoryRoutes.js (all requireStaff):
- GET /api/inventory — all records, sorted { area: 1, name: 1 }.
- POST /api/inventory — body { name, quantity, unit, lowStockAt, area }, validated. Creates. 409 on duplicate name.
- PATCH /api/inventory/:id — allow-listed fields name, quantity, unit, lowStockAt, area. Runs validators. 404 if missing.
- DELETE /api/inventory/:id — deletes. 404 if missing.

### 5.8 Seeding — seed.js

Invoked via npm run seed or npm run seed:reset (adds --reset).

- Connects to Mongo.
- seedUsers() — upserts 5 demo users (3 students, 1 staff, 1 admin) with salted SHA-256 hashes (password = PRN). Uses findOneAndUpdate with $set, upsert.
- seedMenu() — upserts 11 menu items (Mysore Masala Dosa, Tandoori Paneer Roll, Rajma Chawal Bowl, Chicken Dum Biryani, Idli Sambar, Amritsari Chole Kulche (unavailable), Anda Bhurji Pav, Lemon Rice & Papad, Veg Thali, Veg Hakka Noodles, Veg Manchurian with Fried Rice).
- seedInventory() — upserts 8 stock records.
- seedOrders(users, dishes) — if --reset, deletes all payments & orders. If orders already exist (and not reset), skips. Otherwise creates 12 sample orders (SE-2041..SE-2052) with statuses spread across placed/confirmed/preparing/ready/completed/cancelled, backdated createdAt via updateOne with timestamps: false. Creates matching Payment records (paid, except cancelled -> refunded; no payment record for pending). Sets estimatedReadyAt for preparing orders (+15 min).

Demo accounts:
| Role | PRN | Password |
| --- | --- | --- |
| Student | 20240101001 | Student@123 |
| Student | 20240101002 | Student@123 |
| Student | 20240101003 | Student@123 |
| Staff (chef) | STAFF2026001 | Staff@1234 |
| Admin | ADMIN2026001 | Admin@1234 |

createStaff.js is a separate one-off script that creates/updates the staff account using STAFF_TEMP_PASSWORD (must be 12-72 chars), hashed with salted SHA-256. seedMenu.js is a legacy small seeder (5 items) not used by main flow.

Note: demo passwords now equal the PRN (e.g. 20240101001 / 20240101001), matching the login hint in the UI.

### 5.9 Environment variables (backend/.env)

| Variable | Purpose |
| --- | --- |
| PORT | Server port (default 5000) |
| NODE_ENV | development enables demo login + demo payments; production disables them |
| MONGO_URI | MongoDB connection string |
| SESSION_SECRET | express-session signing secret |
| STAFF_TEMP_PASSWORD | Used by createStaff.js (12-72 chars) |
| DEMO_STUDENT_PRN / DEMO_STAFF_PRN / DEMO_ADMIN_PRN | Optional overrides for demo account PRNs |

---

## 6. Frontend

### 6.1 Architecture

- Single IIFE in backend/public/app.js (~1971 lines). No modules, no build step beyond file copy.
- Authentication is PRN + password via a dedicated login page (renderLogin, doLogin); the demo role switcher (demoBar) has been removed from all shells.
- Global state object: user, offline, dishes, cart, orders, inventory, search, category, adminMenuSearch, editingId, addOpen, busy.
- Hash-based SPA router: getPath() reads window.location.hash (e.g. #/cart). navigate(hash) sets hash or re-renders.
- Rendering: template-literal HTML strings injected into #app. renderRoute() dispatches by path and calls view functions.
- Event delegation: one click/input/change/submit listener on #app handling data-action attributes.
- Polling: setInterval(poll, 4000) reloads orders on chef/order pages and re-renders if the status signature changed.
- Theme: data-theme on html, persisted in localStorage (symbieat-theme).

### 6.2 API client

api(path, { method, body }): fetch with credentials "same-origin", JSON body, parses JSON, throws Error with .status on non-OK. Base paths are relative (/api/...).

### 6.3 Offline/demo mode

See 4.4. Key localStorage keys:
- symbieat-cart-v1 — array of { id, quantity }.
- symbieat-orders-v1 — array of order objects (with _id starting local-).
- symbieat-menu-v1 — (referenced in storage listener) menu cache.
- symbieat-theme — "light"/"dark".

syntheticUser(role) returns demo users for offline role switch. randomToken() generates SE-XXXX avoiding collisions with existing tokens.

### 6.4 Views / routes (frontend hash routes)

| Hash route | View | Who |
| --- | --- | --- |
| #/login | renderLogin() — PRN + password sign-in form | Guest |
| #/ (home) | renderHome() — hero, search, category filters, dish grid | All |
| #/cart | renderCart() — line items, qty steppers, summary, checkout | Customer |
| #/orders | renderOrders() — order history cards | Customer |
| #/order/:token | renderOrder() — token, tracker, items, cancel | Customer |
| #/chef | renderChef() — Kanban (Incoming / On the line / Ready + cancelled lane) | Staff |
| #/admin | renderAdminOverview() — metrics, recent orders, stock watch | Admin |
| #/admin/menu | renderAdminMenu() — list, add form, inline edit, toggle, delete | Admin |
| #/admin/inventory | renderAdminInventory() — table with inline stock inputs | Admin |
| #/admin/orders | renderAdminOrders() — full ledger | Admin |

renderRoute() handles a render sequence counter (renderSeq) to discard stale async renders.

### 6.5 Components / render functions

- demoBar() — role switcher (Customer/Chef/Admin) shown at top in demo mode.
- siteHeader() — brand, nav, account chip, theme toggle, cart badge.
- siteFooter() — footer.
- Shell wrappers: customerShell, chefShell, adminShell (admin has sidebar nav).
- dishCard, qtyControl, filteredDishes, updateMenuGrid.
- trackerHTML, orderDetailHTML, renderOrder.
- chefCard, laneEmpty, renderChef.
- renderAdminOverview, adminMenuRows, renderAdminMenu, renderAdminInventory, renderAdminOrders.
- Icons via icon(name, size) from ICONS map.

### 6.6 Customer flows

- Menu browsing: search (name/description/category), category pills (South Indian, North Indian, Rice & bowls, Quick bites + All), veg/non-veg marker, sold-out badge, labels.
- Cart: server-backed (/api/cart). Add/increment/decrement/remove. Calls API then updates state.cart from response. Qty stepper on menu cards syncs with cart.
- Checkout: checkout() -> POST /api/orders (cart -> order + token) -> clears cart -> navigates to #/order/:token. Simulated payment note.
- Order tracking: /order/:token shows SE-XXXX token, 4-step tracker (Received -> Accepted -> Preparing -> Ready), items, total, cancel button (placed/confirmed only).
- Order history: /orders lists tokens newest first, links to tracking.

### 6.7 Chef dashboard

- Kanban with lanes: Incoming (placed), On the line (confirmed + preparing), Ready for pickup (ready + completed), plus Cancelled lane (if any).
- Cards show token, customer name + PRN, items with quantities, total, time, status pill.
- Action button advances status: Accept (placed->confirmed) -> Start preparing (confirmed->preparing) -> Mark ready (preparing->ready) -> Waiting at pickup (ready).
- Cancel action for placed/confirmed orders (with confirm dialog).
- Active-order counter in header pill.
- Auto-refresh every 4s via polling (only on /chef and /order/ paths).

### 6.8 Admin dashboard

- Overview: metrics (total orders, pending, completed, low-stock count), recent 5 orders, stock-to-watch list (low stock first), quick strip showing dish count.
- Menu management: search, add form (name, price, category, description, veg, available), inline edit (name, price, category), toggle availability, delete (with confirm). Calls API when online; mutates local state when offline.
- Inventory: table with inline quantity inputs (change event triggers PATCH). Shows low-stock condition pill. Low-stock callout.
- Orders ledger: all orders with token, customer, PRN, items, payment status, total, status. Sorted newest first.

### 6.9 Styling (styles.css)

- CSS custom properties (design tokens) in :root (HSL-based): --background, --foreground, --primary, --accent, --secondary, --muted, --border, --card, --destructive, plus semantic status tokens --st-received/accepted/preparing/ready/cancelled with bg variants.
- Dark theme via [data-theme="dark"] overrides.
- Typography: DM Sans (sans) + Playfair Display (display serif).
- Layout: .shell max-width container, grid/flex. Components: cards, buttons, pills, steppers, tracker, kanban lanes, admin sidebar, tables, toasts, skeletons, empty states.
- Responsive: media queries for smaller screens (header collapses, admin sidebar becomes top nav, etc.).
- Animations: fade-in, rise, toast enter/leave.

### 6.10 Boot sequence

1. applyStoredTheme() sets theme from localStorage.
2. bootShell() renders skeleton.
3. ensureSession() -> tries /api/auth/me (404), then state.user = null (login page).
4. loadAll() -> menu, cart+orders in parallel, inventory (if staff).
5. renderRoute() renders real UI.
6. Registers hashchange, storage listeners.
7. Starts 4s polling.

---

## 7. Key Data Flows

### 7.1 Place order (end-to-end)

1. Student adds items -> POST /api/cart/items (or local).
2. Student clicks checkout -> POST /api/orders with empty body.
3. Backend reads user's cart, validates availability, snapshots price/name, allocates SE-XXXX token (retry on collision), creates Order (status: placed, paymentStatus: pending), clears cart.
4. Frontend calls loadCart() + loadOrders(), shows toast "Order SE-XXXX placed", navigates to #/order/SE-XXXX.
5. (Optional) Payment: POST /api/payments creates Payment; POST /api/payments/:id/demo-result with success marks paid and sets order.paymentStatus = paid.

### 7.2 Kitchen flow

1. Chef opens #/chef -> GET /api/orders (all orders).
2. Clicks "Accept order" -> PATCH /api/orders/:id/status { status: "confirmed" }.
3. "Start preparing" -> preparing (sets estimatedReadyAt = now+15m).
4. "Mark ready for pickup" -> ready.
5. "Mark collected" -> completed (via ready->completed).
6. Cancel (placed/confirmed) -> cancelled.

Frontend polls every 4s; re-renders if status signature changed.

### 7.3 Admin menu edit

1. Admin toggles edit -> inline form.
2. Submit -> PUT /api/menu/:id { name, price, category }.
3. loadMenu() refreshes; UI re-renders.
4. Toggle availability -> PUT /api/menu/:id { isAvailable }.
5. Delete -> DELETE /api/menu/:id (confirm first).
6. Add -> POST /api/menu.

### 7.4 Inventory update

Admin changes quantity input -> change event -> PATCH /api/inventory/:id { quantity } -> loadInventory() -> re-render. Low-stock flag recomputed client-side (quantity <= lowStockAt).

---

## 8. Design Choices & Rationale

- Session-based auth over JWT: simpler for a demo, httpOnly cookie prevents XSS token theft, Mongo store survives server restarts. sameSite lax allows top-level navigation while blocking CSRF on cross-site POSTs (mitigated by same-origin frontend).
- PRN as login ID: matches campus identity; email kept as fallback for older clients and registration.
- Salted SHA-256 instead of bcrypt: server-side password hashing uses a salted SHA-256 digest (salt derived from SHA256(password)); simpler and dependency-free, at the cost of not being a slow KDF.
- Server-backed cart: cart persists across devices/sessions and is the single source of truth at checkout; quantities validated 1-50.
- Order snapshots price & name: historical orders keep their original price even if menu price changes later (auditability).
- Token allocation with retries: 4-digit SE-XXXX is memorable; unique index + up to 8 retries handles collisions.
- Explicit status transition map: prevents illegal jumps (e.g., ready->placed); enforces a linear kitchen workflow with cancellation only before preparation.
- estimatedReadyAt = +15 min on preparing: simple ETA for tracking page; not a real SLA.
- Role-based access via middleware: requireLogin / requireStaff; admin shares staff privileges (admin is in the staff allow-list). Admin-only UI gating is frontend-side; backend treats admin superset of staff.
- Offline-first frontend: demo resilience — the app still works for presentations without a running backend/Mongo.
- No bundler: keeps the project dependency-light and trivially hostable; trade-off is no TypeScript/modern module system. (README's React/Vite claim is aspirational.)
- Hand-written CSS with tokens: consistent theming, dark mode, no Tailwind dependency; cost is more CSS to maintain.
- Polling over WebSockets: 4s polling is simpler and sufficient for a canteen scale; avoids socket infra.
- Simulated payments: no real gateway; QR is a placeholder image. Demo-result endpoint disabled in production.

---

## 9. Security Notes

- Passwords hashed with salted SHA-256 (16-char salt derived from SHA256(password)); passwordHash has select: false.
- Session cookie httpOnly, secure in production, sameSite lax, 2h maxAge.
- Session regeneration on login (fixation protection).
- Role checks server-side via middleware; frontend role gating is UX only.
- Ownership checks on orders/payments (students only their own).
- Input validation: types, ranges, regex for tokens/ObjectIds, email regex, search length caps, quantity caps.
- Demo endpoint (demo-result) disabled when NODE_ENV === production; /api/auth/demo-login removed entirely.
- CORS credentialed but origin echoed — acceptable for demo; production should restrict origin.
- No CSRF tokens; relies on sameSite lax + same-origin hosting.
- XSS mitigation: frontend escapes all interpolated values via esc(); backend returns JSON.

---

## 10. Known Limitations

- Payments are simulated; no real gateway.
- Images are remote URLs (Pexels/Unsplash/Wikimedia) with onerror hiding broken images.
- npm run seed:reset rebuilds orders/payments but leaves extra menu items/users.
- Demo role switcher removed; users must sign in with PRN + password. /api/auth/demo-login, /logout and /me no longer exist.
- No automated tests in the repo.
- No pagination on orders/menu (fine for demo scale).
- Offline mode uses separate localStorage data not synced to backend.
- seedMenu.js (legacy) duplicates a different small menu; not part of main seed.
- README describes React/TypeScript/Vite which is not the actual stack.

---

## 11. Quick Reference — All API Routes

### Auth (/api/auth)
| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| POST | /register | — | Register student (college email) |
| POST | /login | — | Login by PRN or email + password |
Removed: /demo-login, /logout, /me (no longer implemented).

### Menu (/api/menu)
| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| GET | / | — | All items (sorted) |
| GET | /available | — | Available only |
| GET | /search?q= | — | Name search (available only) |
| GET | /category/:category | — | By category (available only) |
| GET | /:id | — | One item |
| POST | / | staff | Create item |
| PUT | /:id | staff | Update item |
| DELETE | /:id | staff | Delete item |

### Cart (/api/cart) — all require login
| Method | Route | Purpose |
| --- | --- | --- |
| GET | / | Get cart |
| POST | /items | Add item |
| PUT | /items/:id | Set quantity |
| DELETE | /items/:id | Remove item |
| DELETE | / | Clear cart |

### Orders (/api/orders) — all require login
| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| POST | / | login | Place order from cart |
| GET | / | login | Own (student) / all (staff) |
| GET | /token/:token | login | Lookup by token |
| GET | /:id/tracking | login | Tracking info |
| POST | /:id/cancel | login (owner) | Cancel before prep |
| GET | /:id | login | Get order |
| PATCH | /:id/status | staff | Transition status |

### Payments (/api/payments) — all require login
| Method | Route | Purpose |
| --- | --- | --- |
| POST | / | Create simulated payment |
| GET | /order/:orderId | Get payment for order |
| POST | /:paymentId/demo-result | Simulate success/failure (dev) |

### Inventory (/api/inventory) — all require staff
| Method | Route | Purpose |
| --- | --- | --- |
| GET | / | All stock records |
| POST | / | Add record |
| PATCH | /:id | Update record |
| DELETE | /:id | Remove record |

### Misc
| Method | Route | Purpose |
| --- | --- | --- |
| GET | / | Home (serves frontend or status JSON) |
| GET | /test | Health-ish check |

---

## 12. Order Status State Machine

```
placed -> confirmed -> preparing -> ready -> completed
   |           |
   +-> cancelled <-+
```

- placed (UI: Received) -> confirmed (Accepted) or cancelled.
- confirmed (Accepted) -> preparing (Preparing) or cancelled.
- preparing (Preparing) -> ready (Ready for pickup). Sets estimatedReadyAt = now + 15 min.
- ready (Ready) -> completed (Collected).
- completed / cancelled are terminal.
- Student cancel allowed only in placed/confirmed.
- Chef cancel allowed in placed/confirmed.

---

## 13. Presentation Talking Points

- Problem: campus canteen queues at 1 pm; students waste time waiting.
- Solution: order ahead, pay in a tap, collect with a 4-digit token; kitchen sees a live board.
- Roles: Customer / Chef / Admin, switchable via demo bar.
- Scale of seed: 5 users, 11 dishes, 8 inventory records, 12 sample orders across all statuses.
- Key technical decisions: session auth, server-backed cart, snapshot pricing, transition-gated status, offline-first frontend, polling.
- Future scope: real payment gateway, push notifications, analytics, multi-canteen, mobile app.

---

*Generated from the actual source code in backend/ (incl. backend/public/).*
