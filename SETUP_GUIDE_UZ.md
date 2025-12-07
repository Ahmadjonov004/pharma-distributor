# 📱 Pharma Distributor - Frontend + Backend Integration Guide

## 🔧 O'RNATISH VA SOZLASH (UZBEK)

### 1️⃣ BACKEND O'RNATISH

**Bosqich 1: MongoDB'ni o'rnatish**
- MongoDB Cloud (Atlas) dan foydalaning: https://www.mongodb.com/cloud/atlas
- Bepul cluster yarating
- Connection string olgan

**Bosqich 2: Dependencies o'rnatish**
```bash
cd server
npm install
```

**Bosqich 3: .env faylini to'ldirish**
```bash
cp .env.example .env
```
`.env` faylini to'g'ri ma'lumotlar bilan to'ldiring:
```
MONGO_URI=mongodb+srv://username:password@cluster0.mongodb.net/pharma-distributor
JWT_SECRET=your_secret_key_here
REFRESH_SECRET=your_refresh_secret_here
PORT=4000
```

**Bosqich 4: Backendni ishga tushirish**
```bash
npm start        # Production
npm run dev      # Development (nodemon bilan)
```

Server `http://localhost:4000` da ishlaydi.

---

### 2️⃣ FRONTEND O'RNATISH

**Bosqich 1: Dependencies o'rnatish**
```bash
cd client
npm install
npm install axios
```

**Bosqich 2: .env faylini to'ldirish**
```bash
cp .env.example .env
```
`.env` faylini to'g'ri ma'lumotlar bilan to'ldiring:
```
VITE_API_BASE_URL=http://localhost:4000
```

**Bosqich 3: Frontend'ni ishga tushirish**
```bash
npm run dev
```

Frontend `http://localhost:5173` da ishlaydi.

---

