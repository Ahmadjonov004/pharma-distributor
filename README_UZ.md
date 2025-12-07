# 📱 PHARMA DISTRIBUTOR - COMPLETE BACKEND + FRONTEND INTEGRATION GUIDE

**Tillar: Uzbek (O'zbek)**

---

## 🎯 LOYIHANING MAQSADI

Bu loyiha farmatsevtik tarqatish tizimini backend va frontend integratsiyasi bilan tushuntirib beradi:

✅ **Offline Mode**: localStorage'da ishlaydi, network kerak emas  
✅ **Online Mode**: Server'dagi MongoDB'da data saqlanadi  
✅ **Auto Sync**: Login qilganda offline data server'ga yuboriladi  
✅ **JWT Authentication**: Xavfli login va auto-refresh tokens  
✅ **Production Ready**: Deploy qilish uchun tayyor

---

## 📋 TALABLAR (Requirements)

- **Node.js** 18+ ([Download](https://nodejs.org))
- **MongoDB Atlas** (Bepul cloud database) ([Sign up](https://www.mongodb.com/cloud/atlas))
- **Git** (Version control)
- **VS Code** (yoki boshqa text editor)
- **npm** (Node.js bilan o'rnatiladi)

---

## 🚀 TEZKOR O'RNATISH (Quick Start)

### 1️⃣ Backend O'RNATISH (5 DAQIQA)

**Step 1: MongoDB'ni yaratish**
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) ga boring
2. **Sign Up** qiling (Google orqali)
3. **Cluster** yarating (FREE tier bo'lsin)
4. **Database Access** → **Add New Database User**
   - Username: `myuser`
   - Password: `MyPassword123!`
   - ✓ Autogenerate Secure Password
5. **Network Access** → **Add IP Address**
   - **0.0.0.0/0** qo'shish (Everywhere)
6. **Clusters** → **Connect** → **Drivers** → **Copy Connection String**
   ```
   mongodb+srv://myuser:MyPassword123!@cluster0.mongodb.net/pharma-distributor?retryWrites=true&w=majority
   ```

**Step 2: Backend folder'ni setup qilish**
```bash
cd c:/Users/ahmadjonov/Desktop/React/pharma-distributor/server
npm install
```

**Step 3: .env file'ni to'ldirish**
```bash
# server/.env faylini to'g'ri ma'lumotlar bilan to'ldiring:

MONGO_URI=mongodb+srv://myuser:MyPassword123!@cluster0.mongodb.net/pharma-distributor?retryWrites=true&w=majority
JWT_SECRET=my_super_secret_key_12345
REFRESH_SECRET=my_refresh_secret_key_67890
PORT=4000
```

**Step 4: Backend'ni ishga tushirish**
```bash
npm start        # Production
npm run dev      # Development (Hot reload)
```

✓ Terminal'da shuni ko'rsan: `✓ Server running on port 4000`

---

### 2️⃣ Frontend O'RNATISH (5 DAQIQA)

**Step 1: Dependencies o'rnatish**
```bash
cd c:/Users/ahmadjonov/Desktop/React/pharma-distributor/client
npm install axios
```

**Step 2: .env file'ni to'ldirish**
```bash
# client/.env

VITE_API_BASE_URL=http://localhost:4000
```

**Step 3: Frontend'ni ishga tushirish**
```bash
npm run dev
```

✓ Terminal'da shuni ko'rsan:
```
  ➜  Local:   http://localhost:5173/
```

**Step 4: Browser'da test qilish**
1. Yangi tab oching: `http://localhost:5173`
2. **Register** qiling (Username, Password)
3. ✓ Dashboard'ga o'tish

---

## 📁 TUZILMA VA FAYL TARKIBI

```
pharma-distributor/
│
├── 📂 server/                  # Backend (Node.js)
│   ├── 📂 models/              # Database schemas
│   │   ├── User.js             # User model (username, password)
│   │   ├── Product.js          # Product model
│   │   └── Order.js            # Order model
│   │
│   ├── 📂 controllers/         # Business logic
│   │   ├── authController.js   # Login/Register qilish
│   │   ├── productController.js# CRUD operations
│   │   └── orderController.js  # Order operations
│   │
│   ├── 📂 routes/              # API endpoints
│   │   ├── auth.js             # /auth/* routes
│   │   ├── products.js         # /products/* routes
│   │   └── orders.js           # /orders/* routes
│   │
│   ├── 📄 index.js             # Express app (Main server file)
│   ├── 📄 package.json         # Dependencies
│   ├── 📄 .env                 # Environment variables (PRIVATE)
│   └── 📄 .env.example         # Template for .env
│
├── 📂 client/                  # Frontend (React)
│   ├── 📂 src/
│   │   ├── 📂 services/        # API calls
│   │   │   └── api.ts          # Axios instance + API functions
│   │   │
│   │   ├── 📂 context/         # React Context (Global State)
│   │   │   ├── AuthContext.tsx # User login/logout
│   │   │   └── DataContext.tsx # Products/Orders sync
│   │   │
│   │   ├── 📂 pages/           # Components
│   │   │   ├── Auth.tsx        # Login/Register page
│   │   │   ├── Dashboard.tsx   # Main dashboard
│   │   │   ├── Products.tsx    # Products management
│   │   │   └── Orders.tsx      # Orders management
│   │   │
│   │   ├── 📄 App.tsx          # Main React app
│   │   └── 📄 main.tsx         # Entry point
│   │
│   ├── 📄 .env                 # API URL
│   ├── 📄 vite.config.ts       # Vite configuration
│   ├── 📄 package.json         # Dependencies
│   └── 📄 tsconfig.json        # TypeScript config
│
├── 📄 SETUP_GUIDE_UZ.md        # O'zgazni setup guide
├── 📄 PRACTICAL_EXAMPLES.md    # Code examples
└── 📄 README.md                # Bu file
```

---

## 🔐 AUTHENTICATION QANDAY ISHLAYDI?

### 1. Register (Ro'yxatdan o'tish)

```
USER → Foydalanuvchi nomi: "john"
       Parol: "secure123"
       ↓
FRONTEND → POST /auth/register
           {username: "john", password: "secure123"}
           ↓
BACKEND → 1. Username unique ekanini tekshirish
          2. Parolni bcrypt bilan hash qilish
          3. User'ni MongoDB'ga saqlash
          ↓
RESPONSE ← {message: "User registered"}
           ↓
USER → "Shu parol bilan login qil"
```

### 2. Login (Kirish)

```
USER → Foydalanuvchi nomi: "john"
       Parol: "secure123"
       ↓
FRONTEND → POST /auth/login
           {username: "john", password: "secure123"}
           ↓
BACKEND → 1. User'ni topish
          2. Parolni bcrypt bilan tekshirish
          3. JWT token yaratish (15 min validity)
          4. Refresh token yaratish (7 day validity)
          ↓
RESPONSE ← {
             token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
             refreshToken: "eyJ..."
           }
           ↓
FRONTEND → localStorage'ga token saqlash
           ← login(username, password) ← AuthContext
           ↓
RESULT → ✓ Dashboard'ga o'tish
```

### 3. API Call (Har safar request qilganda)

```
FRONTEND → GET /products
           Header: {
             Authorization: "Bearer eyJ..."  ← Token qo'shiladi
           }
           ↓
BACKEND → authMiddleware
          1. Token olish
          2. JWT verify qilish
          3. req.user = {id, username} qilish
          ↓
CONTROLLER → productController.getProducts()
            1. MongoDB'dan user's products'ni olish
            2. {_id, name, price, quantity, owner}
            ↓
RESPONSE ← [{ Product objects }]
```

### 4. Token Expired (Token muddati tugsa)

```
TOKEN EXPIRED (15 min o'tgan)
↓
FRONTEND API CALL (old token)
↓
BACKEND → 403 Forbidden
↓
AXIOS INTERCEPTOR
├─ refreshToken olish
├─ POST /auth/refresh {refreshToken}
├─ BACKEND: Yangi token yaratish
├─ Yangi token saqlash
└─ Orifinal request qayta qilish
↓
✓ Request SUCCESS!
```

---

## 💾 DATA SYNC (Offline ↔ Online)

### Offline Mode (User not logged in)

```
localStorage:
├─ products: [
│   {
│     _id: "1234567890",      // Local timestamp
│     name: "Aspirin",
│     price: 5000,
│     quantity: 100,
│     owner: "local_user"     // Placeholder
│   }
│ ]
├─ orders: [...]
└─ (Network kerak emas - barcha data local)
```

### Online Mode (User logged in)

```
LOGIN
  ↓
1. localStorage'dagi products/orders'ni olish
2. Har birini POST /products va POST /orders bilan server'ga yuborish
3. Server MongoDB'ga saqlash va _id qaytarish
4. localStorage'ni tozalash (clear)
5. GET /products and GET /orders bilan fresh data yuklash
  ↓
RESULT:
├─ localStorage tozalandi
├─ MongoDB'da user's data saqland
└─ Frontend'da fresh data ko'rsatildi
```

### Database Structure

**Users Collection:**
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  username: "john",
  password: "$2a$10$...", // bcrypt hash
  refreshToken: "eyJ..."
}
```

**Products Collection:**
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439012"),
  name: "Aspirin",
  description: "Pain reliever",
  price: 5000,
  quantity: 100,
  owner: ObjectId("507f1f77bcf86cd799439011")  // ← User _id
}
```

**Orders Collection:**
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439013"),
  products: [ObjectId("507f1f77bcf86cd799439012")],
  total: 5000,
  user: ObjectId("507f1f77bcf86cd799439011"),  // ← User _id
  createdAt: 2024-12-06T10:30:00.000Z
}
```

---

## 🧪 API TESTING

### Using Postman or cURL

**1. Register User**
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "MyPassword123!"
  }'
```

**Response:**
```json
{"message": "User registered"}
```

---

**2. Login**
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "MyPassword123!"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0YjMuLiIsInVzZXJuYW1lIjoidGVzdHVzZXIiLCJpYXQiOjE3MDEyNDUzNDB9.bZ...",
  "refreshToken": "eyJ..."
}
```

**Token'ni save qiling - keyingi requests'da ishlatiladi!**

---

**3. Create Product**
```bash
curl -X POST http://localhost:4000/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d '{
    "name": "Paracetamol 500mg",
    "description": "Fever reducer",
    "price": 3500,
    "quantity": 200
  }'
```

**Response:**
```json
{
  "_id": "64b3f1a2b5c3d4e5f6g7h8i9",
  "name": "Paracetamol 500mg",
  "description": "Fever reducer",
  "price": 3500,
  "quantity": 200,
  "owner": "64b3e0a1b5c3d4e5f6g7h8i8"
}
```

---

**4. Get All Products**
```bash
curl http://localhost:4000/products \
  -H "Authorization: Bearer TOKEN_HERE"
```

---

**5. Update Product**
```bash
curl -X PUT http://localhost:4000/products/64b3f1a2b5c3d4e5f6g7h8i9 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d '{
    "quantity": 150
  }'
```

---

**6. Delete Product**
```bash
curl -X DELETE http://localhost:4000/products/64b3f1a2b5c3d4e5f6g7h8i9 \
  -H "Authorization: Bearer TOKEN_HERE"
```

---

## 🌐 DEPLOY QILISH (Production)

### Backend → Render.com

**Step 1: Render account yarating**
- [Render.com](https://render.com) ga boring
- GitHub account bilan login qiling

**Step 2: New Web Service yarating**
- **New +** → **Web Service**
- GitHub repo'ni ulanish
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Step 3: Environment Variables qo'shish**
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=prod_secret_key_12345
REFRESH_SECRET=prod_refresh_secret_67890
```

**Step 4: Deploy**
- ✓ Create Web Service
- Deployment kutish (3-5 minuta)
- Backend URL: `https://pharma-distributor-api.onrender.com`

---

### Frontend → Netlify

**Step 1: Netlify account yarating**
- [Netlify.com](https://netlify.com) ga boring
- GitHub account bilan login qiling

**Step 2: New Site from Git yarating**
- **Add new site** → **Import an existing project**
- GitHub repo'ni ulanish
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`

**Step 3: Environment Variables qo'shish**
```
VITE_API_BASE_URL=https://pharma-distributor-api.onrender.com
```

**Step 4: Deploy**
- ✓ Deploy site
- Frontend URL: `https://pharma-distributor.netlify.app`

---

## ❌ COMMON ERRORS VA YECHIMI

### Error 1: "Cannot find module 'axios'"
```
Yechim:
cd client
npm install axios
```

### Error 2: "MongoDB connection error"
```
Sabab: .env file'da MONGO_URI xato
Yechim:
1. MongoDB Atlas'da connection string olish
2. username:password to'g'ri bo'lishini tekshirish
3. IP whitelist'da 0.0.0.0/0 bo'lishini tekshirish
```

### Error 3: "CORS error"
```
Sabab: Frontend va Backend boshqa origin'larda
Yechim: Backend'da cors() middleware tug'ri qo'shilgan
```

### Error 4: "401 Unauthorized"
```
Sabab: Token yo'q yoki xato
Yechim: Login qilish va token olish
```

### Error 5: "localStorage is not defined"
```
Sabab: Browser environment emas (SSR)
Yechim: typeof window !== 'undefined' tekshirish
```

---

## 📚 KEYINGI STEPS

1. **UI Improvements**
   - Tailwind CSS qo'shish
   - Responsive design

2. **Advanced Features**
   - Inventory management
   - Analytics dashboard
   - Reporting system

3. **Security**
   - HTTPS qo'shish
   - 2FA (Two-factor authentication)
   - Rate limiting

4. **Performance**
   - Pagination qo'shish
   - Caching (Redis)
   - Database indexing

---

## 🎓 LEARNING RESOURCES

- **Express.js**: https://expressjs.com
- **MongoDB**: https://docs.mongodb.com
- **React**: https://react.dev
- **JWT**: https://jwt.io
- **Axios**: https://axios-http.com
- **Render**: https://render.com/docs
- **Netlify**: https://docs.netlify.com

---

## 📞 SUPPORT

Agar muammo bo'lsa:
1. Terminal'dagi error message'ni o'qing
2. Google'da error'ni qidirish
3. GitHub Issues'da question berish

---

**Muvaffaqiyat! 🚀 Backend + Frontend integration tayyor! 🎉**

