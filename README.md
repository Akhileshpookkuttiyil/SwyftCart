# SwyftCart

SwyftCart is a production-ready **Next.js 15 eCommerce ecosystem** designed for high-performance, scalability, and seamless user experiences. It bridges the gap between a sleek, buyer-facing storefront and a powerful, data-driven seller dashboard. Built with the latest MERN stack evolution (Next.js, MongoDB, Inngest, Clerk), SwyftCart handles everything from user synchronization and role-based access control to inventory management and secure order processing.

---

## 🚀 Key Features

### 🛒 Buyer Experience
- **Dynamic Storefront**: A responsive, mobile-first shopping experience built with React 19 and Tailwind CSS 4.
- **Smart Search & Filtering**: Real-time product discovery across categories with integrated search functionality.
- **Persistent Cart**: Integrated cart system that persists across sessions via MongoDB, ensuring users never lose their selections.
- **Detailed Product Pages**: High-fidelity product views featuring Cloudinary-optimized image galleries and technical specifications.
- **Seamless Checkout**: Multi-step checkout flow including address management and order confirmation.
- **Personalized Accounts**: Order history tracking and a dedicated "Favourites" wishlist system.

### 📊 Seller Dashboard
- **Business Intelligence**: Real-time analytics showing total revenue, active product counts, and pending order metrics.
- **Inventory Lifecycle**: Full CRUD operations for products, including multi-image uploads and price management (original vs. offer prices).
- **Order Management**: Dedicated interface to track customer orders, update fulfillment statuses, and manage deliveries.
- **Role-Based Security**: Seller routes are strictly gated, ensuring only authorized merchants can access business tools.

### ⚙️ System & Infrastructure
- **Clerk Auth & Sync**: Secure authentication with automated user synchronization between Clerk and MongoDB via **Inngest** webhooks.
- **Event-Driven Architecture**: Background jobs handle critical lifecycle events (user creation/deletion) without blocking the UI.
- **Standardized API**: Robust backend architecture using a Controller-Service pattern with consistent error handling and response structures.
- **Database Optimization**: Mongoose-backed persistence with optimized connection pooling for serverless environments.

---

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| **Framework** | Next.js 15 (App Router), React 19 |
| **Styling** | Tailwind CSS 4.0, Lucide React |
| **Backend** | Next.js Route Handlers (Edge-ready) |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Auth** | Clerk (Middleware-secured) |
| **Workflows** | Inngest (Serverless Queues & Webhooks) |
| **Storage** | Cloudinary (Product Media) |
| **Communication** | Axios, React Hot Toast |

---

## 🏗️ System Architecture

SwyftCart follows a modern, decoupled architecture designed for speed and reliability:

- **Frontend**: Utilizes Next.js Server Components for SEO and Client Components for interactive states (Cart, Dashboard).
- **State Management**: `AppContext` provides a global reactive layer for cart tokens, user roles, and UI configurations.
- **Background Layer**: `config/inngest.js` orchestrates long-running tasks. When a user signs up via Clerk, Inngest catches the event and reliably syncs the data to MongoDB.
- **Service Layer**: Business logic is abstracted into `services/` (e.g., `order.service.js`), keeping API routes clean and testable.
- **Security Middleware**: `middleware.js` enforces global protection, while `lib/authSeller.js` provides granular role validation.

---

## 📂 Folder Structure

```text
SwyftCart/
├── app/                    # Next.js 15 App Router (Pages, Layouts, APIs)
│   ├── api/                # RESTful endpoints (Cart, Order, Seller, Admin)
│   ├── seller/             # Merchant-facing dashboard & management
│   ├── my-orders/          # Buyer order history
│   └── product/[id]/       # dynamic product detail views
├── components/             # Atomic UI components & layout patterns
├── config/                 # Connectivity (MongoDB, Inngest Client)
├── context/                # Client-side state (AppContext)
├── controllers/            # API request/response orchestration
├── hooks/                  # Custom React hooks (UI & Logic)
├── lib/                    # Shared utilities & Auth helpers
├── models/                 # Mongoose schemas (User, Product, Order)
├── services/               # Core business & database logic
└── assets/                 # Brand assets & static demo data
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+ (LTS recommended)
- [Clerk Account](https://clerk.com) for Auth
- [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- [Inngest Account](https://www.inngest.com) for background events
- [Cloudinary](https://cloudinary.com) for image hosting

### 1. Clone & Install
```bash
git clone https://github.com/Akhileshpookkuttiyil/SwyftCart.git
cd SwyftCart
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root and add the following:

```env
# Clerk Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/swyftcart

# Inngest Keys
INNGEST_SIGNING_KEY=sign_...
INNGEST_EVENT_KEY=key_...

# Cloudinary (Required for Seller Uploads)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# App Configuration
NEXT_PUBLIC_CURRENCY=₹
```

### 3. Running Locally
```bash
# Start Next.js (with Turbopack)
npm run dev

# Start Inngest Dev Server (In a new terminal)
npx inngest-cli@latest dev
```
Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 📡 API Overview

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/user/data` | Fetch authenticated user profile & cart |
| `POST` | `/api/cart` | Update user's persistent cart items |
| `GET` | `/api/product/list` | Retrieve all active products |
| `POST` | `/api/order/place` | Submit new order from cart |
| `GET` | `/api/order/list` | Fetch buyer's order history |
| `GET` | `/api/seller/dashboard`| Fetch merchant analytics |
| `POST` | `/api/inngest` | Webhook endpoint for Clerk sync |

---

## 🚢 Deployment

1. **Vercel**: Connect your GitHub repository to Vercel. It will automatically detect Next.js settings.
2. **Environment Variables**: Add all keys from your `.env.local` to Vercel Project Settings.
3. **Database**: Whitelist Vercel's IP range or allow "Access from Anywhere" (0.0.0.0/0) in MongoDB Atlas.
4. **Inngest**: Configure your production URL in the Inngest dashboard to point to `your-domain.com/api/inngest`.
5. **Clerk**: Add your production domain to the Clerk dashboard and update the Redirect URLs.

---

## 🤝 Project Status

SwyftCart is a live project. While core commerce flows (Order -> Payment -> Fulfillment) are functional, we are consistently adding:
- **Real Payment Integration**: Stripe/Razorpay scaffolding.
- **Admin Panel**: Global system monitoring.
- **Notifications**: Email & SMS alerts for order updates.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
.