## 🎯 ARXITEKTURA VA ISH JARAYONI

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Auth Page → Kirish/Ro'yxat                                │  │
│  │ ↓                                                           │  │
│  │ AuthContext (JWT token saqlash)                           │  │
│  │ ↓                                                           │  │
│  │ DataContext (Products & Orders boshqarish)               │  │
│  │ ↓                                                           │  │
│  │ API Service (axios bilan backend'ga qo'ng'iroq qilish)   │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────────────┘
                       │
              HTTP/HTTPS so'rovlar
                       │
┌──────────────────────▼───────────────────────────────────────────┐
│                       BACKEND (Node.js)                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Express Router                                             │  │
│  │ ├─ POST /auth/register → authController.register()        │  │
│  │ ├─ POST /auth/login → authController.login()             │  │
│  │ ├─ POST /auth/refresh → authController.refresh()         │  │
│  │ ├─ GET /products → productController.getProducts()       │  │
│  │ ├─ POST /products → productController.createProduct()    │  │
│  │ ├─ PUT /products/:id → productController.updateProduct() │  │
│  │ ├─ DELETE /products/:id → productController.delete()     │  │
│  │ ├─ GET /orders → orderController.getOrders()             │  │
│  │ └─ POST /orders → orderController.createOrder()          │  │
│  │                                                            │  │
│  │ Middleware: authMiddleware (JWT tekshirish)              │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                 MongoDB API
                       │
┌──────────────────────▼───────────────────────────────────────────┐
│                    MONGODB (Cloud Atlas)                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Collections:                                              │  │
│  │ - users (username, password hash, refreshToken)         │  │
│  │ - products (name, price, quantity, owner)               │  │
│  │ - orders (products, total, user, createdAt)             │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🔐 AUTHENTICATION FLOW (JWT)

```
1. LOGIN
   ├─ Frontend: POST /auth/login {username, password}
   ├─ Backend: 
   │   ├─ User'ni topish
   │   ├─ Parolni bcrypt bilan tekshirish
   │   ├─ JWT token yaratish (15 minutes validity)
   │   ├─ Refresh token yaratish (7 days validity)
   │   └─ Qaytarish: {token, refreshToken}
   └─ Frontend:
       ├─ localStorage'ga token saqlash
       ├─ localStorage'ga refreshToken saqlash
       ├─ localStorage'dagi data'ni serverga yuborish
       └─ Dashboard'ga o'tish

2. API CALL WITH TOKEN
   ├─ Frontend: Header'da Authorization: Bearer <token> qo'shish
   ├─ Backend:
   │   ├─ authMiddleware token tekshirish
   │   ├─ Token xato bo'lsa: 403 Forbidden
   │   └─ Token to'g'ri bo'lsa: req.user ga ma'lumot qo'shish
   └─ Controller execute qilish

3. TOKEN REFRESH (Token muddati tugasa)
   ├─ Frontend: axios interceptor 403 status tekshirish
   ├─ Backend: POST /auth/refresh {refreshToken}
   ├─ Yangi token yaratish va qaytarish
   └─ Orifinal request qayta yuborish
```

---

## 💾 SYNC LOGIC (localStorage ↔ MongoDB)

### Scenario 1: User NOT Logged In (Offline Mode)
```
├─ Barcha CRUD operatsiyalar localStorage'ga saqlanadi
├─ Data structure: {_id, name, price, quantity, owner (local)}
├─ Offline'da ishlaydi, network kerak emas
└─ Login qilganda: Bu data server'ga yuboriladi
```

### Scenario 2: User Logged In (Online Mode)
```
├─ Login qilish:
│  ├─ localStorage'dagi products va orders'ni olish
│  ├─ Har birini server'ga POST /products va POST /orders bilan yuborish
│  ├─ Server qaytargan MongoDB _id'larni saqlash
│  ├─ localStorage'ni tozalash
│  └─ Backend'dan fresh data yuklash (GET requests)
│
├─ CRUD operatsiyalari:
│  ├─ CREATE: POST /products → Server MongoDB'ga saqlash
│  ├─ READ: GET /products → MongoDB'dan olish
│  ├─ UPDATE: PUT /products/:id → Server'da yangilash
│  └─ DELETE: DELETE /products/:id → Server'da o'chirish
│
└─ Har safar server'dan fresh data yuklash (DataContext.syncData())
```

---

## 📁 FOLDER STRUCTURE

```
pharma-distributor/
│
├── server/
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   └── Order.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   └── orderController.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   └── orders.js
│   │
│   ├── index.js (Express server)
│   ├── package.json
│   ├── .env
│   └── .env.example
│
└── client/
    ├── src/
    │   ├── services/
    │   │   └── api.ts (axios instance va API functions)
    │   │
    │   ├── context/
    │   │   ├── AuthContext.tsx (Login/Register/Logout logic)
    │   │   └── DataContext.tsx (Products/Orders sync logic)
    │   │
    │   ├── pages/
    │   │   ├── Auth.tsx (Login/Register form)
    │   │   ├── Dashboard.tsx
    │   │   ├── Products.tsx
    │   │   └── Orders.tsx
    │   │
    │   ├── App.tsx
    │   └── main.tsx
    │
    ├── .env
    └── .env.example
```

---

## 🧪 TEST QILISH

### 1. Register qilish
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456"}'
```

### 2. Login qilish
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456"}'
```
Token olgan: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. Product yaratish
```bash
curl -X POST http://localhost:4000/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d '{"name":"Aspirin","price":5000,"quantity":100,"description":"Pain reliever"}'
```

### 4. Barcha products'ni olish
```bash
curl http://localhost:4000/products \
  -H "Authorization: Bearer TOKEN_HERE"
```

---

## 🚀 DEPLOY QILISH

### Backend → Render.com

1. **Render account yarating**: https://render.com
2. **GitHub'da repo push qiling**
3. **Render'da yangi Web Service yarating**:
   - GitHub repo'ni ulanish
   - Build command: `npm install`
   - Start command: `npm start`
   - Environment variables qo'shish:
     ```
     MONGO_URI=...
     JWT_SECRET=...
     REFRESH_SECRET=...
     ```
4. **Deploy qilish**

Backend production URL: `https://your-app.onrender.com`

### Frontend → Netlify

1. **Netlify account yarating**: https://netlify.com
2. **GitHub'da repo push qiling**
3. **Netlify'da yangi site yarating**:
   - GitHub repo'ni ulanish
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Environment variables qo'shish**:
   ```
   VITE_API_BASE_URL=https://your-app.onrender.com
   ```
5. **Deploy qilish**

Frontend production URL: `https://your-site.netlify.app`

---

## ⚠️ MUHIM MASALALAR VA YECHIMI

### Problem 1: CORS Error
**Sabab**: Frontend va Backend boshqa port'larda ishlamoqda
**Yechim**: Backend'da cors middleware:
```javascript
app.use(cors()); // localhost:5173 dan requests qabul qiladi
```

### Problem 2: Token undefined
**Sabab**: localStorage'ga token saqlanmagan
**Yechim**: Login qilgandan so'ng token saqlash:
```javascript
localStorage.setItem('auth_token', data.token);
```

### Problem 3: MongoDB connection error
**Sabab**: MONGO_URI noto'g'ri yoki network access xatosi
**Yechim**: 
- MongoDB Atlas'da IP whitelist qo'shish
- .env'da MONGO_URI'ni tekshirish

### Problem 4: localStorage'dagi data server'ga o'tmadi
**Sabab**: Sync logic ishlamadi
**Yechim**: AuthContext'da syncLocalStorageToServer() qilish kerak

---

## 📊 API ENDPOINTS SUMMARY

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | ❌ | User yaratish |
| POST | /auth/login | ❌ | Login qilish |
| POST | /auth/refresh | ❌ | Token refresh |
| GET | /products | ✅ | Barcha products |
| POST | /products | ✅ | Product yaratish |
| PUT | /products/:id | ✅ | Product tahrirlash |
| DELETE | /products/:id | ✅ | Product o'chirish |
| GET | /orders | ✅ | Barcha orders |
| POST | /orders | ✅ | Order yaratish |

---

## 🔗 USEFUL LINKS

- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- Render.com: https://render.com
- Netlify: https://netlify.com
- JWT: https://jwt.io
- Axios: https://axios-http.com
- Express: https://expressjs.com

---

## ❓ FAQ

**Q: Frontend offline bo'lsa nima bo'ladi?**
A: localStorage'ga data saqlanadi. Login qilgandan so'ng sync qiladi.

**Q: Token 15 minutdan so'ng nima bo'ladi?**
A: refreshToken ishlatib yangi token olinadi (axios interceptor).

**Q: Serverda user data isolation nima?**
A: Har bir product/order `owner` field'ga user ID saqlanadi.

**Q: Deploy qilgandan so'ng CORS error?**
A: Backend .env'da FRONTEND_URL qo'shib cors sozlash kerak.

---

Barcha kod fayllar tayyor! 🎉

