# 🍿 CHAMA CINE HUB - Complete System Setup Guide (සිංහල මාර්ගෝපදේශය)

මෙම Guide එක මඟින් ඔයාට ලබාදී ඇති **Zip Files 2** (`whatsapp_bot_server.zip` සහ `movie_react_app.zip`) භාවිතා කර සම්පූර්ණ Movie Search & WhatsApp Direct Movie Sending System එකක් සකසා ගන්නා ආකාරය මුල සිට අගට පැහැදිලි කර ඇත.

---

## 📁 පද්ධතියේ ප්‍රධාන කොටස් 2 (Folders Overview)

1. **`whatsapp_bot_server`**: WhatsApp Baileys Bot Server එක සහ Movie API Proxy එක (Node.js + Express).
   - WhatsApp එකට ස්වයංක්‍රීයව Movies Document ලෙස Send කිරීම (2GB දක්වා).
   - Scraper API Key එක Browser එකෙන් Hide කර Proxy හරහා Data ලබා දීම.
   - Admin Web Dashboard (`/admin`) මඟින් Pairing Code එකෙන් WhatsApp Link කරගැනීම.
   - MongoDB මඟින් Session එක ආරක්ෂිතව තබා ගැනීම (Server Restart වුණත් Logout නොවේ).

2. **`movie_react_app`**: Users ලාට Movies Search කිරීමට සහ Request කිරීමට ඇති Frontend Web App එක (React + Vite).
   - ශ්‍රී ලංකාවේ ප්‍රමුඛ Movie Sites 22 කින් Movies සහ TV Series Search කිරීම.
   - 2026 New Releases ස්වයංක්‍රීයව Home Page එකේ පෙන්වීම.
   - Quality (1080p, 720p, 480p), Subtitles (සිංහල, English), TV Seasons & Episodes තෝරා ගැනීමේ හැකියාව.
   - Live Server Queue Tracker.

---

## 🛠️ අවශ්‍ය වන මූලික දේවල් (Prerequisites)

