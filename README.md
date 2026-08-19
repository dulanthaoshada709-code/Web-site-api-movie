# 🎬 Chama Movie Portal - Frontend Web App

A modern, responsive Movie & TV Series discovery web app built with **React + Vite**.

---

## ⚡ Quick Start (Local PC)

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Bot Server URL**:
   Open `src/App.jsx` and make sure `BOT_SERVER_URL` points to your active bot server:
   ```javascript
   const BOT_SERVER_URL = 'http://localhost:5000'; // Or your Heroku/Render URL
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## ☁️ Free Cloud Deployment (Cloudflare Pages / Vercel)

### Deploying to Cloudflare Pages (Recommended):
1. Push this folder to GitHub.
2. Go to **Cloudflare Dashboard > Workers & Pages > Create application > Pages > Connect to Git**.
3. Set build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Click **Save and Deploy**.

---

## 🌟 Key Features
- **22 Movie Sites Search**: Search SinhalaSub, MovieBox, CineSubz, Baiscope, LKSub, and more simultaneously.
- **New Arrivals 2026**: Staggered animated cards on initial page load.
- **Detailed Movie View**: Posters, IMDb ratings, director, cast avatars, gallery lightbox, YouTube trailer.
- **TV Series Hub**: Seasons and episode selection with automated download resolution.
- **Quality & Subtitle Selection**: 1080p FHD, 720p HD, 480p SD with file sizes and Sinhala/English subtitle support.
- **Direct WhatsApp Request**: Instant submission to WhatsApp Bot delivery queue.
