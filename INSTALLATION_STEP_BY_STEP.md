# 🎯 STEP-BY-STEP INSTALLATION GUIDE

## ⏱️ VAQT: 15-20 minuta

---

## STEP 1: MONGODB CLOUD DATABASE (3 MINUTA)

### 1.1 Register qiling
1. [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) ga boring
2. **Sign Up** qiling (Gmail orqali)
3. "I want to create a database" ni bosing

### 1.2 Free Cluster yarating
1. **Cloud Provider**: AWS (yoki boshqa)
2. **Region**: Asia (Bahrain yoki qayerdir)
3. **Cluster Name**: `cluster0` (default)
4. **Create Cluster** bosing (2-3 minuta kutish)

### 1.3 Database Credentials yarating
1. **Security** → **Database Access** → **+ Add New Database User**
2. **Username**: `myuser`
3. **Password**: **Autogenerate Secure Password** ni bosing
4. **Copy** password (Save it!)
5. **Add User** bosing

### 1.4 IP Whitelist qo'shish
1. **Network Access** → **+ Add IP Address**
2. **Allow access from anywhere** (0.0.0.0/0)
3. **Confirm** bosing

### 1.5 Connection String olish
1. **Clusters** → **Connect** → **Drivers**
2. **Driver**: Node.js 4.0 or later
3. **Copy** Connection String:
   ```
   mongodb+srv://myuser:<PASSWORD>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. PASSWORD o'rniga saved password'ni qo'ying

---

## STEP 2: BACKEND O'RNATISH (5 MINUTA)

### 2.1 Terminal ochish
```bash
# Terminal 1 ni ochish (Ctrl + `)
cd c:/Users/ahmadjonov/Desktop/React/pharma-distributor/server
```

### 2.2 Dependencies o'rnatish
```bash
npm install
```
*Kutish: 2-3 minuta*

### 2.3 .env file'ni to'ldirish
```bash
# server/.env faylini Text editor bilan oching
# Va quyidagilarni yozing:

MONGO_URI=mongodb+srv://myuser:YourPasswordHere@cluster0.xxxxx.mongodb.net/pharma-distributor?retryWrites=true&w=majority
JWT_SECRET=my_secret_key_12345
REFRESH_SECRET=my_refresh_secret_67890
PORT=4000
```

**⚠️ IMPORTANT:**
- MONGO_URI'dagi `<PASSWORD>` o'rniga saved password'ni qo'ying
- Qo'shtirnoqlar ishlatmang

### 2.4 Backend'ni ishga tushirish
```bash
npm start
```

✅ **SUCCESS** bu ko'rsan:
```
✓ MongoDB connected
✓ Server running on port 4000
```

**🚫 Agar error bo'lsa:**
- .env file'ni tekshiring
- MONGO_URI to'g'riligini tekshiring
- MongoDB Atlas'da credentials to'g'riligini tekshiring

---

## STEP 3: FRONTEND O'RNATISH (5 MINUTA)

### 3.1 Yangi Terminal ochish
```bash
# Terminal 2 (Terminal 1 ochiq qo'yib)
cd c:/Users/ahmadjonov/Desktop/React/pharma-distributor/client
```

### 3.2 Axios qo'shish (MUHIM!)
```bash
npm install axios
```

### 3.3 .env file'ni tekshiring
```bash
# client/.env faylni oching va tekshiring:

VITE_API_BASE_URL=http://localhost:4000
```

### 3.4 Frontend'ni ishga tushirish
```bash
npm run dev
```

✅ **SUCCESS** bu ko'rsan:
```
  ➜  Local:   http://localhost:5173/
```

---

## STEP 4: BROWSER'DA TEST QILISH (2 MINUTA)

### 4.1 Frontend ochish
1. Browser oching
2. `http://localhost:5173` yuboring

### 4.2 Register (Ro'yxat)
1. **Tab**: "Ro'yxat" bosing
2. **Foydalanuvchi nomi**: `testuser`
3. **Parol**: `MyPassword123!`
4. **Parolni qayta**: `MyPassword123!`
5. **Ro'yxatdan o'tish** bosing

✅ **SUCCESS**: Dashboard'ga o'tsangiz, hamma to'g'ri!

### 4.3 Login (Kirish)
1. **Tab**: "Kirish" bosing
2. **Foydalanuvchi nomi**: `testuser`
3. **Parol**: `MyPassword123!`
4. **Kirish** bosing

