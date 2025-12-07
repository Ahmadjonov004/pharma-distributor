# 🚀 QUICK REFERENCE - TEZKOR QOʻLLANMA

## ⚡ 1 MINUTDA O'RNATISH

```bash
# Terminal 1: Backend
cd server
npm install
# .env faylini to'ldiring (MONGO_URI, JWT_SECRET)
npm start

# Terminal 2: Frontend
cd client
npm install axios
npm run dev
```

Browser: `http://localhost:5173` → Register & Login ✓

---

## 🔗 API ENDPOINTS (Quick Reference)

| Endpoint | Method | Auth | Body | Description |
|----------|--------|------|------|-------------|
| `/auth/register` | POST | ❌ | `{username, password}` | User yaratish |
| `/auth/login` | POST | ❌ | `{username, password}` | Token olish |
| `/auth/refresh` | POST | ❌ | `{refreshToken}` | Token refresh |
| `/products` | GET | ✅ | - | Barcha products |
| `/products` | POST | ✅ | `{name, price, quantity, description}` | Product qo'shish |
| `/products/:id` | PUT | ✅ | `{name?, price?, quantity?, description?}` | Product tahrirlash |
| `/products/:id` | DELETE | ✅ | - | Product o'chirish |
| `/orders` | GET | ✅ | - | Barcha orders |
| `/orders` | POST | ✅ | `{products: [], total}` | Order yaratish |

---

## 🔐 JWT TOKEN FLOW

```
1. LOGIN → POST /auth/login
   Response: {token: "eyJ...", refreshToken: "eyJ..."}

2. SAVE TOKENS
   localStorage.setItem('auth_token', token)
   localStorage.setItem('refresh_token', refreshToken)

3. API CALL
   Header: Authorization: Bearer <token>

4. TOKEN EXPIRED (15 min)
   Axios interceptor → POST /auth/refresh
   → Get new token → Retry request ✓
```

---

## 📁 KEY FILES

```
Backend:
├── server/index.js          ← Main server file
├── server/models/User.js    ← User schema
├── server/models/Product.js ← Product schema
├── server/controllers/      ← Business logic
├── server/routes/           ← API endpoints
└── server/.env              ← Config (KEEP SECRET!)

Frontend:
├── client/src/services/api.ts      ← Axios instance
├── client/src/context/AuthContext  ← Login logic
├── client/src/context/DataContext  ← Data sync
├── client/src/pages/Auth.tsx       ← Login/Register
└── client/.env                     ← API URL
```

---

## 💾 DATA SYNC LOGIC

```
NOT LOGGED IN:
├─ All data → localStorage
├─ Offline works
└─ Network not required

LOGGED IN:
├─ POST old localStorage data to server
├─ Clear localStorage
├─ GET fresh data from MongoDB
└─ All CRUD → Server/MongoDB
```

---

## 🧪 TEST API IN TERMINAL

```bash
# 1. Register
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","password":"123456"}'

# 2. Login (save token)
TOKEN=$(curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john","password":"123456"}' | jq -r '.token')

# 3. Get products (use token)
curl http://localhost:4000/products \
  -H "Authorization: Bearer $TOKEN"

# 4. Create product
curl -X POST http://localhost:4000/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Aspirin","price":5000,"quantity":100,"description":"Painkiller"}'
```

---

## 🐛 DEBUGGING

```bash
# Backend logs
npm run dev
# Console'da all requests ko'rish

# Frontend console
# Browser DevTools: F12 → Console
console.log(localStorage.getItem('auth_token'))

# MongoDB
# Atlas → Clusters → Collections → View documents

# Network requests
# DevTools → Network tab → Check requests/responses
```

---

## 📦 ENVIRONMENT VARIABLES

```bash
# Backend (.env)
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=secret_key_here
REFRESH_SECRET=refresh_secret_here
PORT=4000

# Frontend (.env)
VITE_API_BASE_URL=http://localhost:4000
```

