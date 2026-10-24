# WorkPulse Master ⏱️

> Intelligent employee worktime, shifts, break allowance, and timing master tracker powered by embedded SQLite in WebAssembly and IndexedDB persistence.

---

## 🚀 Features

- **Embedded SQLite (WASM)**: High-performance relational database running entirely in the browser using `sql.js`.
- **IndexedDB Persistence**: Automatically backs up and loads the SQLite database binary across page reloads and browser sessions.
- **Smart Shift Master**: Configurable total shift hours, half-day benchmarks, allowed break durations, and default timings.
- **Real-Time Punch Timing**: Automatic calculation of required punch-out time, remaining work hours, overtime, and break overages.
- **Master Setup & Data Controls**: Full SQLite database import/export, CSV reports, and customizable break types.
- **Dark Modern UI**: Polished glassmorphism design optimized for desktop and mobile displays.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite 8](https://vite.dev/)
- **Database Engine**: [sql.js](https://sql.js.org/) (SQLite WebAssembly)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deployment Platform**: [Vercel](https://vercel.com/)

---

## 📦 Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Preview production build locally**:
   ```bash
   npm run preview
   ```

---

## 🌐 Deploy to Vercel

This repository is pre-configured with [`vercel.json`](./vercel.json) for 1-click deployment on Vercel.

### Option 1: Via Vercel Web Dashboard (Recommended)

1. Push your repository to **GitHub**, **GitLab**, or **Bitbucket**.
2. Go to [vercel.com/new](https://vercel.com/new) and log in.
3. Import your repository.
4. Vercel automatically detects the project settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Click **Deploy**. Your app will be live with an SSL-enabled `.vercel.app` domain.

### Option 2: Via Vercel CLI

1. Run the Vercel deployment command in your terminal:
   ```bash
   npx vercel
   ```
2. Follow the interactive prompts to link and deploy to your Vercel account.
3. For a production deployment:
   ```bash
   npx vercel --prod
   ```

---

## ⚙️ Vercel Configuration Highlights

- **SPA Rewrites**: All deep routes are safely redirected to `index.html` to prevent 404s on page refresh.
- **WebAssembly Headers**: Serves `.wasm` (`sql-wasm.wasm`) with `Content-Type: application/wasm` and long-term caching.
- **Security Headers**: Standard `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy`.