✅ **SUCCESS**: Dashboard ko'rsatilsa, integration tayyor!

---

## STEP 5: API TESTING (OPTIONAL)

### 5.1 Product yaratish (Terminal'da test)

```bash
# Terminal 3 ochish (yoki PowerShell)

# 1. REGISTER
curl -X POST http://localhost:4000/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"john\",\"password\":\"123456\"}"

# 2. LOGIN va TOKEN olish
# Qaytgan response'dan token'ni copy qiling

# 3. PRODUCT YARATISH (TOKEN o'rniga copy token'ni qo'ying)
curl -X POST http://localhost:4000/products ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer TOKEN_HERE" ^
  -d "{\"name\":\"Aspirin\",\"price\":5000,\"quantity\":100,\"description\":\"Pain reliever\"}"

# 4. BARCHA PRODUCTS'NI OLISH
curl http://localhost:4000/products ^
  -H "Authorization: Bearer TOKEN_HERE"
```

---

## STEP 6: OFFLINE TEST QILISH (OPTIONAL)

### 6.1 Backend o'chirib, offline mode test qilish

```bash
# Terminal 1'dagi server'ni stop qiling (Ctrl + C)
```

### 6.2 Frontend'da
1. **Logout** qiling
2. **Register** yangi user
3. **Product qo'shish** bo'shining
4. **localStorage'da** saqlanganini devtools'dan tekshiring
5. **Backend'ni qayta start** qiling
6. **Login** qiling
7. ✅ Data sync bo'ladi!

---

## ✅ COMPLETION CHECKLIST

```
Setup:
- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] IP whitelist configured
- [ ] Connection string copied

Backend:
- [ ] npm install completed
- [ ] .env file configured correctly
- [ ] npm start running
- [ ] http://localhost:4000/health returns OK

Frontend:
- [ ] npm install axios completed
- [ ] .env file configured correctly
- [ ] npm run dev running
- [ ] http://localhost:5173 loads

Testing:
- [ ] Can register new user
- [ ] Can login with user
- [ ] Dashboard loads after login
- [ ] Can create product in browser
- [ ] Can see product in list
- [ ] Logout works

Bonus:
- [ ] API tested in terminal
- [ ] Offline mode tested
- [ ] localStorage data sync works
```

---

## 🐛 TROUBLESHOOTING

### ❌ "Cannot find module 'axios'"
```bash
cd client
npm install axios
npm run dev  # restart
```

### ❌ "MongoDB connection error"
1. .env file'da MONGO_URI to'g'riligini tekshiring
2. MongoDB Atlas'da IP whitelist 0.0.0.0/0 bo'lishini tekshiring
3. Username:password to'g'riligini tekshiring

### ❌ "Port 4000 already in use"
```bash
# Windows PowerShell
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :4000
kill -9 <PID>
```

### ❌ "CORS error"
Backend va Frontend boshqa port'larda bo'lsa, bu normal.
Backend'da `cors()` middleware tug'ri qo'shilgan.

### ❌ "Blank page in browser"
1. Browser console'ni oching (F12)
2. Error ko'ring
3. Terminal'da backend logs'ni tekshiring

### ❌ "Cannot POST /auth/login"
1. Backend running ekanini tekshiring
2. VITE_API_BASE_URL to'g'riligini tekshiring

---

## 🎯 KEYINGI QADAM

### 1. Kod tushunish
- `README_UZ.md` o'qing (Architecture)
- `PRACTICAL_EXAMPLES.md` o'qing (Code explanation)

### 2. Boyitish
- `Products.tsx` va `Orders.tsx` pages'ni yarating
- Tailwind CSS qo'shish

### 3. Deploy qilish
- `README_UZ.md` → Deployment section
- Backend'ni Render.com'ga push qiling
- Frontend'ni Netlify'ga push qiling

### 4. Advanced
- Validation qo'shish (Joi)
- Error handling improve qilish
- Tests yozish

---

## 📞 NEED HELP?

1. Terminal error'ni Google'da qidiring
2. `QUICK_REFERENCE.md` oching
3. `README_UZ.md` oching
4. Stack Overflow'da question bering

---

## ✨ CONGRATULATIONS! 🎉

Agar hammasi ishlayotgan bo'lsa, siz:

✅ Full-stack developer bo'ldingiz  
✅ Frontend + Backend integration o'rgandingiz  
✅ Database + Authentication o'rgandingiz  
✅ Production deployment o'rgandingiz  

**Muvaffaqiyat! 🚀**

