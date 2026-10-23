# SymbiEat · Campus food ordering

SymbiEat is a full-stack campus canteen ordering system. Students browse the menu, pay with a
simulated checkout and track a four-digit pickup token. The kitchen gets a live Kanban board, and
canteen admins get an operations console for menu, inventory and orders.

The project is built around the Express + MongoDB API in `backend/` with a vanilla HTML/CSS/JS
frontend in `backend/public/`.

---

## Feature highlights

### Student
- Sign in with **PRN + password** (email fallback kept for older clients) or register with a
  `@sitpune.edu.in` college email.
- Browse the seeded campus menu with search, category filters, vegetarian markers and sold-out labels.
- Add dishes to a server-backed cart; quantities stay in sync across pages.
- Checkout with a simulated payment, receive a unique `SE-XXXX` pickup token and track the order live.
- View order history, open a tracking page and cancel orders that have not started preparation.

### Chef (staff)
- Live Kanban board with Incoming, Accepted, On the line and Ready lanes, refreshed every 4 seconds.
- One-click status transitions (`Accept → Start preparing → Mark ready`).
- Customer name + PRN on every card, cancel action for untouched orders, and a cancelled-orders lane.
- Today's active-order counter and clear empty states.

### Admin
- Operations overview: total, pending, ready and low-stock metrics plus recent orders.
- Menu management: create items with name, price and category; edit name/price; toggle availability;
  delete items. Changes are written to MongoDB and immediately visible to students.
- Inventory: live stock records with low-stock flags and inline quantity updates.
- Order ledger: every order with token, customer, items, payment status, total and status.

### Demo extras
- Role switcher in the header for Customer / Chef / Admin presentations.
- Seeded accounts, 11 menu items, 8 inventory records and 12 sample orders spread across the statuses.
- (Presentation deck removed.)

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | Vanilla HTML/CSS/JavaScript (static, no bundler) in `backend/public/` |
| Styling | Hand-written CSS with design tokens (no Tailwind dependency) |
| Backend | Node.js, Express 5, Mongoose 9 |
| Database | MongoDB |
| Sessions | `express-session` + `connect-mongo` |
| Passwords | Salted SHA-256 (server-side, no bcrypt) |
| Payments | Simulated demo payment + QR placeholder route |

---

## Repository layout

```
fcc_project/
├── backend/
│   ├── server.js              # Express app, sessions, static frontend host
│   ├── seed.js                # Demo accounts, menu, inventory and orders
│   ├── models/                # User, MenuItem, Cart, Order, Payment, Inventory
│   ├── routes/                # auth, menu, cart, orders, payments, inventory
│   └── middleware/            # requireLogin / requireStaff
├── backend/
│   ├── public/                # Frontend (vanilla HTML/CSS/JS)
│   │   ├── index.html         # Shell, fonts, styles, #app mount
│   │   ├── styles.css         # Design tokens + component styles
│   │   ├── app.js             # Entire SPA (IIFE, hash router)
│   │   ├── build.js           # Copies 3 files into dist/
│   │   ├── package.json       # Only build/dev scripts, no deps
│   │   └── dist/              # Production copy served by Express
├── docs/PRESENTATION.md
└── README.md
```

---

## Quick start

### 1. Prerequisites
- Node.js 20+
- MongoDB running locally on `mongodb://127.0.0.1:27017` (or an Atlas URI in `backend/.env`)

### 2. Install and seed the backend

```bash
cd backend
npm install
npm run seed:reset     # creates demo accounts, menu, inventory and orders
npm start              # http://localhost:5000
```

### 3. Build & serve the frontend

```bash
cd backend/public
npm run build          # copies index.html, styles.css, app.js into dist/
# restart the backend; it now serves backend/public/dist at http://localhost:5000
```

> PRN/password login works in all environments. The demo-role switcher and `/api/auth/demo-login`
> endpoint have been removed.

---

## Demo accounts

The login ID is always the **PRN**.

| Role | PRN | Password | Lands on |
| --- | --- | --- | --- |
| Student | `20240101001` | `20240101001` | `/` |
| Chef (staff) | `STAFF2026001` | `STAFF2026001` | `/chef` |
| Admin | `ADMIN2026001` | `ADMIN2026001` | `/admin` |

Additional seeded students: `20240101002` (Diya Patel) and `20240101003` (Kabir Rao), both with
their PRN as the password.

Sign in with PRN + password. (The previous demo role-switcher has been removed; users must authenticate.)

---

## Environment variables (`backend/.env`)

```ini
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/symbieat
SESSION_SECRET=replace-with-a-long-random-string
STAFF_TEMP_PASSWORD=...
```

---

## API overview

All user data routes use the session cookie (`symbieat.sid`, `httpOnly`, `sameSite=lax`).

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Register a student (college email required) |
| POST | `/api/auth/login` | Login with PRN (or email) + password |
| POST | `/api/auth/logout` | Destroy the session |
| GET | `/api/auth/me` | Current session user |
| GET | `/api/menu` | Full menu |
| GET | `/api/menu/available` | Available dishes only |
| POST/PUT/DELETE | `/api/menu`, `/api/menu/:id` | Staff/admin menu management |
| GET | `/api/cart` | Current user's server-side cart |
| POST/PUT/DELETE | `/api/cart/items…` | Add, change quantity, remove |
| POST | `/api/orders` | Turn the cart into an order and allocate a token |
| GET | `/api/orders` | Student's own orders; staff/admin see all |
| GET | `/api/orders/token/:token` | Pickup-token tracking |
| POST | `/api/orders/:id/cancel` | Student cancellation before preparation |
| PATCH | `/api/orders/:id/status` | Staff/admin status transitions |
| GET/POST/PATCH/DELETE | `/api/inventory…` | Kitchen stock records |
| POST | `/api/payments` | Create a simulated payment |
| POST | `/api/payments/:id/demo-result` | Mark demo payment success/failure |

### Order status mapping

| Backend | UI label |
| --- | --- |
| `placed` | Received |
| `confirmed` | Accepted |
| `preparing` | Preparing |
| `ready` / `completed` | Ready for pickup |
| `cancelled` | Cancelled |

---

## Scripts

| Location | Command | Description |
| --- | --- | --- |
| `backend/` | `npm start` | Start the API / built frontend on port 5000 |
| `backend/` | `npm run dev` | Start with nodemon |
| `backend/` | `npm run seed` | Seed missing demo data |
| `backend/` | `npm run seed:reset` | Reset orders/payments and reseed demo data |
| `backend/public/` | `npm run build` | Copy static files into `backend/public/dist` |
| `backend/public/` | `npm run dev` | Build then print run instructions |

---

## Known demo limitations

- Payments are simulated; no real gateway is called.
- Images are remote Pexels/Unsplash/Wikimedia URLs, with a styled plate fallback when offline.
- `npm run seed:reset` rebuilds orders and payments but leaves any extra menu items or users you
  created during a demo. Delete those from the admin UI or with MongoDB if you need a pristine reset.
- Authentication now uses PRN + password with salted SHA-256; `/api/auth/demo-login`, `/api/auth/logout`
  and `/api/auth/me` have been removed, so the frontend starts on the login page and clears local state on logout.
