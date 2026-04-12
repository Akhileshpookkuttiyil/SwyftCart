# SwyftCart

SwyftCart is an open-source **Next.js 15 eCommerce application** that combines a buyer-facing storefront with the foundation of a seller dashboard. The current codebase already includes authentication, MongoDB-backed user records, Clerk user sync via Inngest, and a responsive shopping experience, while product, address, and order management are still being completed.

---

## Features

- Responsive storefront built with **Next.js App Router** and **Tailwind CSS**
- Buyer flows for home, product browsing, product detail, cart, shipping address entry, order confirmation, and order history screens
- Seller dashboard shell for adding products, viewing product listings, and reviewing orders
- **Clerk** authentication with buyer/seller-aware navigation and account actions
- Shared application state for products, cart totals, auth-derived user data, routing helpers, and currency settings
- **MongoDB + Mongoose** integration for user persistence
- **Inngest** functions to sync Clerk user create, update, and delete events into MongoDB
- Remote product image support for **Cloudinary** and GitHub-hosted assets
- MongoDB-backed product catalog with remaining checkout-related flows still in progress

## Tech Stack

### Frontend

- Next.js 15
- React 19
- Tailwind CSS
- Lucide React
- React Hot Toast

### Backend and Data

- Next.js Route Handlers
- MongoDB
- Mongoose
- Axios

### Authentication and Automation

- Clerk
- Inngest

### Tooling

- ESLint
- PostCSS

## Architecture Overview

SwyftCart follows a single-repo Next.js architecture with the App Router as the primary UI and API surface.

- `app/` contains the storefront pages, seller pages, and route handlers under `app/api`
- `context/AppContext.jsx` provides shared client-side state for auth-aware user data, cart operations, currency, product loading, and seller UI state
- `middleware.ts` applies Clerk middleware across app and API routes
- `config/db.js` manages a cached MongoDB connection for server-side handlers and background functions
- `config/inngest.js` defines event-driven background functions that keep the local `User` collection in sync with Clerk lifecycle events
- `models/User.js` and `models/Product.js` provide the current persisted domain models; address and order data are still mocked in the UI layer

### Current Request/Data Flow

1. The app boots through `app/layout.js` with `ClerkProvider`, `AppContextProvider`, and toast notifications.
2. Product data is requested from `/api/product/list` and served from MongoDB-backed route handlers.
3. Signed-in users fetch profile and cart data from `GET /api/user/data`.
4. Clerk user lifecycle events are handled through the Inngest route at `/api/inngest`, which creates, updates, or deletes local MongoDB user documents.

## Setup Instructions

### Prerequisites

- Node.js LTS
- npm
- A Clerk application
- A MongoDB database
- An Inngest project if you want Clerk-to-database sync enabled

### Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file. Use `.env.local` for development and keep secrets out of version control.

3. Add the required environment variables:

   ```env
   NEXT_PUBLIC_CURRENCY=₹
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
   CLERK_SECRET_KEY=
   MONGODB_URI=
   INNGEST_SIGNING_KEY=
   INNGEST_EVENT_KEY=
   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`.

### Notes