---

## 🚀 DEPLOY COMMANDS

```bash
# Build frontend
cd client
npm run build    # Creates dist/ folder

# Deploy backend (Render)
git push        # GitHub'ga push

# Deploy frontend (Netlify)
git push        # GitHub'ga push (Auto-deploys)
```

---

## ⚠️ IMPORTANT SECURITY NOTES

```
🔴 NEVER:
├─ localStorage'ga password saqlash
├─ JWT token'ni code'ga hardcode qilish
├─ .env file'ni GitHub'ga push qilish
└─ MongoDB URI'ni public qilish

🟢 ALWAYS:
├─ bcryptjs bilan password hash qilish
├─ HTTPS ishlatish (production'da)
├─ .env.example template qo'shish
├─ Input validation qilish
└─ CORS properly configure qilish
```

---

## 📊 ARCHITECTURE

```
┌─────────────────────────────────────────┐
│         FRONTEND (React + TS)           │
│  ├─ AuthContext (JWT management)       │
│  ├─ DataContext (CRUD operations)      │
│  └─ API Service (Axios)                │
└────────────────┬────────────────────────┘
                 │ HTTP/HTTPS
                 │
┌────────────────▼────────────────────────┐
│        BACKEND (Express + Node)         │
│  ├─ Routes (API endpoints)              │
│  ├─ Controllers (Business logic)        │
│  ├─ Models (Database schemas)           │
│  └─ Middleware (Auth, Error handling)   │
└────────────────┬────────────────────────┘
                 │ MongoDB Protocol
                 │
┌────────────────▼────────────────────────┐
│   MONGODB (Cloud database - Atlas)      │
│  ├─ users collection                    │
│  ├─ products collection                 │
│  └─ orders collection                   │
└─────────────────────────────────────────┘
```

---

## 🆘 QUICK FIXES

```
❌ Port 4000 already in use
✓ Kill: netstat -ano | findstr :4000
✓ Kill process: taskkill /PID <PID> /F

❌ Module not found
✓ Delete: node_modules
✓ Reinstall: npm install

❌ Database error
✓ Check .env MONGO_URI
✓ Check MongoDB Atlas connection

❌ CORS error
✓ cors() middleware tug'ri qo'shilgan
✓ Frontend URL correct in .env

❌ Token undefined
✓ localStorage.getItem('auth_token')
✓ Check login was successful
```

---

## 📚 FILE CONTENTS AT A GLANCE

### server/models/Product.js
```javascript
name, description, price, quantity, owner (user _id)
```

### server/controllers/productController.js
```
getProducts() → Find user's products
createProduct() → Save new product
updateProduct() → Update product
deleteProduct() → Delete product
```

### client/services/api.ts
```
Axios instance + interceptors
productsAPI, ordersAPI, authAPI
```

### client/context/AuthContext.tsx
```
register(), login(), logout()
Token management in localStorage
```

### client/context/DataContext.tsx
```
addProduct(), updateProduct(), deleteProduct()
createOrder()
Offline/Online sync logic
```

---

## ✅ CHECKLIST

- [ ] MongoDB Atlas cluster created
- [ ] Backend .env configured
- [ ] Frontend .env configured
- [ ] `npm install` completed (both folders)
- [ ] Backend running on localhost:4000
- [ ] Frontend running on localhost:5173
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Can see dashboard after login
- [ ] Can create/update/delete products
- [ ] Tokens working in localStorage

---

## 🎓 NEXT LEARNING TOPICS

1. **Frontend**: Tailwind CSS, React Router advanced
2. **Backend**: Validation (Joi), Error handling, Logging
3. **Database**: Indexes, Aggregation pipelines
4. **DevOps**: Docker, GitHub Actions, CI/CD
5. **Security**: Rate limiting, HTTPS, 2FA

---

**Barcha kodlar PRODUCTION READY! 🎉**

