# 🗄️ Database & Free Cloud Hosting Complete Guide (ස්වයංක්‍රීය Database & Hosting මාර්ගෝපදේශය)

මෙම Guide එක මඟින් ඔයාට හෝ ඔයාගේ යහළුවන්ට **තමන්ගේම Free Database (Firebase & MongoDB)** සාදා ගන්නා ආකාරය සහ විවිධ **Free Cloud Hosting Services (Cloudflare, Render, Heroku, Vercel, Railway)** වල Web App එක සහ Bot Server එක Host කරගන්නා ආකාරය පියවරෙන් පියවර Screenshots සහිතව මෙන් පැහැදිලි කර ඇත.

---

# 📑 පටුන (Table of Contents)
1. [පියවර 1: නොමිලේ Firebase Database එකක් සාදා ගැනීම (Realtime Database & Firestore)](#-පියවර-1-නොමිලේ-firebase-database-එකක්-සාදා-ගැනීම)
2. [පියවර 2: නොමිලේ MongoDB Atlas Database එකක් සාදා ගැනීම (Session Persistence)](#-පියවර-2-නොමිලේ-mongodb-atlas-database-එකක්-සාදා-ගැනීම)
3. [පියවර 3: WhatsApp Bot Server එක Host කිරීම (Render, Heroku, Railway, VPS, Local)](#-පියවර-3-whatsapp-bot-server-එක-host-කිරීම)
4. [පියවර 4: Movie Web App එක Host කිරීම (Cloudflare Pages, Vercel, Netlify)](#-පියවර-4-movie-web-app-එක-host-කිරීම)
5. [පියවර 5: සියල්ල එකිනෙකට සම්බන්ධ කිරීම (Configuration Linking)](#-පියවර-5-සියල්ල-එකිනෙකට-සම්බන්ධ-කිරීම)

---

---

# 🔥 පියවර 1: නොමිලේ Firebase Database එකක් සාදා ගැනීම

Web App එකෙන් Movie Requests Live Tracking කිරීමට සහ Bot එකට Data ලබා ගැනීමට Firebase භාවිතා වේ.

### 1.1 Firebase Project එකක් සෑදීම
1. [Firebase Console](https://console.firebase.google.com/) වෙත ගොස් ඔබේ Google Account එකෙන් Login වන්න.
2. **"Add project"** (හෝ "Create a project") ඔබන්න.
3. Project එකට නමක් දෙන්න (උදා: `my-movie-bot`).
4. Google Analytics අවශ්‍ය නම් Enable කර (නැතහොත් Disable කර) **Create project** ඔබන්න.

---

### 1.2 Realtime Database Enable කිරීම
1. වම් පස Menu එකෙන් **Build > Realtime Database** තෝරන්න.
2. **"Create Database"** ඔබන්න.
3. Location එක ලෙස **United States (us-central1)** හෝ ආසන්න location එකක් තෝරා Next ඔබන්න.
4. Security Rules සඳහා **"Start in test mode"** තෝරා **Enable** ඔබන්න.
5. උඩින් පෙනෙන Database URL එක Copy කරගන්න (උදා: `https://my-movie-bot-default-rtdb.firebaseio.com/`).

> 💡 **Rules සැකසීම (Realtime Database > Rules tab):**
> පහත Rules දමා **Publish** කරන්න (Read/Write allow කිරීමට):
> ```json
> {
>   "rules": {
>     ".read": true,
>     ".write": true
>   }
> }
> ```

---

### 1.3 Firestore Database Enable කිරීම (Optional / Recommended)
1. වම් පස Menu එකෙන් **Build > Firestore Database** තෝරන්න.
2. **"Create database"** ඔබන්න.
3. Database ID එක default තබා Next කර, **"Start in test mode"** තෝරා **Create** ඔබන්න.

---

### 1.4 Web App Config Keys ලබා ගැනීම
1. Firebase Console එකේ උඩින් ඇති ⚙️ **Project Settings** (Gear icon) ඔබන්න.
2. **General** tab එකේ පහළට scroll කර **"Your apps"** යටතේ ඇති **Web Icon `</>`** එක ඔබන්න.
3. App Nickname එකක් දෙන්න (උදා: `Movie Web`) සහ **Register app** ඔබන්න.
4. එහි පෙන්වන `firebaseConfig` object එක copy කරගන්න:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "my-movie-bot.firebaseapp.com",
     databaseURL: "https://my-movie-bot-default-rtdb.firebaseio.com",
     projectId: "my-movie-bot",
     storageBucket: "my-movie-bot.firebasestorage.app",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef..."
   };
   ```
5. මෙම විස්තර `movie_react_app/src/firebaseConfig.js` file එකට දමන්න!

---

---

# 🍃 පියවර 2: නොමිලේ MongoDB Atlas Database එකක් සාදා ගැනීම

WhatsApp Bot එක Restart වුවද Logout නොවී Session එක ආරක්ෂිතව තබා ගැනීමට MongoDB භාවිතා වේ.

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) වෙත ගොස් නොමිලේ Account එකක් සාදා Login වන්න.
2. **Create a Deployment** තෝරා නොමිලේ ලැබෙන **M0 (Free)** Cluster එක තෝරන්න.
3. **Provider**: AWS / Google Cloud, **Region**: Singapore (ap-southeast-1) හෝ ආසන්න එකක් තෝරා **Create** ඔබන්න.
4. **Security Quickstart**:
   - **Username** එකක් සහ **Password** එකක් ලබා දෙන්න (උදා: `botuser` සහ `mypassword123`). *(Password එක සටහන් කරගන්න!)*
   - **"Create Database User"** ඔබන්න.
5. **Network Access (IP Whitelist)**:
   - IP Address එකට `0.0.0.0/0` (Allow Access from Anywhere) ලබා දී **"Add Entry"** ඔබන්න.
6. **Connection String ලබා ගැනීම**:
   - **Database > Clusters** වෙත ගොස් **"Connect"** ඔබන්න.
   - **"Drivers"** (Node.js) තෝරන්න.
   - ලැබෙන Connection URI එක Copy කරගන්න:
     ```
     mongodb+srv://botuser:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
     ```
   - `<password>` ඇති තැනට ඔබ කලින් ලබා දුන් password එක ඇතුළත් කරන්න.
7. මෙය `whatsapp_bot_server/server.js` හි `MONGO_URI` හෝ Environment Variable එකක් ලෙස දමන්න!

---

---

# 🤖 පියවර 3: WhatsApp Bot Server එක Host කිරීම

Bot Server එක 24/7 ක්‍රියාත්මක වීමට නොමිලේ Host කරගත හැකි ක්‍රම:

### ක්‍රමය 3.1: Render.com (100% Free & Highly Recommended)
1. [Render.com](https://render.com/) ගිණුමක් සාදා GitHub සම්බන්ධ කරන්න.
2. `whatsapp_bot_server` code එක GitHub repository එකකට Push කරන්න.
3. Render Dashboard > **New +** > **Web Service** තෝරන්න.
4. ඔබේ GitHub repository එක තෝරා Connect කරන්න.
5. පහත විස්තර සකසන්න:
   - **Name**: `my-whatsapp-bot-server`
   - **Language**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
6. **Environment Variables** (Advanced > Add Environment Variable):
   - `MONGO_URI` = *(ඔබේ MongoDB Connection String එක)*
   - `FIREBASE_DATABASE_URL` = *(ඔබේ Firebase Realtime Database URL එක)*
   - `API_KEY` = `chama_api_c82b12fffda71170b553f662d39426ec`
7. **Deploy Web Service** ඔබන්න. මිනිත්තු කිහිපයකින් ඔබට URL එකක් ලැබෙනු ඇත (උදා: `https://my-whatsapp-bot-server.onrender.com`).
8. `https://my-whatsapp-bot-server.onrender.com/admin` වෙත ගොස් Pairing code එකෙන් WhatsApp Connect කරගන්න!

---

### ක්‍රමය 3.2: Railway.app (Free / Trial)
1. [Railway.app](https://railway.app/) වෙත ගොස් GitHub මඟින් Login වන්න.
2. **New Project** > **Deploy from GitHub repo** තෝරන්න.
3. `whatsapp_bot_server` repo එක තෝරන්න.
4. **Variables** tab එකට ගොස් `MONGO_URI` සහ `FIREBASE_DATABASE_URL` ඇතුළත් කරන්න.
5. **Settings** > **Networking** > **Generate Domain** ඔබන්න.
6. ලැබෙන Domain එකෙන් `/admin` ගොස් WhatsApp Login වන්න.

---

### ක්‍රමය 3.3: Heroku
1. [Heroku](https://heroku.com) වෙත ගොස් New App එකක් සාදන්න.
2. GitHub Repo එක Connect කර **Deploy Branch** ඔබන්න.
3. **Settings > Config Vars** හි `MONGO_URI` සහ `FIREBASE_DATABASE_URL` එක් කරන්න.
4. App URL එකෙන් `/admin` ගොස් WhatsApp Login වන්න.

---

### ක්‍රමය 3.4: Local PC / VPS (Windows, Linux, Ubuntu, Mac)
1. `whatsapp_bot_server` folder එක තුළ Terminal එකක් Open කරන්න.
2. `npm install` run කරන්න.
3. 24/7 background run කිරීමට PM2 install කර start කරන්න:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "movie-bot"
   pm2 startup
   pm2 save
   ```
4. `http://localhost:5000/admin` ගොස් Pairing Code එකෙන් WhatsApp Connect කරගන්න.

---

---

# 🎬 පියවර 4: Movie Web App එක Host කිරීම

Frontend Web App එක Host කිරීමට පහත සේවාවන් සම්පූර්ණයෙන්ම නොමිලේ (100% Free) භාවිතා කළ හැක:

### ක්‍රමය 4.1: Cloudflare Pages (Fastest & Best)
1. [Cloudflare Dashboard](https://dash.cloudflare.com/) වෙත ගොස් Login වන්න.
2. **Workers & Pages** > **Create application** > **Pages** > **Connect to Git** ඔබන්න.
3. `movie_react_app` repository එක තෝරා **Begin setup** ඔබන්න.
4. Build Settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. **Save and Deploy** ඔබන්න.
6. ඔබට `https://your-movie-app.pages.dev` යනුවෙන් Global Fast Free URL එකක් ලැබේ!

---

### ක්‍රමය 4.2: Vercel
1. [Vercel.com](https://vercel.com/) වෙත ගොස් GitHub මඟින් Login වන්න.
2. **Add New...** > **Project** තෝරන්න.
3. `movie_react_app` repo එක **Import** කරන්න.
4. Framework Preset එක **Vite** ලෙස auto detect වේ.
5. **Deploy** ඔබන්න. (URL: `https://your-movie-app.vercel.app`).

---

### ක්‍රමය 4.3: Netlify
1. [Netlify.com](https://netlify.com/) වෙත ගොස් **Add new site** > **Import an existing project** තෝරන්න.
2. Build command: `npm run build`, Publish directory: `dist`.
3. **Deploy Site** ඔබන්න.

---

---

# 🔗 පියවර 5: සියල්ල එකිනෙකට සම්බන්ධ කිරීම (Linking)

ඔබ සියලු Databases සහ Hosting සකසා ගත් පසු, පහත තැන් 3 පමණක් Update කරන්න:

### 1️⃣ Frontend එකට Bot Server URL එක ලබා දීම:
`movie_react_app/src/App.jsx` හි:
```javascript
// Line 8 පමණ:
const BOT_SERVER_URL = 'https://my-whatsapp-bot-server.onrender.com'; // ඔබේ Bot Server URL එක
```

### 2️⃣ Frontend එකට ඔබේ Firebase Configs ලබා දීම:
`movie_react_app/src/firebaseConfig.js` හි:
```javascript
const firebaseConfig = {
  apiKey: "ඔබේ_Firebase_API_Key",
  authDomain: "ඔබේ_Project_ID.firebaseapp.com",
  databaseURL: "https://ඔබේ_Project_ID-default-rtdb.firebaseio.com",
  projectId: "ඔබේ_Project_ID",
  storageBucket: "ඔබේ_Project_ID.firebasestorage.app",
  messagingSenderId: "...",
  appId: "..."
};
```

### 3️⃣ Bot Server එකේ Allowed Origins වලට ඔබේ Web App URL එක එක් කිරීම:
`whatsapp_bot_server/server.js` හි:
```javascript
// Line 615 පමණ:
const ALLOWED_ORIGINS = [
    'https://your-movie-app.pages.dev',    // ඔබේ Cloudflare Pages URL එක
    'https://your-movie-app.vercel.app',  // ඔබේ Vercel URL එක (භාවිතා කරන්නේ නම්)
    'http://localhost:5173',
    'http://localhost:3000'
];
```

---

## 🎯 සුබ පැතුම්! (All Done)
දැන් ඔබට සහ ඔබේ යහළුවන්ට තමන්ගේම පෞද්ගලික Databases සහ Hosting සහිතව සම්පූර්ණ ස්වයංක්‍රීය Movie Bot & Web App System එකක් සාර්ථකව ක්‍රියාත්මක වේ! 🍿🚀
