#  Mother's Touch Tiffin

A hyperlocal home-cooked tiffin delivery platform built for Jamshedpur, connecting local women home cooks with customers across zones like Sakchi, Bistupur, and Telco Colony.

---

##  What It Does

Customers order fresh home-cooked meals. A cook in their zone accepts and prepares the order. A delivery partner picks it up and delivers it. Everything is real-time, pool-based, and zone-aware.

---

##  Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite |
| Routing | React Router v6 |
| State | Zustand (`authStore`, `cartStore`) |
| Backend | Supabase (Postgres + Auth + Realtime) |
| Styling | Plain CSS per page |
| Icons | Lucide React |

---

##  User Roles

| Role | Access |
|---|---|
| `customer` | Browse menu, place orders, track orders, rate cook + delivery partner, manage saved addresses |
| `cook` | View + accept zone pool orders, mark ready, toggle availability |
| `delivery` | View + accept ready orders, mark delivered |
| `admin` | View all orders, all cooks |

Role is stored in `auth.users.user_metadata.role` and enforced via `ProtectedRoute`.

---

## 📁 Project Structure

```
src/
├── assets/
│   └── mtt.jpg                  # Hero background image
├── components/
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   └── ProtectedRoute.jsx       # Role-based route guard
├── lib/
│   ├── api.js                   # Supabase REST calls (orders, menu, cooks)
│   └── supabase.js              # Supabase client + all DB functions + realtime
├── pages/
│   ├── Home.jsx                 # Landing page
│   ├── Menu.jsx                 # Menu browse + add to cart (auth-gated)
│   ├── Order.jsx                # Checkout flow + order tracking
│   ├── Profile.jsx              # Customer profile, order history, addresses, ratings
│   ├── CookDashboard.jsx        # Cook's order pool + accept/prepare/ready flow
│   ├── DeliveryDashboard.jsx    # Delivery partner's pickup + deliver flow
│   ├── AdminPanel.jsx           # Admin order + cook management

├── store/
│   ├── authStore.js             # Zustand auth store (user, role, signOut)
│   └── cartStore.js             # Zustand cart store (items, add, remove, clear)
└── utils/
    ├── constants.js             # ZONES list
    └── helpers.js               # formatPrice, etc.
```

---

##  Routes

| Path | Component | Protected |
|---|---|---|
| `/` | Home | No |
| `/menu` | Menu | No (cart requires login) |
| `/checkout` | Order (checkout) | No |
| `/order/:id` | Order (tracking) | No |
| `/login` | Auth | No |
| `/profile` | Profile | All roles |
| `/cook/dashboard` | CookDashboard | `cook` only |
| `/delivery/dashboard` | DeliveryDashboard | `delivery` only |
| `/admin` | AdminPanel | `admin` only |


---

##  Order Lifecycle

```
Customer places order
        ↓
orders: { status: 'pending', cook_id: null }
        ↓
All available cooks in zone see it in real time
        ↓
First cook to accept claims it
orders: { status: 'preparing', cook_id: cook.id }
        ↓
Cook marks ready
orders: { status: 'ready' }
        ↓
All available delivery partners in zone see it
        ↓
First partner to accept claims it
orders: { status: 'picked', delivery_partner_id: partner.id }
        ↓
Partner marks delivered
orders: { status: 'delivered' }
        ↓
Customer can rate cook + delivery partner
```

---

##  Database Tables

| Table | Purpose |
|---|---|
| `menu_items` | Food items with price, category, veg flag |
| `orders` | All orders with status, zone, items (jsonb), cook_id, delivery_partner_id |
| `cooks` | Cook profiles linked to auth.users, zone, rating, availability |
| `delivery_partners` | Delivery partner profiles, zone, availability |
| `profiles` | Customer profiles (name, phone, zone, role) |


---

##  Realtime

Supabase Realtime is used in three places:

| Where | What it listens to |
|---|---|
| `CookDashboard` | New/updated orders in cook's zone |
| `DeliveryDashboard` | New ready orders + claimed orders |
| `Order (tracking)` | Updates to the customer's specific order |

> **Required:** Run `ALTER TABLE orders REPLICA IDENTITY FULL;` in Supabase SQL editor for zone-based filters to work.

---

##  Key RLS Rules

- Customers can only insert/read their own orders
- Cooks can read unassigned (`cook_id IS NULL`) orders in their zone + their own
- Cooks can update orders only if `cook_id IS NULL` (claiming) or already theirs
- Delivery partners can read `status = 'ready'` unassigned orders + their own
- Admins can read everything

---

##  Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Supabase URL and anon key:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key

# Run dev server
npm run dev
```

---

## ⚠️ Known Limitations / Not Yet Built


- **No push notifications** — cooks and delivery partners must have the dashboard open to receive orders.
- **Payment is simulated** — UPI shows a mock QR and "I've Paid" button with no actual payment verification.
- **No admin order assignment** — admin cannot manually assign orders to cooks.

---

## 🌿 Brand Notes

- Every order is packed in **banana leaf** (zero plastic)
- Cooks keep **78%** of every order value
- Delivery charge is flat **₹20** per order
- Estimated delivery time is **~35 minutes**