# ppob-onlimo

> **A modern, secure, and premium‑look web application for digital payments (PPOB)**. Built with **Next.js**, **TypeScript**, **PostgreSQL** (via **Knex**) and a rich UI powered by **Tailwind CSS** and **Lucide‑react** icons.

---

## 📖 Overview

`ppob-onlimo` is a dashboard‑style application that allows users to:
- View transaction histories for **PLN prepaid electricity** and **Telkomsel Orbit data packages**.
- Generate and download **dynamic receipts** with a premium “thermal‑printer” style UI. The receipt filename follows the pattern `struk‑<station>-<month>-<refId>.png`.
- Filter transactions by month and search by station name or customer identifier.
- Manage dummy data for testing (January dummy transactions generated from May data).

The project also includes a set of **API routes** for assets, finance, and transaction handling, as well as **background jobs** via PM2.

---

## ✨ Features

- **Dual‑tab dashboard** – switch between PLN and Orbit transaction tables.
- **Dynamic receipt generation** – includes token, customer info, admin fee, and total payment.
- **Hard‑coded admin fees** (`Rp 3.500` for PLN, `Rp 1.000` for Orbit) and customizable `total bayar`.
- **Download receipts** with a clear filename convention.
- **Server‑side data fetching** using Next.js `force-dynamic` pages.
- **Search & month filter** with instant UI updates.
- **Secure configuration** – `.env` is ignored by Git.
- **Database migrations** using Knex.
- **PM2 process management** for production.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Front‑end | Next.js 16 (App Router) • TypeScript • Tailwind CSS • Lucide‑react |
| Back‑end | Node.js • Express‑style API routes (Next.js API) |
| Database | PostgreSQL (via Knex) |
| Dev tools | ESLint, Prettier, npm scripts, PM2 |

---

## 📦 Prerequisites

- **Node.js** ≥ 18
- **npm** (or Yarn / pnpm) — the project uses npm scripts.
- **PostgreSQL** instance (default connection values can be overridden in `.env`).
- **Git** for version control.

---

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/febryprasetyo/ppob-onlimo.git
   cd ppob-onlimo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a `.env` file** (copy from `.env.example` if present) and fill in the required variables, e.g.:
   ```dotenv
   PORT=[PORT]
   DB_HOST=[DB_HOST]
   DB_PORT=[DB_PORT]
   DB_USER=[DB_USER]
   DB_PASSWORD=[PASSWORD]
   DB_NAME=[DB_NAME]
   DIGIFLAZZ_USERNAME=[DIGI_USER]
   DIGIFLAZZ_API_KEY_PROD=[DIGI_API]
   # …other variables as needed
   ```
   > **Note:** `.env` is listed in `.gitignore` and will never be committed.

4. **Run database migrations**
   ```bash
   npx knex migrate:latest
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`.

---

## 📜 Scripts

| Script | Description |
|--------|-------------|
| `dev` | Runs the Next.js development server. |
| `build` | Generates an optimized production build. |
| `start` | Starts the app using PM2 (requires a built version). |
| `lint` | Runs ESLint with the project's rules. |

---


## 📦 Deployment

1. Build the app:
   ```bash
   npm run build
   ```
2. Start with PM2 (the `deploy-pm2.sh` script handles this automatically):
   ```bash
   ./deploy-pm2.sh
   ```
   PM2 will keep the app running and restart on changes.

---


*Happy coding!*