- [Node.js](https://nodejs.org/) (v18 හෝ ඊට වැඩි Version එකක් PC එකේ Install කර තිබිය යුතුය).
- WhatsApp ගිණුමක් සහිත Phone එකක් (Bot එක run කිරීමට).
- [GitHub](https://github.com/) ගිණුමක් (Cloudflare / Heroku / Render මඟින් Free Deploy කිරීමට අවශ්‍ය නම්).
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) Free Account එකක් (Session Persistence සඳහා - Default Connection String එකක් දැනටමත් අඩංගුයි).

---

---

# 🚀 පියවර 1: WhatsApp Bot Server එක Setup කරගැනීම (`whatsapp_bot_server`)

### ක්‍රමය A: ඔබේ පරිගණකයේ (Local PC) හෝ VPS එකක Run කිරීම

1. `whatsapp_bot_server.zip` එක Extract කරන්න.
2. Folder එක ඇතුලට ගොස් Terminal / CMD එකක් Open කරන්න.
3. Dependencies install කරගන්න:
   ```bash
   npm install
   ```
4. Server එක Start කරන්න:
   ```bash
   npm start
   ```
   *(නැතහොත් `node server.js`)*
5. දැන් ඔබේ Browser එකෙන් Admin Dashboard එකට යන්න:
   👉 **`http://localhost:5000/admin`**
6. ඔබේ WhatsApp Phone Number එක (උදා: `94771234567`) ඇතුළත් කර **"Generate Pairing Code"** ඔබන්න.
7. ලැබෙන 8-digit Code එක WhatsApp එකේ **Linked Devices > Link with phone number** මඟින් ඇතුළත් කර Bot එක Connect කරගන්න!

---

### ක්‍රමය B: Cloud Hosting (Heroku / Render / Railway) මඟින් 24/7 නොමිලේ Run කිරීම

1. Extract කළ `whatsapp_bot_server` folder එක ඔබේ **GitHub Account** එකට New Repository එකක් ලෙස Push කරන්න.
2. **Heroku / Render** වෙත ගොස් New Web Service සාදන්න.
3. පහත Environment Variables (Config Vars) ඇතුළත් කරන්න (හෝ default අගයන් භාවිතා කරන්න):
   - `PORT`: `5000` (හෝ cloud එකෙන් දෙන default port)
   - `API_KEY`: `chama_api_c82b12fffda71170b553f662d39426ec`
   - `MONGO_URI`: ඔබේ MongoDB Atlas connection string එක (Session එක save වීමට)
4. Deploy වූ පසු ඔබට ලැබෙන URL එක සටහන් කරගන්න (උදා: `https://your-bot-name.herokuapp.com`).
5. `https://your-bot-name.herokuapp.com/admin` වෙත ගොස් WhatsApp Pairing Code මඟින් Bot Connect කරගන්න.

---

---

# 🌐 පියවර 2: Movie Web App එක Setup කරගැනීම (`movie_react_app`)

### 1. Bot Server URL එක සම්බන්ධ කිරීම (Configuration)

1. `movie_react_app.zip` එක Extract කරන්න.
2. `movie_react_app/src/App.jsx` File එක Text Editor (VS Code / Notepad) එකකින් Open කරන්න.
3. මුලින් ඇති `BOT_SERVER_URL` එක ඔබේ Bot Server එකේ URL එකට මාරු කරන්න:
   ```javascript
   // src/App.jsx (Line 8 පමණ)
   const BOT_SERVER_URL = 'https://your-bot-name.herokuapp.com'; // Local නම් 'http://localhost:5000'
   ```
4. File එක Save කරන්න.

---

### 2. Local PC එකේ Run කර පරීක්ෂා කිරීම

1. `movie_react_app` folder එක තුළ Terminal එකක් Open කරන්න.
2. Dependencies install කරන්න:
   ```bash
   npm install
   ```
3. Development Server එක Run කරන්න:
   ```bash
   npm run dev
   ```
4. Terminal එකේ පෙන්වන Link එක (`http://localhost:5173`) Browser එකෙන් Open කරන්න.

---

### 3. Cloudflare Pages / Vercel හරහා නොමිලේ Web App එක Deploy කිරීම

1. `movie_react_app` folder එක ඔබේ GitHub Account එකට Push කරන්න.
2. [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git** තෝරන්න.
3. Build Settings සකසන්න:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. **Save and Deploy** ඔබන්න. මිනිත්තු 1-2 කින් ඔබට නොමිලේ `https://your-app.pages.dev` URL එකක් ලැබෙනු ඇත!

---

---

# 🔒 ආරක්ෂාව සහ Settings සකස් කිරීම (Security & Configurations)

### 1. Proxy Token Security
Bot Server එක සහ Web App එක අතර සන්නිවේදනයට Secret Token එකක් භාවිතා වේ.
- `whatsapp_bot_server/server.js` හි `PROXY_SECRET = 'chama_proxy_x9k2m8v3n1'`
- `movie_react_app/src/App.jsx` හි `PROXY_SECRET = 'chama_proxy_x9k2m8v3n1'`
- *(ඔබ මෙය වෙනස් කරන්නේ නම් දෙපැත්තෙන්ම එකම Secret එක ලබා දෙන්න).*

### 2. Allowed Domains (CORS)
ඔබ Web App එක අලුත් Domain එකක හෝ Pages URL එකක Deploy කළ පසු, Bot Server එකේ `ALLOWED_ORIGINS` ලිස්ට් එකට ඔබේ Domain එක එක් කරන්න:
```javascript
// whatsapp_bot_server/server.js (Line 615 පමණ)
const ALLOWED_ORIGINS = [
    'https://your-movie-app.pages.dev',
    'http://localhost:5173',
    'http://localhost:3000'
];
```

### 3. Branding සහ නම් වෙනස් කිරීම
- Web App Header නම වෙනස් කිරීමට `src/App.jsx` හි `CHAMA CINE HUB` යන්න ඔබේ නමට Search & Replace කර වෙනස් කරගත හැක.
- WhatsApp Bot Caption footer එක වෙනස් කිරීමට `whatsapp_bot_server/server.js` හි `CHAMA TECH` යන්න වෙනස් කරන්න.

---

---

# 🎬 පද්ධතිය ක්‍රියා කරන ආකාරය (How It Works)

```
[User on Web App] 
       │
       ▼
 1. Searches 22 Sites ──► [Bot Server /api/proxy] ──► [Chama Scraper API]
                                                           │
                                                           ▼
 2. Selects Quality & Subtitle ◄────────────────── Clean Movie Details
       │
       ▼
 3. Submits WhatsApp Number
       │
       ▼
 [Bot Server] ──► Checks Size (<= 2GB) ──► Sends WhatsApp Document & Subtitle
       │
       ▼
 4. Auto Queue Cleanup (Record deleted from Database)
```

1. **User Search**: පරිශීලකයා Web App එකෙන් Movie එකක් හෝ TV Series එකක් Search කරයි.
2. **Detail Selection**: Movie එක Click කළ පසු IMDB, Cast, Gallery, Story, Quality (1080p, 720p, 480p සහිත Size) සහ Subtitles දැකගත හැක.
3. **WhatsApp Submission**: අවශ්‍ය Quality එක තෝරා WhatsApp Phone Number එක ලබා දී Request එක Submit කරයි.
4. **Automated WhatsApp Delivery**: 
   - Bot Server එක මඟින් Video File එක direct WhatsApp document එකක් ලෙස user ගේ chat එකට එවයි.
   - Subtitle file එකද `.srt` file එකක් ලෙස වෙනම send කරයි.
   - File size එක 2GB ට වැඩි නම් file එක නොඑවා "File size is over 2GB" යනුවෙන් notification එකක් යවයි.
5. **Auto Queue Cleanup**: File එක WhatsApp එකට ගිය සැනින් Database Queue එකෙන් ඉබේම Delete වී පිරිසිදුව තබා ගනී.

---

## ❓ නිතර අසන ගැටළු (Troubleshooting)

| ගැටළුව (Issue) | විසඳුම (Solution) |
|---|---|
| **Bot එක Disconnect වෙනවා / Pairing Code Error** | Admin Panel එකෙන් session එක clear කර නැවත Phone Number එක දී Pairing Code එක ගන්න. MongoDB URI එක නිවැරදිව ලබා දී ඇත්දැයි බලන්න. |
| **Search එකේ Results එන්නේ නෑ** | `App.jsx` එකේ `BOT_SERVER_URL` එක නිවැරදිව ඔබේ Bot Server URL එකට ලබා දී ඇත්දැයි බලන්න. Bot Server එක active දැයි තහවුරු කරගන්න. |
| **Movie එක Request කළාට WhatsApp එකට එන්නේ නෑ** | Admin Panel එකෙන් Bot එක `connected` තත්ත්වයේ ඇත්දැයි බලන්න. Request කරද්දී ඇතුළත් කළ Phone Number එක නිවැරදි Country Code (උදා: 9477xxxxxxx හෝ 077xxxxxxx) සහිත දැයි බලන්න. |
| **Cloudflare Build Error** | Node version 18+ තෝරන්න. Build Command එක `npm run build` සහ Output Directory එක `dist` ලබා දෙන්න. |

---

❤️ **Created with passion by CHAMA OFC / CHAMA TECH**  
*Enjoy your free automated movie streaming & WhatsApp delivery platform!* 🍿🚀