- User data endpoints require valid Clerk authentication and a working MongoDB connection.
- Cloudinary variables are only needed once product image uploads are connected to the backend.

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_CURRENCY` | No | Currency symbol shown across the storefront. Defaults to the rupee symbol when not set. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Public Clerk key for frontend authentication. |
| `CLERK_SECRET_KEY` | Yes | Server-side Clerk key for API and backend auth operations. |
| `MONGODB_URI` | Yes | MongoDB connection string used by route handlers and Inngest functions. |
| `INNGEST_SIGNING_KEY` | Yes for Inngest | Verifies signed requests sent to the Inngest route. |
| `INNGEST_EVENT_KEY` | Yes for Inngest | Allows event publishing to Inngest. |
| `CLOUDINARY_CLOUD_NAME` | Not yet required | Planned image hosting configuration for product uploads. |
| `CLOUDINARY_API_KEY` | Not yet required | Planned Cloudinary API key for seller product uploads. |
| `CLOUDINARY_API_SECRET` | Not yet required | Planned Cloudinary API secret for seller product uploads. |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server with Turbopack. |
| `npm run build` | Create a production build. |
| `npm run start` | Run the production build locally. |
| `npm run lint` | Run the project's lint command. |

## Folder Structure

```text
SwyftCart/
|-- app/                    # App Router pages, layouts, and API route handlers
|   |-- api/                # Route handlers for user data and Inngest
|   |-- seller/             # Seller dashboard pages
|   |-- product/[id]/       # Product details page
|   `-- ...                 # Storefront routes such as cart, orders, and catalog
|-- assets/                 # Static images, icons, and seeded demo data
|-- components/             # Reusable storefront and seller UI components
|-- config/                 # Database and Inngest configuration
|-- context/                # Shared application state
|-- lib/                    # Auth helper utilities
|-- models/                 # Mongoose models
|-- public/                 # Static public assets
`-- README.md
```

## API Overview

The backend surface is currently small but functional for auth-linked user data and background sync.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/user/data` | Returns the authenticated user's profile and cart data from MongoDB. |
| `GET`, `POST`, `PUT` | `/api/inngest` | Serves Inngest functions that process Clerk user lifecycle events. |

### Implemented Background Functions

- `clerk/user.created` -> create a local `User` document
- `clerk/user.updated` -> update or upsert the local `User` document
- `clerk/user.deleted` -> remove the local `User` document

## Deployment Notes

- The project is a good fit for **Vercel** because it is built on the Next.js App Router with Route Handlers.
- Add the same environment variables used locally to your deployment platform before the first build.
- Configure Clerk for your production domain and ensure sign-in and sign-up redirect URLs match the deployed hostname.
- Make sure your MongoDB deployment allows network access from the hosting environment.
- If you enable Inngest in production, expose `/api/inngest` and configure your Inngest and Clerk event pipeline accordingly.
- Add Cloudinary credentials before wiring seller product uploads to production storage.

## Known Limitations

- Order history, seller orders, and address selection still rely on dummy data instead of persisted records.
- The add-product form, add-address form, promo code flow, and place-order action are UI scaffolds without connected backend mutations.
- `Product` now exists, but `Order` and `Address` models plus their APIs are still missing.
- Cart changes live in client state and are not written back to MongoDB, so cart persistence across devices is not available.
- Seller route protection is not enforced server-side yet; `lib/authSeller.js` exists, but seller pages are not gated by middleware or route handlers.
- Navigation links for `/about` and `/contact` are present in the navbar, but those routes are not part of the current app tree.
- The repository does not include automated tests yet.

## :rocket: Next Steps

### Missing Features

- Implement `Product`, `Order`, and `Address` Mongoose models plus the corresponding `app/api` endpoints.
- Connect the seller add-product workflow, checkout flow, address book, and order history screens to real backend operations.
- Add search, filtering, sorting, and either ship the `/about` and `/contact` pages or remove the dead navigation links.

### Performance Improvements

- Move catalog fetching toward server-side or cached data loading instead of relying on a client-only context for all product reads.
- Add pagination or incremental loading for large product catalogs.
- Introduce image optimization and Cloudinary transformations once real product uploads are enabled.

### Security Improvements

- Remove committed secrets from the repository history and rotate exposed Clerk, MongoDB, and Inngest credentials.
- Enforce seller authorization on seller routes and mutating APIs with server-side checks.
- Add request validation, rate limiting, and stronger error handling for API endpoints as they are introduced.

### Code Quality Improvements

- Add unit, integration, and end-to-end tests for auth, cart, checkout, and seller workflows.
- Replace placeholder content in shared UI sections such as the footer and newsletter with production-ready copy and actions.
- Separate demo data from production data services more explicitly to reduce confusion between mocked and real flows.

### Scalability Considerations

- Persist carts, addresses, and orders in MongoDB so sessions survive reloads and multi-device usage.
- Add indexes for catalog queries such as category, seller, and search fields before scaling the product inventory.
- Introduce monitoring around API failures, Clerk sync jobs, and future checkout and order lifecycle events.
